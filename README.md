# Saffron Rush

Saffron Rush is an original top-down kitchen shift game for the desktop browser.
You are the line chef: orders arrive on the ticket board at the bottom of the
kitchen, each one asking for a small dish built from prepared ingredients.

## How it plays

- Move with the arrow keys or WASD.
- SPACE or E interacts with whatever is in front of you: take an ingredient from
  a source counter, put it down or pick it up from a station, or serve at the
  orange PASS tile.
- Q drops the held item on the nearest counter or cutting board.
- P pauses the shift.

Ingredients differ in prep: tomatoes, onions and cheese go through the cutting
board; mushrooms and dough must be cooked in a pan and burn if left too long;
basil is used fresh. Chopped and cooked items are stacked onto a plate from the
plate rack, and a plate whose contents exactly match a ticket is served at the
pass for points, with a tip when it goes out fast and a combo bonus for serving
back-to-back. A wrong dish or a missed order costs a heart, and three lost
hearts end the shift. Every level serves a few more dishes than the last and
unlocks more of the menu, up to the six-recipe Grand Banquet.

## Running it

The game is plain static files with no build step:

    node serve.ts
    # then open http://localhost:8080 in a desktop browser

Everything — art on the canvas, the sound effects and the little kitchen tune —
is drawn or synthesized in code, so the game needs no network once loaded.

## Layout

    game/src/config.js       recipes, ingredients and tuning constants
    game/src/kitchenMap.js   the tile map and station layout
    game/src/main.js         game loop, screens and staged screenshot scenes
    game/src/render.js       all canvas drawing
    game/src/world.js        world state, interactions, chopping and cooking
    game/src/movement.js     collision and sliding movement
    game/src/orderBoard.js   ticket spawning, patience and judging plates
    game/src/plates.js       plate assembly
    game/src/scoring.js      level progression
    game/src/levels.js       level names and goals
    game/src/sfx.js          WebAudio sound effects and music
    game/src/rng.js          seeded random numbers
    main.ts                  hands the entry in and writes the dossier
    serve.ts                 the little development server

MIT licensed — see LICENSE.

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Henra09/cooking-game-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Henra09/cooking-game-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
