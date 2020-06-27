// A basic pong player that just follows the ball

class ComputerPongPlayer extends RealTimePlayer {
    handleGameStart(state) {
        console.log('Computer alerted game is starting');
    }

    handleOutcome(outcome) {
        if (outcome.action.engineStep) {
            this.takeAction(outcome.state.ballPos.y);
        }
    }

    handleGameEnd() {
        console.log('Copmuter alerted game is ending');
    }
}
