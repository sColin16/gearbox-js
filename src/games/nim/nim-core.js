// State to store how maby tokens are left, and engine to handle Nim logic
class NimState extends SeqState {
    constructor(numTokens) {
        super();

        this.numTokens = numTokens;
    }
}

class NimEngine extends SeqEngine {
    // Use the default verifyValid function to determine what valid actions are
    // This assumes you can take more than there are, just sets the total left to 0
    constructor(validActions=[1, 2]) {
        super(validActions);
    }

    getNextState(action, state, playerIndex) {
        // Lets players take more tokens than there are, resulting in 0 tokens left
        // This allows all games, no matter what the validActions are, to end eventually
        state.numTokens = action > state.tokensLeft ? 0 : state.numTokens - action;

        // 0 utilities unless there are no tokens left
        let utilities = 0;

        if (state.numTokens === 0){
            state.terminalState = true;

            utilities = this.getUtilities(playerIndex)
        }

        // Use the helper function to advance the turn
        this.incrementTurn(state);

        return this.reportOutcome(state, utilities);
    }
}

function runNim(player1=HumanNimPlayer, player2=ComputerNimPlayer, numTokens=17) {
    let mod = new SeqModerator(players=[player1, player2], engine=NimEngine,
        state = new NimState(numTokens));

    mod.runGame();
}
