/**
 * Crossword Engine — Backtracking-based crossword puzzle generator
 *
 * Algorithm overview:
 * 1. Sort words by length (longest first) for better constraint propagation.
 * 2. Place the first word horizontally near the centre of the grid.
 * 3. For each remaining word, find all possible placements that intersect
 *    with at least one already-placed word (shared letter).
 * 4. Try each candidate placement. If valid, place it and recurse.
 * 5. If no valid placement exists for a word, BACKTRACK — undo the last
 *    placement and try the next candidate.
 * 6. Continue until all words are placed or all options are exhausted.
 */

class CrosswordEngine {
  /**
   * @param {number} size - grid dimension (size × size)
   */
  constructor(size = 15) {
    this.size = size;
    this.grid = [];        // 2D array  – null = black, letter otherwise
    this.placements = [];  // { word, clue, row, col, direction, number }
    this.wordNumberMap = new Map(); // (row,col) -> number
    this.currentNumber = 0;
  }

  /* ---- public API ---- */

  /**
   * Generate a crossword layout for the given word/clue pairs.
   * @param {{ word: string, clue: string }[]} wordClues
   * @returns {{ grid: (string|null)[][], placements: object[], size: number }}
   */
  generate(wordClues) {
    // Reset
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.placements = [];
    this.wordNumberMap = new Map();
    this.currentNumber = 0;

    // Sort longest first — better constraint propagation
    const sorted = [...wordClues].sort((a, b) => b.word.length - a.word.length);

    // Place the first word horizontally, centred
    const first = sorted[0];
    const startCol = Math.floor((this.size - first.word.length) / 2);
    const startRow = Math.floor(this.size / 2);
    this._placeWord(first.word, first.clue, startRow, startCol, 'across');

    // Backtracking placement for the rest
    const remaining = sorted.slice(1);
    this._backtrack(remaining, 0);

    // Compact the grid (trim empty rows/cols)
    return this._compactResult();
  }

  /* ---- backtracking core ---- */

  /**
   * Try to place words[index..] using backtracking.
   * @returns {boolean} true if all remaining words were placed
   */
  _backtrack(words, index) {
    if (index >= words.length) return true; // all placed

    const { word, clue } = words[index];
    const candidates = this._findCandidates(word);

    // Shuffle candidates for variety
    this._shuffle(candidates);

    for (const { row, col, direction } of candidates) {
      if (this._canPlace(word, row, col, direction)) {
        const backup = this._placeWord(word, clue, row, col, direction);

        if (this._backtrack(words, index + 1)) {
          return true; // success path
        }

        // Backtrack — undo placement
        this._undoPlace(word, row, col, direction, backup);
      }
    }

    // Could not place this word — skip and continue
    // (we prefer a partial puzzle over failing entirely)
    return this._backtrack(words, index + 1);
  }

  /* ---- placement helpers ---- */

  /**
   * Find all candidate positions where `word` could intersect with
   * letters already on the grid.
   */
  _findCandidates(word) {
    const candidates = [];
    const wordUpper = word.toUpperCase();

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === null) continue;
        const gridLetter = this.grid[r][c];

        for (let i = 0; i < wordUpper.length; i++) {
          if (wordUpper[i] !== gridLetter) continue;

          // Try placing ACROSS (the intersection is at column c, so word starts at c - i)
          const acrossCol = c - i;
          const acrossRow = r;
          if (acrossCol >= 0 && acrossCol + wordUpper.length <= this.size) {
            candidates.push({ row: acrossRow, col: acrossCol, direction: 'across' });
          }

          // Try placing DOWN
          const downRow = r - i;
          const downCol = c;
          if (downRow >= 0 && downRow + wordUpper.length <= this.size) {
            candidates.push({ row: downRow, col: downCol, direction: 'down' });
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Check if a word can legally be placed at (row, col) in the given direction.
   */
  _canPlace(word, row, col, direction) {
    const wordUpper = word.toUpperCase();
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;

    // Check bounds
    const endRow = row + dr * (wordUpper.length - 1);
    const endCol = col + dc * (wordUpper.length - 1);
    if (endRow >= this.size || endCol >= this.size) return false;

    // Check cell before the word (should be empty or edge)
    const beforeR = row - dr;
    const beforeC = col - dc;
    if (beforeR >= 0 && beforeR < this.size && beforeC >= 0 && beforeC < this.size) {
      if (this.grid[beforeR][beforeC] !== null) return false;
    }

    // Check cell after the word
    const afterR = row + dr * wordUpper.length;
    const afterC = col + dc * wordUpper.length;
    if (afterR >= 0 && afterR < this.size && afterC >= 0 && afterC < this.size) {
      if (this.grid[afterR][afterC] !== null) return false;
    }

    let intersections = 0;

    for (let i = 0; i < wordUpper.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const existing = this.grid[r][c];

      if (existing !== null) {
        // Must match
        if (existing !== wordUpper[i]) return false;
        intersections++;

        // No parallel adjacency allowed at intersection — it belongs to the crossing word
        continue;
      }

      // Cell is empty — check perpendicular neighbors (no illegal adjacency)
      if (direction === 'across') {
        // Check above and below
        if (r - 1 >= 0 && this.grid[r - 1][c] !== null) return false;
        if (r + 1 < this.size && this.grid[r + 1][c] !== null) return false;
      } else {
        // Check left and right
        if (c - 1 >= 0 && this.grid[r][c - 1] !== null) return false;
        if (c + 1 < this.size && this.grid[r][c + 1] !== null) return false;
      }
    }

    // Must have at least one intersection (except for the first word)
    if (this.placements.length > 0 && intersections === 0) return false;

    // Don't duplicate a word that's already placed
    if (this.placements.some(p => p.word.toUpperCase() === wordUpper)) return false;

    return true;
  }

  /**
   * Place a word onto the grid. Returns a backup structure for undo.
   */
  _placeWord(word, clue, row, col, direction) {
    const wordUpper = word.toUpperCase();
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    const backup = [];

    for (let i = 0; i < wordUpper.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      backup.push({ r, c, prev: this.grid[r][c] });
      this.grid[r][c] = wordUpper[i];
    }

    const key = `${row},${col}`;
    let number = this.wordNumberMap.get(key);
    if (number === undefined) {
      this.currentNumber++;
      number = this.currentNumber;
      this.wordNumberMap.set(key, number);
    }

    this.placements.push({ word: wordUpper, clue, row, col, direction, number });
    return backup;
  }

  /**
   * Undo a word placement using the backup data.
   */
  _undoPlace(word, row, col, direction, backup) {
    for (const { r, c, prev } of backup) {
      this.grid[r][c] = prev;
    }

    // Remove last placement
    const removed = this.placements.pop();

    // If no other placement starts at the same cell, remove the number
    const key = `${row},${col}`;
    const stillUsed = this.placements.some(p => `${p.row},${p.col}` === key);
    if (!stillUsed) {
      this.wordNumberMap.delete(key);
      // Don't decrement currentNumber to keep numbering consistent
    }
  }

  /* ---- result compaction ---- */

  _compactResult() {
    // Find bounding box of filled cells
    let minR = this.size, maxR = 0, minC = this.size, maxC = 0;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] !== null) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
      }
    }

    // Add 1-cell padding
    minR = Math.max(0, minR - 1);
    maxR = Math.min(this.size - 1, maxR + 1);
    minC = Math.max(0, minC - 1);
    maxC = Math.min(this.size - 1, maxC + 1);

    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;

    const compactGrid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(this.grid[minR + r][minC + c]);
      }
      compactGrid.push(row);
    }

    // Re-number placements in reading order
    const adjustedPlacements = this.placements.map(p => ({
      ...p,
      row: p.row - minR,
      col: p.col - minC,
    }));

    // Sort by position (reading order) and assign sequential numbers
    const startCells = new Map();
    for (const p of adjustedPlacements) {
      const key = `${p.row},${p.col}`;
      if (!startCells.has(key)) {
        startCells.set(key, { row: p.row, col: p.col });
      }
    }

    const sortedStarts = [...startCells.entries()].sort((a, b) => {
      const [, posA] = a;
      const [, posB] = b;
      return posA.row !== posB.row ? posA.row - posB.row : posA.col - posB.col;
    });

    const numberMap = new Map();
    sortedStarts.forEach(([key], idx) => {
      numberMap.set(key, idx + 1);
    });

    for (const p of adjustedPlacements) {
      p.number = numberMap.get(`${p.row},${p.col}`);
    }

    return {
      grid: compactGrid,
      placements: adjustedPlacements,
      rows,
      cols,
    };
  }

  /* ---- utilities ---- */

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
