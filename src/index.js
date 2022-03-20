const width = 400;
const height = 400;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const maxRuns = 2000;

const empty = ' ';
const state = {};

canvas.width = width;
canvas.height = height;

ctx.lineWidth = 10;
ctx.font = '90px tahoma';

initialize();

document.getElementById("newGame").onclick = e => initialize();

document.getElementById("computerFirst").onclick = e => {
  [state.human, state.computer] = [state.computer, state.human];

  computerMove();
};

function initialize() {
  state.human = 'X';
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
    setBoardSquare(state.human, move.r, move.c);
    computerMove();
  }
};

function setBoardSquare(player, r, c) {
  state.board[r][c] = player;

  ctx.fillText(player, c * width / 3 + width / 10, r * height / 3 + height / 4);
}

function gameWinner(board, player) {
  return (
    (board[0][0] == player && board[0][1] == player && board[0][2] == player) || // row1
    (board[1][0] == player && board[1][1] == player && board[1][2] == player) || // row2
    (board[2][0] == player && board[2][1] == player && board[2][2] == player) || // row3
    (board[0][0] == player && board[1][0] == player && board[2][0] == player) || // col1
    (board[0][1] == player && board[1][1] == player && board[2][1] == player) || // col2
    (board[0][2] == player && board[1][2] == player && board[2][2] == player) || // col3
    (board[0][0] == player && board[1][1] == player && board[2][2] == player) || // diag1
    (board[0][2] == player && board[1][1] == player && board[2][0] == player)    // diag2
  ) ? player : empty;
}

function duplicateBoard(board) {
  let newBoard = [];

  for (let r = 0; r < 3; r++) {
    newBoard[r] = [];

    for (let c = 0; c < 3; c++) {
      newBoard[r][c] = board[r][c];
    }
  }

  return newBoard;
}

function getMoves(board) {
  let moves = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
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
    child.winner = gameWinner(child.board, p1);
    child.nextMoves = [];

    if (child.winner == empty) {
      buildTree(child, p2, p1, depth + 1);
    }
  }
}

// test minimax
{
  let head = {
    board: [
      ['-', '-', '-'],
      ['X', ' ', 'X'],
      [' ', '-', '-'],
    ]
  }

  buildTree(head, state.computer, state.human);

  let best = minimax(head, state.human)

  debugger;
}

function minimax(node, lastPlayer, depth = 0) {
  depth++;

  if (node.winner == state.computer) {
    node.score = 1000 - depth;
    return node;
  }

  if (node.winner == state.human) {
    node.score = depth - 1000;
    return node;
  }

  if (node.nextMoves.length == 0) {
    node.score = 0;
    return node;
  }

  if (lastPlayer == state.computer) {
    let best = { score: -Infinity };

    for (let move of node.nextMoves) {
      if (minimax(move, state.human, depth).score > best.score){
        best = move;
      }
    }

    return best;
  }
  else { /* minimizing player */
    let best = { score: Infinity };

    for (let move of node.nextMoves) {
      if (minimax(move, state.computer, depth).score < best.score) {
        best = move;
      }
    }
    return best;
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
    buildTree(head, state.computer, state.human);

    drawTree(head);

    // TODO: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning

    best.move = minimax(head, state.computer);
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
        let winner = gameWinner(board, turn);

        if (winner != empty) {
          if (winner == state.computer) {
            test.wins++;
          }
          if (winner == state.human) {
            test.losses++;
          }

          break;
        }

        move = getRandom(getMoves(board));
        if (!move) {
          test.ties++;
        }

        turn = turn == state.computer ? state.human : state.computer;
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

function drawTree(node, depth = Infinity) {
  let tc = document.getElementById('treeCanvas');
  
  if (!tc) {
    tc = document.createElement('canvas');

    tc.id = 'treeCanvas';
    tc.width = 800;
    tc.height = 600;

    document.body.appendChild(tc);
  }

  let c = tc.getContext("2d");

  c.fillStyle = 'grey';
  c.fillRect(0, 0, tc.width, tc.height);

  drawNode(node, tc.width / 2 - 20, 10);

  let row = [];
  for (let i = 0; i < node.nextMoves.length; i++) {
    drawNode(node.nextMoves[i], i * tc.width / 9 + 20, 120);

    //for (let j = 0; j < node.nextMoves[i].length; j++)
  }
}

function drawNode(node, x, y) {
  let tc = document.getElementById('treeCanvas');
  let tcx = tc.getContext("2d");

  tcx.font = '12px tahoma';
  tcx.fillStyle = 'black';

  var mm = minimax(node, node.player == state.computer);

  tcx.fillText(`${mm}`, x + 5, y);

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let chr = node.board[r][c];

      if (chr == ' ') chr = '_';

      var mmc= minimax(node, node.player == state.computer);
      tcx.fillText(`${mmc}`, x + 5, y);
      tcx.fillText(chr, x + 5 + (c * 14), y + 10 + (r * 14));
    }
  }
}
