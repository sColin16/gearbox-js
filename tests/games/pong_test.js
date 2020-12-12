import {
    assert,
    assertEquals,
    assertArrayIncludes,
} from "https://deno.land/std/testing/asserts.ts";
import { stub } from "https://deno.land/x/mock/mod.ts";
import { RealTimeAction } from "../../src/containers/actions.js";
import { EngineOutcome } from "../../src/containers/outcomes.js";
import { Ball, Paddle, PongEngine, PongState, PongTransformCollection, Vector } from "../../src/games/pong.js";

Deno.test("Vector add works correctly", () => {
    let vectorA = new Vector(3, 11);
    let vectorB = new Vector(9, 4);

    vectorA.add(vectorB);

    let expectedVector = new Vector(12, 15);

    assertEquals(vectorA, expectedVector);
});

Deno.test("Ball fromMagnitude correctly constructs new Ball", () => {
    let magnitude = 5;
    let angle = Math.PI/4;

    let expectedBall = new Ball(0, 0, 5/2 * Math.sqrt(2), 5/2 * Math.sqrt(2));
    let actualBall = Ball.fromMagnitude(0, 0, magnitude, angle);
    
    assert(expectedBall.vel.x - actualBall.vel.x < 1e-4);
    assert(expectedBall.vel.y - actualBall.vel.y < 1e-4);
});

Deno.test("Ball bounce does not bounce outside barrier", () => {
    let ball = new Ball(10, 10, 0, 0, 0);

    let bounces = ball.bounce(2, 7, 'x');

    assert(!bounces);
});

Deno.test("Ball bounce does not bounce inside barrier", () => {
    let ball = new Ball(1, 1, 0, 0, 0);

    let bounces = ball.bounce(2, 7, 'x');

    assert(!bounces); 
});

Deno.test("Ball bounce bounces with inner/outer defined ascending", () => {
    let ball = new Ball(4, 4, 0, 0, 0);

    let bounces = ball.bounce(2, 7, 'x');

    assert(bounces); 
})

Deno.test("Ball bounce bounces with inner/outer defined descending", () => {
    let ball = new Ball(4, 4, 0, 0, 0);

    let bounces = ball.bounce(7, 2, 'x');

    assert(bounces); 
});

Deno.test("Ball update updates position correctly", () => {
    let ball = new Ball(10, 10, 5, 7);

    ball.update();

    assertEquals(ball.pos.x, 15);
    assertEquals(ball.pos.y, 17);
});

Deno.test("Paddle constrainVelocity constrains positive excessive velocity", () => {
    let paddle = new Paddle(0, 0, 0, 0, 10);

    let vel = paddle.constrainVelocity(15);

    assertEquals(vel, 10);
});

Deno.test("Paddle constrainVelocity constrains negative excessive velocity", () => {
    let paddle = new Paddle(0, 0, 0, 0, 10);

    let vel = paddle.constrainVelocity(-20);

    assertEquals(vel, -10);
});

Deno.test("Paddle constrainVelocity does not modify non-excessive velocities", () => {
    let paddle = new Paddle(0, 0, 0, 0, 10);

    let vel = paddle.constrainVelocity(6);

    assertEquals(vel, 6);
});

Deno.test("Paddle inRangePaddle detects ball in range of paddle", () => {
    let ball = new Ball(50, 225, 0, 0, 20);
    let paddle = new Paddle(0, 200, 10, 50);

    assert(paddle.ballInRange(ball));
});

Deno.test("Paddle inRangePaddle detects ball out of range of paddle", () => {
    let ball = new Ball(50, 300, 0, 0, 20);
    let paddle = new Paddle(0, 200, 10, 50);

    assert(!paddle.ballInRange(ball));
});

Deno.test("Paddle update handles negative velocity", () => {
    let paddle = new Paddle(10, 200, 0, 0, 10);

    paddle.target = 193;
    paddle.update();

    assertEquals(paddle.pos.y, 193);
});

Deno.test("Paddle update handles positive velocity", () => {
    let paddle = new Paddle(10, 200, 0, 0, 10);

    paddle.target = 204;
    paddle.update();

    assertEquals(paddle.pos.y, 204);
});

Deno.test("Paddle update handles out-of-range target", () => {
    let paddle = new Paddle(10, 200, 0, 0, 10);

    paddle.target = 256;
    paddle.update();

    assertEquals(paddle.pos.y, 210);
});

Deno.test("PongState topBounce detects top bounce", () => {
    let ball = new Ball(200, 5, 0, 0, 20);

    let state = new PongState(0, 400, 400, ball);

    assert(state.topBounce());
});

Deno.test("PongState topBounce detects non-top-bounce", () => {
    let ball = new Ball(200, 50, 0, 0, 20);

    let state = new PongState(0, 400, 400, ball);

    assert(!state.topBounce());
});

Deno.test("PongState bottomBounce detects bottom bounce", () => {
    let ball = new Ball(200, 393, 0, 0, 20);

    let state = new PongState(0, 400, 400, ball);

    assert(state.bottomBounce());
});

Deno.test("PongState bottom bounce detects non-bottom-bounce", () => {
    let ball = new Ball(200, 340, 0, 0, 20);

    let state = new PongState(0, 400, 400, ball);

    assert(!state.bottomBounce());
});

Deno.test("PongState leftPaddleBounce detects left paddle bounce", () => {
    let ball = new Ball(20, 200, 10, 5, 20);
    let leftPaddle = new Paddle(5, 200, 20, 50);

    let state = new PongState(null, 400, 400, ball, leftPaddle);

    assert(state.leftPaddleBounce());
});

Deno.test("PongState leftPaddleBounce detects non-left-paddle-bounce", () => {
    let ball = new Ball(50, 200, 10, 5, 20);
    let leftPaddle = new Paddle(5, 200, 20, 50);

    let state = new PongState(null, 400, 400, ball, leftPaddle);

    assert(!state.leftPaddleBounce());
});

Deno.test("PongState rightPaddleBounce detect right paddle bounce", () => {
    let ball = new Ball(380, 200, 10, 5, 20);
    let rightPaddle = new Paddle(395, 200, 20, 50);

    let state = new PongState(null, 400, 400, ball, null, rightPaddle);

    assert(state.rightPaddleBounce());
}); 

Deno.test("PongState rightPaddleBounce detect non-right-paddle-bounce", () => {
    let ball = new Ball(395, 200, 10, 5, 20);
    let rightPaddle = new Paddle(395, 200, 20, 50);

    let state = new PongState(null, 400, 400, ball, null, rightPaddle);

    assert(!state.rightPaddleBounce());
});

Deno.test("PongState spinBall updates ball's y-vel according to weights", () => {
    let ball = new Ball(200, 200, 20, 10);
    let paddle = new Paddle();
    paddle.velocity = 0.5;

    let state = new PongState(null, 400, 400, ball, null, null, 1, 1);
    let randomMock = stub(Math, 'random', [1]);

    state.spinBall(paddle);

    assertEquals(ball.vel.x, 20);
    assertEquals(ball.vel.y, 11.5);

    randomMock.restore();
});

Deno.test("PongTransformCollection hideOutcome hides opponent action", () => {
    let engineOutcome = new EngineOutcome(null, new RealTimeAction(200, 0, false), null, null, null);

    assert(PongTransformCollection.hideOutcome(engineOutcome, 1));
});

Deno.test("PongTransformCollection hideOutcome does not hide self actions", () => {
    let engineOutcome = new EngineOutcome(null, new RealTimeAction(200, 1, false), null, null, null);

    assert(!PongTransformCollection.hideOutcome(engineOutcome, 1));
});

Deno.test("PongTransformCollection hideOutcome does not hide engine steps", () => {
    let engineOutcome = new EngineOutcome(null, new RealTimeAction('engineStep', undefined, true), null, null, null);

    assert(!PongTransformCollection.hideOutcome(engineOutcome, 0));
});

Deno.test("PongTransformCollection transformState flips state right player", () => {
    let ball = new Ball(100, 200, 10, 10, 20);
    let leftPaddle = new Paddle(10, 180, 20, 100, 20);
    let rightPaddle = new Paddle(390, 220, 20, 100, 20);

    let state = new PongState(null, 400, 400, ball, leftPaddle, rightPaddle);

    let transformedState = PongTransformCollection.transformState(state, 1);

    assertEquals(transformedState.leftPaddle.pos.x, 10);
    assertEquals(transformedState.leftPaddle.pos.y, 220);
    assertEquals(transformedState.rightPaddle.pos.x, 390);
    assertEquals(transformedState.rightPaddle.pos.y, 180);

    assertEquals(transformedState.ball.pos.x, 300);
    assertEquals(transformedState.ball.vel.x, -10);
});

Deno.test("PongTransformCollection transformState hides opponent target", () => {
    let ball = new Ball(100, 200, 10, 10, 20);
    let leftPaddle = new Paddle(10, 180, 20, 100, 20);
    let rightPaddle = new Paddle(390, 220, 20, 100, 20);

    let state = new PongState(null, 400, 400, ball, leftPaddle, rightPaddle);

    let transformedState = PongTransformCollection.transformState(state, 0);

    assertEquals(transformedState.rightPaddle.target, null); 
});

Deno.test("PongTransformCollection transformStateDelta reflects left/right bounced for player 2", () => {
    let stateDelta = ['top-bounce', 'left-bounce'];

    let transformedStateDelta = PongTransformCollection.transformStateDelta(stateDelta, 1);

    assertEquals(transformedStateDelta, ['top-bounce', 'right-bounce']);
});

Deno.test("PongTransformCollection does not modify stateDelta for player 1", () => {
    let stateDelta = ['top-bounce', 'left-bounce'];

    let transformedStateDelta = PongTransformCollection.transformStateDelta(stateDelta, 0);

    assertEquals(transformedStateDelta, ['top-bounce', 'left-bounce']);
});

Deno.test("PongEngine validatePlayerAction detects invalid moves", () => {
    let state = new PongState(null, 200, 400);

    let engine = new PongEngine();

    assert(!engine.validatePlayerAction(state, new RealTimeAction(-5)).overall);
    assert(!engine.validatePlayerAction(state, new RealTimeAction(427)).overall);
});

Deno.test("PongEngine validatePlayerAction detects valid moves", () => {
    let state = new PongState(null, 200, 400);

    let engine = new PongEngine();

    assert(engine.validatePlayerAction(state, new RealTimeAction(125)).overall);
    assert(engine.validatePlayerAction(state, new RealTimeAction(347)).overall);
});

Deno.test("PongEngine processPlayerAction updates left paddle target", () => {
    let ball = new Ball(100, 200, 10, 10, 20);
    let leftPaddle = new Paddle(10, 180, 20, 100, 20);
    let rightPaddle = new Paddle(390, 220, 20, 100, 20);
    let state = new PongState(null, 400, 400, ball, leftPaddle, rightPaddle);

    let engine = new PongEngine();

    let outcome = engine.processPlayerAction(state, new RealTimeAction(115, 0, false));

    assertEquals(outcome.newState.leftPaddle.target, 115);
});

Deno.test("PongEngine processPlayer action updates right paddle target", () => {
    let ball = new Ball(100, 200, 10, 10, 20);
    let leftPaddle = new Paddle(10, 180, 20, 100, 20);
    let rightPaddle = new Paddle(390, 220, 20, 100, 20);
    let state = new PongState(null, 400, 400, ball, leftPaddle, rightPaddle);

    let engine = new PongEngine();

    let outcome = engine.processPlayerAction(state, new RealTimeAction(42, 1, false));

    assertEquals(outcome.newState.rightPaddle.target, 42);
});

Deno.test("PongEngine processEngineStep adds bounces to stateDelta", () => {
    let ball = new Ball(25, 5, 0, 0, 20);
    let leftPaddle = new Paddle(10, 10, 20, 100, 20);
    let rightPaddle = new Paddle(390, 220, 20, 100, 20);
    let state = new PongState(null, 400, 400, ball, leftPaddle, rightPaddle);

    let engine = new PongEngine();

    let outcome = engine.processEngineStep(state, 'engineStep');

    assertArrayIncludes(outcome.stateDelta, ['left-bounce', 'top-bounce']);
});

Deno.test("PongEngine processEngineStep detects left player loss", () => {
    let ball = new Ball(5, 5, 0, 0, 20);
    let leftPaddle = new Paddle(100, 10, 20, 100, 20);
    let rightPaddle = new Paddle(390, 220, 20, 100, 20);
    let state = new PongState(null, 400, 400, ball, leftPaddle, rightPaddle);

    let engine = new PongEngine();

    let outcome = engine.processEngineStep(state, 'engineStep');

    assert(outcome.newState.terminalState);
    assertEquals(outcome.utilities, [-1, 1]);
});

Deno.test("PongEngine processEngineStep detects right player loss", () => {
    let ball = new Ball(395, 5, 0, 0, 20);
    let leftPaddle = new Paddle(100, 10, 20, 100, 20);
    let rightPaddle = new Paddle(390, 220, 20, 100, 20);
    let state = new PongState(null, 400, 400, ball, leftPaddle, rightPaddle);

    let engine = new PongEngine();

    let outcome = engine.processEngineStep(state, 'engineStep');

    assert(outcome.newState.terminalState);
    assertEquals(outcome.utilities, [1, -1]);
});