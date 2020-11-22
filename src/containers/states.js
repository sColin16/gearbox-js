/**
 * Set of classes that represent the state of a game or system
 */

import { Cloneable } from './cloneable.js';

/**
 * Base class from which all classes should inherit, defines properties all states should have
 * @param {number} playerCount - Number of players in the game. Should be an integer
 * @param {number} turn - Index of the player whose turn it is next. Should be an integer
 * @param {boolean} terminalState - Whether or not this state represents a terminal state for the game
 */
export class State extends Cloneable {
    constructor(playerCount, terminalState) {
        super();
        
        this.playerCount = playerCount;
        this.terminalState = terminalState;
    }
}

class TurnBasedState extends State {
    constructor(playerCount, turn, terminalState) {
        super(playerCount, terminalState);

        this.turn = turn;
    }
}

export class SeqState extends TurnBasedState {};
export class RealTimeState extends TurnBasedState {};
export class SimState extends State {};