class HumanSnakePlayer extends RealTimePlayer {
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

    reportGameStart(state) {
        this.tileWidth = this.canvasSize / state.gridSize;

        let canvas = createCanvas(this.canvasSize, this.canvasSize);
        canvas.parent('canvas-container');

        this.drawState(state);

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

    reportOutcome(outcome) {
        if(outcome.engineStep) {
            for (let i = 0; i < outcome.action.length; i++) {
                this.drawTile(outcome.action[i], outcome.newState);
            }

            this.scoreDisplay.innerText = outcome.utilities.personal; 
        }
    }

    reportGameEnd() {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(this.canvasSize / 6);
        text('GAME OVER', this.canvasSize / 2, this.canvasSize / 2);
    }

    drawState(state) {
        for(let i = 0; i < state.gridSize; i++) {
            for(let j = 0; j < state.gridSize; j++) {
                this.drawTile({x: i, y: j}, state);
            }
        }
    }

    drawTile(coordinate, state) {
        let x = coordinate.x;
        let y = coordinate.y;

        fill(HumanSnakePlayer.COLORS[state.getTile(x, y)]);
        rect(x * this.tileWidth, y * this.tileWidth, this.tileWidth, this.tileWidth);
    }
}
