/**
 * LinkedIn Tango Auto-Solver
 */

(function () {
  "use strict";

  const EMPTY = 0;
  const SUN = 1;
  const MOON = 2;
  const GRID_SIZE = 6;

  const EQUAL = "equal";
  const OPPOSITE = "opposite";

  /**
   * Parse the Tango board from the DOM
   * @returns {Object} { grid: number[][], constraints: Array, cells: Element[][] }
   */
  function parseTangoBoard() {
    // Find all cells using data-cell-idx attribute
    const cellElements = document.querySelectorAll("[data-cell-idx]");

    if (cellElements.length === 0) {
      console.error("Tango: Could not find game cells ([data-cell-idx])");
      return null;
    }

    console.log(`Tango: Found ${cellElements.length} cells`);

    // Initialize grid and cells array
    const grid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(EMPTY));
    const cells = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));
    const constraints = [];

    // Parse cells - they have data-cell-idx attribute (0-35) in row-major order
    cellElements.forEach((cell) => {
      const idx = parseInt(cell.getAttribute("data-cell-idx"));
      if (isNaN(idx) || idx < 0 || idx >= GRID_SIZE * GRID_SIZE) return;

      const row = Math.floor(idx / GRID_SIZE);
      const col = idx % GRID_SIZE;
      cells[row][col] = cell;

      // Detect cell state from SVG or aria-label
      const svg = cell.querySelector("svg");
      if (svg) {
        const ariaLabel = (svg.getAttribute("aria-label") || "").toLowerCase();
        if (ariaLabel === "sun") {
          grid[row][col] = SUN;
        } else if (ariaLabel === "moon") {
          grid[row][col] = MOON;
        }
      }
    });

    // Parse constraints from data-testid elements
    const constraintElements = document.querySelectorAll(
      '[data-testid="edge-equal"], [data-testid="edge-cross"]',
    );

    const cellRects = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const cell = document.getElementById(`tango-cell-${i}`);
      if (cell) {
        cellRects[i] = cell.getBoundingClientRect();
      }
    }

    constraintElements.forEach((el) => {
      const testId = el.getAttribute("data-testid");
      const type = testId === "edge-equal" ? EQUAL : OPPOSITE;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const row1 = Math.floor(i / GRID_SIZE);
        const col1 = i % GRID_SIZE;
        const cellRect = cellRects[i];
        if (!cellRect) continue;

        if (col1 < GRID_SIZE - 1) {
          const rightIdx = i + 1;
          const rightRect = cellRects[rightIdx];
          if (rightRect) {
            const edgeX = (cellRect.right + rightRect.left) / 2;
            const edgeY = (cellRect.top + cellRect.bottom) / 2;
            if (
              Math.abs(centerX - edgeX) < 25 &&
              Math.abs(centerY - edgeY) < 25
            ) {
              constraints.push({
                type,
                row1: row1,
                col1: col1,
                row2: row1,
                col2: col1 + 1,
              });
              return;
            }
          }
        }

        if (row1 < GRID_SIZE - 1) {
          const bottomIdx = i + GRID_SIZE;
          const bottomRect = cellRects[bottomIdx];
          if (bottomRect) {
            const edgeX = (cellRect.left + cellRect.right) / 2;
            const edgeY = (cellRect.bottom + bottomRect.top) / 2;
            if (
              Math.abs(centerX - edgeX) < 25 &&
              Math.abs(centerY - edgeY) < 25
            ) {
              constraints.push({
                type,
                row1: row1,
                col1: col1,
                row2: row1 + 1,
                col2: col1,
              });
              return;
            }
          }
        }
      }
    });

    console.log("Tango: Parsed grid", grid);
    console.log("Tango: Found constraints", constraints);

    return { grid, constraints, cells };
  }

  /**
   * Solve the Tango puzzle
   * @param {number[][]} grid - Initial grid state
   * @param {Array} constraints - List of constraints
   * @returns {number[][]|null} Solved grid or null if unsolvable
   */
  function solveTango(grid, constraints) {
    const solution = grid.map((row) => [...row]);

    let changed = true;
    let iterations = 0;
    const maxIterations = 1000;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Apply explicit constraints (= and x)
      for (const c of constraints) {
        const v1 = solution[c.row1][c.col1];
        const v2 = solution[c.row2][c.col2];

        if (c.type === EQUAL) {
          if (v1 !== EMPTY && v2 === EMPTY) {
            solution[c.row2][c.col2] = v1;
            changed = true;
          } else if (v2 !== EMPTY && v1 === EMPTY) {
            solution[c.row1][c.col1] = v2;
            changed = true;
          }
        } else if (c.type === OPPOSITE) {
          if (v1 !== EMPTY && v2 === EMPTY) {
            solution[c.row2][c.col2] = v1 === SUN ? MOON : SUN;
            changed = true;
          } else if (v2 !== EMPTY && v1 === EMPTY) {
            solution[c.row1][c.col1] = v2 === SUN ? MOON : SUN;
            changed = true;
          }
        }
      }

      // Apply no-triple rule
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (solution[row][col] !== EMPTY) continue;

          // Check horizontal patterns
          // XX_
          if (
            col >= 2 &&
            solution[row][col - 1] !== EMPTY &&
            solution[row][col - 1] === solution[row][col - 2]
          ) {
            solution[row][col] = solution[row][col - 1] === SUN ? MOON : SUN;
            changed = true;
            continue;
          }
          // _XX
          if (
            col <= GRID_SIZE - 3 &&
            solution[row][col + 1] !== EMPTY &&
            solution[row][col + 1] === solution[row][col + 2]
          ) {
            solution[row][col] = solution[row][col + 1] === SUN ? MOON : SUN;
            changed = true;
            continue;
          }
          // X_X
          if (
            col >= 1 &&
            col <= GRID_SIZE - 2 &&
            solution[row][col - 1] !== EMPTY &&
            solution[row][col - 1] === solution[row][col + 1]
          ) {
            solution[row][col] = solution[row][col - 1] === SUN ? MOON : SUN;
            changed = true;
            continue;
          }

          // Check vertical patterns
          // XX_
          if (
            row >= 2 &&
            solution[row - 1][col] !== EMPTY &&
            solution[row - 1][col] === solution[row - 2][col]
          ) {
            solution[row][col] = solution[row - 1][col] === SUN ? MOON : SUN;
            changed = true;
            continue;
          }
          // _XX
          if (
            row <= GRID_SIZE - 3 &&
            solution[row + 1][col] !== EMPTY &&
            solution[row + 1][col] === solution[row + 2][col]
          ) {
            solution[row][col] = solution[row + 1][col] === SUN ? MOON : SUN;
            changed = true;
            continue;
          }
          // X_X
          if (
            row >= 1 &&
            row <= GRID_SIZE - 2 &&
            solution[row - 1][col] !== EMPTY &&
            solution[row - 1][col] === solution[row + 1][col]
          ) {
            solution[row][col] = solution[row - 1][col] === SUN ? MOON : SUN;
            changed = true;
            continue;
          }
        }
      }

      // Leftover cells
      for (let i = 0; i < GRID_SIZE; i++) {
        // Check row
        let rowSuns = 0,
          rowMoons = 0;
        for (let j = 0; j < GRID_SIZE; j++) {
          if (solution[i][j] === SUN) rowSuns++;
          else if (solution[i][j] === MOON) rowMoons++;
        }

        if (rowSuns === GRID_SIZE / 2) {
          for (let j = 0; j < GRID_SIZE; j++) {
            if (solution[i][j] === EMPTY) {
              solution[i][j] = MOON;
              changed = true;
            }
          }
        } else if (rowMoons === GRID_SIZE / 2) {
          for (let j = 0; j < GRID_SIZE; j++) {
            if (solution[i][j] === EMPTY) {
              solution[i][j] = SUN;
              changed = true;
            }
          }
        }

        // Check column
        let colSuns = 0,
          colMoons = 0;
        for (let j = 0; j < GRID_SIZE; j++) {
          if (solution[j][i] === SUN) colSuns++;
          else if (solution[j][i] === MOON) colMoons++;
        }

        if (colSuns === GRID_SIZE / 2) {
          for (let j = 0; j < GRID_SIZE; j++) {
            if (solution[j][i] === EMPTY) {
              solution[j][i] = MOON;
              changed = true;
            }
          }
        } else if (colMoons === GRID_SIZE / 2) {
          for (let j = 0; j < GRID_SIZE; j++) {
            if (solution[j][i] === EMPTY) {
              solution[j][i] = SUN;
              changed = true;
            }
          }
        }
      }
    }

    if (isSolved(solution)) {
      return solution;
    }

    if (!isValid(solution, constraints)) {
      return null;
    }

    // Find first empty cell and try backtracking
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (solution[row][col] === EMPTY) {
          const trySun = solution.map((r) => [...r]);
          trySun[row][col] = SUN;
          const resultSun = solveTango(trySun, constraints);
          if (resultSun) return resultSun;

          const tryMoon = solution.map((r) => [...r]);
          tryMoon[row][col] = MOON;
          const resultMoon = solveTango(tryMoon, constraints);
          if (resultMoon) return resultMoon;

          return null;
        }
      }
    }

    return null;
  }

  /**
   * Check if the grid is completely solved
   */
  function isSolved(grid) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === EMPTY) return false;
      }
    }
    return true;
  }

  /**
   * Check if the current grid state is valid
   */
  function isValid(grid, constraints) {
    // Check constraints
    for (const c of constraints) {
      const v1 = grid[c.row1][c.col1];
      const v2 = grid[c.row2][c.col2];

      if (v1 !== EMPTY && v2 !== EMPTY) {
        if (c.type === EQUAL && v1 !== v2) return false;
        if (c.type === OPPOSITE && v1 === v2) return false;
      }
    }

    // Check no-triple rule
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        if (
          grid[row][col] !== EMPTY &&
          grid[row][col] === grid[row][col + 1] &&
          grid[row][col] === grid[row][col + 2]
        ) {
          return false;
        }
      }
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        if (
          grid[row][col] !== EMPTY &&
          grid[row][col] === grid[row + 1][col] &&
          grid[row][col] === grid[row + 2][col]
        ) {
          return false;
        }
      }
    }

    // Check balance rule
    for (let i = 0; i < GRID_SIZE; i++) {
      let rowSuns = 0,
        rowMoons = 0,
        colSuns = 0,
        colMoons = 0;
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === SUN) rowSuns++;
        else if (grid[i][j] === MOON) rowMoons++;
        if (grid[j][i] === SUN) colSuns++;
        else if (grid[j][i] === MOON) colMoons++;
      }
      if (rowSuns > GRID_SIZE / 2 || rowMoons > GRID_SIZE / 2) return false;
      if (colSuns > GRID_SIZE / 2 || colMoons > GRID_SIZE / 2) return false;
    }

    return true;
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
  async function applySolution(cells, currentGrid, solution) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = cells[row][col];
        if (!cell) continue;

        if (currentGrid[row][col] !== EMPTY) continue;

        let current = EMPTY;
        const svg = cell.querySelector(".lotka-cell-content svg, svg");
        if (svg) {
          const ariaLabel = (
            svg.getAttribute("aria-label") || ""
          ).toLowerCase();
          if (ariaLabel === "sun") current = SUN;
          else if (ariaLabel === "moon") current = MOON;
        }

        const target = solution[row][col];

        if (current === target) continue;

        let clicksNeeded = 0;
        if (current === EMPTY && target === SUN) clicksNeeded = 1;
        else if (current === EMPTY && target === MOON) clicksNeeded = 2;
        else if (current === SUN && target === MOON) clicksNeeded = 1;
        else if (current === SUN && target === EMPTY) clicksNeeded = 2;
        else if (current === MOON && target === EMPTY) clicksNeeded = 1;
        else if (current === MOON && target === SUN) clicksNeeded = 2;

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
   * Add solve button to the page
   */
  function addSolveButton() {
    if (document.getElementById("tango-solver-btn")) return;

    const button = document.createElement("button");
    button.id = "tango-solver-btn";
    button.textContent = "Solve Tango";
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
        const parsed = parseTangoBoard();
        if (!parsed) {
          alert(
            "Could not parse the Tango board. Make sure the game is loaded.",
          );
          button.textContent = "Solve Tango";
          button.disabled = false;
          return;
        }

        const solution = solveTango(parsed.grid, parsed.constraints);

        console.log("Tango: Solution found", solution);
        await applySolution(parsed.cells, parsed.grid, solution);

        button.textContent = "Solved!";
        setTimeout(() => {
          button.textContent = "Solve Tango";
          button.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Tango solver error:", error);
        alert("An error occurred while solving: " + error.message);
        button.textContent = "Solve Tango";
        button.disabled = false;
      }
    });

    document.body.appendChild(button);
    console.log("Tango: Solve button added");
  }

  function init() {
    if (
      !window.location.href.includes("/games/tango") &&
      !window.location.href.includes("/games/view/tango")
    )
      return;

    const checkForGame = () => {
      if (document.querySelectorAll("[data-cell-idx]").length > 0) {
        addSolveButton();
      } else {
        setTimeout(checkForGame, 500);
      }
    };
    setTimeout(checkForGame, 500);

    new MutationObserver(() => {
      if (
        document.querySelectorAll("[data-cell-idx]").length > 0 &&
        !document.getElementById("tango-solver-btn")
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
