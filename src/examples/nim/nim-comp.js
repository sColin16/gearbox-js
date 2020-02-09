// A smart nim computer player

class ComputerNimPlayer extends Player {
    constructor() {
        super();
    }
    
    getAction(state) {
        console.log('Computer is gettin an action');

        let action;
        if (state.tokensLeft <= 2) {
            action = state.tokensLeft;
        } else if (state.tokensLeft % 2 === 1) {
            action = 2;
        } else {
            action = 1;
        }

        return action;
    }

    reportGameStart() {
        console.log('Computer alerted game is starting');
    }

    reportOutcome(outcome) {
        console.log('Computer alerted of turn outcome');
    }

    reportGameEnd() {
        console.log('Computer alerted game is ending');
    }

}
