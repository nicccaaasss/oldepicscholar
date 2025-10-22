function toggleMode() {
    document.body.classList.toggle('dark-mode');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['r', 'p', 's'].includes(key) && !gameOver) {
        const map = { r: 'rock', p: 'paper', s: 'scissors' };
        document.querySelector(`[data-choice="${map[key]}"]`).click();
      }
    });
  });

  const startBtn = document.getElementById('startGame');
  const targetPointsInput = document.getElementById('targetPoints');
  const choicesContainer = document.querySelector('.choices');
  const scoreBoard = document.getElementById('scoreBoard');
  const playerScoreEl = document.getElementById('playerScore');
  const computerScoreEl = document.getElementById('computerScore');
  const overlay = document.getElementById('overlay');

  const winSound = document.getElementById('winSound');
  const loseSound = document.getElementById('loseSound');
  const clickSound = document.getElementById('clickSound');
  const gameOverSound = document.getElementById('gameOverSound');

  let playerScore = 0;
  let computerScore = 0;
  let gameOver = false;
  let targetPoints = 5;

  startBtn.addEventListener('click', startGame);

// Replace the entire startGame() function
function startGame() {
  clickSound.play();
  // Clear the confetti interval if it exists
  if (overlay.dataset.confettiInterval) {
      clearInterval(Number(overlay.dataset.confettiInterval));
      delete overlay.dataset.confettiInterval;
  }
  
  // Reset the button
  const startButton = document.getElementById('startGame');
  startButton.innerHTML = 'Start Game';
  startButton.classList.remove('jumping-button');
  
  targetPoints = parseInt(targetPointsInput.value);
  playerScore = 0;
  computerScore = 0;
  updateScores();
  gameOver = false;
  choicesContainer.classList.remove('hidden');
  scoreBoard.classList.remove('hidden');
  overlay.classList.add('hidden');
}

  document.querySelectorAll('.choice').forEach(button => {
    button.addEventListener('click', () => {
      if (gameOver) return;
      const playerChoice = button.getAttribute('data-choice');
      playRound(playerChoice);
    });
  });

  function playRound(playerChoice) {
    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '✊', paper: '📄', scissors: '✂️' };
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];

    let result = '';
    if (playerChoice === computerChoice) {
      result = 'draw';
    } else if (
      (playerChoice === 'rock' && computerChoice === 'scissors') ||
      (playerChoice === 'paper' && computerChoice === 'rock') ||
      (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
      playerScore++;
      result = 'win';
      animateScore(playerScoreEl);
      winSound.play();
    } else {
      computerScore++;
      result = 'lose';
      animateScore(computerScoreEl);
      loseSound.play();
    }

    updateScores();
    showRoundMessage(result, emojis[playerChoice], emojis[computerChoice]);

    if (playerScore >= targetPoints || computerScore >= targetPoints) {
      endGame();
    }
  }

  function updateScores() {
    playerScoreEl.textContent = playerScore;
    computerScoreEl.textContent = computerScore;
  }

  function animateScore(element) {
    element.classList.add('flip');
    setTimeout(() => {
      element.classList.remove('flip');
    }, 600);
  }

  function showRoundMessage(result, playerEmoji, computerEmoji) {
    overlay.innerHTML = `
      <div class="round-message">
        ${result === 'draw' ? "It's a Draw!" : result === 'win' ? "You Win!" : "You Lose!"}<br>
        <span>${playerEmoji} vs ${computerEmoji}</span>
      </div>
    `;
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('hidden'), 1800);
  }

// Replace the existing endGame() function
function endGame() {
  gameOver = true;
  const message = playerScore > computerScore ? "🎉 You Won the Game!" : "😢 You Lost the Game!";
  gameOverSound.play();
  
  // Replace the start button with restart button
  const startButton = document.getElementById('startGame');
  startButton.innerHTML = '🔄 Restart Game';
  startButton.classList.add('jumping-button');
  
  // Set up the overlay content
  overlay.innerHTML = `
      <div class="final-message">${message}</div>
  `;
  
  // Show the overlay (it will stay visible until startGame is called)
  overlay.classList.remove('hidden');
  createConfetti();
}

// Replace entire createConfetti() function
function createConfetti() {
    let confettiInterval;
    
    function spawnConfetti() {
      for (let i = 0; i < 10; i++) {
        const popper = document.createElement('div');
        popper.classList.add('popper');
        popper.style.left = Math.random() * 100 + 'vw';
        popper.style.top = Math.random() * 10 + 'vh';
        popper.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
        document.body.appendChild(popper);
        setTimeout(() => popper.remove(), 1200);
      }
    }

    // Start continuous confetti
    spawnConfetti();
    confettiInterval = setInterval(spawnConfetti, 500);

    // Store the interval ID in a data attribute
    overlay.dataset.confettiInterval = confettiInterval;
  }