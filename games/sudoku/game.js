// Neon Sudoku Game
class NeonSudoku {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.difficulty = 'medium';
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.gameState = 'START'; // START, PLAYING, PAUSED, GAME_OVER, WON
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.hintsUsed = 0;
        
        // Difficulty settings (number of clues to remove)
        this.difficultySettings = {
            easy: 40,    // Remove 40 numbers (41 clues remaining)
            medium: 50,  // Remove 50 numbers (31 clues remaining)
            hard: 60     // Remove 60 numbers (21 clues remaining)
        };
        
        this.initialize();
    }
    
    initialize() {
        this.createGrid();
        this.setupEventListeners();
        this.updateDisplay();
        
        // Global functions for buttons
        window.startGame = () => this.startGame();
        window.startNewGame = () => this.startNewGame();
        window.setDifficulty = (diff) => this.setDifficulty(diff);
        window.changeDifficulty = () => this.showStartScreen();
        window.showHint = () => this.showHint();
        window.pauseGame = () => this.togglePause();
        window.resetGame = () => this.resetGame();
    }
    
    createGrid() {
        const gridContainer = document.getElementById('sudokuGrid');
        gridContainer.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add 3x3 box borders
                if (row % 3 === 0 && row > 0) cell.classList.add('border-top-thick');
                if (col % 3 === 0 && col > 0) cell.classList.add('border-left-thick');
                
                cell.addEventListener('click', () => this.selectCell(row, col));
                gridContainer.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const number = parseInt(btn.dataset.number);
                this.inputNumber(number);
            });
        });
        
        // Erase button
        document.getElementById('eraseBtn').addEventListener('click', () => {
            this.eraseCell();
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'PLAYING') return;
            
            const key = e.key;
            if (key >= '1' && key <= '9') {
                this.inputNumber(parseInt(key));
            } else if (key === 'Delete' || key === 'Backspace') {
                this.eraseCell();
            }
        });
    }
    
    generateSolution() {
        // Reset grid
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill the grid using backtracking
        this.solveSudoku(this.solution);
    }
    
    solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    // Try numbers 1-9 in random order
                    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (const num of numbers) {
                        if (this.isValidMove(grid, row, col, num)) {
                            grid[row][col] = num;
                            
                            if (this.solveSudoku(grid)) {
                                return true;
                            }
                            
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    isValidMove(grid, row, col, num) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (grid[row][c] === num) return false;
        }
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (grid[r][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r][c] === num) return false;
            }
        }
        
        return true;
    }
    
    generatePuzzle() {
        // Generate complete solution
        this.generateSolution();
        
        // Copy solution to grid
        this.grid = this.solution.map(row => [...row]);
        
        // Remove numbers based on difficulty
        const cellsToRemove = this.difficultySettings[this.difficulty];
        const cells = [];
        
        // Create list of all cells
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                cells.push({row, col});
            }
        }
        
        // Shuffle and remove cells
        const shuffledCells = this.shuffleArray(cells);
        for (let i = 0; i < cellsToRemove && i < shuffledCells.length; i++) {
            const {row, col} = shuffledCells[i];
            this.grid[row][col] = 0;
        }
        
        // Store initial grid state
        this.initialGrid = this.grid.map(row => [...row]);
    }
    
    selectCell(row, col) {
        if (this.gameState !== 'PLAYING') return;
        
        // Remove previous selection
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected', 'highlighted');
        });
        
        this.selectedCell = {row, col};
        
        // Highlight selected cell and related cells
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);
            
            if (cellRow === row && cellCol === col) {
                cell.classList.add('selected');
            } else if (cellRow === row || cellCol === col || 
                      (Math.floor(cellRow / 3) === Math.floor(row / 3) && 
                       Math.floor(cellCol / 3) === Math.floor(col / 3))) {
                cell.classList.add('highlighted');
            }
        });
    }
    
    inputNumber(number) {
        if (!this.selectedCell || this.gameState !== 'PLAYING') return;
        
        const {row, col} = this.selectedCell;
        
        // Can't modify initial numbers
        if (this.initialGrid[row][col] !== 0) return;
        
        // Check if move is valid
        if (!this.isValidMove(this.grid, row, col, number)) {
            this.mistakes++;
            this.updateDisplay();
            this.showMistake(row, col);
            
            if (this.mistakes >= this.maxMistakes) {
                this.gameOver(false);
                return;
            }
        }
        
        this.grid[row][col] = number;
        this.updateGrid();
        
        // Check for win
        if (this.isPuzzleSolved()) {
            this.gameOver(true);
        }
    }
    
    eraseCell() {
        if (!this.selectedCell || this.gameState !== 'PLAYING') return;
        
        const {row, col} = this.selectedCell;
        
        // Can't erase initial numbers
        if (this.initialGrid[row][col] !== 0) return;
        
        this.grid[row][col] = 0;
        this.updateGrid();
    }
    
    isPuzzleSolved() {
        // Check if grid is completely filled
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) return false;
            }
        }
        
        // Check if solution is correct (all constraints satisfied)
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const num = this.grid[row][col];
                this.grid[row][col] = 0; // Temporarily remove to check validity
                
                if (!this.isValidMove(this.grid, row, col, num)) {
                    this.grid[row][col] = num; // Restore
                    return false;
                }
                
                this.grid[row][col] = num; // Restore
            }
        }
        
        return true;
    }
    
    showMistake(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('mistake');
        
        setTimeout(() => {
            cell.classList.remove('mistake');
        }, 1000);
        
        // Create error particles
        this.createErrorParticles();
    }
    
    showHint() {
        if (this.gameState !== 'PLAYING' || !this.selectedCell) return;
        
        const {row, col} = this.selectedCell;
        
        // Can't give hint for filled cells or initial numbers
        if (this.grid[row][col] !== 0) return;
        
        const correctNumber = this.solution[row][col];
        this.grid[row][col] = correctNumber;
        this.updateGrid();
        
        // Highlight as hint
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('hint');
        
        this.hintsUsed++;
        
        // Create hint particles
        this.createHintParticles();
        
        // Check for win
        if (this.isPuzzleSolved()) {
            this.gameOver(true);
        }
    }
    
    setDifficulty(diff) {
        this.difficulty = diff;
        document.getElementById('difficulty').textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
        
        // Update button styles
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }
    
    startGame() {
        this.gameState = 'PLAYING';
        this.mistakes = 0;
        this.hintsUsed = 0;
        this.selectedCell = null;
        
        // Generate new puzzle
        this.generatePuzzle();
        this.updateGrid();
        
        // Start timer
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.startTimer();
        
        // Hide start screen
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.updateDisplay();
    }
    
    startNewGame() {
        this.startGame();
    }
    
    resetGame() {
        if (this.gameState !== 'PLAYING') return;
        
        // Reset to initial state
        this.grid = this.initialGrid.map(row => [...row]);
        this.mistakes = 0;
        this.selectedCell = null;
        this.elapsedTime = 0;
        this.startTime = Date.now();
        
        this.updateGrid();
        this.updateDisplay();
        
        // Clear all highlights
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected', 'highlighted', 'hint', 'mistake');
        });
    }
    
    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            this.stopTimer();
            
            // Show pause overlay
            this.showPauseScreen();
        } else if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            this.startTime = Date.now() - this.elapsedTime;
            this.startTimer();
            
            // Hide pause overlay
            this.hidePauseScreen();
        }
    }
    
    showStartScreen() {
        this.gameState = 'START';
        this.stopTimer();
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    gameOver(won) {
        this.gameState = 'GAME_OVER';
        this.stopTimer();
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const winMessage = document.getElementById('winMessage');
        const finalTime = document.getElementById('finalTime');
        
        if (won) {
            gameOverTitle.textContent = 'Puzzle Solved! 🎉';
            winMessage.classList.remove('hidden');
            this.createWinParticles();
        } else {
            gameOverTitle.textContent = 'Game Over! 💀';
            winMessage.classList.add('hidden');
        }
        
        finalTime.textContent = this.formatTime(this.elapsedTime);
        gameOverScreen.classList.remove('hidden');
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    updateGrid() {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.grid[row][col];
            
            cell.textContent = value === 0 ? '' : value;
            
            // Style initial numbers differently
            if (this.initialGrid[row][col] !== 0) {
                cell.classList.add('initial');
            } else {
                cell.classList.remove('initial');
            }
        });
    }
    
    updateDisplay() {
        document.getElementById('timer').textContent = this.formatTime(this.elapsedTime);
        document.getElementById('mistakes').textContent = this.mistakes;
        document.getElementById('difficulty').textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
    }
    
    showPauseScreen() {
        // Create a simple pause overlay
        const pauseDiv = document.createElement('div');
        pauseDiv.id = 'pauseScreen';
        pauseDiv.className = 'absolute inset-0 bg-black/80 backdrop-blur-md rounded-lg flex flex-col items-center justify-center z-30';
        pauseDiv.innerHTML = `
            <div class="text-center space-y-6 px-4">
                <h2 class="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple animate-pulse">
                    ⏸️ Paused
                </h2>
                <p class="text-gray-300">Click anywhere to resume</p>
            </div>
        `;
        
        pauseDiv.addEventListener('click', () => this.togglePause());
        document.querySelector('.bg-black\\/40.backdrop-blur-xl').appendChild(pauseDiv);
    }
    
    hidePauseScreen() {
        const pauseScreen = document.getElementById('pauseScreen');
        if (pauseScreen) {
            pauseScreen.remove();
        }
    }
    
    createErrorParticles() {
        const particlesContainer = document.getElementById('particleContainer');
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-2 h-2 bg-neon-pink rounded-full opacity-75 pointer-events-none animate-pulse';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = Math.random() * window.innerHeight + 'px';
            
            particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 500);
        }
    }
    
    createHintParticles() {
        const particlesContainer = document.getElementById('particleContainer');
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-2 h-2 bg-neon-green rounded-full opacity-75 pointer-events-none animate-bounce';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = Math.random() * window.innerHeight + 'px';
            
            particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    createWinParticles() {
        const particlesContainer = document.getElementById('particleContainer');
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-3 h-3 bg-neon-blue rounded-full opacity-90 pointer-events-none animate-ping';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = Math.random() * window.innerHeight + 'px';
            
            particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new NeonSudoku();
});
