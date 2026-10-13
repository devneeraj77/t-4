class SudokuSolver {
  validate(puzzleString) {
    if (!puzzleString) {
      return { error: 'Required field missing' };
    }
    if (puzzleString.length !== 81) {
      return { error: 'Expected puzzle to be 81 characters long' };
    }
    if (/[^1-9.]/.test(puzzleString)) {
      return { error: 'Invalid characters in puzzle' };
    }
    return true;
  }

  _getRowIndex(row) {
    if (typeof row === 'string' && /^[a-i]$/i.test(row)) {
      return row.toUpperCase().charCodeAt(0) - 65;
    }
    const num = Number(row);
    if (!isNaN(num) && num >= 1 && num <= 9) {
      return num - 1;
    }
    return -1;
  }

  _getColIndex(col) {
    const num = Number(col);
    if (!isNaN(num) && num >= 1 && num <= 9) {
      return num - 1;
    }
    return -1;
  }

  checkRowPlacement(puzzleString, row, column, value) {
    const r = this._getRowIndex(row);
    const c = this._getColIndex(column);
    const val = String(value);

    if (r === -1 || c === -1 || !/^[1-9]$/.test(val)) {
      return false;
    }

    for (let col = 0; col < 9; col++) {
      if (col === c) continue;
      if (puzzleString[r * 9 + col] === val) {
        return false;
      }
    }
    return true;
  }

  checkColPlacement(puzzleString, row, column, value) {
    const r = this._getRowIndex(row);
    const c = this._getColIndex(column);
    const val = String(value);

    if (r === -1 || c === -1 || !/^[1-9]$/.test(val)) {
      return false;
    }

    for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
      if (rowIdx === r) continue;
      if (puzzleString[rowIdx * 9 + c] === val) {
        return false;
      }
    }
    return true;
  }

  checkRegionPlacement(puzzleString, row, column, value) {
    const r = this._getRowIndex(row);
    const c = this._getColIndex(column);
    const val = String(value);

    if (r === -1 || c === -1 || !/^[1-9]$/.test(val)) {
      return false;
    }

    const startRow = Math.floor(r / 3) * 3;
    const startCol = Math.floor(c / 3) * 3;

    for (let rowIdx = startRow; rowIdx < startRow + 3; rowIdx++) {
      for (let colIdx = startCol; colIdx < startCol + 3; colIdx++) {
        if (rowIdx === r && colIdx === c) continue;
        if (puzzleString[rowIdx * 9 + colIdx] === val) {
          return false;
        }
      }
    }
    return true;
  }

  hasInitialConflict(puzzleString) {
    for (let i = 0; i < 81; i++) {
      const char = puzzleString[i];
      if (char !== '.') {
        const row = Math.floor(i / 9);
        const col = i % 9;
        if (
          !this.checkRowPlacement(puzzleString, row + 1, col + 1, char) ||
          !this.checkColPlacement(puzzleString, row + 1, col + 1, char) ||
          !this.checkRegionPlacement(puzzleString, row + 1, col + 1, char)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  solve(puzzleString) {
    const validation = this.validate(puzzleString);
    if (validation !== true) {
      return false;
    }
    if (this.hasInitialConflict(puzzleString)) {
      return false;
    }

    const rowMask = new Uint16Array(9);
    const colMask = new Uint16Array(9);
    const boxMask = new Uint16Array(9);
    const grid = new Uint8Array(81);
    const emptyIndices = [];

    const getBox = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

    for (let i = 0; i < 81; i++) {
      const ch = puzzleString[i];
      const r = Math.floor(i / 9);
      const c = i % 9;
      const b = getBox(r, c);

      if (ch === '.') {
        grid[i] = 0;
        emptyIndices.push(i);
      } else {
        const digit = parseInt(ch, 10);
        grid[i] = digit;
        const bit = 1 << digit;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[b] |= bit;
      }
    }

    const countBits = (n) => {
      let count = 0;
      while (n) {
        count += n & 1;
        n >>= 1;
      }
      return count;
    };

    const backtrack = () => {
      // Find empty cell with MRV (minimum remaining values)
      let minCandidates = 10;
      let minIdx = -1;
      let minMask = 0;
      let emptyPos = -1;

      for (let k = 0; k < emptyIndices.length; k++) {
        const i = emptyIndices[k];
        if (grid[i] !== 0) continue;

        const r = Math.floor(i / 9);
        const c = i % 9;
        const b = getBox(r, c);
        const used = rowMask[r] | colMask[c] | boxMask[b];
        const possibleMask = (~used) & 0x3FE; // bits 1..9
        const count = countBits(possibleMask);

        if (count === 0) return false; // Dead end

        if (count < minCandidates) {
          minCandidates = count;
          minIdx = i;
          minMask = possibleMask;
          emptyPos = k;
          if (count === 1) break;
        }
      }

      if (minIdx === -1) {
        return true; // All filled!
      }

      const r = Math.floor(minIdx / 9);
      const c = minIdx % 9;
      const b = getBox(r, c);

      for (let digit = 1; digit <= 9; digit++) {
        const bit = 1 << digit;
        if ((minMask & bit) !== 0) {
          grid[minIdx] = digit;
          rowMask[r] |= bit;
          colMask[c] |= bit;
          boxMask[b] |= bit;

          if (backtrack()) {
            return true;
          }

          grid[minIdx] = 0;
          rowMask[r] &= ~bit;
          colMask[c] &= ~bit;
          boxMask[b] &= ~bit;
        }
      }

      return false;
    };

    if (backtrack()) {
      let result = '';
      for (let i = 0; i < 81; i++) {
        result += grid[i];
      }
      return result;
    }

    return false;
  }
}

module.exports = SudokuSolver;
