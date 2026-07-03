# Code Breaker

A Mastermind-style number deduction puzzle styled as a soft, card-based dashboard: a blue-gradient hero card, rounded stat cards, and pill buttons, with the board itself living in a dark terminal-style panel where every digit keeps its own distinct color.

## Rules

Crack the secret 4-digit code (digits 0&ndash;9, no repeats) in 8 guesses or fewer. After each guess, every digit is marked exact (right digit, right spot), close (right digit, wrong spot), or absent.

## Features

- A fresh, randomly generated unique-digit secret every round
- Wordle-style per-digit feedback tiles plus an "X exact &middot; Y close" summary for every guess
- A hint toggle that dims number-pad digits you've already ruled out
- Live "guesses" and "attempts left" stats, plus a timer
- Win and lose screens (the lose screen reveals the code) with a New Code restart

To play, open `code-breaker-puzzle/index.html` in a browser.
