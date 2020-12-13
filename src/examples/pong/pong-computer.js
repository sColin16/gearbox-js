import { RealTimePlayer } from "../../core/players.js";
// A basic pong player that just follows the ball

export class ComputerPongPlayer extends RealTimePlayer {
    handleGameStart(moderator, state) {}

    handleOutcome(moderator, outcome) {
        if (outcome.action.engineStep) {
            this.takeAction(outcome.state.ball.pos.y);
        }
    }

    handleGameEnd(moderator) { }
}
