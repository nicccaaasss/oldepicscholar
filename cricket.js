const gameState = {
    playerScore: 0,
    botScore: 0,
    wickets: 0,
    maxWickets: 3,
    isPlayerBatting: true,
    botScoreFinal: null,
    playerScoreFinal: null,
    maxNumbers: 6,
    animations: true,
    consecutiveNumbers: 0,
    lastBatsmanNumber: -1,
    bowlerZeros: 0,
    isFreeHit: false,
    inningsCompleted: false,
    targetScore: 0,
    targetSet: false,
    targetToChase: 0,
    consecutiveFreeHits: 0,
    consecutiveBotFreeHits: 0,
    lastPlayerChoice: -1,
    lastBotChoice: -1,
    lastWicketCount: 0,
    currentPlayerWickets: 0,
    currentBotWickets: 0,
    baseWickets: 3,
    bowlerZeroCount: 0,
    botBowlerZeroCount: 0,
  };

  function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    document.getElementById('theme-toggle').checked = isDark;
  }

  function toggleTheme() {
    const isDark = document.getElementById('theme-toggle').checked;
    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  document.addEventListener('DOMContentLoaded', initTheme);

  function startGame() {
    const selectedWickets = parseInt(document.getElementById('wicket-limit').value);
    gameState.baseWickets = selectedWickets;
    gameState.maxWickets = selectedWickets;
    
    document.getElementById('player-max-wickets').textContent = selectedWickets;
    document.getElementById('bot-max-wickets').textContent = selectedWickets;
    document.getElementById('player-wickets').textContent = '0';
    document.getElementById('bot-wickets').textContent = '0';
    
    initNumberGrid(null, 'toss-numbers', 5);
    showSection('setup-section', 'toss-section');
  }

  document.getElementById('wicket-limit').addEventListener('input', (e) => {
    document.getElementById('wicket-value').textContent = e.target.value;
  });

  function createConfetti() {
    const celebration = document.getElementById('celebration');
    celebration.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      celebration.appendChild(confetti);
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function animateNumber(element, start, end, duration = 1000) {
    if (!gameState.animations) {
      element.textContent = end;
      return;
    }

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const animate = () => {
      current += increment;
      element.textContent = Math.round(current);

      if ((increment > 0 && current < end) || 
          (increment < 0 && current > end)) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = end;
      }
    };

    requestAnimationFrame(animate);
  }

  function updateScore(type, value) {
    const element = document.getElementById(`${type}-score`);
    animateNumber(element, parseInt(element.textContent), value);
  }

  function handleZeroBowling(isBot = false) {
    if (isBot) {
        gameState.botBowlerZeroCount++;
        if (gameState.botBowlerZeroCount > 3) {
            gameState.isFreeHit = true;
            showToast('Bot bowled too many zeros - FREE HIT next ball! 🎯', 'success');
            gameState.botBowlerZeroCount = 0;
            return true;
        }
    } else {
        gameState.bowlerZeroCount++;
        if (gameState.bowlerZeroCount > 3) {
            gameState.isFreeHit = true;
            showToast('You bowled too many zeros - FREE HIT next ball! 🎯', 'info');
            gameState.bowlerZeroCount = 0;
            return true;
        }
    }
    return false;
  }

  function checkTargetAchieved(score, isBotBatting) {
    if (gameState.targetSet && score >= gameState.targetToChase) {
        const batterName = isBotBatting ? 'Bot' : 'You';
        showToast(`${batterName} reached the target! Game Over!`, 'success');
        if (isBotBatting) {
            gameState.botScoreFinal = score;
        } else {
            gameState.playerScoreFinal = score;
        }
        endGame();
        return true;
    }
    return false;
  }

  function playerBatting(playerChoice) {
    const botPlay = Math.floor(Math.random() * (gameState.maxNumbers + 1));
    gameState.lastBotChoice = botPlay;
    const button = event.target;
    
    button.classList.add('selected');
    setTimeout(() => button.classList.remove('selected'), 500);

    if (botPlay === 0) {
        if (handleZeroBowling(true)) return;
        showToast('Dot ball! No runs scored 🎯', 'info');
        return;
    }

    if (playerChoice === 0) {
        gameState.botBowlerZeroCount = 0;
        if (botPlay === 0) {
            gameState.isFreeHit = true;
            showToast('Both played 0 - FREE HIT next ball! 🎯', 'success');
            return;
        }
        if (botPlay === 1) {  // Out if bowler plays 1
            gameState.currentPlayerWickets++;
            showToast('OUT! Bowler trapped you with 1! 🎯', 'error');
            document.getElementById('player-wickets').textContent = gameState.currentPlayerWickets;
            
            if (gameState.currentPlayerWickets >= gameState.maxWickets) {
                gameState.playerScoreFinal = gameState.playerScore;
                if (!gameState.targetSet) {
                    gameState.targetSet = true;
                    gameState.targetToChase = gameState.playerScore + 1;
                    showToast(`Target set: ${gameState.targetToChase} runs`, 'info');
                    startBotInnings();
                } else {
                    endGame();
                }
            }
            return;
        }
        gameState.playerScore += botPlay;
        updateScore('player', gameState.playerScore);
        if (checkTargetAchieved(gameState.playerScore, false)) return;
        showToast(`Clever play! Got ${botPlay} runs! 🏃`, 'success');
        return;
    }

    if (gameState.isFreeHit) {
        if (playerChoice === botPlay) {
            showToast('OUT on free hit - No wicket lost! 🛡️', 'info');
            return;
        }
        gameState.playerScore += playerChoice;
        updateScore('player', gameState.playerScore);
        if (checkTargetAchieved(gameState.playerScore, false)) return;
        showToast(`FREE HIT: +${playerChoice} runs! 🏃`, 'success');
        gameState.isFreeHit = false;
        return;
    }

    if (playerChoice === botPlay) {
        gameState.currentPlayerWickets++;
        showToast('OUT! 🎯', 'error');
        document.getElementById('player-wickets').textContent = gameState.currentPlayerWickets;
    } else {
        gameState.playerScore += playerChoice;
        updateScore('player', gameState.playerScore);
        if (checkTargetAchieved(gameState.playerScore, false)) return;
        showToast(`+${playerChoice} runs! 🏃`, 'success');
    }

    if (gameState.targetSet && gameState.playerScore >= gameState.targetToChase) {
        gameState.playerScoreFinal = gameState.playerScore;
        endGame();
        return;
    }

    if (gameState.currentPlayerWickets >= gameState.maxWickets) {
        gameState.playerScoreFinal = gameState.playerScore;
        if (!gameState.targetSet) {
            gameState.targetSet = true;
            gameState.targetToChase = gameState.playerScore + 1;
            showToast(`Target set: ${gameState.targetToChase} runs`, 'info');
            startBotInnings();
        } else {
            endGame();
        }
    }
  }

  function botBatting(playerGuess) {
    const prevWickets = gameState.wickets;
    gameState.lastPlayerChoice = playerGuess;
    let botPlay = Math.floor(Math.random() * (gameState.maxNumbers + 1));

    if (gameState.isFreeHit) {
        gameState.consecutiveBotFreeHits++;
        gameState.botScore += botPlay;
        updateScore('bot', gameState.botScore);
        if (checkTargetAchieved(gameState.botScore, true)) return;
        
        if (gameState.consecutiveBotFreeHits === 3) {
            gameState.maxWickets++;
            showToast('🎩 BOT FREE HIT HAT-TRICK! Extra wicket added! Now have ' + gameState.maxWickets + ' wickets! 🤖', 'info');
            document.getElementById('max-wickets').textContent = gameState.maxWickets;
            gameState.consecutiveBotFreeHits = 0;
        } else {
            showToast(`FREE HIT: Bot scores ${botPlay} runs! 🤖`, 'info');
        }
        gameState.isFreeHit = false;
        return;
    } else if (botPlay === 0) {
        if (playerGuess === 0) {
            gameState.isFreeHit = true;
            showToast('Both played 0 - FREE HIT next ball! 🎯', 'info');
            return;
        }
        if (playerGuess === 1) {
            gameState.currentBotWickets++;
            showToast('OUT! You trapped the bot with 1! 🎯', 'success');
            document.getElementById('bot-wickets').textContent = gameState.currentBotWickets;
        } else {
            gameState.botScore += playerGuess;
            updateScore('bot', gameState.botScore);
            if (checkTargetAchieved(gameState.botScore, true)) return;
            showToast(`Bot gets ${playerGuess} runs! 🤖`, 'info');
        }
        return;
    } else if (playerGuess === 0) {
        if (handleZeroBowling(false)) return;
        showToast('Dot ball! No runs scored 🎯', 'info');
        return;
    } else if (playerGuess === botPlay) {
        gameState.currentBotWickets++;
        showToast('OUT! Bot is out! Starting your innings! 🎯', 'success');
        document.getElementById('bot-wickets').textContent = gameState.currentBotWickets;
        gameState.botScoreFinal = gameState.botScore;
        if (!gameState.targetSet) {
            gameState.targetSet = true;
            gameState.targetToChase = gameState.botScore + 1;
            showToast(`Target set: ${gameState.targetToChase} runs`, 'info');
            document.getElementById('game-status').textContent = `You need ${gameState.targetToChase} runs to win`;
            startPlayerInnings();
        } else {
            endGame();
        }
        return;
    } else {
        gameState.botScore += botPlay;
        updateScore('bot', gameState.botScore);
        if (checkTargetAchieved(gameState.botScore, true)) return;
        showToast(`Bot scores ${botPlay} runs! 🤖`, 'info');
    }

    if (gameState.targetSet && gameState.botScore >= gameState.targetToChase) {
        gameState.botScoreFinal = gameState.botScore;
        endGame();
        return;
    }

    if (gameState.currentBotWickets >= gameState.maxWickets) {
        gameState.botScoreFinal = gameState.botScore;
        if (!gameState.targetSet) {
            gameState.targetSet = true;
            gameState.targetToChase = gameState.botScore + 1;
            showToast(`Target set: ${gameState.targetToChase} runs`, 'info');
            document.getElementById('game-status').textContent = `You need ${gameState.targetToChase} runs to win`;
            startPlayerInnings();
        } else {
            endGame();
        }
    }
  }

  function endGame() {
    const playerScore = gameState.playerScoreFinal || gameState.playerScore;
    const botScore = gameState.botScoreFinal || gameState.botScore;
    
    disableGameplay();
    
    const grid = document.getElementById('number-grid');
    grid.innerHTML = '';
    document.getElementById('game-status').textContent = 'Match Over';
    
    const result = document.getElementById('play-result');
    const isChasing = gameState.targetSet;
    const isDraw = playerScore === botScore;
    
    const playerWon = isChasing ? 
        (gameState.isPlayerBatting && playerScore >= gameState.targetToChase) || 
        (!gameState.isPlayerBatting && (botScore < gameState.targetToChase && gameState.currentBotWickets >= gameState.maxWickets)) 
        : 
        (playerScore > botScore);

    let matchSummary = '';
    if (isChasing) {
        if (gameState.isPlayerBatting) {
            matchSummary = playerWon ? 
                `Successfully chased ${gameState.targetToChase} runs!` :
                `Failed to chase target by ${Math.abs(gameState.targetToChase - playerScore)} runs`;
        } else {
            matchSummary = playerWon ? 
                `Successfully defended ${gameState.targetToChase - 1} runs!` :
                botScore >= gameState.targetToChase ? 
                    `Bot chased down the target of ${gameState.targetToChase} runs` :
                    `Bot failed to chase target by ${Math.abs(gameState.targetToChase - botScore)} runs`;
        }
    }

    result.innerHTML = `
      <div class="${isDraw ? 'win-message' : playerWon ? 'win-message' : 'lose-message'}">
        <h2 class="${isDraw ? 'win-title' : playerWon ? 'win-title' : 'lose-title'}">
          ${isDraw ? '🤝 Match Drawn! 🤝' : playerWon ? '🏆 You Won!' : '💀 Game Over - Bot Wins'}
        </h2>
        <div class="match-summary-overlay">
          <div class="match-summary">
            <div class="score-block">
              <p>Your Score</p>
              <div class="score-value">${playerScore}</div>
            </div>
            <div class="score-block">
              <p>Bot's Score</p>
              <div class="score-value">${botScore}</div>
            </div>
            ${matchSummary ? `<div class="details">${matchSummary}</div>` : ''}
            ${isDraw ? `<div class="details">Amazing match! Both teams scored ${playerScore} runs!</div>` : ''}
            <div class="restart-button-container">
              <button class="match-restart-btn" onclick="resetGame()">
                <span class="material-icons">replay</span> New Game
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (playerWon || isDraw) {
      createConfetti();
      document.getElementById('sound-win')?.play();
    }

    document.querySelectorAll('.number-btn').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }

  function disableGameplay() {
    document.querySelectorAll('.number-btn').forEach(btn => {
      btn.onclick = null;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }

  function resetGame() {
    gameState.playerScore = 0;
    gameState.botScore = 0;
    gameState.wickets = 0;
    gameState.playerScoreFinal = null;
    gameState.botScoreFinal = null;
    gameState.consecutiveNumbers = 0;
    gameState.lastBatsmanNumber = -1;
    gameState.bowlerZeros = 0;
    gameState.isFreeHit = false;
    gameState.inningsCompleted = false;
    gameState.targetScore = 0;
    gameState.targetSet = false;
    gameState.targetToChase = 0;
    gameState.consecutiveFreeHits = 0;
    gameState.consecutiveBotFreeHits = 0;
    gameState.lastPlayerChoice = -1;
    gameState.lastBotChoice = -1;
    gameState.currentPlayerWickets = 0;
    gameState.currentBotWickets = 0;
    gameState.maxWickets = gameState.baseWickets;
    document.getElementById('player-wickets').textContent = '0';
    document.getElementById('bot-wickets').textContent = '0';
    document.getElementById('player-max-wickets').textContent = gameState.baseWickets;
    document.getElementById('bot-max-wickets').textContent = gameState.baseWickets;
    
    document.getElementById('player-score').textContent = '0';
    document.getElementById('bot-score').textContent = '0';
    
    document.getElementById('play-result').innerHTML = '';
    
    document.getElementById('celebration').innerHTML = '';
    
    showSection('game-section', 'setup-section');
  }

  function showSection(hideId, showId) {
    const hideElement = document.getElementById(hideId);
    const showElement = document.getElementById(showId);
    
    hideElement.classList.remove('visible');
    
    setTimeout(() => {
      showElement.classList.add('visible');
    }, 500);
  }

  function showTossResult(playerNumber, botNumber, winner, choice) {
    const overlay = document.getElementById('toss-overlay');
    const numbersDisplay = document.getElementById('toss-numbers-display');
    const winnerDisplay = document.getElementById('toss-winner-display');
    
    numbersDisplay.innerHTML = `
      <div class="toss-numbers">
        <div class="toss-number">You: ${playerNumber}</div>
        <div class="toss-number">Bot: ${botNumber}</div>
        <div class="toss-number">Sum: ${playerNumber + botNumber}</div>
      </div>
    `;
    
    if (winner === 'You') {
      winnerDisplay.innerHTML = `
        <h3>🎉 You won the toss!</h3>
        <p>Choose your option:</p>
        <div class="toss-choice-buttons">
          <button class="toss-choice-btn" onclick="handleTossChoice(true)">Bat First</button>
          <button class="toss-choice-btn" onclick="handleTossChoice(false)">Bowl First</button>
        </div>
      `;
    } else {
      winnerDisplay.innerHTML = `
        <h3>Bot won the toss!</h3>
        <p>Bot chose to bat first</p>
      `;
      setTimeout(() => {
        overlay.classList.remove('visible');
        setTimeout(() => {
          showSection('toss-section', 'game-section');
          startBotInnings();
        }, 300);
      }, 2000);
    }
    
    overlay.classList.add('visible');
  }

  function handleTossChoice(batFirst) {
    const overlay = document.getElementById('toss-overlay');
    overlay.classList.remove('visible');
    
    setTimeout(() => {
      showSection('toss-section', 'game-section');
      if (batFirst) {
        startPlayerInnings();
      } else {
        startBotInnings();
      }
    }, 300);
  }

  function doToss() {
    const playerChoice = document.getElementById('player-choice').value;
    const selectedButton = document.querySelector('#toss-numbers .number-btn.selected');
    
    if (!selectedButton) {
      showToast('Please select a number (1-5) first!', 'error');
      return;
    }
    
    const playerNumber = parseInt(selectedButton.textContent);
    const botNumber = Math.floor(Math.random() * 5) + 1;
    const sum = botNumber + playerNumber;
    const resultType = sum % 2 === 0 ? 'even' : 'odd';
    
    // Show toss summary even for same numbers
    const overlay = document.getElementById('toss-overlay');
    const numbersDisplay = document.getElementById('toss-numbers-display');
    const winnerDisplay = document.getElementById('toss-winner-display');
    
    numbersDisplay.innerHTML = `
      <div class="toss-numbers">
        <div class="toss-number">You: ${playerNumber}</div>
        <div class="toss-number">Bot: ${botNumber}</div>
        <div class="toss-number">Sum: ${sum}</div>
      </div>
    `;

    // Check for same numbers after showing summary
    if (playerNumber === botNumber) {
      winnerDisplay.innerHTML = `
        <h3>🎲 Same Numbers!</h3>
        <p>Both chose ${playerNumber} - Toss again!</p>
        <div class="toss-choice-buttons">
          <button class="toss-choice-btn" onclick="hideTossOverlay()">Continue</button>
        </div>
      `;
      overlay.classList.add('visible');
      return;
    }
    
    // Regular toss result if numbers are different
    showTossResult(playerNumber, botNumber, playerChoice === resultType ? 'You' : 'Bot');
  }

  function hideTossOverlay() {
    const overlay = document.getElementById('toss-overlay');
    overlay.classList.remove('visible');
    document.querySelector('#toss-numbers .number-btn.selected')?.classList.remove('selected');
  }

  function initNumberGrid(callback, containerId = 'number-grid', maxNum = gameState.maxNumbers) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = '';
    
    const handleNumberClick = (button, number) => {
      grid.querySelectorAll('.number-btn').forEach(btn => 
        btn.classList.remove('selected'));
      
      button.classList.add('selected');
      
      const audio = new Audio('sounds/click.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      
      if (callback) callback(number);
    };

    let numbers;
    if (containerId === 'toss-numbers') {
      numbers = Array.from({ length: 5 }, (_, i) => i + 1);
    } else {
      numbers = Array.from({ length: maxNum + 1 }, (_, i) => i);
    }

    numbers.forEach(i => {
      const button = document.createElement('button');
      button.className = 'number-btn';
      button.textContent = i;
      button.onclick = () => handleNumberClick(button, i);
      
      button.addEventListener('mousedown', (e) => {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
      });

      grid.appendChild(button);
    });

    const columns = numbers.length <= 6 ? 3 : 4;
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }
  
  function selectNumberLimit(value) {
    document.querySelectorAll('.number-option').forEach(btn => {
      btn.classList.toggle('selected', btn.textContent === `0-${value}`);
    });
    gameState.maxNumbers = value;
  }

  function startBotInnings() {
    gameState.isPlayerBatting = false;
    gameState.botScore = 0;
    gameState.currentBotWickets = 0;
    document.getElementById('bot-wickets').textContent = '0';
    document.getElementById('bot-max-wickets').textContent = gameState.baseWickets;
    document.getElementById('game-status').textContent = 
      gameState.targetSet ?         `Bot needs ${gameState.targetToChase} runs to win` : 
      "Bot's batting first";
    initNumberGrid(botBatting);
  }
      function startPlayerInnings() {
    gameState.isPlayerBatting = true;
    gameState.playerScore = 0;
    gameState.currentPlayerWickets = 0;
    document.getElementById('player-wickets').textContent = '0';
    document.getElementById('player-max-wickets').textContent = gameState.baseWickets;
    document.getElementById('game-status').textContent = 
      gameState.targetSet ? 
      `You need ${gameState.targetToChase} runs to win` : 
      "You're batting first";
    initNumberGrid(playerBatting);
  }