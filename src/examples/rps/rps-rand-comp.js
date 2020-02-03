// A random rock, paper, scissors player
class ComputerRPSPlayer extends Player {
    constructor() {
        super()
    }

    getAction(state) {

        console.log('Computer is getting an action');
        // Just choose a random move
        let randomIndex = Math.floor(Math.random() * 3)

        let move = ['R', 'P', 'S'][randomIndex];

        console.log(move);

        return move;
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
