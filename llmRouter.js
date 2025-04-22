// Import required libraries
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Loads AI model data from the JSON file
 * @returns {Promise<Array>} Array of AI model objects
 */
async function loadAIModelData() {
    try {
        const filePath = path.resolve('./aiModels.json');
        const fileData = await fs.readFile(filePath, 'utf8');
        const modelData = JSON.parse(fileData);
        return modelData.models;
    } catch (error) {
        console.error("Error loading AI model data:", error);
        process.exit(1);
    }
}

/**
 * Creates a prompt for Gemini to analyze the user's query and recommend an AI model
 * @param {string} userQuery - User's query about what they want to do with an AI model
 * @param {Array} modelDatabase - Array of AI model objects
 * @returns {string} The formatted prompt
 */
function createModelSelectorPrompt(userQuery, modelDatabase) {
    const modelData = modelDatabase.map(model => `
    Model: ${model.name}
    Provider: ${model.provider}
    Best for: ${model.bestFor}
    Pricing: ${model.pricing}
    Limitations: ${model.limitations}
  `).join('\n');

    return `
    You are a knowledgeable AI model selector. Your job is to recommend the best AI model based on the user's needs.
    
    Below is information about various AI models:
    ${modelData}
    
    User Query: "${userQuery}"
    
    Based on the user's query, please analyze which AI model would be the best fit.
    
    In your response, provide:
    1. The recommended AI model name
    2. Why this model is the best fit for their needs
    3. Pricing considerations
    4. Any limitations or alternatives they should consider
    5. A brief suggestion on how they might implement their solution
    
    Format your response in a clear, structured way with headings.
  `;
}

/**
 * Uses Gemini to analyze a query and recommend the best AI model
 * @param {string} query - User's query about what they want to do with an AI model
 * @param {Array} modelDatabase - Array of AI model objects
 * @returns {Promise<string>} Gemini's recommendation
 */
async function recommendAIModel(query, modelDatabase) {
    try {
        // Get the Gemini model (using the latest model)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Create the prompt
        const prompt = createModelSelectorPrompt(query, modelDatabase);

        // Generate content using Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Error recommending AI model:", error);
        return "Sorry, I encountered an error while trying to recommend an AI model. Please check your API key and try again.";
    }
}

/**
 * Creates a CLI interface to get user queries and provide recommendations
 */
async function main() {
    try {
        // Load model data from JSON file
        const modelDatabase = await loadAIModelData();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n===== AI Model Recommender =====");
        console.log("Describe what you want to build or the problem you're trying to solve,");
        console.log("and I'll recommend the best AI model for your needs.");
        console.log("Type 'exit' to quit.\n");

        // Function to ask questions and get recommendations
        const askQuestion = () => {
            rl.question("\nYour query: ", async (query) => {
                if (query.toLowerCase() === 'exit') {
                    console.log("Thank you for using the AI Model Recommender. Goodbye!");
                    rl.close();
                    return;
                }

                console.log("\nAnalyzing your needs...");
                const recommendation = await recommendAIModel(query, modelDatabase);
                console.log("\n=== RECOMMENDATION ===\n");
                console.log(recommendation);
                console.log("\n========================\n");

                askQuestion(); // Continue the loop
            });
        };

        askQuestion();
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}

// Check if GOOGLE_API_KEY is available
if (!process.env.GOOGLE_API_KEY) {
    console.error("Error: GOOGLE_API_KEY is not set in your environment variables.");
    console.log("Please create a .env file with your Google AI API key:");
    console.log("GOOGLE_API_KEY=your_api_key_here");
    process.exit(1);
}

// Start the application
main().catch(console.error);