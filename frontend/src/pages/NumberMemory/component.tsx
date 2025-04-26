import clsx from "clsx";
import { useCoinsContext } from "config/context";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { GameTemplate, VerticalNavigationTemplate } from "../../components";
import { MemoryMatrixIcon } from "../../core";

const icon = <MemoryMatrixIcon />;

// Define pattern types and question types
enum PatternType {
  LINEAR = "linear",
  MATRIX = "matrix",
  SEQUENCE = "sequence",
}

enum QuestionType {
  FULL = "full", // Remember the entire pattern
  POSITION = "position", // Remember number at specific position
  SUM = "sum", // Calculate sum of specific row/column
  MISSING = "missing", // Identify missing number
}

interface MatrixPattern {
  grid: number[][];
  rows: number;
  cols: number;
}

interface Question {
  type: QuestionType;
  patternType: PatternType;
  data: any; // Different data depending on question type
  correctAnswer: any; // The expected answer
  prompt: string; // The question text
}

const ProgressBar = ({
  progressPercentage,
}: {
  progressPercentage: number | string;
}) => {
  return (
    <div className="w-full h-1 bg-gray-300">
      <div
        style={{ width: `${progressPercentage}%` }}
        className={`h-full ${
          Number(progressPercentage) < 70 ? "bg-red-600" : "bg-green-600"
        }`}
      ></div>
    </div>
  );
};

const REWARD = 10;
const BONUS_MULTIPLIER = 0.5; // Bonus points for complex patterns

export const MemoryMatrix: React.FC = () => {
  const { setCoins } = useCoinsContext();
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState(false);
  const [level, setLevel] = useState(1);
  const [guess, setGuess] = useState("");
  const [counter, setCounter] = React.useState(0);
  const [inputValue, setInputValue] = React.useState("");
  const [gameActive, setGameActive] = useState(1);
  const [pattern, setPattern] = useState<PatternType>(PatternType.LINEAR);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [matrixPattern, setMatrixPattern] = useState<MatrixPattern | null>(
    null
  );
  const [sequencePattern, setSequencePattern] = useState<number[]>([]);
  const [linearPattern, setLinearPattern] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState(3000); // Base display time in ms
  const [timer, setTimer] = useState(3); // Timer in seconds
  const timerRef = useRef(null);

  const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateMatrix = (level: number): MatrixPattern => {
    // Matrix size scales with level
    const rows = Math.min(2 + Math.floor(level / 3), 5);
    const cols = Math.min(2 + Math.floor(level / 3), 5);

    // Create matrix filled with random numbers
    const grid: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        // Digits get larger as level increases
        const digitSize = Math.min(1 + Math.floor(level / 5), 3);
        row.push(
          getRandomInt(Math.pow(10, digitSize - 1), Math.pow(10, digitSize) - 1)
        );
      }
      grid.push(row);
    }

    return { grid, rows, cols };
  };

  const generateSequence = (level: number): number[] => {
    // Length scales with level
    const length = Math.min(3 + level, 12);

    // Pattern complexity scales with level
    const sequence: number[] = [];

    if (level <= 3) {
      // Simple increasing sequence
      const start = getRandomInt(1, 50);
      const step = getRandomInt(1, 10);
      for (let i = 0; i < length; i++) {
        sequence.push(start + i * step);
      }
    } else if (level <= 6) {
      // Fibonacci-like sequence
      const start1 = getRandomInt(1, 10);
      const start2 = getRandomInt(1, 10);
      sequence.push(start1, start2);
      for (let i = 2; i < length; i++) {
        sequence.push(sequence[i - 1] + sequence[i - 2]);
      }
    } else {
      // Complex pattern
      const start = getRandomInt(1, 20);
      sequence.push(start);
      for (let i = 1; i < length; i++) {
        if (i % 3 === 0) {
          sequence.push(sequence[i - 1] * 2);
        } else if (i % 3 === 1) {
          sequence.push(sequence[i - 1] + 3);
        } else {
          sequence.push(sequence[i - 1] - 1);
        }
      }
    }

    return sequence;
  };

  const generateLinearNumber = (level: number): number => {
    // Number of digits scales with level
    const digits = Math.min(2 + level, 15);
    return getRandomInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
  };

  const generateQuestion = (
    level: number,
    patternType: PatternType,
    matrixData?: MatrixPattern,
    sequenceData?: number[],
    linearData?: number
  ): Question => {
    // Select question type based on pattern type and level
    let questionType: QuestionType;
    let data: any;
    let correctAnswer: any;
    let prompt: string;

    switch (patternType) {
      case PatternType.MATRIX:
        if (!matrixData) throw new Error("Matrix data required");

        // Choose question type based on level
        if (level <= 3) {
          questionType = QuestionType.FULL;
          data = { ...matrixData };
          correctAnswer = JSON.stringify(matrixData.grid);
          prompt = "Recreate the entire matrix:";
        } else if (level <= 6) {
          questionType = QuestionType.POSITION;
          const row = getRandomInt(0, matrixData.rows - 1);
          const col = getRandomInt(0, matrixData.cols - 1);
          data = { row, col };
          correctAnswer = matrixData.grid[row][col].toString();
          prompt = `What was the number at position [${row + 1},${col + 1}]?`;
        } else if (level <= 9) {
          questionType = QuestionType.SUM;
          const isRow = Math.random() > 0.5;
          const index = isRow
            ? getRandomInt(0, matrixData.rows - 1)
            : getRandomInt(0, matrixData.cols - 1);

          data = { isRow, index };

          if (isRow) {
            correctAnswer = matrixData.grid[index]
              .reduce((sum, num) => sum + num, 0)
              .toString();
            prompt = `What is the sum of row ${index + 1}?`;
          } else {
            let sum = 0;
            for (let i = 0; i < matrixData.rows; i++) {
              sum += matrixData.grid[i][index];
            }
            correctAnswer = sum.toString();
            prompt = `What is the sum of column ${index + 1}?`;
          }
        } else {
          questionType = QuestionType.MISSING;
          // Create a copy with one number replaced by ?
          const modifiedGrid = JSON.parse(JSON.stringify(matrixData.grid));
          const row = getRandomInt(0, matrixData.rows - 1);
          const col = getRandomInt(0, matrixData.cols - 1);
          const missingValue = modifiedGrid[row][col];
          modifiedGrid[row][col] = "?";

          data = { modifiedGrid, row, col };
          correctAnswer = missingValue.toString();
          prompt = `What number belongs in place of the question mark?`;
        }
        break;

      case PatternType.SEQUENCE:
        if (!sequenceData) throw new Error("Sequence data required");

        if (level <= 4) {
          questionType = QuestionType.FULL;
          data = [...sequenceData];
          correctAnswer = sequenceData.join(" ");
          prompt = "What was the sequence?";
        } else if (level <= 8) {
          questionType = QuestionType.POSITION;
          const position = getRandomInt(0, sequenceData.length - 1);
          data = { position };
          correctAnswer = sequenceData[position].toString();
          prompt = `What was the ${position + 1}${getOrdinalSuffix(
            position + 1
          )} number in the sequence?`;
        } else {
          questionType = QuestionType.MISSING;
          // Create a copy with one number replaced by ?
          const modifiedSequence = [...sequenceData];
          const position = getRandomInt(0, sequenceData.length - 1);
          const missingValue = modifiedSequence[position];
          modifiedSequence[position] = null;

          data = { modifiedSequence, position };
          correctAnswer = missingValue.toString();
          prompt = `What number belongs at position ${
            position + 1
          } in the sequence?`;
        }
        break;

      case PatternType.LINEAR:
      default:
        if (linearData === undefined) throw new Error("Linear data required");

        questionType = QuestionType.FULL;
        data = linearData;
        correctAnswer = linearData.toString();
        prompt = "What number did you see?";
        break;
    }

    return {
      type: questionType,
      patternType,
      data,
      correctAnswer,
      prompt,
    };
  };

  const getOrdinalSuffix = (n: number): string => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const [answer, setAnswer] = useState<string>(
    getRandomInt(Math.pow(10, 2), Math.pow(10, 3)).toString()
  );

  const restartGame = () => {
    setCounter(0);
    setLevel(1);
    setGuess("");
    setInputValue("");
    setGameActive(1);
    generateNewPattern(1);
  };

  const generateNewPattern = (newLevel: number) => {
    // Choose pattern type based on level
    let newPatternType: PatternType;

    if (newLevel <= 3) {
      newPatternType = PatternType.LINEAR;
    } else if (newLevel <= 7) {
      // Alternate between linear and sequence
      newPatternType =
        Math.random() > 0.5 ? PatternType.LINEAR : PatternType.SEQUENCE;
    } else {
      // Equal chance of any pattern type
      const patternTypes = [
        PatternType.LINEAR,
        PatternType.MATRIX,
        PatternType.SEQUENCE,
      ];
      newPatternType =
        patternTypes[Math.floor(Math.random() * patternTypes.length)];
    }

    setPattern(newPatternType);

    // Generate pattern based on type
    let newMatrix: MatrixPattern | null = null;
    let newSequence: number[] = [];
    let newLinear = 0;

    switch (newPatternType) {
      case PatternType.MATRIX:
        newMatrix = generateMatrix(newLevel);
        setMatrixPattern(newMatrix);
        break;
      case PatternType.SEQUENCE:
        newSequence = generateSequence(newLevel);
        setSequencePattern(newSequence);
        break;
      case PatternType.LINEAR:
      default:
        newLinear = generateLinearNumber(newLevel);
        setLinearPattern(newLinear);
        break;
    }

    // Generate question
    const question = generateQuestion(
      newLevel,
      newPatternType,
      newMatrix,
      newSequence,
      newLinear
    );

    setCurrentQuestion(question);
    setAnswer(question.correctAnswer);

    // Adjust display time based on level and pattern complexity
    const baseTime = 3000; // 3 seconds
    const levelFactor = Math.max(0.5, 1 - newLevel * 0.05); // Decrease time as level increases
    const complexityFactor =
      newPatternType === PatternType.LINEAR
        ? 1
        : newPatternType === PatternType.SEQUENCE
        ? 1.5
        : 2; // Matrix gets more time

    const newDisplayTime = baseTime * levelFactor * complexityFactor;
    setDisplayTime(newDisplayTime);
    
    // Set timer in seconds (rounded up)
    setTimer(Math.ceil(newDisplayTime / 1000));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(event.target.value);
    setInputValue(event.target.value);
  };

  const sendUserInput = () => {
    setInputValue("");

    // Check if answer is correct
    if (guess.trim() !== answer.trim()) {
      setGameActive(4); // Game over
    } else {
      setGameActive(3); // Level completed
    }
  };

  const callNextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setGameActive(1);
    setCounter(0);
    generateNewPattern(newLevel);
  };

  const returnToHomePage = () => {
    navigate("/main");
  };

  // Calculate reward based on level and pattern complexity
  const calculateReward = (level: number, patternType: PatternType) => {
    const baseReward = level * REWARD;
    const bonusMultiplier =
      patternType === PatternType.LINEAR
        ? 1
        : patternType === PatternType.SEQUENCE
        ? 1 + BONUS_MULTIPLIER
        : 1 + BONUS_MULTIPLIER * 2;

    return Math.floor(baseReward * bonusMultiplier);
  };

  useEffect(() => {
    if (gameActive === 4) {
      const finalReward = calculateReward(level, pattern);
      toast.success(`Wow! You got ${finalReward} BIT tokens!`);
      setCoins((coins: number) => {
        localStorage.setItem("coins", (coins + finalReward).toString());
        return coins + finalReward;
      });
    }
  }, [gameActive, level, pattern, setCoins]);

  // Timer effect - similar to ChimpGame implementation
// Timer effect - similar to ChimpGame implementation
useEffect(() => {
  if (!activeGame) return;
  
  // Clear any existing timer
  if (timerRef.current) {
    clearInterval(timerRef.current);
  }

  if (gameActive === 1) {
    // Memorize phase
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameActive(2); // Move to question phase
          // Set a new timer for the question phase (10 seconds)
          setTimer(10);
          return 0;
        }
        return prev - 1;
      });
      
      // Update counter for progress bar
      setCounter(prev => {
        const newCounter = prev + (1 / (displayTime / 1000));
        return Math.min(newCounter, 1);
      });
    }, 1000);
  } else if (gameActive === 2) {
    // Question phase - give the player 10 seconds to answer
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time ran out, player loses
          setGameActive(4); // Game over
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, [activeGame, gameActive, displayTime]);


  useEffect(() => {
    if (activeGame && gameActive === 1) {
      generateNewPattern(level);
    }
  }, [activeGame, gameActive]);

  // Render pattern based on current type
  const renderPattern = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.patternType) {
      case PatternType.MATRIX:
        return (
          <div className="grid gap-2 p-2 mx-auto bg-gray-800 rounded-lg">
            {matrixPattern?.grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex items-center justify-center w-16 h-12 font-bold text-white bg-gray-700 rounded"
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      case PatternType.SEQUENCE:
        return (
          <div className="flex flex-wrap justify-center gap-2 p-3 bg-gray-800 rounded-lg">
            {sequencePattern.map((num, index) => (
              <div
                key={index}
                className="flex items-center justify-center px-3 py-2 font-bold text-white bg-gray-700 rounded"
              >
                {num}
              </div>
            ))}
          </div>
        );
      case PatternType.LINEAR:
      default:
        return (
          <p
            className={clsx([
              level <= 5 && "text-8xl",
              level === 6 && "text-7xl",
              level === 7 && "text-6xl",
              level === 8 && "text-5xl",
              level > 8 && "text-4xl",
              "mb-7",
            ])}
            style={{ color: "white" }}
          >
            {linearPattern}
          </p>
        );
    }
  };

  // Render missing number question
  const renderMissingNumberQuestion = () => {
    if (!currentQuestion || currentQuestion.type !== QuestionType.MISSING) {
      return null;
    }

    if (currentQuestion.patternType === PatternType.MATRIX) {
      const { modifiedGrid } = currentQuestion.data;

      return (
        <div className="grid gap-2 p-2 mx-auto bg-gray-800 rounded-lg mb-4">
          {modifiedGrid.map((row: any[], rowIndex: number) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((cell: any, colIndex: number) => (
                <div
                  key={colIndex}
                  className={`flex items-center justify-center w-16 h-12 font-bold text-white rounded ${
                    cell === "?" ? "bg-purple-800 animate-pulse" : "bg-gray-700"
                  }`}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    } else if (currentQuestion.patternType === PatternType.SEQUENCE) {
      const { modifiedSequence } = currentQuestion.data;

      return (
        <div className="flex flex-wrap justify-center gap-2 p-3 mb-4 bg-gray-800 rounded-lg">
          {modifiedSequence.map((num: number | null, index: number) => (
            <div
              key={index}
              className={`flex items-center justify-center px-3 py-2 font-bold text-white rounded ${
                num === null ? "bg-purple-800 animate-pulse" : "bg-gray-700"
              }`}
            >
              {num === null ? "?" : num}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Timer display component similar to ChimpGame
  const TimerDisplay = () => (
    <div className="absolute bottom-4 right-4">
      <div className={clsx(
        "text-3xl font-bold rounded-full h-16 w-16 flex items-center justify-center",
        timer <= 3 ? "bg-red-600 animate-pulse" : "bg-purple-800",
        "text-white shadow-lg border-2 border-white"
      )}>
        {timer}
      </div>
    </div>
  );

  let res;

  if (gameActive === 1) {
    res = (
      <>
        <div className="mb-4">{renderPattern()}</div>
        <div className="round-progress">
          <ProgressBar progressPercentage={counter * 100}></ProgressBar>
        </div>
      </>
    );
  } else if (gameActive === 2) {
    res = (
      <>
        <p className="mb-4 text-xl font-bold text-white">
          {currentQuestion?.prompt || "What did you see?"}
        </p>

        {/* For missing number questions, show the pattern with a question mark */}
        {currentQuestion?.type === QuestionType.MISSING &&
          renderMissingNumberQuestion()}

        <input
          className="block w-full px-4 py-3 text-3xl font-bold text-center text-white border-2 border-gray-600 rounded focus:outline-none bg-gray-750"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Your answer"
        ></input>
        <button
          onClick={sendUserInput}
          disabled={!inputValue}
          className="py-3 mt-4 font-bold text-white rounded px-14 focus:outline-none bg-purple-950 ring-purple-800 transition-all hover:ring-2"
        >
          Submit
        </button>
      </>
    );
  } else if (gameActive === 3) {
    const patternLabel =
      pattern === PatternType.LINEAR
        ? "Number"
        : pattern === PatternType.SEQUENCE
        ? "Sequence"
        : "Matrix";

    res = (
      <>
        <p className="text-2xl font-bold text-white mb-4">Correct!</p>

        <div className="p-4 mb-4 bg-gray-800 rounded-lg">
          <p className="text-lg font-bold text-white">
            {currentQuestion?.prompt}
          </p>
          <p className="mt-2 text-2xl font-bold text-green-400">{answer}</p>
        </div>

        <p className="my-4 text-4xl font-bold text-white animate-pulse">
          Level {level} Completed
        </p>

        <div className="flex items-center justify-center w-full mt-4">
          <div className="px-4 py-2 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">Pattern Type</p>
            <p className="text-lg font-bold text-white">{patternLabel}</p>
          </div>

          <div className="px-4 py-2 ml-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">Reward</p>
            <p className="text-lg font-bold text-white">
              {calculateReward(level, pattern)} BIT
            </p>
          </div>
        </div>

        <button
          onClick={callNextLevel}
          className="py-3 mt-6 font-bold text-white rounded px-14 focus:outline-none bg-purple-950 ring-purple-800 transition-all hover:ring-2"
        >
          Next Level
        </button>
      </>
    );
  } else {
    // Game over screen
    const finalReward = calculateReward(level, pattern);

    res = (
      <>
        <p className="text-3xl font-bold text-red-500 mb-6">Game Over!</p>

        <div className="p-4 mb-4 bg-gray-800 rounded-lg">
          <p className="text-lg font-bold text-white">
            {currentQuestion?.prompt}
          </p>
          <div className="flex items-center mt-2">
            <div className="mr-4">
              <p className="text-sm text-gray-400">Correct Answer</p>
              <p className="text-2xl font-bold text-green-400">{answer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Your Answer</p>
              <p className="text-2xl font-bold text-red-400 line-through">
                {guess}
              </p>
            </div>
          </div>
        </div>

        <h3 className="mt-6 mb-2 text-4xl font-bold text-white">
          Final Level: {level}
        </h3>
        <h3 className="mb-8 text-4xl font-bold text-white">
          Reward: {finalReward} BIT tokens
        </h3>

        <div className="mx-auto">
          <button
            onClick={restartGame}
            className="py-3 mt-2 font-bold text-white rounded px-14 focus:outline-none bg-purple-950 ring-purple-800 transition-all hover:ring-2"
          >
            Try again
          </button>
        </div>

        <button
          onClick={returnToHomePage}
          className="px-4 py-3 mt-4 ml-3 font-bold text-black bg-gray-200 rounded focus:outline-none"
        >
          Main page
        </button>
      </>
    );
  }

  const pregameText = (
    <>
      <div className="flex items-center mt-6 text-white">
        <MemoryMatrixIcon className="-ml-4 text-white h-28 w-30" />
        <div className="ml-4">
          <h2 className="text-4xl font-bold text-white fade">Memory Matrix</h2>
          <p className="mt-2 text-xl text-white">
            Average person can remember 7 numbers at once...
          </p>
        </div>
      </div>
      <div className="mt-4 mb-4 text-white">
        <p className="mb-5 text-xl font-bold text-white">Description</p>
        <p className="mb-4 text-white">
          Challenge your memory with numbers in different formats! From simple
          numerical sequences to complex matrix patterns, this game tests your
          spatial and sequential memory abilities.
        </p>
        <p className="mb-4 text-white">
          As you progress, you'll encounter increasingly challenging patterns
          and question types. The game adapts to your skill level by presenting
          more complex patterns and shorter display times.
        </p>
        <div className="mt-4">
          <p>
            <b>Difficulty: </b>9
          </p>
          <p>
            <b>Base Coins per level: </b>
            {REWARD} BIT
          </p>
          <p>
            <b>Bonus: </b>
            +50% for sequences, +100% for matrices
          </p>
        </div>
      </div>
    </>
  );

  const gameDesc = (
    <div className="text-center animate-smooth-appear">
      <MemoryMatrixIcon className="w-32 mx-auto text-white animate-pulse-fast" />
      <h2 className="text-4xl font-bold text-white fade">Memory Matrix</h2>
      <p className="mt-5 text-2xl text-white">
        Remember numbers and patterns appearing on the screen.
      </p>
      <p className="mt-2 text-2xl text-white">
        The test will get progressively harder with more complex patterns.
      </p>
      {gameActive === 1 && (
        <p className="mt-2 text-2xl text-white">
          Memorize the pattern. You have {timer} seconds.
        </p>
      )}
      {gameActive === 2 && (
        <p className="mt-2 text-2xl text-white">
          What did you see? You have {timer} seconds to answer.
        </p>
      )}
    </div>
  );
  

  const handleGameClose = () => {
    // Reset all game state
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setLevel(1);
    setGuess("");
    setInputValue("");
    setGameActive(1);
    setCounter(0);
    setCurrentQuestion(null);
    // Reset any other state that needs to be cleared
  };

  return (
    <VerticalNavigationTemplate>
      <GameTemplate
        name="Числовая память"
        description="Узнайте насколько хороша ваша память."
        icon={icon}
        activeGame={activeGame}
        setActiveGame={setActiveGame}
        pregameText={pregameText}
        gameDesc={gameDesc}
        onClose={handleGameClose}
        className="px-4 py-10 relative"
      >
        <div className="round-main">{res}</div>
        
        {/* Timer display (only show during Memorize phase) */}
        {(gameActive === 1 || gameActive === 2) && activeGame && <TimerDisplay />}
      </GameTemplate>
    </VerticalNavigationTemplate>
  );
};
