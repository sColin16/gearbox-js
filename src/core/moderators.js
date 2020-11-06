/**
 * @TODO make sure the moderator freezes the state object once it gets it from the engine, and before it reports it to players
 */

import { Player, RealTimePlayer } from './players.js';
import { Engine } from './engines.js';
import { State } from '../containers/states.js';
import { Action } from '../containers/actions.js';
import { OnewayCollection, Pipe } from 'https://raw.githubusercontent.com/sColin16/pneumatic-js/master/index.js';

/**
 * Base class for moderators that does not include any pipelines to customize outcomes for each player
 * Moderators are responsible for coordinating communication between players and the engine
 * @abstract
 * @param {(Player[]|Pipe[])} players - The players, or pipelines to players, who are playing the game
 * @param {Engine} engine - Handles the game logic
 * @param {State} state - Initial game state
 */
class BareModerator {
    constructor(players, engine, state) {
        this.players = players;
        this.engine = engine;
        this.state = state;

        // Prevent anyone from amking changes to this state
        //Object.freeze(this.state);
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
            this.state = engineOutcome.state;
        }

        this.players.forEach((player) => {
            player.handleOutcome(engineOutcome);
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

PlayerModeratorPipe.addInterfaceMethod(Player, 'handleOutcome', OnewayCollection);
PlayerModeratorPipe.addInterfaceMethod(Player, 'handleGameStart', OnewayCollection);
PlayerModeratorPipe.addInterfaceMethod(Player, 'handleGameEnd', OnewayCollection);

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

        // Create all basic pipes, allowing for basic transformations to outcomes
        for (let i = 0; i < players.length; i++) {
            let newPipe = new PlayerModeratorPipe();

            // Return an array with a single element, according to the Pneumatic API specs
            newPipe.transformHandleGameStart = (state => [this.transformState(state, i)]);

            newPipe.appendToPipeline(Player, players[i]);

            pipes.push(newPipe);
        }

        super(pipes, engine, state);

        // Attach the moderator to the end of the pipeline AFTER calling super
        for (let i = 0; i < players.length; i++) {
            pipes[i].appendToPipeline(BareModerator, this);
        }
    }

    //transformValidity(validity, playerID);
    //transformAction(action, playerID);
    //transformUtilities(utilities, playerID);

    /**
     * Changes the state reported to each player
     * @param {State} state - The state to transform
     * @param {(number|PlayerIDField)} playerID 
     */
    transformState(state, playerID) {
        throw new Error("Abstract method. Subclasses must override");
    }

    //transformStateDelta(stateDelta, playerID);

    //hideOutcome(engineOutcome, playerID);

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

