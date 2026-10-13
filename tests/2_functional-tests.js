const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');
const { puzzlesAndSolutions } = require('../controllers/puzzle-strings.js');

chai.use(chaiHttp);

const validPuzzle = puzzlesAndSolutions[0][0];
const validSolution = puzzlesAndSolutions[0][1];

suite('Functional Tests', () => {
  suite('POST /api/solve', () => {
    test('Solve a puzzle with valid puzzle string: POST request to /api/solve', (done) => {
      chai
        .request(server)
        .post('/api/solve')
        .send({ puzzle: validPuzzle })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'solution');
          assert.equal(res.body.solution, validSolution);
          done();
        });
    });

    test('Solve a puzzle with missing puzzle string: POST request to /api/solve', (done) => {
      chai
        .request(server)
        .post('/api/solve')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'Required field missing' });
          done();
        });
    });

    test('Solve a puzzle with invalid characters: POST request to /api/solve', (done) => {
      const invalidCharPuzzle = validPuzzle.replace('1', 'X');
      chai
        .request(server)
        .post('/api/solve')
        .send({ puzzle: invalidCharPuzzle })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, {
            error: 'Invalid characters in puzzle'
          });
          done();
        });
    });

    test('Solve a puzzle with incorrect length: POST request to /api/solve', (done) => {
      const shortPuzzle = validPuzzle.slice(1);
      chai
        .request(server)
        .post('/api/solve')
        .send({ puzzle: shortPuzzle })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, {
            error: 'Expected puzzle to be 81 characters long'
          });
          done();
        });
    });

    test('Solve a puzzle that cannot be solved: POST request to /api/solve', (done) => {
      // Puzzle with duplicate '1' in row A
      const unsolvablePuzzle =
        '115..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.';
      chai
        .request(server)
        .post('/api/solve')
        .send({ puzzle: unsolvablePuzzle })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'Puzzle cannot be solved' });
          done();
        });
    });
  });

  suite('POST /api/check', () => {
    test('Check a puzzle placement with all fields: POST request to /api/check', (done) => {
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: validPuzzle, coordinate: 'A2', value: '3' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isTrue(res.body.valid);
          done();
        });
    });

    test('Check a puzzle placement with single placement conflict: POST request to /api/check', (done) => {
      // At A2, '4' conflicts only with Row A
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: validPuzzle, coordinate: 'A2', value: '4' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isFalse(res.body.valid);
          assert.deepEqual(res.body.conflict, ['row']);
          done();
        });
    });

    test('Check a puzzle placement with multiple placement conflicts: POST request to /api/check', (done) => {
      // At A4, '2' conflicts with Row A and Region 2
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: validPuzzle, coordinate: 'A4', value: '2' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isFalse(res.body.valid);
          assert.deepEqual(res.body.conflict, ['row', 'region']);
          done();
        });
    });

    test('Check a puzzle placement with all placement conflicts: POST request to /api/check', (done) => {
      // At A2, '2' conflicts with Row A, Col 2, and Region 1
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: validPuzzle, coordinate: 'A2', value: '2' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isFalse(res.body.valid);
          assert.deepEqual(res.body.conflict, ['row', 'column', 'region']);
          done();
        });
    });

    test('Check a puzzle placement with missing required fields: POST request to /api/check', (done) => {
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: validPuzzle, coordinate: 'A2' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'Required field(s) missing' });
          done();
        });
    });

    test('Check a puzzle placement with invalid characters: POST request to /api/check', (done) => {
      const invalidCharPuzzle = validPuzzle.replace('1', 'Z');
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: invalidCharPuzzle, coordinate: 'A2', value: '3' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, {
            error: 'Invalid characters in puzzle'
          });
          done();
        });
    });

    test('Check a puzzle placement with incorrect length: POST request to /api/check', (done) => {
      const shortPuzzle = validPuzzle.slice(1);
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: shortPuzzle, coordinate: 'A2', value: '3' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, {
            error: 'Expected puzzle to be 81 characters long'
          });
          done();
        });
    });

    test('Check a puzzle placement with invalid placement coordinate: POST request to /api/check', (done) => {
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: validPuzzle, coordinate: 'K9', value: '3' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'Invalid coordinate' });
          done();
        });
    });

    test('Check a puzzle placement with invalid placement value: POST request to /api/check', (done) => {
      chai
        .request(server)
        .post('/api/check')
        .send({ puzzle: validPuzzle, coordinate: 'A2', value: '0' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'Invalid value' });
          done();
        });
    });
  });
});
