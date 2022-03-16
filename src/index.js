const width = 400;
const height = 400;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const simulationRuns = 1000;

canvas.width = width;
canvas.height = height;

ctx.lineWidth = 10;
ctx.font = '90px tahoma';

initialize();

document.getElementById("newGame").onclick = e => {
  initialize();
};

document.getElementById("computerFirst").onclick = e => {
  player = 'O';
  computer = 'X';

  computerMove();
};

function initialize() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  empty = ' ';
  player = 'X';
  computer = 'O';
  board = [];

  for (var r = 0; r < 3; r++) {
    board[r] = []

    for (var c = 0; c < 3; c++) {
      board[r][c] = empty;
    }
  }

  for (let i = height / 3; i < height; i += height / 3) {
    ctx.beginPath();
    ctx.moveTo(1, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }

  for (let i = width / 3; i < width; i += width / 3) {
    ctx.beginPath();
    ctx.moveTo(i, 1);
    ctx.lineTo(i, width);
    ctx.stroke();
  }

  for (var r = 0; r < 3; r++) {
    for (var c = 0; c < 3; c++) {
      drawLetter(board[r][c], r, c);
    }
  }

  document.getElementById("computerFirst").disabled = false;
}

canvas.onmousemove = e => moveMouse(e);

function moveMouse(e) {
  let rect = canvas.getBoundingClientRect();
  let c = Math.floor((e.clientX - rect.left) / (width / 3));
  let r = Math.floor((e.clientY - rect.top) / (height / 3));

  canvas.style.cursor = board[r][c] == ' ' ? 'pointer' : 'auto';
}

canvas.onclick = e => playerMove(e);

function playerMove(e) {
  let rect = canvas.getBoundingClientRect();
  let c = Math.floor((e.clientX - rect.left) / (width / 3));
  let r = Math.floor((e.clientY - rect.top) / (height / 3));

  if (board[r][c] != empty) {
    return;
  }

  board[r][c] = player;
  drawLetter(player, r, c);

  computerMove();
}

function drawLetter(letter, r, c) {
  ctx.fillText(letter, c * width / 3 + width / 10, r * height / 3 + height / 4);
}

function gameWinner(b) {
  // rows
  for (var r = 0; r < 3; r++) {
    if (b[r][0] != empty && b[r][0] == b[r][1] && b[r][1] == b[r][2]) return b[r][0];
  }

  for (var c = 0; c < 3; c++) {
    if (b[0][c] != empty && b[0][c] == b[1][c] && b[1][c] == b[2][c]) return b[0][c];
  }

  if (b[1][1] != empty) {
    if (b[0][0] == b[1][1] && b[1][1] == b[2][2]) return b[1][1];
    if (b[2][0] == b[1][1] && b[1][1] == b[0][2]) return b[1][1];
  }

  return empty;
}

// TODO: move to own file
function computerMove() {
  document.getElementById("computerFirst").disabled = true;

  function duplicateBoard(board) {
    let newBoard = [];

    for (var r = 0; r < 3; r++) {
      newBoard[r] = [];

      for (var c = 0; c < 3; c++) {
        newBoard[r][c] = board[r][c];
      }
    }

    return newBoard;
  }

  function getMoves(board) {
    let moves = [];

    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        if (board[r][c] == empty) {
          moves.push({ r, c });
        }
      }
    }

    return moves;
  }

  function getRandom(array) {
    return array[Math.floor(Math.random() * array.length)]
  }

  let moves = getMoves(board);
  for (let move of moves) {
    move.wins = 0;
    move.losses = 0;
    move.ties = 0;
  }

  for (let simulationRun = 0; simulationRun < simulationRuns; simulationRun++) {
    let b = duplicateBoard(board);
    let eval = getRandom(moves);
    let move = eval;
    let turn = computer;

    while (move) {
      b[move.r][move.c] = turn;
      let winner = gameWinner(b);

      if (winner != empty) {
        if (winner == computer) eval.wins++;
        if (winner == player) eval.losses++;

        break;
      }

      move = getRandom(getMoves(b));
      if (!move) eval.ties++;

      turn = turn == computer ? player : computer;
    }
  }

  let bestMove = moves[0];

  for (let move of moves) {
    if (move.losses < bestMove.losses) {
      bestMove = move;
    }
    else if (move.losses == bestMove.losses) {
      if (move.wins > bestMove.wins) {
        bestMove = move;
      }
    }
  }

  board[bestMove.r][bestMove.c] = computer;
  drawLetter(computer, bestMove.r, bestMove.c);
}