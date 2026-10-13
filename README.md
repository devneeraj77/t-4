# Sudoku Solver & Placement Validator

A full-stack JavaScript application built for the **freeCodeCamp Quality Assurance Certification**.

This project provides a complete, modern Sudoku solving and validation engine featuring constraint satisfaction algorithms, interactive 9&times;9 board inspector, live conflict detection, and RESTful API endpoints.

---

## Features

- **High-Performance MRV Backtracking Solver**: Uses bitwise masks and Minimum Remaining Values (MRV) heuristic to solve even hard puzzles in under a millisecond.
- **Strict Validation**: Validates puzzle string syntax, length (81 characters), valid characters (`1-9` and `.`), coordinate formatting (`A1-I9`), and numeric candidate values.
- **Conflict Detection**: Checks row, column, and 3&times;3 region placement conflicts against the current puzzle state.
- **Modern Interactive UI**:
  - Live 9&times;9 board with 3&times;3 subgrid dividers and axis legends.
  - Interactive cell selection: click any cell to populate coordinate and inspect its region.
  - Keyboard input: type numbers 1-9 directly into cells, backspace to delete, arrow keys to navigate.
  - Visual conflict highlighting: conflicts flash red/amber on the board.
  - Curated sample puzzle presets, clear board, reset to default, and copy string to clipboard.
- **RESTful Endpoints**: Full API support with JSON responses.

---

## API Reference

### 1. Solve Puzzle
- **Endpoint**: `POST /api/solve`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "puzzle": "1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37."
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "solution": "135762984946381257728459613694517832812936745357824196473298561581673429269145378"
  }
  ```
- **Error Responses**:
  - Missing puzzle: `{ "error": "Required field missing" }`
  - Invalid characters: `{ "error": "Invalid characters in puzzle" }`
  - Incorrect length: `{ "error": "Expected puzzle to be 81 characters long" }`
  - Unsolvable puzzle: `{ "error": "Puzzle cannot be solved" }`

---

### 2. Check Placement
- **Endpoint**: `POST /api/check`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "puzzle": "1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.",
    "coordinate": "A2",
    "value": "3"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "valid": true
  }
  ```
- **Conflict Response**:
  ```json
  {
    "valid": false,
    "conflict": ["row", "region"]
  }
  ```
- **Error Responses**:
  - Missing field(s): `{ "error": "Required field(s) missing" }`
  - Invalid coordinate: `{ "error": "Invalid coordinate" }`
  - Invalid value: `{ "error": "Invalid value" }`
  - Invalid characters: `{ "error": "Invalid characters in puzzle" }`
  - Incorrect length: `{ "error": "Expected puzzle to be 81 characters long" }`

---

## Getting Started

### Installation
```bash
npm install
```

### Environment Configuration
Ensure `.env` contains:
```env
PORT=3000
NODE_ENV=test
```

### Run Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Tests
To run all 12 unit tests and 14 functional tests:
```bash
npm test
```
