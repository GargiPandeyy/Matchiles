let emojis = ['👻', '🎃', '🦇', '💀', '🕷️', '🕸️', '🧙', '🧛', '🧟', '👹', '🍬', '🔮'];
let cards = [];
let flippedCards = [];
let moves = 0;
let matchedPairs = 0;
let currentLevel = 'easy';
let timeLeft = 0;
let timerInterval = null;
let gameStarted = false;
let score = 0;
let combo = 0;
let comboTimer = null;
let hauntedModeActive = false;
let ghostModeActive = false;
let hauntedInterval = null;
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playFlipSound() {
    initAudio();
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 400;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playMatchSound() {
    initAudio();
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playWinSound() {
    initAudio();
    let notes = [523, 659, 784, 1047];

    notes.forEach((freq, index) => {
        let oscillator = audioContext.createOscillator();
        let gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        let startTime = audioContext.currentTime + (index * 0.15);
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
    });
}

function playGameOverSound() {
    initAudio();
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
}

let levels = {
    easy: { pairs: 8, cols: 4, time: 120, preview: 5 },
    medium: { pairs: 10, cols: 5, time: 90, preview: 3 },
    hard: { pairs: 12, cols: 6, time: 60, preview: 2 }
};

function createBoard() {
    let gameBoard = document.getElementById('game-board');
    let level = levels[currentLevel];
    gameBoard.style.gridTemplateColumns = `repeat(${level.cols}, 100px)`;

    let selectedEmojis = emojis.slice(0, level.pairs);
    cards = [...selectedEmojis, ...selectedEmojis];
    cards = cards.sort(() => Math.random() - 0.5);

    gameBoard.innerHTML = '';

    cards.forEach((emoji, index) => {
        let card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.dataset.index = index;

        let cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');

        let cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        cardFront.textContent = '?';

        let cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        cardBack.textContent = emoji;

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);

        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });

    showPreview();
}

function showPreview() {
    let allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
        card.classList.add('flipped');
        card.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
        card.style.pointerEvents = 'none';
    });

    setTimeout(() => {
        allCards.forEach(card => {
            card.classList.remove('flipped');
            card.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
            card.style.pointerEvents = 'auto';
        });
    }, levels[currentLevel].preview * 1000);
}

function flipCard() {
    if (flippedCards.length >= 2) return;
    if (this.classList.contains('flipped')) return;

    if (!gameStarted) {
        startTimer();
        gameStarted = true;

        if (ghostModeActive) {
            applyGhostMode();
        }
    }

    this.classList.add('flipped');
    this.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
    flippedCards.push(this);
    playFlipSound();

    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('moves').textContent = moves;
        checkMatch();
    }
}

function startTimer() {
    timeLeft = levels[currentLevel].time;
    document.getElementById('timer').textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOver(false);
        }
    }, 1000);

    if (hauntedModeActive) {
        startHauntedMode();
    }
}

function startHauntedMode() {
    hauntedInterval = setInterval(() => {
        let allCards = Array.from(document.querySelectorAll('.card'));
        let unmatchedCards = allCards.filter(card => !card.classList.contains('matched') && !card.classList.contains('flipped'));

        if (unmatchedCards.length > 0 && flippedCards.length === 0) {
            let randomCard = unmatchedCards[Math.floor(Math.random() * unmatchedCards.length)];
            randomCard.querySelector('.card-inner').style.transform = 'rotateY(180deg)';

            setTimeout(() => {
                randomCard.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
            }, 800);
        }
    }, 4000);
}

function applyGhostMode() {
    if (!ghostModeActive) return;

    let allCards = Array.from(document.querySelectorAll('.card'));
    let unmatchedCards = allCards.filter(card => !card.classList.contains('matched'));

    if (unmatchedCards.length > 2) {
        let randomCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < randomCount; i++) {
            let randomCard = unmatchedCards[Math.floor(Math.random() * unmatchedCards.length)];
            randomCard.style.opacity = '0';

            setTimeout(() => {
                randomCard.style.opacity = '1';
            }, 2000);

            unmatchedCards = unmatchedCards.filter(c => c !== randomCard);
        }
    }

    setTimeout(() => {
        if (gameStarted) applyGhostMode();
    }, 8000 + Math.random() * 4000);
}

function gameOver(won) {
    clearInterval(timerInterval);
    let allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
        card.style.pointerEvents = 'none';
    });

    let modal = document.getElementById('game-over-modal');
    let title = document.getElementById('result-title');
    let message = document.getElementById('result-message');

    if (won) {
        title.textContent = 'You Win!';
        message.textContent = `Score: ${score} | Moves: ${moves} | Time left: ${timeLeft}s`;
        saveHighScore(score, currentLevel);
        playWinSound();
    } else {
        title.textContent = 'Game Over!';
        message.textContent = 'Time ran out! Try again?';
        playGameOverSound();
    }

    modal.classList.add('active');
}

function saveHighScore(newScore, level) {
    let scores = JSON.parse(localStorage.getItem('matchiles-scores') || '{}');

    if (!scores[level]) {
        scores[level] = [];
    }

    scores[level].push({
        score: newScore,
        date: new Date().toLocaleDateString()
    });

    scores[level].sort((a, b) => b.score - a.score);
    scores[level] = scores[level].slice(0, 5);

    localStorage.setItem('matchiles-scores', JSON.stringify(scores));
}

function showLeaderboard() {
    let scores = JSON.parse(localStorage.getItem('matchiles-scores') || '{}');
    let leaderboardList = document.getElementById('leaderboard-list');

    leaderboardList.innerHTML = '';

    ['easy', 'medium', 'hard'].forEach(level => {
        let levelSection = document.createElement('div');
        levelSection.className = 'leaderboard-section';

        let levelTitle = document.createElement('h3');
        levelTitle.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        levelSection.appendChild(levelTitle);

        let levelScores = scores[level] || [];

        if (levelScores.length === 0) {
            let noScores = document.createElement('p');
            noScores.textContent = 'No scores yet';
            noScores.className = 'no-scores';
            levelSection.appendChild(noScores);
        } else {
            levelScores.forEach((entry, index) => {
                let scoreEntry = document.createElement('div');
                scoreEntry.className = 'score-entry';
                scoreEntry.textContent = `${index + 1}. ${entry.score} pts - ${entry.date}`;
                levelSection.appendChild(scoreEntry);
            });
        }

        leaderboardList.appendChild(levelSection);
    });

    document.getElementById('leaderboard-modal').classList.add('active');
}

function checkMatch() {
    let card1 = flippedCards[0];
    let card2 = flippedCards[1];

    if (card1.dataset.emoji === card2.dataset.emoji) {
        card1.classList.add('matched');
        card2.classList.add('matched');

        createParticles(card1);
        createParticles(card2);
        playMatchSound();

        combo++;
        clearTimeout(comboTimer);

        let basePoints = 100;
        let comboBonus = combo > 1 ? (combo - 1) * 50 : 0;
        let timeBonus = Math.floor(timeLeft / 10) * 10;
        let earnedPoints = basePoints + comboBonus + timeBonus;

        score += earnedPoints;
        document.getElementById('score').textContent = score;

        if (combo > 1) {
            document.getElementById('combo-display').style.display = 'flex';
            document.getElementById('combo').textContent = combo;
            showFloatingScore(earnedPoints, card1);
        }

        comboTimer = setTimeout(() => {
            combo = 0;
            document.getElementById('combo-display').style.display = 'none';
        }, 3000);

        flippedCards = [];
        matchedPairs++;

        if (matchedPairs === levels[currentLevel].pairs) {
            setTimeout(() => {
                gameOver(true);
            }, 500);
        }
    } else {
        combo = 0;
        document.getElementById('combo-display').style.display = 'none';

        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
            card2.querySelector('.card-inner').style.transform = 'rotateY(0deg)';
            flippedCards = [];
        }, 1000);
    }
}

function showFloatingScore(points, card) {
    let floatingText = document.createElement('div');
    floatingText.className = 'floating-score';
    floatingText.textContent = `+${points}`;
    floatingText.style.left = card.offsetLeft + 'px';
    floatingText.style.top = card.offsetTop + 'px';
    document.getElementById('game-board').appendChild(floatingText);

    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

function createParticles(card) {
    let particles = ['⭐', '✨', '💫', '🎃', '👻'];
    let gameBoard = document.getElementById('game-board');

    for (let i = 0; i < 8; i++) {
        let particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];

        let angle = (Math.PI * 2 * i) / 8;
        let velocity = 50 + Math.random() * 30;

        particle.style.left = card.offsetLeft + 50 + 'px';
        particle.style.top = card.offsetTop + 50 + 'px';

        gameBoard.appendChild(particle);

        let x = Math.cos(angle) * velocity;
        let y = Math.sin(angle) * velocity;

        particle.style.setProperty('--x', x + 'px');
        particle.style.setProperty('--y', y + 'px');

        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

let diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        diffBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentLevel = this.dataset.level;
        resetGame();
    });
});

function resetGame() {
    moves = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameStarted = false;
    score = 0;
    combo = 0;
    clearInterval(timerInterval);
    clearInterval(hauntedInterval);
    clearTimeout(comboTimer);
    document.getElementById('moves').textContent = 0;
    document.getElementById('score').textContent = 0;
    document.getElementById('combo-display').style.display = 'none';
    document.getElementById('timer').textContent = levels[currentLevel].time;
    document.getElementById('game-over-modal').classList.remove('active');
    createBoard();
}

function init() {
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('close-leaderboard').addEventListener('click', () => {
        document.getElementById('leaderboard-modal').classList.remove('active');
    });

    document.getElementById('haunted-mode').addEventListener('change', (e) => {
        hauntedModeActive = e.target.checked;
    });

    document.getElementById('ghost-mode').addEventListener('change', (e) => {
        ghostModeActive = e.target.checked;
    });

    document.getElementById('timer').textContent = levels[currentLevel].time;
    createBoard();
}

init();
