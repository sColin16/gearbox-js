// A "smart" nim computer player (pretty sure its actually dumb)

class ComputerNimPlayer extends Player {
    async getAction(state) {
        // Simulate a delay as if the computer was thinking
        await delay(2000);

        // Attempt to choose a move intelligently (which I think is wrong)
        let action;
        if (state.tokensLeft <= 2) {
            action = state.tokensLeft;
        } else if (state.tokensLeft % 2 === 1) {
            action = 1;
        } else {
            action = 2;
        }

        return action;
    }

    // Dummy functions that could be replaced with more advanced things for advanced players
    handleGameStart() {
        console.log('Computer alerted game is starting');
    }

    handleOutcome(outcome) {
        console.log(outcome);
    }

    handleGameEnd() {
        console.log('Computer alerted game is ending');
    }
}
