// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'playing'; // 'playing', 'gameOver', 'levelComplete'
let score = 0;
let lives = 3;
let level = 1;
let highScore = localStorage.getItem('pacmanHighScore') || 0;

// Grid settings
const CELL_SIZE = 30;
const ROWS = 20;
const COLS = 20;

// Game objects
let pacman = {
    x: 1,
    y: 1,
    direction: 'right',
    nextDirection: 'right',
    mouthAngle: 0,
    mouthOpening: true,
    moveCounter: 0
};

let ghosts = [
    {
        x: 9,
        y: 9,
        direction: 'up',
        moveCounter: 0,
        color: '#e74c3c', // Vibrant red
        shadowColor: '#c0392b',
        name: 'red'
    },
    {
        x: 10,
        y: 9,
        direction: 'down',
        moveCounter: 0,
        color: '#e67e22', // Vibrant orange
        shadowColor: '#d35400',
        name: 'orange'
    },
    {
        x: 8,
        y: 9,
        direction: 'left',
        moveCounter: 0,
        color: '#2ecc71', // Vibrant green
        shadowColor: '#27ae60',
        name: 'green'
    }
];

// Maze layout (1 = wall, 0 = dot, 2 = empty space, 3 = pacman start, 4 = ghost start)
const mazeLayout = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
    [2,2,2,1,0,1,0,0,0,0,0,0,0,0,1,0,1,2,2,2],
    [1,1,1,1,0,1,0,1,2,2,2,2,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,2,4,4,2,1,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,2,2,2,2,1,0,1,0,1,1,1,1],
    [2,2,2,1,0,1,0,0,0,0,0,0,0,0,1,0,1,2,2,2],
    [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Create a copy of the maze for gameplay
let maze = JSON.parse(JSON.stringify(mazeLayout));
let totalDots = 0;

// Initialize game
function initGame() {
    // Count total dots and reset maze
    totalDots = 0;
    maze = JSON.parse(JSON.stringify(mazeLayout));
    let ghostIndex = 0;
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (maze[row][col] === 0) {
                totalDots++;
            } else if (maze[row][col] === 3) {
                pacman.x = col;
                pacman.y = row;
                maze[row][col] = 2; // Convert to empty space
            } else if (maze[row][col] === 4) {
                if (ghostIndex < ghosts.length) {
                    ghosts[ghostIndex].x = col;
                    ghosts[ghostIndex].y = row;
                    ghostIndex++;
                }
                maze[row][col] = 2; // Convert to empty space
            }
        }
    }
    
    updateDisplay();
}

// Update score display
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('high-score').textContent = highScore;
}

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Set next direction based on key press
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        pacman.nextDirection = 'up';
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        pacman.nextDirection = 'down';
    } else if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        pacman.nextDirection = 'left';
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        pacman.nextDirection = 'right';
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Check if a move is valid
function isValidMove(x, y) {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS && maze[y][x] !== 1;
}

// Move Pacman
function movePacman() {
    if (gameState !== 'playing') return;
    
    // Slow down Pacman movement
    pacman.moveCounter++;
    if (pacman.moveCounter < 6) {
        // Update mouth animation even when not moving (slower speed)
        if (pacman.mouthOpening) {
            pacman.mouthAngle += 0.05; // Reduced from 0.1 to 0.05
            if (pacman.mouthAngle >= 0.8) {
                pacman.mouthOpening = false;
            }
        } else {
            pacman.mouthAngle -= 0.05; // Reduced from 0.1 to 0.05
            if (pacman.mouthAngle <= 0) {
                pacman.mouthOpening = true;
            }
        }
        return;
    }
    pacman.moveCounter = 0;
    
    // Try to change direction if possible
    let nextX = pacman.x;
    let nextY = pacman.y;
    
    switch (pacman.nextDirection) {
        case 'up': nextY--; break;
        case 'down': nextY++; break;
        case 'left': nextX--; break;
        case 'right': nextX++; break;
    }
    
    if (isValidMove(nextX, nextY)) {
        pacman.direction = pacman.nextDirection;
    }
    
    // Move in current direction
    switch (pacman.direction) {
        case 'up': 
            if (isValidMove(pacman.x, pacman.y - 1)) pacman.y--;
            break;
        case 'down':
            if (isValidMove(pacman.x, pacman.y + 1)) pacman.y++;
            break;
        case 'left':
            if (isValidMove(pacman.x - 1, pacman.y)) pacman.x--;
            break;
        case 'right':
            if (isValidMove(pacman.x + 1, pacman.y)) pacman.x++;
            break;
    }
    
    // Wrap around screen
    if (pacman.x < 0) pacman.x = COLS - 1;
    if (pacman.x >= COLS) pacman.x = 0;
    
    // Eat dots
    if (maze[pacman.y][pacman.x] === 0) {
        maze[pacman.y][pacman.x] = 2;
        score += 10;
        totalDots--;
        
        // Removed floating points animation
        
        if (totalDots === 0) {
            gameState = 'levelComplete';
            document.getElementById('levelScore').textContent = score;
            document.getElementById('levelComplete').style.display = 'block';
        }
    }
    
    // Update mouth animation (slower speed)
    if (pacman.mouthOpening) {
        pacman.mouthAngle += 0.08; // Reduced from 0.2 to 0.08
        if (pacman.mouthAngle >= 0.8) {
            pacman.mouthOpening = false;
        }
    } else {
        pacman.mouthAngle -= 0.08; // Reduced from 0.2 to 0.08
        if (pacman.mouthAngle <= 0) {
            pacman.mouthOpening = true;
        }
    }
}

// Move Ghosts with simple AI
function moveGhosts() {
    if (gameState !== 'playing') return;
    
    ghosts.forEach((ghost, index) => {
        ghost.moveCounter++;
        if (ghost.moveCounter < 8 + index) return; // Different speeds for each ghost
        ghost.moveCounter = 0;
        
        // Simple AI: move towards Pacman with some randomness
        const directions = ['up', 'down', 'left', 'right'];
        let possibleMoves = [];
        
        // Check all possible moves
        for (let dir of directions) {
            let newX = ghost.x;
            let newY = ghost.y;
            
            switch (dir) {
                case 'up': newY--; break;
                case 'down': newY++; break;
                case 'left': newX--; break;
                case 'right': newX++; break;
            }
            
            if (isValidMove(newX, newY)) {
                possibleMoves.push({
                    direction: dir,
                    x: newX,
                    y: newY,
                    distance: Math.abs(newX - pacman.x) + Math.abs(newY - pacman.y)
                });
            }
        }
        
        if (possibleMoves.length === 0) return;
        
        // Different behavior for each ghost
        let moveChance = 0.7;
        if (ghost.name === 'pink') moveChance = 0.5; // More random
        if (ghost.name === 'cyan') moveChance = 0.8; // More aggressive
        
        if (Math.random() < moveChance) {
            possibleMoves.sort((a, b) => a.distance - b.distance);
            const bestMove = possibleMoves[0];
            ghost.x = bestMove.x;
            ghost.y = bestMove.y;
            ghost.direction = bestMove.direction;
        } else {
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            ghost.x = randomMove.x;
            ghost.y = randomMove.y;
            ghost.direction = randomMove.direction;
        }
        
        // Wrap around screen
        if (ghost.x < 0) ghost.x = COLS - 1;
        if (ghost.x >= COLS) ghost.x = 0;
    });
}

// Check collision between Pacman and Ghosts
function checkCollision() {
    for (let ghost of ghosts) {
        if (Math.abs(pacman.x - ghost.x) < 0.8 && Math.abs(pacman.y - ghost.y) < 0.8) {
            lives--;
            
            if (lives <= 0) {
                gameState = 'gameOver';
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('pacmanHighScore', highScore);
                }
                document.getElementById('finalScore').textContent = score;
                document.getElementById('gameOver').style.display = 'block';
            } else {
                // Reset positions
                pacman.x = 1;
                pacman.y = 1;
                pacman.moveCounter = 0;
                // Reset all ghosts to their starting positions
                ghosts[0].x = 8; ghosts[0].y = 9;
                ghosts[1].x = 9; ghosts[1].y = 9;
                ghosts[2].x = 10; ghosts[2].y = 9;
                ghosts.forEach(g => g.moveCounter = 0);
            }
            break; // Only process one collision per frame
        }
    }
}

// Drawing functions
function drawMaze() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            
            if (maze[row][col] === 1) {
                // Draw 3D wall with vibrant blue-purple
                // Shadow layer
                ctx.fillStyle = '#6c5ce7';
                ctx.fillRect(x + 3, y + 3, CELL_SIZE, CELL_SIZE);
                
                // Main wall with gradient
                const gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
                gradient.addColorStop(0, '#74b9ff');
                gradient.addColorStop(0.5, '#0984e3');
                gradient.addColorStop(1, '#2d3436');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                
                // Highlight edge
                ctx.strokeStyle = '#81ecec';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                
            } else if (maze[row][col] === 0) {
                // Draw 3D dots with vibrant golden yellow
                const centerX = x + CELL_SIZE/2;
                const centerY = y + CELL_SIZE/2;
                const radius = 4;
                
                // Shadow
                ctx.fillStyle = '#d63031';
                ctx.beginPath();
                ctx.arc(centerX + 2, centerY + 2, radius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Main dot with vibrant gradient
                const dotGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                dotGradient.addColorStop(0, '#ffeaa7');
                dotGradient.addColorStop(0.7, '#fdcb6e');
                dotGradient.addColorStop(1, '#e17055');
                
                ctx.fillStyle = dotGradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Bright highlight
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(centerX - 1, centerY - 1, 1.5, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }
}

function drawPacman() {
    const x = pacman.x * CELL_SIZE + CELL_SIZE/2;
    const y = pacman.y * CELL_SIZE + CELL_SIZE/2;
    const radius = CELL_SIZE/2 - 1; // Decreased size
    
    // Draw shadow
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    
    // Make mouth face the direction of movement
    let startAngle, endAngle;
    switch (pacman.direction) {
        case 'right':
            startAngle = pacman.mouthAngle;
            endAngle = 2 * Math.PI - pacman.mouthAngle;
            break;
        case 'left':
            startAngle = Math.PI - pacman.mouthAngle;
            endAngle = Math.PI + pacman.mouthAngle;
            break;
        case 'up':
            startAngle = 1.5 * Math.PI - pacman.mouthAngle;
            endAngle = 1.5 * Math.PI + pacman.mouthAngle;
            break;
        case 'down':
            startAngle = 0.5 * Math.PI - pacman.mouthAngle;
            endAngle = 0.5 * Math.PI + pacman.mouthAngle;
            break;
    }
    
    ctx.arc(x + 3, y + 3, radius, startAngle, endAngle);
    ctx.lineTo(x + 3, y + 3);
    ctx.fill();
    
    // Draw main Pacman with classic yellow gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#ffff00'); // Bright yellow
    gradient.addColorStop(0.6, '#ffd700'); // Gold
    gradient.addColorStop(1, '#daa520'); // Darker gold
    
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.lineTo(x, y);
    ctx.fill();
    ctx.stroke();
    
    // Add bright highlight - adjust position based on direction
    let highlightX, highlightY;
    switch (pacman.direction) {
        case 'right':
            highlightX = x - radius/3;
            highlightY = y - radius/3;
            break;
        case 'left':
            highlightX = x + radius/3;
            highlightY = y - radius/3;
            break;
        case 'up':
            highlightX = x - radius/3;
            highlightY = y + radius/3;
            break;
        case 'down':
            highlightX = x - radius/3;
            highlightY = y - radius/3;
            break;
    }
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(highlightX, highlightY, radius/3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add inner highlight
    ctx.fillStyle = '#ffff99';
    ctx.beginPath();
    ctx.arc(highlightX + radius/12, highlightY + radius/12, radius/6, 0, 2 * Math.PI);
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach(ghost => {
        const x = ghost.x * CELL_SIZE + CELL_SIZE/2;
        const y = ghost.y * CELL_SIZE + CELL_SIZE/2;
        const radius = CELL_SIZE/2 - 1; // Decreased size to match Pacman
        
        // Draw shadow
        ctx.fillStyle = ghost.shadowColor;
        ctx.beginPath();
        ctx.arc(x + 2, y - radius/2 + 2, radius, Math.PI, 0);
        ctx.lineTo(x + radius + 2, y + radius/2 + 2);
        
        // Shadow bottom wavy part
        const waveHeight = radius/3;
        const waveWidth = radius/2;
        for (let i = 0; i < 3; i++) {
            const waveX = x + radius - (i * waveWidth) + 2;
            ctx.lineTo(waveX - waveWidth/2, y + radius/2 - waveHeight + 2);
            ctx.lineTo(waveX - waveWidth, y + radius/2 + 2);
        }
        ctx.lineTo(x - radius + 2, y - radius/2 + 2);
        ctx.fill();
        
        // Ghost body with gradient
        const gradient = ctx.createRadialGradient(x, y - radius/2, 0, x, y - radius/2, radius);
        gradient.addColorStop(0, ghost.color);
        gradient.addColorStop(0.7, ghost.color);
        gradient.addColorStop(1, ghost.shadowColor);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = ghost.shadowColor;
        ctx.lineWidth = 3; // Increased stroke width for larger ghosts
        
        ctx.beginPath();
        ctx.arc(x, y - radius/2, radius, Math.PI, 0);
        ctx.lineTo(x + radius, y + radius/2);
        
        // Ghost bottom wavy part
        for (let i = 0; i < 3; i++) {
            const waveX = x + radius - (i * waveWidth);
            ctx.lineTo(waveX - waveWidth/2, y + radius/2 - waveHeight);
            ctx.lineTo(waveX - waveWidth, y + radius/2);
        }
        
        ctx.lineTo(x - radius, y - radius/2);
        ctx.fill();
        ctx.stroke();
        
        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x - radius/3, y - radius/2, radius/3, Math.PI, 0);
        ctx.fill();
        
        // Ghost eyes with 3D effect (scaled for larger ghost)
        const eyeSize = radius/3.5; // Slightly larger eyes
        
        // Eye whites with shadow
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(x - radius/3 + 1, y - radius/3 + 1, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius/3 + 1, y - radius/3 + 1, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // Eye whites
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - radius/3, y - radius/3, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius/3, y - radius/3, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // Eye highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x - radius/3 - 1, y - radius/3 - 1, eyeSize/3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius/3 - 1, y - radius/3 - 1, eyeSize/3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Ghost pupils (scaled)
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(x - radius/3, y - radius/3, eyeSize/2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius/3, y - radius/3, eyeSize/2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    if (gameState === 'playing') {
        movePacman();
        moveGhosts();
        checkCollision();
        updateDisplay();
    }
    
    // Draw everything
    drawMaze();
    drawPacman();
    drawGhosts();
    
    requestAnimationFrame(gameLoop);
}

// Game control functions
function restartGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    floatingPoints = []; // Reset floating points
    pacman.x = 1;
    pacman.y = 1;
    pacman.direction = 'right';
    pacman.nextDirection = 'right';
    pacman.moveCounter = 0;
    // Reset all ghosts
    ghosts[0].x = 8; ghosts[0].y = 9;
    ghosts[1].x = 9; ghosts[1].y = 9;
    ghosts[2].x = 10; ghosts[2].y = 9;
    ghosts.forEach(g => {
        g.direction = 'up';
        g.moveCounter = 0;
    });
    document.getElementById('gameOver').style.display = 'none';
    initGame();
}

function nextLevel() {
    level++;
    lives = Math.min(lives + 1, 5); // Bonus life, max 5
    pacman.x = 1;
    pacman.y = 1;
    pacman.direction = 'right';
    pacman.nextDirection = 'right';
    pacman.moveCounter = 0;
    // Reset all ghosts
    ghosts[0].x = 8; ghosts[0].y = 9;
    ghosts[1].x = 9; ghosts[1].y = 9;
    ghosts[2].x = 10; ghosts[2].y = 9;
    ghosts.forEach(g => {
        g.direction = 'up';
        g.moveCounter = 0;
    });
    gameState = 'playing';
    document.getElementById('levelComplete').style.display = 'none';
    initGame();
}

// Initialize and start the game
initGame();
updateDisplay();
gameLoop();
