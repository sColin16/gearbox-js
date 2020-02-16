// A simple non-game whose purpose is to test the RealTime game types

class CountingState extends RealTimeState {
    constructor(stepFreq, terminalState, count) {
        super(stepFreq, terminalState);

        this.stepFreq = stepFreq;
        this.count = count;
    }
}

class CountingGameModerator extends RealTimeModerator {
    constructor(player1, player2) {
        super([player1, player2], new CountingEngine(), new CountingState(3000, false, 10)) 
    }
}

class CountingEngine extends RealTimeEngine {
    constructor() {
        super(2);
    }

    verifyValid(action, state, playerID) {
        return action === -1 || action === 1;
    }

    getUtilities(state) {
        let utilities = [0, 0];

        if (state.count < 0) {
            state.terminalState = true;

            utilities = [-1, 1];

        } else if (state.count > 20) {
            state.terminalState = true;

            utilities = [1, -1];
        }

        return utilities
    }

    perturbCount(amount, state) {
        let newState = {...state}

        newState.count += amount;

        let utilities = this.getUtilities(newState);

        return {'newState': newState, 'utilities': utilities}
    }

    getNextState(action, state, playerID) {
        return this.perturbCount(action, state);
    }

    step(state) {
        let action = Math.floor(Math.random() * 10) - 5;
        let {newState, utilities} = this.perturbCount(action, state); 

        return this.reportStepOutcome(action, newState, utilities);
    }
}

