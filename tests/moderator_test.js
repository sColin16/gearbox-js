import {
    assert,
    assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { stub, spy } from "https://deno.land/x/mock/mod.ts";
import { Action } from "../src/containers/actions.js";
import { EngineOutcome, Outcome, PlayerOutcome } from "../src/containers/outcomes.js";
import { State } from "../src/containers/states.js";
import { Validity } from "../src/containers/validities.js";
import { Engine } from "../src/core/engines.js";
import { Moderator } from "../src/core/moderators.js";
import { Player } from "../src/core/players.js";

Deno.test("Moderator default handleGameStart pipeline does not transform state", () => {
    const player = new Player();
    const state = new State();
    const moderator = new Moderator([player], new Engine(), state);

    let playerHandleStart = stub(player, 'handleGameStart');

    moderator.startGame();

    assertEquals(playerHandleStart.calls.length, 1);
    assertEquals(playerHandleStart.calls[0].args[1], state);
});

Deno.test("Moderator default handleOutcome pipeline does not transform or filter outcome", () => {
    const outcome = new EngineOutcome(new Validity(true), new Action(), [1], new State('a'), {});

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return outcome;
        }
    }

    const player = new Player();
    const moderator = new Moderator([player], new TestEngine(), new State('b'));

    let playerHandleOutcome = stub(player, 'handleOutcome');

    moderator.processAndReport();

    assertEquals(playerHandleOutcome.calls.length, 1);
    assertEquals(playerHandleOutcome.calls[0].args[1], outcome);
});

Deno.test("Moderator default handleActionRequest pipeline does not transform state or action", () => {
    let state = new State('a');

    class TestModerator extends Moderator {
        // Function for testing, that calls handleActionRequest on a player
        mockActionRequest() {
            return this.players[0].handleActionRequest(this, state);
        }
    }

    let expectedActionRepr = 'valid action';

    class TestPlayer extends Player {
        handleActionRequest(moderator, state) {
            return expectedActionRepr;
        }
    }

    let player = new TestPlayer();
    let moderator = new TestModerator([player], new Engine(), new State('b'));
    let playerHandleActionRequest = spy(player, 'handleActionRequest');

    let actualActionRepr = moderator.mockActionRequest();

    assert(playerHandleActionRequest.calls.length, 1);
    assertEquals(playerHandleActionRequest.calls[0].args[1], state); // State passed should be unmodified
    assertEquals(expectedActionRepr, actualActionRepr); // action representation returned should also be unmodified
});

Deno.test("Moderator handleGameStart pipeline can transform state", () => {
    let originalState = new State('a');
    let transformedState = new State('b');

    class TestModerator extends Moderator {
        transformState(state, playerID) {
            return transformedState;
        }
    }

    const player = new Player();
    const moderator = new TestModerator([player], new Engine(), originalState);

    let playerHandleStart = stub(player, 'handleGameStart');

    moderator.startGame();

    assertEquals(playerHandleStart.calls.length, 1);
    assert(playerHandleStart.calls[0].args[1] == transformedState);
});

Deno.test("Moderator handleOutcome pipeline can transform outcome", () => {
   let state = new State('a');

    class TestModerator extends Moderator {
        // Function for testing, that calls handleActionRequest on a player
        mockActionRequest() {
            return this.players[0].handleActionRequest(this, state);
        }
    }

    let expectedActionRepr = 'valid action';

    class TestPlayer extends Player {
        handleActionRequest(moderator, state) {
            return expectedActionRepr;
        }
    }

    let player = new TestPlayer();
    let moderator = new TestModerator([player], new Engine(), new State('b'));
    let playerHandleActionRequest = spy(player, 'handleActionRequest');

    let actualActionRepr = moderator.mockActionRequest();

    assert(playerHandleActionRequest.calls.length, 1);
    assertEquals(playerHandleActionRequest.calls[0].args[1], state); // State passed should be unmodified
    assertEquals(expectedActionRepr, actualActionRepr); // action representation returned should also be unmodified
});

Deno.test("Moderator handleOutcome pipeline can filter outcome", () => {
    const originalValidity = new Validity(true);
    const originalAction = new Action('a');
    const originalUtilities = [1];
    const originalState = new State('a');
    const originalStateDelta = {'a': 1};
    const originalOutcome = new EngineOutcome(originalValidity, originalAction, originalUtilities, originalState, originalStateDelta);

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return originalOutcome;
        }
    }

    const transformedValidity = new Validity(true);
    const transformedAction = new Action('b');
    const transformedUtilities = [2];
    const transformedState = new State('b');
    const transformedStateDelta = {'b': 2};
    const transformedOutcome = new PlayerOutcome(transformedValidity, transformedAction, transformedUtilities, transformedState, transformedStateDelta);

    class TestModerator extends Moderator {
        transformValidity(validity, playerID) {
            return transformedValidity;
        }

        transformSendAction(action, playerID) {
            return transformedAction;
        }

        transformUtilities(utilities, playerID) {
            return transformedUtilities;
        }

        transformState(state, plauerID) {
            return transformedState;
        }

        transformStateDelta(stateDelta, playerID) {
            return transformedStateDelta;
        }
    }

    const player = new Player();
    const moderator = new TestModerator([player], new TestEngine(), new State('c'));

    let playerHandleOutcome = stub(player, 'handleOutcome');

    moderator.processAndReport();

    assertEquals(playerHandleOutcome.calls.length, 1);
    assertEquals(playerHandleOutcome.calls[0].args[1], transformedOutcome);
});

Deno.test("Moderator handleActionRequest pipeline can transform state and action", () => {
    let originalState = new State('a');
    let originalAction = 'original action';

    class TestPlayer extends Player {
        handleActionRequest(moderator, state) {
            return originalAction;
        }
    }

    let transformedState = new State('b');
    let transformedAction = 'transformed action';

    class TestModerator extends Moderator {
        // Function for testing, that calls handleActionRequest on a player
        mockActionRequest() {
            return this.players[0].handleActionRequest(this, originalState);
        }

        transformState(state, playerID) {
            return transformedState;
        }

        transformReceiveActionRepr(actionRepr, playerID) {
            return transformedAction;
        }
    }

    let player = new TestPlayer();
    let moderator = new TestModerator([player], new Engine(), new State('c'));
    let playerHandleActionRequest = spy(player, 'handleActionRequest');

    let actualActionRepr = moderator.mockActionRequest();

    assert(playerHandleActionRequest.calls.length, 1);
    assertEquals(playerHandleActionRequest.calls[0].args[1], transformedState); // State passed should be unmodified
    assertEquals(actualActionRepr, transformedAction); // action representation returned should also be unmodified 
});