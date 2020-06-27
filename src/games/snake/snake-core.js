// A snake game that can be easily displayed with HTML5 canvas

// This state is more complex, and includes some methods
// Note that these methods are getters and setters, but don't advance the state - because
// that's the engine's job.
class SnakeState extends RealTimeState {
    // Constants for what each value in the grid means
    static EMPTY = 0;
    static SNAKE = 1;
    static FOOD  = 2;

    constructor(stepFreq, terminalState, direction, gridSize, startX, startY, numFood) {
        super(stepFreq, terminalState);

        this.direction = direction;
        this.gridSize = gridSize;

        // Creates a 2D array of dimensions gridSize x gridSize
        this.grid = Array.from({length: gridSize}, () => Array(gridSize).fill(SnakeState.EMPTY));

        // Store the snake as a queue, where the head is the back, tail is the front
        // That way, we can pop off the tail, push on a new head
        this.snake = new Queue();
        this.updateHead(startX, startY);

        // Put the correct amount of food onto the board
        for (let i = 0; i < numFood; i++) {
            this.addFood();    
        }
    }

    // Helper function to update the position of the snake's head on every step
    updateHead(newHeadX, newHeadY) {
        this.headX = newHeadX;
        this.headY = newHeadY;

        this.snake.enqueue({x: newHeadX, y: newHeadY});

        this.setTile(newHeadX, newHeadY, SnakeState.SNAKE);
    }

    // Helper function to remove the snake's tail if it didn't eat in that step
    // Returns the x,y coordinates so player know the coordinates that were changed
    removeTail() {
        let tail = this.snake.dequeue();

        this.setTile(tail.x, tail.y, SnakeState.EMPTY);

        return {tailX: tail.x, tailY: tail.y};
    }

    // Places food in a random empty location
    // Also returns the x,y coordinates so the player knows the coordinates changed
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
    
    // Getters and setters for the grid, so calls don't have to worry about x or y first
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
    static VALID_ACTIONS = ['UP', 'DOWN', 'RIGHT', 'LEFT'];
    static DIRECTIONS = {        // Definitions of change to positions for each possible action
        'UP':    {x:  0, y: -1},
        'DOWN':  {x:  0, y:  1},
        'RIGHT': {x:  1, y:  0},
        'LEFT':  {x: -1, y:  0}
    }

    // Also just use the default verifyValid action function
    constructor() {
        super(SnakeEngine.VALID_ACTIONS);
    }

    // Updating the state based on the action is purely a matter of changing the direction
    processPlayerAction(state, action) {
        // Deep clone the state using the Lodash library
        let utilities = 0; // No utility for changing direction

        state.direction = action.actionRepr;

        return this.outcome(utilities, state, undefined); // No stateDelta for changing dir.
    }

    // Steping is more involved, updating positions, heads, tails, and food
    processEngineStep(state, action) {
        let stateDelta = []; // Holds an array of objects marking all x, y coordinate updated

        // The change in the coordinates of the head, based on the direction facing
        let deltaX = SnakeEngine.DIRECTIONS[state.direction].x;
        let deltaY = SnakeEngine.DIRECTIONS[state.direction].y;

        let newHeadX = state.headX + deltaX;
        let newHeadY = state.headY + deltaY;

        let utilities = 0;

        if (this.isGameOverPos(newHeadX, newHeadY, state)) {
            state.terminalState = true;

        } else {
            if (state.getTile(newHeadX, newHeadY) == SnakeState.FOOD) {
                utilities = [1]; // Get 1 utility if food was eaten

                let {foodX, foodY} = state.addFood();
                stateDelta.push({x: foodX, y: foodY});

            } else {
                let {tailX, tailY} = state.removeTail();
                stateDelta.push({x: tailX, y:tailY});
            }

            // Update the head position last to avoid overwriting the food position too early
            state.updateHead(newHeadX, newHeadY);
            stateDelta.push({x: newHeadX, y: newHeadY});
        }

        return this.outcome(utilities, state, stateDelta);
    }

    // Helper functions to determine is game over has occrued
    isGameOverPos(x, y, state) {
        return !this.isInBounds(x, y, state) || state.getTile(x, y) === SnakeState.SNAKE;
    }

    isInBounds(x, y, state) {
        return x >= 0 && x < state.gridSize && y >=0 && y < state.gridSize;
    }
}

function runSnake(player = new HumanSnakePlayer(600), stepFreq = 10, gridSize = 20,
    numFood = 1) {
    
    mod = new SnakeGameModerator(player, stepFreq, gridSize, numFood);

    mod.runGame();
}
