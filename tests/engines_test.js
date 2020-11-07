import {
    assert,
    assertEquals,
    assertThrows,
} from "https://deno.land/std/testing/asserts.ts";
import { BareEngine, SeqEngine, SimEngine, RealTimeEngine } from "../src/core/engines.js";
import { RealTimeValidity, Validity } from "../src/containers/validities.js";
import { EngineOutcome, ProcessedActionOutcome } from "../src/containers/outcomes.js";
import { State } from "../src/containers/states.js";
import { Action, RealTimeAction, SimAction } from "../src/containers/actions.js";

Deno.test("BareEngine determineOutcome reports undefined outcome fields for invalid actions", () => {
    class TestEngine extends BareEngine {
        validateAction(state, action) {
            return new Validity(false);
        }
    }

    let testEngine = new TestEngine();

    let outcome = testEngine.determineOutcome(new State(), new Action());

    assert(outcome.validity.overall == false);
    assert(typeof outcome.action === 'undefined');
    assert(typeof outcome.utilities === 'undefined');
    assert(typeof outcome.state === 'undefined');
    assert(typeof outcome.stateDelta === 'undefined');
});

Deno.test("BareEngine determineOutcome reports outcome fields for valid actions", () => {
    let mockAction = new Action();
    let mockUtilities = [1, 2, 3];
    let mockState = new State();
    let mockStateDelta = {};

    class TestEngine extends BareEngine {
        validateAction(state, action) {
            return new Validity(true);
        }

        processAction(state, action) {
            return new ProcessedActionOutcome(mockUtilities, mockState, mockStateDelta);
        }
    }

    let testEngine = new TestEngine();

    let outcome = testEngine.determineOutcome(mockState, mockAction);

    assert(outcome.validity.overall == true);
    assertEquals(outcome.action, mockAction);
    assertEquals(outcome.utilities, mockUtilities);
    assertEquals(outcome.state, mockState);
    assertEquals(outcome.stateDelta, mockStateDelta); 
});

Deno.test("BareEngine abstract methods throw errors if called", () => {
    class TestEngine extends BareEngine {};

    let testEngine = new TestEngine();

    assertThrows(
        () => testEngine.processAction(),
        Error,
        "Abstract method"
    )

    assertThrows(
        () => testEngine.validateAction(),
        Error,
        "Abstract method"
    )
});

Deno.test("SeqEngine incremenet turn increments turn", () => {
    let engine = new SeqEngine();
    let state = new State(10, 5, false);

    engine.incrementTurn(state);

    assertEquals(state.turn, 6);
});

Deno.test("SeqEngine incrementTurn increment turn wraps turn to 0", () => {
    let engine = new SeqEngine();
    let state = new State(10, 9, false);

    engine.incrementTurn(state);

    assertEquals(state.turn, 0);
});

Deno.test("SimEngine validateActionHelper correctly constructs completly true validity", () => {
    function testActionValidator(state, actionRepr, playerID) {
        return actionRepr === 'validAction';
    }

    let engine = new SimEngine();
    let state = new State();
    let action = new SimAction(['validAction', 'validAction', 'validAction']);

    let validity = engine.validateActionHelper(state, action, testActionValidator);

    assert(validity.overall);

    for (let i = 0; i < validity.individual.length; i++) {
        assert(validity.individual[i]);
    }
});

Deno.test("SimEngine validateActionHelper correctly constructs partially true validity", () => {
    function testActionValidator(state, actionRepr, playerID) {
        return actionRepr === 'validAction';
    }

    let engine = new SimEngine();
    let state = new State();
    let action = new SimAction(['invalidAction', 'validAction', 'invalidAction']);

    let validity = engine.validateActionHelper(state, action, testActionValidator);

    assert(!validity.overall);
    assert(!validity.individual[0]);
    assert(validity.individual[1]);
    assert(!validity.individual[2]);
});

Deno.test("RealTimeEngine processAction processes engine step", () => {
    let mockOutcome = new EngineOutcome();

    class TestEngine extends RealTimeEngine {
        processEngineStep(state, action) {
            return mockOutcome;
        }
    }

    let engine = new TestEngine();
    let state = new State();
    let action = new RealTimeAction('', 0, true);

    let outcome = engine.processAction(state, action);

    assertEquals(outcome, mockOutcome);
});

Deno.test("RealTimeEngine processAction processes player action", () => {
    let mockOutcome = new EngineOutcome();

    class TestEngine extends RealTimeEngine {
        processPlayerAction(state, action) {
            return mockOutcome;
        }
    }

    let engine = new TestEngine();
    let state = new State();
    let action = new RealTimeAction('', 0, false);

    let outcome = engine.processAction(state, action);

    assertEquals(outcome, mockOutcome);
});

Deno.test("RealTimeEngine validateAction validate engine step", () => {
    let engine = new RealTimeEngine();
    let state = new State();
    let action = new RealTimeAction('', 0, true);

    let validity = engine.validateAction(state, action);

    assert(validity.overall);
});

Deno.test("RealTimeEngine validateAction validates player action", () => {
    let mockValidity = new RealTimeValidity(false);

    class TestEngine extends RealTimeEngine {
        validatePlayerAction(state, action) {
            return mockValidity;
        }
    }

    let engine = new TestEngine();
    let state = new State();
    let action = new RealTimeAction('', 0, false);

    let validity = engine.validateAction(state, action);

    assertEquals(validity, mockValidity);
});

Deno.test("RealTimeEngine abstract methods throw errors if called", () => {
    let testEngine = new RealTimeEngine();

    assertThrows(
        () => testEngine.processEngineStep(),
        Error,
        "Abstract method"
    )

    assertThrows(
        () => testEngine.processPlayerAction(),
        Error,
        "Abstract method"
    )

    assertThrows(
        () => testEngine.validatePlayerAction(),
        Error,
        "Abstract method"
    )
});