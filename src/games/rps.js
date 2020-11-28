import { SimEngine } from "../core/engines.js";
import { SimModerator } from "../core/moderators.js";
import { SimState } from "../containers/states.js";

/**
 * Dummy classs for RPS
 */
export class RPSState extends SimState {
    constructor() {
        super(2, false);
    }
}

/** 
 * Engine that handles Rock, Paper, Scisssors Logic
 */
export class RPSEngine extends SimEngine {
    // Assign each action a multiple of two so that sums of any two action are unique
    static ROCK     = 1;
    static PAPER    = 2;
    static SCISSORS = 4;
    static VALID_ACTIONS = ['R', 'P', 'S'];

    singleActionValidator(state, actionRepr, playerID) {
        return RPSEngine.VALID_ACTIONS.includes(actionRepr);
    }

    validateAction(state, action) {
        return this.validateActionHelper(state, action, this.singleActionValidator);
    }

    processAction(state, action) {
        // Determine the number (above) associated with each player's move
        let p1NumAction = 2 ** (RPSEngine.VALID_ACTIONS.indexOf(action.repr[0]));
        let p2NumAction = 2 ** (RPSEngine.VALID_ACTIONS.indexOf(action.repr[1]));

        // Determine the unique sum that identifies the two moves made
        let actionSum = p1NumAction + p2NumAction;

        // Set the winning move to 0 to signify a tie (since none of the moves have a value 0)
        let winningMove = 0;

        // Determine the winning move based on the sum
        if (actionSum === RPSEngine.ROCK + RPSEngine.PAPER ) {
            winningMove = RPSEngine.PAPER;

        } else if (actionSum == RPSEngine.PAPER + RPSEngine.SCISSORS) {
            winningMove = RPSEngine.SCISSORS;

        } else if (actionSum == RPSEngine.SCISSORS + RPSEngine.ROCK) {
            winningMove = RPSEngine.ROCK;
        }

        // By default, no utilities for the game
        let utilities = [0, 0];

        // If the result was not a tie (there was a winning move), set the utilities
        if (winningMove != 0) {
            let winner = winningMove == p1NumAction ? 0 : 1;
            
            utilities[winner] = 1;
            utilities[(winner + 1) % 2] = -1;
        }

        // Always return a blank SimState, since RPS is stateless, and undefined stateDelta
        return this.makeProcessedActionOutcome(utilities, new RPSState(), undefined);
    }
}

// Helper function to run a game quickly
export function runRPS(player1, player2) {
    let mod = new SimModerator([player1, player2], new RPSEngine(), new RPSState());

    mod.runGame();
}