// Simple wrapper class to an array to make it act like a queue
class Queue {
    constructor(items = []) {
        this.items = items;
    }

    copy() {
        let itemsCopy = this.items.slice();

        return new Queue(itemsCopy);
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

// Returns a promise that takes ms milliseconds to resolve
// Keep this function for now just to test a network player with lag
// To use it as a wait block do 'await delay(100);'
// Or, delay(100).then(// Do stuff)
async function delay(ms) {
    return new Promise(function(resolve,reject) {
        setTimeout(resolve, ms);
    });
}

// Base class for storing state for all simultaneous games
class SimState {
    constructor(terminalState = false) {
        this.terminalState = terminalState;
    }
}

// Base class for storing state for sequential games 
class SeqState extends SimState {
    constructor(terminalState = false, turn = 0) {
        super(terminalState);

        this.turn = turn; // Stores which player should move next
                          // Necessary in games when players can move multiple time in a row
                          // (Like dots and boxes or mancala)             
    }
}

// Base class for storing state for RealTimeGame (same as SimState)
class RealTimeState extends SimState {
    constructor(stepFreq, terminalState = false) {
        super(terminalState);

        this.stepFreq = stepFreq;
    }
}

// One field of the outcome object, which stores the field for the player and the opponents
class OutcomeField {
    constructor(personal, opponents) {
        this.personal = personal;   // Discrete value for the player
        this.opponents = opponents; // Array of values for opponents
    }
}

// Lets a player know if a sequential move was their own, or whose it was
// Indexes match that of OutcomeField
class SeqPlayerID {
    constructor(ownAction, playerID) {
        this.ownAction = ownAction; // If the action is made by the player or not
        this.playerID = playerID;   // Index of the player who made the move if not self
                                    // (undefined if ownAction is true)
    }
}

// Base class for the information provided to players after a turn
class Outcome {
    constructor(validTurn, newState, utilities) {
        this.validTurn = validTurn; // bool: if the action(s) was (were) valid
        this.newState = newState;   // State: updated state object
        this.utilities = utilities; // Array: "reward" each player recieves for the turn
    }
}

// Outcome object returned by a Simultaneous Game Engine
class SimEngineOutcome extends Outcome {
    constructor(validTurn, newState, utilities, actionValidities, actions) {
        super(validTurn, newState, utilities);

        // Array: if each of the moves made were valid
        this.actionValidities = actionValidities;

        // Array: each of the moves made by the players
        // NOTE: only returned if all actions were valid
        this.actions = actions;
    }
}

// Object provided to players after a turn in a Simultaneous games
// Identical to SimEngineOutcome, but utilities, actions, and actionValidities should be 
// OutcomeFields, not Arrays
class SimPlayerOutcome extends SimEngineOutcome {}

// Outcome object returned by a Sequential Game Engine
class SeqEngineOutcome extends Outcome {
    constructor(validTurn, newState, utilities, action, actionPlayerID) {
        super(validTurn, newState, utilities);

        // Universal property: the move made by the player whose turn it was
        this.action = action;

        // The index of the player who took the action
        this.actionPlayerID = actionPlayerID;
    }
}

// Object provided to players after a turn in a Sequential Game
// Identical to SeqEngineOutcome, but utilities should be an OutcomeField, not an array,
// and actionPlayerID should be a SeqPlayerID object, not an integer
class SeqPlayerOutcome extends SeqEngineOutcome {}

// Outcome object returned by a Real-Time Game Engine
// Identical to SeqEngineOutcome, engineStep is true if outcome was a step, not a player action 
class RealTimeEngineOutcome extends SeqEngineOutcome {
    constructor(validTurn, newState, utilities, action, actionPlayerID, engineStep) {
        super(validTurn, newState, utilities, action, actionPlayerID);

        this.engineStep = engineStep;
    }
}

// Outcome object provided to players
class RealTimePlayerOutcome extends RealTimeEngineOutcome {}

// Base class that defines the interface for all players - whether human or not
class Player {
    constructor() {}

    // All players must return a move given some state 
    // The player may be state-full even if the game is stateless, tracking opponent moves
    getAction(state) {}

    // Called whenever a moderator starts a new game
    reportGameStart(state) {}

    // Provides the player with information about the result of a turn, including utilities
    reportOutcome(outcome) {}

    // Called whenever a moderator ends a game
    reportGameEnd() {}
}

// Class that all RealTimePlayers should be based off of
// Abstracts away some implementation details of the moderator
class RealTimePlayer {
    constructor() {
    }

    bindModerator(moderator) {
        this.moderator = moderator;
    }

    takeAction(action) {
        this.moderator.handleAction(action, this);
    }
}

// Parent class for HumanPlayers and NetworkPlayers, which provides an easy interface for players
// who don't make moves synchronously to interface with the synchronous moderators (Seq/Sim)
class AsyncPlayer extends Player {
    async getAction(state) {
        this.startTurnActions(state);

        return new Promise((resolve, reject) => {
            this.takeAction = (action) => {
                this.endTurnActions();

                resolve(action);

                this.takeAction = ()=>{};
            }
        });
    }

    // Function that subclasses can define to do things (e.g. update UI, make ajax request)
    // When the turn begins
    startTurnActions(state) {}

    // Function that subclasses can define to do things at the end of a turn
    endTurnActions() {}
}

// Base class for object that handle interactions between players and the engine
class Moderator {
    constructor(players, engine, state) {
        this.players = players // Array of Player objects
        this.engine = engine   // Engine object used to handle game logic
        this.state = state     // State object holding current game state
    }

    // Helper function to update the game state based on engine output
    updateState(engineOutcome) {
        this.state = engineOutcome.newState;
    }

    // Helper function to return outcomes to every player
    reportOutcomes(engineOutcome) {
        this.players.forEach((player, i) =>
            player.reportOutcome(this.personalizeOutcome(engineOutcome, i)));
    }

    // Continually runs turns until the state reached it terminal
    async runGame() {
        this.players.forEach(player => player.reportGameStart(this.state));

         while(!this.state.terminalState) {
            await this.runTurn();
         }
        
        this.players.forEach(player => player.reportGameEnd());

    }

    // Given an array returned by an engine, creates an OutcomeField for the player at the
    // given playerIndex
    makeOutcomeField(array, playerIndex) {
        let arrayCopy = array.slice(); // Copy the array so we don't modify the original

        // Remove and extract the value specific to the player
        let personalOutcome = arrayCopy.splice(playerIndex, 1)[0]; 

        // Create and return the OutcomeField object
        return new OutcomeField(personalOutcome, arrayCopy)
    }

    // Creates a SeqPlayerID object for the player at forPlayerIndex, given that the player
    // at actionPlayerIndex took the action
    makePlayerID(forPlayerIndex, actionPlayerIndex) {
        // Determine if the player made the move themselves
        let ownAction = forPlayerIndex == actionPlayerIndex ? true : false;

        // By default, realtiveIndex is undefined (set below if not own action)
        let relativeIndex;

        if (!ownAction && forPlayerIndex < actionPlayerIndex) {
            relativeIndex = actionPlayerIndex - 1;
        } else if(!ownAction && forPlayerIndex > actionPlayerIndex) {
            relativeIndex = actionPlayerIndex;
        }

        return new SeqPlayerID(ownAction, relativeIndex);
    }

    // Modifies the board to hide information or make all boards look the same to all players
    // (e.g. all players beleive they are X in a Tic-Tac-Toe game)
    // Defaults to no transformation
    transformState(state) {
        return state;
    }

    // Transforms an engine outcome to an outcome provided to a player
    // All subclasses should define this function 
    personalizeOutcome(engineOutcome, playerIndex){}
}


// Moderator subclass for sequential games, where turns take place one after the other
class SeqModerator extends Moderator {
    // Runs a single turn for a Sequential Game
    async runTurn() {
        // Get the action of the player whose turn it is
        let action = await this.players[this.state.turn].getAction(this.state);

        // Let the engine process the outcome
        let engineOutcome = this.engine.determineOutcome(action, this.state, this.state.turn);
        
        // Then update the stored game state, let all players know the outcome
        this.updateState(engineOutcome);
        this.reportOutcomes(engineOutcome);
    }

    // Transforms a SeqEngineOutcome to a SeqPlayerOutcome 
    personalizeOutcome(engineOutcome, playerIndex) {
        // The valdity of the action and action can be provided directly to the players
        let validTurn = engineOutcome.validTurn;
        let action = engineOutcome.action;

        // The new state should be transformed by the moderator as necessary
        let newState = this.transformState(engineOutcome.newState);

        // Return utilities as an OutcomeField so players differentiate between their/opponents
        let utilities = this.makeOutcomeField(engineOutcome.utilities, playerIndex);

        // Determine the ID of the player who made the move (could have been self)
        let playerID = this.makePlayerID(playerIndex, engineOutcome.actionPlayerID);

        return new SeqPlayerOutcome(validTurn, newState, utilities, action, playerID);
    }
}

// Moderator subcalss for simultaneous games, where all players make a move at once
class SimModerator extends SeqModerator {
    // Runs a single turn for a Simultaneous game
    async runTurn() {
        // Get the actions for all players (await all of the players to return an action)
        let actions = await Promise.all(
            this.players.map(player => player.getAction(this.state)));    

        // Process these actions in the engine
        let engineOutcome = this.engine.determineOutcome(actions, this.state);

        // Then update the stored game state, let all players know the outcome
        this.updateState(engineOutcome);
        this.reportOutcomes(engineOutcome);
    }

    // Transform a SimEngineOutcome to a SimPlayerOutcome
    personalizeOutcome(engineOutcome, playerIndex){ 
        // The validity of the action can be provided directly to the players
        let validTurn = engineOutcome.validTurn;

        // The new state is transformed by the moderator as necessary
        let newState = this.transformState(engineOutcome.newState);

        // Make the actionValidities, utilites, and action arrays OutcomeFields
        let actionValidities = this.makeOutcomeField(
            engineOutcome.actionValidities, playerIndex);

        let utilities = this.makeOutcomeField(engineOutcome.utilities, playerIndex);

        // Only return the actions if they were all valid. This prevents players from
        // strategically making invalid moves to study opponent behavoiral patterns
        let actions = validTurn ? this.makeOutcomeField(
            engineOutcome.actions, playerIndex) : undefined;

        return new SimPlayerOutcome(validTurn, newState, utilities, actionValidities, actions);
   }
}

// Moderator subclass for realtime games, where time advances the game, and players move whenever
class RealTimeModerator extends Moderator {
    constructor(players, engine, state) {
        super(players, engine, state);

        // Stores all the actions that need to be processed coming up
        this.actionQueue = new Queue();

        // Bind this moderator to each playe, so it knows where to submit its move
        this.players.forEach(player => player.bindModerator(this));
    }

    async runGame() {
        // Let each player know the game has begun
        this.players.forEach(player => player.reportGameStart(this.state));

        // Schedule the first engine step
        setTimeout(this.engineStep.bind(this), this.state.stepFreq);
        
        // Now that every player has been alerted, start handling moves
        this.processActionQueue();
    }

    // Process a single action in the queue, then schedule processing the next
    processActionQueue() {
        // Only process as many actions are currently in the queue, otherwise computer players
        // will be able to submit unlimited moves while keeping the even queue blocked
        let actionsProcessed = 0;
        let actionsToProcess = this.actionQueue.size();

        // Continue to process actions so long as the state is not terminal, there are actions
        // to process, and the number of actions doesn't exceed the number to process
        while (!this.state.terminalState && actionsProcessed < actionsToProcess) {

            // Pull the next action out of the queue
            let nextAction = this.actionQueue.dequeue();

            // Determine the index of the player who made the move
            let playerIndex = this.players.indexOf(nextAction.playerRef);

            // Process the in the engine
            let engineOutcome = this.engine.determineOutcome(nextAction.action, 
                this.state, playerIndex);

            // Then update the stored game state, let all players know the outcome
            this.updateState(engineOutcome);
            this.reportOutcomes(engineOutcome);

            actionsProcessed++;
        }

        // Now that we're done processing, free the event loop, and schedule the next batch
        // Only schedule the next batch if a terminal state was not reached
        if (!this.state.terminalState) {
            setTimeout(this.processActionQueue.bind(this), 0);
        } else {
            this.players.forEach(player => player.reportGameEnd());
        }
    }

    engineStep() {
        // Make sure the game didn't enter a terminal state, likely in an action since a frame 
        // was processed
        if (!this.state.terminalState) {
            // Let the engine process the next step
            let engineOutcome = this.engine.step(this.state);

            // Update the stored game state and step rate
            this.updateState(engineOutcome);
            this.reportOutcomes(engineOutcome);

            if (!this.state.terminalState) {
                // Schedule the next step
                setTimeout(this.engineStep.bind(this), this.state.stepFreq);
            } else {
                this.players.forEach(player => player.reportGameEnd());
            }
        }
    }

    // Endpoint that RealTimePlayers should call to make a move
    handleAction(action, playerRef) {
        // Add the action to the queue
        this.actionQueue.enqueue({'action': action, 'playerRef': playerRef});
    }

    // Converts a RealTimeEngineOutcome to a RealTimePlayerOutcome
    // Uses the SeqModerator function sincethe objects are identical
    personalizeOutcome(engineOutcome, playerIndex) {
        let validTurn = engineOutcome.validTurn;
        let engineStep = engineOutcome.engineStep;
        let action = engineOutcome.action;

        // The new state should be transformed by the moderator as necessary
        let newState = this.transformState(engineOutcome.newState);

        // Return utilities as an OutcomeField so players differentiate between their/opponents
        let utilities = this.makeOutcomeField(engineOutcome.utilities, playerIndex);
       
        let playerID = engineStep ? undefined:
            this.makePlayerID(playerIndex, engineOutcome.actionPlayerID);

        return new RealTimePlayerOutcome(validTurn, newState, utilities, action, playerID,
            engineStep);
    }
}

// Base class for object that handles all the game logic for any partcular game
class Engine {
    constructor() {}

    determineOutcome(action, state){}

    verifyValid(action, state){}

    getNextState(action, state){}
}


class SeqEngine extends Engine {
    constructor(totalPlayers) {
        super();

        this.totalPlayers = totalPlayers; // Used to determine the next turn
    }

    determineOutcome(action, state, playerID) {
        let validTurn = this.verifyValid(action, state, playerID);

        let newState = state; // Leave the state unchanged by default
        let utilities = new Array(this.totalPlayers).fill(0); // Have 0 utility be default too 

        // Set newState and utilities if the action was valid
        if(validTurn) {
            let nextState = this.getNextState(action, state, playerID);

            newState = nextState.newState;
            utilities = nextState.utilities;
        }

        let outcome = new SeqEngineOutcome(validTurn, newState, utilities, action, playerID);

        return outcome;
    }

    incrementTurn(state) {
        state.turn = (state.turn + 1) % this.totalPlayers;
    }
}

// Engine subclass for simultaneous games
class SimEngine extends Engine {
    constructor() {
        super()
    }

    determineOutcome(actions, state) {
        let validTurn = true;
        let actionValidities = new Array(actions.length).fill(true);

        actions.forEach((action, i) => {
            if (!this.verifyValid(action, state)) {
                validTurn = false;
                actionValidities[i] = false;
            }
        });

        let newState = state;
        let utilities = new Array(actions.length).fill(0);

        if (validTurn) {
            let nextState = this.getNextState(actions, state)

            newState = nextState.newState;
            utilities = nextState.utilities;
        } 

        let outcome = new SimEngineOutcome(validTurn, newState, utilities, actionValidities, 
            actions);

        return outcome;
    }
}

// The RealTimeEngine is identical to the SeqEngine, just with an additional step function
// which is run after a certain time interval to progress the game forward
class RealTimeEngine extends SeqEngine {
    constructor(totalPlayers) {
        super(totalPlayers);
    }

    determineOutcome(action, state, playerID) {
        let validTurn = this.verifyValid(action, state, playerID);

        let newState = state; // Leave the state unchanged by default
        let utilities = new Array(this.totalPlayers).fill(0); // Have 0 utility be default too 

        // Set newState and utilities if the action was valid
        if(validTurn) {
            let nextState = this.getNextState(action, state, playerID);

            newState = nextState.newState;
            utilities = nextState.utilities;
        }

        let outcome = new RealTimeEngineOutcome(validTurn, newState, utilities, action, playerID,
            false);

        return outcome;
    }

    reportStepOutcome(action, newState, utilities) {
        return new RealTimeEngineOutcome(true, newState,
            utilities, action, undefined, true); 

    }

    // Function that must be defined by subclasses, advancing the game forward a frame
    step(state){}
}
