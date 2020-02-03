
async function delay(ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, ms);
    });
}

class NimState extends SeqState {
    constructor(terminalState, turn, tokensLeft) {
        super(terminalState, turn);

        this.tokensLeft = tokensLeft;
    }
}

class NimGameModerator extends SeqModerator {
    constructor(player1, player2, numTokens) {
        super([player1, player2], new NimEngine(), new NimState(false, 0, numTokens)); 
    }
}

class NimEngine extends SeqEngine {
    constructor(validActions = [1, 2], normalPlay = true) {
        super(2);

        this.validActions = validActions;
        this.normalPlay = normalPlay; // Not supported yet
    }

    verifyValid(action, state, playerID) {
        return this.validActions.includes(action);
    }

    getNextState(action, state, playerID) {
        let newState = {...state} // Copy the state so we can modify it

        newState.tokensLeft = action > newState.tokensLeft ? 0 : newState.tokensLeft - action;

        let utilities = [0, 0];

        if (newState.tokensLeft === 0) {
            newState.terminalState = true;

            if (playerID == 0) {
                utilities = [1, -1];
            } else {
                utilities = [-1, 1];
            }
        } else {
            this.incrementTurn(newState);
        }

        return {'newState': newState, 'utilities': utilities}
    }
}
