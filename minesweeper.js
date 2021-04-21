const ROWS = 9;
const COLUMNS = 9;
const NUMBER_OF_MINES = 10;

const MINE_EMOJI = "💣";
const FLAG_EMOJI = "🚩";

/*
  Coordinates for rows and columns:
      Row 0 is top-most row
      Column 0 is left-most column
*/

// Helper functions
function getRandomCoordinates() {
  const coordinates = [];
  while (coordinates.length < NUMBER_OF_MINES) {
    const temp = Math.floor(Math.random() * (ROWS * COLUMNS));
    if (!coordinates.includes(temp)) {
      coordinates.push(temp);
    }
  }

  return coordinates.map(num => {
    const r = Math.floor(num / ROWS);
    const c = num % COLUMNS;
    return [r, c];
  })
}

function getAllNeighbours([r, c]) {
  /*
  
     NW | N | NE
    ----|---|----
     W  | C |  E
    ----|---|----
     SW | S | SE

    C is the cell
    N is North
    E is East
    S is South
    W is West
    
  */

  const allNeighbors = [];

  // r is row coordinate
  // c is column coordinate

  // N
  allNeighbors.push([r - 1, c]);

  // NE
  allNeighbors.push([r - 1, c + 1]);

  // E
  allNeighbors.push([r, c + 1]);

  // SE
  allNeighbors.push([r + 1, c + 1]);

  // S
  allNeighbors.push([r + 1, c]);

  // SW
  allNeighbors.push([r + 1, c - 1]);

  // W
  allNeighbors.push([r, c - 1]);

  // NW
  allNeighbors.push([r - 1, c - 1]);

  // discard neighbors thxt have coordinates that are 
  // negative or bigger than ROW or COLUMN
  return allNeighbors.filter(([x, y]) => {
    if ((x < 0) || (y < 0) || (x >= ROWS) || (y >= COLUMNS)) {
      return false;
    }
    return true;
  });
}

function getNoneMineNeighboursOnly([r, c], gameDataStr) {
  const neighbors = getAllNeighbours([r, c]);
  neighbors.filter(() => !gameDataStr.containsMine);
  return neighbors;
}

function getNoneMineUnrevealedNeighborsOnly([r, c], gameDataStr){
  const noneMineNeighbors = getNoneMineNeighboursOnly([r, c], gameDataStr);
  const unrevealedNeighbors = noneMineNeighbors.filter(([r, c]) => !gameDataStr[r][c].revealed);
  return unrevealedNeighbors;
}

function getCoordinatesFromCellId(cellId){
  const coordinates = cellId.split("_");
  const r = parseInt(coordinates[0]);
  const c = parseInt(coordinates[1]);
  return [r, c];
}

function createBlankGameDataStructure() {
  const GameDataStr = []
  
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLUMNS; c++) {
      const cell = {}
      cell.coordinate = [r, c];
      cell.revealed = false;
      cell.flagged = false;
      cell.containsMine = false;
      cell.numNeighborsThatAreMines = 0;

      row.push(cell);
    }
    GameDataStr.push(row);
  }
  return GameDataStr;
}

function addMinesToGameGridDataStructure(blankGameDataStr) {
  const gameDataStr = blankGameDataStr;
  // randomly choose grid cells that will contain mines
  const randomCoordinates = getRandomCoordinates();
  
  randomCoordinates.forEach(([r, c]) => {
    gameDataStr[r][c].containsMine = true;
    // add the numbers that are the clues for all neighbors of each mine
    const neighbors = getAllNeighbours([r, c]);
    neighbors.forEach(([x, y]) => {
      gameDataStr[x][y].numNeighborsThatAreMines += 1;
    })
  })

  return gameDataStr;
}

function buildGameGridHTML(GameDataStr) {
  const mainDiv = document.createElement("div");
  mainDiv.classList.add("board");
  mainDiv.setAttribute("id", "board");

  GameDataStr.map((row, r) => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("gamegrid_row");

    row.map((col, c) => {
      const cellSpan = document.createElement("span");
      cellSpan.classList.add("gamegrid_cell");
      cellSpan.setAttribute("id", `${r}_${c}`);

      // for debugging purposes 
      /////////////////////////////////////////////////////
      // if(GameDataStr[r][c].containsMine){
      //   cellSpan.innerHTML = MINE_EMOJI;
      // }
      // // // console.log(`${r}_${c}`)
      // else if(GameDataStr[r][c].numNeighborsThatAreMines > 0){
      //   cellSpan.innerHTML = GameDataStr[r][c].numNeighborsThatAreMines;
      // } 
      // else {
      //   cellSpan.innerHTML = `${r},${c}`;
      // }
      /////////////////////////////////////////////////////

      rowDiv.appendChild(cellSpan);
    })

    mainDiv.appendChild(rowDiv);
  });

  return mainDiv;
}

// Setup Game
// Populate game data structure, hide mines, mount the divs and spans
function startNewGame(){
  const blankGameDataStr = createBlankGameDataStructure();
  const gameDataStr = addMinesToGameGridDataStructure(blankGameDataStr)
  const gameHTML = buildGameGridHTML(gameDataStr);

  const gameGridMountPoint = document.getElementById("gamegrid");
  gameGridMountPoint.appendChild(gameHTML);


  gameGridMountPoint.addEventListener("contextmenu", (event) => {
    // Allow player to flag and unflag mines using right click
    event.preventDefault();
    const cellHTMLNode = event.target;
    const [r, c] = getCoordinatesFromCellId(cellHTMLNode.id);

    if(gameDataStr[r][c].revealed){
      return;
    }

    const isFlagged = gameDataStr[r][c].flagged;

    if(isFlagged){
      gameDataStr[r][c].flagged = false;
      cellHTMLNode.innerText = " ";
      cellHTMLNode.classList.remove("flagged_cell");
    } else {
      gameDataStr[r][c].flagged = true;
      cellHTMLNode.innerText = FLAG_EMOJI;
      cellHTMLNode.classList.add("flagged_cell");
    }
  });

  gameGridMountPoint.addEventListener("click", (event) => {
    // console.log("clicked ", event.target.id)
    const cellHTMLNode = event.target;
    const [r, c] = getCoordinatesFromCellId(cellHTMLNode.id);

    revealCell([r, c], gameDataStr);

    checkIfGameWon(gameDataStr);
  })
}

function removeGameGridEventListeners() {
  const gameGridMountPoint = document.getElementById("gamegrid");
  const newGameGridMountPoint = gameGridMountPoint.cloneNode(true);
  gameGridMountPoint.parentNode.replaceChild(newGameGridMountPoint, gameGridMountPoint);
}


// GAME PLAY FUNCTIONS

function revealCell([r, c], gameDataStr) {
  console.log(`reveal cell ([${r}, ${c}]) called`);

  if((r === NaN) && (c === NaN)){
    // click was not in a cell
    return;
  }
  
  const cell = gameDataStr[r][c];
  const cellHTMLNode = document.getElementById(`${r}_${c}`);

  // if the cell has already been revealed or flagged, do nothing
  if (cell.revealed || cell.flagged) {
    console.log("cell already revealed or flagged")
    return;
  }

  cell.revealed = true;

  // if it is a mine => game over, player loses
  if (cell.containsMine) {
    cellHTMLNode.innerText = MINE_EMOJI;
    cellHTMLNode.classList.add("exploded_mine");

    // TODO Show player all other mines

    const gameOverLoseDiv = document.getElementById("gameover_lose");
    gameOverLoseDiv.style.display = "block";
    gameOverLoseDiv.scrollIntoView({ behavior: "smooth" })
    
    removeGameGridEventListeners()
    console.log("You have lost")
    return;
  }

  // if cell has a number greater than 0 for neighbors that are mines, 
  // reveal on DOM and do nothing
  if (cell.numNeighborsThatAreMines > 0) {
    cellHTMLNode.classList.add("revealed_cell_with_number");
    cellHTMLNode.innerHTML = cell.numNeighborsThatAreMines;
    return;
  }

  // if it has 0 neighbors that are mines, reveal, for each unrevealed neighbor reveal recursively
  if (cell.numNeighborsThatAreMines === 0) {
    cellHTMLNode.classList.add("revealed_blank");

    // console.log("cell is blank, starting loop")
    const neighbors = getNoneMineUnrevealedNeighborsOnly([r, c], gameDataStr);
    // console.log("neighbors are")
    // console.log(neighbors)
    while (neighbors.length > 0) {
      console.log(`neighbors are ${JSON.stringify(neighbors)}`)
      const [firstNeighbour_r, firstNeighbour_c] = neighbors.shift();
      console.log(`first neighbor is [${firstNeighbour_r}, ${firstNeighbour_c}]`)
      if (gameDataStr[firstNeighbour_r][firstNeighbour_c].numNeighborsThatAreMines === 0) {
        // console.log("adding new neighbours")
        neighbors.concat(
          getNoneMineUnrevealedNeighborsOnly([firstNeighbour_r, firstNeighbour_c], gameDataStr)
        );
      }
      revealCell([firstNeighbour_r, firstNeighbour_c], gameDataStr)
    }
  }
}


function checkIfGameWon(gameDataStr) {
  console.log(gameDataStr === undefined);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      if ((!gameDataStr[r][c].revealed) && (!gameDataStr[r][c].containsMine)) {
        // if there is one or more unrevealed cell that don't contain mines
        return false;
      }
    }
  }

  // Player has won the game
  const gameOverDiv = document.getElementById("gameover_win");
  gameOverDiv.style.display = "block";
  gameOverDiv.scrollIntoView({ behavior: "smooth" })

  removeGameGridEventListeners()
}


document.getElementById("restart_button").addEventListener("click", () => {
  document.getElementById("gameover_win").style.display = "none";
  document.getElementById("gameover_lose").style.display = "none";
  document.getElementsByTagName("h1")[0].scrollIntoView({ behavior: "smooth" });
  const gameBoard = document.getElementById("board");
  if(gameBoard){
    gameBoard.remove()
  }
  startNewGame();
})

startNewGame();



