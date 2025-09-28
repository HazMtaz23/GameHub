// Neon Flappy Bird Game
class NeonFlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'START'; // START, PLAYING, GAME_OVER
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('flappyBirdBest')) || 0;
        
        // Game settings
        this.gravity = 0.6;
        this.jumpStrength = -12;
        this.gameSpeed = 2;
        this.pipeGap = 180;
        this.pipeWidth = 60;
        
        // Bird properties
        this.bird = {
            x: 80,
            y: 300,
            width: 30,
            height: 30,
            velocity: 0,
            rotation: 0,
            trail: []
        };
        
        // Pipes array
        this.pipes = [];
        this.pipeSpawnTimer = 0;
        this.pipeSpawnInterval = 120; // frames
        
        // Particles system
        this.particles = [];
        
        // Animation frame
        this.animationFrame = 0;
        
        // Initialize
        this.initializeEventListeners();
        this.initializeUI();
        this.createBackgroundParticles();
        this.gameLoop();
        
        // Update best score display
        document.getElementById('highScore').textContent = this.bestScore;
    }
    
    initializeEventListeners() {
        // Click and touch events
        this.canvas.addEventListener('click', (e) => this.handleInput(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput(e);
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput(e);
            }
        });
        
        // Global functions for buttons (matching other games)
        window.startGame = () => this.startGame();
        window.restartGame = () => this.startGame();
        window.handleInput = () => this.handleInput();
    }
    
    initializeUI() {
        this.updateScoreDisplay();
        // Initialize score displays
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.bestScore;
    }
    
    handleInput(e) {
        if (this.gameState === 'PLAYING') {
            this.jump();
        } else if (this.gameState === 'START') {
            this.startGame();
        }
    }
    
    jump() {
        this.bird.velocity = this.jumpStrength;
        this.bird.rotation = -20;
        
        // Create jump particles
        this.createJumpParticles();
        
        // Play sound effect (placeholder)
        // this.playSound('flapSound');
    }
    
    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.trail = [];
        this.pipes = [];
        this.pipeSpawnTimer = 0;
        this.particles = [];
        
        // Hide start screen, show game
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.updateScoreDisplay();
    }
    
    showStartScreen() {
        this.gameState = 'START';
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER';
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBirdBest', this.bestScore);
            document.getElementById('newHighScore').classList.remove('hidden');
        } else {
            document.getElementById('newHighScore').classList.add('hidden');
        }
        
        // Show game over screen
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.bestScore;
        
        // Create explosion particles
        this.createExplosionParticles();
        
        // Play sound effect (placeholder)
        // this.playSound('hitSound');
    }
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highScore').textContent = this.bestScore;
    }
    
    update() {
        if (this.gameState !== 'PLAYING') return;
        
        // Update bird
        this.updateBird();
        
        // Update pipes
        this.updatePipes();
        
        // Check collisions
        this.checkCollisions();
        
        // Update particles
        this.updateParticles();
        
        // Update animation frame
        this.animationFrame++;
    }
    
    updateBird() {
        // Apply gravity
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        
        // Update rotation based on velocity
        if (this.bird.velocity > 0) {
            this.bird.rotation = Math.min(90, this.bird.velocity * 3);
        }
        
        // Add to trail
        this.bird.trail.push({
            x: this.bird.x,
            y: this.bird.y,
            alpha: 1
        });
        
        // Limit trail length
        if (this.bird.trail.length > 8) {
            this.bird.trail.shift();
        }
        
        // Update trail alpha
        this.bird.trail.forEach((point, index) => {
            point.alpha = index / this.bird.trail.length;
        });
        
        // Check boundaries
        if (this.bird.y > this.canvas.height - this.bird.height || this.bird.y < 0) {
            this.gameOver();
        }
    }
    
    updatePipes() {
        // Spawn new pipes
        this.pipeSpawnTimer++;
        if (this.pipeSpawnTimer >= this.pipeSpawnInterval) {
            this.spawnPipe();
            this.pipeSpawnTimer = 0;
        }
        
        // Update existing pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.gameSpeed;
            
            // Check if pipe passed bird (for scoring)
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateScoreDisplay();
                this.createScoreParticles();
                // this.playSound('scoreSound');
            }
            
            // Remove pipes that are off screen
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }
    
    spawnPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }
    
    checkCollisions() {
        for (const pipe of this.pipes) {
            // Check collision with top pipe
            if (this.bird.x + this.bird.width > pipe.x &&
                this.bird.x < pipe.x + this.pipeWidth &&
                this.bird.y < pipe.topHeight) {
                this.gameOver();
                return;
            }
            
            // Check collision with bottom pipe
            if (this.bird.x + this.bird.width > pipe.x &&
                this.bird.x < pipe.x + this.pipeWidth &&
                this.bird.y + this.bird.height > pipe.bottomY) {
                this.gameOver();
                return;
            }
        }
    }
    
    render() {
        // Clear canvas with black background
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game elements
        this.renderPipes();
        this.renderBird();
        this.renderParticles();
    }
    
    renderBird() {
        this.ctx.save();
        
        // Render trail
        this.bird.trail.forEach((point, index) => {
            const alpha = point.alpha * 0.5;
            const size = (this.bird.width * 0.8) * point.alpha;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#00f5ff';
            this.ctx.shadowColor = '#00f5ff';
            this.ctx.shadowBlur = 10;
            
            this.ctx.fillRect(
                point.x + (this.bird.width - size) / 2,
                point.y + (this.bird.height - size) / 2,
                size,
                size
            );
        });
        
        // Reset shadow and alpha
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        
        // Render main bird
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);
        
        // Bird glow effect
        this.ctx.shadowColor = '#ff0080';
        this.ctx.shadowBlur = 15;
        
        // Bird body
        this.ctx.fillStyle = '#ff0080';
        this.ctx.fillRect(-this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);
        
        // Bird eye
        this.ctx.fillStyle = '#39ff14';
        this.ctx.fillRect(-this.bird.width / 4, -this.bird.height / 3, 8, 8);
        
        this.ctx.restore();
    }
    
    renderPipes() {
        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillStyle = '#bf00ff';
            this.ctx.shadowColor = '#bf00ff';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
            
            // Pipe highlights
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(pipe.x + 5, 0, 3, pipe.topHeight);
            this.ctx.fillRect(pipe.x + 5, pipe.bottomY, 3, this.canvas.height - pipe.bottomY);
            this.ctx.globalAlpha = 1;
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= 0.02;
            particle.size *= 0.98;
            
            if (particle.life <= 0 || particle.size <= 0.5) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 5;
            
            this.ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        });
        
        // Reset
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    createJumpParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 4 + 2,
                color: '#00f5ff',
                life: 1
            });
        }
    }
    
    createScoreParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 6 + 3,
                color: '#39ff14',
                life: 1
            });
        }
    }
    
    createExplosionParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 8 + 4,
                color: Math.random() < 0.5 ? '#ff0080' : '#ffff00',
                life: 1
            });
        }
    }
    
    createBackgroundParticles() {
        const particlesContainer = document.getElementById('particleContainer');
        
        setInterval(() => {
            if (this.gameState === 'PLAYING' && Math.random() < 0.3) {
                const particle = document.createElement('div');
                particle.className = 'absolute w-1 h-1 bg-neon-blue opacity-50 animate-pulse pointer-events-none';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.top = Math.random() * window.innerHeight + 'px';
                
                particlesContainer.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 1000);
            }
        }, 100);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new NeonFlappyBird();
});
