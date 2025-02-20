export interface GridData {
  grid: string[][];
  wordPositions: Record<string, [number, number][]>;
}

export function generateGrid(wordList: string[], gridSize: number): GridData {
  // Initialize an empty grid
  const grid: string[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill('')
  );
  const wordPositions: Record<string, [number, number][]> = {};

  // Define possible directions: [dx, dy]
  const directions: [number, number][] = [
    [1, 0],  // Horizontal left to right
    [-1, 0], // Horizontal right to left
    [0, 1],  // Vertical top to bottom
    [0, -1], // Vertical bottom to top
    [1, 1],  // Diagonal top-left to bottom-right
    [-1, -1], // Diagonal bottom-right to top-left
    [1, -1], // Diagonal top-right to bottom-left
    [-1, 1], // Diagonal bottom-left to top-right
  ];

  // Place each word in the grid
  for (const word of wordList) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
      const len = word.length - 1;
      const rowRange =
        dy > 0
          ? gridSize - len * dy
          : dy < 0
          ? len
          : gridSize - 1;
      const colRange =
        dx > 0
          ? gridSize - len * dx
          : dx < 0
          ? len
          : gridSize - 1;

      const startRow = Math.floor(Math.random() * (rowRange + 1));
      const startCol = Math.floor(Math.random() * (colRange + 1));
      const positions: [number, number][] = [];
      let canPlace = true;

      // Check if the word can be placed
      for (let i = 0; i < word.length; i++) {
        const row = startRow + i * dy;
        const col = startCol + i * dx;
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
          canPlace = false;
          break;
        }
        const current = grid[row][col];
        if (current !== '' && current !== word[i]) {
          canPlace = false;
          break;
        }
        positions.push([row, col]);
      }

      // Place the word if possible
      if (canPlace) {
        positions.forEach(([row, col], i) => {
          grid[row][col] = word[i];
        });
        wordPositions[word] = positions;
        placed = true;
      }
      attempts++;
    }

    if (!placed) {
      throw new Error(`Could not place word: ${word}`);
    }
  }

  // Fill remaining spaces with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === '') {
        grid[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, wordPositions };
}