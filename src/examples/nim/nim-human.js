class HumanNimPlayer extends Player {
    constructor() {
        super();

        this.action = undefined;

        this.oneButton = document.getElementById('one-btn');
        this.twoButton = document.getElementById('two-btn');

        this.tokensDisplay = document.getElementById('tokens-display');
        this.outcomeDisplay = document.getElementById('outcome-display');
        this.moveHistoryDisplay = document.getElementById('move-history-display');

        this.oneButton.addEventListener('click', () => this.action = 1);
        this.twoButton.addEventListener('click', () => this.action = 2);
    }

    async getAction(state) {
        console.log(state);

        return new Promise(async (resolve, reject) => {
            this.action = undefined;

            this.tokensDisplay.innerText = state.tokensLeft;

            while(typeof this.action === 'undefined') {
                await delay(100);
            }

            resolve(this.action);

        });
    }
    
    reportGameState() {
        console.log('Human alerted that the game has started');
    }

    reportOutcome(outcome) {
        console.log(outcome);

        // Report if the action was invalid, return early
        if(!outcome.validTurn) {
            if(outcome.playerID.ownAction) {
                this.outcomeDisplay.innerText = 'You made an invalid move';
            } else {
                this.outcomeDisplay.innerText = 'Your opponent made an invalid move';
            }

            return;
        }

        // Let the player know which moves were made
        let moveRecord = document.createElement('p');

        if (outcome.playerID.ownAction) {
            moveRecord.innerText = `You took ${outcome.action} tokens`;
        } else {
            moveRecord.innerText = `Opponent took ${outcome.action} tokens`;
        }

        this.moveHistoryDisplay.appendChild(moveRecord);

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
