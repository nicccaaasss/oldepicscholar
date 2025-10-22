// Initialize global variables
 const board = document.getElementById('chess-board');
 const startScreen = document.getElementById('start-screen');
 const chessboardContainer = document.querySelector('.game-container');
 const timerDisplays = document.querySelectorAll('.timer');
 const aiMessage = document.getElementById('thinking');
 let selected = null;
 let game = new Chess();
 let aiMode = false;
 let aiVsAiMode = false;
 let aiThinking = false;

 function initChessEngine() {
     window.engineReady = true;
     return true;
 }

 function evaluatePosition(game) {
     const weights = {
         p: 100,
         n: 320,
         b: 330,
         r: 500,
         q: 900,
         k: 20000
     };

     // Position scores for each piece type
     const piecePositionScores = {
         p: [  // Pawn position scores
             [0,   0,   0,   0,   0,   0,   0,   0],
             [50,  50,  50,  50,  50,  50,  50,  50],
             [10,  10,  20,  30,  30,  20,  10,  10],
             [5,   5,   10,  25,  25,  10,  5,   5],
             [0,   0,   0,   20,  20,  0,   0,   0],
             [5,  -5,  -10,  0,   0,  -10, -5,   5],
             [5,   10,  10, -20, -20,  10,  10,  5],
             [0,   0,   0,   0,   0,   0,   0,   0]
         ],
         n: [  // Knight position scores
             [-50, -40, -30, -30, -30, -30, -40, -50],
             [-40, -20,   0,   0,   0,   0, -20, -40],
             [-30,   0,  10,  15,  15,  10,   0, -30],
             [-30,   5,  15,  20,  20,  15,   5, -30],
             [-30,   0,  15,  20,  20,  15,   0, -30],
             [-30,   5,  10,  15,  15,  10,   5, -30],
             [-40, -20,   0,   5,   5,   0, -20, -40],
             [-50, -40, -30, -30, -30, -30, -40, -50]
         ],
         b: [  // Bishop position scores
             [-20, -10, -10, -10, -10, -10, -10, -20],
             [-10,   0,   0,   0,   0,   0,   0, -10],
             [-10,   0,   5,  10,  10,   5,   0, -10],
             [-10,   5,   5,  10,  10,   5,   5, -10],
             [-10,   0,  10,  10,  10,  10,   0, -10],
             [-10,  10,  10,  10,  10,  10,  10, -10],
             [-10,   5,   0,   0,   0,   0,   5, -10],
             [-20, -10, -10, -10, -10, -10, -10, -20]
         ],
         r: [  // Rook position scores
             [0,   0,   0,   0,   0,   0,   0,   0],
             [5,  10,  10,  10,  10,  10,  10,   5],
             [-5,   0,   0,   0,   0,   0,   0,  -5],
             [-5,   0,   0,   0,   0,   0,   0,  -5],
             [-5,   0,   0,   0,   0,   0,   0,  -5],
             [-5,   0,   0,   0,   0,   0,   0,  -5],
             [-5,   0,   0,   0,   0,   0,   0,  -5],
             [0,   0,   0,   5,   5,   0,   0,   0]
         ],
         q: [  // Queen position scores
             [-20, -10, -10, -5, -5, -10, -10, -20],
             [-10,   0,   0,  0,  0,   0,   0, -10],
             [-10,   0,   5,  5,  5,   5,   0, -10],
             [-5,    0,   5,  5,  5,   5,   0,  -5],
             [0,     0,   5,  5,  5,   5,   0,  -5],
             [-10,   5,   5,  5,  5,   5,   0, -10],
             [-10,   0,   5,  0,  0,   0,   0, -10],
             [-20, -10, -10, -5, -5, -10, -10, -20]
         ],
         k: [  // King position scores (middlegame)
             [-30, -40, -40, -50, -50, -40, -40, -30],
             [-30, -40, -40, -50, -50, -40, -40, -30],
             [-30, -40, -40, -50, -50, -40, -40, -30],
             [-30, -40, -40, -50, -50, -40, -40, -30],
             [-20, -30, -30, -40, -40, -30, -30, -20],
             [-10, -20, -20, -20, -20, -20, -20, -10],
             [20,   20,   0,   0,   0,   0,  20,  20],
             [20,   30,  10,   0,   0,  10,  30,  20]
         ]
     };

     let score = 0;
     const position = game.board();

     // Material and position evaluation
     for (let i = 0; i < 8; i++) {
         for (let j = 0; j < 8; j++) {
             const piece = position[i][j];
             if (piece) {
                 const baseValue = weights[piece.type.toLowerCase()];
                 const positionScore = piecePositionScores[piece.type.toLowerCase()][piece.color === 'w' ? i : 7-i][j];
                 const value = (baseValue + positionScore) * (piece.color === 'w' ? 1 : -1);
                 score += value;
             }
         }
     }

     // Evaluate piece safety and threats
     const threatScore = evaluateThreats(game);
     const mobilityScore = evaluateMobility(game);
     const kingSafetyScore = evaluateKingSafety(game);
     const centerControlScore = evaluateCenterControl(game);

     return score + threatScore + mobilityScore + kingSafetyScore + centerControlScore;
 }

 function evaluateThreats(game) {
     let score = 0;
     const moves = game.moves({ verbose: true });
     
     moves.forEach(move => {
         if (move.captured) {
             // Consider the value of threatened pieces
             const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900 };
             score += (pieceValues[move.captured] * 0.1) * (game.turn() === 'w' ? 1 : -1);
         }
         if (move.flags.includes('k') || move.flags.includes('q')) {
             // Bonus for castling availability
             score += 30 * (game.turn() === 'w' ? 1 : -1);
         }
     });

     return score;
 }

 function evaluateMobility(game) {
     const moves = game.moves().length;
     return moves * 10 * (game.turn() === 'w' ? 1 : -1);
 }

 function evaluateKingSafety(game) {
     let score = 0;
     const position = game.board();
     
     // Find kings
     let whiteKing = null;
     let blackKing = null;
     
     for (let i = 0; i < 8; i++) {
         for (let j = 0; j < 8; j++) {
             const piece = position[i][j];
             if (piece && piece.type === 'k') {
                 if (piece.color === 'w') whiteKing = {i, j};
                 else blackKing = {i, j};
             }
         }
     }
     
     if (whiteKing && blackKing) {
         // Evaluate pawn shield
         score += evaluatePawnShield(position, whiteKing, 'w');
         score -= evaluatePawnShield(position, blackKing, 'b');
         
         // Penalize exposed king
         if (game.in_check()) {
             score += (game.turn() === 'b' ? 150 : -150);
         }
     }
     
     return score;
 }

 function evaluatePawnShield(position, kingPos, color) {
     let score = 0;
     const direction = color === 'w' ? -1 : 1;
     
     // Check pawns in front of king
     for (let j = Math.max(0, kingPos.j - 1); j <= Math.min(7, kingPos.j + 1); j++) {
         const pawnRow = kingPos.i + direction;
         if (pawnRow >= 0 && pawnRow < 8) {
             const piece = position[pawnRow][j];
             if (piece && piece.type === 'p' && piece.color === color) {
                 score += 30; // Bonus for each protecting pawn
             }
         }
     }
     
     return score;
 }

 function evaluateCenterControl(game) {
     const centralSquares = ['d4', 'd5', 'e4', 'e5'];
     let score = 0;
     
     centralSquares.forEach(square => {
         const piece = game.get(square);
         if (piece) {
             score += 30 * (piece.color === 'w' ? 1 : -1);
         }
     });
     
     return score;
 }

 async function getAIMove() {
     const thinking = document.getElementById('thinking');
     thinking.style.display = 'flex';
     aiThinking = true;

     return new Promise((resolve) => {
         setTimeout(() => {
             const moves = game.moves({ verbose: true });
             let bestMove = null;
             let bestScore = -Infinity;
             
             // Evaluate each possible move
             moves.forEach(move => {
                 game.move(move);
                 
                 // Look ahead one move
                 const score = -evaluatePosition(game);
                 
                 // Add randomness for variety
                 const randomFactor = Math.random() * 50;
                 const finalScore = score + randomFactor;
                 
                 if (finalScore > bestScore) {
                     bestScore = finalScore;
                     bestMove = move;
                 }
                 
                 game.undo();
             });

             thinking.style.display = 'none';
             aiThinking = false;

             if (bestMove) {
                 resolve({ from: bestMove.from, to: bestMove.to });
             } else {
                 resolve(null);
             }
         }, 500); // Small delay for visual feedback
     });
 }

 async function makeAIMove() {
     if (aiThinking || game.game_over()) return;
     
     try {
         const move = await getAIMove();
         if (move) {
             const fromSquare = document.querySelector(`[data-square="${move.from}"]`);
             const toSquare = document.querySelector(`[data-square="${move.to}"]`);
             
             if (fromSquare && toSquare) {
                 // Highlight the squares
                 fromSquare.classList.add('highlight');
                 toSquare.classList.add('highlight');
                 
                 // Get piece and calculate move distance
                 const piece = fromSquare.querySelector('.piece');
                 const fromRect = fromSquare.getBoundingClientRect();
                 const toRect = toSquare.getBoundingClientRect();
                 
                 if (piece) {
                     // Calculate exact movement
                     const moveX = toRect.left - fromRect.left;
                     const moveY = toRect.top - fromRect.top;
                     
                     // Set up the transition
                     piece.style.transition = 'transform 0.5s ease';
                     piece.style.transform = `translate(${moveX}px, ${moveY}px)`;
                     
                     // Wait for animation
                     await new Promise(resolve => setTimeout(resolve, 500));
                     
                     // Make the move in the game
                     game.move({ from: move.from, to: move.to, promotion: 'q' });
                     
                     // Update board and history
                     updateBoard();
                     const lastMove = game.history({ verbose: true }).pop();
                     addMoveToHistory(lastMove);
                     
                     // Check for game over immediately
                     if (game.in_check() && game.moves().length === 0) {
                         // AI achieved checkmate
                         const winner = game.turn() === 'w' ? 'Black' : 'White';
                         const overlay = document.createElement('div');
                         overlay.className = 'game-over';
                         overlay.innerHTML = `
                             <h2>CHECKMATE!</h2>
                             <i class="fas fa-skull skull"></i>
                             <p>AI has won! Your king is trapped!</p>
                         `;
                         document.body.appendChild(overlay);
                         
                         setTimeout(() => {
                             overlay.style.animation = 'fadeOut 0.5s ease-out';
                             setTimeout(() => {
                                 overlay.remove();
                                 showMatchSummary(winner, 'checkmate', {
                                     message: 'AI achieved checkmate!',
                                     playerWon: false
                                 });
                             }, 500);
                         }, 2000);
                     }
                 }
             }
         }
     } catch (error) {
         console.error('AI move error:', error);
         aiThinking = false;
         document.getElementById('thinking').style.display = 'none';
     }
 }

 async function startGame() {
     if (!document.querySelector('.start-option.selected') || 
         !document.querySelector('.timer-preset.selected')) {
         alert('Please select game mode and timer');
         return;
     }

     document.querySelectorAll('.captured-pieces').forEach(container => {
         container.innerHTML = '';
     });
     document.querySelectorAll('.move-history').forEach(history => {
         history.innerHTML = '';
     });

     startScreen.style.display = 'none';
     chessboardContainer.style.display = 'grid';
     
     game = new Chess();
     drawBoard();
     
     if (timeLimit > 0) {
         startTimer();
     }

     if (aiMode || aiVsAiMode) {
         const success = initChessEngine();
         if (!success) {
             alert('Failed to initialize chess engine. Please try again.');
             return;
         }
         
         if (aiVsAiMode) {
             setTimeout(async () => {
                 const firstMove = await getAIMove();
                 if (firstMove) makeAIMove(firstMove);
             }, 1000);
         }
     }

     gameStartTime = Date.now();
 }

 async function makeMove(from, to) {
     if (aiThinking) return false;
     
     const currentColor = game.turn() === 'w' ? 'white' : 'black';
     if (aiMode && currentColor === 'black') return false;
     
     const piece = game.get(from);
     if (!piece || (piece.color === 'b' && currentColor === 'white') || 
         (piece.color === 'w' && currentColor === 'black')) {
         return false;
     }

     // Get positions for animation
     const fromSquare = document.querySelector(`[data-square="${from}"]`);
     const toSquare = document.querySelector(`[data-square="${to}"]`);
     const pieceElement = fromSquare.querySelector('.piece');
     
     if (pieceElement) {
         // Animation code remains the same
         const fromRect = fromSquare.getBoundingClientRect();
         const toRect = toSquare.getBoundingClientRect();
         const moveX = toRect.left - fromRect.left;
         const moveY = toRect.top - fromRect.top;
         
         pieceElement.classList.add('moving');
         pieceElement.style.transform = `translate(${moveX}px, ${moveY}px)`;
         
         await new Promise(resolve => setTimeout(resolve, 300));
     }

     const move = game.move({ from, to, promotion: 'q' });
     if (!move) return false;

     updateBoard();
     addMoveToHistory(move);

     // Check for game over immediately after move
     checkGameStatus();

     // Make AI move if it's AI's turn
     if (!game.game_over() && aiMode && game.turn() === 'b') {
         setTimeout(() => makeAIMove(), 100);
     }

     return true;
 }

 function checkGameStatus() {
     if (game.moves().length === 0) {  // No legal moves available
         const isCheckmate = game.in_check();
         const winner = isCheckmate ? (game.turn() === 'w' ? 'Black' : 'White') : null;
         
         const overlay = document.createElement('div');
         overlay.className = 'game-over';
         
         if (isCheckmate) {
             // Player wins if they're black and black wins, or white and white wins
             const playerWon = (winner === 'Black') !== aiMode;
             
             overlay.innerHTML = `
                 <h2>${playerWon ? 'VICTORY!' : 'DEFEAT'}</h2>
                 <p>${winner} wins by checkmate!</p>
                 <button class="summary-button new-game">New Game</button>
             `;
             
             if (playerWon) {
                 createConfetti('win', 200);
             } else {
                 overlay.querySelector('h2').insertAdjacentHTML('afterend', 
                     '<i class="fas fa-skull skull"></i>');
             }
         } else {
             // Stalemate - no winner
             overlay.innerHTML = `
                 <h2>STALEMATE</h2>
                 <p>Game drawn - no legal moves available!</p>
                 <button class="summary-button new-game">New Game</button>
             `;
             createConfetti('draw', 50);
         }
         
         document.body.appendChild(overlay);
         
         // Add button handler
         overlay.querySelector('.new-game').onclick = () => {
             overlay.remove();
             startGame();
         };
     }
 }

 function drawBoard() {
   board.innerHTML = '';
   const position = game.fen().split(' ')[0];
   const rows = position.split('/');
   rows.forEach((row, rowIndex) => {
     let colIndex = 0;
     [...row].forEach(char => {
       if (!isNaN(char)) {
         for (let i = 0; +char > i; i++) {
           createSquare(rowIndex, colIndex++, '');
         }
       } else {
         createSquare(rowIndex, colIndex++, char);
       }
     });
   });

   board.style.display = 'grid';
 }

 function createSquare(row, col, piece) {
   const square = document.createElement('div');
   square.className = `square ${(row + col) % 2 ? 'dark' : 'light'}`;
   square.dataset.square = String.fromCharCode(97 + col) + (8 - row);

   if (piece) {
     const pieceDiv = document.createElement('div');
     pieceDiv.className = 'piece';
     pieceDiv.textContent = pieceSymbol(piece);
     pieceDiv.draggable = true;
     pieceDiv.dataset.piece = piece;
     square.appendChild(pieceDiv);

     pieceDiv.addEventListener('dragstart', handleDragStart);
     pieceDiv.addEventListener('dragend', handleDragEnd);
   }

   square.addEventListener('dragover', handleDragOver);
   square.addEventListener('drop', handleDrop);
   square.addEventListener('click', () => onSquareClick(square));

   board.appendChild(square);
   return square;
 }

 function pieceSymbol(letter) {
   const symbols = {
     p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
     P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
   };
   return symbols[letter];
 }

 async function onSquareClick(square) {
     // Prevent moves during AI thinking
     if (aiThinking) return;
     
     // Prevent moving opponent's pieces
     const currentColor = game.turn() === 'w' ? 'white' : 'black';
     if (aiMode && currentColor === 'black') return;
     
     const squareName = square.dataset.square;
     const piece = game.get(squareName);
     
     if (selected) {
         selected.classList.remove('selected');
         makeMove(selected.dataset.square, squareName);
         selected = null;
         clearHighlights();
     } else if (piece && piece.color === game.turn()) {
         selected = square;
         square.classList.add('selected');
         highlightMoves(square);
     }
 }

 function highlightMoves(square) {
   clearHighlights();
   const moves = game.moves({ 
       square: square.dataset.square, 
       verbose: true 
   });
   
   moves.forEach(move => {
       const targetSquare = document.querySelector(`[data-square='${move.to}']`);
       if (targetSquare) {
           targetSquare.classList.add(move.captured ? 'capture-move' : 'possible-move');
       }
   });
 }

 function clearHighlights() {
   document.querySelectorAll('.square').forEach(sq => {
     sq.classList.remove('highlight', 'possible-move', 'capture-move');
   });
 }

 function addMoveToHistory(move) {
   const moveNumber = Math.floor((game.history().length + 1) / 2);
   const isWhiteMove = game.turn() === 'b';
   const moveHtml = `
     <div class="move">
       <span>${moveNumber}.</span>
       <span>${move.san}</span>
       <span></span>
     </div>
   `;
   
   const selector = isWhiteMove ? '.white .move-history' : '.black .move-history.left-history';
   document.querySelector(selector).insertAdjacentHTML('beforeend', moveHtml);
   
   const history = document.querySelector(selector);
   history.scrollTop = history.scrollHeight;
 }

 document.querySelectorAll('.timer-preset').forEach(preset => {
   preset.onclick = (e) => {
     e.preventDefault();
     document.querySelectorAll('.timer-preset').forEach(p => 
       p.classList.remove('selected'));
     preset.classList.add('selected');
     
     timeLimit = preset.id === 'unlimited-timer' ? 
         0 : parseInt(preset.dataset.minutes) * 60;
     validateStart();
   };
 });

 // Update the game mode initialization
 document.querySelectorAll('.start-option').forEach(option => {
     option.addEventListener('click', function() {
         // Remove selected class from all options
         document.querySelectorAll('.start-option').forEach(opt => 
             opt.classList.remove('selected'));
         
         // Add selected class to clicked option
         this.classList.add('selected');
         
         // Set game mode
         const mode = this.id;
         aiMode = mode === 'player-vs-ai';
         aiVsAiMode = mode === 'ai-vs-ai';
         
         // Enable start button if timer is also selected
         validateStart();
     });
 });

 // Update validateStart function
 function validateStart() {
     const startButton = document.getElementById('start-button');
     const hasGameMode = document.querySelector('.start-option.selected');
     const hasTimer = document.querySelector('.timer-preset.selected');
     
     startButton.disabled = !(hasGameMode && hasTimer);
     if (!startButton.disabled) {
         startButton.classList.add('ready');
     }
 }

 document.getElementById('start-button').onclick = startGame;

 document.getElementById('start-button').addEventListener('click', function() {
    document.body.classList.add('chess-game-started');
    // ...rest of your start game logic
});

function returnToMenu() {
    document.body.classList.remove('chess-game-started');
    // ...rest of your reset logic
}

 function updateBoard() {
     drawBoard();
     clearHighlights();
     
     // Add visual feedback for the last move
     const history = game.history({ verbose: true });
     if (history.length > 0) {
         const lastMove = history[history.length - 1];
         const fromSquare = document.querySelector(`[data-square="${lastMove.from}"]`);
         const toSquare = document.querySelector(`[data-square="${lastMove.to}"]`);
         
         if (fromSquare) fromSquare.classList.add('highlight');
         if (toSquare) toSquare.classList.add('highlight');
     }
     
     if (selected) {
         selected.classList.remove('selected');
         selected = null;
     }
 }

 function startTimer() {
   let timeRemaining = timeLimit;
   
   function formatTime(seconds) {
       const mins = Math.floor(seconds / 60);
       const secs = seconds % 60;
       return `${mins}:${secs.toString().padStart(2, '0')}`;
   }
   
   timerInterval = setInterval(() => {
       if (timeRemaining <= 0) {
           clearInterval(timerInterval);
           alert('Time\'s up!');
           return;
       }
       timeRemaining--;
       timerDisplays.forEach(display => {
           display.textContent = formatTime(timeRemaining);
       });
   }, 1000);
 }

 document.getElementById('undo-btn').onclick = () => {
   game.undo();
   if (aiMode) game.undo();
   updateBoard();
 };

 document.getElementById('flip-btn').onclick = () => {
     const isFlipped = board.classList.contains('board-flipped');
     board.style.transform = isFlipped ? '' : 'rotate(180deg)';
     board.classList.toggle('board-flipped');
     
     // Keep pieces upright while board is flipped
     document.querySelectorAll('.square').forEach(sq => {
         sq.classList.toggle('board-flipped');
     });
 };

 document.getElementById('theme-btn').onclick = () => {
   document.body.classList.toggle('dark-theme');
 };

 function handleDragStart(e) {
     if (aiThinking || (aiMode && game.turn() === 'b')) {
         e.preventDefault();
         return false;
     }
     
     const piece = e.target;
     const square = piece.parentElement;
     const boardRect = board.getBoundingClientRect();
     
     // Store original position
     piece.dataset.originalX = e.clientX - boardRect.left;
     piece.dataset.originalY = e.clientY - boardRect.top;
     
     piece.classList.add('moving');
     highlightMoves(square);
 }

 function handleDrag(e) {
     const piece = document.querySelector('.moving');
     if (!piece) return;
     
     const boardRect = board.getBoundingClientRect();
     const x = e.clientX - boardRect.left;
     const y = e.clientY - boardRect.top;
     
     piece.style.transform = `translate(${x - piece.dataset.originalX}px, ${y - piece.dataset.originalY}px)`;
 }

 function handleDragEnd(e) {
   e.target.classList.remove('moving');
   clearHighlights();
 }

 function handleDragOver(e) {
   e.preventDefault();
 }

 function handleDrop(e) {
   e.preventDefault();
   const piece = document.querySelector('.moving');
   if (!piece) return;
   
   const fromSquare = piece.parentElement.dataset.square;
   const toSquare = e.target.dataset.square;
   
   const move = makeMove(fromSquare, toSquare);
   if (move) {
       updateBoard();
       if (aiMode) {
           makeAIMove();
       }
   }
 }

 // Add event listeners for drag movement
 document.addEventListener('mousemove', handleDrag);

 // Add these new functions
 function showPopup(message, duration = 2000) {
     const popup = document.createElement('div');
     popup.className = 'popup';
     popup.textContent = message;
     document.body.appendChild(popup);
     
     setTimeout(() => {
         popup.style.animation = 'fadeOut 2s ease';
         setTimeout(() => popup.remove(), 3000);
     }, duration);
 }

 function showNotification(message, type = '', side = '') {
     // Remove existing notifications of the same type
     document.querySelectorAll(`.notification.${type}`).forEach(n => n.remove());
     
     const notification = document.createElement('div');
     notification.className = `notification ${type} ${side}`;
     notification.textContent = message;
     document.body.appendChild(notification);
     
     // Clear notification on next move or after 2 seconds
     const clearNotification = () => {
         notification.style.opacity = '0';
         notification.style.transform = side === 'white' ? 
             'translateX(-100px)' : 'translateX(100px)';
         setTimeout(() => notification.remove(), 3000);
     };

     // Clear after 2 seconds
     setTimeout(clearNotification, 2000);

 }

 function getPieceName(shortName) {
     const pieceNames = {
         'P': 'Pawn',
         'R': 'Rook',
         'N': 'Knight',
         'B': 'Bishop',
         'Q': 'Queen',
         'K': 'King'
     };
     return pieceNames[shortName] || 'piece';
 }

 function showDualNotification(message, type, details = {}) {
     // Remove existing notifications
     document.querySelectorAll('.notification').forEach(n => n.remove());
     
     const pieceName = getPieceName(details.piece);
     const isWhiteMove = details.side === 'white';
     
     const attackerMessage = `Successfully captured opponent's ${pieceName}!`;
     const defenderMessage = `Lost ${pieceName} to ${isWhiteMove ? 'White' : 'Black'}'s coin`;
     
     let activeNotif, passiveNotif;
     
     if (isWhiteMove) {
         activeNotif = createNotification(attackerMessage, type, 'white', 20);
         passiveNotif = createNotification(defenderMessage, type, 'black', 20);
     } else {
         activeNotif = createNotification(attackerMessage, type, 'black', 20);
         passiveNotif = createNotification(defenderMessage, type, 'white', 20);
     }

     // Function to clear notifications
     setTimeout(() => {
         [mainNotif, responseNotif].forEach(notif => {
             if (notif) {
                 notif.style.opacity = '0';
                 notif.style.transform = notif.classList.contains('white') ? 
                     'translateX(-100px)' : 'translateX(100px)';
                 setTimeout(() => notif.remove(), 300);
             }
         });
     }, 2000);
 }

 function createNotification(message, type, side, topOffset) {
     const notif = document.createElement('div');
     notif.className = `notification ${type} ${side}`;
     notif.textContent = message;
     notif.style.top = `${topOffset}px`;
     document.body.appendChild(notif);
     return notif;
 }

 function createConfetti(type = 'win') {
     const colors = type === 'win' 
         ? ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff1744', '#00bfa5']
         : ['#A0A0A0', '#C0C0C0', '#E0E0E0'];
     
     const count = type === 'win' ? 200 : 100;
     
     for (let i = 0; i < count; i++) {
         const confetti = document.createElement('div');
         confetti.className = 'confetti';
         
         // Random properties
         const size = Math.random() * 10 + 5;
         const shape = Math.random() > 0.5 ? '★' : '✦';
         
         confetti.style.cssText = `
             left: ${Math.random() * 100}vw;
             top: -20px;
             position: fixed;
             animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
             color: ${colors[Math.floor(Math.random() * colors.length)]};
             font-size: ${size}px;
             content: '${shape}';
         `;
         confetti.textContent = shape;
         
         document.body.appendChild(confetti);
         setTimeout(() => confetti.remove(), 5000);
     }
 }

 function showGameOver(message, result, winner) {
     const overlay = document.createElement('div');
     overlay.className = 'game-over';
     
     if (result === 'checkmate') {
         if (winner === 'White' && !aiMode || winner === 'Black' && aiMode) {
             // Player wins
             overlay.innerHTML = `
                 <h2>VICTORY!</h2>
                 <p>${message}</p>
             `;
             createConfetti('win');
         } else {
             // Player loses
             overlay.innerHTML = `
                 <h2>DEFEAT</h2>
                 <i class="fas fa-skull skull"></i>
                 <p>${message}</p>
             `;
         }
     } else {
         // Draw
         overlay.innerHTML = `
             <h2>DRAW</h2>
             <p>${message}</p>
         `;
         createConfetti('draw');
     }
     
     document.body.appendChild(overlay);
     
     // Remove after delay
     setTimeout(() => {
         overlay.style.animation = 'fadeOut 0.5s ease-out';
         setTimeout(() => {
             overlay.remove();
             showMatchSummary(winner, result);
         }, 500);
     }, 2000);
 }

 function getMatchStats() {
     const history = game.history({ verbose: true });
     const captures = {
         white: { total: 0, pieces: { p: 0, n: 0, b: 0, r: 0, q: 0 } },
         black: { total: 0, pieces: { p: 0, n: 0, b: 0, r: 0, q: 0 } }
     };

     history.forEach(move => {
         if (move.captured) {
             const capturingPlayer = move.color === 'w' ? 'white' : 'black';
             captures[capturingPlayer].total++;
             captures[capturingPlayer].pieces[move.captured]++;
         }
     });

     return {
         totalMoves: history.length,
         captures,
         duration: Math.floor((Date.now() - gameStartTime) / 1000)
     };
 }

 function showMatchSummary(winner, result, details = {}) {
     const stats = getMatchStats();
     const overlay = document.createElement('div');
     overlay.className = 'match-summary';

     const formatTime = (seconds) => {
         const mins = Math.floor(seconds / 60);
         const secs = seconds % 60;
         return `${mins}m ${secs}s`;
     };

     let titleText = 'Game Over!';
     if (result === 'checkmate') {
         titleText = details.playerWon ? 'Victory!' : 'Defeat!';
     } else if (result === 'stalemate' || result === 'draw') {
         titleText = 'Draw!';
     }

     overlay.innerHTML = `
         <h2>${titleText}</h2>
         <div class="match-stats">
             <div class="stat-item">
                 <span>Outcome:</span>
                 <span>${details.message || (result === 'checkmate' ? `${winner} wins!` : 'Draw')}</span>
             </div>
             <div class="stat-item">
                 <span>Total Moves:</span>
                 <span>${stats.totalMoves}</span>
             </div>
             <div class="stat-item">
                 <span>Game Duration:</span>
                 <span>${formatTime(stats.duration)}</span>
             </div>
             <div class="stat-item">
                 <span>Pieces Captured:</span>
                 <span>White: ${stats.captures.white.total} | Black: ${stats.captures.black.total}</span>
             </div>
         </div>
         <div class="summary-buttons">
             <button class="summary-button new-game">New Game</button>
             <button class="summary-button return-menu">Return to Menu</button>
         </div>
     `;

     document.body.appendChild(overlay);

     // Add button handlers
     overlay.querySelector('.new-game').onclick = () => {
         overlay.remove();
         startGame();
     };

     overlay.querySelector('.return-menu').onclick = () => {
         overlay.remove();
         startScreen.style.display = 'flex';
         chessboardContainer.style.display = 'none';
     };
 }
