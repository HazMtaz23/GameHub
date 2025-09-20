class NeonSnake {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {};
        this.obstacles = [];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameSpeed = 150;
        this.obstacleSpawnRate = 0.02; // Chance per frame when score increases
        
        this.colors = {
            snakeHead: '#00f5ff',
            snakeBody: '#bf00ff',
            food: '#39ff14',
            background: 'rgba(0, 0, 0, 0.1)',
            obstacles: {
                wall: '#ff0080',
                spike: '#ff4500',
                toxic: '#9400d3'
            }
        };
        
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        document.getElementById('highScore').textContent = this.highScore;
        
        // Initialize obstacle counter
        this.updateObstacleCounter();
        
        this.setupEventListeners();
        this.generateFood();
        this.drawGame(); // Just draw the initial state
        this.gameLoop(); // Start the game loop
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code === 'Space') {
                this.startGame();
                return;
            }
            
            if (this.gameRunning) {
                switch(e.code) {
                    case 'ArrowUp':
                    case 'KeyW':
                        e.preventDefault();
                        this.changeDirection('UP');
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        e.preventDefault();
                        this.changeDirection('DOWN');
                        break;
                    case 'ArrowLeft':
                    case 'KeyA':
                        e.preventDefault();
                        this.changeDirection('LEFT');
                        break;
                    case 'ArrowRight':
                    case 'KeyD':
                        e.preventDefault();
                        this.changeDirection('RIGHT');
                        break;
                    case 'Space':
                        e.preventDefault();
                        this.togglePause();
                        break;
                    case 'KeyR':
                        e.preventDefault();
                        this.restartGame();
                        break;
                }
            }
        });
        
        // Touch events for mobile with improved handling
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling only on canvas
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling when moving on canvas
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            
            // Minimum swipe distance and maximum time for a valid swipe
            const minSwipeDistance = 30;
            const maxSwipeTime = 300;
            
            if (deltaTime > maxSwipeTime) return;
            if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
                return;
            }
            
            // Determine swipe direction based on the larger delta
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    this.changeDirection('RIGHT');
                } else {
                    this.changeDirection('LEFT');
                }
            } else {
                if (deltaY > 0) {
                    this.changeDirection('DOWN');
                } else {
                    this.changeDirection('UP');
                }
            }
        });
    }
    
    changeDirection(direction) {
        if (this.gamePaused || !this.gameRunning) return;
        
        const opposites = {
            'UP': 'DOWN',
            'DOWN': 'UP',
            'LEFT': 'RIGHT',
            'RIGHT': 'LEFT'
        };
        
        const currentDirection = this.getCurrentDirection();
        if (direction === opposites[currentDirection]) return;
        
        switch(direction) {
            case 'UP':
                this.dx = 0;
                this.dy = -1;
                break;
            case 'DOWN':
                this.dx = 0;
                this.dy = 1;
                break;
            case 'LEFT':
                this.dx = -1;
                this.dy = 0;
                break;
            case 'RIGHT':
                this.dx = 1;
                this.dy = 0;
                break;
        }
    }
    
    getCurrentDirection() {
        if (this.dx === 0 && this.dy === -1) return 'UP';
        if (this.dx === 0 && this.dy === 1) return 'DOWN';
        if (this.dx === -1 && this.dy === 0) return 'LEFT';
        if (this.dx === 1 && this.dy === 0) return 'RIGHT';
        return null;
    }
    
    generateFood() {
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === foodPosition.x && segment.y === foodPosition.y) ||
                 this.obstacles.some(obstacle => obstacle.x === foodPosition.x && obstacle.y === foodPosition.y));
        
        this.food = foodPosition;
    }
    
    generateObstacles() {
        // Progressive difficulty - more obstacles as score increases, but start with some
        const baseObstacles = 3; // Start with 3 obstacles immediately
        const maxObstacles = Math.min(15, baseObstacles + Math.floor(this.score / 20));
        const currentObstacles = this.obstacles.length;
        
        // Increase spawn rate based on score, but keep it reasonable
        const dynamicSpawnRate = Math.min(0.08, this.obstacleSpawnRate + (this.score / 800));
        
        if (currentObstacles < maxObstacles && Math.random() < dynamicSpawnRate) {
            this.spawnRandomObstacle();
        }
    }
    
    generateInitialObstacles() {
        // Generate 3-4 obstacles at the start of each game
        const initialObstacleCount = 3 + Math.floor(Math.random() * 2); // 3 or 4 obstacles
        
        for (let i = 0; i < initialObstacleCount; i++) {
            this.spawnRandomObstacle();
        }
    }
    
    spawnRandomObstacle() {
        const obstacleTypes = ['wall', 'spike', 'toxic'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        let obstaclePosition;
        let attempts = 0;
        
        do {
            obstaclePosition = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount),
                type: type
            };
            attempts++;
        } while (attempts < 50 && (
            this.snake.some(segment => segment.x === obstaclePosition.x && segment.y === obstaclePosition.y) ||
            this.obstacles.some(obstacle => obstacle.x === obstaclePosition.x && obstacle.y === obstaclePosition.y) ||
            (this.food.x === obstaclePosition.x && this.food.y === obstaclePosition.y) ||
            (obstaclePosition.x === 10 && obstaclePosition.y === 10) // Don't spawn on starting position
        ));
        
        if (attempts < 50) {
            this.obstacles.push(obstaclePosition);
            this.updateObstacleCounter();
        }
    }
    
    clearObstacles() {
        this.obstacles = [];
        this.updateObstacleCounter();
    }
    
    updateObstacleCounter() {
        document.getElementById('obstacleCount').textContent = this.obstacles.length;
    }
    
    checkObstacleCollision() {
        const head = this.snake[0];
        return this.obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y);
    }
    
    drawGlowingRect(x, y, width, height, color, glowColor = color) {
        // Glow effect
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        // Inner bright core
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = this.lightenColor(color, 0.3);
        this.ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    }
    
    drawGlowingCircle(x, y, radius, color, glowColor = color) {
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Pulsing animation for food
        const pulseRadius = radius + Math.sin(Date.now() * 0.01) * 2;
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = this.lightenColor(color, 0.5);
        this.ctx.beginPath();
        this.ctx.arc(x, y, pulseRadius * 0.6, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawObstacle(obstacle) {
        const x = obstacle.x * this.gridSize;
        const y = obstacle.y * this.gridSize;
        const color = this.colors.obstacles[obstacle.type];
        
        switch(obstacle.type) {
            case 'wall':
                // Draw solid wall block
                this.drawGlowingRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, color, color);
                break;
                
            case 'spike':
                // Draw spikes pointing inward
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = color;
                
                // Draw spike shape
                this.ctx.beginPath();
                const centerX = x + this.gridSize / 2;
                const centerY = y + this.gridSize / 2;
                const spikeSize = this.gridSize * 0.4;
                
                // Create diamond/spike shape
                this.ctx.moveTo(centerX, centerY - spikeSize);
                this.ctx.lineTo(centerX + spikeSize, centerY);
                this.ctx.lineTo(centerX, centerY + spikeSize);
                this.ctx.lineTo(centerX - spikeSize, centerY);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'toxic':
                // Draw pulsing toxic circle
                const pulseIntensity = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
                const centerXToxic = x + this.gridSize / 2;
                const centerYToxic = y + this.gridSize / 2;
                const radius = (this.gridSize / 3) * pulseIntensity;
                
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 20 * pulseIntensity;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(centerXToxic, centerYToxic, radius, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Add inner core
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = `rgba(148, 0, 211, ${0.5 * pulseIntensity})`;
                this.ctx.beginPath();
                this.ctx.arc(centerXToxic, centerYToxic, radius * 0.6, 0, 2 * Math.PI);
                this.ctx.fill();
                break;
        }
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    lightenColor(color, factor) {
        // Simple color lightening function
        const colors = {
            '#00f5ff': `rgba(0, 245, 255, ${factor})`,
            '#bf00ff': `rgba(191, 0, 255, ${factor})`,
            '#39ff14': `rgba(57, 255, 20, ${factor})`,
            '#ff0080': `rgba(255, 0, 128, ${factor})`
        };
        return colors[color] || color;
    }
    
    createParticleEffect(x, y, type = 'food') {
        const particleCount = type === 'collision' ? 15 : 8;
        const colors = type === 'collision' ? ['#ff0080', '#bf00ff'] : ['#39ff14', '#00f5ff'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${type}-particle`;
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = Math.random() * 8 + 4 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = Math.random() * 50 + 30;
            const moveX = Math.cos(angle) * velocity;
            const moveY = Math.sin(angle) * velocity;
            
            particle.style.transform = `translate(${moveX}px, ${moveY}px)`;
            
            document.getElementById('particleContainer').appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }
    
    drawGame() {
        // Clear canvas with trail effect
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid pattern
        this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            if (index === 0) {
                // Snake head with extra glow
                this.drawGlowingRect(x, y, this.gridSize - 2, this.gridSize - 2, 
                                   this.colors.snakeHead, this.colors.snakeHead);
                
                // Add eyes
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x + 4, y + 4, 3, 3);
                this.ctx.fillRect(x + 13, y + 4, 3, 3);
            } else {
                // Snake body with gradient effect
                const intensity = (this.snake.length - index) / this.snake.length;
                const alpha = 0.3 + (intensity * 0.7);
                this.drawGlowingRect(x + 1, y + 1, this.gridSize - 4, this.gridSize - 4, 
                                   this.colors.snakeBody, `rgba(191, 0, 255, ${alpha})`);
            }
        });
        
        // Draw food with pulsing animation
        const foodX = this.food.x * this.gridSize + this.gridSize / 2;
        const foodY = this.food.y * this.gridSize + this.gridSize / 2;
        this.drawGlowingCircle(foodX, foodY, this.gridSize / 3, this.colors.food);
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    updateGame() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // Don't update if the snake isn't moving yet
        if (this.dx === 0 && this.dy === 0) return;
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        // Check obstacle collision
        if (this.checkObstacleCollision()) {
            // Create particle effect for obstacle collision
            const rect = this.canvas.getBoundingClientRect();
            const particleX = rect.left + head.x * this.gridSize + this.gridSize / 2;
            const particleY = rect.top + head.y * this.gridSize + this.gridSize / 2;
            this.createParticleEffect(particleX, particleY, 'collision');
            
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            
            // Create particle effect
            const rect = this.canvas.getBoundingClientRect();
            const particleX = rect.left + this.food.x * this.gridSize + this.gridSize / 2;
            const particleY = rect.top + this.food.y * this.gridSize + this.gridSize / 2;
            this.createParticleEffect(particleX, particleY, 'food');
            
            // Increase speed slightly
            if (this.gameSpeed > 80) {
                this.gameSpeed -= 2;
            }
            
            this.generateFood();
            
            // Generate obstacles based on score
            this.generateObstacles();
        } else {
            this.snake.pop();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Screen shake effect
        document.body.classList.add('shake');
        setTimeout(() => {
            document.body.classList.remove('shake');
        }, 500);
        
        // Create collision particles
        const head = this.snake[0];
        const rect = this.canvas.getBoundingClientRect();
        const particleX = rect.left + head.x * this.gridSize + this.gridSize / 2;
        const particleY = rect.top + head.y * this.gridSize + this.gridSize / 2;
        this.createParticleEffect(particleX, particleY, 'collision');
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
            document.getElementById('newHighScore').classList.remove('hidden');
        } else {
            document.getElementById('newHighScore').classList.add('hidden');
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    gameLoop() {
        this.updateGame();
        this.drawGame();
        
        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, this.gameSpeed);
    }
    
    startGame() {
        // Reset game state
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameSpeed = 150;
        this.gameRunning = true;
        this.gamePaused = false;
        
        // Clear obstacles
        this.clearObstacles();
        
        // Generate initial obstacles
        this.generateInitialObstacles();
        
        // Update UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        
        // Generate new food
        this.generateFood();
        
        // Draw initial game state
        this.drawGame();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseScreen').classList.toggle('hidden', !this.gamePaused);
    }
    
    restartGame() {
        this.startGame();
    }
}

// Global functions for button clicks
function startGame() {
    game.startGame();
}

function restartGame() {
    game.restartGame();
}

function togglePause() {
    game.togglePause();
}

function changeDirection(direction) {
    game.changeDirection(direction);
}

function goHome() {
    window.location.href = '../../index.html';
}

// Initialize game
const game = new NeonSnake();

// Prevent scrolling on mobile only when touching the canvas
document.getElementById('gameCanvas').addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Allow scrolling on the rest of the page
document.getElementById('mobileControls').addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
