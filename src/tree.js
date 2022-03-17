export const Tree = {
  
  getDescendants(node, func = f => true, self = false, result = []) {
    if (self && func(node)) {
      result.push(node);
    }
  
    for (let child of node.nextMoves) {
      getDescendants(child, func, true, result);
    }
  
    return result;
  },
  
  getAncestors(node, func = f => true, self = false, result = []) {
    if (self && func(node)) {
      result.push(node);
    }
  
    node = node.parent;
  
    while (node) {
      if (func(node)) {
        result.push(node);
      }
  
      node = node.parent;
    }
  
    return result;
  },
  
  flattenTree(node, result = []) {
    result.push(node);
  
    for (let child of node.nextMoves) {
      flattenTree(child, result);
    }
  
    return result;
  },
  
  compareBoard(b1, b2) {
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        if (b1[r][c] != b2[r][c]) {
          return false;
        }
      }
    }
  
    return true;
  },
  
  compareTree(n1, n2) {
    if (!compareBoard(n1.board, n2.board)) {
      return false;
    }
  
    if (n1.nextMoves.length != n2.nextMoves.length) {
      return false;
    }
  
    // note double enumeration of n1 and n2
    for (let i = 0; i < n1.nextMoves.length; i++) {
      if (!compareTree(n1.nextMoves[i], n2.nextMoves[i])) {
        return false;
      }
    }
  
    return true;
  },
};