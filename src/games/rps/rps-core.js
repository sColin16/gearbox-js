// Engine that handles Rock, Paper, Scisssors Logic
class RPSEngine extends SimEngine {
    // Assign each action a multiple of two so that sums of any two action are unique
    static ROCK     = 1;
    static PAPER    = 2;
    static SCISSORS = 4;
    static VALID_ACTIONS = ['R', 'P', 'S'];

    constructor() {
        super(RPSEngine.VALID_ACTIONS);
    }

    processAction(state, actions) {
        // Determine the number (above) associated with each player's move
        let p1NumAction = 2 ** (RPSEngine.VALID_ACTIONS.indexOf(actions.actionRepr[0]));
        let p2NumAction = 2 ** (RPSEngine.VALID_ACTIONS.indexOf(actions.actionRepr[1]));

        // Determine the unique sum that identifies the two moves made
        let actionSum = p1NumAction + p2NumAction;

        // Set the winning move to 0 to signify a tie (since no move is 0)
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
        let utilities = 0;

        // If the result was not a tie (there was a winning move), set the utilities
        if (winningMove != 0) {
            let winner = winningMove == p1NumAction ? 0 : 1;
            
            utilities = this.winnerUtilities(winner);
        }

        // Always return a blank SimState, since RPS is stateless, and undefined stateDelta
        return this.outcome(utilities, new State(), undefined);
    }
}

// Helper function to run a game quickly
function runRPS(player1=HumanRPSPlayer, player2=ComputerRPSPlayer) {
    let mod = new SimModerator(players=[player1, player2], engine=RPSEngine, state=SimState);

    mod.runGame();
}
