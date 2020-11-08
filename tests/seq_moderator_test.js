import { PlayerIDField, SeqAction } from "../src/containers/actions.js";
import { PlayerOutcome } from "../src/containers/outcomes.js";
import { State } from "../src/containers/states.js";
import { SeqModerator, SeqTransformCollection } from "../src/core/moderators.js";
import { Player } from "../src/core/players.js";

Deno.test("SeqModerator adjustPlayerID self ID", () => {
    let expected = new PlayerIDField(true, undefined);
    let actual = SeqModerator.adjustPlayerID(3, 3);

    assertEquals(actual, expected);
});

Deno.test("SeqModerator adjustPlayerID lower forPlayerID", () => {
    let expected = new PlayerIDField(false, 4);
    let actual = SeqModerator.adjustPlayerID(2, 5);

    assertEquals(actual, expected);
});

Deno.test("SeqModerator adjustPlayerID higher forPlayerID", () => {
    let expected = new PlayerIDField(false, 3);
    let actual = SeqModerator.adjustPlayerID(6, 3);

    assertEquals(actual, expected);
});

Deno.test("SeqTransformCollection transformAction correctly transforms action playerID", () => {
    let originalAction = new SeqAction('a', 5);
    let expectedTransformedAction = new SeqAction('a', new PlayerIDField(false, 4));

    let actualTransformedAction = SeqTransformCollection.transformSendAction(originalAction, 2);

    assertEquals(expectedTransformedAction, actualTransformedAction);
});

Deno.test("SeqTransformCollection transformState correctly transforms state's turn", () => {
    let originalState = new State(10, 3, false);
    let expectedTransformedState = new State(10, new PlayerIDField(true, undefined), false);

    let actualTransformedState = SeqTransformCollection.transformState(originalState, 3);

    assertEquals(expectedTransformedState, actualTransformedState);
});