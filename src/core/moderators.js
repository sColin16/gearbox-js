/**
 * @TODO make sure the moderator freezes the state object once it gets it from the engine, and before it reports it to players
 */

import { Player, RealTimePlayer } from './players.js';
import { Engine } from './engines.js';
import { State } from '../containers/states.js';
import { Action } from '../containers/actions.js';
import { OnewayCollection, TwowayCollection, Pipe } from 'https://raw.githubusercontent.com/sColin16/pneumatic-js/master/index.js';
import { PlayerOutcome } from "../containers/outcomes.js";

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
        let pipes = [];
        
        // Create a set of "connectivity pipes" that allow appendToPipeline to fully connect the pipeline
        // Otherwise, the first subclass that added a pipe would have to manually bind their pipe to the moderator
        for (let i = 0; i < players.length; i++) {
            let newPipe = new PlayerModeratorPipe();
            newPipe.appendToPipeline(Player, players[i]);

            pipes.push(newPipe);
        }

        super(pipes, engine, state);

        // Attach the moderator to the end of the pipeline AFTER calling super
        for (let i = 0; i < players.length; i++) {
            pipes[i].appendToPipeline(BareModerator, this);
        }
    }
}

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
            newPipe.transformHandleOutcome = (outcome => [this.transformOutcome(outcome, i)]);
            newPipe.filterHandleOutcome = (outcome => this.hideOutcome(outcome, i));

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
        let action = this.transformSendAction(outcomeCopy.action, playerID);
        let utilities = this.transformUtilities(outcomeCopy.utilities, playerID);
        let state = this.transformState(outcomeCopy.state, playerID);
        let stateDelta = this.transformStateDelta(outcomeCopy.stateDelta, playerID);

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
 * Moderator class that can be subclassed to support real-time games
 * @abstract
 */
export class RealTimeModerator {
    /**
     * Real-time interface for a player to take an action.
     * @todo
     * @param {Player} player - Reference to the player taking the action
     * @param {Action} action - The action taken by the player
     */
    handleAction(player, action) {
        throw new Error("Not yet implemented");
    }
};