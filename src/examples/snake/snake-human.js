import { RealTimePlayer } from "../../core/players.js";
import { SnakeState } from "../../games/snake.js";

// This class implements the gearbox API to allow a human to play snake in the browser
// This class must be bound to the score box, but creates its own canvas

export class HumanSnakePlayer extends RealTimePlayer {
    // The colors that each type of square is colored
    static COLORS = {
        [SnakeState.EMPTY]: color(0,   0,   0),
        [SnakeState.SNAKE]: color(0,   255, 0),
        [SnakeState.FOOD]:  color(255, 0,   0),
    }

    constructor(canvasSize) {
        super();

        this.canvasSize = canvasSize;

        this.scoreDisplay = document.getElementById('score-display');
    }

    // Requires more work to set up everything
    handleGameStart(moderator, state) {
        // Don't know game size until we recieve the state object
        this.tileWidth = this.canvasSize / state.gridSize;

        // Create the canvas object
        let canvas = createCanvas(this.canvasSize, this.canvasSize);
        canvas.parent('canvas-container');

        // Draw the entire state (only this time)
        this.drawState(state);

        // Bind all the event listeners (this probably could have been done in constructor)
        window.addEventListener('keydown', event => {
            switch (event.key) {
                case "ArrowUp":
                case "w":
                    this.takeAction('UP');
                    break;
                case "ArrowDown":
                case "s":
                    this.takeAction('DOWN');
                    break;
                case "ArrowRight":
                case "d": 
                    this.takeAction('RIGHT');
                    break;
                case "ArrowLeft":
                case "a":
                    this.takeAction('LEFT');
                    break;
            }
        });
    }

    // Update the tiles that were changed, and the score display
    handleOutcome(moderator, outcome) {
        if(outcome.action.engineStep) {
            for (let i = 0; i < outcome.stateDelta.length; i++) {
                this.drawTile(outcome.stateDelta[i], outcome.state);
            }

            this.scoreDisplay.innerText = int(this.scoreDisplay.innerText) 
                + outcome.utilities.personal; 
        }
    }

    // Show a big "Game Over" text on the canvas!
    handleGameEnd(moderator) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(this.canvasSize / 6);
        text('GAME OVER', this.canvasSize / 2, this.canvasSize / 2);
    }

    // Draw every individual tile
    drawState(state) {
        for(let i = 0; i < state.gridSize; i++) {
            for(let j = 0; j < state.gridSize; j++) {
                this.drawTile({x: i, y: j}, state);
            }
        }
    }

    // Draw a single tile of the game
    drawTile(coordinate, state) {
        let x = coordinate.x;
        let y = coordinate.y;

        fill(HumanSnakePlayer.COLORS[state.getTile(x, y)]);
        rect(x * this.tileWidth, y * this.tileWidth, this.tileWidth, this.tileWidth);
    }
}
