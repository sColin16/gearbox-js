import {
    assert,
    assertEquals,
    assertThrowsAsync,
} from "https://deno.land/std/testing/asserts.ts";
import { stub, spy } from "https://deno.land/x/mock/mod.ts"
import { Action } from "../src/containers/actions.js";
import { EngineOutcome } from "../src/containers/outcomes.js";
import { State } from "../src/containers/states.js";
import { Validity } from "../src/containers/validities.js";
import { Engine } from "../src/core/engines.js";
import { BareModerator } from "../src/core/moderators.js";
import { Player } from "../src/core/players.js";

Deno.test("BareModerator freezes initial state", () => {
    let state = new State();
    let moderator = new BareModerator([], new Engine(), state);

    assert(Object.isFrozen(moderator.state));
});

// This function must be async to await the runGame function
// Not awaiting runGameallows the function to return early
Deno.test("BareModerator runGame loop makes correct calls", async () => {
    let turn = 0;

    class TestModerator extends BareModerator {
        constructor(players, engine, state) {
            super(players, engine, state);

            this.turn = 1;
        }

        runTurn() {
            if (this.turn == 3) {
                this.state = this.state.clone();
                this.state.terminalState = true;
            }

            this.turn++;
        }        
    }

    const moderator = new TestModerator([], new Engine(), new State(0, 0, false));

    const runTurn = spy(moderator, 'runTurn');
    const startGame = stub(moderator, 'startGame');
    const endGame = stub(moderator, 'endGame');

    await moderator.runGame();

    assertEquals(startGame.calls.length, 1);
    assertEquals(runTurn.calls.length, 3);
    assertEquals(endGame.calls.length, 1);
});

Deno.test("BareModerator startGame alerts all players", () => {
    let player1 = new Player();
    let player2 = new Player();
    let player3 = new Player();
    let state = new State();

    let moderator = new BareModerator([player1, player2, player3], new Engine(), state);

    let handleStart1 = stub(player1, 'handleGameStart');
    let handleStart2 = stub(player2, 'handleGameStart');
    let handleStart3 = stub(player3, 'handleGameStart');

    moderator.startGame();

    assertEquals(handleStart1.calls.length, 1);
    assertEquals(handleStart2.calls.length, 1);
    assertEquals(handleStart3.calls.length, 1);
    assertEquals(handleStart1.calls[0].args, [moderator, state]);
    assertEquals(handleStart2.calls[0].args, [moderator, state]);
    assertEquals(handleStart3.calls[0].args, [moderator, state]);
});

Deno.test("BareModerator endGame alerts all players", () => {
    let player1 = new Player();
    let player2 = new Player();
    let player3 = new Player();
    let state = new State();

    let moderator = new BareModerator([player1, player2, player3], new Engine(), state);

    let handleEnd1 = stub(player1, 'handleGameEnd');
    let handleEnd2 = stub(player2, 'handleGameEnd');
    let handleEnd3 = stub(player3, 'handleGameEnd');

    moderator.endGame();

    assertEquals(handleEnd1.calls.length, 1);
    assertEquals(handleEnd2.calls.length, 1);
    assertEquals(handleEnd3.calls.length, 1);
});

Deno.test("BareModerator alerts all players of outcome", () => {
    let state = new State();
    let outcome = new EngineOutcome(new Validity(true), new Action, [], state, '');

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return outcome;
        }
    };
    
    let player1 = new Player();
    let player2 = new Player();
    let player3 = new Player();

    let moderator = new BareModerator([player1, player2, player3], new TestEngine(), state);

    let handleOutcome1 = stub(player1, 'handleOutcome');
    let handleOutcome2 = stub(player2, 'handleOutcome');
    let handleOutcome3 = stub(player3, 'handleOutcome');

    moderator.processAndReport(new Action());

    assertEquals(handleOutcome1.calls.length, 1);
    assertEquals(handleOutcome2.calls.length, 1);
    assertEquals(handleOutcome3.calls.length, 1);
    assertEquals(handleOutcome1.calls[0].args, [moderator, outcome]);
    assertEquals(handleOutcome2.calls[0].args, [moderator, outcome]);
    assertEquals(handleOutcome3.calls[0].args, [moderator, outcome]);
});

Deno.test("BareModerator processAndReport freeze and update state on valid action", () => {
    let outcomeState = new State();
    let outcome = new EngineOutcome(new Validity(true), new Action, [], outcomeState, '');

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return outcome;
        }
    };

    let moderator = new BareModerator([], new TestEngine(), new State());

    moderator.processAndReport();

    assert(Object.isFrozen(moderator.state));
    assertEquals(moderator.state, outcomeState);
});

Deno.test("BareModerator processAndReport no update to state on invalid action", () => {
    let outcomeState = new State();
    let initialState = new State();
    let outcome = new EngineOutcome(new Validity(true), new Action, [], outcomeState, '');

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return outcome;
        }
    };

    let moderator = new BareModerator([], new TestEngine(), initialState);

    moderator.processAndReport();

    assertEquals(moderator.state, initialState);
});

Deno.test("BareModerator abstract classes throws error if called", () => {
    let moderator = new BareModerator();

    assertThrowsAsync(
        () => moderator.runTurn(),
        Error,
        "Abstract method"
    )
});