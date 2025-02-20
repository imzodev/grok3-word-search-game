# Word Search Game

A modern, interactive word search puzzle game built with React, TypeScript, and Vite. Players can find programming-related words hidden in a grid of letters.

## Features

- 10x10 grid with randomly placed words
- Words can be placed in 8 different directions:
  - Horizontal (left to right and right to left)
  - Vertical (top to bottom and bottom to top)
  - Diagonal (all four diagonal directions)
- Interactive word selection with mouse drag
- Visual feedback for selected and found words
- Word list showing remaining and found words
- Built with modern React features and TypeScript for type safety

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS for styling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run the development server:
   ```bash
   bun run dev
   ```

## How to Play

1. Look for words from the word list in the grid
2. Click and drag your mouse over letters to select a word
3. If the selection matches a word from the list, it will be marked as found
4. Find all words to win!

## Development

This project uses Vite for fast development with HMR (Hot Module Replacement) and TypeScript for type safety. The game logic is split between the main `Game` component and utility functions for grid generation.
