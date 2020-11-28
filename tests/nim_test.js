import {
    assert,
    assertEquals
} from "https://deno.land/std/testing/asserts.ts";
import { SeqAction } from "../src/containers/actions.js";
import { NimEngine, NimState } from "../src/games/nim.js";

Deno.test("NimEngine validateAction detects invalid actions", () => {
    const testEngine = new NimEngine();

    assert(!testEngine.validateAction(null, new SeqAction("1", 1)).overall);
    assert(!testEngine.validateAction(null, new SeqAction("two", 0)).overall);
    assert(!testEngine.validateAction(null, new SeqAction(-1, 1)).overall);
    assert(!testEngine.validateAction(null, new SeqAction(3, 0)).overall);
});

Deno.test("NimEngine validateAction detects valid actions", () => {
    const testEngine = new NimEngine();

    assert(testEngine.validateAction(null, new SeqAction(1, 0)).overall);
    assert(testEngine.validateAction(null, new SeqAction(2, 1)).overall);
});

Deno.test("NimEngine processAction subtracts token from state", () => {
    let originalState = new NimState(42);
    const testEngine = new NimEngine();

    let outcome = testEngine.processAction(originalState, new SeqAction(2, 0));

    assertEquals(outcome.newState.numTokens, 40);
});

Deno.test("NimEngine processAction overdrawing tokens sets tokens to 0", () => {
    let originalState = new NimState(1);
    const testEngine = new NimEngine();

    let outcome = testEngine.processAction(originalState, new SeqAction(2, 0));

    assertEquals(outcome.newState.numTokens, 0);
});

Deno.test("NimEngine processAction detects winner", () => {
    let originalState = new NimState(2);
    const testEngine = new NimEngine();

    let outcome = testEngine.processAction(originalState, new SeqAction(2, 1));

    assertEquals(outcome.utilities, [-1, 1]);
});