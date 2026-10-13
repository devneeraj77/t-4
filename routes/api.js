'use strict';

const SudokuSolver = require('../controllers/sudoku-solver.js');

module.exports = function (app) {
  const solver = new SudokuSolver();

  app.route('/api/check')
    .post((req, res) => {
      const { puzzle, coordinate, value } = req.body;

      // 1. Missing required fields
      if (
        puzzle === undefined ||
        coordinate === undefined ||
        value === undefined ||
        puzzle === '' ||
        coordinate === '' ||
        value === ''
      ) {
        return res.json({ error: 'Required field(s) missing' });
      }

      // 2. Validate coordinate
      if (!/^[a-i][1-9]$/i.test(coordinate)) {
        return res.json({ error: 'Invalid coordinate' });
      }

      // 3. Validate value
      if (!/^[1-9]$/.test(String(value))) {
        return res.json({ error: 'Invalid value' });
      }

      // 4. Validate puzzle length
      if (puzzle.length !== 81) {
        return res.json({ error: 'Expected puzzle to be 81 characters long' });
      }

      // 5. Validate puzzle characters
      if (/[^1-9.]/.test(puzzle)) {
        return res.json({ error: 'Invalid characters in puzzle' });
      }

      const row = coordinate[0].toUpperCase();
      const col = coordinate[1];

      const validRow = solver.checkRowPlacement(puzzle, row, col, value);
      const validCol = solver.checkColPlacement(puzzle, row, col, value);
      const validRegion = solver.checkRegionPlacement(puzzle, row, col, value);

      const conflict = [];
      if (!validRow) conflict.push('row');
      if (!validCol) conflict.push('column');
      if (!validRegion) conflict.push('region');

      if (conflict.length === 0) {
        return res.json({ valid: true });
      } else {
        return res.json({ valid: false, conflict });
      }
    });

  app.route('/api/solve')
    .post((req, res) => {
      const { puzzle } = req.body;

      // 1. Missing puzzle field
      if (puzzle === undefined) {
        return res.json({ error: 'Required field missing' });
      }

      // 2. Validate length
      if (puzzle.length !== 81) {
        return res.json({ error: 'Expected puzzle to be 81 characters long' });
      }

      // 3. Validate characters
      if (/[^1-9.]/.test(puzzle)) {
        return res.json({ error: 'Invalid characters in puzzle' });
      }

      // 4. Attempt to solve
      const solution = solver.solve(puzzle);
      if (!solution) {
        return res.json({ error: 'Puzzle cannot be solved' });
      }

      return res.json({ solution });
    });
};
