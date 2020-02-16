// A randomly playing count player

class ComputerCountingPlayer extends RealTimePlayer {
    constructor() {
        super();
    }

    reportGameStart() {
        console.log('Computer alrted game is starting');

        setInterval(() => {this.takeAction(-1)}, 1000);
    }

    reportOutcome(outcome) {
        //console.log('Computer reported outcome', outcome);
    }

    reportGameEnd() {
        console.log('Computer alerted game is ending');
    }
}
