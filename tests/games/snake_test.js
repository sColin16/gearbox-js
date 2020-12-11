import {
    assert,
    assertEquals
} from "https://deno.land/std/testing/asserts.ts";
import { isEqual } from 'https://cdn.skypack.dev/lodash-es'; 
import { RealTimeAction } from "../../src/containers/actions.js";
import { SnakeEngine, SnakeState } from "../../src/games/snake.js";

Deno.test("SnakeState updateHead updates head position", () => {
    let state = new SnakeState(false, null, null, 20);

    state.updateHead(7, 5);

    assertEquals(state.getTile(7, 5), SnakeState.SNAKE);
    assertEquals(state.snake.dequeue(), {x:7, y:5});
    assertEquals(state.headX, 7);
    assertEquals(state.headY, 5);
});

Deno.test("SnakeState removeTail removes tail from variables", () => {
    let state = new SnakeState(false, null, null, 20);

    state.updateHead(5, 6);
    state.updateHead(5, 7);
    state.updateHead(5, 8);

    let {tailX, tailY} = state.removeTail();

    assertEquals(tailX, 5);
    assertEquals(tailY, 6);
    assertEquals(state.getTile(5, 6), SnakeState.EMPTY);
});

Deno.test("SnakeState addFood adds food to unoccupied square", () => {
    let state = new SnakeState(false, null, null, 2);

    state.updateHead(0, 0);
    state.updateHead(1, 1);
    state.updateHead(0, 1);

    let {foodX, foodY} = state.addFood();

    assertEquals(foodX, 1);
    assertEquals(foodY, 0);
});

Deno.test("SnakeEngine validatePlayerAction detects invalid actions", () => {
    let engine = new SnakeEngine();

    assert(!engine.validatePlayerAction(null, new RealTimeAction('up')).overall);
    assert(!engine.validatePlayerAction(null, new RealTimeAction('d')).overall);
    assert(!engine.validatePlayerAction(null, new RealTimeAction('Left')).overall);
    assert(!engine.validatePlayerAction(null, new RealTimeAction('>')).overall);
});

Deno.test("SnakeEngine validatePlayerAction detects valid actions", () => {
    let engine = new SnakeEngine();

    assert(engine.validatePlayerAction(null, new RealTimeAction('UP')).overall);
    assert(engine.validatePlayerAction(null, new RealTimeAction('DOWN')).overall);
    assert(engine.validatePlayerAction(null, new RealTimeAction('LEFT')).overall);
    assert(engine.validatePlayerAction(null, new RealTimeAction('RIGHT')).overall);
});

Deno.test("SnakeEngine processPlayerAction changes snake direction", () => {
    let state = new SnakeState(false, null, 'DOWN', 10);
    let engine = new SnakeEngine();

    let outcome = engine.processPlayerAction(state, new RealTimeAction('LEFT', 0, false));

    let expectedState = new SnakeState(false, null, 'LEFT', 10);

    assertEquals(outcome.utilities, [0]);
    assertEquals(outcome.newState, expectedState);
    assertEquals(outcome.stateDelta, undefined);
});

Deno.test("SnakeEngine processEngineStep handles normal step", () => {
    let state = new SnakeState(false, null, 'RIGHT', 20);
    let engine = new SnakeEngine();

    let initialPositions = [[4, 4], [4, 5], [4, 6], [5, 6], [6, 6]];

    for (let i = 0; i < initialPositions.length; i++) {
        state.updateHead(initialPositions[i][0], initialPositions[i][1])
    }

    let outcome = engine.processEngineStep(state, null);

    let expectedPositions = [[4, 5], [4, 6], [5, 6], [6, 6], [7, 6]];

    assertEquals(outcome.utilities, [0]);

    assertEquals(outcome.newState.getTile(4, 4), SnakeState.EMPTY);
    for (let i = 0; i < expectedPositions.length; i++) {
        assertEquals(outcome.newState.getTile(expectedPositions[i][0], expectedPositions[i][1]), SnakeState.SNAKE);
    }

    assertEquals(outcome.stateDelta, [{x: 4, y:4}, {x: 7, y: 6}])
});

Deno.test("SnakeEngine processEngineStep handles food eaten step", () => {
    let state = new SnakeState(false, null, 'RIGHT', 20);
    let engine = new SnakeEngine();

    let initialPositions = [[4, 4], [4, 5], [4, 6], [5, 6], [6, 6]];

    for (let i = 0; i < initialPositions.length; i++) {
        state.updateHead(initialPositions[i][0], initialPositions[i][1])
    }
    
    state.setTile(7, 6, SnakeState.FOOD);

    let outcome = engine.processEngineStep(state, null); 

    let expectedPositions = [[4, 4], [4, 5], [4, 6], [5, 6], [6, 6], [7, 6]];

    assertEquals(outcome.utilities, [1]);

    for (let i = 0; i < expectedPositions.length; i++) {
        assertEquals(outcome.newState.getTile(expectedPositions[i][0], expectedPositions[i][1]), SnakeState.SNAKE);
    }

    // Check that some random food location, and the head are part of the state delta
    assertEquals(outcome.stateDelta.length, 2);
    assert(outcome.stateDelta.some(element => isEqual({x: 7, y: 6}, element)));
});

Deno.test("SnakeEngine processEngineStep handles game over step", () => {
    let state = new SnakeState(false, null, 'LEFT', 10);
    let engine = new SnakeEngine();

    let initialPositions = [[3, 4], [4, 4], [4, 5], [5, 5], [5, 4]];

    for (let i = 0; i < initialPositions.length; i++) {
        state.updateHead(initialPositions[i][0], initialPositions[i][1])
    }

    let outcome = engine.processEngineStep(state, null);

    assertEquals(outcome.utilities, [0]);
    assert(outcome.newState.terminalState);
    assertEquals(outcome.stateDelta.length, 0);
});

Deno.test("SnakeEngine isGameOverPos detects snake at edge of boundary", () => {
    let engine = new SnakeEngine();
    let state = new SnakeState(false, null, 'LEFT', 10);

    assert(engine.isGameOverPos(10, 5, state));
});

Deno.test("SnakeEngine isGameOverPos detects snake colliding with self", () => {
    let engine = new SnakeEngine();
    let state = new SnakeState(false, null, 'LEFT', 10);

    state.updateHead(5, 5);

    assert(engine.isGameOverPos(5, 5, state));
});

Deno.test("SnakeEngine isInBounds detects out-of-bounds positions", () => {
    let engine = new SnakeEngine();
    let state = new SnakeState(false, null, 'LEFT', 10);

    assert(!engine.isInBounds(-1, 5, state));
    assert(!engine.isInBounds(7, -1, state));
    assert(!engine.isInBounds(10, 3, state));
    assert(!engine.isInBounds(2, 10, state));
});

Deno.test("SnakeEngine isInBounds detects in-bounds positions", () => {
    let engine = new SnakeEngine();
    let state = new SnakeState(false, null, 'LEFT', 10);

    assert(engine.isInBounds(9, 3, state));
    assert(engine.isInBounds(5, 7, state));
    assert(engine.isInBounds(0, 6, state));
    assert(engine.isInBounds(3, 4, state));
});

