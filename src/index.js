const width = 400;
const height = 400;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const maxRuns = 1000;

const empty = ' ';
const state = {};

canvas.width = width;
canvas.height = height;

ctx.lineWidth = 10;
ctx.font = '90px tahoma';

initialize();

document.getElementById("newGame").onclick = e => initialize();

document.getElementById("computerFirst").onclick = e => {
  [state.player, state.computer] = [state.computer, state.player];

  computerMove();
};

function initialize() {
  state.player = 'X';
  state.computer = 'O';
  state.board = [
    [empty, empty, empty],
    [empty, empty, empty],
    [empty, empty, empty],
  ];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let line = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  for (let i = height / 3; i < height; i += height / 3) {
    line(1, i, width, i);
  }

  for (let i = width / 3; i < width; i += width / 3) {
    line(i, 1, i, height);
  }

  document.getElementById("computerFirst").disabled = false;
}

function screenToMove(e) {
  let rect = canvas.getBoundingClientRect();
  let c = Math.floor((e.clientX - rect.left) / (width / 3));
  let r = Math.floor((e.clientY - rect.top) / (height / 3));

  return { r, c };
}

canvas.onmousemove = e => {
  let move = screenToMove(e);

  canvas.style.cursor = state.board[move.r][move.c] == ' ' ? 'pointer' : 'auto';
};

canvas.onclick = e => {
  let move = screenToMove(e);

  if (state.board[move.r][move.c] == empty) {
    setBoardSquare(state.player, move.r, move.c);
    computerMove();
  }
};

function setBoardSquare(player, r, c) {
  state.board[r][c] = player;

  ctx.fillText(player, c * width / 3 + width / 10, r * height / 3 + height / 4);
}

function gameWinner(board) {
  // rows
  for (var r = 0; r < 3; r++) {
    if (board[r][0] != empty && board[r][0] == board[r][1] && board[r][1] == board[r][2]) {
      return board[r][0];
    }
  }

  // cols
  for (var c = 0; c < 3; c++) {
    if (board[0][c] != empty && board[0][c] == board[1][c] && board[1][c] == board[2][c]) {
      return board[0][c];
    }
  }

  // diags
  if (board[1][1] != empty) {
    if (board[0][0] == board[1][1] && board[1][1] == board[2][2]) {
      return board[1][1];
    }

    if (board[2][0] == board[1][1] && board[1][1] == board[0][2]) {
      return board[1][1];
    }
  }

  return empty;
}

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

function buildTree(node, p1, p2, depth = 1) {
  node.nextMoves = [];

  for (let child of getMoves(node.board)) {
    node.nextMoves.push(child);
    child.parent = node;
    child.depth = depth;
    child.move = { r: child.r, c: child.c, p: p1 };
    child.board = duplicateBoard(node.board);
    child.board[child.r][child.c] = p1;
    child.winner = gameWinner(child.board);
    child.nextMoves = [];

    if (child.winner == empty) {
      buildTree(child, p2, p1, depth + 1);
    }
  }
}

function minimax(node, depth = Infinity, maximizingPlayer = true) {
  if (node.winner != empty) {
    return node.winner == state.computer ? 1 : -1;
  }

  if (node.nextMoves.length == 0 || depth == 0) {
    return 0;
  }

  if (maximizingPlayer) {
    let value = -Infinity;

    for (let child of node.nextMoves) {
      value = Math.max(value, minimax(child, depth - 1, false));
    }

    return value;
  }
  else { /* minimizing player */
    let value = Infinity;

    for (let child of node.nextMoves) {
      value = Math.min(value, minimax(child, depth - 1, true));
    }

    return value;
  }
}

// TODO: move to own file
// stats: http://www.se16.info/hgb/tictactoe.htm
function computerMove() {
  document.getElementById("computerFirst").disabled = true;

  let engine = document.querySelector('input[name=engine]:checked').value;
  let best = {};

  if (engine == "minimax") {
    // https://en.wikipedia.org/wiki/Minimax#Minimax_algorithm_with_alternate_moves

    let head = { board: duplicateBoard(state.board) };
    buildTree(head, state.computer, state.player);

    // TODO: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning

    best.value = Infinity;

    for (let move of head.nextMoves) {
      let value = minimax(move);

      if (value < best.value) {
        best.value = value;
        best.move = move;
      }
    }
  }
  else if (engine == "mcts") {
    // https://en.wikipedia.org/wiki/Monte_Carlo_tree_search

    let moves = getMoves(state.board);
    for (let move of moves) {
      move.wins = 0;
      move.losses = 0;
      move.ties = 0;
    }

    for (let run = 0; run < maxRuns; run++) {
      let board = duplicateBoard(state.board);
      let test = getRandom(moves);
      let move = test;
      let turn = state.computer;

      while (move) {
        board[move.r][move.c] = turn;
        let winner = gameWinner(board);

        if (winner != empty) {
          if (winner == state.computer) {
            test.wins++;
          }
          if (winner == state.player) {
            test.losses++;
          }

          break;
        }

        move = getRandom(getMoves(board));
        if (!move) {
          test.ties++;
        }

        turn = turn == state.computer ? state.player : state.computer;
      }
    }

    best.move = moves[0];

    for (let move of moves) {
      if (move.losses < best.move.losses) {
        best.move = move;
      }
      else if (move.losses == best.move.losses) {
        if (move.wins > best.move.wins) {
          best.move = move;
        }
        else if (move.wins == best.move.wins) {
          if (move.ties > best.move.ties) {
            best.move = move;
          }
        }
      }
    }
  }

  setBoardSquare(state.computer, best.move.r, best.move.c);
}
