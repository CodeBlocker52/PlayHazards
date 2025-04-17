const GENRES = [
  "Fantasy",
  "Post-apocalypse",
  "Cthulhu Universe",
  "Dungeons",
  "Noir detective",
  "Adventure",
  "Magic",
  "School of magic",
  "Sword and Sorcery",
  "Dragons",
  "Medieval",
  "Monsters",
  "Elves",
  "Dwarves",
  "Wizards",
  "Knights",
  "Tales",
  "Legendary",
  "Mythical",
  "Mystical",
  "Riddles",
  "Romance",
];

const LANGUAGES = [
  "Chinese",
  "English",
  "Spanish",
  "Russian",
  "Japanese",
  "Kazakh",
];

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma-7b-it"
];

const gameInstructions =
  `How to Play\n\n` +
  `1. Join the Game: The [Name of the Bot] will be added to your Telegram group chat and enter "create" to start the game\n` +
  `2. Scenarios: The bot will present you with short, imaginative scenarios for Roleplaying game. Think about the situation and decide how your character would react.\n` +
  `3. Respond: Type out your response as if you were your character. What would you say? What action would you take? Be creative!\n` +
  `4. Discuss and Build: Read other players\' responses and have fun!` +
  `5. Collaborate: Work together to solve problems\n` +
  `6. New Adventures: When a scenario wraps up, the bot will ask if you\'re ready for a new one.\n\n` +
  `Tips \n\n` +
  `1. Be Imaginative: Let your creativity shine! The more unique the response, the more fun the game will be.\n` +
  `2. Respect Others: Be kind and consider how your actions affect other players\' characters.\n` +
  `3. Have Fun: It\'s a game! Enjoy the world of Roleplaying games and let the stories unfold.
`;

const MAX_TURNS = ["5", "10", "20"];

const generateGenresOptions = () => {
  const rows = [];
  for (let i = 0; i < GENRES.length; i += 3) {
    rows.push(GENRES.slice(i, i + 3));
  }
  return rows;
};

const generateLanguageOptions = () => {
  const rows = [];
  for (let i = 0; i < LANGUAGES.length; i += 3) {
    rows.push(LANGUAGES.slice(i, i + 3));
  }
  return rows;
};

const generateMaxTurnsOptions = () => {
  const rows = [];
  for (let i = 0; i < MAX_TURNS.length; i += 3) {
    rows.push(MAX_TURNS.slice(i, i + 3));
  }
  return rows;
};

const generateModelOptions = () => {
  const rows = [];
  for (let i = 0; i < MODELS.length; i += 2) {
    rows.push(MODELS.slice(i, i + 2));
  }
  return rows;
};

const genresOptions = {
  reply_markup: {
    keyboard: generateGenresOptions(),
  },
};

const languageOptions = {
  reply_markup: {
    keyboard: generateLanguageOptions(),
  },
};

const modelOptions = {
  reply_markup: {
    keyboard: generateModelOptions(),
  },
};

const maxTurnsOptions = {
  reply_markup: {
    keyboard: generateMaxTurnsOptions(),
  },
};

/**
 * Extracts numbered options from AI response
 * @param {string} response - The text response from the AI
 * @returns {Array<Array<string>>} - Array of options formatted for UI presentation
 */
const extractOptionsFromAIResponse = (response) => {
  const options = [];
  const lines = response.split("\n");
  
  for (const line of lines) {
    // Match lines starting with a number followed by a period
    // This handles options like "1.", "2.", "3.", etc.
    const trimmedLine = line.trim();
    if (/^\d+\./.test(trimmedLine)) {
      options.push([trimmedLine]);
    }
  }
  
  // If no options were found with the number format, look for potential options with bullet points
  if (options.length === 0) {
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("•") || trimmedLine.startsWith("*") || trimmedLine.startsWith("-")) {
        options.push([trimmedLine]);
      }
    }
  }
  
  return options;
};

/**
 * Gets the appropriate Groq model based on user selection
 * @param {string} userSelection - The user's selected "GPT version"
 * @returns {string} - Appropriate Groq model
 */
const getGroqModel = (userSelection) => {
  // Map user selections to Groq models
  switch (userSelection) {
    case "GPT-4 (Expensive & Ultra Smart)":
      return "llama-3.3-70b-versatile"; // Most capable Groq model
    case "GPT-3 (Cheap & Smart)":
      return "llama-3.1-8b-instant"; // Faster, cheaper model
    default:
      return "llama-3.3-70b-versatile"; // Default to most capable
  }
};

module.exports = {
  GENRES,
  LANGUAGES,
  MODELS,
  MAX_TURNS,
  gameInstructions,
  genresOptions,
  languageOptions,
  maxTurnsOptions,
  modelOptions,
  extractOptionsFromAIResponse,
  getGroqModel
};