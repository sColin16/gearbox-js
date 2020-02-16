class HumanNimPlayer extends AsyncPlayer {
    constructor() {
        super();

        this.oneButton = document.getElementById('one-btn');
        this.twoButton = document.getElementById('two-btn');

        this.tokensDisplay = document.getElementById('tokens-display');
        this.outcomeDisplay = document.getElementById('outcome-display');
        this.moveHistoryDisplay = document.getElementById('move-history-display');

        this.oneButton.addEventListener('click', () => this.takeAction(1));
        this.twoButton.addEventListener('click', () => this.takeAction(2));
    }

    startTurnActions(state) {
        this.oneButton.disabled = false;
        this.twoButton.disabled = false;
        this.tokensDisplay.innerText = state.tokensLeft;
    }

    endTurnActions() {
        this.oneButton.disabled = true;
        this.twoButton.disabled = true;
        console.log('Could update and say something like waiting for other players now...')
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
        this.tokensDisplay.innerText = outcome.newState.tokensLeft;

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
