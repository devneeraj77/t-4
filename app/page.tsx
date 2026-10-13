"use client";

import React, { useState, useEffect, useCallback } from "react";

const DEFAULT_PUZZLE =
  "..9..5.1.85.4....2432......1...69.83.9.....6.62.71...9......1945....4.37.4.3..6..";

const SAMPLE_PUZZLES = [
  "1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.",
  "5..91372.3...8.5.9.9.25..8.68.47.23...95..46.7.4.....5.2.......4..8916..85.72...3",
  "..839.7.575.....964..1.......16.29846.9.312.7..754.....62..5.78.8...3.2...492...1",
  ".7.89.....5....3.4.2..4..1.5689..472...6.....1.7.5.63873.1.2.8.6..47.1..2.9.387.6",
  "82..4..6...16..89...98315.749.157.............53..4...96.415..81..7632..3...28.51",
];

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const COLS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function SudokuSolverPage() {
  const [puzzle, setPuzzle] = useState<string>(DEFAULT_PUZZLE);
  const [coordinate, setCoordinate] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [errorMsgText, setErrorMsgText] = useState<string>("");
  const [errorJson, setErrorJson] = useState<string>(
    JSON.stringify({ status: "waiting for action" }, null, 2)
  );
  const [statusBadge, setStatusBadge] = useState<{ text: string; type: string }>({
    text: "Ready",
    type: "",
  });
  const [selectedCoord, setSelectedCoord] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<{ coord: string; types: string[] } | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Compute clue and empty counts
  const cluesCount = puzzle.split("").filter((ch) => ch !== "." && /[1-9]/.test(ch)).length;
  const emptyCount = Math.max(0, 81 - cluesCount);

  // Handle cell click
  const handleCellClick = useCallback(
    (coord: string) => {
      setSelectedCoord(coord);
      setCoordinate(coord);

      const r = coord.charCodeAt(0) - 65;
      const c = parseInt(coord[1], 10) - 1;
      const idx = r * 9 + c;
      const currentVal = puzzle[idx] && puzzle[idx] !== "." ? puzzle[idx] : "";
      setValue(currentVal);
      setConflicts(null);
    },
    [puzzle]
  );

  // Keyboard navigation & direct cell editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCoord) return;
      const activeEl = document.activeElement;
      if (
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl?.tagName === "INPUT" && (activeEl as HTMLInputElement).type === "text")
      ) {
        return;
      }

      const rowChar = selectedCoord[0].toUpperCase();
      const r = rowChar.charCodeAt(0) - 65;
      const c = parseInt(selectedCoord[1], 10) - 1;
      const cellIdx = r * 9 + c;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const arr = puzzle.padEnd(81, ".").split("");
        arr[cellIdx] = e.key;
        const newPuz = arr.join("");
        setPuzzle(newPuz);
        setValue(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === ".") {
        e.preventDefault();
        const arr = puzzle.padEnd(81, ".").split("");
        arr[cellIdx] = ".";
        const newPuz = arr.join("");
        setPuzzle(newPuz);
        setValue("");
      } else if (e.key === "ArrowUp" && r > 0) {
        e.preventDefault();
        handleCellClick(String.fromCharCode(65 + r - 1) + (c + 1));
      } else if (e.key === "ArrowDown" && r < 8) {
        e.preventDefault();
        handleCellClick(String.fromCharCode(65 + r + 1) + (c + 1));
      } else if (e.key === "ArrowLeft" && c > 0) {
        e.preventDefault();
        handleCellClick(rowChar + c);
      } else if (e.key === "ArrowRight" && c < 8) {
        e.preventDefault();
        handleCellClick(rowChar + (c + 2));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCoord, puzzle, handleCellClick]);

  // Solve button handler
  const handleSolve = async () => {
    setErrorMsgText("");
    setConflicts(null);
    setStatusBadge({ text: "Solving...", type: "" });

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ puzzle }),
      });
      const data = await res.json();
      setErrorJson(JSON.stringify(data, null, 2));

      if (data.error) {
        setErrorMsgText(data.error);
        setStatusBadge({ text: "Error", type: "conflict" });
        return;
      }

      if (data.solution) {
        setPuzzle(data.solution);
        setStatusBadge({ text: "Solved!", type: "valid" });
      }
    } catch (err: any) {
      const errObj = { error: err.message || "Network Error" };
      setErrorJson(JSON.stringify(errObj, null, 2));
      setErrorMsgText(errObj.error);
      setStatusBadge({ text: "Error", type: "conflict" });
    }
  };

  // Check button handler
  const handleCheck = async () => {
    setErrorMsgText("");
    setConflicts(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puzzle,
          coordinate,
          value,
        }),
      });
      const data = await res.json();
      setErrorJson(JSON.stringify(data, null, 2));

      if (data.valid === true) {
        setStatusBadge({ text: "Valid Placement", type: "valid" });
      } else if (data.valid === false && data.conflict) {
        setStatusBadge({
          text: `Conflict: ${data.conflict.join(", ")}`,
          type: "conflict",
        });
        setConflicts({
          coord: coordinate.toUpperCase(),
          types: data.conflict,
        });
      } else if (data.error) {
        setStatusBadge({ text: "Error", type: "conflict" });
      }
    } catch (err: any) {
      setErrorJson(JSON.stringify({ error: err.message || "Network Error" }, null, 2));
      setStatusBadge({ text: "Error", type: "conflict" });
    }
  };

  // Preset button handlers
  const loadPreset = (idx: number) => {
    if (SAMPLE_PUZZLES[idx]) {
      setPuzzle(SAMPLE_PUZZLES[idx]);
      setConflicts(null);
      setErrorMsgText("");
      setStatusBadge({ text: `Sample ${idx + 1} Loaded`, type: "valid" });
      setErrorJson(JSON.stringify({ status: `loaded Sample ${idx + 1}` }, null, 2));
    }
  };

  const handleClear = () => {
    setPuzzle(".".repeat(81));
    setConflicts(null);
    setErrorMsgText("");
    setStatusBadge({ text: "Cleared", type: "" });
    setErrorJson(JSON.stringify({ status: "board cleared" }, null, 2));
  };

  const handleReset = () => {
    setPuzzle(DEFAULT_PUZZLE);
    setConflicts(null);
    setErrorMsgText("");
    setStatusBadge({ text: "Default Reset", type: "valid" });
    setErrorJson(JSON.stringify({ status: "reset to default" }, null, 2));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(puzzle);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    } catch {
      // Fallback
    }
  };

  // Helper to determine cell classes
  const getCellClasses = (coord: string, rIdx: number, cIdx: number) => {
    const classList = [coord, "sudoku-input"];

    if (selectedCoord === coord) {
      classList.push("active-cell");
    } else if (selectedCoord) {
      const selRow = selectedCoord.charCodeAt(0) - 65;
      const selCol = parseInt(selectedCoord[1], 10) - 1;
      const selStartRow = Math.floor(selRow / 3) * 3;
      const selStartCol = Math.floor(selCol / 3) * 3;

      const sameRow = rIdx === selRow;
      const sameCol = cIdx === selCol;
      const sameRegion =
        rIdx >= selStartRow &&
        rIdx < selStartRow + 3 &&
        cIdx >= selStartCol &&
        cIdx < selStartCol + 3;

      if (sameRow || sameCol || sameRegion) {
        classList.push("highlight-peer");
      }
    }

    if (conflicts) {
      const cRow = conflicts.coord.charCodeAt(0) - 65;
      const cCol = parseInt(conflicts.coord[1], 10) - 1;
      const cStartRow = Math.floor(cRow / 3) * 3;
      const cStartCol = Math.floor(cCol / 3) * 3;

      let isConflict = false;
      if (conflicts.types.includes("row") && rIdx === cRow) isConflict = true;
      if (conflicts.types.includes("column") && cIdx === cCol) isConflict = true;
      if (
        conflicts.types.includes("region") &&
        rIdx >= cStartRow &&
        rIdx < cStartRow + 3 &&
        cIdx >= cStartCol &&
        cIdx < cStartCol + 3
      ) {
        isConflict = true;
      }

      if (isConflict) classList.push("conflict-cell");
    }

    return classList.join(" ");
  };

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-group">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
            </div>
            <div>
              <span className="badge-tag">Next.js App Router &bull; TypeScript Engine</span>
              <h1>Sudoku Solver</h1>
            </div>
          </div>
          <div className="header-actions">
            <div className="status-indicator">
              <span className="pulse-dot"></span>
              <span>Next.js Engine Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Left Panel: Puzzle Controller */}
          <section className="panel form-container">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-number">01</span>
                <h2>Puzzle Matrix Input</h2>
              </div>
              <span className="string-counter" id="char-counter">
                {puzzle.length} / 81 chars
              </span>
            </div>

            <p className="panel-description">
              Provide an 81-character puzzle string containing numbers <code>1-9</code> and periods{" "}
              <code>.</code> for vacant cells, or pick a curated sample.
            </p>

            {/* Presets Bar */}
            <div className="preset-bar">
              <span className="preset-label">Presets:</span>
              <div className="preset-buttons">
                {SAMPLE_PUZZLES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-btn"
                    onClick={() => loadPreset(idx)}
                  >
                    Sample {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className="preset-btn btn-secondary"
                  id="clear-board-btn"
                  onClick={handleClear}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="preset-btn btn-secondary"
                  id="reset-default-btn"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Solve Form Required by FCC */}
            <form id="solve-form">
              <div className="textarea-wrapper">
                <textarea
                  rows={6}
                  cols={85}
                  id="text-input"
                  name="puzzle"
                  placeholder="Enter 81-character puzzle string (. for empty cells)..."
                  spellCheck={false}
                  value={puzzle}
                  onChange={(e) => {
                    setPuzzle(e.target.value);
                    setErrorMsgText("");
                  }}
                />
                <button
                  type="button"
                  id="copy-string-btn"
                  title="Copy to clipboard"
                  className="copy-badge"
                  onClick={handleCopy}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>{copySuccess ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <div className="action-row">
                <input
                  type="button"
                  value="Solve Puzzle"
                  id="solve-button"
                  className="btn-primary"
                  onClick={handleSolve}
                />
                <div id="error-msg" className="feedback-msg">
                  {errorMsgText}
                </div>
              </div>
            </form>

            <div className="section-divider"></div>

            {/* Placement Checker Form Required by FCC */}
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-number">02</span>
                <h2>Placement Conflict Checker</h2>
              </div>
            </div>

            <p className="panel-description">
              Validate whether placing a candidate digit into a coordinate causes row, column, or
              3x3 region conflicts. You can also click any cell on the grid!
            </p>

            <form id="check-form">
              <div className="checker-inputs-grid">
                <div className="input-field">
                  <label htmlFor="coord">Coordinate (A1 - I9)</label>
                  <input
                    id="coord"
                    className="checker"
                    type="text"
                    name="coordinate"
                    placeholder="e.g. A2"
                    maxLength={3}
                    autoComplete="off"
                    value={coordinate}
                    onChange={(e) => setCoordinate(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="input-field">
                  <label htmlFor="val">Value (1 - 9)</label>
                  <input
                    className="checker"
                    type="text"
                    id="val"
                    name="value"
                    placeholder="e.g. 3"
                    maxLength={1}
                    autoComplete="off"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="check-actions-row">
                <input
                  type="button"
                  id="check-button"
                  value="Check Placement"
                  className="btn-accent"
                  onClick={handleCheck}
                />
              </div>
            </form>

            {/* Output Display Required by FCC */}
            <div className="result-box">
              <div className="result-header">
                <span>Response Payload</span>
                <span
                  id="response-status-badge"
                  className={`response-status ${statusBadge.type}`}
                >
                  {statusBadge.text}
                </span>
              </div>
              <span id="error" className="json-output">
                <code>{errorJson}</code>
              </span>
            </div>
          </section>

          {/* Right Panel: Interactive 9x9 Sudoku Grid */}
          <section className="panel grid-panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <span className="panel-number">03</span>
                <h2>Interactive 9&times;9 Board</h2>
              </div>
              <div className="board-stats">
                <span className="stat-pill" id="stat-clues">
                  Clues: {cluesCount}
                </span>
                <span className="stat-pill" id="stat-empty">
                  Empty: {emptyCount}
                </span>
              </div>
            </div>

            <div className="grid-instructions">
              <span>&bull; Click any cell to inspect or select coordinate</span>
              <span>&bull; Type 1-9 to input, Backspace to delete</span>
            </div>

            <div id="sudoku-grid-container">
              {/* Y-Axis Legend (A-I) */}
              <div>
                <table className="yAxisLegend">
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row}>
                        <td>{row}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sudoku Grid Table */}
              <div id="sudoku-grid">
                <table className="xAxisLegend">
                  <tbody>
                    <tr>
                      {COLS.map((col) => (
                        <td key={col}>{col}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <table className="grid" id="main-grid-table">
                  <tbody>
                    {ROWS.map((rowLetter, rIdx) => (
                      <tr key={rowLetter}>
                        {COLS.map((colNum, cIdx) => {
                          const coord = `${rowLetter}${colNum}`;
                          const cellIdx = rIdx * 9 + cIdx;
                          const rawVal = puzzle[cellIdx];
                          const cellVal = rawVal && rawVal !== "." ? rawVal : " ";

                          return (
                            <td
                              key={coord}
                              className={getCellClasses(coord, rIdx, cIdx)}
                              title={coord}
                              onClick={() => handleCellClick(coord)}
                            >
                              {cellVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Cell Inspector */}
            <div className="active-cell-bar" id="active-cell-bar">
              <div className="cell-tag">
                <span>Active Cell:</span>
                <strong id="active-cell-name">{selectedCoord || "None"}</strong>
              </div>
              <div className="cell-context">
                <span id="active-cell-region">
                  {selectedCoord
                    ? `Row ${selectedCoord[0]} • Column ${selectedCoord[1]} • 3x3 Region ${
                        Math.floor((selectedCoord.charCodeAt(0) - 65) / 3) * 3 +
                        Math.floor((parseInt(selectedCoord[1], 10) - 1) / 3) +
                        1
                      }`
                    : "Select a cell to view region & constraints"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* API Docs Section */}
        <section className="api-docs-section">
          <div className="api-docs-card">
            <div className="api-docs-header">
              <h3>Next.js App Router API Endpoints</h3>
              <span className="badge-tag">Route Handlers</span>
            </div>
            <div className="api-grid">
              <div className="api-endpoint-card">
                <div className="api-method-badge post">POST</div>
                <code>/api/solve</code>
                <p>Submits an 81-character puzzle string to solve via MRV backtracking.</p>
                <div className="sample-code">
                  <strong>Request:</strong> <code>&#123; &quot;puzzle&quot;: &quot;..9..5...&quot; &#125;</code><br />
                  <strong>Success:</strong> <code>&#123; &quot;solution&quot;: &quot;129845...&quot; &#125;</code><br />
                  <strong>Error:</strong> <code>&#123; &quot;error&quot;: &quot;Puzzle cannot be solved&quot; &#125;</code>
                </div>
              </div>
              <div className="api-endpoint-card">
                <div className="api-method-badge post">POST</div>
                <code>/api/check</code>
                <p>Validates candidate number in given cell against row, column, and 3x3 region.</p>
                <div className="sample-code">
                  <strong>Request:</strong> <code>&#123; &quot;puzzle&quot;: &quot;...&quot;, &quot;coordinate&quot;: &quot;A2&quot;, &quot;value&quot;: &quot;3&quot; &#125;</code><br />
                  <strong>Success:</strong> <code>&#123; &quot;valid&quot;: true &#125;</code><br />
                  <strong>Conflict:</strong> <code>&#123; &quot;valid&quot;: false, &quot;conflict&quot;: [&quot;row&quot;, &quot;region&quot;] &#125;</code>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Sudoku Solver &bull; Next.js 16 App Router &bull; React 19 &bull; TypeScript &bull; freeCodeCamp Quality Assurance
        </p>
      </footer>
    </>
  );
}
