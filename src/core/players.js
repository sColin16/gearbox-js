import { State } from '../containers/states.js';
import { PlayerOutcome } from '../containers/outcomes.js';
import { Moderator, RealTimeModerator } from './moderators.js';

/**
 * Base Class that defines the interface for all Sequential or Simultaneous game players
 * @todo - make sure the interface for all of these includes the sender part
 * @abstract
 */
export class Player {
    /**
     * Called whenever it is the player's turn
     * @abstract
     * @param {Moderator} moderator - The moderator requesting an action
     * @param {State} state - The current state from which the player should decide an action
     * @returns {*} - Action representation
     */
    handleActionRequest(moderator, state){
        throw new Error("Abstract method. Subclasses must override");
    }

    /**
     * Called when a moderator starts a new game
     * @abstract
     * @param {Moderator} moderator - The moderator requesting an action
     * @param {State} state - The initial state for the game
     * @returns {void}
     */
    handleGameStart(moderator, state) {
        throw new Error("Abstract method. Subclasses must override");
    }

    /**
     * Called when the result of a turn is processed
     * @abstract
     * @param {Moderator} moderator - The moderator requesting an action
     * @param {PlayerOutcome} - The outcome of the turn
     * @returns {void}
     */
    handleOutcome(moderator, outcome) {
        throw new Error("Abstract method. Subclasses must override");
    }

    /** 
     * Called when the moderator ends a game
     * @abstract
     * @param {Moderator} moderator - The moderator requesting an action
     * @returns {void}
     */ 
    handleGameEnd(moderator) {
        throw new Error("Abstract method. Subclasses must override");
    }
}

/**
 * Base Class that defines the interface for all Real-Time game players
 * @abstract
 */
export class RealTimePlayer {
    /**
     * Called by moderators to provide players with a reference to the moderator running the game they are participating
     * @param {RealTimeModerator} moderator - The moderator running the game the player is participating in
     * Note: it is possible (but uncommon) that a player is participating in more than one game at a time.
     * If that becomes a realistic use case, create a subclass
     */
    bindModerator(moderator) {
        this.moderator = moderator;
    }

    /**
     * Interface for real-time players to take an action
     * @param {*} actionRepr - Action representation the player wishes to make
     */
    takeAction(actionRepr) {
        this.moderator.handleAction(action, this);
    }
}

/**
 * Base class for asychronous simulataneous and sequential game players (e.g. humans, network players)
 * Provides a simplified asyc interface to integreate with the synchronous moderators
 */
class AsyncPlayer extends Player {
    /**
     * Implements the Player's getAction method. Player should call takeAction(actionRepr) to take an action
     * @param {State} state - The state from which the action should be decided
     */
    async getAction(state) {
        this.startTurnActions(state);

        // Return a promise, which will resolve when the player runs the function takeAction
        return new Promise((resolve, reject) => {
            this.takeAction = (action) => {
                this.endTurnActions();

                // By resolving, we will return the action the user submitted
                resolve(action);

                this.takeAction = () => {};
            }
        });
    }

    /**
     * Called when a turn begins, to update the UI, etc.
     * @param {State} state - The current state from which the player should determine an action
     * @abstract
     */
    startTurnActions(state) {
        throw new Error("Abstract method. Subclasses must override");
    }

    /**
     * Called after the player submits an action, to update the UI, etc. 
     */
    endTurnActions() {
        throw new Error("Abstract method. Subclasses must override");
    }
}