// Class that implements gearbox API to allow a human to play Nim in the browser
// This class must be bound to elements on the webpage
class HumanNimPlayer extends AsyncPlayer {
    constructor() {
        super();

        // Bind to the various buttons and display elements
        this.oneButton = document.getElementById('one-btn');
        this.twoButton = document.getElementById('two-btn');

        this.tokensDisplay = document.getElementById('tokens-display');
        this.outcomeDisplay = document.getElementById('outcome-display');
        this.moveHistoryDisplay = document.getElementById('move-history-display');

        // Add the event listeners to allow the player to make moves
        this.oneButton.addEventListener('click', () => this.takeAction(1));
        this.twoButton.addEventListener('click', () => this.takeAction(2));
    }

    // This lets the player do something before a turn starts, in this case enabled the buttons
    // And displaying the new total tokens
    startTurnActions(state) {
        this.oneButton.disabled = false;
        this.twoButton.disabled = false;
        this.tokensDisplay.innerText = state.numTokens;
    }

    // This lets the player do something right beforetheir turn ends, in this case disabling
    // the buttons, but advanced features could change other UI elements
    endTurnActions() {
        this.oneButton.disabled = true;
        this.twoButton.disabled = true;
    }

    reportGameStart() {
        console.log('Human alerted that the game has started');
    }

    reportOutcome(outcome) {
        // Report if the action was invalid, return early
        if(!outcome.validTurn) {
            if(outcome.actionPlayerID.ownAction) {
                this.outcomeDisplay.innerText = 'You made an invalid move';
            } else {
                this.outcomeDisplay.innerText = 'Your opponent made an invalid move';
            }

            return;
        }

        // Let the player know which moves were made
        let moveRecord = document.createElement('p');

        if (outcome.actionPlayerID.ownAction) {
            moveRecord.innerText = `You took ${outcome.action} tokens`;
        } else {
            moveRecord.innerText = `Opponent took ${outcome.action} tokens`;
        }

        this.moveHistoryDisplay.appendChild(moveRecord);

        // Update the number of tokens left
        this.tokensDisplay.innerText = outcome.newState.numTokens;

        // Report if the game is over
        if(outcome.utilities.personal === 1){
            this.outcomeDisplay.innerText = 'You win!';

        } else if (outcome.utilities.personal === -1) {
            this.outcomeDisplay.innerText = 'You lose!';

        } else {
            this.outcomeDisplay.innerText = '';
        }
    }

    reportGameEnd() {
        console.log('Human alerted that game has ended');
    }
}
