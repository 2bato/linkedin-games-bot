# LinkedIn Games Bot

Chrome extension that automatically solves LinkedIn puzzle games.

## Getting Started

1. Clone this repository
2. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and choose this folder
3. Navigate to a LinkedIn game (e.g., https://www.linkedin.com/games/tango/)
4. Click the **Solve** button that appears in the top-right corner

## How It Works

1. **Parse** - Read the game board from the DOM
2. **Solve** - Backtracking with constraints (Tango/Queens) or Hamiltonian path (Zip)
3. **Apply** - Simulate clicks (Tango/Queens) or arrow keys (Zip) to fill in the solution
