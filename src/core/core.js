// Simple wrapper class to an array to make it act like a queue
class Queue {
    constructor(items = []) {
        this.items = items;
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    size() {
        return this.items.length;
    }

    empty() {
        return this.items.length == 0;
    }
}

async function delay(ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, ms);
    });
}

// Base Class that defines the interface for all Seq/Sim Players
class Player {
    // Should return an action representation, based off the given state
    getAction(state) {}

    // called when a moderator starts a new game
    handleGameStart(state) {}

    // called when the result of a turn is processed
    handleOutcome(outcome) {}

    // called when the moderator ends a game
    handleGameEnd() {}
}

class RealTimePlayer {
    bindModerator(moderator) {
        this.moderator = moderator;
    }

    takeAction(action) {
        this.moderator.handleAction(action, this);
    }
}

// Base class for players who play asynchronously, like humans, or things over the network
// Provides a simplfied interface to make it integrate with the synchronous moderators
class AsyncPlayer extends Player {
    // Instead of using getAction, players should call takeAction(action)
    async getAction(state) {
        this.startTurnActions(state);

        // Return a promise, which will resolve when the player runs the function takeAction
        return new Promise((resolve, reject) => {
            this.takeAction = (action) => {
                this.endTurnActions();

                // By resolving, we will return the action the user submitted
                resolve(action);

                this.takeAction = () => {};
            }
        });
    }

    // Called when a turn begins, to update the UI, etc.
    startTurnActions(state) {}

    // Called after the player submits an action, to update the UI, etc.
    endTurnActions() {}
}

// Validity Classes
class Validity {
    constructor(overall) {
        this.overall = overall;  // The validity of the step overall
    }
}

class SimValidity extends Validity {
    constructor(overall, individual) {
        super(overall);

        this.individual = individual;  // Validity of each individual action
    }
}

class SeqValidity extends Validity{}
class RealTimeValiditiy extends Validity {}

// Action Classes
class Action {
    constructor(actionRepr) {
        this.actionRepr = actionRepr;
    }
}

class SeqAction extends Action {
    constructor(actionRepr, playerID) {
        super(actionRepr);
        
        this.playerID = playerID;
    }
}

class RealTimeAction extends SeqAction {
    constructor(actionRepr, playerID, engineStep) {
        super(actionRepr, playerID);

        this.engineStep = engineStep;
    }
}

class SimAction extends Action {};

// State Classes
class State {
    constructor(terminalState = false) {
        this.terminalState = terminalState;
    }
}

class SeqState extends State {
    constructor(turn = 0, terminalState = false) {
        super(terminalState);

        this.turn = turn; // Tracks which player will move next
    }
}

class RealTimeState extends State {
    constructor(stepFreq, terminalState = false) {
        super(terminalState);

        this.stepFreq = stepFreq;
    }
}

class SimState extends State {};

// Outcome class (combines the above classes)
class Outcome {
    constructor(validity, action, utilities, state, stateDelta) {
        this.validity = validity;
        this.action = action;
        this.utilities = utilities;
        this.state = state;
        this.stateDelta = stateDelta;
    }
}

class EngineOutcome extends Outcome{} // What engines return
class PlayerOutcome extends Outcome{} // What players are provided

// For when arrays are returned from the engine
class PlayerOutcomeField {
    constructor(personal, opponents) {
        this.personal = personal;
        this.opponents = opponents;
    }
}

// For when a playerID is bound to an action
class PlayerIDField {
    constructor(ownAction, playerID) {
        this.ownAction = ownAction; // True if the action was made by the player
        this.playerID = playerID;   // Index of the player relative to this player
                                    // undefined if ownAction is true
    }
}

// Engine classes
class Engine {
    constructor(validActions) {
        this.validActions = validActions;
    }

    // Called by the moderator to help support helper functions within the engine
    // NOTE: if the player count is dynamic, you should not rely on this property
    setPlayerCount(playerCount) {
        this.playerCount = playerCount;
    }

    // Primary function run to handle an action
    determineOutcome(state, action) {
        // Test if the action was valid
        let validity = this.validateActionHandler(state, action);

        // Leave these undefined by default
        let reportedAction;  // We may want to hide the actions, if they are invalid
        let utilities;
        let newState;
        let stateDelta;

        // Only handle the action if it is valid
        if (validity.overall) {
            // Since the action was valid, we can report it
            reportedAction = action;

            // Copy the state, so engine base classes can modify it how they see fit
            state = _.cloneDeep(state);

            // Process the action
            ({utilities, newState, stateDelta} = this.processAction(state, action));
        }

        // Return the outcome
        return new EngineOutcome(validity, reportedAction, utilities, newState, stateDelta);
    }

    // Upper-level method for direct subclasses of Engine
    // This allows direct subclasses to implement custom functionality, while still allowing
    // game-specific Engine subclasses to have custom validateAction methods
    // This is particualrly important for simultaneous games, which must allow for custom
    // validateAction methods, but also need to combine the validities into an array
    validateActionHandler(state, action) {
        return new Validity(this.validateAction(state, action));
    }

    // Lower-level method that should just return a boolean for an individual action
    // This default method uses the "validActions" property set by the constructor
    validateAction(state, action) {
        return this.validActions.includes(action.actionRepr);
    }

    // Should return this.outcome(utilties, newState, stateDelta)
    processAction(state, action) {}

    // Function that should be called by subclasses as the return value in processAction
    outcome(utilities, newState, stateDelta) {
        return {'utilities': this.expandUtilities(utilities), 'newState': newState, 
            'stateDelta': stateDelta};
    }

    // Lets engines return a utility of 0, which is expanded into the full array
    expandUtilities(utilities) {
        if (utilities === 0) {
            return new Array(this.playerCount).fill(0);
        }

        return utilities;
    }

    // Helper function to provide utilities if a certain player won
    winnerUtilities(winnerIndex) {
        let utilities = new Array(this.playerCount).fill(-1);

        utilities[winnerIndex] = 1;

        return utilities;
    }
}

class SeqEngine extends Engine {
    incrementTurn(state) {
        state.turn = (state.turn + 1) % this.playerCount;
    }
}

class SimEngine extends Engine {
    validateActionHandler(state, action) {
        let validity = new SimValidity(true, new Array(action.actionRepr.length).fill(true));

        action.actionRepr.forEach((singleActionRepr, i) => {
            // Convert each action to a SeqAction so the default validateAction method works
            let singleAction = new SeqAction(singleActionRepr, i);

            if (!this.validateAction(state, singleAction)) {
                validity.overall = false;
                validity.individual[i] = false;
            }
        });

        return validity;
    }
}

class RealTimeEngine extends Engine {
    // Separates the two types of actions this type of engine might handle
    processAction(state, action) {
        if (action.engineStep) {
            return this.processEngineStep;
        } else {
            return this.processPlayerAction;
        }
    }

    // Function that must be defined by subclasses, advancing the game forward a frame
    processEngineStep() {}

    // Function that must be defined by subclasses, whenever a player takes an action
    processPlayerAction() {}

    // Function that should be called by subclasses as the return value in step
    stepOutcome(actionRepr, utilities, newState, stateDelta) {
        let validity = new RealTimeValidity(true);
        
        // Second arg is playerID, third arg is engineStep
        let action = new RealTimeAction(actionRepr, undefined, true);
        
        utilities = this.expandUtilities(utilities);

        return new EngineOutcome(validity, action, utilities, newState, stateDelta);
    }
}

// Moderator classes
class Moderator {
    constructor(players, engine, state) {
        this.players = [];

        for (let i = 0; i < players.length; i++) {
            this.players[i] = this.initializeClass(players[i]);
        }

        this.engine = this.initializeClass(engine);
        this.state = this.initializeClass(state);
    }

    initializeClass(arg) {
        if (typeof arg == "function") {
            return new arg();
        }

        return arg;
    }

    // Handles actions necessary to start the game
    // TODO: consider providing an optional payload of data that includes the state to players
    startGame() {
        this.players.forEach((player, playerID) => {
            let stateCopy = _.cloneDeep(this.newState);
            let transformedState = this.transformState(stateCopy, playerID);

            player.handleGameStart(transformedState);
        });

        this.engine.setPlayerCount(this.players.length);
    }

    // Handles actions necessary to end the game
    endGame() {
        this.players.forEach(player => player.handleGameEnd());
    }

    // Should be defined by subclasses, if they used the default runGame loop
    runTurn() {}

    // Simple game loop sufficient from Sim/Seq Moderators
    async runGame() {
        this.startGame();

        while (!this.state.terminalState) {
            await this.runTurn();
        }

        this.endGame();
    }

    engineUpdate(action) {
        let engineOutcome = this.engine.determineOutcome(this.state, action);

        this.state = engineOutcome.state;

        this.players.forEach((player, playerID) => {
            if (!this.hideOutcome(engineOutcome, playerID)) {
                let personalOutcome = this.personalizeOutcome(engineOutcome, playerID);

                player.handleOutcome(personalOutcome);
            }
        });
    }

    // TODO: consider enumerating over the properties somehow
    // Would probably require a dictionary of functions for each transformation
    personalizeOutcome(engineOutcome, playerID) {
        // Handle a copy of all the fields, so transform functions don't have to do the copying
        let outcomeCopy = _.cloneDeep(engineOutcome);

        // Transform all aspects of the outcome
        let validity = this.transformValidity(outcomeCopy.validity, playerID);
        let action = this.transformActionHandler(outcomeCopy.action, playerID);
        let utilities = this.transformUtilities(outcomeCopy.utilities, playerID);
        let state = this.transformState(outcomeCopy.state, playerID);
        let stateDelta = this.transformStateDelta(outcomeCopy.stateDelta, playerID);

        // Return the transformed outcome
        return new PlayerOutcome(validity, action, utilities, state, stateDelta);
    }

    // If this function returns true, the outcome will not be reported to the player
    hideOutcome(engineOutcome, playerID) {
        return false;
    }

    // Functions that transform EngineOutcome fields to PlayerOutcome fields
    transformValidity(validity, playerID) {
        return validity;
    }

    // This handler is necessary for Seq/RealTime Moderators to implment custom functionality
    // I'd rather than an extra function on my side than require a call to super every time
    // on the developer's side
    transformActionHandler(action, playerID) {
        return this.transformAction(action, playerID);
    }

    transformAction(action, playerID) {
        return action;
    }

    transformUtilities(utilities, playerID) {
        return this.makePlayerOutcomeField(utilities, playerID);
    }

    transformState(state, playerID) {
        return state;
    }

    transformStateDelta(stateDelta, playerID) {
        return stateDelta
    }

    // Helper function that transforms an array into an object that differentiates between the
    // value for the player, and the values for the other players
    makePlayerOutcomeField(arr, playerID) {
        let personalOutcome = arr.splice(playerID, 1)[0]; // Extract player's value

        return new PlayerOutcomeField(personalOutcome, arr);
    }

    // Helper function to transform the playerID field of an action in accordance with the above
    // transformation to a playerOutcomeField
    adjustPlayerID(forPlayerID, actionPlayerID) {
        if (forPlayerID == actionPlayerID) {
            return new PlayerIDField(true, undefined); // The action was an own-action

        } else if (forPlayerID < actionPlayerID) {
            return new PlayerIDField(false, actionPlayerID - 1);

        } else {
            return new PlayerIDField(false, actionPlayerID);
        }
    }
}

class SeqModerator extends Moderator {
    async runTurn() {
        // Get the action from the player
        let actionRepr = await this.players[this.state.turn].getAction(this.state);

        // Package it with the turn
        let action = new SeqAction(actionRepr, this.state.turn);

        // Run the action through the engine, reporting outcomes, etc.
        this.engineUpdate(action);
    }

    transformActionHandler(action, playerID) {
        action = this.transformAction(action); // Allow subclass to transform action

        action.playerID = this.adjustPlayerID(playerID, action.playerID); // Adjust ID

        return action;
    }
}

class SimModerator extends Moderator {
    async runTurn() {
        // Get actions from all players, waiting for every player to submit an action
        let actionRepr = await Promise.all(
            this.players.map(player => player.getAction(this.state)));

        this.engineUpdate(new SimAction(actionRepr));
    }

    transformValidity(validity, playerID) {
        validity.individual = this.makePlayerOutcomeField(validity.individual, playerID);

        return validity;
    }

    transformAction(action, playerID) {
        action.actionRepr = this.makePlayerOutcomeField(action.actionRepr, playerID);

        return action;
    }
}

// Inherits the transformActionHandler method from SeqModerator
class RealTimeModerator extends SeqModerator {
    constructor(players, engine, state) {
        super(players, engine, state);

        // Stores all the action that need to be processed still
        this.actionQueue = new Queue();

        // Bind the moderator to each player, so it knows where to submit it's move
        this.players.forEach(player => player.bindModerator(this));

        // Store the timeouts, so they can be cancelled when the game ends
        this.actionQueueTimeout;
        this.engineStepTimeout;
    }

    async runGame() {
        this.actionQueue = new Queue(); // Reset the action queue when a new game begins

        this.startGame(); // Call superclass method to alert players of game start

        // Schedule the first engine step
        this.engineStepTimeout = setTimeout(this.engineStep.bind(this),
            (1000 / this.state.stepFreq));

        // And start handling moves
        this.processActionQueue();
    }

    // Helper function at the end of processActionQueue and engineStep used to schedule another
    // or report game over if the game is indeed over
    reschedule(funcName, timeoutName, interval) {
        let otherTimeout = timeoutName == 'actionQueueTimeout' ? 
            'engineStepTimeout' : 'actionQueueTimeout';

        // If the game is not over, schedule the function again
        if (!this.state.terminalState) {
            this[timeoutName] = setTimeout(this[funcName].bind(this), interval);

        // If the game is over, report gameover to the players, and cancel the other process
        } else {
            this.gameEnd();

            clearTimeout(this[otherTimeout]);
        }
    }

    processActionQueue() {
        // Limit numnber of actions processed to number at the start. Otherwise, players could
        // keep submitting moves, blocking the event queue
        let actionsProcessed = 0;
        let actionsToProcess = this.actionQueue.size();

        // Keep processing until we've done them all (to the limit), or the game ended
        while(!this.state.terminalState && actionsProcessed < actionsToProcess) {
            let nextAction = this.actionQueue.dequeue();

            this.engineUpdate(nextAction);

            actionsProcessed++;
        }

        // Schedule another batch, or report gameover
        this.reschedule('processActionQueue', 'actionQueueTimeout', 0);
    }

    engineStep() {
        // The first arg is actionRepr, second is playerID, third is engineStep
        let stepAction = new RealTimeAction('step', undefined, true);

        this.engineUpdate(stepAction);

        this.reschedule('engineStep', 'engineStepTimeout', (1000 / this.state.stepFreq));
    }

    handleAction(actionRepr, playerRef) {
        // Build a real-time action based on the representation passed by the user
        let newAction = new RealTimeAction(actionRepr, this.players.indexOf(playerRef), false);

        this.actionQueue.enqueue(newAction);
    }
}
