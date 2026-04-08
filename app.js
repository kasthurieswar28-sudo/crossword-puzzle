/**
 * Crossword Puzzle — Application Controller
 * Handles rendering, user input, clue management, timer, and game state.
 */

/* ============================================================
   WORD BANKS — themed puzzle sets
   ============================================================ */
const WORD_BANKS = [
  {
    theme: 'Animals',
    words: [
      { word: 'DOG', clue: "Man's best friend" },
      { word: 'CAT', clue: 'Meows and purrs' },
      { word: 'BIRD', clue: 'Has feathers and flies' },
      { word: 'FISH', clue: 'Swims in the water' },
      { word: 'LION', clue: 'King of the jungle' },
      { word: 'BEAR', clue: 'Large furry animal that loves honey' },
      { word: 'FROG', clue: 'Green amphibian that jumps' },
      { word: 'HORSE', clue: 'You can ride this animal using a saddle' },
      { word: 'PIG', clue: 'Oinks and loves mud' },
      { word: 'MOUSE', clue: 'Squeaks and loves cheese' },
      { word: 'COW', clue: 'Farm animal that gives milk' },
      { word: 'DUCK', clue: 'Water bird that quacks' },
      { word: 'TIGER', clue: 'Large orange cat with black stripes' },
      { word: 'ZEBRA', clue: 'Looks like a horse with black and white stripes' },
      { word: 'SNAKE', clue: 'Long reptile with no legs' },
    ],
  },
  {
    theme: 'Food',
    words: [
      { word: 'APPLE', clue: 'A red or green fruit' },
      { word: 'BREAD', clue: 'Baked dough used for sandwiches' },
      { word: 'CHEESE', clue: 'Yellow dairy product' },
      { word: 'MILK', clue: 'White drink from cows' },
      { word: 'PIZZA', clue: 'Round flatbread with tomato sauce and cheese' },
      { word: 'EGG', clue: 'Laid by chickens' },
      { word: 'CAKE', clue: 'Sweet baked dessert for birthdays' },
      { word: 'WATER', clue: 'Clear liquid that we drink' },
      { word: 'RICE', clue: 'Small white grains eaten in many dishes' },
      { word: 'BEANS', clue: 'Small seeds inside a pod' },
      { word: 'BACON', clue: 'Crispy breakfast meat' },
      { word: 'HONEY', clue: 'Sweet sticky liquid made by bees' },
      { word: 'SOUP', clue: 'Warm liquid meal in a bowl' },
      { word: 'SALAD', clue: 'Healthy bowl of mixed raw vegetables' },
      { word: 'JUICE', clue: 'Sweet drink squeezed from fruits' },
    ],
  },
  {
    theme: 'Everyday Objects',
    words: [
      { word: 'CHAIR', clue: 'A piece of furniture to sit on' },
      { word: 'TABLE', clue: 'Flat surface with legs for eating or working' },
      { word: 'BED', clue: 'Where you sleep at night' },
      { word: 'BOOK', clue: 'Has pages and you read it' },
      { word: 'PHONE', clue: 'Device you use to call someone' },
      { word: 'DOOR', clue: 'You open this to enter a room' },
      { word: 'CLOCK', clue: 'Tells you what time it is' },
      { word: 'SHOE', clue: 'Something you wear on your foot' },
      { word: 'SOCK', clue: 'Worn on your foot inside your shoe' },
      { word: 'CUP', clue: 'Small container used for drinking' },
      { word: 'PLATE', clue: 'Flat dish you eat food from' },
      { word: 'FORK', clue: 'Utensil with prongs for eating' },
      { word: 'SPOON', clue: 'Utensil used for eating soup' },
      { word: 'SOAP', clue: 'Used with water to wash your hands' },
      { word: 'TOWEL', clue: 'Used to dry yourself after a shower' },
    ],
  },
  {
    theme: 'Nature',
    words: [
      { word: 'TREE', clue: 'Tall plant with a wooden trunk and leaves' },
      { word: 'FLOWER', clue: 'Colorful part of a plant' },
      { word: 'GRASS', clue: 'Green plants covering a lawn' },
      { word: 'SUN', clue: 'Bright yellow star in the sky' },
      { word: 'MOON', clue: 'Shines in the night sky' },
      { word: 'STAR', clue: 'Little twinkling light in the night sky' },
      { word: 'CLOUD', clue: 'White fluffy thing in the sky' },
      { word: 'RAIN', clue: 'Water falling from the sky' },
      { word: 'SNOW', clue: 'Cold white flakes falling from the sky' },
      { word: 'WIND', clue: 'Moving air' },
      { word: 'DIRT', clue: 'Soil on the ground' },
      { word: 'ROCK', clue: 'Hard solid part of the earth' },
      { word: 'FIRE', clue: 'Hot and bright burning flame' },
      { word: 'RIVER', clue: 'Flowing body of water' },
      { word: 'OCEAN', clue: 'Vast body of salt water' },
    ],
  },
];

/* ============================================================
   APPLICATION STATE
   ============================================================ */
let puzzleData = null;        // { grid, placements, rows, cols }
let userGrid = [];            // user's letter inputs
let activeCell = null;        // { row, col }
let activeDirection = 'across';
let timerInterval = null;
let elapsedSeconds = 0;
let puzzleSolved = false;

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const $grid = document.getElementById('crossword-grid');
const $acrossClues = document.getElementById('across-clues');
const $downClues = document.getElementById('down-clues');
const $wordsPlaced = document.getElementById('words-placed');
const $progressPct = document.getElementById('progress-pct');
const $timerDisplay = document.getElementById('timer-display');
const $btnNew = document.getElementById('btn-new-puzzle');
const $btnCheck = document.getElementById('btn-check');
const $btnReveal = document.getElementById('btn-reveal');
const $btnClear = document.getElementById('btn-clear');
const $successModal = document.getElementById('success-modal');
const $btnPlayAgain = document.getElementById('btn-play-again');
const $generatingOverlay = document.getElementById('generating-overlay');

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  generateNewPuzzle();
  bindEvents();
});

function bindEvents() {
  $btnNew.addEventListener('click', generateNewPuzzle);
  $btnCheck.addEventListener('click', checkAnswers);
  $btnReveal.addEventListener('click', revealAnswers);
  $btnClear.addEventListener('click', clearAnswers);
  $btnPlayAgain.addEventListener('click', () => {
    $successModal.classList.add('hidden');
    generateNewPuzzle();
  });
  document.addEventListener('keydown', handleKeydown);
}

/* ============================================================
   PUZZLE GENERATION
   ============================================================ */
function generateNewPuzzle() {
  $generatingOverlay.classList.remove('hidden');
  puzzleSolved = false;

  // Use setTimeout so the overlay renders before the CPU-heavy generation
  setTimeout(() => {
    const bank = WORD_BANKS[Math.floor(Math.random() * WORD_BANKS.length)];
    const engine = new CrosswordEngine(20);
    puzzleData = engine.generate(bank.words);

    // Initialize user grid
    userGrid = Array.from({ length: puzzleData.rows }, () =>
      Array(puzzleData.cols).fill('')
    );

    activeCell = null;
    activeDirection = 'across';

    renderGrid();
    renderClues();
    resetTimer();
    startTimer();
    updateStats();

    $generatingOverlay.classList.add('hidden');
  }, 80);
}

/* ============================================================
   RENDERING — GRID
   ============================================================ */
function renderGrid() {
  $grid.innerHTML = '';
  $grid.style.gridTemplateColumns = `repeat(${puzzleData.cols}, var(--cell-size))`;

  // Build a number map for display
  const numberMap = new Map();
  for (const p of puzzleData.placements) {
    const key = `${p.row},${p.col}`;
    if (!numberMap.has(key)) {
      numberMap.set(key, p.number);
    }
  }

  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      const div = document.createElement('div');
      div.dataset.row = r;
      div.dataset.col = c;

      if (puzzleData.grid[r][c] === null) {
        div.className = 'cell cell-black';
      } else {
        div.className = 'cell cell-white';
        div.addEventListener('click', () => handleCellClick(r, c));

        const key = `${r},${c}`;
        if (numberMap.has(key)) {
          const numSpan = document.createElement('span');
          numSpan.className = 'cell-number';
          numSpan.textContent = numberMap.get(key);
          div.appendChild(numSpan);
        }

        const letterSpan = document.createElement('span');
        letterSpan.className = 'cell-letter';
        letterSpan.textContent = userGrid[r][c] || '';
        div.appendChild(letterSpan);
      }

      $grid.appendChild(div);
    }
  }
}

/* ============================================================
   RENDERING — CLUES
   ============================================================ */
function renderClues() {
  $acrossClues.innerHTML = '';
  $downClues.innerHTML = '';

  const acrossPlacements = puzzleData.placements
    .filter(p => p.direction === 'across')
    .sort((a, b) => a.number - b.number);

  const downPlacements = puzzleData.placements
    .filter(p => p.direction === 'down')
    .sort((a, b) => a.number - b.number);

  acrossPlacements.forEach(p => {
    $acrossClues.appendChild(createClueItem(p));
  });

  downPlacements.forEach(p => {
    $downClues.appendChild(createClueItem(p));
  });
}

function createClueItem(placement) {
  const li = document.createElement('li');
  li.className = 'clue-item';
  li.id = `clue-${placement.direction}-${placement.number}`;
  li.dataset.direction = placement.direction;
  li.dataset.number = placement.number;
  li.dataset.row = placement.row;
  li.dataset.col = placement.col;

  li.innerHTML = `
    <span class="clue-number">${placement.number}</span>
    <span class="clue-text">${placement.clue}</span>
  `;

  li.addEventListener('click', () => {
    activeDirection = placement.direction;
    handleCellClick(placement.row, placement.col);
  });

  return li;
}

/* ============================================================
   INTERACTION — Cell Click / Keyboard
   ============================================================ */
function handleCellClick(row, col) {
  if (puzzleData.grid[row][col] === null) return;

  // If clicking the same cell, toggle direction
  if (activeCell && activeCell.row === row && activeCell.col === col) {
    activeDirection = activeDirection === 'across' ? 'down' : 'across';
  }

  activeCell = { row, col };
  highlightActiveCells();
}

function handleKeydown(e) {
  if (!activeCell || puzzleSolved) return;

  const { row, col } = activeCell;

  if (e.key === 'Tab') {
    e.preventDefault();
    activeDirection = activeDirection === 'across' ? 'down' : 'across';
    highlightActiveCells();
    return;
  }

  if (e.key === 'ArrowRight') { e.preventDefault(); moveActive(0, 1); return; }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); moveActive(0, -1); return; }
  if (e.key === 'ArrowDown')  { e.preventDefault(); moveActive(1, 0); return; }
  if (e.key === 'ArrowUp')    { e.preventDefault(); moveActive(-1, 0); return; }

  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    if (userGrid[row][col] !== '') {
      userGrid[row][col] = '';
      updateCellDisplay(row, col);
    } else {
      // Move backward
      const dr = activeDirection === 'down' ? -1 : 0;
      const dc = activeDirection === 'across' ? -1 : 0;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < puzzleData.rows && nc >= 0 && nc < puzzleData.cols && puzzleData.grid[nr][nc] !== null) {
        userGrid[nr][nc] = '';
        activeCell = { row: nr, col: nc };
        updateCellDisplay(nr, nc);
        highlightActiveCells();
      }
    }
    updateStats();
    return;
  }

  if (/^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
    userGrid[row][col] = e.key.toUpperCase();
    updateCellDisplay(row, col);

    // Advance to next cell
    const dr = activeDirection === 'down' ? 1 : 0;
    const dc = activeDirection === 'across' ? 1 : 0;
    const nr = row + dr, nc = col + dc;
    if (nr < puzzleData.rows && nc < puzzleData.cols && puzzleData.grid[nr][nc] !== null) {
      activeCell = { row: nr, col: nc };
      highlightActiveCells();
    }

    updateStats();
    checkAutoSolve();
  }
}

function moveActive(dr, dc) {
  let nr = activeCell.row + dr;
  let nc = activeCell.col + dc;
  // Skip black cells
  while (nr >= 0 && nr < puzzleData.rows && nc >= 0 && nc < puzzleData.cols) {
    if (puzzleData.grid[nr][nc] !== null) {
      activeCell = { row: nr, col: nc };
      highlightActiveCells();
      return;
    }
    nr += dr;
    nc += dc;
  }
}

/* ============================================================
   HIGHLIGHTING
   ============================================================ */
function highlightActiveCells() {
  // Remove all highlights
  document.querySelectorAll('.cell-white').forEach(cell => {
    cell.classList.remove('active', 'highlighted');
  });

  // Remove active clue
  document.querySelectorAll('.clue-item').forEach(item => {
    item.classList.remove('active');
  });

  if (!activeCell) return;

  const { row, col } = activeCell;

  // Find which word the active cell belongs to in the current direction
  const placement = findPlacementForCell(row, col, activeDirection);
  if (placement) {
    const dr = activeDirection === 'down' ? 1 : 0;
    const dc = activeDirection === 'across' ? 1 : 0;

    for (let i = 0; i < placement.word.length; i++) {
      const r = placement.row + dr * i;
      const c = placement.col + dc * i;
      const cell = getCellElement(r, c);
      if (cell) cell.classList.add('highlighted');
    }

    // Highlight the clue
    const clueEl = document.getElementById(`clue-${placement.direction}-${placement.number}`);
    if (clueEl) {
      clueEl.classList.add('active');
      clueEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // Active cell
  const activeEl = getCellElement(row, col);
  if (activeEl) activeEl.classList.add('active');
}

function findPlacementForCell(row, col, direction) {
  return puzzleData.placements.find(p => {
    if (p.direction !== direction) return false;
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    for (let i = 0; i < p.word.length; i++) {
      if (p.row + dr * i === row && p.col + dc * i === col) return true;
    }
    return false;
  });
}

/* ============================================================
   CELL DISPLAY
   ============================================================ */
function updateCellDisplay(row, col) {
  const cell = getCellElement(row, col);
  if (!cell) return;
  const letterSpan = cell.querySelector('.cell-letter');
  if (letterSpan) letterSpan.textContent = userGrid[row][col];
}

function getCellElement(row, col) {
  return $grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

/* ============================================================
   STATS & TIMER
   ============================================================ */
function updateStats() {
  // Count filled cells
  let filled = 0, total = 0;
  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      if (puzzleData.grid[r][c] !== null) {
        total++;
        if (userGrid[r][c] !== '') filled++;
      }
    }
  }

  $wordsPlaced.textContent = puzzleData.placements.length;
  $progressPct.textContent = total > 0 ? Math.round((filled / total) * 100) + '%' : '0%';
}

function resetTimer() {
  if (timerInterval) clearInterval(timerInterval);
  elapsedSeconds = 0;
  $timerDisplay.textContent = '0:00';
}

function startTimer() {
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = String(elapsedSeconds % 60).padStart(2, '0');
    $timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

/* ============================================================
   CHECK / REVEAL / CLEAR
   ============================================================ */
function checkAnswers() {
  let allCorrect = true;

  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      if (puzzleData.grid[r][c] === null) continue;
      const cell = getCellElement(r, c);
      if (!cell) continue;

      // Remove previous markers
      cell.classList.remove('correct', 'wrong');

      if (userGrid[r][c] === '') {
        allCorrect = false;
        continue;
      }

      if (userGrid[r][c] === puzzleData.grid[r][c]) {
        cell.classList.add('correct');
      } else {
        cell.classList.add('wrong');
        allCorrect = false;
      }
    }
  }

  // Clear markers after a delay
  setTimeout(() => {
    document.querySelectorAll('.cell-white').forEach(cell => {
      cell.classList.remove('correct', 'wrong');
    });
  }, 2000);

  if (allCorrect && isGridFull()) {
    showSuccess();
  }
}

function revealAnswers() {
  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      if (puzzleData.grid[r][c] === null) continue;
      userGrid[r][c] = puzzleData.grid[r][c];
      updateCellDisplay(r, c);
      const cell = getCellElement(r, c);
      if (cell) cell.classList.add('revealed');
    }
  }
  updateStats();
  if (timerInterval) clearInterval(timerInterval);
}

function clearAnswers() {
  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      if (puzzleData.grid[r][c] === null) continue;
      userGrid[r][c] = '';
      updateCellDisplay(r, c);
      const cell = getCellElement(r, c);
      if (cell) cell.classList.remove('correct', 'wrong', 'revealed');
    }
  }
  updateStats();
}

/* ============================================================
   AUTO-SOLVE CHECK
   ============================================================ */
function checkAutoSolve() {
  if (!isGridFull()) return;

  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      if (puzzleData.grid[r][c] === null) continue;
      if (userGrid[r][c] !== puzzleData.grid[r][c]) return;
    }
  }

  showSuccess();
}

function isGridFull() {
  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      if (puzzleData.grid[r][c] !== null && userGrid[r][c] === '') return false;
    }
  }
  return true;
}

/* ============================================================
   SUCCESS
   ============================================================ */
function showSuccess() {
  puzzleSolved = true;
  if (timerInterval) clearInterval(timerInterval);

  // Count cells
  let totalCells = 0;
  for (let r = 0; r < puzzleData.rows; r++) {
    for (let c = 0; c < puzzleData.cols; c++) {
      if (puzzleData.grid[r][c] !== null) totalCells++;
    }
  }

  document.getElementById('modal-time').textContent = `Solved in ${formatTime(elapsedSeconds)}`;
  document.getElementById('modal-words').textContent = puzzleData.placements.length;
  document.getElementById('modal-cells').textContent = totalCells;

  // Confetti
  const confettiContainer = document.querySelector('.modal-confetti');
  confettiContainer.innerHTML = '';
  const colors = ['#6366f1', '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 1.5 + 's';
    piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    confettiContainer.appendChild(piece);
  }

  // Mark all cells correct
  document.querySelectorAll('.cell-white').forEach(cell => {
    cell.classList.add('correct');
  });

  $successModal.classList.remove('hidden');
}
