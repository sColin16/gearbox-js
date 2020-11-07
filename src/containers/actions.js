/**
 * A set of classes that represent an atomic action that an engine can process
 */

import { Cloneable } from './cloneable.js';

/** 
 * Base action class that stores the representation of an action
 * @param {*} repr - Describes the action that this instance represents 
 */
export class Action extends Cloneable {
    constructor(repr) {
        super();
        
        this.repr = repr;
    }
}

/**
 * Action class for sequential games, where each action is made by a distinct player.
 * @param {*} repr - Describes the action that this instance represents
 * @param {(number|PlayerIDField)} playerID - Represents the index of the player who took the action. Should be an integer if a number. The type is PlayerIDField if part of a PlayerOutcome.
 */
export class SeqAction extends Action {
    constructor(repr, playerID) {
        super(repr);
        
        this.playerID = playerID;
    }
}

/**
 * Type that can be used as a playerID in Action types
 * @param {boolean} isSelf - Whether or not the action this instance is a field of was taken by the player the action is provided to
 * @param {?number} playerID - The index of the player who took the action, relative to the player who is provided an action instance with this as a field. null if isSelf is true
 */
export class PlayerIDField extends Cloneable {
    constructor(isSelf, playerID) {
        this.isSelf = isSelf;
        this.playerID = playerID;
    }
}

/**
 * Action class for real time games, where the engine can take an action to advance the game
 * @param {*} repr - Describes the action that this instance represents
 * @param {(number|PlayerIDField)} playerID - Represents the index of the player who took the action. Should be an integer if a number. The type is PlayerIDField if part of a PlayerOutcome.
 * @param {boolean} engineStep - Whether or not the action represents an action taken by the engine (otherwise a player)
 */
export class RealTimeAction extends SeqAction {
    constructor(repr, playerID, engineStep) {
        super(repr, playerID);

        this.engineStep = engineStep;
    }
}

/**
 * Action class for simulataneous games, where the action representation is a list that includes encapsulates all player's actions.
 * See Action class for constructor documentation
 */
export class SimAction extends Action {};