

class HumanPongPlayer extends RealTimePlayer {
    reportGameStart(state) {
        // Tracks if the game is in progress, and actions should be submitted
        this.gameRunning = true;

        // Draw rectanelges about their center
        rectMode(CENTER);

        // Add the canvas if it hasn't already been added
        if (document.getElementById('pong-gearbox-canvas') === null) {
            let canvas = createCanvas(state.width, state.height);

            canvas.parent('canvas-container')

            canvas.id('pong-gearbox-canvas')
        
            // Also, add an event listener to submit the new target when the mouseis moved
            window.addEventListener('mousemove', event => {
                if (this.gameRunning) {
                    this.takeAction(mouseY);
                }
            });
        }

        this.drawState(state);
    }

    reportOutcome(outcome) {
        let state = outcome.newState;

        this.drawState(state);
    }

    reportGameEnd() {
        console.log('Player alerted that game is ending');

        this.gameRunning = false;
    }

    drawState(state) {
        let paddleWidth = state.paddleWidth;
        let paddleHeight = state.paddleHeight;

        // Draw a black background
        background(0, 0, 0);

        // Draw all the game parts in white
        fill(255, 255, 255);

        // Draw the left paddle (player's paddle)
        rect(state.paddles[0].pos.x, state.paddles[0].pos.y, paddleWidth, paddleHeight);

        // Draw the right paddle (oppoent's paddle)
        rect(state.paddles[1].pos.x, state.paddles[1].pos.y, paddleWidth, paddleHeight);

        // Draw the ball
        rect(state.ballPos.x, state.ballPos.y, state.ballSize, state.ballSize);
    }
}
