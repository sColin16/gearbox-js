import { Player } from "../../core/players.js";
import { RPSEngine } from "../../games/rps.js";

// A random rock, paper, scissors player
export class ComputerRPSPlayer extends Player {
    handleActionRequest(moderator, state) {
        // This implementation just chooses a purely random move
        let randomIndex = Math.floor(Math.random() * 3)
        let move = RPSEngine.VALID_ACTIONS[randomIndex];

        console.log(`Computer chose move: ${move}`);

        return move;
    }

    // Dummy functions, smarter computers could use these to prepare to track patterns
    handleGameStart(moderator, state) {}

    handleOutcome(moderator, outcome) {}

    handleGameEnd(moderator) {}
}
