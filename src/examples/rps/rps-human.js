// This class must be coupled to elements on the webpage
class HumanRPSPlayer extends AsyncPlayer {
    constructor() {
        super();
        this.action = undefined;  // Flag set to indicate that a move has been made

        this.rockButton = document.getElementById('rock-btn');
        this.paperButton = document.getElementById('paper-btn');
        this.scissorsButton = document.getElementById('scissors-btn');

        this.p1ActionDisplay = document.getElementById('p1-action-display');
        this.p2ActionDisplay = document.getElementById('p2-action-display');
        this.outcomeDisplay = document.getElementById('outcome-display');

        this.rockButton.addEventListener('click', () => this.takeAction('R'));
        this.paperButton.addEventListener('click', () => this.takeAction('P'));
        this.scissorsButton.addEventListener('click', () => this.takeAction('S'));
    }

    reportGameStart() {
        console.log('Human alerted that game is starting');
    }

    reportOutcome(outcome) {
        console.log(outcome);

        if (!outcome.validTurn) {
            if(!outcome.actionValidities.personal) {
                this.outcomeDisplay.innerText = 'You made an invalid move';
            } else {
                this.outcomeDisplay.innerText = 'An opponent made an invalid move';
            }

            return;
        }

        this.p1ActionDisplay.innerText = 'You played ' + outcome.actions.personal;
        this.p2ActionDisplay.innerText = 'Opponent played ' + outcome.actions.opponents[0];

        if(outcome.utilities.personal === 1) {
            this.outcomeDisplay.innerText = 'You win!';
        } else if (outcome.utilities.personal === 0) {
            this.outcomeDisplay.innerText = 'It\'s a tie!';
        } else {
            this.outcomeDisplay.innerText = 'You lose!';
        }
    }

    reportGameEnd() {
        console.log('Human alerted that game has ended');
    }
}
