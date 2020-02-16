class HumanCountingPlayer extends RealTimePlayer {
    constructor() {
        super();

        this.plusButton = document.getElementById('plus-btn');
        this.subButton = document.getElementById('sub-btn');

        this.countDisplay = document.getElementById('count-display');
        this.outcomeDisplay = document.getElementById('outcome-display');

        this.plusButton.addEventListener('click', () => this.takeAction(1));
        this.subButton.addEventListener('click', () => this.takeAction(-1));
    }

    reportGameStart() {
        console.log('Human alerted that the game has started');
    }

    reportOutcome(outcome) {
        console.log(outcome);

        if(!outcome.validTurn) {
            if(outcome.actionPlayerID.ownAction) {
                this.outcomeDisplay.innerText = 'You made an invalid move';
            } else {
                this.outcomeDisplay.innerText = 'Your opponent made an invalid move';
            }
        }

        this.countDisplay.innerText = outcome.newState.count;

        if(outcome.utilities.personal === 1) {
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
