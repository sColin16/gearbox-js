// A snake game that can be easily displayed with HTML5 canvas

class SnakeState extends RealTimeState {
    static EMPTY = 0;
    static SNAKE = 1;
    static FOOD  = 2;

    constructor(stepFreq, terminalState, direction, gridSize, startX, startY, numFood) {
        super(stepFreq, terminalState);

        this.direction = direction;
        this.gridSize = gridSize;

        this.grid = new Array(gridSize); 

        for (let i = 0; i < gridSize; i++) {
            this.grid[i] = new Array(gridSize).fill(SnakeState.EMPTY)
        }

        this.snake = new Queue();
        this.updateHead(startX, startY);

        for (let i = 0; i < numFood; i++) {
            this.addFood();    
        }
    }

    copy() {
        let copyState = new SnakeState(this.stepFreq, this.terminalState, this.direction,
            this.gridSize, this.headX, this.headY, 0);

        copyState.grid = new Array(this.gridSize);

        for(let i = 0; i < this.gridSize; i++) {
            copyState.grid[i] = [];

            for(let j = 0; j < this.gridSize; j++) {
                copyState.grid[i][j] = this.grid[i][j];
            }
        }

        copyState.snake = this.snake.copy();

        return copyState;
    }

    updateHead(newHeadX, newHeadY) {
        this.headX = newHeadX;
        this.headY = newHeadY;

        this.snake.enqueue({x: newHeadX, y: newHeadY});

        this.setTile(newHeadX, newHeadY, SnakeState.SNAKE);
    }

    removeTail() {
        let tail = this.snake.dequeue();

        this.setTile(tail.x, tail.y, SnakeState.EMPTY);

        return {tailX: tail.x, tailY: tail.y};
    }

    addFood() {
        while (true) {
            var foodX = Math.floor(this.gridSize * Math.random());
            var foodY = Math.floor(this.gridSize * Math.random());

            if(this.getTile(foodX, foodY) === SnakeState.EMPTY) {
                this.setTile(foodX, foodY, SnakeState.FOOD);

                return {foodX, foodY};
            }
        }
    }

    getTile(x, y) {
        return this.grid[y][x];
    }

    setTile(x, y, value) {
        this.grid[y][x] = value;
    }
}

class SnakeGameModerator extends RealTimeModerator {
    constructor(player, stepFreq, gridSize, numFood) {
        let middleCoordinate = Math.floor(gridSize/2);

        super([player], new SnakeEngine(), new SnakeState(stepFreq, false, 'UP', gridSize,
            middleCoordinate, middleCoordinate, numFood));
    }
}

class SnakeEngine extends RealTimeEngine {
    static DIRECTIONS = {
        'UP':    {x:  0, y: -1},
        'DOWN':  {x:  0, y:  1},
        'RIGHT': {x:  1, y:  0},
        'LEFT':  {x: -1, y:  0}
    }

    constructor() {
        super(1);
    }

    verifyValid(action, state, playerID) {
        return action === 'UP' || action === 'DOWN' || action === 'LEFT' || action === 'RIGHT';
    }

    getNextState(action, state, playerID) {
        let newState = state.copy();
        let utilities = [state.snake.size()]; // Never any utility to changing direction

        newState.direction = action;

        return {'newState': newState, 'utilities': utilities}
    }

    step(state) {
        let action = []; // Holds an array of objects marking all x, y coordinate updated
        let newState = state.copy();

        let deltaX = SnakeEngine.DIRECTIONS[state.direction].x;
        let deltaY = SnakeEngine.DIRECTIONS[state.direction].y;

        let newHeadX = state.headX + deltaX;
        let newHeadY = state.headY + deltaY;

        if (this.isGameOverPos(newHeadX, newHeadY, state)) {
            newState.terminalState = true;

        } else {
            newState.updateHead(newHeadX, newHeadY);
            action.push({x: newHeadX, y: newHeadY});

            if (state.getTile(newHeadX, newHeadY) == SnakeState.FOOD) {
                let {foodX, foodY} = newState.addFood();
                action.push({x: foodX, y: foodY});

            } else {
                let {tailX, tailY} = newState.removeTail();
                action.push({x: tailX, y:tailY});

            }
        }
 
        let utilities = [state.snake.size()];

        return this.reportStepOutcome(action, newState, utilities);
    }

    isGameOverPos(x, y, state) {
        return !this.isInBounds(x, y, state) || state.getTile(x, y) === SnakeState.SNAKE;
    }

    isInBounds(x, y, state) {
        return x >= 0 && x < state.gridSize && y >=0 && y < state.gridSize;
    }
}
