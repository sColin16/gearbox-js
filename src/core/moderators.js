import { Player, RealTimePlayer } from './players.js';
import { Engine } from './engines.js';
import { State } from '../containers/states.js';
import { Action, SimAction, SeqAction, PlayerIDField, RealTimeAction } from '../containers/actions.js';
import { OnewayCollection, TwowayCollection, Pipe } from 'http://cdn.jsdelivr.net/gh/sColin16/pneumatic-js@376895/index.js';
import { PlayerOutcome, PlayerOutcomeField } from "../containers/outcomes.js";
import { SimValidity } from "../containers/validities.js";
import { Queue } from "./helpers.js";

/**
 * Base class for moderators that does not include any pipelines to customize outcomes for each player
 * Moderators are responsible for coordinating communication between players and the engine
 * @abstract
 * @param {(Player[]|Pipe[])} players - The players, or pipelines to players, who are playing the game
 * @param {Engine} engine - Handles the game logic
 * @param {State} state - Initial game state
 */
export class BareModerator {
    constructor(players, engine, state) {
        this.players = players;
        this.engine = engine;
        this.state = state;

        // Prevent anyone from amking changes to this state
        Object.freeze(this.state);
    }

    /**
     * Simple game loop sufficient from Sim/Seq Moderators. Subclasses can override this as they see fit
     */
    async runGame() {
        this.startGame();

        while (!this.state.terminalState) {
            await this.runTurn();
        }

        this.endGame();
    }

    /**
     * Performs actions necessary to start the game, including alerting players of the initial state
     */
    startGame() {
        this.players.forEach(player => player.handleGameStart(this, this.state));
    }

    /**
     * Performs actions to end the game, primarily alerting players that the game has ended
     */
    endGame() {
        this.players.forEach(player => player.handleGameEnd());
    }

    /**
     * Helper function that processes an action and reports the outcome to players
     * @param {Action} action - An action taken by a player to process and report
     */
    processAndReport(action) {
        let engineOutcome = this.engine.determineOutcome(this.state, action);

        if (typeof engineOutcome.state !== 'undefined') {
            Object.freeze(engineOutcome.state);
            this.state = engineOutcome.state;
        }

        this.players.forEach((player) => {
            player.handleOutcome(this, engineOutcome);
        });
    }

    /**
     * Optional subclass-defined function for subclasses that use the runGame implementation provided.
     * Should handle a single turn of the game
     * @abstract
     */
    async runTurn() {
        throw new Error("Abstract method. Subclasses must override.");
    }
}

class PlayerModeratorPipe extends Pipe {
    static FIRST_INTERFACE = BareModerator;
    static SECOND_INTERFACE = Player;
}

PlayerModeratorPipe.addInterfaceMethod(Player, 'handleActionRequest', TwowayCollection);
PlayerModeratorPipe.addInterfaceMethod(Player, 'handleGameStart', OnewayCollection);
PlayerModeratorPipe.addInterfaceMethod(Player, 'handleOutcome', OnewayCollection);
PlayerModeratorPipe.addInterfaceMethod(Player, 'handleGameEnd', OnewayCollection); // Nothing currently passed here...

// TODO: should these be in a a separate pipe for RealTimeModerators?
PlayerModeratorPipe.addInterfaceMethod(Player, 'bindModerator', OnewayCollection);
PlayerModeratorPipe.addInterfaceMethod(BareModerator, 'handleAction', OnewayCollection);

export class TransformCollection {
    /**
     * Uses the transformation functions defined in thie collection to build pipes for each player
     * @param {(Player[]|Pipe[])} players - Array of players or pipes to reach the players who are playing
     * @returns {Pipe[]} Array of pipes that can be passed as the players list to the moderator
     */
    static buildPipes(players) {
        let pipes = [];

        // Create all basic pipes, allowing for basic transformations to outcomes
        for (let i = 0; i < players.length; i++) {
            let newPipe = new PlayerModeratorPipe();

            // Return an array with a single element, according to the Pneumatic API specs
            newPipe.transformRequestHandleActionRequest = (state => [this.transformState(state.clone(), i)]);
            newPipe.transformResponseHandleActionRequest = (actionRepr => this.transformReceiveActionRepr(actionRepr, i));

            // Clone the state so that objects in the pipe can modify it freely
            newPipe.transformHandleGameStart = (state => [this.transformState(state.clone(), i)]);
            newPipe.transformHandleOutcome = (outcome => [this.transformOutcome(outcome.clone(), i)]);
            newPipe.filterHandleOutcome = (outcome => this.hideOutcome(outcome.clone(), i));

            newPipe.appendToPipeline(Player, players[i]);

            pipes.push(newPipe);
        }

        return pipes
    }

    /**
     * Optional implementation that uses all the transformation functions to transform the complete outcome
     * @param {EngineOutcome} engineOutcome - The EngineOutcome object to transform
     * @param {number} playerID - The playerID that the transformed outcome will be delivered to
     * @returns {PlayerOutcome}
     */
    static transformOutcome(engineOutcome, playerID) {
        // Handle a copy of all the fields, so transform functions don't have to do the copying
        let outcomeCopy = engineOutcome.clone();

        // Transform all aspects of the outcome
        let validity = this.transformValidity(outcomeCopy.validity, playerID);

        // Only transform these elements in the action was valid
        let action, utilities, state, stateDelta;
        if (validity.overall) {
            action = this.transformSendAction(outcomeCopy.action, playerID);
            utilities = this.transformUtilities(outcomeCopy.utilities, playerID);
            state = this.transformState(outcomeCopy.state, playerID);
            stateDelta = this.transformStateDelta(outcomeCopy.stateDelta, playerID);
        }

        // Return the transformed outcome
        return new PlayerOutcome(validity, action, utilities, state, stateDelta);
    }

    /**
     * Controls whether or not an engine outcome is reported to each player
     * @param {EngineOutcome} engineOutcome - The engine outcome to potentially not report to the player
     * @param {number} playerID - The playerID that the outcome may or may not be delivered to
     * @returns {boolean} - Whether or not the outcome is to be hidden from the player
     */
    static hideOutcome(engineOutcome, playerID) {
        return false;
    }

    /**
     * Transforms the valdity objects for each outcomes
     * @param {Validity} validity - The validity object to transform
     * @param {number} playerID - The playerID that the transformed validity object is to be delivered to
     * @returns {Validity} - The transformed validity object
     */
    static transformValidity(validity, playerID) {
        return validity;
    }

    /**
     * Tranforms action objects for each outcome sent to players
     * @param {Action} action - The action object to transform
     * @param {number} playerID - The playerID that the transformed action is to delivered to
     * @returns {Action} - The transformed action object
     */
    static transformSendAction(action, playerID) {
        return action;
    }

    /**
     * Transform action representations recieved from players
     * @param {*} actionRepr - Action representation returned by the player to be transformed
     * @param {number} playerID - The playerID that the action representation is from
     * @returns {*} The transformed action representation
     */
    static transformReceiveActionRepr(actionRepr, playerID) {
        return actionRepr;
    }

    /**
     * Transforms a list of utilities for each outcome 
     * @param {number[]} utilities - The array of utilies to transform
     * @param {number} playerID - The playerID that the transformed utility array is to delivered to 
     * @returns {number[]} - The transformed utility array
     */
    static transformUtilities(utilities, playerID) {
        return utilities;
    }

    /**
     * Transforms the state reported to each player, when the game starts, and for each outcome
     * @param {State} state - The state to transform
     * @param {number} playerID - The playerID that the transformed state is to be delivered to
     * @returns {State} - The transformed state
     */
    static transformState(state, playerID) {
        return state;
    }

    /**
     * Transformed the state delta reported in every outcome
     * @param {*} stateDelta - The state delta to transform
     * @param {number|PlayerIDField)} playerID - The playerID that the transformed state delta is to be delivered to
     * @returns {*} The transformed state delta
     */
    static transformStateDelta(stateDelta, playerID) {
        return stateDelta;
    }
}

/**
 * Defines transformations that are applied to all moderators
 */
class DefaultTransformCollection extends TransformCollection {
    /**
     * Transforms the utility array into a playerID field for each player
     * @param {number[]} utilities - The array of utilies to transform
     * @param {number} playerID - The playerID that the transformed utility array is to delivered to 
     * @returns {PlayerOutcomeField} - The transformed utility array
     */
    static transformUtilities(utilities, playerID) {
        return PlayerOutcomeField.fromArray(utilities, playerID);
    }
}

/**
 * Base class for moderators that does incorporate basic pipes to customize outcomes for each player.
 * Most subclasses should extend this class, not BareModerator
 * @abstract
 * @param {(Player[]|Pipe[])} players - The players, or pipelines to players, who are playing the game
 * @param {Engine} engine - Handles the game logic
 * @param {State} state - Initial game state
 */
export class Moderator extends BareModerator {
    constructor(players, engine, state) {
        let pipes = DefaultTransformCollection.buildPipes(players);

        super(pipes, engine, state);

        // Attach the moderator to the end of the pipeline AFTER calling super
        // b/c you can't reference this until after calling super
        for (let i = 0; i < players.length; i++) {
            pipes[i].appendToPipeline(BareModerator, this);
        }
    }
}

/**
 * Superclass for sequential and real-time transformationms, where individual players take actions
 * playerIDs have to be updated for actions and states
 */
export class IndividualActionTransformCollection extends TransformCollection {
    /**
     * Converts the numeric playerID of a SeqAction to a PlayerIDField
     * @param {(SeqAction|RealTimeAction)} action - The action to transform
     * @param {number} playerID - The player for whom to transform the action for
     * @returns {(SeqAction|RealTimeAction)} - The transformed action for the player
     */
    static transformSendAction(action, playerID) {
        action.playerID = this.adjustPlayerID(playerID, action.playerID);

        return action;
    }

    /**
     * Converts the numeric playerID "turn" to a PlayerIDField
     * @param {(SeqState|RealTimeState)} state - The state to transform
     * @param {*} playerID - The player for whom to transform the state for
     * @returns {(SeqState|RealTimeState)} - The transformed state for the player
     */
    static transformState(state, playerID) {
        state.turn = this.adjustPlayerID(playerID, state.turn);

        return state;
    }

        /**
     * Transforms a given playerID to a PlayerIDField, so outcome field arrays and playerIDs are consistent
     * @param {number} forPlayerID - The playerID of the player who is to receive the PlayerIDField returned
     * @param {numer} actionPlayerID - The playerID of the player of interest (took an action, has a turn, etc)
     * @returns {PlayerIDField} - The actionPlayerID converted to this field, to be provided to the player with id forPlayerID 
     */
    static adjustPlayerID(forPlayerID, actionPlayerID) {
        if (forPlayerID === actionPlayerID) {
            return new PlayerIDField(true, undefined);
        } else if (forPlayerID < actionPlayerID) {
            return new PlayerIDField(false, actionPlayerID - 1);
        } else {
            return new PlayerIDField(false, actionPlayerID);
        }
    }
}

/**
 * Defines the transformations that SeqModerators perform to support sequential game play
 */
export class SeqTransformCollection extends IndividualActionTransformCollection {}

/**
 * Special moderator for sequential games, where each player takes a turn in order
 * @param {(Player[]|Pipe[])} players - The players, or pipelines to players, who are playing the game
 * @param {Engine} engine - Handles the game logic
 * @param {SeqState} state - Initial game state
 */
export class SeqModerator extends Moderator {
    constructor(players, engine, state) {
        let pipes = SeqTransformCollection.buildPipes(players);

        super(pipes, engine, state);
    }

    /**
     * Runs a single turn of a sequential game.
     * Gets and processes and action from the player whose turn it is
     */
    async runTurn() {
        // Get the action from the player
        let actionRepr = await this.players[this.state.turn].handleActionRequest(this, this.state);

        // Package it with the turn
        let action = new SeqAction(actionRepr, this.state.turn);

        // Run the action through the engine, reporting outcomes, etc.
        this.processAndReport(action);
    }
}

/**
 * Defines the transformations for SimModerators to support simultaneous game play
 */
export class SimTransformCollection extends TransformCollection {
    /**
     * Transforms the individual validity array into a PlayerOutcomeField
     * @param {SimValidity} validity - The validity to transform
     * @param {number} playerID - The ID of the player to whom the validity will be delivered
     * @returns {SimValidity} - The transformed validity object
     */
    static transformValidity(validity, playerID) {
        validity.individual = PlayerOutcomeField.fromArray(validity.individual, playerID);

        return validity;
    }
    
    /**
     * Transforms the action representation array into a PlayerOutcomeField
     * @param {SimAction} action - The action to transform
     * @param {number} playerID - The ID of the player to whom the action will be delivered
     * @returns {SimAction} - The transformed action object
     */
    static transformSendAction(action, playerID) {
        action.repr = PlayerOutcomeField.fromArray(action.repr, playerID);

        return action;
    }
}

/**
 * Moderator superclass that supports simultaneous games, like Rock, Paper, Scissors
 * @param {(Player[]|Pipe[])} players - The players, or pipelines to players, who are playing the game
 * @param {Engine} engine - Handles the game logic
 * @param {SimState} state - Initial game state
 */
export class SimModerator extends Moderator {
    constructor(players, engine, state) {
        let pipes = SimTransformCollection.buildPipes(players);

        super(pipes, engine, state);
    }

    /**
     * Runs a single round of the game
     * Gets an action from each player, and then processes the outcome
     */
    async runTurn() {
        // Get the action representations from each player
        let actionRepr = await Promise.all(
            this.players.map(player => player.handleActionRequest(this, this.state)));
        
        // Pass the actions to the engine
        this.processAndReport(new SimAction(actionRepr));
    }
}

/**
 * Defines the transformations for RealTimeModerators
 */
export class RealTimeTransformCollection extends IndividualActionTransformCollection {}

/**
 * Moderator class that can be subclassed to support real-time games (time advances state instead of player actions)
 * @param {(Player[]|Pipe[])} players - The players, or pipelines to players, who are playing the game
 * @param {Engine} engine - Handles the game logic
 * @param {RealTimeState} state - Initial game state
 */
export class RealTimeModerator extends Moderator {
    constructor(players, engine, state) {
        let pipes = RealTimeTransformCollection.buildPipes(players);

        super(pipes, engine, state);

        this.actionQueue = new Queue();

        this.engineStep.timeout = null;
        this.processActionQueue.timeout = null;
    }

    /**
     * Overrides the default startGame function, calling the super method, but also binding moderators for the player
     */
    startGame() {
        super.startGame();

        this.players.forEach(player => player.bindModerator(this));
    }

    /** 
     * Overrides the BareModerator's runGame implementation to handle the asynchronous nature of real-time games
     */
    async runGame() {
        // Start the game, alerting all players of the start, and binding the moderator to them
        this.startGame();

        // Schedule the first engine step
        this.conditionalReschedule(this.engineStep, this.state.engineStepInterval);

        // Start processing any initial actions
        this.processActionQueue();
    }

    /**
     * Generates and processes an engine step. Called on an interval determined by the state
     */
    engineStep() {
        // Create the engine step action
        let engineAction = new RealTimeAction('engineStep', undefined, true);

        // Process the action
        this.processAndReport(engineAction);

        // Reschedule another step based on the state returned
        this.conditionalReschedule(this.engineStep, this.state.engineStepInterval);
    }

    /**
     * Processes all the actions players submitted to the queue
     * Since processing an action involves reporting the action, which is a time that players may submit actions,
     * adding to the queue, and processing the queue are separated into two distinct processes
     */
    processActionQueue() {
        // Limit numnber of actions processed to number at the start. Otherwise, players could
        // keep submitting moves, blocking the event queue
        let actionsProcessed = 0;
        let actionsToProcess = this.actionQueue.size();

        // Keep processing until we've done them all (to the limit), or the game ended
        while(!this.state.terminalState && actionsProcessed < actionsToProcess) {
            let nextAction = this.actionQueue.dequeue();

            this.processAndReport(nextAction);

            actionsProcessed++;
        }

        // Schedule another batch, or report gameover
        this.conditionalReschedule(this.processActionQueue, 0);
    }

    /**
     * Reschedules the next engine step or action prrocessing step if the stateis not terminal
     * If a terminal state was reached, cancels all of the timeouts, and ends the game
     */
    conditionalReschedule(func, interval) {
        // Only reschedule if a terminal state has not been reached
        if (!this.state.terminalState) {
            func.timeout = setTimeout(func.bind(this), interval);
        } 
        
        // Otherwise, clear both timeouts, so no more engine steps of action processesing occur
        else {
            clearTimeout(this.engineStep.timeout);
            clearTimeout(this.processActionQueue.timeout);

            this.endGame();
        }
    }

    /**
     * Real-time interface for a player to take an action.
     * @param {Player} player - Reference to the player taking the action
     * @param {Action} action - The action taken by the player
     */
    handleAction(player, action) {
        let playerAction = new RealTimeAction(action, this.players.indexOf(player), false);

        this.actionQueue.enqueue(playerAction);
    }
};