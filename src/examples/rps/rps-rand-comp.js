// A random rock, paper, scissors player
class ComputerRPSPlayer extends Player {
    getAction(state) {
        console.log('Computer is getting an action');

        // This implementation just chooses a purely random move
        let randomIndex = Math.floor(Math.random() * 3)
        let move = RPSEngine.VALID_ACTIONS[randomIndex];

        console.log(move);

        return move;
    }

    // Dummy functions, smarter computers could use these to prepare to track patterns
    handleGameStart() {
        console.log('Computer alerted game is starting');
    }

    handleOutcome(outcome) {
        console.log('Computer alerted of turn outcome');
    }

    handleGameEnd() {
        console.log('Computer alerted game is ending');
    }
}
