/**
 * LinkedIn Mini Sudoku Auto-Solver
 */

(function () {
  "use strict";

  const GRID_SIZE = 6;
  const BLOCK_ROWS = 2;
  const BLOCK_COLS = 3;

  /**
   * Parse the Mini Sudoku board from the DOM
   * @returns {Object} { grid: number[][], cells: Element[], prefilled: boolean[][] } or null
   */
  function parseSudokuBoard() {
    const cellElements = document.querySelectorAll(".sudoku-cell");

    if (cellElements.length === 0) {
      console.error("Mini Sudoku: Could not find game cells (.sudoku-cell)");
      return null;
    }

    if (cellElements.length !== GRID_SIZE * GRID_SIZE) {
      console.error(
        `Mini Sudoku: Expected ${GRID_SIZE * GRID_SIZE} cells, found ${cellElements.length}`,
      );
      return null;
    }

    console.log(`Mini Sudoku: Found ${cellElements.length} cells`);

    // Initialize grid
    const grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0));
    const prefilled = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false));
    const cells = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));

    // Parse cells - they appear in row-major order
    cellElements.forEach((cell, index) => {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      cells[row][col] = cell;

      // Check if pre-filled
      const isPrefilled = cell.classList.contains("sudoku-cell-prefilled");
      prefilled[row][col] = isPrefilled;

      // Get the number value
      const text = cell.innerText.trim();
      const num = parseInt(text);
      if (!isNaN(num) && num >= 1 && num <= GRID_SIZE) {
        grid[row][col] = num;
      }
    });

    console.log("Mini Sudoku: Parsed grid", grid);

    return { grid, cells, prefilled };
  }

  /**
   * Check if placing num at (row, col) is valid
   */
  function isValid(grid, row, col, num) {
    // Check row
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][col] === num) return false;
    }

    // Check 2x3 block
    const blockStartRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
    const blockStartCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;
    for (let r = blockStartRow; r < blockStartRow + BLOCK_ROWS; r++) {
      for (let c = blockStartCol; c < blockStartCol + BLOCK_COLS; c++) {
        if (grid[r][c] === num) return false;
      }
    }

    return true;
  }

  /**
   * Solve the sudoku using backtracking
   */
  function solveSudoku(grid, prefilled) {
    const solution = grid.map((row) => [...row]);

    function solve() {
      // Find next empty cell
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (solution[row][col] === 0) {
            // Try each number 1-6
            for (let num = 1; num <= GRID_SIZE; num++) {
              if (isValid(solution, row, col, num)) {
                solution[row][col] = num;
                if (solve()) {
                  return true;
                }
                solution[row][col] = 0;
              }
            }
            return false; // No valid number found, backtrack
          }
        }
      }
      return true; // All cells filled
    }

    if (solve()) {
      return solution;
    }
    return null;
  }

  /**
   * Simulate a click on an element
   */
  function simulateClick(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      button: 0,
      buttons: 1,
    };

    element.dispatchEvent(new MouseEvent("mousedown", eventOptions));
    element.dispatchEvent(new MouseEvent("mouseup", eventOptions));
    element.dispatchEvent(new MouseEvent("click", eventOptions));
  }

  /**
   * Apply the solution by clicking cells and typing numbers
   */
  async function applySolution(cells, currentGrid, solution, prefilled) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        // Skip pre-filled cells
        if (prefilled[row][col]) continue;

        const target = solution[row][col];
        const current = currentGrid[row][col];

        if (current === target) continue;

        const cell = cells[row][col];
        if (!cell) continue;

        // Click the cell to select it
        simulateClick(cell);
        await sleep(50);

        // Type the number using keyboard - dispatch to cell and document
        const keydownEvent = new KeyboardEvent("keydown", {
          key: String(target),
          code: `Digit${target}`,
          keyCode: 48 + target,
          which: 48 + target,
          bubbles: true,
          cancelable: true,
        });
        const keypressEvent = new KeyboardEvent("keypress", {
          key: String(target),
          code: `Digit${target}`,
          keyCode: 48 + target,
          which: 48 + target,
          bubbles: true,
          cancelable: true,
        });
        const keyupEvent = new KeyboardEvent("keyup", {
          key: String(target),
          code: `Digit${target}`,
          keyCode: 48 + target,
          which: 48 + target,
          bubbles: true,
          cancelable: true,
        });

        cell.dispatchEvent(keydownEvent);
        cell.dispatchEvent(keypressEvent);
        cell.dispatchEvent(keyupEvent);
        document.dispatchEvent(keydownEvent);

        await sleep(100);
      }
    }

    return true;
  }

  /**
   * Sleep for specified milliseconds
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Show a message on the page
   */
  function showMessage(msg) {
    const existing = document.getElementById("sudoku-solver-msg");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "sudoku-solver-msg";
    div.textContent = msg;
    div.style.cssText = `
      position: fixed;
      top: 130px;
      right: 20px;
      z-index: 10001;
      padding: 12px 20px;
      font-size: 14px;
      color: white;
      background: #c92a2a;
      border-radius: 8px;
      max-width: 280px;
    `;
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 5000);
  }

  /**
   * Add solve button to the page
   */
  function addSolveButton() {
    if (document.getElementById("sudoku-solver-btn")) return;

    const button = document.createElement("button");
    button.id = "sudoku-solver-btn";
    button.textContent = "Solve Sudoku";
    button.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      color: white;
      background: #0077b5;
      border: none;
      border-radius: 24px;
      cursor: pointer;
    `;

    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Solving...";

      try {
        const parsed = parseSudokuBoard();
        if (!parsed) {
          showMessage(
            "Could not parse the Sudoku board. Make sure the game is loaded.",
          );
          button.textContent = "Solve Sudoku";
          button.disabled = false;
          return;
        }

        const solution = solveSudoku(parsed.grid, parsed.prefilled);
        if (!solution) {
          showMessage("Could not find a solution. The puzzle may be invalid.");
          button.textContent = "Solve Sudoku";
          button.disabled = false;
          return;
        }

        console.log("Mini Sudoku: Solution found", solution);
        const success = await applySolution(
          parsed.cells,
          parsed.grid,
          solution,
          parsed.prefilled,
        );

        if (success) {
          button.textContent = "Solved!";
        } else {
          showMessage("Error applying solution.");
          button.textContent = "Solve Sudoku";
        }

        setTimeout(() => {
          button.textContent = "Solve Sudoku";
          button.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Mini Sudoku solver error:", error);
        showMessage("An error occurred: " + error.message);
        button.textContent = "Solve Sudoku";
        button.disabled = false;
      }
    });

    document.body.appendChild(button);
    console.log("Mini Sudoku: Solve button added");
  }

  function init() {
    if (
      !window.location.href.includes("/games/mini-sudoku") &&
      !window.location.href.includes("/games/view/mini-sudoku")
    )
      return;

    const checkForGame = () => {
      if (document.querySelectorAll(".sudoku-cell").length > 0) {
        addSolveButton();
      } else {
        setTimeout(checkForGame, 500);
      }
    };
    setTimeout(checkForGame, 500);

    new MutationObserver(() => {
      if (
        document.querySelectorAll(".sudoku-cell").length > 0 &&
        !document.getElementById("sudoku-solver-btn")
      ) {
        addSolveButton();
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
