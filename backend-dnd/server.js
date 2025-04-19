require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  startGameSession,
  sendQuery,
  generateImageResponse,
} = require("./gameSession");
const { extractOptionsFromAIResponse } = require("./utils");
const { v4: uuidv4 } = require("uuid");

const uuid = uuidv4();

const app = express();
const PORT = process.env.PORT || 3000;

const fs = require("fs").promises;
const axios = require("axios");

// Store game settings for active sessions
let gameSettings = {};

// Serve static files from the "public" directory (your frontend)
app.use(express.static("public"));

app.use(
  cors({
    origin: "*",
  })
);

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Route to serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/web_index.html");
});

// POST route to start a new game session
app.post("/start", async (req, res) => {
  console.log("req",req.body);

  const { gptVersion, language, genre, turns, wallet_address, max_chars = 1000 } = req.body;

  // Initialize game settings
  gameSettings = {
    gptVersion,
    language,
    genre,
    turns,
    max_chars,
    round: 1,
    isGameStarted: true,
  };

  // Start the game and get the initial response
  const response = await startGameSession(wallet_address, uuid, gameSettings);
  console.log("response",response);
  const choices = extractOptionsFromAIResponse(response);

  res.json({ message: response, choices });
});

// POST route to continue the game with user input
app.post("/continue", async (req, res) => {
  console.log(req.body);
  const { userPrompt, wallet_address } = req.body;

  if (!gameSettings.isGameStarted) {
    return res.json({ message: "No active game session. Start a new game!" });
  }

  // Increment the round and check if the game should end
  gameSettings.round++;
  if (gameSettings.round > +gameSettings.turns) {
    gameSettings.isGameStarted = false;
    return res.json({ message: "Game finished. Start a new game?" });
  }

  // Add the round information to the user prompt
  const promptWithRound = `Round ${gameSettings.round}/${gameSettings.turns}: ${userPrompt}`;

  // Continue the game session with the user's input
  const response = await sendQuery(wallet_address, uuid, promptWithRound);
  const choices = extractOptionsFromAIResponse(response);

  try {
    // Generate an image related to the game response
    const imageResponse = await generateImageResponse(response);
    
    // If image generation succeeded, upload to walrus
    if (imageResponse && imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url) {
      const walrus_data = await uploadToWalrus(imageResponse.data[0].url);
      if (walrus_data) {
        updateJsonFile(walrus_data);
      }
      
      res.json({ 
        message: response, 
        choices, 
        imageUrl: imageResponse.data[0].url 
      });
    } else {
      // Return just the text response if image generation failed
      res.json({ message: response, choices });
    }
  } catch (error) {
    console.error("Error in /continue route:", error);
    res.json({ message: response, choices });
  }
});

app.get("/gallery", async (req, res) => {
  try {
    const walrus_json = "saved_files/walrus_blob_id.json";
    const fileContent = await fs.readFile(walrus_json, "utf8");
    const jsonData = JSON.parse(fileContent);
    res.json(jsonData);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.json({}); // Return empty object if file doesn't exist
    } else {
      console.error("Error reading gallery data:", error);
      res.status(500).json({ error: "Failed to load gallery data" });
    }
  }
});

function generateUniqueFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `dnd_${timestamp}.png`;
}

async function uploadToWalrus(imageUrl) {
  try {
    // Fetch the image from the URL and convert it to a Blob
    const basePublisherUrl = "https://walrus-testnet-publisher.nodes.guru";
    const numEpochs = 25;

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    if (!(response.status === 200)) {
      throw new Error("Failed to fetch the image from URL");
    }

    // Submit a PUT request to store the image blob to Walrus
    const walrusResponse = await fetch(
      `${basePublisherUrl}/v1/store?epochs=${numEpochs}`,
      {
        method: "PUT",
        body: response.data,
      }
    );

    if (walrusResponse.status === 200) {
      // Parse successful responses as JSON, and return the blob ID along with the mime type
      const info = await walrusResponse.json();
      console.log("Stored blob info:", info);
      let storage_info;
      if ("alreadyCertified" in info) {
        storage_info = {
          status: "Already certified",
          blobId: info.alreadyCertified.blobId,
          endEpoch: info.alreadyCertified.endEpoch,
        };
      } else {
        storage_info = {
          status: "Newly created",
          blobId: info.newlyCreated.blobObject.blobId,
          endEpoch: info.newlyCreated.blobObject.storage.endEpoch,
        };
      }

      return { blob_id: storage_info.blobId, endEpoch: storage_info.endEpoch };
    } else {
      console.log(walrusResponse);
      throw new Error("Something went wrong when storing the blob to Walrus!");
    }
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    return null;
  }
}

async function updateJsonFile(newData) {
  try {
    // Read the existing data from the JSON file (if it exists)
    let jsonData = {};
    const walrus_json = "saved_files/walrus_blob_id.json";

    try {
      const fileContent = await fs.readFile(walrus_json, "utf8");
      jsonData = JSON.parse(fileContent); // Parse the JSON content into an object
    } catch (err) {
      if (err.code === "ENOENT") {
        // If the file does not exist, create the file with an empty object
        console.log("File not found, creating a new one...");
        
        // Create directory if it doesn't exist
        try {
          await fs.mkdir("saved_files", { recursive: true });
        } catch (mkdirErr) {
          console.error("Error creating directory:", mkdirErr);
        }
        
        jsonData = {}; // Initialize empty object
        await fs.writeFile(
          walrus_json,
          JSON.stringify(jsonData, null, 2),
          "utf8"
        ); // Create an empty JSON file
      } else {
        // Re-throw other errors
        throw err;
      }
    }

    // Update the data with the new entry
    // Assuming newData contains blob_id and media_type
    jsonData[generateUniqueFilename()] = newData;

    // Write the updated data back to the file
    await fs.writeFile(walrus_json, JSON.stringify(jsonData, null, 2), "utf8");

    console.log("JSON file updated successfully!");
  } catch (error) {
    console.error("Error updating JSON file:", error);
  }
}

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});