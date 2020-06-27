// State to store how maby tokens are left, and engine to handle Nim logic
class NimState extends SeqState {
    constructor(numTokens) {
        super();

        this.numTokens = numTokens;
    }
}

class NimEngine extends SeqEngine {
    static VALID_ACTIONS = [1, 2];

    constructor() {
        super(NimEngine.VALID_ACTIONS);
    }

    processAction(state, action) {
        // Lets players take more tokens than there are, resulting in 0 tokens left
        // This allows all games, no matter what the validActions are, to end eventually
        state.numTokens = action.actionRepr > state.numTokens ? 
            0 : state.numTokens - action.actionRepr;

        // 0 utilities unless there are no tokens left
        let utilities = 0;

        if (state.numTokens === 0){
            state.terminalState = true;

            utilities = this.winnerUtilities(action.playerID);
        }

        // Use the helper function to advance the turn
        this.incrementTurn(state);

        return this.outcome(utilities, state, undefined);
    }
}

function runNim(player1=HumanNimPlayer, player2=ComputerNimPlayer, numTokens=17) {
    let mod = new SeqModerator(players=[player1, player2], engine=NimEngine,
        state = new NimState(numTokens));

    mod.runGame();
}
