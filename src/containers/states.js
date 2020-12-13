/**
 * Set of classes that represent the state of a game or system
 */

import { Cloneable } from './cloneable.js';

/**
 * Base class from which all classes should inherit, defines properties all states should have
 * @param {number} playerCount - Number of players in the game. Should be an integer
 * @param {boolean} terminalState - Whether or not this state represents a terminal state for the game
 */
export class State extends Cloneable {
    constructor(playerCount, terminalState) {
        super();
        
        this.playerCount = playerCount;
        this.terminalState = terminalState;
    }
}

/**
 * Represents the state for sequential games, in which it is always one player's turn
 * @param {number} playerCount - Number of players in the game. Should be an integer
 * @param {number} turn - Index of the player whose turn it is next. Should be an integer
 * @param {boolean} terminalState - Whether or not this state represents a terminal state for the game
 */
export class SeqState extends State {
    constructor(playerCount, terminalState, turn) {
        super(playerCount, terminalState);

        this.turn = turn;
    }
}

/**
 * Represents the state for real time games, where the interval between engine steps is embeded in the state
 */
export class RealTimeState extends State {
    constructor(playerCount, terminalState, engineStepInterval) {
        super(playerCount, terminalState);

        this.engineStepInterval = engineStepInterval;
    }
};

/**
 * States for RealTime and simultaneous games, which don't require any extra fields
 */

export class SimState extends State {};