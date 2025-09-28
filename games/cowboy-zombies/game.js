// Pixel Cowboy Zombies Game
class CowboyZombies {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'START'; // START, PLAYING, GAME_OVER, SHOP
        this.score = 0;
        this.coins = 0;
        this.wave = 1;
        this.zombiesKilled = 0;
        this.highScore = parseInt(localStorage.getItem('cowboyZombiesHighScore')) || 0;
        
        // Player properties
        this.player = {
            x: 400,
            y: 300,
            width: 20,
            height: 20,
            speed: 3,
            health: 3,
            maxHealth: 3,
            angle: 0,
            color: '#ffd700'
        };
        
        // Weapon system
        this.weapons = {
            sixShooter: { name: 'Six Shooter', damage: 25, ammo: 12, maxAmmo: 12, reloadTime: 1000, range: 200, cost: 0 },
            doubleBarrel: { name: 'Double Barrel', damage: 45, ammo: 8, maxAmmo: 8, reloadTime: 1500, range: 150, cost: 50 },
            zombieBlaster: { name: 'Zombie Blaster', damage: 60, ammo: 15, maxAmmo: 15, reloadTime: 800, range: 250, cost: 100 },
            neonRifle: { name: 'Neon Rifle', damage: 100, ammo: 20, maxAmmo: 20, reloadTime: 600, range: 300, cost: 200 }
        };
        
        this.currentWeapon = 'sixShooter';
        this.ownedWeapons = ['sixShooter'];
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        // Game arrays
        this.zombies = [];
        this.bullets = [];
        this.coins_dropped = [];
        this.particles = [];
        this.buildings = [];
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // Wave system
        this.zombiesPerWave = 8;
        this.zombiesSpawned = 0;
        this.waveComplete = false;
        this.waveDelay = 3000;
        this.nextWaveTime = 0;
        
        // Initialize
        this.generateTown();
        this.setupEventListeners();
        this.updateDisplay();
        this.gameLoop();
        
        // Global functions
        window.startGame = () => this.startGame();
        window.restartGame = () => this.startGame();
        window.showUpgradeShop = () => this.showUpgradeShop();
        window.closeUpgradeShop = () => this.closeUpgradeShop();
        window.buyWeapon = (weapon, cost) => this.buyWeapon(weapon, cost);
    }
    
    generateTown() {
        // Create buildings for the western town
        this.buildings = [
            { x: 50, y: 50, width: 80, height: 60, color: '#8b4513' },    // Saloon
            { x: 200, y: 100, width: 70, height: 50, color: '#a0522d' },   // General Store
            { x: 350, y: 80, width: 60, height: 70, color: '#8b4513' },    // Sheriff Office
            { x: 500, y: 120, width: 90, height: 55, color: '#a0522d' },   // Bank
            { x: 650, y: 60, width: 75, height: 65, color: '#8b4513' },    // Church
            { x: 100, y: 400, width: 85, height: 60, color: '#a0522d' },   // Hotel
            { x: 300, y: 450, width: 70, height: 50, color: '#8b4513' },   // Blacksmith
            { x: 550, y: 420, width: 80, height: 70, color: '#a0522d' }    // Stable
        ];
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR' && this.gameState === 'PLAYING') {
                this.reload();
            }
            if (e.code === 'KeyE' && this.gameState === 'PLAYING') {
                this.showUpgradeShop();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState === 'PLAYING') {
                this.shoot();
            }
        });
        
        // Mobile controls
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        const controls = {
            moveUpBtn: { action: () => this.keys['KeyW'] = true, release: () => this.keys['KeyW'] = false },
            moveDownBtn: { action: () => this.keys['KeyS'] = true, release: () => this.keys['KeyS'] = false },
            moveLeftBtn: { action: () => this.keys['KeyA'] = true, release: () => this.keys['KeyA'] = false },
            moveRightBtn: { action: () => this.keys['KeyD'] = true, release: () => this.keys['KeyD'] = false },
            shootBtn: { action: () => this.shoot(), release: () => {} },
            reloadBtn: { action: () => this.reload(), release: () => {} },
            shopBtn: { action: () => this.showUpgradeShop(), release: () => {} }
        };
        
        Object.entries(controls).forEach(([id, { action, release }]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    action();
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    release();
                });
                btn.addEventListener('mousedown', action);
                btn.addEventListener('mouseup', release);
            }
        });
    }
    
    startGame() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.coins = 0;
        this.wave = 1;
        this.zombiesKilled = 0;
        this.player.health = this.player.maxHealth;
        this.player.x = 400;
        this.player.y = 300;
        
        // Reset weapon to default
        this.currentWeapon = 'sixShooter';
        this.ownedWeapons = ['sixShooter'];
        this.weapons[this.currentWeapon].ammo = this.weapons[this.currentWeapon].maxAmmo;
        
        // Clear arrays
        this.zombies = [];
        this.bullets = [];
        this.coins_dropped = [];
        this.particles = [];
        
        // Start first wave
        this.zombiesPerWave = 8;
        this.zombiesSpawned = 0;
        this.waveComplete = false;
        this.nextWaveTime = Date.now() + 2000;
        
        // Hide screens
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('upgradeShop').classList.add('hidden');
        
        this.updateDisplay();
    }
    
    spawnZombie() {
        if (this.zombiesSpawned >= this.zombiesPerWave) return;
        
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -20;
                break;
            case 1: // Right
                x = this.canvas.width + 20;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 20;
                break;
            case 3: // Left
                x = -20;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        this.zombies.push({
            x: x,
            y: y,
            width: 16,
            height: 16,
            speed: 0.8 + (this.wave * 0.1),
            health: 50 + (this.wave * 10),
            maxHealth: 50 + (this.wave * 10),
            color: '#228b22',
            lastHit: 0
        });
        
        this.zombiesSpawned++;
    }
    
    shoot() {
        if (this.isReloading) return;
        
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.ammo <= 0) {
            this.reload();
            return;
        }
        
        // Calculate bullet direction
        const dx = this.mouse.x - this.player.x;
        const dy = this.mouse.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > weapon.range) return;
        
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            dx: (dx / distance) * 8,
            dy: (dy / distance) * 8,
            damage: weapon.damage,
            range: weapon.range,
            traveled: 0,
            color: '#ffd700'
        });
        
        weapon.ammo--;
        this.updateDisplay();
        
        // Create muzzle flash particles
        this.createMuzzleFlash();
    }
    
    reload() {
        if (this.isReloading) return;
        
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.ammo >= weapon.maxAmmo) return;
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        
        setTimeout(() => {
            weapon.ammo = weapon.maxAmmo;
            this.isReloading = false;
            this.updateDisplay();
        }, weapon.reloadTime);
    }
    
    buyWeapon(weaponKey, cost) {
        if (this.coins < cost) return;
        if (this.ownedWeapons.includes(weaponKey)) return;
        
        this.coins -= cost;
        this.ownedWeapons.push(weaponKey);
        this.currentWeapon = weaponKey;
        this.weapons[weaponKey].ammo = this.weapons[weaponKey].maxAmmo;
        
        // Update button state
        const btn = document.getElementById(`buy${weaponKey.charAt(0).toUpperCase() + weaponKey.slice(1)}`);
        if (btn) {
            btn.textContent = 'Owned';
            btn.disabled = true;
            btn.classList.add('opacity-50');
        }
        
        this.updateDisplay();
    }
    
    showUpgradeShop() {
        this.gameState = 'SHOP';
        document.getElementById('upgradeShop').classList.remove('hidden');
        document.getElementById('shopCoins').textContent = this.coins;
        
        // Update button states
        Object.entries(this.weapons).forEach(([key, weapon]) => {
            const btn = document.getElementById(`buy${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (btn) {
                if (this.ownedWeapons.includes(key)) {
                    btn.textContent = 'Owned';
                    btn.disabled = true;
                    btn.classList.add('opacity-50');
                } else if (this.coins < weapon.cost) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50');
                } else {
                    btn.disabled = false;
                    btn.classList.remove('opacity-50');
                }
            }
        });
    }
    
    closeUpgradeShop() {
        this.gameState = 'PLAYING';
        document.getElementById('upgradeShop').classList.add('hidden');
    }
    
    update() {
        if (this.gameState !== 'PLAYING') return;
        
        // Player movement
        this.updatePlayer();
        
        // Update bullets
        this.updateBullets();
        
        // Update zombies
        this.updateZombies();
        
        // Update coins
        this.updateCoins();
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
        
        // Wave management
        this.manageWaves();
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    updatePlayer() {
        // Movement
        let newX = this.player.x;
        let newY = this.player.y;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) newY -= this.player.speed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) newY += this.player.speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) newX -= this.player.speed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) newX += this.player.speed;
        
        // Check building collisions
        let canMove = true;
        for (const building of this.buildings) {
            if (newX < building.x + building.width &&
                newX + this.player.width > building.x &&
                newY < building.y + building.height &&
                newY + this.player.height > building.y) {
                canMove = false;
                break;
            }
        }
        
        // Boundary check
        if (newX < 0 || newX + this.player.width > this.canvas.width ||
            newY < 0 || newY + this.player.height > this.canvas.height) {
            canMove = false;
        }
        
        if (canMove) {
            this.player.x = newX;
            this.player.y = newY;
        }
        
        // Calculate player rotation to face mouse
        const dx = this.mouse.x - this.player.x;
        const dy = this.mouse.y - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            bullet.traveled += Math.sqrt(bullet.dx * bullet.dx + bullet.dy * bullet.dy);
            
            // Remove bullets that are out of range or off screen
            if (bullet.traveled > bullet.range ||
                bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check building collisions
            for (const building of this.buildings) {
                if (bullet.x >= building.x && bullet.x <= building.x + building.width &&
                    bullet.y >= building.y && bullet.y <= building.y + building.height) {
                    this.bullets.splice(i, 1);
                    this.createImpactParticles(bullet.x, bullet.y, '#8b4513');
                    break;
                }
            }
        }
    }
    
    updateZombies() {
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            
            // Move zombie towards player
            const dx = this.player.x - zombie.x;
            const dy = this.player.y - zombie.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                zombie.x += (dx / distance) * zombie.speed;
                zombie.y += (dy / distance) * zombie.speed;
            }
            
            // Check if zombie is dead
            if (zombie.health <= 0) {
                this.zombiesKilled++;
                this.score += 10 + (this.wave * 5);
                
                // Drop coin
                this.coins_dropped.push({
                    x: zombie.x,
                    y: zombie.y,
                    value: 1 + Math.floor(this.wave / 3),
                    collected: false,
                    bounceHeight: 0,
                    bounceDirection: 1
                });
                
                // Create death particles
                this.createDeathParticles(zombie.x, zombie.y);
                
                this.zombies.splice(i, 1);
            }
        }
    }
    
    updateCoins() {
        for (let i = this.coins_dropped.length - 1; i >= 0; i--) {
            const coin = this.coins_dropped[i];
            
            // Coin bounce animation
            coin.bounceHeight += coin.bounceDirection * 0.3;
            if (coin.bounceHeight > 5 || coin.bounceHeight < 0) {
                coin.bounceDirection *= -1;
            }
            
            // Check collection
            const dx = this.player.x - coin.x;
            const dy = this.player.y - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 25) {
                this.coins += coin.value;
                this.coins_dropped.splice(i, 1);
                this.createCoinParticles(coin.x, coin.y);
            }
        }
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
    
    checkCollisions() {
        // Bullet-zombie collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                const zombie = this.zombies[j];
                
                if (bullet.x >= zombie.x && bullet.x <= zombie.x + zombie.width &&
                    bullet.y >= zombie.y && bullet.y <= zombie.y + zombie.height) {
                    
                    // Damage zombie
                    zombie.health -= bullet.damage;
                    zombie.lastHit = Date.now();
                    
                    // Create hit particles
                    this.createHitParticles(bullet.x, bullet.y);
                    
                    // Remove bullet
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // Player-zombie collisions
        for (const zombie of this.zombies) {
            if (this.player.x < zombie.x + zombie.width &&
                this.player.x + this.player.width > zombie.x &&
                this.player.y < zombie.y + zombie.height &&
                this.player.y + this.player.height > zombie.y) {
                
                // Player takes damage (with invincibility frames)
                if (Date.now() - (this.player.lastHit || 0) > 1000) {
                    this.player.health--;
                    this.player.lastHit = Date.now();
                    this.createDamageParticles();
                    this.updateDisplay();
                }
            }
        }
    }
    
    manageWaves() {
        // Spawn zombies
        if (this.zombiesSpawned < this.zombiesPerWave && Math.random() < 0.02) {
            this.spawnZombie();
        }
        
        // Check if wave is complete
        if (this.zombiesSpawned >= this.zombiesPerWave && this.zombies.length === 0) {
            if (!this.waveComplete) {
                this.waveComplete = true;
                this.nextWaveTime = Date.now() + this.waveDelay;
                
                // Wave completion bonus
                this.coins += this.wave * 2;
                this.score += this.wave * 50;
            }
            
            // Start next wave
            if (Date.now() >= this.nextWaveTime) {
                this.wave++;
                this.zombiesPerWave += 2;
                this.zombiesSpawned = 0;
                this.waveComplete = false;
                this.updateDisplay();
            }
        }
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER';
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('cowboyZombiesHighScore', this.highScore);
            document.getElementById('newHighScore').classList.remove('hidden');
        } else {
            document.getElementById('newHighScore').classList.add('hidden');
        }
        
        // Show game over screen
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('zombiesKilled').textContent = this.zombiesKilled;
        document.getElementById('wavesSurvived').textContent = this.wave - 1;
        
        // Create explosion particles
        this.createExplosionParticles();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2d1810';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render town background pattern
        this.renderTownBackground();
        
        // Render buildings
        this.renderBuildings();
        
        // Render coins
        this.renderCoins();
        
        // Render player
        this.renderPlayer();
        
        // Render zombies
        this.renderZombies();
        
        // Render bullets
        this.renderBullets();
        
        // Render particles
        this.renderParticles();
        
        // Render UI elements
        this.renderUI();
    }
    
    renderTownBackground() {
        // Draw dusty ground pattern
        this.ctx.fillStyle = '#8b7355';
        for (let x = 0; x < this.canvas.width; x += 40) {
            for (let y = 0; y < this.canvas.height; y += 40) {
                if ((x + y) % 80 === 0) {
                    this.ctx.fillRect(x, y, 2, 2);
                }
            }
        }
    }
    
    renderBuildings() {
        this.buildings.forEach(building => {
            // Building shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(building.x + 3, building.y + 3, building.width, building.height);
            
            // Building main body
            this.ctx.fillStyle = building.color;
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Building highlights
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(building.x, building.y, building.width, 2);
            this.ctx.fillRect(building.x, building.y, 2, building.height);
            
            // Building outline
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(building.x, building.y, building.width, building.height);
        });
    }
    
    renderPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        
        // Player damage flash
        if (Date.now() - (this.player.lastHit || 0) < 200) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-this.player.width / 2 + 2, -this.player.height / 2 + 2, this.player.width, this.player.height);
        
        // Player body
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);
        
        // Player hat
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(-this.player.width / 2 - 2, -this.player.height / 2 - 4, this.player.width + 4, 4);
        
        // Weapon indicator
        this.ctx.rotate(this.player.angle);
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(0, -2, 15, 4);
        
        this.ctx.restore();
    }
    
    renderZombies() {
        this.zombies.forEach(zombie => {
            // Zombie shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(zombie.x + 2, zombie.y + 2, zombie.width, zombie.height);
            
            // Zombie hit flash
            if (Date.now() - zombie.lastHit < 100) {
                this.ctx.fillStyle = '#ff6666';
            } else {
                this.ctx.fillStyle = zombie.color;
            }
            
            this.ctx.fillRect(zombie.x, zombie.y, zombie.width, zombie.height);
            
            // Zombie eyes
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(zombie.x + 3, zombie.y + 3, 2, 2);
            this.ctx.fillRect(zombie.x + zombie.width - 5, zombie.y + 3, 2, 2);
            
            // Health bar
            if (zombie.health < zombie.maxHealth) {
                const barWidth = 20;
                const barHeight = 4;
                const healthPercent = zombie.health / zombie.maxHealth;
                
                // Health bar background
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(zombie.x - 2, zombie.y - 8, barWidth, barHeight);
                
                // Health bar fill
                this.ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
                this.ctx.fillRect(zombie.x - 2, zombie.y - 8, barWidth * healthPercent, barHeight);
            }
        });
    }
    
    renderBullets() {
        this.bullets.forEach(bullet => {
            // Bullet trail
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.fillRect(bullet.x - bullet.dx, bullet.y - bullet.dy, 2, 2);
            
            // Bullet
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x - 1, bullet.y - 1, 3, 3);
            
            // Bullet glow
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(bullet.x - 1, bullet.y - 1, 3, 3);
            this.ctx.shadowBlur = 0;
        });
    }
    
    renderCoins() {
        this.coins_dropped.forEach(coin => {
            const y = coin.y - coin.bounceHeight;
            
            // Coin shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(coin.x, coin.y + 2, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Coin
            this.ctx.fillStyle = '#ffd700';
            this.ctx.beginPath();
            this.ctx.arc(coin.x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Coin highlight
            this.ctx.fillStyle = '#ffff99';
            this.ctx.beginPath();
            this.ctx.arc(coin.x - 1, y - 1, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Coin glow
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(coin.x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            if (particle.type === 'spark') {
                this.ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    renderUI() {
        // Wave countdown
        if (this.waveComplete && this.zombiesSpawned >= this.zombiesPerWave && this.zombies.length === 0) {
            const timeLeft = Math.max(0, this.nextWaveTime - Date.now());
            if (timeLeft > 0) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.font = 'bold 24px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Next Wave in ${Math.ceil(timeLeft / 1000)}`, this.canvas.width / 2, this.canvas.height / 2);
            }
        }
        
        // Reload indicator
        if (this.isReloading) {
            const progress = (Date.now() - this.reloadStartTime) / this.weapons[this.currentWeapon].reloadTime;
            const barWidth = 100;
            const barHeight = 6;
            const x = (this.canvas.width - barWidth) / 2;
            const y = this.canvas.height - 50;
            
            // Reload bar background
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(x, y, barWidth, barHeight);
            
            // Reload bar fill
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(x, y, barWidth * Math.min(progress, 1), barHeight);
            
            // Reload text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('RELOADING...', this.canvas.width / 2, y - 5);
        }
    }
    
    createMuzzleFlash() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.player.x + Math.cos(this.player.angle) * 15,
                y: this.player.y + Math.sin(this.player.angle) * 15,
                vx: (Math.random() - 0.5) * 4 + Math.cos(this.player.angle) * 3,
                vy: (Math.random() - 0.5) * 4 + Math.sin(this.player.angle) * 3,
                size: Math.random() * 4 + 2,
                color: '#ffff00',
                life: 1,
                type: 'spark'
            });
        }
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 3 + 1,
                color: '#ff0000',
                life: 1,
                type: 'blood'
            });
        }
    }
    
    createDeathParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                size: Math.random() * 4 + 2,
                color: Math.random() < 0.5 ? '#228b22' : '#ff0000',
                life: 1,
                type: 'explosion'
            });
        }
    }
    
    createCoinParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                size: Math.random() * 3 + 1,
                color: '#ffd700',
                life: 1,
                type: 'sparkle'
            });
        }
    }
    
    createDamageParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                color: '#dc143c',
                life: 1,
                type: 'damage'
            });
        }
    }
    
    createImpactParticles(x, y, color) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: Math.random() * 2 + 1,
                color: color,
                life: 1,
                type: 'debris'
            });
        }
    }
    
    createExplosionParticles() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: Math.random() * 6 + 3,
                color: Math.random() < 0.5 ? '#ff4500' : '#ffff00',
                life: 1,
                type: 'explosion'
            });
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('ammo').textContent = this.weapons[this.currentWeapon].ammo;
        document.getElementById('weaponName').textContent = this.weapons[this.currentWeapon].name;
        document.getElementById('weaponDamage').textContent = this.weapons[this.currentWeapon].damage;
        
        // Update health display
        for (let i = 1; i <= 3; i++) {
            const heart = document.getElementById(`health${i}`);
            if (heart) {
                heart.className = i <= this.player.health ? 'w-4 h-4 bg-blood-red rounded-full' : 'w-4 h-4 bg-gray-600 rounded-full';
            }
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new CowboyZombies();
});
