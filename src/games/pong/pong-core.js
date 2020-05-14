// Gearbox compliant library for the pong game

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other_vector) {
        this.x = this.x + other_vector.x;
        this.y = this.y + other_vector.y;
    }
}

// Used to hold data for individual paddles in the PongState class
class Paddle {
    // leftPaddle is boolean: true is on left side, false if on right side
    constructor(width, height, leftPaddle, paddleEdgeOffset, maxVel) {
        let xPos = leftPaddle ? paddleEdgeOffset : width - paddleEdgeOffset;

        this.pos = new Vector(xPos, height / 2); // A coordinate of the center of the paddle
        this.target = height / 2;                // The y-coordinate the paddle is moving to
        this.velocity = 0;                       // The velocity of the paddle in the last frame
        this.maxVel = maxVel;                    // Maximum change in position in single step
    }

    // Ensures the paddle doesn't move faster than maxVelocity
    constrainVelocity(velocity) {
        if (velocity > this.maxVel) {
            return this.maxVel;
        } else if (velocity < -this.maxVel) {
            return -this.maxVel;
        } else {
            return velocity;
        }
    }

    // Move the paddle closer to its target, ensuring it doesn't move faster than maxVel
    updatePaddle() {
        let distToTarget = this.target - this.pos.y;

        let velocity = this.constrainVelocity(distToTarget);

        this.pos.y += velocity;
        this.velocity = velocity;
    }
}

class PongState extends RealTimeState {
    constructor(stepFreq, width, height, ballSize, ballVel, ballAngle, paddleWidth,
            paddleHeight, paddleEdgeOffset, leftPaddleMaxVel, rightPaddleMaxVel,
            randomSpinWeight, paddleSpinWeight) {

        super(stepFreq, false);

        // Dimensions of the arena
        this.width = width;
        this.height = height;

        // The side length for the square ball used in the game
        this.ballSize = ballSize;

        // Position of the center of the ball/velocity for the ball
        this.ballPos = new Vector(width / 2, height / 2);
        this.ballVel = new Vector(ballVel * Math.cos(ballAngle), ballVel * Math.sin(ballAngle));

        // Dimensions for both paddles (both are rectangles)
        this.paddleWidth = paddleWidth;
        this.paddleHeight = paddleHeight;

        // Parameters for how the y-velocity changes when the ball hits a paddle
        this.randomSpinWeight = randomSpinWeight;
        this.paddleSpinWeight = paddleSpinWeight;

        // Data about the pos, target, and maximum velocity of the paddles
        let leftPaddle = new Paddle(width, height, true, paddleEdgeOffset, leftPaddleMaxVel);
        let rightPaddle = new Paddle(width, height, false, paddleEdgeOffset, rightPaddleMaxVel);

        this.paddles = [leftPaddle, rightPaddle];
    }

    updatePaddle(paddleIndex) {
        this.paddles[paddleIndex].updatePaddle();
    }

    // General function for detecting all bounces
    // Outer limit should be the coordinate for when the ball collided with the outer shell
    // Inner limited should be the coordinate for the furthest into the object that still counts
    bounce(innerLimit, outerLimit, direction) {
        let lowerLimit = Math.min(innerLimit, outerLimit);
        let upperLimit = Math.max(innerLimit, outerLimit);

        if (this.ballPos[direction] >= lowerLimit && this.ballPos[direction] <= upperLimit) {
            this.ballVel[direction] *= -1;
            this.ballPos[direction] = outerLimit;

            return true;
        }

        return false;
    }

    // If the ball should bounce off the top, updates the state and returns true
    topBounce() {
        return this.bounce(-this.ballSize / 2, this.ballSize / 2, 'y');
    }

    // If the ball should bounce off the bottom, updates the state and returns true
    bottomBounce() {
        return this.bounce(this.height + this.ballSize / 2, 
            this.height - this.ballSize / 2, 'y');
    }

    // Returns true if the ball's y-coordinate falls within the paddle for a collision
    inRangePaddle(paddleIndex) {
        let y = this.paddles[paddleIndex].pos.y;
        let diff = this.paddleHeight / 2 + this.ballSize / 2;

        return this.ballPos.y < (y + diff) && this.ballPos.y > (y - diff);
    }

    // If the ball should bounce off the left paddle, updates the state and returns true
    leftPaddleBounce() {
        if (this.inRangePaddle(0)) {
            let leftPaddleEdge = this.paddles[0].pos.x + this.paddleWidth / 2;

            return this.bounce(leftPaddleEdge, leftPaddleEdge + this.ballSize / 2, 'x');
        }

        return false;
    }
    
    // If the ball should bounce off the right paddle, updates the state and returns true
    rightPaddleBounce() {
        if (this.inRangePaddle(1)) {
            let rightPaddleEdge = this.paddles[1].pos.x - this.paddleWidth / 2;

            return this.bounce(rightPaddleEdge, rightPaddleEdge - this.ballSize / 2, 'x');
        }

        return false;
    }

    spinBall(paddleIndex) {
        this.ballVel.y += this.randomSpinWeight * (Math.random() * 2 - 1);
        this.ballVel.y += this.paddleSpinWeight * this.paddles[paddleIndex].velocity
    }
}

class PongGameModerator extends RealTimeModerator {
    constructor(player1, player2, pongState) {
        super([player1, player2], new PongEngine(), pongState)
    }

    // Hide all actions made by the opponent, to prevent learning the opponent's targets
    hideOutcome(engineOutcome, forPlayerIndex) {
        return !engineOutcome.engineStep && engineOutcome.actionPlayerID != forPlayerIndex;
    }

    // Make the player on the right appear as if on the left, and hide the opponent's target
    transformState(state, forPlayerIndex) {
        if (forPlayerIndex == 1) {
            // Flip the x-coordinate
            state.ballPos.x = state.width - state.ballPos.x;

            // Reverse the x velocity
            state.ballVel.x *= -1;

            // Swap the paddles and their x-coordinates
            state.paddles = [state.paddles[1], state.paddles[0]];

            state.paddles[0].pos.x = state.width - state.paddles[0].pos.x;
            state.paddles[1].pos.x = state.width - state.paddles[1].pos.x;
        }

        // Hide the opponent's target
        state.paddles[1].target = 0;

        return state
    }

    // Let's both players view left-bounce actions as their own paddle bounce, consistent with
    // the transformed state
    transformEngineOutcome(engineAction, playerIndex) {
        if (playerIndex == 1) {
            if (engineAction == 'left-bounce') {
                engineAction = 'right-bounce';

            } else if (engineAction = 'right-bounce') {
                engineAction = 'left-bounce';
            }
        }

        return engineAction;
    }
}

class PongEngine extends RealTimeEngine {
    verifyValid(action, state) {
        return action >= 0 && action <= state.height;
    }

    getNextState(action, state, playerID) {
        let utilities = 0;

        state.paddles[playerID].target = action

        return this.reportOutcome(state, utilities);
    }

    step(state) {
        // Update the paddle positions first
        state.updatePaddle(0);
        state.updatePaddle(1);

        // Update the ball position based on its velocity
        state.ballPos.add(state.ballVel);

        // By default, no important changes occured
        let actions = [];

        // Detect and handle bounces on the top or bottom of the screen
        if (state.topBounce()) {
            actions.push('top-bounce');

        } else if(state.bottomBounce()) {
            actions.push('bottom-bounce');
        }

        // Detect and handle bounces on either left or right paddles
        if (state.leftPaddleBounce()) {
            actions.push('left-bounce');

            state.spinBall(0);

        } else if (state.rightPaddleBounce()) {
            actions.push('right-bounce');

            state.spinBall(1);
        }

        let utilities = 0;

        // Give a point to a player if the ball left the screen
        if (state.ballPos.x < state.ballSize / 2) {
            utilities = this.getUtilities(1);

            state.terminalState = true;

        } else if (state.ballPos.x > width - state.ballSize / 2) {
            utilities = this.getUtilities(0);

            state.terminalState = true;
        }

        return this.reportStepOutcome(actions, state, utilities);
    }
}

function runPong(player2 = new HumanPongPlayer(), player1 = new ComputerPongPlayer(), 
        stepFreq=15, width=400, height=400, ballSize = 20, ballVel = 5, ballAngle = 0,
        paddleWidth = 10, paddleHeight = 50, paddleEdgeOffset = 30, leftPaddleMaxVel = 10,
        rightPaddleMaxVel = 10, randomSpinWeight = 0, paddleSpinWeight = 0.2) {
    
    let pongState = new PongState(stepFreq, width, height, ballSize, ballVel, ballAngle,
                                    paddleWidth, paddleHeight, paddleEdgeOffset,
                                    leftPaddleMaxVel, rightPaddleMaxVel, randomSpinWeight,
                                    paddleSpinWeight);

    let mod = new PongGameModerator(player1, player2, pongState);

    mod.runGame();
}
