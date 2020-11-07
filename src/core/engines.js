/**
 * Base classes for engines, objects responsible for processing actions to determine resulting states
 * All Engines should be stateless, and determine the outcome purely from the provided state and action
 */

import { Action, RealTimeAction } from '../containers/actions.js'
import { EngineOutcome, ProcessedActionOutcome } from '../containers/outcomes.js'
import { State } from '../containers/states.js'
import { Validity, RealTimeValidity, SimValidity } from "../containers/validities.js";

/**
 * Low-level base class that defines all required Engine functionality, but does not provide helper functions
 * @abstract
 */
export class BareEngine {
    /**
     * Optional implementation for the core game-logic-processing of the engine 
     * @param {State} state The state from which to determine the outcome
     * @param {Acition} action The action taken in the given state
     * @returns {EngineOutcome} The outcome from the action being taken
     */
    determineOutcome(state, action) {
        //Test if the action was valid
        const validity = this.validateAction(state, action);

        let reportedAction, utilities, newState, stateDelta;

        // Only handle the action if it is valid
        if (validity.overall) {
            // Since the action was valid, we can report it
            reportedAction = action;

            // TODO: consider not deconstructing this object and create a static EngineOutcome method to parse it (called at the return statement)
            // Process the action (parantheses here are necessary!)
            ({utilities, newState, stateDelta} = this.processAction(state, action));
        }

        // Return the outcome
        return new EngineOutcome(validity, reportedAction, utilities, newState, stateDelta);
    }

    /**
     * Subclass-defined method that determines if an action taken was valid or not
     * @abstract
     * @param {State} state The state from which to determine if the action was valid
     * @param {Action} action The action whose validity should be determined
     * @returns {Validity} Describes the validity of the action in the given state
     */
    validateAction(state, action) {
        throw new Error("Abstract method. Must be implemend by subclass");
    }

    /**
     * Subclass-defined method that determine the new state, among other things, given a valid action
     * @abstract
     * @param {State} state The state or context in which to process the action
     * @param {Action} action The action (guaranteed valid) taken
     * @returns {ProcessedActionOutcome} The result of the action being taken
     */
    processAction(state, action) {
        throw new Error("Abstract method. Must be implemented by subclass");
    }
}

/**
 * Base class for Engines that also includes useful helper functions.
 * Most engine subclasses should subclass from this one.
 * @abstract
 * @todo Determine and add convenience functions (not done yet to let the API become stable)
 */
export class Engine extends BareEngine {
    /**
     * Convenience function that generates a ProcessedActionOutcome, while utilizing Engine helper functions
     * @param {number[]} utilities The utility for each player on a given turn
     * @param {State} newState The new state resulting from an action being taken
     * @param {*} stateDelta Describes the difference between the previous and new states
     */
    makeProcessedActionOutcome(utilities, newState, stateDelta) {
        return new ProcessedActionOutcome(utilities, newState, stateDelta);
    }
}

/**
 * Engine subclass to be used for sequential games. Implements helper functions to streamline subclass development
 * @abstract
 */
class SeqEngine extends Engine {
    /**
     * Increments the 'turn' property for the provided state, wrapping back around to 0 as necessary
     * @param {State} state The original state whose turn parameter is to be incremented
     */
    incrementTurn(state) {
        state.turn = (state.turn + 1) % state.playerCount;
    }
}

/**
 * Users pass this callback to SimEngine's validate Action helper function
 * @callback SingleActionValidatorCallback
 * @param {State} state - The state from which to determine if the action component is valid
 * @param {*} actionRepr - An indivudal component of a SimAction instance
 * @param {number} playerID - The index of the player who took the given actionRepr. Should be an integer
 * @returns {boolean} - Whether the provided actionRepr was valid for the player, given the state
 */

/**
 * Engine subclass to be used for simultaneous games. Implements helper function to streamline subclass development
 * @abstract
 */
class SimEngine extends Engine {
    /**
     * Function that subclasses can call in their validateAction implementation. Checks that each individual actionRepr is valid for SimAction.
     * This is useful because the validity of an action in a simultaneous game is often independent of the other actions.
     * @param {State} state - The state from which to determine if the actions were valid
     * @param {SimAction} action - The complete simultaneous action whose components will be anaylzed for validity
     * @param {SingleActionValidatorCallback} singleActionValidatorCallback - Callback to determine if an individual component of the action was valid
     * @returns {SimValidity} - Describes the validity of the action in the provided state
     */
    validateActionHelper(state, action, singleActionValidatorCallback) {
        let validity = new SimValidity(true, new Array(action.actionRepr.length).fill(true));

        action.repr.forEach((singleActionRepr, i) => {
            if (!singleActionValidatorCallback(state, singleActionRepr, i)) {
                validity.overall = false;
                validity.individual[i] = false;
            }
        });

        return validity;
    }
}

/**
 * Engine subclass to be used for real-time games. Implements helper functions to streamline subclass development
 * @abstract
 */
class RealTimeEngine extends Engine {
    /**
     * Optional implementation for subclasses to use to separate processing engine steps and player actions
     * @param {State} state - The state from which to process the action
     * @param {RealTimeAction} action - The action to process, which may be an engine step
     * @returns {EngineOutcome} - The complete outcome of the action taken in the given state
     */
    processAction(state, action) {
        if (action.engineStep) {
            return this.processEngineStep(state, action);
        } else {
            return this.processPlayerAction(state, action);
        }
    }

    /**
     * Optional implementations for subclasses to use to separate validating engine steps (always valid) and player actions
     * @param {State} state - The state from which to determine if the given action was valid
     * @param {RealTimeAction} action - The action (which may be an engine step) whose validity will be determined
     * @returns {Validity} - Describes the validity of the action taken in the given state
     */
    validateAction(state, action) {
        if (action.engineStep) {
            return new RealTimeValidity(true);
        } else {
            return this.validatePlayerAction(state, action);
        }
    }

    /**
     * Defines the outcome when an action is an engine step, to advance the game forward one frame.
     * Optional subclass-defined function. Must be defined if a subclass uses the processAction implementation.
     * @abstract
     * @param {State} state - The state from which to advance the game
     * @param {RealTimeAction} action - The action (guaranteed to be an engine step) defining how to advance the game
     * @returns {ProcessedActionOutcome} - The result of the engine step being taken in the given state
     */
    processEngineStep(state, action) {
        throw new Error("Abstract method. Must be defined by subclasses");
    }

    // Function that must be defined by subclasses, whenever a player takes an action
    /**
     * Defines the outcome when an action is a player action.
     * Optional subclass-defined function. Must be defined if a subclass uses the processAction implementation.
     * @abstract
     * @param {State} state - The state from which to process the action from
     * @param {RealTimeAction} action - The action (guaranteed to be a player action, not an engine step) to process
     * @returns {ProcessedActionOutcome} - The result of the player action taken on the given state
     */
    processPlayerAction(state, action) {
        throw new Error("Abstract method. Must be defined by subclasses");
    }

    /**
     * Defines the validity of an action that is guaranteed to be a player action (not an engine step)
     * Optional subclass-defined function. Must be defined if a subclass uses the processAction implementation. 
     * @abstract
     * @param {State} state - 
     * @param {RealTimeAction} action - 
     * @returns {Validity} - 
     */
    validatePlayerAction(state, action) {
        throw new Error("Abstract method. Must be defined by subclasses");
    }
}