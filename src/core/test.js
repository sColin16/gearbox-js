import { State } from "../containers/states.js";
import { Engine } from "./engines.js";
import { Moderator } from "./moderators.js";
import { Player } from "./players.js";

class MyEngine extends Engine {}

class MyPlayer extends Player {
    handleGameStart(moderator, state) {
        console.log(state.turn);
    }
}

class MyModerator extends Moderator {
    constructor() {
        super([new MyPlayer()], new MyEngine(), new State(1, 0, false));
    }

    transformState(state, playerID) {
        state.turn += 27;

        return state;
    }
}

let m = new MyModerator();
m.startGame();