import { RealTimeState } from "../containers/states.js";
import { RealTimeModerator, TransformCollection } from "../core/moderators.js";
import { RealTimeEngine } from "../core/engines.js";
import { RealTimeValidity } from "../containers/validities.js";

/**
 * Simple class to do 2D vector math with
 * @param {number} x - magnitude of the x component of the vector
 * @param {number} y - magnitude of the y component of the vector
 */
export class Vector {
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
 * Represnts the ball (assumed to be a square) within a PongState
 * @param {number} xPos - x-coordinate of the center of the ball
 * @param {number} yPos - y-coordinate of the center of the ball
 * @param {number} xVel - ball's velocity in the x-direction
 * @param {number} yVel - ball's veloicty in the y-direction
 * @param {number} size - side-length of the ball
 */
export class Ball {
    constructor(xPos, yPos, xVel, yVel, size) {
        this.pos = new Vector(xPos, yPos);
        this.vel = new Vector(xVel, yVel);

        this.size = size;
    }

    /**
     * Creates and returns a new Ball instance based off the magnitude and angle of the velocity
     * @param {number} xPos - x-coordinate of the center of the ball
     * @param {number} yPos - y-coordinate of the center of the ball
     * @param {number} vel - magnitude of the ball's velocity
     * @param {number} angle - angle of the ball's velocity, in radians
     */
    static fromMagnitude(xPos, yPos, vel, angle, size) {
        let xVel = vel * Math.cos(angle);
        let yVel = vel * Math.sin(angle);

        return new Ball(xPos, yPos, xVel, yVel, size);
    }

    /**
     * Detects if the ball bounced against some object, and updates the velocity for the ball if so
     * @param {number} innerLimit - The innermost coordinate for which a ball can be said to have collided with an object
     * @param {number} outerLimit - The outermost coordinate for which a ball can be said to have collided with an object
     * @param {String} direction - x or y, which component to detect a bounce along
     * @returns {boolean} - whether or not the ball bounced
     */
    bounce(innerLimit, outerLimit, direction) {
        let lowerLimit = Math.min(innerLimit, outerLimit);
        let upperLimit = Math.max(innerLimit, outerLimit);

        if (this.pos[direction] >= lowerLimit && this.pos[direction] <= upperLimit) {
            this.vel[direction] *= -1;
            this.pos[direction] = outerLimit;

            return true;
        }

        return false;
    }

    /**
     * Helper function to detect if the ball bounced against an object in the x-direction
     * @param {number} innerLimit - The innermost coordinate for which a ball can be said to have collided with an object
     * @param {number} outerLimit - The outermost coordinate for which a ball can be said to have collided with an object
     * @returns {boolean} - whether or not the ball bounced
     */
    bounceX(innerLimit, outerLimit) {
        return this.bounce(innerLimit, outerLimit, 'x');
    }

    /**
     * 
     * @param {number} innerLimit - The innermost coordinate for which a ball can be said to have collided with an object
     * @param {number} outerLimit - The outermost coordinate for which a ball can be said to have collided with an object
     * @returns {boolean} - whetehr or not the ball bounced
     */
    bounceY(innerLimit, outerLimit) {
        return this.bounce(innerLimit, outerLimit, 'y');
    }

    /**
     * Update's the ball's velocity according to it's position
     */
    update() {
        this.pos.add(this.vel);
    }
}

/**
 * Represents one of the player's paddles within a PongState
 * @param {number} xPos - x-coordinate of the center of the paddle
 * @param {number} yPos - y-coordinate of the center of the paddle
 * @param {number} width - width of the paddle
 * @param {number} height - height of the paddle
 * @param {number} maxVel - maximum velocity the paddle is allowed to move at
 */
export class Paddle {
    constructor(xPos, yPos, width, height, maxVel) {
        this.pos = new Vector(xPos, yPos);

        this.width = width;
        this.height = height;

        this.velocity = 0;                      // The velocity of the paddle in the last frame
        this.target = yPos;                     // The y-coordinate the paddle is moving to
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
     * Determines if the ball is in the y-range needed to collide with the paddle
     * @param {Paddle} paddle - The paddle to detect if the ball is in range of
     * @returns {boolean} - Whether or not the ball is in the y-range needed to collide with the paddle
     */
    ballInRange(ball) {
        let y = this.pos.y;
        let diff = this.height / 2 + ball.size / 2;

        return ball.pos.y < (y + diff) && ball.pos.y > (y - diff);
    }

    /**
     * Moves the paddle closer to it's target position, with a velocity up to maxVel
     */
    update() {
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
 * @param {Ball} ballSize - ball object for the state
 * @param {Paddle} leftPaddle - paddle for the left player
 * @param {Paddle} rightPaddle - paddle for the right player
 * @param {number} randomSpinWeight - how much randomness affects the ball's direction after bouncing off a paddle
 * @param {number} paddleSpinWeight - how much the paddle's velocity affects the ball's direction after bouncing off a paddle
 */
export class PongState extends RealTimeState {
    constructor(engineStepInterval, width, height, ball, leftPaddle,
            rightPaddle, randomSpinWeight, paddleSpinWeight) {

        super(2, false, engineStepInterval);

        this.width = width;
        this.height = height;

        this.leftPaddle = leftPaddle;
        this.rightPaddle = rightPaddle;
        this.ball = ball;

        this.randomSpinWeight = randomSpinWeight;
        this.paddleSpinWeight = paddleSpinWeight;
    }

    /**
     * Helper function to call update on both of the state's paddles
     */
    updatePaddles() {
        this.leftPaddle.update();
        this.rightPaddle.update();
    }

    /**
     * Helper function to call update on the state's ball
     */
    updateBall() {
        this.ball.update();
    }

    /**
     * Determines if the ball should bounce off the top of the arena. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the top of the arena
     */
    topBounce() {
        return this.ball.bounceY(-this.ball.size / 2, this.ball.size / 2);
    }

    /**
     * Determines if the ball should bounce off the bottom of the arena. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the bottom of the arena
     */
    bottomBounce() {
        return this.ball.bounceY(this.height + this.ball.size / 2, this.height - this.ball.size / 2);
    }


    /**
     * Determines if the ball should bounce off the left paddle. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the left paddle
     */
    leftPaddleBounce() {
        if (this.leftPaddle.ballInRange(this.ball)) {
            let leftPaddleEdge = this.leftPaddle.pos.x + this.leftPaddle.width / 2;

            return this.ball.bounceX(leftPaddleEdge, leftPaddleEdge + this.ball.size / 2);
        }

        return false;
    }
    
    /**
     * Determines if the ball should bounce off the right paddle. Updates velocity of ball if so
     * @returns {boolean} - Whether or not the ball bounced off the right paddle
     */
    rightPaddleBounce() {
        if (this.rightPaddle.ballInRange(this.ball)) {
            let rightPaddleEdge = this.rightPaddle.pos.x - this.rightPaddle.width / 2;

            return this.ball.bounceX(rightPaddleEdge, rightPaddleEdge - this.ball.size / 2);
        }

        return false;
    }

    /**
     * Spins the ball, changing it's y velocity according to the weights in the state
     * @param {Paddle} paddle - The paddle to use to spin the ball
     */
    spinBall(paddle) {
        this.ball.vel.y += this.randomSpinWeight * (Math.random() * 2 - 1);
        this.ball.vel.y += this.paddleSpinWeight * paddle.velocity
    }
}

export class PongTransformCollection extends TransformCollection {
    // Hide all actions made by the opponent, to prevent learning the opponent's targets
    static hideOutcome(engineOutcome, playerID) {
        return !engineOutcome.action.engineStep && 
            engineOutcome.action.playerID != playerID;
    }

    // Make the player on the right appear as if on the left, and hide the opponent's target
    static transformState(state, playerID) {
        if (playerID == 1) {
            // Flip the x-coordinate
            state.ball.pos.x = state.width - state.ball.pos.x;

            // Reverse the x velocity
            state.ball.vel.x *= -1;

            // Swap the paddles and their x-coordinates
            [state.leftPaddle, state.rightPaddle] = [state.rightPaddle, state.leftPaddle];
            [state.leftPaddle.pos.x, state.rightPaddle.pos.x] = [state.rightPaddle.pos.x, state.leftPaddle.pos.x];
        }

        // Hide the opponent's target
        state.rightPaddle.target = null;

        return state
    }

    // Let's both players view left-bounce actions as their own paddle bounce, consistent with
    // the transformed state
    static transformStateDelta(stateDelta, playerID) {
        if (playerID == 1) {
            for (let i = 0; i < stateDelta.length; i++) {
                if (stateDelta[i] == 'left-bounce') {
                    stateDelta[i] = 'right-bounce';
    
                } else if (stateDelta[i] == 'right-bounce') {
                    stateDelta[i] = 'left-bounce';
                }
            }
        }

        return stateDelta;
    }
}

export class PongGameModerator extends RealTimeModerator {
    constructor(player1, player2, pongState) {
        let pipes = PongTransformCollection.buildPipes([player1, player2]);
        
        super(pipes, new PongEngine(), pongState)
    }
}

export class PongEngine extends RealTimeEngine {
    validatePlayerAction(state, action) {
        return new RealTimeValidity(action.repr >= 0 && action.repr <= state.height);
    }

    processPlayerAction(state, action) {
        let utilities = [0, 0];

        let paddle;
        if (action.playerID === 0) {
            paddle = state.leftPaddle;
        } else if (action.playerID === 1) {
            paddle = state.rightPaddle;
        }

        paddle.target = action.repr;

        return this.makeProcessedActionOutcome(utilities, state, undefined);
    }

    processEngineStep(state, action) {
        // Clone the state to modify it
        state = state.clone();

        state.updatePaddles();
        state.updateBall();

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

            state.spinBall(state.leftPaddle);

        } else if (state.rightPaddleBounce()) {
            stateDelta.push('right-bounce');

            state.spinBall(state.rightPaddle);
        }

        let utilities = [0, 0];

        // Give a point to a player if the ball left the screen
        if (state.ball.pos.x < state.ball.size / 2) {
            utilities = [-1, 1];

            state.terminalState = true;

        } else if (state.ball.pos.x > state.width - state.ball.size / 2) {
            utilities = [1, -1];

            state.terminalState = true;
        }

        return this.makeProcessedActionOutcome(utilities, state, stateDelta);
    }
}

export function runPong(player1, player2, engineStepInterval, width, height,
        ballVel, ballAngle, ballSize, paddleWidth, paddleHeight, paddleEdgeOffset,
        paddleMaxVel, randomSpinWeight, paddleSpinWeight) {

    let leftPaddle = new Paddle(paddleEdgeOffset, height/2, paddleWidth, paddleHeight, paddleMaxVel);
    let rightPaddle = new Paddle(width - paddleEdgeOffset, height/2, paddleWidth, paddleHeight, paddleMaxVel);
    let ball = Ball.fromMagnitude(width/2, height/2, ballVel, ballAngle, ballSize);

    let pongState= new PongState(engineStepInterval, width, height, ball, leftPaddle, 
            rightPaddle, randomSpinWeight, paddleSpinWeight);

    let mod = new PongGameModerator(player1, player2, pongState);

    mod.runGame();
}