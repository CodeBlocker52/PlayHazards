import { useAccount } from "wagmi";
import { VerticalNavigationTemplate } from "components/VerticalNavigationTemplate";
import { useCoinsContext } from "config/context";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { GameTemplate } from "components/GameTemplate";
import ReactMarkdown from "react-markdown";
import ApiIcon from "@mui/icons-material/Api";
import { Button, TextField, CircularProgress } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

// Define types for server responses


enum MODES {
  INIT,
  GAMING,
  WATING,
  END,
}

interface Message {
  type: "text" | "img";
  content: string;
  speaker: "client" | "server";
}

const icon = <ApiIcon />;
const REWARD = 100;

export const DndGame: React.FC = () => {
  const localTheme = createTheme({
    palette: {
      primary: {
        main: "#6c757d", // Grayish primary color
      },
      secondary: {
        main: "#adb5bd", // Lighter grayish secondary color
      },
    },
  });

  // State hooks
  const { address } = useAccount();
  const [turns, setTurns] = useState(5);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [gameState, setGameState] = useState({
    mode: MODES.INIT,
    turns: 0,
  });
  const [activeGame, setActiveGame] = useState(false);
  const { setCoins } = useCoinsContext();
  const [choice, setChoice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const navigate = useNavigate();

  const server_url = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  useEffect(() => {
    if (gameState.turns === turns) {
      setGameState((gameState) => ({
        ...gameState,
        mode: MODES.END,
      }));

      setCoins((coins: number) => {
        localStorage.setItem("coins", (coins + REWARD).toString());
        return coins + REWARD;
      });
    }
  }, [gameState.turns, setCoins]);

  // Function to extract choices from AI response if backend doesn't provide them
  const extractChoicesFromResponse = (message: string): string[] => {
    try {
      const optionsSection = message.split(/\d+\.\s/).slice(1);
      return optionsSection.map((option) => option.trim());
    } catch (error) {
      console.error("Error extracting choices:", error);
      return [];
    }
  };

  // Function with retry logic for API requests
  const sendRequestWithRetry = async (
    url: string,
    body: any,
    maxRetries = 3
  ) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await fetch(server_url + url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        return await response.json();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;
        await new Promise((r) => setTimeout(r, 1000)); // Wait 1 second before retrying
      }
    }
  };

  // Function to start the game
  const startGame = async () => {
    try {
      setIsLoading(true);
      setGameState((gameState) => ({
        ...gameState,
        mode: MODES.WATING,
      }));
      setChoice("Waiting for AI to respond...");

      const data = await sendRequestWithRetry("/start", {
        gptVersion: model,
        language: "English",
        genre: "Dungeons",
        turns: turns,
        wallet_address: address,
      });

      setGameState((gameState) => ({
        ...gameState,
        mode: MODES.GAMING,
        turns: gameState.turns + 1,
      }));

      if (data.message) {
        const extractedText = data.message.split("1.")[0];
        updateChat("server", extractedText);

        if (!data.choices || data.choices.length === 0) {
          const extractedChoices = extractChoicesFromResponse(data.message);
          setChoices(extractedChoices);
        } else {
          setChoices(data.choices);
        }
      } else {
        updateChat(
          "server",
          "Sorry, there was an issue starting the game. Please try again."
        );
      }
    } catch (error) {
      console.error("Error starting game:", error);
      updateChat(
        "server",
        "Sorry, there was an error connecting to the game server."
      );
      setGameState((gameState) => ({
        ...gameState,
        mode: MODES.INIT,
      }));
      toast.error("Failed to start game. Please try again.");
    } finally {
      setIsLoading(false);
      setChoice("");
    }
  };

  // Function to send user input
  const sendUserInput = async () => {
    if (!choice) return;

    updateChat(
      "client",
      `**You**: 
        ${choice}`
    );

    let userInput;
    if (typeof choice === "object") {
      userInput = choice[0];
    } else {
      userInput = choice;
    }

    try {
      setIsLoading(true);
      setGameState((gameState) => ({
        ...gameState,
        mode: MODES.WATING,
      }));
      setChoice("Waiting for AI to respond...");

      const data = await sendRequestWithRetry("/continue", {
        userPrompt: userInput,
        wallet_address: address,
      });

      setGameState((gameState) => ({
        ...gameState,
        mode: MODES.GAMING,
        turns: gameState.turns + 1,
      }));

      if (data.message) {
        const extractedText = data.message.split("1.")[0];
        updateChat("server", extractedText);

        if (!data.choices || data.choices.length === 0) {
          const extractedChoices = extractChoicesFromResponse(data.message);
          setChoices(extractedChoices);
        } else {
          setChoices(data.choices);
        }

        if (data.imageUrl && !data.imageUrl.includes("placeholder.com")) {
          displayImage(data.imageUrl);
        }
      } else {
        updateChat(
          "server",
          "Sorry, there was an issue processing your response. Please try again."
        );
      }
    } catch (error) {
      console.error("Error sending user input:", error);
      updateChat(
        "server",
        "Sorry, there was an error connecting to the game server."
      );
      toast.error("Failed to send your choice. Please try again.");
    } finally {
      setIsLoading(false);
      setChoice("");
    }
  };

  // Function to update chat log
  const updateChat = (speaker: "client" | "server", message: string) => {
    setChatLog((prevLog) => [
      ...prevLog,
      { speaker: speaker, type: "text", content: message },
    ]);
  };

  // Function to display an image in chat
  const displayImage = (imageUrl: string) => {
    if (imageUrl) {
      setChatLog((prevLog) => [
        ...prevLog,
        { speaker: "server", type: "img", content: imageUrl },
      ]);
    }
  };

  const pregameText = (
    <>
      <div className="flex items-center mt-2 text-white">
        <ApiIcon style={{ fontSize: "6rem" }} />

        <div>
          <h2 className="text-4xl font-bold text-white fade">
            Dungeons & Dragons Challenge
          </h2>
          <p className="mt-2 text-xl text-white">
            Are You Ready for an Epic Adventure?
          </p>
        </div>
      </div>
      <div className="mt-4 mb-4 text-white">
        <p className="mb-5 text-xl font-bold text-white">Description</p>
        <p className="mb-4 text-white">
          Step into the shoes of a legendary hero, embarking on a dangerous
          quest full of mystery and magic. Your decisions will shape the world
          around you as you battle fierce enemies, navigate treacherous
          landscapes, and uncover hidden secrets.
        </p>
        <p className="text-white">
          The challenge starts easy, but each turn brings tougher encounters,
          cunning traps, and new allies. Your courage and wisdom will be tested
          with every step you take. Fail too many times, and your journey may
          come to a tragic end, but succeed, and your name will echo in the
          halls of legends!
        </p>
        <div className="mt-4">
          <p>
            <b>Difficulty: </b>Varying by encounter
          </p>
          <p>
            <b>Reward per victory: </b>
            {REWARD} BIT
          </p>
        </div>
      </div>
    </>
  );

  const gameDesc = (
    <div className="text-center animate-smooth-appear">
      <ApiIcon style={{ fontSize: "6rem" }} />

      <h2 className="text-4xl font-bold text-white fade">Dungeons & Dragons</h2>
      <p className="mt-5 text-2xl text-white">
        Choose your path wisely as you embark on a grand adventure.
      </p>
      <p className="mt-2 text-2xl text-white">
        Each decision will shape your fate, and the journey will grow more
        challenging with every step.
      </p>
    </div>
  );

  return (
    <VerticalNavigationTemplate>
      <div className="flex flex-col h-full overflow-y-auto text-white gap-4">
        <GameTemplate
          name="DnD"
          description="DnD game with AI chatbot"
          icon={icon}
          activeGame={activeGame}
          setActiveGame={setActiveGame}
          className="px-4 py-10"
          pregameText={pregameText}
          gameDesc={gameDesc}
        >
          <ThemeProvider theme={localTheme}>
            {gameState.mode === MODES.INIT && (
              <div className="flex flex-col items-center flex-grow overflow-scroll p-4 text-white gap-2">
                <div className="field text">
                  <label htmlFor="turns">Number of Turns:</label> &nbsp;
                  <input
                    type="number"
                    id="turns"
                    value={turns}
                    min="2"
                    max="20"
                    onChange={(e) => setTurns(Number(e.target.value))}
                  />
                </div>
                <div className="field text">
                  <label htmlFor="model">AI Model:</label> &nbsp;
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-gray-700 text-white p-1 rounded"
                  >
                    <option value="llama-3.3-70b-versatile">
                      Llama 3.3 70B
                    </option>
                  </select>
                </div>
                <div className="mx-2 mt-4">
                  <Button
                    variant="contained"
                    onClick={startGame}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress
                          size={20}
                          color="inherit"
                          className="mr-2"
                        />
                        Starting...
                      </>
                    ) : (
                      "Start Game"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {gameState.mode !== MODES.INIT && (
              <div className="flex flex-col h-full overflow-y-auto p-4 text-white gap-4">
                <div id="chat-log" className="flex flex-col gap-4">
                  {chatLog.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg m-2 text-justify border-2 ${
                        message.speaker === "client"
                          ? "self-end ml-24 text-white" // User message styles
                          : "mr-24 text-white" // Server message styles
                      }`}
                    >
                      {message.type === "text" && (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      )}
                      {message.type === "img" && (
                        <img
                          src={message.content}
                          alt={`content-${index}`}
                          className="rounded-md"
                        />
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-center items-center p-4">
                      <CircularProgress color="inherit" />
                    </div>
                  )}
                </div>

                {gameState.mode !== MODES.END && (
                  <div>
                    <div className="flex items-center justify-between mt-4 gap-4">
                      <TextField
                        placeholder={"Enter your choice..."}
                        value={choice}
                        color="primary"
                        multiline
                        minRows={2}
                        fullWidth
                        onChange={(e) => setChoice(e.target.value)}
                        disabled={gameState.mode === MODES.WATING || isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!isLoading && gameState.mode !== MODES.WATING) {
                              sendUserInput();
                            }
                          }
                        }}
                        InputProps={{
                          sx: {
                            color: "white", // Change the text color
                          },
                        }}
                        sx={{ color: "white" }}
                      />

                      <Button
                        className="mt-4"
                        disabled={
                          gameState.mode === MODES.WATING ||
                          isLoading ||
                          !choice
                        }
                        variant="contained"
                        onClick={() => sendUserInput()}
                        sx={{
                          "&.Mui-disabled": {
                            backgroundColor: "#6c757d", // Color when disabled
                            color: "lightgray", // Text color when disabled
                          },
                        }}
                      >
                        {isLoading ? (
                          <>
                            <CircularProgress
                              size={20}
                              color="inherit"
                              className="mr-2"
                            />
                            Sending...
                          </>
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>

                    <div className="gap-4 flex flex-col mt-4">
                      <p className="text-white font-bold">Quick choices:</p>
                      {choices.map((choiceOption, index) => (
                        <Button
                          variant="contained"
                          key={index}
                          onClick={() => {
                            setChoice(choiceOption);
                          }}
                          disabled={
                            isLoading || gameState.mode === MODES.WATING
                          }
                        >
                          {choiceOption}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {gameState.mode === MODES.END && (
                  <div className="flex flex-col gap-4 p-4">
                    <h2>Wow! You got {REWARD} BIT tokens!</h2>
                    <Button
                      variant="contained"
                      onClick={() => {
                        navigate("/main");
                      }}
                    >
                      Back to Main page
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ThemeProvider>
        </GameTemplate>
      </div>
    </VerticalNavigationTemplate>
  );
};

export default DndGame;
