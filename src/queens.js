/**
 * LinkedIn Queens Auto-Solver
 */

(function () {
  "use strict";

  const EMPTY = 0;
  const QUEEN = 1;
  const CROSS = 2;

  /**
   * Parse the Queens board from the DOM
   * @returns {Object} { grid: number[][], regions: number[][], cells: Element[][], size: number }
   */
  function parseQueensBoard() {
    // Find all cells using the exact selector: div.queens-cell-with-border
    const cellElements = document.querySelectorAll(".queens-cell-with-border");

    if (cellElements.length === 0) {
      console.error(
        "Queens: Could not find game cells (.queens-cell-with-border)"
      );
      return null;
    }

    console.log(`Queens: Found ${cellElements.length} cells`);

    // Determine grid size from cell count
    const size = Math.sqrt(cellElements.length);
    if (!Number.isInteger(size)) {
      console.error(`Queens: Invalid cell count ${cellElements.length}`);
      return null;
    }

    // Initialize grid and cells array
    const grid = Array(size)
      .fill(null)
      .map(() => Array(size).fill(EMPTY));
    const regions = Array(size)
      .fill(null)
      .map(() => Array(size).fill(-1));
    const cells = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));

    // Parse cells - position from aria-label, color from class
    cellElements.forEach((cell) => {
      const ariaLabel = cell.getAttribute("aria-label") || "";

      // Parse position from aria-label: "... row X, column Y"
      const posMatch = ariaLabel.match(/row\s+(\d+),\s*column\s+(\d+)/i);
      if (!posMatch) return;

      const row = parseInt(posMatch[1]) - 1;
      const col = parseInt(posMatch[2]) - 1;

      if (row < 0 || row >= size || col < 0 || col >= size) return;

      cells[row][col] = cell;

      // Detect cell state from aria-label prefix
      const lowerLabel = ariaLabel.toLowerCase();
      if (lowerLabel.startsWith("queen")) {
        grid[row][col] = QUEEN;
      } else if (lowerLabel.startsWith("cross")) {
        grid[row][col] = CROSS;
      } else {
        grid[row][col] = EMPTY;
      }

      // Detect region from cell-color-N class
      const classList = cell.className;
      const colorMatch = classList.match(/cell-color-(\d+)/);
      if (colorMatch) {
        regions[row][col] = parseInt(colorMatch[1]);
      }
    });

    console.log("Queens: Parsed grid", grid);
    console.log("Queens: Detected regions", regions);

    return { grid, regions, cells, size };
  }

  /**
   * Check if placing a queen at (row, col) is valid
   */
  function isValidPlacement(solution, regions, row, col, size) {
    // Check row for other queens
    for (let c = 0; c < size; c++) {
      if (c !== col && solution[row][c] === QUEEN) return false;
    }

    // Check column for other queens
    for (let r = 0; r < size; r++) {
      if (r !== row && solution[r][col] === QUEEN) return false;
    }

    // Check region for other queens
    const regionId = regions[row][col];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          (r !== row || c !== col) &&
          regions[r][c] === regionId &&
          solution[r][c] === QUEEN
        ) {
          return false;
        }
      }
    }

    // Check adjacency (8 directions)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (
          nr >= 0 &&
          nr < size &&
          nc >= 0 &&
          nc < size &&
          solution[nr][nc] === QUEEN
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Solve the Queens puzzle using backtracking
   * @param {number[][]} grid - Initial grid state
   * @param {number[][]} regions - Region assignments
   * @param {number} size - Grid dimension
   * @returns {number[][]|null} Solved grid or null if unsolvable
   */
  function solveQueens(grid, regions, size) {
    const solution = grid.map((row) => [...row]);

    const queensPerRow = Array(size).fill(0);
    const queensPerCol = Array(size).fill(0);
    const queensPerRegion = new Map();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c] === QUEEN) {
          queensPerRow[r]++;
          queensPerCol[c]++;
          const regionId = regions[r][c];
          queensPerRegion.set(
            regionId,
            (queensPerRegion.get(regionId) || 0) + 1
          );
        }
      }
    }

    function solve(row) {
      if (row >= size) {
        for (let c = 0; c < size; c++) {
          if (queensPerCol[c] !== 1) return false;
        }
        return true;
      }

      if (queensPerRow[row] === 1) {
        return solve(row + 1);
      }

      for (let col = 0; col < size; col++) {
        if (solution[row][col] !== EMPTY) continue;

        const regionId = regions[row][col];
        if ((queensPerRegion.get(regionId) || 0) >= 1) continue;

        if (queensPerCol[col] >= 1) continue;

        if (!isValidPlacement(solution, regions, row, col, size)) continue;

        solution[row][col] = QUEEN;
        queensPerRow[row]++;
        queensPerCol[col]++;
        queensPerRegion.set(regionId, (queensPerRegion.get(regionId) || 0) + 1);

        if (solve(row + 1)) {
          return true;
        }

        solution[row][col] = EMPTY;
        queensPerRow[row]--;
        queensPerCol[col]--;
        queensPerRegion.set(regionId, queensPerRegion.get(regionId) - 1);
      }

      return false;
    }

    if (solve(0)) {
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
   * Apply the solution to the game by clicking cells
   */
  async function applySolution(cells, currentGrid, solution, size) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = cells[row][col];
        if (!cell) continue;

        const current = currentGrid[row][col];
        const target = solution[row][col];

        if (current === target) continue;

        let clicksNeeded = 0;
        if (target === QUEEN) {
          if (current === EMPTY) clicksNeeded = 2;
          else if (current === CROSS) clicksNeeded = 1;
        }

        for (let i = 0; i < clicksNeeded; i++) {
          simulateClick(cell);
          await sleep(80);
        }

        await sleep(50);
      }
    }
  }

  /**
   * Sleep
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Show a message on the page
   */
  function showMessage(msg) {
    const existing = document.getElementById("queens-solver-msg");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "queens-solver-msg";
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
    if (document.getElementById("queens-solver-btn")) return;

    const button = document.createElement("button");
    button.id = "queens-solver-btn";
    button.textContent = "Solve Queens";
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
        const parsed = parseQueensBoard();
        if (!parsed) {
          showMessage(
            "Could not parse the Queens board. Make sure the game is loaded."
          );
          button.textContent = "Solve Queens";
          button.disabled = false;
          return;
        }

        const solution = solveQueens(parsed.grid, parsed.regions, parsed.size);
        if (!solution) {
          showMessage(
            "Could not find a solution. The puzzle may be invalid or already solved incorrectly."
          );
          button.textContent = "Solve Queens";
          button.disabled = false;
          return;
        }

        console.log("Queens: Solution found", solution);
        await applySolution(parsed.cells, parsed.grid, solution, parsed.size);

        button.textContent = "Solved!";
        setTimeout(() => {
          button.textContent = "Solve Queens";
          button.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Queens solver error:", error);
        showMessage("An error occurred: " + error.message);
        button.textContent = "Solve Queens";
        button.disabled = false;
      }
    });

    document.body.appendChild(button);
    console.log("Queens: Solve button added");
  }

  function init() {
    if (
      !window.location.href.includes("/games/queens") &&
      !window.location.href.includes("/games/view/queens")
    )
      return;

    const checkForGame = () => {
      if (document.querySelectorAll(".queens-cell-with-border").length > 0) {
        addSolveButton();
      } else {
        setTimeout(checkForGame, 500);
      }
    };
    setTimeout(checkForGame, 500);

    new MutationObserver(() => {
      if (
        document.querySelectorAll(".queens-cell-with-border").length > 0 &&
        !document.getElementById("queens-solver-btn")
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
