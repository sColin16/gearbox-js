import {
    assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { stub } from "https://deno.land/x/mock/mod.ts"
import { RealTimeAction } from "../../src/containers/actions.js";
import { RealTimeState } from "../../src/containers/states.js";
import { RealTimeEngine } from "../../src/core/engines.js";
import { RealTimeModerator } from "../../src/core/moderators.js";
import { RealTimePlayer } from "../../src/core/players.js";

Deno.test("RealTimeModerator startGame alerts player of game start and binds moderator", () => {
    const testPlayerA = new RealTimePlayer();
    const testPlayerB = new RealTimePlayer();
    const testState = new RealTimeState(2, false, 50);
    const testModerator = new RealTimeModerator([testPlayerA, testPlayerB], new RealTimeEngine(), testState);

    const startGameMockA = stub(testPlayerA, 'handleGameStart');
    const startGameMockB = stub(testPlayerB, 'handleGameStart');

    const bindModeratorMockA = stub(testPlayerA, 'bindModerator');
    const bindModeratorMockB = stub(testPlayerB, 'bindModerator');

    testModerator.startGame();

    // Check that both players received a "handleGameStart" signal
    assertEquals(startGameMockA.calls.length, 1);
    assertEquals(startGameMockB.calls.length, 1);

    // Check that boath players had the moderator binded to them
    assertEquals(bindModeratorMockA.calls.length, 1);
    assertEquals(bindModeratorMockB.calls.length, 1);
});

Deno.test("RealTimeModerator runGame has correct flow", async () => {
    const testPlayerA = new RealTimePlayer();
    const testPlayerB = new RealTimePlayer();
    const testState = new RealTimeState(2, false, 50);
    const testModerator = new RealTimeModerator([testPlayerA, testPlayerB], new RealTimeEngine(), testState);

    const startGameMock = stub(testModerator, 'startGame');
    const conditionalRescheduleMock = stub(testModerator, 'conditionalReschedule');
    const actionProcessMock = stub(testModerator, 'processActionQueue');

    await testModerator.runGame();

    // Check that the game is started (players alerted of game start)
    assertEquals(startGameMock.calls.length, 1);
    
    // Check that the first engine step is scheduled
    assertEquals(conditionalRescheduleMock.calls.length, 1);
    assertEquals(conditionalRescheduleMock.calls[0].args, [testModerator.engineStep, 50]);

    // Check that the first set of actions is processed
    assertEquals(actionProcessMock.calls.length, 1);
});

Deno.test("RealTimeModerator engineStep has correct flow", () => {
    const testState = new RealTimeState(0, false, 50)
    const testModerator = new RealTimeModerator([], new RealTimeEngine, testState);

    const processReportMock = stub(testModerator, 'processAndReport');
    const conditionalRescheduleMock = stub(testModerator, 'conditionalReschedule');

    const expectedEngineAction = new RealTimeAction('engineStep', undefined, true);

    testModerator.engineStep();

    // Check that processAndReport is called with the correct arguments
    assertEquals(processReportMock.calls.length, 1);
    assertEquals(processReportMock.calls[0].args[0], expectedEngineAction);

    // Check that the next engine step is scheduled
    assertEquals(conditionalRescheduleMock.calls.length, 1);
    assertEquals(conditionalRescheduleMock.calls[0].args, [testModerator.engineStep, 50]);
});

Deno.test("RealTimeModerator processActionQueue stops processing after processing all actions originally in queue", () => {
    const testPlayerA = new RealTimePlayer();
    const testPlayerB = new RealTimePlayer();
    const testState = new RealTimeState(2, false, 50)
    const testModerator = new RealTimeModerator([testPlayerA, testPlayerB], new RealTimeEngine, testState);

    // Don't allow action processing to be rescheduled, or gmae starts to be handled
    stub(testModerator, 'conditionalReschedule');
    stub(testPlayerA, 'handleGameStart');
    stub(testPlayerB, 'handleGameStart');

    testModerator.startGame();

    // Submit 2 actions to the queue (use player array to submit action through pipe)
    testPlayerB.takeAction('processAction1');
    testPlayerB.takeAction('processAction2');

    // processAndReport submits a new action to the queue (which shouldn't be processed)
    const processReportMock = stub(testModerator, 'processAndReport', () => {
        testPlayerA.takeAction('extraAction');
    });

    testModerator.processActionQueue();

    const expectedProcessedActionA = new RealTimeAction('processAction1', 1, false);
    const expectedProcessedActionB = new RealTimeAction('processAction2', 1, false);
    const expectedExtraAction = new RealTimeAction('extraAction', 0, false);

    // Check that the original actions were processed
    assertEquals(processReportMock.calls.length, 2);
    assertEquals(processReportMock.calls[0].args[0], expectedProcessedActionA);
    assertEquals(processReportMock.calls[1].args[0], expectedProcessedActionB);

    // Check that the two extra actions were not processed
    assertEquals(testModerator.actionQueue.items, [expectedExtraAction, expectedExtraAction])
});

Deno.test("RealTimeModerator processActionQueue stops processing on terminal state", () => {
    const testPlayerA = new RealTimePlayer();
    const testPlayerB = new RealTimePlayer();
    const testState = new RealTimeState(2, false, 50)
    const testModerator = new RealTimeModerator([testPlayerA, testPlayerB], new RealTimeEngine, testState);

    // Mock out the handleGameStart function so it doens't have to be defined
    stub(testPlayerA, 'handleGameStart');
    stub(testPlayerB, 'handleGameStart');

    testModerator.startGame();

    // Submit 2 actions to the queue
    testPlayerB.takeAction('processAction');
    testPlayerA.takeAction('extraAction');

    // processAndReport causes a terminal state
    const processReportMock = stub(testModerator, 'processAndReport', () => {
        testModerator.state = new RealTimeState(2, true, 50);
    });

    testModerator.processActionQueue();

    const expectedProcessedAction = new RealTimeAction('processAction', 1, false);

    // Assert that only the first actions was processed
    assertEquals(processReportMock.calls.length, 1);
    assertEquals(processReportMock.calls[0].args[0], expectedProcessedAction);
});

Deno.test("RealTimeModerator conditionalReschedule reschedules step on non-terminal state", () => {
    const testState = new RealTimeState(0, false, 50)
    const testModerator = new RealTimeModerator([], new RealTimeEngine, testState);

    let setTimeoutMock = stub(window, 'setTimeout');

    testModerator.conditionalReschedule(testModerator.engineStep, 100);

    // Restore the global mock so that future tests don't fail
    setTimeoutMock.restore();

    // Check that the engine step was scheduled again
    assertEquals(setTimeoutMock.calls.length, 1);
    assertEquals(setTimeoutMock.calls[0].args, [testModerator.engineStep, 100]);
});

Deno.test("RealTimeModerator conditionalReschedule ends game on non-terminal state", () => {
    const testState = new RealTimeState(0, true, 50)
    const testModerator = new RealTimeModerator([], new RealTimeEngine, testState);

    let clearTimeoutMock = stub(window, 'clearTimeout');

    testModerator.conditionalReschedule(testModerator.engineStep, 100);

    // Restore the global mock so that future tests don't fail
    clearTimeoutMock.restore();

    // Check that both timeouts were cleared
    assertEquals(clearTimeoutMock.calls.length, 2);
    assertEquals(clearTimeoutMock.calls[0].args[0], testModerator.engineStep.timeout);
    assertEquals(clearTimeoutMock.calls[1].args[0], testModerator.processActionQueue.timeout);
});

Deno.test("RealTimeModerator handleAction adds action to queue", () => {
    const testPlayerA = new RealTimePlayer();
    const testPlayerB = new RealTimePlayer();
    const testModerator = new RealTimeModerator([testPlayerA, testPlayerB], new RealTimeEngine(), new RealTimeState());

    // Mock out the handleGameStart function so it doens't have to be defined
    stub(testPlayerA, 'handleGameStart');
    stub(testPlayerB, 'handleGameStart');

    testModerator.startGame();

    testPlayerB.takeAction('testAction');

    // Check that the function wraps the action into a RealTimeAction instance
    const expectedAction = new RealTimeAction('testAction', 1, false);
    const actualAction = testModerator.actionQueue.dequeue();

    assertEquals(expectedAction, actualAction);
});