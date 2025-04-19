import clsx from "clsx";
import { cloneElement, FC, useState } from "react";
import { useUserWallets } from "@dynamic-labs/sdk-react-core";

import { CrossIcon } from "../../core";
import { Props } from "./props";
import { Button } from "@mui/material";

export const GameTemplate: FC<Props> = ({
  className,
  children,
  activeGame,
  setActiveGame,
  pregameText,
  gameDesc,
  onClose,
}: Props) => {
  const userWallets = useUserWallets();
  const [start, setStart] = useState(true);

  const closeGame = () => {
    setStart(true);
    setActiveGame(false);
    if (onClose) onClose();
  };

  return (
    <div
      className={clsx([
        "h-screen relative w-full",
        activeGame && "items-center justify-center flex",
        !start && "items-center justify-center flex",
        className,
      ])}
    >
      {(activeGame || !start) && (
        <div
          className="absolute z-30 w-10 text-white cursor-pointer top-3 right-3"
          onClick={closeGame}
        >
          <CrossIcon />
        </div>
      )}
      {!activeGame && start && (
        <>
          {cloneElement(pregameText)}

          {userWallets.length === 0 ? (
            <div className="text-white text-center mt-5">
              Please connect your wallet to play the game
            </div>
          ) : (
            <button
              onClick={() => setStart(false)}
              className="px-4 py-3 mt-2 font-bold text-white rounded focus:outline-none bg-purple-950 ring-purple-800 transition-all hover:ring-2"
            >
              Start game
            </button>
          )}
        </>
      )}
      {!activeGame && !start && (
        <div className="flex flex-col items-center">
          {gameDesc}
          <div className="mt-6">
            <Button
              variant="contained"
              onClick={() => setActiveGame(true)}
              sx={{
                backgroundColor: "#6c757d",
                "&:hover": {
                  backgroundColor: "#5a6268",
                },
                padding: "10px 30px",
                fontSize: "1.2rem",
              }}
            >
              Play Now
            </Button>
          </div>
          {/* <div
            className="absolute z-10 w-full h-full bg-black bg-opacity-0"
            onClick={() => setActiveGame(true)}
          /> */}
        </div>
      )}
      {activeGame && children}
    </div>
  );
};
