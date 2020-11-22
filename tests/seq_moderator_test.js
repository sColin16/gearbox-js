import {
    assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { stub } from "https://deno.land/x/mock/mod.ts"
import { PlayerIDField, SeqAction } from "../src/containers/actions.js";
import { SeqState } from "../src/containers/states.js";
import { Engine } from "../src/core/engines.js";
import { SeqModerator, SeqTransformCollection } from "../src/core/moderators.js";
import { Player } from "../src/core/players.js";

Deno.test("SeqTransformCollection adjustPlayerID self ID", () => {
    let expected = new PlayerIDField(true, undefined);
    let actual = SeqTransformCollection.adjustPlayerID(3, 3);

    assertEquals(actual, expected);
});

Deno.test("SeqTransformCollection adjustPlayerID lower forPlayerID", () => {
    let expected = new PlayerIDField(false, 4);
    let actual = SeqTransformCollection.adjustPlayerID(2, 5);

    assertEquals(actual, expected);
});

Deno.test("SeqTransformCollection adjustPlayerID higher forPlayerID", () => {
    let expected = new PlayerIDField(false, 3);
    let actual = SeqTransformCollection.adjustPlayerID(6, 3);

    assertEquals(actual, expected);
});

Deno.test("SeqTransformCollection transformAction correctly transforms action playerID", () => {
    let originalAction = new SeqAction('a', 5);
    let expectedTransformedAction = new SeqAction('a', new PlayerIDField(false, 4));

    let actualTransformedAction = SeqTransformCollection.transformSendAction(originalAction, 2);

    assertEquals(expectedTransformedAction, actualTransformedAction);
});

Deno.test("SeqTransformCollection transformState correctly transforms state's turn", () => {
    let originalState = new SeqState(10, 3, false);
    let expectedTransformedState = new SeqState(10, new PlayerIDField(true, undefined), false);

    let actualTransformedState = SeqTransformCollection.transformState(originalState, 3);

    assertEquals(expectedTransformedState, actualTransformedState);
});

Deno.test("SeqModerator runTurn handles flow correctly", async () => {
    let player1 = new Player();
    let player2 = new Player();
    let player3 = new Player();

    let engine = new Engine();
    let state = new SeqState(3, 1, false);
    let moderator = new SeqModerator([player1, player2, player3], engine, state);

    let handleActionRequest1 = stub(player1, 'handleActionRequest');
    let handleActionRequest2 = stub(player2, 'handleActionRequest', ['myAction']); 
    let handleActionRequest3 = stub(player3, 'handleActionRequest');

    let processAndReport = stub(moderator, 'processAndReport');

    await moderator.runTurn();

    // Make sure the right player has it's handleActionRequest function called
    assertEquals(handleActionRequest1.calls.length, 0);
    assertEquals(handleActionRequest2.calls.length, 1);
    assertEquals(handleActionRequest3.calls.length, 0);

    // Make sure processAndReport is called with the right action
    assertEquals(processAndReport.calls.length, 1);
    assertEquals(processAndReport.calls[0].args[0], new SeqAction('myAction', 1));
});