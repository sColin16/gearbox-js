// A random rock, paper, scissors player
class ComputerRPSPlayer extends Player {
    getAction(state) {
        console.log('Computer is getting an action');

        // This implementation just chooses a purely random move
        let randomIndex = Math.floor(Math.random() * 3)
        let move = ['R', 'P', 'S'][randomIndex];

        console.log(move);

        return move;
    }

    // Dummy functions, smarter computers could use these to prepare to track patterns
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
