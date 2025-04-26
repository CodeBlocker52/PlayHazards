import clsx from "clsx";
import { VerticalNavigationTemplate } from "components/VerticalNavigationTemplate";
import { useCoinsContext } from "config/context";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

import { ChimpIcon } from "core";
import { GameTemplate } from "components/GameTemplate";
import { useNavigate } from "react-router-dom";

const icon = <ChimpIcon />;

enum MODES {
  Memorize,
  Question,
  Result,
}

type PuzzleState = Record<number, number>;

const CELLS = 25;
const MAX_STRIKES = 3;
const REWARD = 5;
const MEMORIZE_TIME = 5; // 5 seconds to memorize
const QUESTION_TIME = 10; // 10 seconds to answer

export const ChimpGame = () => {
  const { setCoins } = useCoinsContext();
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState(false);
  const [timer, setTimer] = useState(MEMORIZE_TIME);
  const timerRef = useRef(null);
  const [clickedCells, setClickedCells] = useState<number[]>([]);

  const generatePuzzle = (cellsVisible: number): PuzzleState => {
    const cellIndices = new Array(CELLS)
      .fill(0)
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, cellsVisible);
    const cellValues = new Array(cellsVisible).fill(0).map((_, i) => i + 1);

    const puzzle = cellIndices.reduce(
      (acc, x, index) => ({ ...acc, [x]: cellValues[index] }),
      {}
    );

    return puzzle;
  };

  const [gameState, setGameState] = useState({
    mode: MODES.Memorize,
    strikes: 0,
    numbers: 4,
    puzzle: generatePuzzle(4),
  });

  const [target, setTarget] = useState(1);

  // Timer logic
  useEffect(() => {
    if (!activeGame) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (gameState.mode === MODES.Memorize) {
      setTimer(MEMORIZE_TIME);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Reset clicked cells when changing from memorize to question mode
            setClickedCells([]);
            setGameState(state => ({ ...state, mode: MODES.Question }));
            return QUESTION_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState.mode === MODES.Question) {
      setTimer(QUESTION_TIME);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Time ran out, player loses this round
            setGameState(state => ({
              ...state,
              mode: MODES.Result,
              strikes: state.strikes + 1
            }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Clean up timer on unmount or mode change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.mode, activeGame]);

  const handleClick = (index: number) => {
    const valueClicked = gameState.puzzle[index];
    
    // Check if this is the correct cell to click
    if (valueClicked !== target) {
      clearInterval(timerRef.current);
      setGameState((gameState) => ({
        ...gameState,
        mode: MODES.Result,
        strikes: gameState.strikes + 1,
      }));
    } else {
      // Add this cell to the clicked cells array (so it disappears)
      setClickedCells(prev => [...prev, index]);
      
      if (target === gameState.numbers) {
        // Successfully completed this round
        clearInterval(timerRef.current);
        setGameState((gameState) => ({
          ...gameState,
          mode: MODES.Result,
          numbers: gameState.numbers + 1,
        }));
      } else {
        // Move to next number
        setTarget((target) => target + 1);
      }
    }
  };

  useEffect(() => {
    if (gameState.strikes === MAX_STRIKES) {
      toast.success(`Wow! You got ${gameState.numbers * REWARD} BIT tokens!`);
      setCoins((coins: number) => {
        localStorage.setItem(
          "coins",
          (coins + gameState.numbers * REWARD).toString()
        );
        return coins + gameState.numbers * REWARD;
      });
    }
  }, [gameState.strikes, gameState.numbers, setCoins]);

  const restartGame = () => {
    setTarget(1);
    clearInterval(timerRef.current);
    setClickedCells([]);
    setGameState({
      mode: MODES.Memorize,
      strikes: 0,
      numbers: 4,
      puzzle: generatePuzzle(4),
    });
    setTimer(MEMORIZE_TIME);
  };

  const continueGame = () => {
    setTarget(1);
    clearInterval(timerRef.current);
    setClickedCells([]);
    setGameState((gameState) => ({
      ...gameState,
      puzzle: generatePuzzle(gameState.numbers),
      mode: MODES.Memorize,
    }));
    setTimer(MEMORIZE_TIME);
  };

  const returnToHomePage = () => {
    clearInterval(timerRef.current);
    navigate("/main");
  };

  const pregameText = (
    <>
      <div className="flex items-center mt-2 text-white">
        <ChimpIcon className="h-32 -ml-4 text-white w-30" />
        <div>
          <h2 className="text-4xl font-bold text-white fade">Chimpanze test</h2>
          <p className="mt-2 text-xl text-white">
            Are You Smarter Than a Chimpanzee?
          </p>
        </div>
      </div>
      <div className="mt-4 mb-4 text-white">
        <p className="mb-5 text-xl font-bold text-white">Description</p>
        <p className="mb-4 text-white">
          This is a test of working memory, made famous by a study that found
          that chimpanzees consistently outperform humans on this task. In the
          study, the chimps consistently outperformed humans, and some chimps
          were able to remember 9 digits over 90% of the time.
        </p>
        <p className="text-white">
          Variant of that concept, that gets increasingly difficult every turn,
          starting at 4 digits, and adding one every turn. If you pass a level,
          the number increases. If you fail, you get a strike. Three strikes and
          the test is over.
        </p>
        <div className="mt-4">
          <p>
            <b>Difficulty: </b>7
          </p>
          <p>
            <b>Coins per level: </b>
            {REWARD} BIT
          </p>
          <p>
            <b>Time: </b>5 seconds to memorize, 10 seconds to answer
          </p>
        </div>
      </div>
    </>
  );

  const gameDesc = (
    <div className="text-center animate-smooth-appear">
      <ChimpIcon className="w-32 mx-auto text-white animate-pulse-fast" />
      <h2 className="text-4xl font-bold text-white fade">Chimpanze</h2>
      {gameState.mode === MODES.Memorize ? (
        <p className="mt-5 text-2xl text-white">
          Memorize the positions of the numbers. You have {timer} seconds.
        </p>
      ) : (
        <p className="mt-5 text-2xl text-white">
          Click the squares in order starting with 1. You have {timer} seconds.
          <br />
          <span className="text-xl">Current number: {target}</span>
        </p>
      )}
      <p className="mt-2 text-2xl text-white">
        The test will get progressively harder.
      </p>
    </div>
  );

  const handleGameClose = () => {
    // Reset all game state
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTarget(1);
    setClickedCells([]);
    setGameState({
      mode: MODES.Memorize,
      strikes: 0,
      numbers: 4,
      puzzle: generatePuzzle(4),
    });
  };
  
  // Timer display component
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

  return (
    <VerticalNavigationTemplate>
      <GameTemplate
        name="Chimp"
        description="Are You Smarter than a Chimpanzee?"
        icon={icon}
        activeGame={activeGame}
        setActiveGame={setActiveGame}
        className="px-4 py-10 relative"
        pregameText={pregameText}
        gameDesc={gameDesc}
        onClose={handleGameClose}
      >
        {(gameState.mode === MODES.Memorize || gameState.mode === MODES.Question) && (
          <div className="w-full grid grid-cols-5 grid-rows-5 gap-2">
            {new Array(CELLS).fill(0).map((_, i) => {
              const value = gameState.puzzle[i];
              const isActiveCell = value !== undefined;
              const hasCellBeenClicked = clickedCells.includes(i);
              
              return (
                <div
                  key={i}
                  className={clsx([
                    "flex justify-center items-center h-14 w-auto font-bold border-4 rounded border-gray-300 border-opacity-50 text-white text-xl",
                    !isActiveCell && "opacity-0",
                    gameState.mode === MODES.Question && isActiveCell && !hasCellBeenClicked && "bg-white",
                    gameState.mode === MODES.Question && isActiveCell && hasCellBeenClicked && "opacity-0 transition-opacity duration-200",
                  ])}
                  onClick={
                    gameState.mode === MODES.Question && isActiveCell && !hasCellBeenClicked
                      ? () => handleClick(i) 
                      : undefined
                  }
                >
                  {gameState.mode === MODES.Memorize && isActiveCell ? value : ""}
                </div>
              );
            })}
          </div>
        )}
        {gameState.mode === MODES.Result && (
          <div className="font-bold text-center text-white">
            {gameState.strikes === MAX_STRIKES ? (
              <div>
                <ChimpIcon className="w-24 mx-auto" />
                <h3 className="mb-2 text-4xl">Numbers: {gameState.numbers}</h3>
                <h3 className="mb-5 text-4xl">
                  Reward: {gameState.numbers * REWARD} BIT coins
                </h3>
                <div className="mx-auto">
                  <button
                    onClick={restartGame}
                    className="px-8 py-3 mt-2 font-bold text-white rounded focus:outline-none bg-purple-950 ring-purple-800 transition-all hover:ring-2"
                  >
                    Try again
                  </button>
                </div>
                <button
                  onClick={returnToHomePage}
                  className="px-4 py-3 mt-4 font-bold text-black bg-gray-200 rounded focus:outline-none hover:ring-2 ring-gray-300 transition-all"
                >
                  Back to Main page
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-4xl">Numbers</h3>
                <p className="mt-4 text-5xl">{gameState.numbers}</p>
                <h4 className="mt-8 text-3xl font-semibold">Strikes</h4>
                <h4 className="mb-8 text-3xl">
                  {gameState.strikes} out of {MAX_STRIKES}
                </h4>
                <button
                  onClick={continueGame}
                  className="px-8 py-3 mt-2 font-bold text-white rounded focus:outline-none bg-purple-950 ring-purple-800 transition-all hover:ring-2"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Timer display (only show during Memorize and Question phases) */}
        {(gameState.mode === MODES.Memorize || gameState.mode === MODES.Question) && 
          activeGame && <TimerDisplay />}
      </GameTemplate>
    </VerticalNavigationTemplate>
  );
};