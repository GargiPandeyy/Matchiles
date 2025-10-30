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
    }

    this.classList.add('flipped');
    this.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
    flippedCards.push(this);

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
        message.textContent = `You completed the game in ${moves} moves with ${timeLeft} seconds left!`;
    } else {
        title.textContent = 'Game Over!';
        message.textContent = 'Time ran out! Try again?';
    }

    modal.classList.add('active');
}

function checkMatch() {
    let card1 = flippedCards[0];
    let card2 = flippedCards[1];

    if (card1.dataset.emoji === card2.dataset.emoji) {
        card1.classList.add('matched');
        card2.classList.add('matched');

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
    document.getElementById('timer').textContent = levels[currentLevel].time;
    createBoard();
}

init();
