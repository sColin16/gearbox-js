import {
    assert,
    assertEquals
} from "https://deno.land/std/testing/asserts.ts";
import { SimAction } from "../src/containers/actions.js";
import { RPSEngine } from "../src/games/rps.js";

Deno.test("RPSEngine singleActionValidator detects invalid actions", () => {
    const testEngine = new RPSEngine();

    assert(!testEngine.singleActionValidator(null, 'Rock'));
    assert(!testEngine.singleActionValidator(null, 'p'));
    assert(!testEngine.singleActionValidator(null, 'Scissors'));
    assert(!testEngine.singleActionValidator(null, 'W'));
});

Deno.test("RPSEngine singleActionValidator detects valid actions", () => {
    const testEngine = new RPSEngine();

    assert(testEngine.singleActionValidator(null, 'R'));
    assert(testEngine.singleActionValidator(null, 'P'));
    assert(testEngine.singleActionValidator(null, 'S'));
});

Deno.test("RPSEngine processAction detects tie", () => {
    const testEngine = new RPSEngine();
    const testAction = new SimAction(['P', 'P'])

    const outcome = testEngine.processAction(null, testAction);

    assertEquals(outcome.utilities, [0, 0]);
});

Deno.test("RPSEngine processAction detects player 1 win", () => {
    const testEngine = new RPSEngine();
    const testAction = new SimAction(['S', 'P'])

    const outcome = testEngine.processAction(null, testAction);

    assertEquals(outcome.utilities, [1, -1]);
});

Deno.test("RPSEngine processAction detects player 2 win", () => {
    const testEngine = new RPSEngine();
    const testAction = new SimAction(['S', 'R'])

    const outcome = testEngine.processAction(null, testAction);

    assertEquals(outcome.utilities, [-1, 1]);
});