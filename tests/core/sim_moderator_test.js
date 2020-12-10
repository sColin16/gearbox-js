import {
    assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { stub } from "https://deno.land/x/mock/mod.ts"
import { SimAction } from "../../src/containers/actions.js";
import { PlayerOutcomeField } from "../../src/containers/outcomes.js";
import { SimValidity } from "../../src/containers/validities.js";
import { SimTransformCollection, SimModerator } from "../../src/core/moderators.js";
import { Player } from "../../src/core/players.js";
import { SimEngine } from "../../src/core/engines.js";
import { SimState} from "../../src/containers/states.js"

Deno.test("PlayerOutcomeField fromArray creates own instance correctly", () => {
    const initialArray = [1, 2, 3, 4, 5];
    const expectedObject = new PlayerOutcomeField(2, [1, 3, 4, 5]);

    const actualObject = PlayerOutcomeField.fromArray(initialArray, 1);

    assertEquals(expectedObject, actualObject);
});

Deno.test("SimTransformCollection transforms action representation into PlayerOutcomeField instance", () => {
    const originalAction = new SimAction([1, 2, 3, 4, 5]);
    const expectedTransformedAction = new SimAction(new PlayerOutcomeField(4, [1, 2, 3, 5]));

    const actualTransformedAction = SimTransformCollection.transformSendAction(originalAction, 3);

    assertEquals(expectedTransformedAction, actualTransformedAction);
});

Deno.test("SimTransformCollection transforms individual validity into PlayerOutcomeField instance", () => {
    const originalValidity = new SimValidity(false, [true, true, false, true, false]);
    const expectedTransformedValidity = new SimValidity(false, new PlayerOutcomeField(true, [true, false, true, false]));

    const actualTransformedValidity = SimTransformCollection.transformValidity(originalValidity, 0);

    assertEquals(expectedTransformedValidity, actualTransformedValidity);
});

Deno.test("SimModerator runTurn handles flow correctly", async () => {
    let player1 = new Player();
    let player2 = new Player();
    let player3 = new Player();

    let engine = new SimEngine();
    let state = new SimState(3, 1, false);
    let moderator = new SimModerator([player1, player2, player3], engine, state);

    let handleActionRequest1 = stub(player1, 'handleActionRequest', ['action1']);
    let handleActionRequest2 = stub(player2, 'handleActionRequest', ['action2']); 
    let handleActionRequest3 = stub(player3, 'handleActionRequest', ['action3']);

    let processAndReport = stub(moderator, 'processAndReport');

    await moderator.runTurn();

    // Make sure the right player has it's handleActionRequest function called
    assertEquals(handleActionRequest1.calls.length, 1);
    assertEquals(handleActionRequest2.calls.length, 1);
    assertEquals(handleActionRequest3.calls.length, 1);

    // Make sure processAndReport is called with the right action
    assertEquals(processAndReport.calls.length, 1);
    assertEquals(processAndReport.calls[0].args[0], new SimAction(['action1', 'action2', 'action3']));
});