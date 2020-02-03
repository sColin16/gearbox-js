// Base class for storing state for all simultaneous games
class SimState {
    constructor(terminalState = false) {
        this.terminalState = terminalState;
    }
}

class SeqState extends SimState {
    constructor(terminalState = false, turn = 0) {
        super(terminalState);
        this.turn = turn; // Stores which player should move next
                          // Necessary in games when players can move multiple time in a row
                          // (Like dots and boxes or mancala)             
    }
}

// One field of the outcome object, which stores the field for the player and the opponents
class OutcomeField {
    constructor(personal, opponents) {
        this.personal = personal;
        this.opponents = opponents;
    }

    static personalizeField(field, index) {
        let fieldCopy = field.slice()

        let personalOutcome = fieldCopy.splice(index, 1)[0];

        return new OutcomeField(personalOutcome, fieldCopy)
    }
}

// Lets a player know if a sequential move was their own, or whose it was
class PlayerID {
    constructor(ownAction, playerID) {
        this.ownAction = ownAction;
        this.playerID = playerID;
    }

    // Index of the index of the player to make it for, playerID is who took the action
    static makeID(index, playerID) {
        let ownAction = index == playerID ? true : false;

        if (!ownAction && index < playerID) {
            playerID -= 1;
        } else if(ownAction) {
            playerID = undefined;
        }

        return new PlayerID(ownAction, playerID);
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

    static personalizeOutcome(engineOutcome, index) {
        let validTurn = engineOutcome.validTurn;        
        let newState = engineOutcome.newState;

        let actionValidities = OutcomeField.personalizeField(engineOutcome.actionValidities, index);
        let utilities = OutcomeField.personalizeField(engineOutcome.utilities, index);

        // Only return the actions if they were all valid. This prevents players from
        // strategically making invalid moves to study opponent behavoiral patterns
        let actions = validTurn ? OutcomeField.personalizeField(engineOutcome.actions, index) 
            : undefined;

        return new SimPlayerOutcome(validTurn, newState, utilities, actionValidities, actions);
    }
}

class SeqEngineOutcome extends Outcome {
    constructor(validTurn, newState, utilities, validAction, action, playerID) {
        super(validTurn, newState, utilities);

        // Universal property: redundant with validTurn, mirrors moveValidities
        this.validAction = validAction;

        // Universal property: the move made by the player whose turn it was
        // NOTE: only returned if validMove and validTurn is true
        this.action = action;

        // Customized property: ID of the player that made the move relative to the player
        this.playerID = playerID;
    }
}

class SeqPlayerOutcome extends SeqEngineOutcome {
    constructor(validTurn, newState, utilities, validAction, action, playerID) {
        super(validTurn, newState, utilities, validAction, action, playerID);
    }

    static personalizeOutcome(engineOutcome, index) {
        let validTurn = engineOutcome.validTurn;
        let newState = engineOutcome.newState;
        let validAction = engineOutcome.validAction;

        let utilities = OutcomeField.personalizeField(engineOutcome.utilities, index);

        // Only allow players to see the action if it was valid
        let action = validTurn ? engineOutcome.action : undefined;

        let playerID = PlayerID.makeID(index, engineOutcome.playerID);

        return new SeqPlayerOutcome(validTurn, newState, utilities, validAction, action, playerID);
    }
}

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
}


// Moderator subclass for seqeuntial games, where turns take place one after the other
// TODO: move the runGame method into the moderator class?
// May also be able to combine other parts of runTurn
class SeqModerator extends Moderator {
    constructor(players, engine, state) {
        super(players, engine, state)
    }

    async runTurn() {
        let action = await this.players[this.state.turn].getAction(this.state);

        let engineOutcome = this.engine.determineOutcome(action, this.state, this.state.turn);
        this.state = engineOutcome.newState;

        this.players.forEach((player, i) =>
            player.reportOutcome(SeqPlayerOutcome.personalizeOutcome(engineOutcome, i)));
    }

    async runGame() {
        this.players.forEach(player => player.reportGameStart());

         while(!this.state.terminalState) {
            await this.runTurn();
         }
        
        this.players.forEach(player => player.reportGameEnd());

    }
}

// Moderator subcalss for simultaneous games, where all players make a move at once
class SimModerator extends Moderator {
    constructor(players, engine, state) {
        super(players, engine, state)
    }

    async runTurn() {
        let actions = await Promise.all(this.players.map(player => player.getAction(this.state)));    
        let engineOutcome = this.engine.determineOutcome(actions, this.state);
        this.state = engineOutcome.newState;


        this.players.forEach((player, i) => 
            player.reportOutcome(SimPlayerOutcome.personalizeOutcome(engineOutcome, i))) 
    }

    async runGame() {
        this.players.forEach(player => player.reportGameStart());

        while(!this.state.terminalState) {
            await this.runTurn()
        }

        this.players.forEach(player => player.reportGameEnd());
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

        let outcome = new SeqEngineOutcome(validTurn, newState, utilities, validTurn, action, playerID);

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
