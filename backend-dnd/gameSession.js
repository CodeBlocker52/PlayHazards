require("dotenv").config();
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// const userSessionDictionary = new Map<string, { threadId: string; sessions: Record<string, string> }>();
const userSessionDictionary = new Map();

function generate_instruction(gameSettings) {
  const instructions = `You are the author of an interactive quest in a ${gameSettings.genre} setting. 
    Come up with an interesting story. Your message is a part of the story that forces the player(s) to make a choice.
    The game should consist of a short part (up to ${gameSettings.max_chars} characters) of your story and the options for player actions you propose.
    At the end of each of your messages, ask a question about how the player should act in the current situation, except the last turn. 
    Offer at minimum three options to choose from, but leave the opportunity to offer actions by player, the options should start with "1.", "2.", etc..
    The quest must be completed within ${gameSettings.turns} player turns.
    The game can be played by only one player. 
    Create a story. Players will respond with the structure {"user": "Response"}.
    With each turn the situation should become more intense and logically related to the previous turn.
    The player may encounter various dangers on theirs journey. 
    If the player chooses a bad answer, player may die and then the game will end.
    Use a speaking style that suits the chosen setting.
    Each time you would be notified with the current turn/round number.
        Make sure to finish the story within ${gameSettings.turns} rounds.
        Don't ask the user anything after the game finishes. Just congratulate.
    Communicate with players in (${gameSettings.language} language). Each response should be in the same language - ${gameSettings.language}.
    After the end of the game (due to the death of the player or due to the fact that all turns have ended), invite the player to start again`;
    return instructions;
}

const startGameSession = async (
  wallet_address,
  session_id,
  gameSettings,
) => {
    // Create a new conversation history for this session
    if (!userSessionDictionary.has(wallet_address)) {
      userSessionDictionary.set(wallet_address, { sessions: {} });
    }
    
    // Initialize conversation history for this session
    userSessionDictionary.get(wallet_address).sessions[session_id] = [];
    
    try {
      // Add system message with instructions
      const systemMessage = {
        role: "system",
        content: generate_instruction(gameSettings)
      };
      
      // Store the system message in session history
      userSessionDictionary.get(wallet_address).sessions[session_id].push(systemMessage);
      
      // Get initial response from AI
      const chatCompletion = await groq.chat.completions.create({
        messages: userSessionDictionary.get(wallet_address).sessions[session_id],
        model: "llama-3.3-70b-versatile",
      });
      
      const ai_message = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      
      // Store AI's response in session history
      userSessionDictionary.get(wallet_address).sessions[session_id].push({
        role: "assistant",
        content: ai_message
      });

      return ai_message;
    } catch (error) {
      console.error('Error fetching data from Groq:', error);
      return "Sorry, I encountered an error while generating your game. Please try again.";
    }
};

const sendQuery = async (
  wallet_address,
  session_id,
  userPrompt
) => {
    // Get session history
    const sessionHistory = userSessionDictionary.get(wallet_address)?.sessions[session_id];
    
    if (!sessionHistory) {
      return "Session not found. Please start a new game.";
    }
    
    console.log("User prompt:", userPrompt);
    
    // Add user message to history
    sessionHistory.push({
      role: 'user',
      content: userPrompt,
    });
    
    try {
      // Get response from Groq
      const chatCompletion = await groq.chat.completions.create({
        messages: sessionHistory,
        model: "llama-3.3-70b-versatile",
      });
      
      const ai_message = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      
      // Add AI response to history
      sessionHistory.push({
        role: 'assistant',
        content: ai_message
      });

      return ai_message;
    } catch (error) {
      console.error('Error fetching data from Groq:', error);
      return "Sorry, I am having trouble understanding you. Could you please rephrase your question?";
    }
};

async function generateImageResponse(prompt) {
  try {
    // NOTE: This function needs to be replaced with an image generation service
    // that's compatible with your requirements, as Groq doesn't currently offer image generation
    // Options: Stability AI, Replicate, or others
    
    // Placeholder for now - you would need to integrate an alternative service
    console.log("Image generation prompt:", prompt);
    return {
      data: [
        {
          url: "https://placeholder.com/1024x1024"
        }
      ]
    };
    
    // Example integration with Replicate or another service would go here
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      data: [
        {
          url: "https://placeholder.com/1024x1024"
        }
      ]
    };
  }
}

module.exports = {
  startGameSession,
  generateImageResponse,
  sendQuery
};