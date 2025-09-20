class NeonSolitaire {
    constructor() {
        this.deck = [];
        this.stock = [];
        this.waste = [];
        this.foundations = {
            hearts: [],
            diamonds: [],
            clubs: [],
            spades: []
        };
        this.tableau = [[], [], [], [], [], [], []];
        
        this.moveCount = 0;
        this.gameScore = 0;
        this.startTime = null;
        this.gameTimer = null;
        this.gameEnded = false;
        
        this.selectedCard = null;
        this.selectedSource = null;
        this.moveHistory = [];
        
        // Drag and drop properties
        this.draggedCard = null;
        this.draggedSource = null;
        
        // Hint system properties
        this.currentHints = [];
        this.lastHintTime = 0;
        this.hintCooldown = 1500; // 1.5 second cooldown
        this.hintCount = 0;
        this.recentHints = []; // Track recent hints to avoid repetition
        this.gameStateHash = null; // Track game state changes
        
        this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.suitSymbols = {
            hearts: '♥️',
            diamonds: '♦️',
            clubs: '♣️',
            spades: '♠️'
        };
        
        this.init();
    }
    
    init() {
        console.log('Initializing Neon Solitaire...');
        this.createDeck();
        console.log('Deck created:', this.deck.length, 'cards');
        this.shuffleDeck();
        this.playShuffleAnimation(() => {
            console.log('Cards dealt. Tableau:', this.tableau.map(col => col.length));
            console.log('Stock:', this.stock.length, 'Waste:', this.waste.length);
            this.setupEventListeners();
            this.startTimer();
        });
    }
    
    createDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                this.deck.push({
                    suit,
                    rank,
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                    faceUp: false,
                    id: `${suit}-${rank}`
                });
            }
        }
    }
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    dealCards() {
        // Deal cards to tableau
        let cardIndex = 0;
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const card = this.deck[cardIndex++];
                if (row === col) {
                    card.faceUp = true;
                }
                this.tableau[col].push(card);
            }
        }
        
        // Remaining cards go to stock
        this.stock = this.deck.slice(cardIndex);
        this.waste = [];
    }
    
    renderGame() {
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.renderTableau();
        this.updateUI();
    }
    
    renderStock() {
        const stockElement = document.getElementById('stockPile');
        stockElement.innerHTML = '';
        
        if (this.stock.length > 0) {
            const cardElement = this.createCardElement(this.stock[this.stock.length - 1], false);
            stockElement.appendChild(cardElement);
            stockElement.classList.remove('empty');
        } else {
            stockElement.innerHTML = '<div class="card-placeholder"><span class="text-4xl">🔄</span></div>';
            stockElement.classList.add('empty');
        }
    }
    
    renderWaste() {
        const wasteElement = document.getElementById('wastePile');
        wasteElement.innerHTML = '';
        
        if (this.waste.length > 0) {
            // Show top 3 cards in waste pile
            const cardsToShow = Math.min(3, this.waste.length);
            for (let i = 0; i < cardsToShow; i++) {
                const cardIndex = this.waste.length - cardsToShow + i;
                const card = this.waste[cardIndex];
                const cardElement = this.createCardElement(card, true);
                
                cardElement.style.position = 'absolute';
                cardElement.style.left = `${i * 2}px`;
                cardElement.style.top = `${i * 2}px`;
                cardElement.style.zIndex = i + 1;
                
                if (i === cardsToShow - 1) {
                    cardElement.addEventListener('click', () => this.selectCard(card, 'waste'));
                }
                
                wasteElement.appendChild(cardElement);
            }
        } else {
            wasteElement.innerHTML = '<div class="card-placeholder"><span class="text-2xl opacity-50">♠️</span></div>';
        }
    }
    
    renderFoundations() {
        for (let suit of this.suits) {
            const foundationElement = document.getElementById(`foundation-${suit}`);
            foundationElement.innerHTML = '';
            
            if (this.foundations[suit].length > 0) {
                const topCard = this.foundations[suit][this.foundations[suit].length - 1];
                const cardElement = this.createCardElement(topCard, true);
                cardElement.addEventListener('click', () => this.selectCard(topCard, `foundation-${suit}`));
                foundationElement.appendChild(cardElement);
            } else {
                foundationElement.innerHTML = `<div class="card-placeholder"><span class="text-2xl ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black'}">${this.suitSymbols[suit]}</span></div>`;
            }
            
            // Add drop target listeners
            this.addDropListeners(foundationElement, 'foundation', suit);
            foundationElement.addEventListener('click', () => this.tryMoveToFoundation(suit));
        }
    }
    
    renderTableau() {
        for (let col = 0; col < 7; col++) {
            const columnElement = document.getElementById(`tableau-${col}`);
            columnElement.innerHTML = '';
            
            if (this.tableau[col].length === 0) {
                // Empty column can accept Kings
                this.addDropListeners(columnElement, 'tableau', col);
                columnElement.addEventListener('click', () => this.tryMoveToTableau(col));
            } else {
                this.tableau[col].forEach((card, index) => {
                    const cardElement = this.createCardElement(card, card.faceUp);
                    cardElement.style.setProperty('--card-index', index);
                    
                    if (card.faceUp) {
                        cardElement.addEventListener('click', () => this.selectCard(card, `tableau-${col}`, index));
                    } else {
                        cardElement.addEventListener('click', () => this.flipCard(col, index));
                    }
                    
                    columnElement.appendChild(cardElement);
                });
                
                // Add drop listeners to the column
                this.addDropListeners(columnElement, 'tableau', col);
                
                // Add click listener for moving cards to this column
                columnElement.addEventListener('click', (e) => {
                    if (e.target === columnElement) {
                        this.tryMoveToTableau(col);
                    }
                });
            }
        }
    }
    
    createCardElement(card, faceUp) {
        console.log('Creating card element:', card.rank, card.suit, faceUp ? 'face-up' : 'face-down');
        const cardElement = document.createElement('div');
        cardElement.className = `card ${faceUp ? 'face-up' : 'face-down'} ${card.color}`;
        
        if (faceUp) {
            cardElement.setAttribute('data-rank', card.rank);
            cardElement.setAttribute('data-suit', this.suitSymbols[card.suit]);
            cardElement.innerHTML = `<div class="card-center">${card.rank}</div>`;
            
            // Make face-up cards draggable
            cardElement.draggable = true;
            this.addDragListeners(cardElement, card);
        }
        
        cardElement.setAttribute('data-card-id', card.id);
        console.log('Card element created:', cardElement.className);
        return cardElement;
    }
    
    addDragListeners(cardElement, card) {
        cardElement.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, card);
        });
        
        cardElement.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });
    }
    
    handleDragStart(e, card) {
        this.draggedCard = card;
        this.draggedSource = this.findCardSource(card);
        
        // Add dragging class for visual feedback
        e.target.classList.add('dragging');
        
        // Store drag data
        e.dataTransfer.setData('text/plain', card.id);
        e.dataTransfer.effectAllowed = 'move';
        
        console.log('Drag started:', card.rank, card.suit, 'from', this.draggedSource);
    }
    
    handleDragEnd(e) {
        // Remove dragging class
        e.target.classList.remove('dragging');
        
        // Clear drag highlights
        this.clearDropTargets();
        
        this.draggedCard = null;
        this.draggedSource = null;
    }
    
    findCardSource(card) {
        // Check waste pile
        if (this.waste.includes(card)) {
            return 'waste';
        }
        
        // Check foundations
        for (let suit of this.suits) {
            if (this.foundations[suit].includes(card)) {
                return `foundation-${suit}`;
            }
        }
        
        // Check tableau
        for (let col = 0; col < 7; col++) {
            if (this.tableau[col].includes(card)) {
                return `tableau-${col}`;
            }
        }
        
        return null;
    }
    
    clearDropTargets() {
        document.querySelectorAll('.drop-target, .invalid-drop').forEach(element => {
            element.classList.remove('drop-target', 'invalid-drop');
        });
    }
    
    addDropListeners(element, targetType, targetId) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            if (this.draggedCard && this.canDropCard(targetType, targetId)) {
                element.classList.add('drop-target');
                e.dataTransfer.dropEffect = 'move';
            } else {
                element.classList.add('invalid-drop');
                e.dataTransfer.dropEffect = 'none';
            }
        });
        
        element.addEventListener('dragleave', (e) => {
            element.classList.remove('drop-target', 'invalid-drop');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e, targetType, targetId);
        });
    }
    
    canDropCard(targetType, targetId) {
        if (!this.draggedCard) return false;
        
        if (targetType === 'foundation') {
            return this.canMoveToFoundation(this.draggedCard, targetId);
        } else if (targetType === 'tableau') {
            return this.canMoveToTableau(this.draggedCard, targetId);
        }
        
        return false;
    }
    
    handleDrop(e, targetType, targetId) {
        this.clearDropTargets();
        
        if (!this.draggedCard || !this.canDropCard(targetType, targetId)) {
            return;
        }
        
        // Select the dragged card first
        this.selectCard(this.draggedCard, this.draggedSource);
        
        // Then move it
        if (targetType === 'foundation') {
            this.moveToFoundation(targetId);
        } else if (targetType === 'tableau') {
            this.moveToTableau(targetId);
        }
        
        this.createParticleEffect('move');
    }
    
    selectCard(card, source, index = -1) {
        // Clear previous selection
        this.clearSelection();
        
        this.selectedCard = card;
        this.selectedSource = source;
        this.selectedIndex = index;
        
        // Highlight selected card
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement) {
            cardElement.classList.add('selected');
        }
        
        // If selecting from tableau, also select all cards below it
        if (source.startsWith('tableau-')) {
            const colIndex = parseInt(source.split('-')[1]);
            const cardIndex = index >= 0 ? index : this.tableau[colIndex].indexOf(card);
            
            for (let i = cardIndex + 1; i < this.tableau[colIndex].length; i++) {
                const belowCard = this.tableau[colIndex][i];
                const belowElement = document.querySelector(`[data-card-id="${belowCard.id}"]`);
                if (belowElement) {
                    belowElement.classList.add('selected');
                }
            }
        }
    }
    
    clearSelection() {
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedCard = null;
        this.selectedSource = null;
        this.selectedIndex = -1;
    }
    
    flipCard(col, index) {
        const card = this.tableau[col][index];
        if (!card.faceUp && index === this.tableau[col].length - 1) {
            card.faceUp = true;
            this.addMove('flip', { col, index });
            this.gameScore += 5;
            this.renderTableau();
            this.createParticleEffect('move');
        }
    }
    
    tryMoveToFoundation(targetSuit) {
        if (!this.selectedCard) return;
        
        if (this.canMoveToFoundation(this.selectedCard, targetSuit)) {
            this.moveToFoundation(targetSuit);
        } else {
            this.showInvalidMove();
        }
    }
    
    canMoveToFoundation(card, targetSuit) {
        if (card.suit !== targetSuit) return false;
        
        const foundation = this.foundations[targetSuit];
        if (foundation.length === 0) {
            return card.rank === 'A';
        } else {
            const topCard = foundation[foundation.length - 1];
            const cardValue = this.getCardValue(card.rank);
            const topValue = this.getCardValue(topCard.rank);
            return cardValue === topValue + 1;
        }
    }
    
    moveToFoundation(targetSuit) {
        const card = this.selectedCard;
        const source = this.selectedSource;
        
        // Remove card from source
        this.removeCardFromSource(card, source);
        
        // Add to foundation
        this.foundations[targetSuit].push(card);
        
        this.addMove('foundation', { 
            card: {...card}, 
            source, 
            target: targetSuit,
            sourceIndex: this.selectedIndex 
        });
        
        this.gameScore += 10;
        this.clearSelection();
        this.renderGame();
        this.createParticleEffect('move');
        
        if (this.checkWin()) {
            this.endGame(true);
        }
    }
    
    tryMoveToTableau(targetCol) {
        if (!this.selectedCard) return;
        
        if (this.canMoveToTableau(this.selectedCard, targetCol)) {
            this.moveToTableau(targetCol);
        } else {
            this.showInvalidMove();
        }
    }
    
    canMoveToTableau(card, targetCol) {
        const targetColumn = this.tableau[targetCol];
        
        if (targetColumn.length === 0) {
            return card.rank === 'K';
        } else {
            const topCard = targetColumn[targetColumn.length - 1];
            if (!topCard.faceUp) return false;
            
            const cardValue = this.getCardValue(card.rank);
            const topValue = this.getCardValue(topCard.rank);
            
            return cardValue === topValue - 1 && card.color !== topCard.color;
        }
    }
    
    moveToTableau(targetCol) {
        const source = this.selectedSource;
        const sourceIndex = this.selectedIndex;
        
        // Get all cards to move (selected card and any below it)
        let cardsToMove = [this.selectedCard];
        
        if (source.startsWith('tableau-')) {
            const sourceCol = parseInt(source.split('-')[1]);
            const cardIndex = sourceIndex >= 0 ? sourceIndex : this.tableau[sourceCol].indexOf(this.selectedCard);
            cardsToMove = this.tableau[sourceCol].slice(cardIndex);
        }
        
        // Remove cards from source
        for (let card of cardsToMove) {
            this.removeCardFromSource(card, source);
        }
        
        // Add cards to target column
        this.tableau[targetCol].push(...cardsToMove);
        
        this.addMove('tableau', { 
            cards: cardsToMove.map(c => ({...c})), 
            source, 
            target: targetCol,
            sourceIndex 
        });
        
        this.gameScore += 5;
        this.clearSelection();
        this.renderGame();
        this.createParticleEffect('move');
    }
    
    removeCardFromSource(card, source) {
        if (source === 'waste') {
            const index = this.waste.indexOf(card);
            this.waste.splice(index, 1);
        } else if (source.startsWith('foundation-')) {
            const suit = source.split('-')[1];
            const index = this.foundations[suit].indexOf(card);
            this.foundations[suit].splice(index, 1);
        } else if (source.startsWith('tableau-')) {
            const col = parseInt(source.split('-')[1]);
            const index = this.tableau[col].indexOf(card);
            this.tableau[col].splice(index, 1);
        }
    }
    
    getCardValue(rank) {
        if (rank === 'A') return 1;
        if (rank === 'J') return 11;
        if (rank === 'Q') return 12;
        if (rank === 'K') return 13;
        return parseInt(rank);
    }
    
    dealFromStock() {
        if (this.stock.length === 0) {
            // Recycle waste pile back to stock
            this.stock = [...this.waste].reverse();
            this.stock.forEach(card => card.faceUp = false);
            this.waste = [];
        } else {
            // Deal 3 cards from stock to waste
            const cardsToDeal = Math.min(3, this.stock.length);
            for (let i = 0; i < cardsToDeal; i++) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
            }
        }
        
        this.renderStock();
        this.renderWaste();
        this.createParticleEffect('move');
    }
    
    checkWin() {
        for (let suit of this.suits) {
            if (this.foundations[suit].length !== 13) {
                return false;
            }
        }
        return true;
    }
    
    endGame(won) {
        this.gameEnded = true;
        this.stopTimer();
        
        if (won) {
            this.gameScore += 100; // Bonus for winning
            document.getElementById('finalScore').textContent = this.gameScore;
            document.getElementById('finalMoves').textContent = this.moveCount;
            document.getElementById('finalTime').textContent = this.getFormattedTime();
            
            // Play celebration animation first, then show win screen
            this.playCelebrationAnimation();
            
            setTimeout(() => {
                const winScreen = document.getElementById('winScreen');
                winScreen.classList.remove('hidden');
                // Add fade-in effect
                winScreen.style.opacity = '0';
                winScreen.style.transition = 'opacity 0.8s ease-in-out';
                
                // Trigger fade-in
                requestAnimationFrame(() => {
                    winScreen.style.opacity = '1';
                });
                
                this.createWinEffect();
            }, 5000); // Start fade-in 0.5 seconds after victory disappears (4.5 + 0.5)
        }
    }
    
    autoCompleteGame() {
        // Cheat code to instantly win the game for testing
        console.log('🎮 Auto-completing game...');
        
        // Show cheat indicator
        const cheatIndicator = document.createElement('div');
        cheatIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(191, 0, 255, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 0 20px rgba(191, 0, 255, 0.5);
            animation: fadeInOut 2s ease-in-out;
        `;
        cheatIndicator.textContent = '🎮 CHEAT ACTIVATED';
        document.body.appendChild(cheatIndicator);
        
        setTimeout(() => cheatIndicator.remove(), 2000);
        
        // Fill all foundations with complete sequences
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        suits.forEach(suit => {
            this.foundations[suit] = ranks.map(rank => ({
                suit: suit,
                rank: rank,
                color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                faceUp: true,
                id: `${suit}-${rank}`
            }));
        });
        
        // Clear other areas
        this.tableau = [[], [], [], [], [], [], []];
        this.stock = [];
        this.waste = [];
        
        // Trigger win condition
        this.renderGame();
        this.endGame(true);
    }
    
    addMove(type, data) {
        this.moveHistory.push({ type, data, timestamp: Date.now() });
        this.moveCount++;
        
        // Clear recent hints since the game state has changed
        this.recentHints = [];
        this.gameStateHash = null;
        
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('moveCount').textContent = this.moveCount;
        document.getElementById('gameScore').textContent = this.gameScore;
        document.getElementById('hintCount').textContent = this.hintCount;
        
        if (this.startTime) {
            document.getElementById('gameTime').textContent = this.getFormattedTime();
        }
    }
    
    getFormattedTime() {
        if (!this.startTime) return '00:00';
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.gameTimer = setInterval(() => {
            if (!this.gameEnded) {
                this.updateUI();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    setupEventListeners() {
        document.getElementById('stockPile').addEventListener('click', () => this.dealFromStock());
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Cheat code: Ctrl+Cmd+C to auto-complete game
            if (e.ctrlKey && e.metaKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                this.autoCompleteGame();
            }
        });
    }
    
    showInvalidMove() {
        // Visual feedback for invalid move
        if (this.selectedCard) {
            const cardElement = document.querySelector(`[data-card-id="${this.selectedCard.id}"]`);
            if (cardElement) {
                cardElement.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    cardElement.style.animation = '';
                }, 500);
            }
        }
    }
    
    createParticleEffect(type) {
        const container = document.getElementById('particleContainer');
        const colors = {
            move: ['#00f5ff', '#bf00ff'],
            win: ['#39ff14', '#00f5ff', '#bf00ff', '#ff0080']
        };
        
        const particleColors = colors[type] || colors.move;
        const particleCount = type === 'win' ? 30 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${type}-particle`;
            
            const color = particleColors[Math.floor(Math.random() * particleColors.length)];
            particle.style.background = `radial-gradient(circle, ${color}80 0%, ${color}20 100%)`;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = Math.random() * window.innerHeight + 'px';
            particle.style.width = (Math.random() * 8 + 4) + 'px';
            particle.style.height = particle.style.width;
            
            container.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1500);
        }
    }
    
    createWinEffect() {
        this.createParticleEffect('win');
        
        // Additional celebration effects
        setTimeout(() => this.createParticleEffect('win'), 500);
        setTimeout(() => this.createParticleEffect('win'), 1000);
    }
    
    getGameStateHash() {
        // Create a simple hash of the current game state
        const state = {
            stock: this.stock.length,
            waste: this.waste.length > 0 ? this.waste[this.waste.length - 1].id : 'empty',
            foundations: Object.keys(this.foundations).map(suit => this.foundations[suit].length).join(','),
            tableau: this.tableau.map(col => {
                if (col.length === 0) return 'empty';
                const topCard = col[col.length - 1];
                return `${topCard.id}-${topCard.faceUp}`;
            }).join(',')
        };
        return JSON.stringify(state);
    }

    showHint() {
        // Check cooldown
        const now = Date.now();
        const hintButton = document.getElementById('hintBtn');
        
        if (now - this.lastHintTime < this.hintCooldown) {
            this.showHintMessage({ type: 'warning', message: 'Please wait a moment before requesting another hint!' });
            return;
        }
        
        // Check if game state has changed meaningfully since last hint
        const currentStateHash = this.getGameStateHash();
        if (this.gameStateHash === currentStateHash && this.recentHints.length > 0) {
            // Game state hasn't changed, check if we have alternative hints
            const hint = this.findBestHint(this.recentHints);
            if (!hint) {
                this.showHintMessage({ type: 'info', message: 'Try making a move first, then ask for another hint!' });
                return;
            }
        } else {
            // Game state has changed, clear recent hints
            this.recentHints = [];
            this.gameStateHash = currentStateHash;
        }
        
        const hint = this.findBestHint(this.recentHints);
        
        if (hint) {
            // Increment hint counter and update last hint time
            this.hintCount++;
            this.lastHintTime = now;
            this.updateUI();
            
            // Add this hint to recent hints (keep only last 3)
            this.recentHints.push({
                type: hint.type,
                cardId: hint.card ? hint.card.id : null,
                source: hint.source,
                target: hint.target,
                timestamp: now
            });
            if (this.recentHints.length > 3) {
                this.recentHints.shift();
            }
            
            // Disable hint button temporarily
            if (hintButton) {
                hintButton.disabled = true;
                hintButton.classList.add('opacity-50', 'cursor-not-allowed');
                setTimeout(() => {
                    hintButton.disabled = false;
                    hintButton.classList.remove('opacity-50', 'cursor-not-allowed');
                }, this.hintCooldown);
            }
            
            this.highlightHint(hint);
            this.showHintMessage(hint);
        } else {
            this.showHintMessage({ type: 'no-moves', message: 'No obvious moves available. Try dealing from stock or look for hidden cards to flip.' });
        }
    }
    
    findBestHint(recentHints = []) {
        // Priority order for hints:
        // 1. Foundation moves (highest priority)
        // 2. Face-down card flips
        // 3. Tableau to tableau moves that reveal cards
        // 4. Other tableau moves
        // 5. Waste to tableau/foundation moves
        
        // Check for foundation moves
        let foundationHint = this.findFoundationMoves(recentHints);
        if (foundationHint) return foundationHint;
        
        // Check for card flips
        let flipHint = this.findFlipMoves(recentHints);
        if (flipHint) return flipHint;
        
        // Check for tableau moves (prioritize those that reveal cards)
        let tableauHint = this.findTableauMoves(recentHints);
        if (tableauHint) return tableauHint;
        
        // Check for waste moves
        let wasteHint = this.findWasteMoves(recentHints);
        if (wasteHint) return wasteHint;
        
        // If we have recent hints but no new moves, try to find alternative moves
        if (recentHints.length > 0) {
            // Look for any valid moves that might not be optimal but are different
            let alternativeHint = this.findAlternativeMoves(recentHints);
            if (alternativeHint) return alternativeHint;
        }
        
        return null;
    }
    
    isRecentHint(hint, recentHints) {
        return recentHints.some(recent => {
            return recent.type === hint.type &&
                   recent.cardId === (hint.card ? hint.card.id : null) &&
                   recent.source === hint.source &&
                   recent.target === hint.target;
        });
    }

    findFoundationMoves(recentHints = []) {
        // Check tableau cards for foundation moves
        for (let col = 0; col < 7; col++) {
            const column = this.tableau[col];
            if (column.length > 0) {
                const topCard = column[column.length - 1];
                if (topCard.faceUp) {
                    for (let suit of this.suits) {
                        if (this.canMoveToFoundation(topCard, suit)) {
                            const hint = {
                                type: 'foundation',
                                card: topCard,
                                source: `tableau-${col}`,
                                target: `foundation-${suit}`,
                                message: `Move ${topCard.rank} of ${topCard.suit} to foundation`,
                                priority: 1
                            };
                            
                            // Check if this hint was suggested recently
                            if (!this.isRecentHint(hint, recentHints)) {
                                return hint;
                            }
                        }
                    }
                }
            }
        }
        
        // Check waste card for foundation moves
        if (this.waste.length > 0) {
            const wasteCard = this.waste[this.waste.length - 1];
            for (let suit of this.suits) {
                if (this.canMoveToFoundation(wasteCard, suit)) {
                    const hint = {
                        type: 'foundation',
                        card: wasteCard,
                        source: 'waste',
                        target: `foundation-${suit}`,
                        message: `Move ${wasteCard.rank} of ${wasteCard.suit} from waste to foundation`,
                        priority: 1
                    };
                    
                    // Check if this hint was suggested recently
                    if (!this.isRecentHint(hint, recentHints)) {
                        return hint;
                    }
                }
            }
        }
        
        return null;
    }
    
    findFlipMoves(recentHints = []) {
        for (let col = 0; col < 7; col++) {
            const column = this.tableau[col];
            if (column.length > 0) {
                const topCard = column[column.length - 1];
                if (!topCard.faceUp) {
                    const hint = {
                        type: 'flip',
                        card: topCard,
                        source: `tableau-${col}`,
                        target: `tableau-${col}`,
                        message: `Flip the face-down card in column ${col + 1}`,
                        priority: 2
                    };
                    
                    // Check if this hint was suggested recently
                    if (!this.isRecentHint(hint, recentHints)) {
                        return hint;
                    }
                }
            }
        }
        return null;
    }
    
    findTableauMoves(recentHints = []) {
        // Check for moves between tableau columns
        for (let sourceCol = 0; sourceCol < 7; sourceCol++) {
            const sourceColumn = this.tableau[sourceCol];
            
            // Find moveable sequences in source column
            for (let cardIndex = 0; cardIndex < sourceColumn.length; cardIndex++) {
                const card = sourceColumn[cardIndex];
                
                if (card.faceUp && this.isValidSequenceStart(sourceCol, cardIndex)) {
                    // Try to move this card (and sequence) to other columns
                    for (let targetCol = 0; targetCol < 7; targetCol++) {
                        if (sourceCol !== targetCol && this.canMoveToTableau(card, targetCol)) {
                            // Check if this move would reveal a face-down card
                            const wouldReveal = cardIndex > 0 && !sourceColumn[cardIndex - 1].faceUp;
                            
                            const hint = {
                                type: 'tableau',
                                card: card,
                                source: `tableau-${sourceCol}`,
                                target: `tableau-${targetCol}`,
                                message: `Move ${card.rank} of ${card.suit} to column ${targetCol + 1}${wouldReveal ? ' (reveals hidden card)' : ''}`,
                                priority: wouldReveal ? 2 : 3,
                                cardIndex: cardIndex
                            };
                            
                            // Check if this hint was suggested recently
                            if (!this.isRecentHint(hint, recentHints)) {
                                return hint;
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    findWasteMoves(recentHints = []) {
        if (this.waste.length > 0) {
            const wasteCard = this.waste[this.waste.length - 1];
            
            // Check if waste card can move to tableau
            for (let col = 0; col < 7; col++) {
                if (this.canMoveToTableau(wasteCard, col)) {
                    const hint = {
                        type: 'waste',
                        card: wasteCard,
                        source: 'waste',
                        target: `tableau-${col}`,
                        message: `Move ${wasteCard.rank} of ${wasteCard.suit} from waste to column ${col + 1}`,
                        priority: 3
                    };
                    
                    // Check if this hint was suggested recently
                    if (!this.isRecentHint(hint, recentHints)) {
                        return hint;
                    }
                }
            }
        }
        
        // Suggest dealing from stock if no other moves (and not suggested recently)
        if (this.stock.length > 0) {
            const hint = {
                type: 'stock',
                source: 'stock',
                target: 'waste',
                message: 'Deal cards from the stock pile',
                priority: 4
            };
            
            // Check if stock dealing was suggested recently
            if (!this.isRecentHint(hint, recentHints)) {
                return hint;
            }
        }
        
        return null;
    }
    
    findAlternativeMoves(recentHints = []) {
        // Look for any moves that haven't been suggested recently
        // This helps when the player is stuck with the same suggestion
        
        // Check all possible tableau moves, even less optimal ones
        for (let sourceCol = 0; sourceCol < 7; sourceCol++) {
            const sourceColumn = this.tableau[sourceCol];
            
            for (let cardIndex = 0; cardIndex < sourceColumn.length; cardIndex++) {
                const card = sourceColumn[cardIndex];
                
                if (card.faceUp && this.isValidSequenceStart(sourceCol, cardIndex)) {
                    for (let targetCol = 0; targetCol < 7; targetCol++) {
                        if (sourceCol !== targetCol && this.canMoveToTableau(card, targetCol)) {
                            const hint = {
                                type: 'tableau',
                                card: card,
                                source: `tableau-${sourceCol}`,
                                target: `tableau-${targetCol}`,
                                message: `Try moving ${card.rank} of ${card.suit} to column ${targetCol + 1}`,
                                priority: 5,
                                cardIndex: cardIndex
                            };
                            
                            if (!this.isRecentHint(hint, recentHints)) {
                                return hint;
                            }
                        }
                    }
                }
            }
        }
        
        // If still no alternatives, suggest dealing from stock if available
        if (this.stock.length > 0) {
            const hint = {
                type: 'stock',
                source: 'stock',
                target: 'waste',
                message: 'Try dealing more cards from stock to find new options',
                priority: 6
            };
            
            if (!this.isRecentHint(hint, recentHints)) {
                return hint;
            }
        }
        
        return null;
    }
    
    isValidSequenceStart(col, cardIndex) {
        const column = this.tableau[col];
        const card = column[cardIndex];
        
        if (!card.faceUp) return false;
        
        // Check if this starts a valid alternating color sequence
        for (let i = cardIndex; i < column.length - 1; i++) {
            const current = column[i];
            const next = column[i + 1];
            
            if (!next.faceUp || 
                current.color === next.color ||
                this.getCardValue(current.rank) !== this.getCardValue(next.rank) + 1) {
                return false;
            }
        }
        
        return true;
    }
    
    highlightHint(hint) {
        // Clear previous hints
        this.clearHints();
        
        switch (hint.type) {
            case 'foundation':
            case 'tableau':
            case 'waste':
                this.highlightCard(hint.card, 'source');
                this.highlightTarget(hint.target, 'target');
                break;
            case 'flip':
                this.highlightCard(hint.card, 'flip');
                break;
            case 'stock':
                this.highlightElement(document.getElementById('stockPile'), 'stock');
                break;
        }
        
        // Auto-clear hint after 5 seconds
        setTimeout(() => this.clearHints(), 5000);
    }
    
    highlightCard(card, type) {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement) {
            cardElement.classList.add('hint-highlight', `hint-${type}`);
        }
    }
    
    highlightTarget(targetId, type) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.classList.add('hint-highlight', `hint-${type}`);
        }
    }
    
    highlightElement(element, type) {
        if (element) {
            element.classList.add('hint-highlight', `hint-${type}`);
        }
    }
    
    clearHints() {
        document.querySelectorAll('.hint-highlight').forEach(element => {
            element.classList.remove('hint-highlight', 'hint-source', 'hint-target', 'hint-flip', 'hint-stock');
        });
        
        // Hide hint message
        const hintMessage = document.getElementById('hintMessage');
        if (hintMessage) {
            hintMessage.classList.add('hidden');
        }
    }
    
    showHintMessage(hint) {
        let hintMessage = document.getElementById('hintMessage');
        
        if (!hintMessage) {
            // Create hint message element
            hintMessage = document.createElement('div');
            hintMessage.id = 'hintMessage';
            hintMessage.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-neon-purple/90 to-neon-pink/90 backdrop-blur-lg rounded-lg p-4 border border-neon-blue/50 text-white font-bold text-center shadow-lg shadow-neon-purple/50';
            document.body.appendChild(hintMessage);
        }
        
        hintMessage.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-2xl">💡</span>
                <span>${hint.message}</span>
                <button onclick="game.clearHints()" class="ml-4 text-neon-blue hover:text-white transition-colors">✕</button>
            </div>
        `;
        
        hintMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (hintMessage) {
                hintMessage.classList.add('hidden');
            }
        }, 5000);
    }
    
    playShuffleAnimation(callback) {
        const container = document.createElement('div');
        container.className = 'shuffle-container';
        document.body.appendChild(container);
        
        // Create multiple animated cards
        const cardCount = 28; // Number of cards to animate
        let animationsComplete = 0;
        
        // First, render the game board (but keep cards invisible)
        this.dealCards();
        this.renderGame();
        
        // Hide all actual game cards initially and store their positions
        const cardPositions = [];
        setTimeout(() => {
            document.querySelectorAll('.card').forEach((card, index) => {
                card.style.transition = 'none';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                
                // Store the position for later use
                const rect = card.getBoundingClientRect();
                cardPositions[index] = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    element: card
                };
            });
            
            // Start creating animated cards after we have positions
            createAnimatedCards();
        }, 100);
        
        function createAnimatedCards() {
            for (let i = 0; i < Math.min(cardCount, cardPositions.length); i++) {
                const targetPos = cardPositions[i];
                
                // Skip this card if we don't have a valid position
                if (!targetPos || !targetPos.element) {
                    console.log(`Skipping card ${i} - no valid position`);
                    animationsComplete++;
                    continue;
                }
                
                const card = document.createElement('div');
                card.className = 'card-shuffle shuffle-start';
                
                // Ensure we have valid coordinates before setting them
                if (targetPos.x && targetPos.y && targetPos.x > 0 && targetPos.y > 0) {
                    card.style.setProperty('--target-x', `${targetPos.x - 30}px`);
                    card.style.setProperty('--target-y', `${targetPos.y - 42}px`);
                } else {
                    // Better fallback calculation based on card index
                    const col = i % 7;
                    const row = Math.floor(i / 7);
                    const baseX = window.innerWidth > 768 ? 200 : 150;
                    const baseY = window.innerHeight > 768 ? 250 : 200;
                    const cardSpacing = window.innerWidth > 768 ? 120 : 85;
                    
                    card.style.setProperty('--target-x', `${baseX + col * cardSpacing}px`);
                    card.style.setProperty('--target-y', `${baseY + row * 30}px`);
                    console.log(`Using fallback position for card ${i}: ${baseX + col * cardSpacing}, ${baseY + row * 30}`);
                }
                
                card.style.animationDelay = `${i * 0.08}s`;
                card.style.animationDuration = '2.5s';
                
                container.appendChild(card);
                
                // When animation completes, reveal the actual card
                card.addEventListener('animationend', () => {
                    const targetPos = cardPositions[i];
                    if (targetPos && targetPos.element) {
                        // Start fading out the animated card while fading in the real card
                        card.style.animation = 'none'; // Stop the shuffle animation
                        card.className = 'card-shuffle shuffle-fade-out';
                        
                        // Ensure the animated card is at the exact target position
                        card.style.left = `${targetPos.x - 30}px`;
                        card.style.top = `${targetPos.y - 42}px`;
                        card.style.transform = 'none';
                        
                        // Simultaneously fade in the real card
                        targetPos.element.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        targetPos.element.style.opacity = '1';
                        targetPos.element.style.transform = 'scale(1)';
                        
                        // Remove animated card after fade out
                        setTimeout(() => {
                            if (card.parentNode) {
                                card.remove();
                            }
                        }, 400);
                    } else {
                        if (card.parentNode) {
                            card.remove();
                        }
                    }
                    
                    animationsComplete++;
                    
                    if (animationsComplete >= Math.min(cardCount, cardPositions.length)) {
                        // Clean up container
                        setTimeout(() => {
                            if (container.parentNode) {
                                container.remove();
                            }
                        }, 500);
                        
                        // Reveal any remaining cards
                        setTimeout(() => {
                            document.querySelectorAll('.card').forEach(remainingCard => {
                                if (remainingCard.style.opacity === '0' || !remainingCard.style.opacity) {
                                    remainingCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                                    remainingCard.style.opacity = '1';
                                    remainingCard.style.transform = 'scale(1)';
                                }
                            });
                            callback();
                        }, 600);
                    }
                });
            }
        }
    }
    
    playCelebrationAnimation() {
        // Create main celebration overlay within the game screen
        const gameScreen = document.querySelector('.bg-black\\/40.backdrop-blur-xl') || document.querySelector('.game-board')?.parentElement;
        if (!gameScreen) {
            console.warn('Game screen container not found, falling back to body');
            gameScreen = document.body;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        gameScreen.appendChild(overlay);
        
        // Create spectacular celebration text with multiple layers
        this.createCelebrationText(overlay);
        
        // Create particle explosion from center
        this.createParticleExplosion(overlay);
        
        // Create floating confetti
        this.createConfetti(overlay);
        
        // Create card rain effect
        this.createCardRain(overlay);
        
        // Create rainbow wave effect
        this.createRainbowWave(overlay);
        
        // Create pulsing ring effects
        this.createPulseRings(overlay);
        
        // Clean up after animation - exactly 4.5 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 4500);
    }
    
    createCelebrationText(container) {
        // Main title - smaller and more elegant
        const mainText = document.createElement('div');
        mainText.className = 'celebration-main-text';
        mainText.textContent = 'Victory!';
        container.appendChild(mainText);
        
        // Subtitle with emojis - more subtle
        const subText = document.createElement('div');
        subText.className = 'celebration-sub-text';
        subText.textContent = '🎉 Well Done! 🎉';
        container.appendChild(subText);
        
        // Fewer sparkle elements
        for (let i = 0; i < 6; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'celebration-sparkle';
            sparkle.textContent = '✨';
            sparkle.style.setProperty('--delay', `${i * 0.4}s`);
            sparkle.style.setProperty('--angle', `${i * 60}deg`);
            container.appendChild(sparkle);
        }
    }
    
    createParticleExplosion(container) {
        const colors = ['#00f5ff', '#bf00ff', '#ff0080', '#39ff14'];
        
        // Reduced particles for less intrusion
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'celebration-particle';
            
            const angle = (i / 25) * 360;
            const velocity = 100 + Math.random() * 150;
            const size = 2 + Math.random() * 4;
            
            particle.style.setProperty('--angle', `${angle}deg`);
            particle.style.setProperty('--velocity', `${velocity}px`);
            particle.style.setProperty('--size', `${size}px`);
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDelay = `${Math.random() * 0.3}s`;
            
            container.appendChild(particle);
        }
    }
    
    createConfetti(container) {
        const confettiColors = ['#ff0080', '#00f5ff', '#39ff14', '#ffff00'];
        const confettiShapes = ['▲', '●', '■', '♦', '★'];
        
        // Reduced confetti count
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'celebration-confetti';
            confetti.textContent = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
            
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.fontSize = (8 + Math.random() * 10) + 'px';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (3 + Math.random() * 2) + 's';
            confetti.style.setProperty('--rotation', Math.random() * 360 + 'deg');
            
            container.appendChild(confetti);
        }
    }
    
    createCardRain(container) {
        const cards = ['K♠️', 'Q♥️', 'J♦️', '10♣️', '9♠️', '8♥️', '7♦️', '6♣️', '5♠️', '4♥️', '3♦️', '2♣️', 'A♠️'];
        
        // Fewer cards falling
        for (let i = 0; i < 20; i++) {
            const card = document.createElement('div');
            card.className = 'celebration-card-rain';
            card.textContent = cards[Math.floor(Math.random() * cards.length)];
            
            card.style.left = Math.random() * 100 + '%';
            card.style.animationDelay = Math.random() * 2 + 's';
            card.style.animationDuration = (4 + Math.random() * 2) + 's';
            card.style.setProperty('--swing', (Math.random() - 0.5) * 60 + 'px');
            
            container.appendChild(card);
        }
    }
    
    createRainbowWave(container) {
        const wave = document.createElement('div');
        wave.className = 'celebration-rainbow-wave';
        container.appendChild(wave);
        
        // Only 2 wave layers for subtlety
        for (let i = 0; i < 2; i++) {
            const waveLayer = document.createElement('div');
            waveLayer.className = 'celebration-wave-layer';
            waveLayer.style.setProperty('--layer', i);
            wave.appendChild(waveLayer);
        }
    }
    
    createPulseRings(container) {
        // Fewer rings
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.className = 'celebration-pulse-ring';
            ring.style.animationDelay = `${i * 0.3}s`;
            container.appendChild(ring);
        }
    }
}

// Global game instance
let game;

// Global functions for button clicks
function newGame() {
    if (game) {
        game.stopTimer();
    }
    game = new NeonSolitaire();
}

function undoMove() {
    if (game && game.moveHistory.length > 0) {
        // Implement undo functionality
        console.log('Undo move - to be implemented');
    }
}

function getHint() {
    if (game) {
        game.showHint();
    }
}

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    newGame();
});
