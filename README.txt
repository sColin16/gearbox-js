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

Currently, both simultaneous and sequential gameplay is supported by the API. Two examples,
Rock, Paper, Scissors, and Nim (really the subtraction game) are provided. There are a series
of improvement that will be made to the API over time. Here are a few on the roadmap:

1. RealTimeEngine, for simulating games (such as video games) that will advance even if players
   don't take any actions. This would be useful for simulating a game like Tetris, for example
    - Snake will likely be created as an example
2. NetworkPlayer class, will allow the API to request moves from other servers. This will be 
   especially useful for interfacing with intelligent players written in other languages, or
   to simulate multiplayer games more effectively.
3. gearbox-py will be a new library that will implement the same protocols as gearbox-js.
   To support the use of the NetworkPlayer on the frontend, this library will also include
   network classes, except they will be more server-based (whereas the js are more client-based)

Website to use to get js files
https://www.jsdelivr.com/features
