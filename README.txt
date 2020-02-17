Gearbox-js

Gearbox is a highly modular framework for simulating games, with the end goal of supporting
various machine learning tasks, including reinforcement learning.

There are three main parts to gearbox's API: the moderator, engine, and player

The moderator handles the flow of the game, and ensures that players get all the information
about the game that they could need.

The engine is a stateless entity that verifies if certain actions are valid in a given state,
and if so, returns the the new state, and any utilities players may have gained

The players are the agents. They take a state as an input, and provide an action as an output.
More complex behavoir can be programmed into them, but the moderator assumes that every
player is a stateless entity.

Currently, simultaneous, sequential, and real-time gameplay is supported by the API. Four
examples, Rock, Paper, Scissors, Nim (really the subtraction game), a counting game, and snake
are provided. There are a series of improvement that will be made to the API over time. Here are
a few on the roadmap:

1. Action Filtering: provide a method for Seq and RealTime moderator subclasses to not report
   all outcomes to all players, based on the action, state, and playerIndex
2. NetworkPlayer class, will allow the API to request moves from other servers. This will be 
   especially useful for interfacing with intelligent players written in other languages, or
   to simulate multiplayer games more effectively.
3. gearbox-py will be a new library that will implement the same protocols as gearbox-js.
   To support the use of the NetworkPlayer on the frontend, this library will also include
   network classes, except they will be more server-based (whereas the js are more client-based)

Here are some games/improvements that are planned to be implemented:
    - Rock,Paper,Scissors graphics improvments
    - Make Nim actually Nim, allow a choice for how many piles and tokens to start with
    - Tic-Tac-Toe game
    - Connect 4 game
    - Buying/Selling Game?
    - Centipede Game
    - Mancala
    - Dots and Boxes
    - Tetris

Website to use to get js files
https://www.jsdelivr.com/features
