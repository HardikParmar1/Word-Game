import React, { useState, useEffect, useCallback, useRef } from "react";
import { Play, RefreshCw, Settings, Award, Clock, Zap, Volume2, VolumeX } from 'lucide-react';
import correctWordSound from './sounds/correct-word.mp3';
import incorrectWordSound from './sounds/incorrect-word.mp3';
import "./styles.css";

// Random letter generator function
const generateRandomLetter = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
};

// Function to generate a random grid
const generateGrid = (rows, cols) => {
  const grid = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(generateRandomLetter());
    }
    grid.push(row);
  }
  return grid;
};

const WordGame = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gridLetters, setGridLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [gridSize, setGridSize] = useState(5);
  const [timerClass, setTimerClass] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [highscore, setHighscore] = useState(localStorage.getItem("highscore") || 0);
  const [isMuted, setIsMuted] = useState(false);

  // Sound effect references
  const correctSoundRef = useRef(new Audio(correctWordSound));
  const incorrectSoundRef = useRef(new Audio(incorrectWordSound));

  // Mute/Unmute toggle
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Ensure sound refs are configured
  useEffect(() => {
    if (correctSoundRef.current) {
      correctSoundRef.current.volume = isMuted ? 0 : 0.5;
    }
    if (incorrectSoundRef.current) {
      incorrectSoundRef.current.volume = isMuted ? 0 : 0.5;
    }
  }, [isMuted]);

  // Generate grid when component mounts or grid size changes
  useEffect(() => {
    setGridLetters(generateGrid(gridSize, gridSize));
  }, [gridSize]);

  // Timer and game logic
  useEffect(() => {
    let countdown;
    if (gameStarted && timer > 0) {
      countdown = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(countdown);
            endGame();
            return 0;
          }
          if (prevTimer <= 10) {
            setTimerClass("low");
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [gameStarted, timer]);

  const handleLetterClick = (letter, row, col) => {
    const existingIndex = selectedLetters.findIndex((l) => l.row === row && l.col === col);
    if (existingIndex !== -1) {
      setSelectedLetters(selectedLetters.filter((_, index) => index !== existingIndex));
      return;
    }

    // Allow selecting any letter without adjacency restriction
    setSelectedLetters([...selectedLetters, { letter, row, col }]);
  };

  const validateWord = async (word) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      const data = await response.json();

      if (data.title !== "No Definitions Found") {
        const points = Math.max(word.length * 10, 10);
        if (!foundWords.includes(word)) {
          // Play correct word sound
          try {
            if (!isMuted) {
              correctSoundRef.current.currentTime = 0;
              correctSoundRef.current.play();
            }
          } catch (soundError) {
            console.error("Sound playback error:", soundError);
          }

          setFoundWords([...foundWords, word]);
          setScore(prevScore => prevScore + points);
        } else {
          alert("You've already found this word!");
        }
      } else {
        // Play incorrect word sound
        try {
          if (!isMuted) {
            incorrectSoundRef.current.currentTime = 0;
            incorrectSoundRef.current.play();
          }
        } catch (soundError) {
          console.error("Sound playback error:", soundError);
        }

        const points = Math.max(word.length * 5, 5);
        setScore(prevScore => Math.max(0, prevScore - points));
      }
    } catch (error) {
      console.log("Error fetching word definition:", error);
    }
    setIsLoading(false);
  };

  const handleSubmitWord = () => {
    const wordFormed = selectedLetters.map((l) => l.letter).join("");
    if (wordFormed.length >= 3) {
      validateWord(wordFormed);
    } else {
      alert("The word must be at least 3 letters long!");
    }
    setSelectedLetters([]);
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimer(60);
    setFoundWords([]);
    setSelectedLetters([]);
  };

  const endGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(true);
    if (score > highscore) {
      setHighscore(score);
      localStorage.setItem("highscore", score);
    }
  }, [score, highscore]);

  const isSelected = (row, col) =>
    selectedLetters.some((l) => l.row === row && l.col === col);

  const renderGameBoard = () => (
    <div className="game-board">
      <div className="game-stats">
        <div className={`timer ${timerClass}`}>
          <Clock size={20} /> {timer}s
        </div>
        <div className="score">
          <Zap size={20} /> Score: {score}
        </div>
        <div className="sound-control">
          <button onClick={toggleMute} className="mute-btn">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

      <div className={`grid grid-${gridSize}`}>
        {gridLetters.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((letter, colIndex) => (
              <button
                key={colIndex}
                className={`letter ${isSelected(rowIndex, colIndex) ? "selected" : ""}`}
                onClick={() => handleLetterClick(letter, rowIndex, colIndex)}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="game-controls">
        <button 
          onClick={handleSubmitWord} 
          disabled={selectedLetters.length === 0}
          className="submit-word-btn"
        >
          Submit Word
        </button>
      </div>

      <div className="found-words">
        <h3>Found Words:</h3>
        {isLoading ? (
          <p>Validating...</p>
        ) : (
          foundWords.map((word, index) => (
            <p key={index} className="word-found">
              {word}
            </p>
          ))
        )}
      </div>
    </div>
  );

  const renderStartScreen = () => (
    <div className="start-screen">
      <h1>Word Finder Game</h1>
      <div className="game-settings">
        <div className="grid-size-selector">
          <label>Grid Size: </label>
          <select 
            onChange={(e) => setGridSize(parseInt(e.target.value))} 
            value={gridSize}
          >
            <option value={5}>5x5</option>
            <option value={6}>6x6</option>
            <option value={7}>7x7</option>
          </select>
        </div>
      </div>
      <div className="highscore">
        <Award size={24} /> Highscore: {highscore}
      </div>
      <button className="start-game-btn" onClick={startGame}>
        <Play size={24} /> Start Game
      </button>
    </div>
  );

  const renderGameOverScreen = () => (
    <div className="game-over-screen">
      <h2>Game Over!</h2>
      <p>Your Score: {score}</p>
      <p>Highscore: {highscore}</p>
      <div className="game-over-actions">
        <button onClick={startGame}>
          <RefreshCw size={20} /> Play Again
        </button>
        <button onClick={() => setGameOver(false)}>
          <Settings size={20} /> Change Settings
        </button>
      </div>
    </div>
  );

  return (
    <div className="word-game-container">
      {!gameStarted && !gameOver && renderStartScreen()}
      {gameStarted && !gameOver && renderGameBoard()}
      {gameOver && renderGameOverScreen()}
    </div>
  );
};

export default WordGame;