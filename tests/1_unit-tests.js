const chai = require('chai');
const assert = chai.assert;

const Solver = require('../controllers/sudoku-solver.js');
const { puzzlesAndSolutions } = require('../controllers/puzzle-strings.js');
let solver = new Solver();

const validPuzzle = puzzlesAndSolutions[0][0];
const validSolution = puzzlesAndSolutions[0][1];

suite('Unit Tests', () => {
  test('Logic handles a valid puzzle string of 81 characters', () => {
    assert.equal(solver.validate(validPuzzle), true);
  });

  test('Logic handles a puzzle string with invalid characters (not 1-9 or .)', () => {
    const invalidCharPuzzle = validPuzzle.replace('1', 'X');
    assert.deepEqual(solver.validate(invalidCharPuzzle), {
      error: 'Invalid characters in puzzle'
    });
  });

  test('Logic handles a puzzle string that is not 81 characters in length', () => {
    const shortPuzzle = validPuzzle.slice(1);
    assert.deepEqual(solver.validate(shortPuzzle), {
      error: 'Expected puzzle to be 81 characters long'
    });
  });

  test('Logic handles a valid row placement', () => {
    assert.isTrue(solver.checkRowPlacement(validPuzzle, 'A', 2, 3));
  });

  test('Logic handles an invalid row placement', () => {
    assert.isFalse(solver.checkRowPlacement(validPuzzle, 'A', 2, 5));
  });

  test('Logic handles a valid column placement', () => {
    assert.isTrue(solver.checkColPlacement(validPuzzle, 'A', 2, 3));
  });

  test('Logic handles an invalid column placement', () => {
    assert.isFalse(solver.checkColPlacement(validPuzzle, 'A', 2, 2));
  });

  test('Logic handles a valid region (3x3 grid) placement', () => {
    assert.isTrue(solver.checkRegionPlacement(validPuzzle, 'A', 2, 3));
  });

  test('Logic handles an invalid region (3x3 grid) placement', () => {
    assert.isFalse(solver.checkRegionPlacement(validPuzzle, 'A', 2, 1));
  });

  test('Valid puzzle strings pass the solver', () => {
    const result = solver.solve(validPuzzle);
    assert.isString(result);
    assert.equal(result.length, 81);
  });

  test('Invalid puzzle strings fail the solver', () => {
    // Puzzle with conflicting duplicate '1' in row A
    const unsolvablePuzzle = '115..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.';
    assert.isFalse(solver.solve(unsolvablePuzzle));
  });

  test('Solver returns the expected solution for an incomplete puzzle', () => {
    assert.equal(solver.solve(validPuzzle), validSolution);
  });
});
