// Returns a promise that takes ms milliseconds to resolve
// To use it as a wait block do 'await delay(100);'
// Or, delay(100).then(// Do stuff)

async function delay(ms) {
    return new Promise(function(resolve,reject) {
        setTimeout(resolve, ms);
    });
}

let defaultState = new SimState();


class RPSGameModerator extends SimModerator {
    constructor(player1, player2) {
        super([player1, player2], new RPSEngine(), defaultState);
    }
}

class RPSEngine extends SimEngine {
    static ROCK     = 1;
    static PAPER    = 2;
    static SCISSORS = 4;

    constructor() {
        super();
    }

    verifyValid(action, state) {
        return ['R', 'P', 'S'].includes(action);
    }

    getNextState(actions, state) {
        let p1NumAction = 2 ** (['R', 'P', 'S'].indexOf(actions[0]));
        let p2NumAction = 2 ** (['R', 'P', 'S'].indexOf(actions[1]));

        let actionSum = p1NumAction + p2NumAction;

        let winningMove;

        if (p1NumAction == p2NumAction) {
            winningMove = 0;

        } else if (actionSum === RPSEngine.ROCK + RPSEngine.PAPER ) {
            winningMove = RPSEngine.PAPER;

        } else if (actionSum == RPSEngine.PAPER + RPSEngine.SCISSORS) {
            winningMove = RPSEngine.SCISSORS;

        } else if (actionSum == RPSEngine.SCISSORS + RPSEngine.ROCK) {
            winningMove = RPSEngine.ROCK;
        }

        let utilities;

        if (winningMove == 0) {
            utilities = [0, 0];
        } else if (winningMove == p1NumAction) {
            utilities = [1, -1];
        } else {
            utilities = [-1, 1];
        }

        return {'newState': defaultState, 'utilities': utilities};    
    }
}
