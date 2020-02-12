// Returns a promise that takes ms milliseconds to resolve
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
    constructor(terminalState = false) {
        super(terminalState);
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

// Let's a player know if a real-time move was their own, an opponent, or an engine action
class RealTimePlayerID extends SeqPlayerID {
    constructor(ownAction, engineAction, playerID) {
        super(ownAction, playerID);

        this.engineAction = engineAction; // If the action was a step by the engine
                                          // (Other fields undefined if true)
    }

    // Creates this object given a seqPlayerID object, since they are so similar
    static fromSeqPlayerID(seqPlayerID, engineAction) {
        return new RealTimePlayerID(seqPlayerID.ownAction, engineAction, seqPlayerID.playerID);
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
// Identical to SeqEngineOutcome, separate class for clarity
class RealTimeEngineOutcome extends SeqEngineOutcome {}

// Base class that defines the interface for all players - whether human or not
class Player {
    constructor() {}

    // All players must return a move given some state 
    // The player may be state-full even if the game is stateless, tracking opponent moves
    getAction(state) {}

    // Called whenever a moderator starts a new game
    reportGameStart() {}

    // Provides the player with information about the result of a turn, including utilities
    reportOutcome(outcome) {}

    // Called whenever a moderator ends a game
    reportGameEnd() {}
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
        this.players.forEach(player => player.reportGameStart());

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

    // TODO: move this to the Sequential game engine
    // Creates a SeqPlayerID object for the player at forPlayerIndex, given that the player
    // at actionPlayerIndex took the action
    makeSeqPlayerID(forPlayerIndex, actionPlayerIndex) {
        // Determine if the player made the move themselves
        let ownAction = forPlayerIndex == actionPlayerIndex ? true : false;

        // Assume the index relative to the player is the absolute index
        let relativeIndex = actionPlayerIndex;

        // If the action wasn't the player's and this player's absolute index is less than
        // the absolute index of the player who made the move, the relative index is one
        // less than the absolute index
        if (!ownAction && forPlayerIndex < actionPlayerIndex) {
            relativeIndex -= 1;

        } else if(ownAction) { // If the player made the move, this field should be undefined
            relativeIndex = undefined;
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
    personalizeOutcome(engineOutcome, index) {
        // The valdity of the action and action can be provided directly to the players
        let validTurn = engineOutcome.validTurn;
        let action = engineOutcome.action;

        // The new state should be transformed by the moderator as necessary
        let newState = this.transformState(engineOutcome.newState);

        // Return utilities as an OutcomeField so players differentiate between their/opponents
        let utilities = this.makeOutcomeField(engineOutcome.utilities, index);

        // Determine the ID of the player who made the move (could have been self)
        let playerID = this.makeID(index, engineOutcome.actionPlayerID);

        return new SeqPlayerOutcome(validTurn, newState, utilities, action, playerID);
    }
}

// Moderator subcalss for simultaneous games, where all players make a move at once
class SimModerator extends Moderator {
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

//Moderator subclass for realtime games, where time advances the game, and players move whenever
class RealTimeModerator extends Moderator {
    // actionFreq is how often actions are evaluated, frameFreq how often engine step is taken
    // Generally, actionFreqq should be faster than frameFreq (like 10 ms or less)
    constructor(players, engine, state, actionFreq, frameFreq) {
        super(players, engine, state);

        this.actionFreq = actionFreq;
        this.frameFreq = frameFreq;
    }
   
    // Works by scanning each player to see if they have set an action
    // If so, processes that action, then resets the action to undefined (no action)
    runTurn() {
        this.players.forEach(player => {
            if(typeof player.action !== 'undefined') {
                let engineOutcome = this.engine.determineOutcome(player.action, this.state);

                this.updateState(engineOutcome);
                this.reportOutcomes(engineOutcome);

                player.action = undefined;
            }
        });
    }

    async runGame() {
        this.players.forEach(player => player.reportGameStart());

        setTimeout(this.engineStep.bind(this), this.frameFreq);

        while(!this.state.terminalState) {
            this.runTurn();

            await delay(this.actionFreq);
        }

        this.players.forEach(player => player.reportGameEnd());
    }

    engineStep() {
        let engineOutcome = this.engine.step();

        this.updateState(engineOutcome);
        this.reportOutcome(engineOutcome);

        setTimeout(this.engineStep.bind(this), this.frameFreq);
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

        let newState;
        let utilities;

        if (validTurn) {
            let nextState = this.getNextState(actions, state)

            newState = nextState.newState;
            utilities = nextState.utilities;
        } else {
            newState = state; // Leave the state unchanged (?)
            utilities = new Array(actions.length).fill(0);
        }

        let outcome = new SimEngineOutcome(validTurn, newState, utilities, actionValidities, actions);

        return outcome;
    }
}

class RealTimeEngine extends SeqEngine {
    constructor(totalPlayers) {
        super(totalPlayers);
    }

    // Function that must be defined by subclasses, advancing the game forward a frame
    step(state){}
}
