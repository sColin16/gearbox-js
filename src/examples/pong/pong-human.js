import { RealTimePlayer } from "../../core/players.js";

export class HumanPongPlayer extends RealTimePlayer {
    handleGameStart(moderator, state) {
        // Tracks if the game is in progress, and actions should be submitted
        this.gameRunning = true;

        // Draw rectanelges about their center
        rectMode(CENTER);

        // Add the canvas if it hasn't already been added
        if (document.getElementById('pong-gearbox-canvas') === null) {
            let canvas = createCanvas(state.width, state.height);

            canvas.parent('canvas-container')

            canvas.id('pong-gearbox-canvas')
        
            // Also, add an event listener to submit the new target when the mouse is moved
            window.addEventListener('mousemove', event => {
                if (this.gameRunning) {
                    this.takeAction(mouseY);
                }
            });
        }

        this.drawState(state);
    }

    handleOutcome(moderator, outcome) {
        let state = outcome.state;

        this.drawState(state);
    }

    handleGameEnd(moderator) {
        console.log('Player alerted that game is ending');

        this.gameRunning = false;
    }

    drawState(state) {
        // Draw a black background
        background(0, 0, 0);

        // Draw all the game parts in white
        fill(255, 255, 255);

        // Draw the left paddle (player's paddle)
        rect(state.leftPaddle.pos.x, state.leftPaddle.pos.y, state.leftPaddle.width, state.leftPaddle.height);

        // Draw the right paddle (oppoent's paddle)
        rect(state.rightPaddle.pos.x, state.rightPaddle.pos.y, state.leftPaddle.width, state.rightPaddle.height);

        // Draw the ball
        rect(state.ball.pos.x, state.ball.pos.y, state.ball.size, state.ball.size);
    }
}
