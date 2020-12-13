import {
    assert,
    assertEquals,
    assertStrictEquals
} from "https://deno.land/std/testing/asserts.ts";
import { stub, spy } from "https://deno.land/x/mock/mod.ts";
import { Action } from "../../src/containers/actions.js";
import { EngineOutcome, Outcome, PlayerOutcome, PlayerOutcomeField } from "../../src/containers/outcomes.js";
import { State } from "../../src/containers/states.js";
import { Validity } from "../../src/containers/validities.js";
import { Engine } from "../../src/core/engines.js";
import { Moderator, TransformCollection } from "../../src/core/moderators.js";
import { Player } from "../../src/core/players.js";

Deno.test("Default TransformCollection buildPipes creates moderator pipeline that does not transform state", () => {
    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TransformCollection.buildPipes(players);

            super(pipes, engine, state)
        }
    }

    const player = new Player();
    const state = new State();
    const moderator = new TestModerator([player], new Engine(), state);

    let playerHandleStart = stub(player, 'handleGameStart');

    moderator.startGame();

    assertEquals(playerHandleStart.calls.length, 1);
    assertEquals(playerHandleStart.calls[0].args[1], state);
});

Deno.test("TransformCollection buildPipes creates moderator pipeline that does not transform or filter outcome, except utilities", () => {
    const outcome = new EngineOutcome(new Validity(true), new Action(), [1, 2, 3], new State('a'), {});

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return outcome;
        }
    }

    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TransformCollection.buildPipes(players);

            super(pipes, engine, state)
        } 
    }

    const player = new Player();
    const moderator = new TestModerator([player], new TestEngine(), new State('b'));

    let playerHandleOutcome = stub(player, 'handleOutcome');

    const expectedOutcome = new EngineOutcome(new Validity(true), new Action(), new PlayerOutcomeField(1, [2, 3]), new State('a'), {});

    moderator.processAndReport();

    assertEquals(playerHandleOutcome.calls.length, 1);
    assertEquals(playerHandleOutcome.calls[0].args[1], expectedOutcome);
});

Deno.test("TransformCollection buildPipes creates moderator pipeline that is robust to invalid moves, and undefined fields", () => {
    const outcome = new EngineOutcome(new Validity(false), undefined, undefined, undefined, undefined);

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return outcome;
        }
    }

    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TransformCollection.buildPipes(players);

            super(pipes, engine, state)
        } 
    }

    const player = new Player();
    const moderator = new TestModerator([player], new TestEngine(), new State('b'));

    let playerHandleOutcome = stub(player, 'handleOutcome');

    // If this does not throw an error, then the pipes handles the undefined fields fine
    moderator.processAndReport();
});

Deno.test("TransformCollection buildPipes creates moderator pipeline that does not transform state or action", () => {
    let state = new State('a');

    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TransformCollection.buildPipes(players);

            super(pipes, engine, state)
        }

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

Deno.test("TransformCollection subclass buildPipes creates handleGameStart transformation pipeline", () => {
    let originalState = new State('a');
    let transformedState = new State('b');

    class TestTransformCollection extends TransformCollection {
        static transformState(state, playerID) {
            return transformedState;
        }
    }

    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TestTransformCollection.buildPipes(players);

            super(pipes, engine, state)
        }
    }

    const player = new Player();
    const moderator = new TestModerator([player], new Engine(), originalState);

    let playerHandleStart = stub(player, 'handleGameStart');

    moderator.startGame();

    assertEquals(playerHandleStart.calls.length, 1);
    assertStrictEquals(playerHandleStart.calls[0].args[1], transformedState);
});

Deno.test("TransformCollection subclass buildPipes creates handleOutcome transformation pipeline", () => {
    const originalOutcome = new EngineOutcome(new Validity(true), new Action('a'), [1], new State('a'), {'a': 1});

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

    class TestTransformCollection extends TransformCollection {
        static transformValidity(validity, playerID) {
            return transformedValidity;
        }

        static transformSendAction(action, playerID) {
            return transformedAction;
        }

        static transformUtilities(utilities, playerID) {
            return transformedUtilities;
        }

        static transformState(state, playerID) {
            return transformedState;
        }

        static transformStateDelta(stateDelta, playerID) {
            return transformedStateDelta;
        }
    }

    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TestTransformCollection.buildPipes(players);

            super(pipes, engine, state)
        }
    }

    const player = new Player();
    const moderator = new TestModerator([player], new TestEngine(), new State('c'));

    let playerHandleOutcome = stub(player, 'handleOutcome');

    moderator.processAndReport();

    assertEquals(playerHandleOutcome.calls.length, 1);
    assertEquals(playerHandleOutcome.calls[0].args[1], transformedOutcome);
});

Deno.test("TransformCollection subclass buildPipes creates pipeline to filters outcomes", () => {
    const outcome = new EngineOutcome(new Validity(true), new Action(), [1], new State('a'), {}); 

    class TestEngine extends Engine {
        determineOutcome(state, action) {
            return outcome;
        }
    }

    class TestTransformCollection extends TransformCollection {
        static hideOutcome(outcome, playerID) {
            return true;
        }
    }

    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TestTransformCollection.buildPipes(players);

            super(pipes, engine, state)
        }        
    }

    const player = new Player();
    const moderator = new TestModerator([player], new TestEngine(), new State('b'));

    let playerHandleOutcome = stub(player, 'handleOutcome');

    moderator.processAndReport();

    assertEquals(playerHandleOutcome.calls.length, 0);
});

Deno.test("TransformCollection subclass buildPipes creates handleActionRequest transformation pipeline", () => {
    let originalState = new State('a');
    let originalAction = 'original action';

    class TestPlayer extends Player {
        handleActionRequest(moderator, state) {
            return originalAction;
        }
    }

    let transformedState = new State('b');
    let transformedAction = 'transformed action';

    class TestTransformCollection extends TransformCollection {
        static transformState(state, playerID) {
            return transformedState;
        }

        static transformReceiveActionRepr(actionRepr, playerID) {
            return transformedAction;
        }
    }

    class TestModerator extends Moderator {
        constructor(players, engine, state) {
            let pipes = TestTransformCollection.buildPipes(players);

            super(pipes, engine, state)
        }

        // Function for testing, that calls handleActionRequest on a player
        mockActionRequest() {
            return this.players[0].handleActionRequest(this, originalState);
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