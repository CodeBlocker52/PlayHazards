require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const {
  startGameSession,
  sendQuery,
  generateImageResponse,
} = require("./gameSession");
const { extractOptionsFromAIResponse } = require("./utils");
const { v4: uuidv4 } = require("uuid");
const connectDB = require('./db/connection');
const userController = require('./controllers/userController');
const User = require('./models/User');

// Constants
const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const MAX_TURNS = parseInt(process.env.MAX_TURNS || "10");
const MAX_CHARS = parseInt(process.env.MAX_CHARS || "1000");
const STORAGE_DIR = process.env.STORAGE_DIR || "saved_files";
const WALRUS_JSON = path.join(STORAGE_DIR, "walrus_blob_id.json");
const WALRUS_URL = process.env.WALRUS_URL || "https://walrus-testnet-publisher.nodes.guru";
const WALRUS_EPOCHS = parseInt(process.env.WALRUS_EPOCHS || "25");

const fs = require("fs").promises;
const axios = require("axios");

// Create a unique session ID
const sessionId = uuidv4();

// Store game settings for active sessions
const gameSessions = new Map();

// Connect to MongoDB
connectDB();

// Configure middleware
app.use(express.static("public"));
app.use(cors({ origin: CORS_ORIGIN }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Route to serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "web_index.html"));
});

// API routes
// User profile routes
app.get('/api/users/:walletAddress', userController.getUserProfile);
app.put('/api/users/:walletAddress', userController.updateUserProfile);
app.put('/api/users/:walletAddress/stats', userController.updateGameStats);

// Game routes
app.post("/api/start", async (req, res) => {
  try {
    const { 
      gptVersion, 
      language, 
      genre, 
      turns, 
      wallet_address, 
      max_chars = MAX_CHARS 
    } = req.body;

    // Input validation
    if (!gptVersion || !language || !genre) {
      return res.status(400).json({
        success: false,
        message: "Missing required game parameters"
      });
    }

    // Validate turns is within reasonable limits
    const gameTurns = turns ? Math.min(parseInt(turns), MAX_TURNS) : 5;
    
    // Initialize game settings
    const gameSettings = {
      gptVersion,
      language,
      genre,
      turns: gameTurns,
      max_chars: Math.min(parseInt(max_chars), MAX_CHARS),
      round: 1,
      isGameStarted: true,
      startTime: Date.now()
    };

    // Store session in memory
    gameSessions.set(sessionId, gameSettings);

    // Start the game and get the initial response
    const response = await startGameSession(
      wallet_address ? wallet_address.toLowerCase().trim() : null, 
      sessionId, 
      gameSettings
    );
    
    const choices = extractOptionsFromAIResponse(response);

    // Don't need to update gamesPlayed since it's been removed

    res.json({ 
      success: true,
      sessionId,
      message: response, 
      choices,
      settings: gameSettings
    });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start game",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post("/api/continue", async (req, res) => {
  try {
    const { userPrompt, wallet_address, sessionId: requestSessionId } = req.body;
    
    // Input validation
    if (!userPrompt) {
      return res.status(400).json({
        success: false,
        message: "User prompt is required"
      });
    }
    
    // Use the provided sessionId or the global one
    const currentSessionId = requestSessionId || sessionId;
    const gameSettings = gameSessions.get(currentSessionId);

    if (!gameSettings || !gameSettings.isGameStarted) {
      return res.status(400).json({ 
        success: false,
        message: "No active game session. Start a new game!" 
      });
    }

    // Increment the round and check if the game should end
    gameSettings.round++;
    if (gameSettings.round > +gameSettings.turns) {
      gameSettings.isGameStarted = false;
      gameSessions.delete(currentSessionId);
      
      return res.json({ 
        success: true,
        message: "Game finished. Start a new game?",
        gameComplete: true
      });
    }

    // Add the round information to the user prompt
    const promptWithRound = `Round ${gameSettings.round}/${gameSettings.turns}: ${userPrompt}`;

    // Continue the game session with the user's input
    const walletAddress = wallet_address ? wallet_address.toLowerCase().trim() : null;
    const response = await sendQuery(walletAddress, currentSessionId, promptWithRound);
    const choices = extractOptionsFromAIResponse(response);

    let responseData = { 
      success: true,
      message: response, 
      choices,
      round: gameSettings.round,
      totalRounds: gameSettings.turns
    };

    try {
      // Generate an image related to the game response
      const imageResponse = await generateImageResponse(response);
      
      // If image generation succeeded, upload to walrus
      if (imageResponse?.data?.[0]?.url) {
        try {
          const walrusData = await uploadToWalrus(imageResponse.data[0].url);
          if (walrusData) {
            await updateJsonFile(walrusData);
            responseData.imageUrl = imageResponse.data[0].url;
            responseData.walrusData = walrusData;
          }
        } catch (walrusError) {
          console.error("Error with Walrus upload:", walrusError);
          // Still include the image URL even if Walrus upload failed
          responseData.imageUrl = imageResponse.data[0].url;
          responseData.walrusError = "Failed to store image on Walrus";
        }
      }
    } catch (imageError) {
      console.error("Error generating image:", imageError);
      responseData.imageError = "Failed to generate image";
    }

    res.json(responseData);
  } catch (error) {
    console.error("Error in /continue route:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process game turn",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get("/api/gallery", async (req, res) => {
  try {
    // Ensure the directory exists
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    try {
      const fileContent = await fs.readFile(WALRUS_JSON, "utf8");
      const jsonData = JSON.parse(fileContent);
      res.json({
        success: true,
        data: jsonData
      });
    } catch (error) {
      if (error.code === "ENOENT") {
        // Create empty file if it doesn't exist
        await fs.writeFile(WALRUS_JSON, JSON.stringify({}), "utf8");
        res.json({
          success: true,
          data: {}
        });
      } else {
        throw error; // Re-throw for the outer catch
      }
    }
  } catch (error) {
    console.error("Error reading gallery data:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to load gallery data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Generate a unique filename for storing images
 * @returns {string} Unique filename
 */
function generateUniqueFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `dnd_${timestamp}.png`;
}

/**
 * Upload an image to Walrus storage
 * @param {string} imageUrl - URL of the image to upload
 * @returns {Promise<Object|null>} Walrus storage information or null on failure
 */
async function uploadToWalrus(imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error("Image URL is required");
    }

    // Fetch the image from the URL and convert it to a Blob
    const response = await axios.get(imageUrl, { 
      responseType: "arraybuffer",
      timeout: 10000 // 10 second timeout
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch the image from URL: ${response.status}`);
    }

    // Submit a PUT request to store the image blob to Walrus
    const walrusResponse = await fetch(
      `${WALRUS_URL}/v1/store?epochs=${WALRUS_EPOCHS}`,
      {
        method: "PUT",
        body: response.data,
        headers: {
          "Content-Type": "application/octet-stream"
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (!walrusResponse.ok) {
      throw new Error(`Walrus storage failed: ${walrusResponse.status} ${walrusResponse.statusText}`);
    }

    const info = await walrusResponse.json();
    console.log("Stored blob info:", info);
    
    let storage_info;
    if ("alreadyCertified" in info) {
      storage_info = {
        status: "Already certified",
        blobId: info.alreadyCertified.blobId,
        endEpoch: info.alreadyCertified.endEpoch,
        timestamp: Date.now()
      };
    } else if ("newlyCreated" in info) {
      storage_info = {
        status: "Newly created",
        blobId: info.newlyCreated.blobObject.blobId,
        endEpoch: info.newlyCreated.blobObject.storage.endEpoch,
        timestamp: Date.now()
      };
    } else {
      throw new Error("Unexpected response format from Walrus");
    }

    return { 
      blob_id: storage_info.blobId, 
      endEpoch: storage_info.endEpoch,
      timestamp: storage_info.timestamp
    };
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    // Re-throw to handle at caller level
    throw new Error(`Walrus upload failed: ${error.message}`);
  }
}

/**
 * Update the JSON file with new Walrus blob data
 * @param {Object} newData - New blob data to add
 */
async function updateJsonFile(newData) {
  try {
    // Ensure the directory exists
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    // Read the existing data from the JSON file (if it exists)
    let jsonData = {};
    
    try {
      const fileContent = await fs.readFile(WALRUS_JSON, "utf8");
      jsonData = JSON.parse(fileContent);
    } catch (err) {
      if (err.code === "ENOENT") {
        // If the file does not exist, create with an empty object
        jsonData = {};
      } else {
        // Re-throw other errors
        throw err;
      }
    }

    // Generate unique filename and add timestamp
    const filename = generateUniqueFilename();
    newData.addedAt = Date.now();
    
    // Update the data with the new entry
    jsonData[filename] = newData;

    // Write the updated data back to the file
    await fs.writeFile(WALRUS_JSON, JSON.stringify(jsonData, null, 2), "utf8");
    console.log("JSON file updated successfully!");
    return filename;
  } catch (error) {
    console.error("Error updating JSON file:", error);
    throw error; // Re-throw to handle at caller level
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: Date.now()
  });
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Graceful shutdown initiated...');
  // Close database connection and other resources
  // ...
  console.log('Server is shutting down');
  process.exit(0);
}

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Export for testing purposes
module.exports = app;