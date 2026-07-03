# Number Grid

A 4&times;4 mini sudoku styled as a soft, card-based dashboard: a blue-gradient hero card, rounded stat cards, and pill buttons, with the grid itself living in a dark terminal-style panel where each digit (1&ndash;4) keeps its own distinct color.

## Rules

Fill every row, column, and 2&times;2 box with the digits 1&ndash;4, no repeats.

## Features

- A fresh, randomly generated valid grid every round (8 starting givens)
- Tap a cell, then tap a number below to fill it &mdash; tap the same number again to clear it
- Live "filled" and "conflicts" stat cards
- Toggleable conflict highlighting (the `!` button in the header)
- Timer starts on your first move; a win is any full grid with zero conflicts
- New Grid / Erase controls, plus a completion screen

To play, open `sudoku-puzzle/index.html` in a browser.
