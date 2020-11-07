import {
    assert,
    assertEquals,
    assertThrows,
} from "https://deno.land/std/testing/asserts.ts";
import { BareEngine } from "../src/core/engines.js";
import { Validity } from "../src/containers/validities.js";
import { ProcessedActionOutcome } from "../src/containers/outcomes.js";
import { State } from "../src/containers/states.js";
import { Action } from "../src/containers/actions.js";

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