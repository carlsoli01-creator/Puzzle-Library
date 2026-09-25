# Genius Lab

A brain-training app for measuring and improving your mind: reaction time, memory, focus, maths, reading comprehension, reasoning and perception. It includes a built-in IQ test, a statistics dashboard and a personal AI coach called Quiblee.

To use it, open [`index.html`](index.html) in a browser. There's no build step and no server. Progress is saved in your browser's local storage.

## What's inside

**Core Training** (7 games)
- **Reaction Time**: five-trial simple reaction test with false-start detection
- **Choice Reaction**: four pads (D F J K), twelve trials of decision speed
- **Digit Span**: forward and backward working-memory span
- **Pattern Memory**: visuospatial grid recall that grows as you level up
- **N-Back**: position 1- to 4-back, scored on hits minus false alarms, with auto level-up
- **Stroop Focus**: 45 seconds of naming ink colour, not the word
- **Mental Math Sprint**: 60 seconds of adaptive arithmetic across five difficulty levels

**Logic Lab** (10 drills): number sequences, odd number out, balance scales, syllogisms, quantity compare, time arithmetic, code breaker, number grids, binary translator, order deduction.

**Word Lab** (10 drills): synonyms, antonyms, anagram solver, analogies, spelling spotter, missing letter, category sort, vocabulary builder, word bridges, word usage.

**Visual Lab** (10 drills): flash count, colour sense, mental rotation, symmetry check, quick estimate, clock reader, visual search, proportion sense, twin finder.

**Read & Recall**: eight original short articles on science and history. Your reading speed is timed, then the text is hidden and you answer a four-question quiz. Scored as *effective WPM* (speed × comprehension).

**IQ Test**: 30 questions in 25 minutes across Pattern (procedurally drawn matrix-reasoning items), Numeric, Verbal and Logic sections. You get a full report with an IQ estimate, a percentile, a bell curve, a section breakdown and an answer review with explanations. Scores are an estimate for practice, not a clinical assessment.

**Biometrics**: a statistics dashboard with:
- a Cognitive Index (0–1000) with its week-over-week change and an estimated percentile
- a seven-domain radar
- vital signs (reaction time, consistency CV, working memory, n-back level, inhibition, reading speed, IQ)
- an index trend line
- a 16-week activity heatmap
- domain scores and performance by time of day
- auto-generated insights
- a per-activity table (n, mean, SD, best, last, gain, least-squares trend)
- JSON export

**Quiblee**: a personal AI coach in a chat. It reads your stats and can plan your training, review your progress, explain your IQ result and give evidence-based tips. It works offline with a built-in coach. You can optionally paste your own Anthropic API key (key icon) to have Claude answer open-ended questions. The key stays in your browser and is sent only to Anthropic.

**Progression**: XP, eight levels (Novice → Polymath), daily streaks and a daily plan that targets your weakest domains.

## Classic puzzles

The original Puzzle Library games are still here and linked from the Train page:

- [Number Puzzle for Coders](puzzles/number-puzzle-for-coders/index.html): a 4×4 sliding tile puzzle with a DEC/HEX toggle
- [Word Puzzle for Coders](puzzles/word-puzzle-for-coders/index.html): unscramble short coding terms

## Code layout

```
index.html            app shell
app/style.css         dark, earthy design system
app/js/core.js        storage, scoring, router, shared UI helpers
app/js/games-*.js     core training games
app/js/drills.js      drill engine + Logic, Word and Visual labs
app/js/articles.js    reading content
app/js/reading.js     reading trainer
app/js/iq-*.js        IQ item bank (with matrix generator) and test/report
app/js/biometrics.js  statistics dashboard
app/js/coach.js       Quiblee chat coach
app/js/pages.js       home, training hub, tile artwork
```
