# Gearbox

Gearbox is an extensible JavaScript framework for simulating reinforcement learning enviornments,
to support the development of reinforcement learning and other AI agents

## Motivation

When creating AI agents, designing the flow of data through the system can be a repetitive and
time-consuming task. Many agents need similar data to train, and easy interfaces for humans
to play against these agents are often desirable. Unfortunately, there are no good frameworks
that support this data flow, or provide game logic for common games. Gearbox aims to fill that gap,
making it easier to train AI agents, and allowing for the reuse of AI agent code across different games.

## API Overview

Gearbox's API is multi-layered, allowing for easy customization. 

At the highest level are existing game implementations. If you're looking to create an AI agent for 
one of the existing games built in to gearbox (currently Rock-Paper-Scissors, Nim, Snake, and Pong,
and expanding), you just have to implement a player, and you can be up and running quickly.

If there's a game or enviornment that isn't built into gearbox, you just have to define the game logic,
and existing API components will handle the flow of data. Currently, real-time, sequential, and 
simultaneous games/enviornments are supported.

If one the existing types of games/enviornments doesn't fit your needs, the core of the Gearbox API
provides an extensive basis for routing data. Players  get data about other players' actions (and
the validity of those actions), the utility every player gained during a turn, the state, and changes
to the state following each turn. Furthermore, the core fo Gearbox provides an API to hide and transform
data, so that playesr can only see the data the should be seeing (e.g. hiding other players' cards in 
a game of Poker).

The Gearbox API is based on 3 components: Moderators, Players, and Engines

Moderators handle the flow of the game, delivering players all their data about the game, and handling
information and about player actions.

Players are the agents of the system that take in the state and other information, and take actions
to change the state, and gain utility.

Engines handle the game logic, determining both if an action is valid, and the outcome of that action,
if the action is indeed valid

Pneumatic pipelines are used between these components to support information transformation and hiding.
A comrehensive set of tools has been added to provide another layer of abstraction on top of the
pneumatic pipeline, so that all transformations can be defined in a uniform way.

## Roadmap

Check out the Trello board to see what's on the roadmap: https://trello.com/b/CBzdMr9q
