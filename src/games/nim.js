import { SeqState } from "../containers/states.js";
import { SeqValidity } from "../containers/validities.js";
import { SeqEngine } from "../core/engines.js";
import { SeqModerator } from "../core/moderators.js";

// State to store how maby tokens are left, and engine to handle Nim logic
export class NimState extends SeqState {
    constructor(numTokens) {
        super(2, false, 0);

        this.numTokens = numTokens;
    }
}

export class NimEngine extends SeqEngine {
    static VALID_ACTIONS = [1, 2];

    validateAction(state, action) {
        return new SeqValidity(NimEngine.VALID_ACTIONS.includes(action.repr));
    }

    processAction(state, action) {
        // Clone the state to be able to modify it
        state = state.clone();
        
        // Lets players take more tokens than there are, resulting in 0 tokens left
        // This allows all games, no matter what the validActions are, to end eventually
        state.numTokens = action.repr > state.numTokens ? 0 : state.numTokens - action.repr;

        // 0 utilities unless there are no tokens left
        let utilities = [0, 0];

        if (state.numTokens === 0){
            state.terminalState = true;

            utilities[action.playerID] = 1;
            utilities[(action.playerID + 1) % 2] = -1;
        }

        // Use the helper function to advance the turn
        this.incrementTurn(state);

        return this.makeProcessedActionOutcome(utilities, state, undefined);
    }
}

export function runNim(player1, player2, numTokens) {
    let mod = new SeqModerator([player1, player2], new NimEngine(), new NimState(numTokens));

    mod.runGame();
}
