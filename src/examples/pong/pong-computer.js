// A basic pong player that just follows the ball

class ComputerPongPlayer extends RealTimePlayer {
    reportGameStart(state) {
        console.log('Computer alerted game is starting');
    }

    reportOutcome(outcome) {
        //console.log(outcome);

        if (outcome.engineStep) {
            this.takeAction(outcome.newState.ballPos.y);
        }
    }

    reportGameEnd() {
        console.log('Copmuter alerted game is ending');
    }
}
