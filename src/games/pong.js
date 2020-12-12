import { RealTimeState } from "../containers/states.js";
import { RealTimeModerator, TransformCollection } from "../core/moderators.js";
import { RealTimeEngine } from "../core/engines.js";

/**
 * Simple class to do 2D vector math with
 * @param {number} x - magnitude of the x component of the vector
 * @param {number} y - magnitude of the y component of the vector
 */
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Adds a given vector this one, updating this vector in place
     * @param {Vector} other_vector - The vector to add to this one
     */
    add(other_vector) {
        this.x = this.x + other_vector.x;
        this.y = this.y + other_vector.y;
    }
}

/**
 * Represents one of the player's paddles within a PongState
 * @param {number} xPos - x-coordinate of the center of the paddle
 * @param {number} yPos - y-coordinate of the center of the paddle
 * @param {number} maxVel - maximum velocity the paddle is allowed to move at
 */
class Paddle {
    constructor(xPos, yPos, maxVel) {
        this.pos = new Vector(xPos, yPos);      // A coordinate of the center of the paddle
        this.target = yPos;                     // The y-coordinate the paddle is moving to
        this.velocity = 0;                      // The velocity of the paddle in the last frame
        this.maxVel = maxVel;                   // Maximum change in position in single step
    }

    /**
     * Helper function that return the positive/negative max velocity if the provided velocity exceeds the max velocity
     * @param {number} velocity - The velocity to constrain between negative and positive max velocity for this paddle
     * @return {number} - The velocity, constrained between negative and positive max velocity 
     */
    constrainVelocity(velocity) {
        if (velocity > this.maxVel) {
            return this.maxVel;
        } else if (velocity < -this.maxVel) {
            return -this.maxVel;
        } else {
            return velocity;
        }
    }

    /**
     * Moves the paddle closer to it's target position, with a velocity up to maxVel
     */
    updatePaddle() {
        let distToTarget = this.target - this.pos.y;

        let velocity = this.constrainVelocity(distToTarget);

        this.pos.y += velocity;
        this.velocity = velocity;
    }
}

/**
 * Stores the state for Pong
 * @param {number} engineStepInterval - milliseconds between when the ball and paddle positions are updated
 * @param {number} width - width of the arena
 * @param {number} height - height of the arena
 * @param {number} ballSize - side length of the square ball used in the game
 * @param {number} ballVel - magnitude of the velocity of the ball
 * @param {number} ballAngle - direction of the velocity of the ball, in radians
 * @param {number} paddleWidth - width of each player's paddles
 * @param {number} paddleHeight - height of each player's paddles
 * @param {number} paddleEdgeOffset - distance from the center of the paddle to the edge of the arena
 * @param {number} paddleMaxVel - maximum velocity for both paddles
 * @param {number} randomSpinWeight - how much randomness affects the ball's direction after bouncing off a paddle
 * @param {number} paddleSpinWeight - how much the paddle's velocity affects the ball's direction after bouncing off a paddle
 */
class PongState extends RealTimeState {
    constructor(engineStepInterval, width, height, ballSize, ballVel,
            ballAngle, paddleWidth, paddleHeight, paddleEdgeOffset, paddleMaxVel,
            randomSpinWeight, paddleSpinWeight) {

        super(2, false, engineStepInterval);

        this.width = width;
        this.height = height;

        this.ballSize = ballSize;
        this.ballPos = new Vector(width / 2, height / 2);
        this.ballVel = new Vector(ballVel * Math.cos(ballAngle), ballVel * Math.sin(ballAngle));

        this.paddleWidth = paddleWidth;
        this.paddleHeight = paddleHeight;

        this.randomSpinWeight = randomSpinWeight;
        this.paddleSpinWeight = paddleSpinWeight;

        let leftPaddle = new Paddle(paddleEdgeOffset, height / 2, paddleMaxVel);
        let rightPaddle = new Paddle(width - paddleEdgeOffset, height / 2, paddleMaxVel);

        this.paddles = [leftPaddle, rightPaddle];
    }

    /**
     * Helper function to call updatePaddle on one of the state's paddles
     * @param {number} paddleIndex - Either 0 or 1, the paddle to call updatePaddle on
     */
    updatePaddle(paddleIndex) {
        this.paddles[paddleIndex].updatePaddle();
    }

    // General function for detecting all bounces
    // Outer limit should be the coordinate for when the ball collided with the outer shell
    // Inner limited should be the coordinate for the furthest into the object that still counts
    /**
     * Detects if the ball bounced against some object, and update velocity for bounce if so
     * @param {number} innerLimit - The innermost coordinate for which a ball can be said to have collided with an object
     * @param {number} outerLimit - The outermost coordinate for which a ball can be said to have collided with an object
     * @param {String} direction - x or y, which component to detect a bounce along
     * @returns {boolean} - whether or not the ball bounced
     */
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

    /**
     * Determines if the ball should bounce off the top of the arena. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the top of the arena
     */
    topBounce() {
        return this.bounce(-this.ballSize / 2, this.ballSize / 2, 'y');
    }

    /**
     * Determines if the ball should bounce off the bottom of the arena. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the bottom of the arena
     */
    bottomBounce() {
        return this.bounce(this.height + this.ballSize / 2, 
            this.height - this.ballSize / 2, 'y');
    }

    /**
     * Determines if the ball is in the y-range needed to collide with the paddle
     * @param {number} paddleIndex - Either 0 or 1, which paddle to detect a potential collision with
     * @returns {boolean} - Whether or not the ball is in the y-range needed to collide with the paddle
     */
    inRangePaddle(paddleIndex) {
        let y = this.paddles[paddleIndex].pos.y;
        let diff = this.paddleHeight / 2 + this.ballSize / 2;

        return this.ballPos.y < (y + diff) && this.ballPos.y > (y - diff);
    }

    /**
     * Determines if the ball should bounce off the left paddle. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the left paddle
     */
    leftPaddleBounce() {
        if (this.inRangePaddle(0)) {
            let leftPaddleEdge = this.paddles[0].pos.x + this.paddleWidth / 2;

            return this.bounce(leftPaddleEdge, leftPaddleEdge + this.ballSize / 2, 'x');
        }

        return false;
    }
    
    /**
     * Determines if the ball should bounce off the right paddle. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the right paddle
     */
    rightPaddleBounce() {
        if (this.inRangePaddle(1)) {
            let rightPaddleEdge = this.paddles[1].pos.x - this.paddleWidth / 2;

            return this.bounce(rightPaddleEdge, rightPaddleEdge - this.ballSize / 2, 'x');
        }

        return false;
    }

    /**
     * Spins the ball, changing it's y velocity according to the weights in the state
     * @param {number} paddleIndex - Either 0 or 1, which paddle's velocity to use to spin the ball
     */
    spinBall(paddleIndex) {
        this.ballVel.y += this.randomSpinWeight * (Math.random() * 2 - 1);
        this.ballVel.y += this.paddleSpinWeight * this.paddles[paddleIndex].velocity
    }
}

class PongTransformCollection extends TransformCollection {
    // Hide all actions made by the opponent, to prevent learning the opponent's targets
    hideOutcome(engineOutcome, playerID) {
        return !engineOutcome.action.engineStep && 
            engineOutcome.action.playerID != playerID;
    }

    // Make the player on the right appear as if on the left, and hide the opponent's target
    transformState(state, playerID) {
        if (playerID == 1) {
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
    transformStateDelta(stateDelta, playerID) {
        if (playerID == 1) {
            for (let i = 0; i < stateDelta.length; i++) {
                if (stateDelta[i] == 'left-bounce') {
                    stateDelta[i] = 'right-bounce';
    
                } else if (stateDelta[i] = 'right-bounce') {
                    stateDelta[i] = 'left-bounce';
                }
            }
        }

        return stateDelta;
    }
}

class PongGameModerator extends RealTimeModerator {
    constructor(player1, player2, pongState) {
        let pipes = PongTransformCollection.buildPipes([player1, player2]);
        
        super(pipes, new PongEngine(), pongState)
    }
}

class PongEngine extends RealTimeEngine {
    validateAction(state, action) {
        return action.repr >= 0 && action.repr <= state.height;
    }

    processPlayerAction(state, action) {
        let utilities = [0, 0];

        state.paddles[action.playerID].target = action.actionRepr;

        return this.outcome(utilities, state, undefined);
    }

    processEngineStep(state, action) {
        // Update the paddle positions first
        state.updatePaddle(0);
        state.updatePaddle(1);

        // Update the ball position based on its velocity
        state.ballPos.add(state.ballVel);

        // By default, no important changes occured
        let stateDelta = [];

        // Detect and handle bounces on the top or bottom of the screen
        if (state.topBounce()) {
            stateDelta.push('top-bounce');

        } else if(state.bottomBounce()) {
            stateDelta.push('bottom-bounce');
        }

        // Detect and handle bounces on either left or right paddles
        if (state.leftPaddleBounce()) {
            stateDelta.push('left-bounce');

            state.spinBall(0);

        } else if (state.rightPaddleBounce()) {
            stateDelta.push('right-bounce');

            state.spinBall(1);
        }

        let utilities = [0, 0];

        // Give a point to a player if the ball left the screen
        if (state.ballPos.x < state.ballSize / 2) {
            utilities = [-1, 1];

            state.terminalState = true;

        } else if (state.ballPos.x > width - state.ballSize / 2) {
            utilities = [1, -1];

            state.terminalState = true;
        }

        return this.outcome(utilities, state, stateDelta);
    }
}

function runPong(player1, player2, engineStepInterval, width, height,
        ballSize, ballVel, ballAngle, paddleWidth, paddleHeight, paddleEdgeOffset,
        paddleMaxVel, randomSpinWeight, paddleSpinWeight) {

    let pongState = new PongState(engineStepInterval, width, height,
            ballSize, ballVel, ballAngle, paddleWidth, paddleHeight,
            paddleEdgeOffset, paddleMaxVel, randomSpinWeight, paddleSpinWeight);

    let mod = new PongGameModerator(player1, player2, pongState);

    mod.runGame();
}