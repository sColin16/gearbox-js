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

// Base class for storing state for sequential games (has a turn property)
class SeqState extends SimState {
    constructor(terminalState = false, turn = 0) {
        super(terminalState);
        this.turn = turn; // Stores which player should move next
                          // Necessary in games when players can move multiple time in a row
                          // (Like dots and boxes or mancala)             
    }
}

// Base class for storing state for RealTimeGame (same as SimStaet)
class RealTimeState extends SimState {
    constructor(terminalState = false) {
        super(terminalState);
    }
}

// One field of the outcome object, which stores the field for the player and the opponents
class OutcomeField {
    constructor(personal, opponents) {
        this.personal = personal;
        this.opponents = opponents;
    }
}

// Lets a player know if a sequential move was their own, or whose it was
class SeqPlayerID {
    constructor(ownAction, playerID) {
        this.ownAction = ownAction;
        this.playerID = playerID;
    }
}

// Let's a player know if a real-time move was their own, an opponent, or an engine action
class RealTimePlayerID extends SeqPlayerID {
    constructor(ownAction, engineAction, playerID) {
        this.ownAction = ownAction;
        this.engineAction = engineAction;
        this.playerID = playerID;
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

class SimEngineOutcome extends Outcome {
    constructor(validTurn, newState, utilities, actionValidities, actions) {
        super(validTurn, newState, utilities);

        // Array: if each of the moves made were valid
        this.actionValidities = actionValidities;

        // Array: each of the moves made by the players
        this.actions = actions;
    }
}

// Identical to SimEngineOutcome, but all Arrays are replaced with OutcomeFields
class SimPlayerOutcome extends SimEngineOutcome {
    constructor(validTurn, newState, utilities, actionValidities, actions) {
        super(validTurn, newState, utilities, actionValidities, actions);
    }
}

class SeqEngineOutcome extends Outcome {
    constructor(validTurn, newState, utilities, action, actionPlayerID) {
        super(validTurn, newState, utilities);

        // Universal property: the move made by the player whose turn it was
        // NOTE: only returned if validMove and validTurn is true
        this.action = action;

        // Customized property: ID of the player that made the move relative to the player
        this.actionPlayerID = actionPlayerID;
    }
}

class SeqPlayerOutcome extends SeqEngineOutcome {
    constructor(validTurn, newState, utilities, action, actionPlayerID) {
        super(validTurn, newState, utilities, action, actionPlayerID);
    }
}

// Object that a RealTimeEngine returns



// Base class that defines the interface for all players - whether human or not
class Player {
    constructor() {}

    // All players must return a move given some state (or not if the game is stateless)
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
        this.players = players
        this.engine = engine
        this.state = state
    }

    updateState(engineOutcome) {
        this.state = engineOutcome.newState;
    }

    reportOutcomes(engineOutcome) {
        this.players.forEach((player, i) =>
            player.reportOutcome(this.personalizeOutcome(engineOutcome, i)));
    }

    async runGame() {
        this.players.forEach(player => player.reportGameStart());

         while(!this.state.terminalState) {
            await this.runTurn();
         }
        
        this.players.forEach(player => player.reportGameEnd());

    }

    personalizeOutcomeField(field, index) {
        let fieldCopy = field.slice()

        let personalOutcome = fieldCopy.splice(index, 1)[0];

        return new OutcomeField(personalOutcome, fieldCopy)
    }

    // Index of the index of the player to make it for, playerID is who took the action
    makeID(forPlayerIndex, actionPlayerIndex) {
        let ownAction = forPlayerIndex == actionPlayerIndex ? true : false;
        let relativeIndex = actionPlayerIndex;

        if (!ownAction && forPlayerIndex < actionPlayerIndex) {
            relativeIndex -= 1;
        } else if(ownAction) {
            relativeIndex = undefined;
        }

        return new SeqPlayerID(ownAction, relativeIndex);
    }

    // Modifies the board to hide information or make all boards look the same to all players
    // Defaults to no transformation
    transformState(state) {
        return state;
    }
}


// Moderator subclass for seqeuntial games, where turns take place one after the other
class SeqModerator extends Moderator {
    constructor(players, engine, state) {
        super(players, engine, state)
    }

    async runTurn() {
        let action = await this.players[this.state.turn].getAction(this.state);

        let engineOutcome = this.engine.determineOutcome(action, this.state, this.state.turn);
        
        this.updateState(engineOutcome);
        this.reportOutcomes(engineOutcome);
    }

    personalizeOutcome(engineOutcome, index) {
        let validTurn = engineOutcome.validTurn;
        let validAction = engineOutcome.validAction;

        let newState = this.transformState(engineOutcome.newState);

        let utilities = this.personalizeOutcomeField(engineOutcome.utilities, index);

        // Only allow players to see the action if it was valid
        let action = validTurn ? engineOutcome.action : undefined;

        let playerID = this.makeID(index, engineOutcome.actionPlayerID);

        return new SeqPlayerOutcome(validTurn, newState, utilities, action, playerID);
    }
}

// Moderator subcalss for simultaneous games, where all players make a move at once
class SimModerator extends Moderator {
    constructor(players, engine, state) {
        super(players, engine, state)
    }

    async runTurn() {
        let actions = await Promise.all(
            this.players.map(player => player.getAction(this.state)));    

        let engineOutcome = this.engine.determineOutcome(actions, this.state);

        this.updateState(engineOutcome);
        this.reportOutcomes(engineOutcome);
    }

    personalizeOutcome(engineOutcome, playerIndex){ 
        let validTurn = engineOutcome.validTurn;        

        let newState = this.transformState(engineOutcome.newState);

        let actionValidities = this.personalizeOutcomeField(
            engineOutcome.actionValidities, playerIndex);

        let utilities = this.personalizeOutcomeField(engineOutcome.utilities, playerIndex);

        // Only return the actions if they were all valid. This prevents players from
        // strategically making invalid moves to study opponent behavoiral patterns
        let actions = validTurn ? this.personalizeOutcomeField(
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

        players.forEach(player => player.bindModerator(this));
    }
   
    // Works by scanning each player to see if they have set an action
    // If so, processes that action, then resets the action to undefined (no action)
    runTurn() {
        this.players.forEach(player => {
            if(typeof player.action !== 'undefined') {
                let engineOutcome = this.engine.determineOutcome(action, this.state);

                this.updateState(engineOutcome);
                this.reportOutcomes(engineOutcome);

                player.action = undefined;
            }
        });
    }

    runGame() {
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
