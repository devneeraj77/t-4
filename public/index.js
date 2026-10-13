const textArea = document.getElementById("text-input");
const coordInput = document.getElementById("coord");
const valInput = document.getElementById("val");
const errorMsg = document.getElementById("error");
const errorDiv = document.getElementById("error-msg");
const charCounter = document.getElementById("char-counter");
const statClues = document.getElementById("stat-clues");
const statEmpty = document.getElementById("stat-empty");
const activeCellName = document.getElementById("active-cell-name");
const activeCellRegion = document.getElementById("active-cell-region");
const responseBadge = document.getElementById("response-status-badge");

const DEFAULT_PUZZLE = "..9..5.1.85.4....2432......1...69.83.9.....6.62.71...9......1945....4.37.4.3..6..";

const SAMPLE_PUZZLES = [
  "1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.",
  "5..91372.3...8.5.9.9.25..8.68.47.23...95..46.7.4.....5.2.......4..8916..85.72...3",
  "..839.7.575.....964..1.......16.29846.9.312.7..754.....62..5.78.8...3.2...492...1",
  ".7.89.....5....3.4.2..4..1.5689..472...6.....1.7.5.63873.1.2.8.6..47.1..2.9.387.6",
  "82..4..6...16..89...98315.749.157.............53..4...96.415..81..7632..3...28.51"
];

let selectedCoord = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  textArea.value = DEFAULT_PUZZLE;
  fillpuzzle(textArea.value);
  attachCellListeners();
});

// Sync textarea changes to board
textArea.addEventListener("input", () => {
  fillpuzzle(textArea.value);
  if (errorDiv) errorDiv.innerText = "";
});

function updateStats(data) {
  const len = data.length;
  if (charCounter) {
    charCounter.innerText = `${len} / 81 chars`;
    charCounter.style.color = len === 81 ? "#38bdf8" : len > 81 ? "#f43f5e" : "#f59e0b";
  }

  let clues = 0;
  let empty = 0;
  for (let i = 0; i < Math.min(len, 81); i++) {
    if (data[i] && data[i] !== ".") clues++;
    else empty++;
  }
  if (len < 81) empty += (81 - len);

  if (statClues) statClues.innerText = `Clues: ${clues}`;
  if (statEmpty) statEmpty.innerText = `Empty: ${empty}`;
}

// Core puzzle filling function (preserves FCC class targeting)
function fillpuzzle(data) {
  let len = data.length < 81 ? data.length : 81;
  for (let i = 0; i < len; i++) {
    let rowLetter = String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / 9));
    let col = (i % 9) + 1;
    const cellEl = document.getElementsByClassName(rowLetter + col)[0];
    if (cellEl) {
      if (!data[i] || data[i] === ".") {
        cellEl.innerText = " ";
      } else {
        cellEl.innerText = data[i];
      }
    }
  }

  // Handle cases where string is shorter than 81
  for (let i = len; i < 81; i++) {
    let rowLetter = String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / 9));
    let col = (i % 9) + 1;
    const cellEl = document.getElementsByClassName(rowLetter + col)[0];
    if (cellEl) {
      cellEl.innerText = " ";
    }
  }

  updateStats(data);
}

// Clear all conflict/success classes
function clearHighlights() {
  const cells = document.querySelectorAll(".sudoku-input");
  cells.forEach(c => {
    c.classList.remove("conflict-cell", "success-cell", "highlight-peer");
  });
}

// Highlight cell row, col, and region peers
function highlightPeers(rowLetter, colNum) {
  clearHighlights();
  const rowIndex = rowLetter.charCodeAt(0) - 65;
  const colIndex = colNum - 1;
  const startRow = Math.floor(rowIndex / 3) * 3;
  const startCol = Math.floor(colIndex / 3) * 3;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const curLetter = String.fromCharCode(65 + r);
      const curCol = c + 1;
      const isSameRow = r === rowIndex;
      const isSameCol = c === colIndex;
      const isSameRegion = r >= startRow && r < startRow + 3 && c >= startCol && c < startCol + 3;

      if (isSameRow || isSameCol || isSameRegion) {
        const cell = document.getElementsByClassName(curLetter + curCol)[0];
        if (cell && (curLetter + curCol !== rowLetter + colNum)) {
          cell.classList.add("highlight-peer");
        }
      }
    }
  }
}

// Select a specific cell
function selectCell(coord) {
  selectedCoord = coord;
  const cells = document.querySelectorAll(".sudoku-input");
  cells.forEach(c => c.classList.remove("active-cell"));

  const target = document.getElementsByClassName(coord)[0];
  if (target) {
    target.classList.add("active-cell");
    coordInput.value = coord;
    const val = target.innerText.trim();
    if (val && /^[1-9]$/.test(val)) {
      valInput.value = val;
    }

    const rowLetter = coord[0].toUpperCase();
    const colNum = parseInt(coord[1], 10);
    highlightPeers(rowLetter, colNum);

    const regionNum = Math.floor((rowLetter.charCodeAt(0) - 65) / 3) * 3 + Math.floor((colNum - 1) / 3) + 1;
    if (activeCellName) activeCellName.innerText = coord;
    if (activeCellRegion) activeCellRegion.innerText = `Row ${rowLetter} &bull; Column ${colNum} &bull; 3x3 Region ${regionNum}`;
  }
}

// Attach click & keyboard listeners to board cells
function attachCellListeners() {
  const cells = document.querySelectorAll(".sudoku-input");
  cells.forEach(cell => {
    cell.addEventListener("click", () => {
      const title = cell.getAttribute("title");
      if (title) {
        selectCell(title);
      }
    });
  });

  // Keyboard navigation and direct input
  document.addEventListener("keydown", (e) => {
    if (!selectedCoord) return;
    if (document.activeElement === textArea || document.activeElement === coordInput || document.activeElement === valInput) {
      return;
    }

    const rowChar = selectedCoord[0].toUpperCase();
    let r = rowChar.charCodeAt(0) - 65;
    let c = parseInt(selectedCoord[1], 10) - 1;
    const cellIdx = r * 9 + c;

    if (e.key >= "1" && e.key <= "9") {
      e.preventDefault();
      let arr = (textArea.value.padEnd(81, ".")).split("");
      arr[cellIdx] = e.key;
      textArea.value = arr.join("");
      fillpuzzle(textArea.value);
      valInput.value = e.key;
      selectCell(selectedCoord);
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === ".") {
      e.preventDefault();
      let arr = (textArea.value.padEnd(81, ".")).split("");
      arr[cellIdx] = ".";
      textArea.value = arr.join("");
      fillpuzzle(textArea.value);
      valInput.value = "";
      selectCell(selectedCoord);
    } else if (e.key === "ArrowUp" && r > 0) {
      e.preventDefault();
      selectCell(String.fromCharCode(65 + r - 1) + (c + 1));
    } else if (e.key === "ArrowDown" && r < 8) {
      e.preventDefault();
      selectCell(String.fromCharCode(65 + r + 1) + (c + 1));
    } else if (e.key === "ArrowLeft" && c > 0) {
      e.preventDefault();
      selectCell(rowChar + c);
    } else if (e.key === "ArrowRight" && c < 8) {
      e.preventDefault();
      selectCell(rowChar + (c + 2));
    }
  });
}

// Preset Buttons
document.querySelectorAll(".preset-btn[data-preset]").forEach(btn => {
  btn.addEventListener("click", () => {
    const idx = parseInt(btn.getAttribute("data-preset"), 10);
    if (SAMPLE_PUZZLES[idx]) {
      textArea.value = SAMPLE_PUZZLES[idx];
      fillpuzzle(textArea.value);
      clearHighlights();
      if (errorDiv) errorDiv.innerText = "";
      if (responseBadge) {
        responseBadge.innerText = `Sample ${idx + 1} Loaded`;
        responseBadge.className = "response-status valid";
      }
      errorMsg.innerHTML = `<code>{ "status": "loaded Sample ${idx + 1}" }</code>`;
    }
  });
});

const clearBtn = document.getElementById("clear-board-btn");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    textArea.value = ".".repeat(81);
    fillpuzzle(textArea.value);
    clearHighlights();
    if (errorDiv) errorDiv.innerText = "";
    if (responseBadge) {
      responseBadge.innerText = "Cleared";
      responseBadge.className = "response-status";
    }
    errorMsg.innerHTML = `<code>{ "status": "board cleared" }</code>`;
  });
}

const resetBtn = document.getElementById("reset-default-btn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    textArea.value = DEFAULT_PUZZLE;
    fillpuzzle(textArea.value);
    clearHighlights();
    if (errorDiv) errorDiv.innerText = "";
    if (responseBadge) {
      responseBadge.innerText = "Default Reset";
      responseBadge.className = "response-status valid";
    }
    errorMsg.innerHTML = `<code>{ "status": "reset to default" }</code>`;
  });
}

// Copy button
const copyBtn = document.getElementById("copy-string-btn");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(textArea.value);
      const span = copyBtn.querySelector("span");
      const prev = span.innerText;
      span.innerText = "Copied!";
      setTimeout(() => { span.innerText = prev; }, 1500);
    } catch (err) {
      console.warn("Clipboard access failed", err);
    }
  });
}

// Highlight conflict cells on board
function highlightConflicts(coord, conflicts) {
  clearHighlights();
  if (!coord || coord.length < 2) return;
  const rowLetter = coord[0].toUpperCase();
  const colNum = parseInt(coord[1], 10);
  const rowIndex = rowLetter.charCodeAt(0) - 65;
  const colIndex = colNum - 1;
  const startRow = Math.floor(rowIndex / 3) * 3;
  const startCol = Math.floor(colIndex / 3) * 3;

  conflicts.forEach(type => {
    if (type === "row") {
      for (let c = 1; c <= 9; c++) {
        const cell = document.getElementsByClassName(rowLetter + c)[0];
        if (cell) cell.classList.add("conflict-cell");
      }
    }
    if (type === "column") {
      for (let r = 0; r < 9; r++) {
        const curLetter = String.fromCharCode(65 + r);
        const cell = document.getElementsByClassName(curLetter + colNum)[0];
        if (cell) cell.classList.add("conflict-cell");
      }
    }
    if (type === "region") {
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          const curLetter = String.fromCharCode(65 + r);
          const cell = document.getElementsByClassName(curLetter + (c + 1))[0];
          if (cell) cell.classList.add("conflict-cell");
        }
      }
    }
  });
}

// Solve API Call (FCC Contract)
async function getSolved() {
  clearHighlights();
  if (errorDiv) errorDiv.innerText = "";
  if (responseBadge) {
    responseBadge.innerText = "Solving...";
    responseBadge.className = "response-status";
  }

  const stuff = { "puzzle": textArea.value };
  try {
    const data = await fetch("/api/solve", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-type": "application/json"
      },
      body: JSON.stringify(stuff)
    });
    const parsed = await data.json();

    if (parsed.error) {
      errorMsg.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
      if (errorDiv) errorDiv.innerText = parsed.error;
      if (responseBadge) {
        responseBadge.innerText = "Error";
        responseBadge.className = "response-status conflict";
      }
      return;
    }

    fillpuzzle(parsed.solution);
    textArea.value = parsed.solution;
    errorMsg.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
    if (responseBadge) {
      responseBadge.innerText = "Solved!";
      responseBadge.className = "response-status valid";
    }

    // Gentle flash on solved board
    const cells = document.querySelectorAll(".sudoku-input");
    cells.forEach(c => c.classList.add("success-cell"));
    setTimeout(() => {
      cells.forEach(c => c.classList.remove("success-cell"));
    }, 1500);

  } catch (err) {
    errorMsg.innerHTML = `<code>${JSON.stringify({ error: err.message }, null, 2)}</code>`;
    if (errorDiv) errorDiv.innerText = err.message;
  }
}

// Check Placement API Call (FCC Contract)
async function getChecked() {
  clearHighlights();
  const stuff = {
    "puzzle": textArea.value,
    "coordinate": coordInput.value,
    "value": valInput.value
  };

  try {
    const data = await fetch("/api/check", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-type": "application/json"
      },
      body: JSON.stringify(stuff)
    });
    const parsed = await data.json();
    errorMsg.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;

    if (parsed.valid === true) {
      if (responseBadge) {
        responseBadge.innerText = "Valid Placement";
        responseBadge.className = "response-status valid";
      }
      const targetCell = document.getElementsByClassName(coordInput.value.toUpperCase())[0];
      if (targetCell) {
        targetCell.classList.add("success-cell");
        setTimeout(() => targetCell.classList.remove("success-cell"), 1500);
      }
    } else if (parsed.valid === false && parsed.conflict) {
      if (responseBadge) {
        responseBadge.innerText = `Conflict: ${parsed.conflict.join(", ")}`;
        responseBadge.className = "response-status conflict";
      }
      highlightConflicts(coordInput.value.toUpperCase(), parsed.conflict);
    } else if (parsed.error) {
      if (responseBadge) {
        responseBadge.innerText = "Error";
        responseBadge.className = "response-status conflict";
      }
    }
  } catch (err) {
    errorMsg.innerHTML = `<code>${JSON.stringify({ error: err.message }, null, 2)}</code>`;
  }
}

document.getElementById("solve-button").addEventListener("click", getSolved);
document.getElementById("check-button").addEventListener("click", getChecked);