# LinkedIn Games Bot

Chrome extension that automatically solves LinkedIn puzzle games.

## Getting Started

1. Clone this repository
2. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and choose this folder
3. Navigate to a LinkedIn game (e.g., https://www.linkedin.com/games/tango/)
4. Click the **Solve Tango** button that appears in the top-right corner

## How It Works

### Tango Solver

The Tango solver uses constraint propagation and backtracking:

1. **Parse** - Reads the game board from the DOM
2. **Solve** - Applies game rules:
   - Equal (=) constraints: connected cells must match
   - Opposite (×) constraints: connected cells must differ
   - Balance rule: each row/column needs 3 suns and 3 moons
   - No-triple rule: max 2 consecutive same symbols
3. **Apply** - Clicks cells to fill in the solution
