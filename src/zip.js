/**
 * LinkedIn Zip Auto-Solver
 */

(function () {
  "use strict";

  /**
   * Parse the Zip board from the DOM
   * @returns {Object} { cells: Element[][], waypoints: Map, walls: Object, size: number } or null
   */
  function parseZipBoard() {
    // Find all cells using data-testid attribute
    const cellElements = document.querySelectorAll('[data-testid^="cell-"]');

    if (cellElements.length === 0) {
      console.error("Zip: Could not find game cells ([data-testid^='cell-'])");
      return null;
    }

    console.log(`Zip: Found ${cellElements.length} cells`);

    // Determine grid size from cell count
    const size = Math.sqrt(cellElements.length);
    if (!Number.isInteger(size)) {
      console.error(`Zip: Invalid cell count ${cellElements.length}`);
      return null;
    }

    // Initialize cells array and walls tracking
    const cells = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));

    // walls[row][col] = { top: bool, right: bool, bottom: bool, left: bool }
    const walls = Array(size)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(null)
          .map(() => ({
            top: false,
            right: false,
            bottom: false,
            left: false,
          })),
      );

    // Map to store waypoint number -> {row, col}
    const waypoints = new Map();

    // Parse cells - use data-cell-idx attribute for position
    cellElements.forEach((cell) => {
      const idx = parseInt(cell.getAttribute("data-cell-idx"));
      if (isNaN(idx)) return;

      const row = Math.floor(idx / size);
      const col = idx % size;

      if (row < 0 || row >= size || col < 0 || col >= size) return;

      cells[row][col] = cell;

      // Check for numbered waypoint (the innerText of the cell)
      const text = cell.innerText.trim();
      const num = parseInt(text);
      if (!isNaN(num) && num > 0) {
        waypoints.set(num, { row, col });
        console.log(`Zip: Found waypoint ${num} at (${row}, ${col})`);
      }

      // Detect walls by checking :after pseudo-elements on children
      // Walls are rendered as thick borders on :after pseudo-elements
      Array.from(cell.children).forEach((child) => {
        // Skip waypoint content elements
        if (child.getAttribute("data-cell-content") === "true") return;

        const afterStyle = window.getComputedStyle(child, ":after");
        const topWidth = parseFloat(afterStyle.borderTopWidth) || 0;
        const bottomWidth = parseFloat(afterStyle.borderBottomWidth) || 0;
        const leftWidth = parseFloat(afterStyle.borderLeftWidth) || 0;
        const rightWidth = parseFloat(afterStyle.borderRightWidth) || 0;

        // A border width > 5px indicates a wall
        if (topWidth > 5) walls[row][col].top = true;
        if (bottomWidth > 5) walls[row][col].bottom = true;
        if (leftWidth > 5) walls[row][col].left = true;
        if (rightWidth > 5) walls[row][col].right = true;
      });
    });

    // Count walls for debugging
    let wallCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          walls[r][c].top ||
          walls[r][c].bottom ||
          walls[r][c].left ||
          walls[r][c].right
        ) {
          wallCount++;
        }
      }
    }
    console.log(`Zip: Found walls in ${wallCount} cells`);

    return { cells, waypoints, walls, size };
  }

  /**
   * Solve the Zip puzzle using DFS/backtracking
   * @param {number} size - Grid dimension
   * @param {Map} waypoints - Map of waypoint number -> {row, col}
   * @param {Object} walls - Wall data for each cell
   * @returns {Array|null} Array of {row, col} representing the path, or null if unsolvable
   */
  function solveZip(size, waypoints, walls) {
    const visited = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false));

    const waypointNums = Array.from(waypoints.keys()).sort((a, b) => a - b);
    if (waypointNums.length === 0) {
      console.error("Zip: No waypoints found");
      return null;
    }

    const start = waypoints.get(waypointNums[0]);
    if (!start) {
      console.error("Zip: No starting waypoint (1) found");
      return null;
    }

    const totalCells = size * size;
    const path = [];

    // Directions: [dr, dc, wallFromCurrent, wallToNeighbor]
    // wallFromCurrent = which wall on current cell blocks this direction
    // wallToNeighbor = which wall on neighbor cell blocks coming from current
    const directions = [
      [-1, 0, "top", "bottom"], // up: blocked by top wall on current or bottom wall on neighbor
      [1, 0, "bottom", "top"], // down: blocked by bottom wall on current or top wall on neighbor
      [0, -1, "left", "right"], // left: blocked by left wall on current or right wall on neighbor
      [0, 1, "right", "left"], // right: blocked by right wall on current or left wall on neighbor
    ];

    /**
     * Get the next required waypoint number after visiting pathLength cells
     */
    function getNextRequiredWaypoint(currentWaypointIndex) {
      if (currentWaypointIndex >= waypointNums.length) return null;
      return waypointNums[currentWaypointIndex];
    }

    /**
     * Get waypoint number at position, or null if not a waypoint
     */
    function getWaypointAt(row, col) {
      for (const [num, pos] of waypoints.entries()) {
        if (pos.row === row && pos.col === col) return num;
      }
      return null;
    }

    /**
     * DFS backtracking solver
     */
    function dfs(row, col, nextWaypointIndex) {
      path.push({ row, col });
      visited[row][col] = true;

      const currentWaypoint = getWaypointAt(row, col);
      let newWaypointIndex = nextWaypointIndex;

      if (currentWaypoint !== null) {
        const expectedWaypoint = getNextRequiredWaypoint(nextWaypointIndex);
        if (currentWaypoint === expectedWaypoint) {
          newWaypointIndex = nextWaypointIndex + 1;
        } else if (currentWaypoint > expectedWaypoint) {
          path.pop();
          visited[row][col] = false;
          return false;
        }
      }

      if (path.length === totalCells) {
        if (newWaypointIndex >= waypointNums.length) {
          return true;
        }
        path.pop();
        visited[row][col] = false;
        return false;
      }

      for (const [dr, dc, wallFrom, wallTo] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

        if (visited[nr][nc]) continue;

        // Check for walls blocking this movement
        if (walls[row][col][wallFrom]) continue; // Wall on current cell blocks exit
        if (walls[nr][nc][wallTo]) continue; // Wall on neighbor blocks entry

        const nextWaypoint = getWaypointAt(nr, nc);
        if (nextWaypoint !== null) {
          const expectedNext = getNextRequiredWaypoint(newWaypointIndex);
          if (nextWaypoint > expectedNext) {
            continue;
          }
        }

        if (dfs(nr, nc, newWaypointIndex)) {
          return true;
        }
      }

      path.pop();
      visited[row][col] = false;
      return false;
    }

    if (dfs(start.row, start.col, 0)) {
      console.log("Zip: Solution found with", path.length, "cells");
      return path;
    }

    console.error("Zip: No solution found");
    return null;
  }

  /**
   * Apply solution using arrow key presses
   */
  async function applySolution(path) {
    if (path.length < 2) return;

    // Convert path to arrow key directions
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];

      const dr = curr.row - prev.row;
      const dc = curr.col - prev.col;

      let key, code;
      if (dr === -1) {
        key = "ArrowUp";
        code = "ArrowUp";
      } else if (dr === 1) {
        key = "ArrowDown";
        code = "ArrowDown";
      } else if (dc === -1) {
        key = "ArrowLeft";
        code = "ArrowLeft";
      } else if (dc === 1) {
        key = "ArrowRight";
        code = "ArrowRight";
      } else {
        continue;
      }

      // Dispatch keydown event
      const keydownEvent = new KeyboardEvent("keydown", {
        key: key,
        code: code,
        keyCode:
          key === "ArrowUp"
            ? 38
            : key === "ArrowDown"
              ? 40
              : key === "ArrowLeft"
                ? 37
                : 39,
        which:
          key === "ArrowUp"
            ? 38
            : key === "ArrowDown"
              ? 40
              : key === "ArrowLeft"
                ? 37
                : 39,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(keydownEvent);

      await sleep(30);
    }
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
    const existing = document.getElementById("zip-solver-msg");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "zip-solver-msg";
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
    if (document.getElementById("zip-solver-btn")) return;

    const button = document.createElement("button");
    button.id = "zip-solver-btn";
    button.textContent = "Solve Zip";
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
        const parsed = parseZipBoard();
        if (!parsed) {
          showMessage(
            "Could not parse the Zip board. Make sure the game is loaded.",
          );
          button.textContent = "Solve Zip";
          button.disabled = false;
          return;
        }

        const solution = solveZip(parsed.size, parsed.waypoints, parsed.walls);
        if (!solution) {
          showMessage("Could not find a solution. The puzzle may be invalid.");
          button.textContent = "Solve Zip";
          button.disabled = false;
          return;
        }

        console.log("Zip: Applying solution...");
        await applySolution(solution);

        button.textContent = "Solved!";
        setTimeout(() => {
          button.textContent = "Solve Zip";
          button.disabled = false;
        }, 2000);
      } catch (error) {
        console.error("Zip solver error:", error);
        showMessage("An error occurred: " + error.message);
        button.textContent = "Solve Zip";
        button.disabled = false;
      }
    });

    document.body.appendChild(button);
    console.log("Zip: Solve button added");
  }

  function init() {
    if (
      !window.location.href.includes("/games/zip") &&
      !window.location.href.includes("/games/view/zip")
    )
      return;

    const checkForGame = () => {
      if (document.querySelectorAll('[data-testid^="cell-"]').length > 0) {
        addSolveButton();
      } else {
        setTimeout(checkForGame, 500);
      }
    };
    setTimeout(checkForGame, 500);

    new MutationObserver(() => {
      if (
        document.querySelectorAll('[data-testid^="cell-"]').length > 0 &&
        !document.getElementById("zip-solver-btn")
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
