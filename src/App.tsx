import { useState } from 'react';
import './App.css'
import Game from './Game'

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <button 
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 rounded"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
      <Game />
    </div>
  )
}

export default App
