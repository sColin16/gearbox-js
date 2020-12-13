// // Moderator classes
// class Moderator {
//     constructor(players, engine, state) {
//         this.players = [];

//         for (let i = 0; i < players.length; i++) {
//             this.players[i] = this.initializeClass(players[i]);
//         }

//         this.engine = this.initializeClass(engine);
//         this.state = this.initializeClass(state);
//     }

//     initializeClass(arg) {
//         if (typeof arg == "function") {
//             return new arg();
//         }

//         return arg;
//     }

//     // Handles actions necessary to start the game
//     // TODO: consider providing an optional payload of data that includes the state to players
//     startGame() {
//         this.players.forEach((player, playerID) => {
//             let stateCopy = _.cloneDeep(this.state);
//             let transformedState = this.transformState(stateCopy, playerID);

//             player.handleGameStart(transformedState);
//         });

//         this.engine.setPlayerCount(this.players.length);
//     }

//     // Handles actions necessary to end the game
//     endGame() {
//         this.players.forEach(player => player.handleGameEnd());
//     }

//     // Should be defined by subclasses, if they used the default runGame loop
//     runTurn() {}

//     // Simple game loop sufficient from Sim/Seq Moderators
//     async runGame() {
//         this.startGame();

//         while (!this.state.terminalState) {
//             await this.runTurn();
//         }

//         this.endGame();
//     }

//     engineUpdate(action) {
//         let engineOutcome = this.engine.determineOutcome(this.state, action);

//         this.state = engineOutcome.state;

//         this.players.forEach((player, playerID) => {
//             if (!this.hideOutcome(engineOutcome, playerID)) {
//                 let personalOutcome = this.personalizeOutcome(engineOutcome, playerID);

//                 player.handleOutcome(personalOutcome);
//             }
//         });
//     }

//     // TODO: consider enumerating over the properties somehow
//     // Would probably require a dictionary of functions for each transformation
//     personalizeOutcome(engineOutcome, playerID) {
//         // Handle a copy of all the fields, so transform functions don't have to do the copying
//         let outcomeCopy = _.cloneDeep(engineOutcome);

//         // Transform all aspects of the outcome
//         let validity = this.transformValidity(outcomeCopy.validity, playerID);
//         let action = this.transformActionHandler(outcomeCopy.action, playerID);
//         let utilities = this.transformUtilities(outcomeCopy.utilities, playerID);
//         let state = this.transformStateHandler(outcomeCopy.state, playerID);
//         let stateDelta = this.transformStateDelta(outcomeCopy.stateDelta, playerID);

//         // Return the transformed outcome
//         return new PlayerOutcome(validity, action, utilities, state, stateDelta);
//     }

//     // If this function returns true, the outcome will not be reported to the player
//     hideOutcome(engineOutcome, playerID) {
//         return false;
//     }

//     // Functions that transform EngineOutcome fields to PlayerOutcome fields
//     transformValidity(validity, playerID) {
//         return validity;
//     }

//     // This handler is necessary for Seq/RealTime Moderators to implment custom functionality
//     // I'd rather than an extra function on my side than require a call to super every time
//     // on the developer's side
//     transformActionHandler(action, playerID) {
//         return this.transformAction(action, playerID);
//     }

//     transformAction(action, playerID) {
//         return action;
//     }

//     transformUtilities(utilities, playerID) {
//         return this.makePlayerOutcomeField(utilities, playerID);
//     }

//     transformStateHandler(state, playerID) {
//         return this.transformState(state, playerID);
//     }

//     transformState(state, playerID) {
//         return state;
//     }

//     transformStateDelta(stateDelta, playerID) {
//         return stateDelta
//     }

//     // Helper function that transforms an array into an object that differentiates between the
//     // value for the player, and the values for the other players
//     makePlayerOutcomeField(arr, playerID) {
//         let personalOutcome = arr.splice(playerID, 1)[0]; // Extract player's value

//         return new PlayerOutcomeField(personalOutcome, arr);
//     }

//     // Helper function to transform the playerID field of an action in accordance with the above
//     // transformation to a playerOutcomeField
//     adjustPlayerID(forPlayerID, actionPlayerID) {
//         if (forPlayerID == actionPlayerID) {
//             return new PlayerIDField(true, undefined); // The action was an own-action

//         } else if (forPlayerID < actionPlayerID) {
//             return new PlayerIDField(false, actionPlayerID - 1);

//         } else {
//             return new PlayerIDField(false, actionPlayerID);
//         }
//     }
// }

// class SeqModerator extends Moderator {
//     async runTurn() {
//         // Get the action from the player
//         let actionRepr = await this.players[this.state.turn].getAction(this.state);

//         // Package it with the turn
//         let action = new SeqAction(actionRepr, this.state.turn);

//         // Run the action through the engine, reporting outcomes, etc.
//         this.engineUpdate(action);
//     }

//     transformActionHandler(action, playerID) {
//         action = this.transformAction(action, playerID); // Allow subclass to transform action

//         action.playerID = this.adjustPlayerID(playerID, action.playerID); // Adjust ID

//         return action;
//     }

//     transformStateHandler(state, playerID) {
//         state = this.transformState(state, playerID); // Allow subclass to transform state

//         state.turn = this.adjustPlayerID(playerID, state.turn);

//         return state;
//     }
// }

// class SimModerator extends Moderator {
//     async runTurn() {
//         // Get actions from all players, waiting for every player to submit an action
//         let actionRepr = await Promise.all(
//             this.players.map(player => player.getAction(this.state)));

//         this.engineUpdate(new SimAction(actionRepr));
//     }

//     transformValidity(validity, playerID) {
//         validity.individual = this.makePlayerOutcomeField(validity.individual, playerID);

//         return validity;
//     }

//     transformAction(action, playerID) {
//         action.actionRepr = this.makePlayerOutcomeField(action.actionRepr, playerID);

//         return action;
//     }
// }

// // Note this class also uses the transformActionHandler of SeqModerator (after class def.)
// class RealTimeModerator extends Moderator {
//     constructor(players, engine, state) {
//         super(players, engine, state);

//         // Stores all the action that need to be processed still
//         this.actionQueue = new Queue();

//         // Bind the moderator to each player, so it knows where to submit it's move
//         this.players.forEach(player => player.bindModerator(this));

//         // Store the timeouts, so they can be cancelled when the game ends
//         this.actionQueueTimeout;
//         this.engineStepTimeout;
//     }

//     async runGame() {
//         this.actionQueue = new Queue(); // Reset the action queue when a new game begins

//         this.startGame(); // Call superclass method to alert players of game start

//         // Schedule the first engine step
//         this.engineStepTimeout = setTimeout(this.engineStep.bind(this),
//             (1000 / this.state.stepFreq));

//         // And start handling moves
//         this.processActionQueue();
//     }

//     // Helper function at the end of processActionQueue and engineStep used to schedule another
//     // or report game over if the game is indeed over
//     reschedule(funcName, timeoutName, interval) {
//         let otherTimeout = timeoutName == 'actionQueueTimeout' ? 
//             'engineStepTimeout' : 'actionQueueTimeout';

//         // If the game is not over, schedule the function again
//         if (!this.state.terminalState) {
//             this[timeoutName] = setTimeout(this[funcName].bind(this), interval);

//         // If the game is over, report gameover to the players, and cancel the other process
//         } else {
//             this.endGame();

//             clearTimeout(this[otherTimeout]);
//         }
//     }

//     processActionQueue() {
//         // Limit numnber of actions processed to number at the start. Otherwise, players could
//         // keep submitting moves, blocking the event queue
//         let actionsProcessed = 0;
//         let actionsToProcess = this.actionQueue.size();

//         // Keep processing until we've done them all (to the limit), or the game ended
//         while(!this.state.terminalState && actionsProcessed < actionsToProcess) {
//             let nextAction = this.actionQueue.dequeue();

//             this.engineUpdate(nextAction);

//             actionsProcessed++;
//         }

//         // Schedule another batch, or report gameover
//         this.reschedule('processActionQueue', 'actionQueueTimeout', 0);
//     }

//     engineStep() {
//         // The first arg is actionRepr, second is playerID, third is engineStep
//         let stepAction = new RealTimeAction('step', undefined, true);

//         this.engineUpdate(stepAction);

//         this.reschedule('engineStep', 'engineStepTimeout', (1000 / this.state.stepFreq));
//     }

//     handleAction(actionRepr, playerRef) {
//         // Build a real-time action based on the representation passed by the user
//         let newAction = new RealTimeAction(actionRepr, this.players.indexOf(playerRef), false);

//         this.actionQueue.enqueue(newAction);
//     }
// }
// // Take the transformActionHandler method of the SeqModerator as well
// RealTimeModerator.prototype.transformActionHandler =
//     SeqModerator.prototype.transformActionHandler;
