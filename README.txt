Gearbox-js

Gearbox is a highly modular framework for simulating games, with the end goal of supporting
various machine learning tasks, including reinforcement learning.

There are a few advantages to using Gearbox. First, the core of the library includes functions and
classes to allow you to quickly program your own game, while only having to worry about the logic
of the game. Gearbox handles asking players for moves, alerting players about the results of turns,
inlcuding who won, if the game is over, etc. It also provides functions that can be overridden
to deeply customize how this data is presented to players. Furthermore, by using the games that have
already been made, or games made by other players, you can start developing artificially intelligent
agents to play the games, without having to write the logic for the game, or the logic for simulating
a game. Plus, you have access to plenty of data about the game, and a highly customizable and 
modular framework to use the data as needed. Finally, by providing a consistent API for simluated
games, Gearbox opens up the potential to make agents that can be easily customized to learn to play
any game, whether its Tic-Tac-Toe, Connect-Four, or Go.

There are three main parts to gearbox's API: the moderator, engine, and player

The moderator handles the flow of the game, and ensures that players get all the information
about the game that they could need.

The engine is a stateless entity that verifies if certain actions are valid in a given state,
and if so, returns the the new state, and any utilities players may have gained

The players are the agents. They take a state as an input, and provide an action as an output.
More complex behavoir can be programmed into them, but the moderator assumes that every
player is a stateless entity.

Currently, simultaneous, sequential, and real-time gameplay is supported by the API. Five
examples, Rock, Paper, Scissors, Nim (really the subtraction game), a counting game, snake, and pong
are provided. Through these examples, various aspects of the API are used. There are a series of 
improvement that will be made to the API over time. Here are a few on the roadmap:

1. 2048 Game + stateDelta, a description of the changes made to the state primarily for animation
   purposes
2. NetworkPlayer class, will allow the API to request moves from other servers. This will be 
   especially useful for interfacing with intelligent players written in other languages, or
   to simulate multiplayer games more effectively.
3. gearbox-py will be a new library that will implement the same protocols as gearbox-js.
   To support the use of the NetworkPlayer on the frontend, this library will also include
   network classes, except they will be more server-based (whereas the js are more client-based)
4. Potentially instead of using python, this project will use deno to run both client and server-side
   entities. That would greatly reduce the amount of code that needs to be written

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
