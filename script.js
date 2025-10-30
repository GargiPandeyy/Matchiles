let emojis = ['🍕', '🍔', '🍟', '🌭', '🍿', '🎮', '⚽', '🎸', '🎨', '🚀', '🌈', '⭐'];
let cards = [];
let flippedCards = [];
let moves = 0;
let matchedPairs = 0;

function createBoard() {
    let gameBoard = document.getElementById('game-board');
    gameBoard.style.gridTemplateColumns = 'repeat(4, 100px)';

    let selectedEmojis = emojis.slice(0, 8);
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
}

function flipCard() {
    if (flippedCards.length >= 2) return;
    if (this.classList.contains('flipped')) return;

    this.classList.add('flipped');
    this.querySelector('.card-inner').style.transform = 'rotateY(180deg)';
    flippedCards.push(this);
}

createBoard();
