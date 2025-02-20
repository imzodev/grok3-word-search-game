import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import type { GameScore } from './supabaseClient';

// Utility function to generate the grid
interface GridData {
  grid: string[][];
  wordPositions: { [key: string]: [number, number][] };
}

const generateGrid = (words: string[], size: number): GridData => {
  const grid = Array(size).fill(null).map(() => Array(size).fill(''));
  const wordPositions: { [key: string]: [number, number][] } = {};

  // Define all possible directions
  const directions: [number, number][] = [
    [1, 0],   // down
    [-1, 0],  // up
    [0, 1],   // right
    [0, -1],  // left
    [1, 1],   // down-right
    [-1, -1], // up-left
    [1, -1],  // down-left
    [-1, 1],  // up-right
  ];

  // Place each word
  words.forEach(word => {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
      const L = word.length;

      // Determine valid starting ranges
      const row_min = dr > 0 ? 0 : dr < 0 ? L - 1 : 0;
      const row_max = dr > 0 ? size - L : dr < 0 ? size - 1 : size - 1;
      const col_min = dc > 0 ? 0 : dc < 0 ? L - 1 : 0;
      const col_max = dc > 0 ? size - L : dc < 0 ? size - 1 : size - 1;

      if (row_min > row_max || col_min > col_max) {
        attempts++;
        continue;
      }

      const r = Math.floor(Math.random() * (row_max - row_min + 1)) + row_min;
      const c = Math.floor(Math.random() * (col_max - col_min + 1)) + col_min;

      // Check if the word can be placed
      let canPlace = true;
      const positions: [number, number][] = [];
      for (let i = 0; i < L; i++) {
        const nr = r + i * dr;
        const nc = c + i * dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
          canPlace = false;
          break;
        }
        const currentLetter = grid[nr][nc];
        if (currentLetter !== '' && currentLetter !== word[i]) {
          canPlace = false;
          break;
        }
        positions.push([nr, nc]);
      }

      if (canPlace) {
        positions.forEach(([nr, nc], i) => {
          grid[nr][nc] = word[i];
        });
        wordPositions[word] = positions;
        placed = true;
      }
      attempts++;
    }

    if (!placed) {
      console.error(`Could not place word: "${word}" after ${maxAttempts} attempts`);
    }
  });

  // Fill empty cells with random letters
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (grid[i][j] === '') {
        grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, wordPositions };
};

import wordPool from './wordList.json';
const gridSize: number = 10;
const numWordsToSelect: number = 6;

// Utility to compare arrays
function arraysEqual(a: [number, number][], b: [number, number][]): boolean {
  if (a.length !== b.length) return false;
  return a.every(([r1, c1], i) => r1 === b[i][0] && c1 === b[i][1]);
}

// WordList Component
interface WordListProps {
  wordList: string[];
  foundWords: string[];
}

const WordList: React.FC<WordListProps> = ({ wordList, foundWords }) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold">Words to Find:</h2>
      <div className="flex flex-wrap gap-4">
        {wordList.map((word) => (
          <p
            key={word}
            className={`text-lg ${
              foundWords.includes(word) ? 'line-through text-gray-500' : ''
            }`}
          >
            {word}
          </p>
        ))}
      </div>
    </div>
  );
};

// Grid Component
interface GridProps {
  grid: string[][];
  selectedCells: [number, number][];
  foundCells: [number, number][];
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
}

const Grid: React.FC<GridProps> = React.memo(({ grid, selectedCells, foundCells, onCellMouseDown, onCellMouseEnter }) => {
  return (
    <div className="grid grid-cols-10 gap-1">
      {grid.map((row, rowIndex) =>
        row.map((letter, colIndex) => {
          const isSelected = selectedCells.some(([r, c]) => r === rowIndex && c === colIndex);
          const isFound = foundCells.some(([r, c]) => r === rowIndex && c === colIndex);
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`w-8 h-8 flex items-center justify-center text-lg font-semibold cursor-pointer select-none ${
                isFound ? 'bg-green-200' : isSelected ? 'bg-blue-200' : 'bg-gray-100'
              }`}
              onMouseDown={() => onCellMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => onCellMouseEnter(rowIndex, colIndex)}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
});

// Main Game Component
type GameState = 'notStarted' | 'playing' | 'completed';

interface LeaderboardEntry extends GameScore {
  rank?: number;
}

const Game: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState<GameState>('notStarted');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [currentWords, setCurrentWords] = useState<string[]>([]);
  const { grid, wordPositions } = useMemo(
    () => currentWords.length ? generateGrid(currentWords, gridSize) : { grid: [], wordPositions: {} },
    [currentWords]
  );
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);

  useEffect(() => {
    let timer: number;
    if (gameState === 'playing') {
      timer = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState]);

  // Load leaderboard on mount
  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .order('completion_time', { ascending: true })
        .limit(10);

      if (error) throw error;

      const rankedData = data.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      setLeaderboard(rankedData);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    }
  };

  const saveScore = async () => {
    setIsLoading(true);
    try {
      // First, check if user already exists
      const { data: existingUser } = await supabase
        .from('game_scores')
        .select('completion_time')
        .eq('username', username)
        .single();

      const scoreData: GameScore = {
        username,
        completion_time: finalTime,
        found_words: foundWords
      };

      if (existingUser) {
        // Only update if new time is better
        if (finalTime < existingUser.completion_time) {
          const { error } = await supabase
            .from('game_scores')
            .update(scoreData)
            .eq('username', username);

          if (error) throw error;
          setError('');
        } else {
          setError(`Your best time remains ${formatTime(existingUser.completion_time)}`);
        }
      } else {
        // Insert new score
        const { error } = await supabase
          .from('game_scores')
          .insert([scoreData]);

        if (error) throw error;
        setError('');
      }

      await loadLeaderboard(); // Refresh leaderboard after saving
    } catch (err) {
      console.error('Error saving score:', err);
      setError('Failed to save score');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (foundWords.length === currentWords.length && gameState === 'playing') {
      // Game completed
      setGameState('completed');
      setFinalTime(elapsedTime);
    }
  }, [foundWords, currentWords, gameState, elapsedTime]);

  // Save score when game is completed and finalTime is set
  useEffect(() => {
    if (gameState === 'completed' && finalTime > 0) {
      saveScore();
    }
  }, [gameState, finalTime]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (!isSelecting) return;
      setIsSelecting(false);
      const forwardString = selectedCells.map(([r, c]) => grid[r][c]).join('');
      const reverseString = [...selectedCells].reverse().map(([r, c]) => grid[r][c]).join('');

      for (const word of currentWords) {
        if (!foundWords.includes(word) && (forwardString === word || reverseString === word)) {
          const positions = wordPositions[word];
          const reversePositions = [...positions].reverse();
          if (arraysEqual(selectedCells, positions) || arraysEqual(selectedCells, reversePositions)) {
            setFoundWords(prev => [...prev, word]);
          }
        }
      }
      setSelectedCells([]);
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isSelecting, selectedCells, foundWords, grid, wordPositions]);

  const onCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setStartCell([row, col]);
    setSelectedCells([[row, col]]);
  };

  const onCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !startCell) return;
    const [startRow, startCol] = startCell;
    const dr = row - startRow;
    const dc = col - startCol;
    let step: [number, number];
    let numSteps: number;

    if (dr === 0 && dc !== 0) { // Horizontal
      step = [0, dc > 0 ? 1 : -1];
      numSteps = Math.abs(dc);
    } else if (dc === 0 && dr !== 0) { // Vertical
      step = [dr > 0 ? 1 : -1, 0];
      numSteps = Math.abs(dr);
    } else if (Math.abs(dr) === Math.abs(dc)) { // Diagonal
      step = [dr > 0 ? 1 : -1, dc > 0 ? 1 : -1];
      numSteps = Math.abs(dr);
    } else {
      return;
    }

    const cells: [number, number][] = [];
    for (let i = 0; i <= numSteps; i++) {
      const newRow = startRow + i * step[0];
      const newCol = startCol + i * step[1];
      if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
        cells.push([newRow, newCol]);
      }
    }
    setSelectedCells(cells);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectRandomWords = () => {
    const shuffled = [...wordPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numWordsToSelect);
  };

  const validateUsername = (name: string): boolean => {
    if (name.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return false;
    }
    if (name.length > 24) {
      setUsernameError('Username must be less than 24 characters long');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
      setUsernameError('Username can only contain letters and numbers');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (value) {
      validateUsername(value);
    } else {
      setUsernameError('');
    }
  };

  const handleStartGame = () => {
    if (!validateUsername(username)) {
      return;
    }
    const selectedWords = selectRandomWords();
    setCurrentWords(selectedWords);
    setGameState('playing');
    setElapsedTime(0);
    setFoundWords([]);
    setFinalTime(0);
  };

  const foundCells = foundWords.flatMap(word => wordPositions[word]);

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Word Search Game</h1>
      
      {gameState === 'notStarted' && (
        <div className="text-center w-full max-w-md">
          <div className="mb-6">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-lg"
            />
            {usernameError && (
              <p className="text-red-500 text-sm mt-2">{usernameError}</p>
            )}
          </div>
          <button
            onClick={handleStartGame}
            disabled={!username || !!usernameError}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-8 ${(!username || !!usernameError) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Start Game
          </button>

          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h2>
            {isLoading ? (
              <p className="text-gray-600">Loading leaderboard...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-gray-600">No scores yet. Be the first to play!</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl" role="img" aria-label={`Rank ${entry.rank}`}>
                        {getRankEmoji(entry.rank!)}
                      </span>
                      <span className="font-medium text-gray-800">{entry.username}</span>
                    </div>
                    <span className="text-gray-600">{formatTime(entry.completion_time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div className="text-center mb-4">
            <p className="text-xl font-bold">Time: {formatTime(elapsedTime)}</p>
          </div>
          <Grid
            grid={grid}
            selectedCells={selectedCells}
            foundCells={foundCells}
            onCellMouseDown={onCellMouseDown}
            onCellMouseEnter={onCellMouseEnter}
          />
          <WordList wordList={currentWords} foundWords={foundWords} />
        </>
      )}

      {gameState === 'completed' && (
        <div className="text-center">
          <div className="bg-green-100 rounded-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              Congratulations, {username}!
            </h2>
            <p className="text-xl text-green-600 mb-6">
              Amazing job! You completed the game in {formatTime(finalTime)}!
            </p>
            <p className="text-lg text-green-600 mb-6">
              Your problem-solving skills are impressive. Want to challenge yourself again?
            </p>
            {isLoading ? (
              <p className="text-blue-600 mb-4">Saving your score...</p>
            ) : error ? (
              <p className="text-red-600 mb-4">{error}</p>
            ) : (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-700 mb-3">Leaderboard</h3>
                <div className="bg-white rounded-lg shadow p-4 max-h-60 overflow-y-auto">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex justify-between items-center py-2 ${entry.username === username ? 'bg-green-50' : ''}`}
                    >
                      <span className="font-bold">#{entry.rank}</span>
                      <span className="mx-4">{entry.username}</span>
                      <span>{formatTime(entry.completion_time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleStartGame}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;