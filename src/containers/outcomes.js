/**
 * Defines Outcome objects, which encapsulates data from various parts of the pipeline
 */
import { Cloneable } from './cloneable.js'

/**
 * Base class that stores all information about the outcome of a single turn
 * @param {Validity} validity - Defines if the action was allowed
 * @param {?Action} action - Defines the action taken. null if validity.overall == false
 * @param {?number[]} utilities - Defines the utility for each player on this turn. null if validity.overall == false
 * @param {?State} state - Defines the new state after this turn. null if validity.overall == false
 * @param {*} [stateDelta] - Describes the difference between the previous state, to support animations
 */
export class Outcome extends Cloneable {
    constructor(validity, action, utilities, state, stateDelta) {
        this.validity = validity;
        this.action = action;
        this.utilities = utilities;
        this.state = state;
        this.stateDelta = stateDelta;
    }
}

/**
 * Outcome object returned by Engine instances. Fields store objective results of the outcome
 * See documentation for the Outcome object for field definitions 
 */
export class EngineOutcome extends Outcome{}

/**
 * Outcome object provided to Player instances. Fields may stored modified versions of the outcome, customized to the player
 * The following parameters may differ from the base Outcome object:
 * @param {PlayerOutcomeField} utilities
 */
export class PlayerOutcome extends Outcome{} // What players are provided. May be customized for each player

/**
 * Type that is used in PlayerOutcome instances to delinate outcome fields for the player, and his opponents, whenever the outcome is an array
 * @param {*} personal - The outcome field for the player being provided the outcome
 * @param {Object[]} opponents - Outcome fields for the player's opponents
 */
export class PlayerOutcomeField extends Cloneable {
    constructor(personal, opponents) {
        this.personal = personal;
        this.opponents = opponents;
    }
}

 /**
  * Represents the output of the Engine's processAction function
  * @param {number[]} utilities - Defines the utility for each player on this turn
  * @param {State} newState - Defines the new state after this turn 
  * @param {*} [stateDelta] - Describes the difference between the previous state, to support animations
  */
export class ProcessedActionOutcome {
    constructor(utilities, newState, stateDelta) {
        this.utilities = utilities;
        this.newState = newState;
        this.stateDelta = stateDelta;
    }
};