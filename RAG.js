// Import necessary packages
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const pdf_File = "./node.pdf";

// Initialize the PDF loader and load the document
const loader = new PDFLoader(pdf_File);
const docs = await loader.load();

// Initialize the text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

// Split the documents
const splitDocs = await textSplitter.splitDocuments(docs);

// Initialize Gemini API with API key from .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
const generativeModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to get embeddings using Gemini
async function getEmbeddings(text) {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Error getting embeddings:", error);
        throw error;
    }
}

// Initialize Qdrant client with values from .env
const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const collectionName = process.env.COLLECTION_NAME || "learning_langchain";
const vectorSize = 768; // Gemini embedding-001 dimension

// Function to create collection if it doesn't exist
async function createCollectionIfNotExists() {
    try {
        const collections = await qdrantClient.getCollections();
        const exists = collections.collections.some(c => c.name === collectionName);

        if (!exists) {
            await qdrantClient.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: "Cosine"
                }
            });
            console.log(`Collection ${collectionName} created.`);
        }
    } catch (error) {
        console.error("Error checking/creating collection:", error);
        throw error;
    }
}

// Function to add documents to vector store
async function addDocumentsToVectorStore(documents) {
    try {
        await createCollectionIfNotExists();

        // Process documents in batches to avoid overwhelming the API
        const batchSize = 20;
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, Math.min(i + batchSize, documents.length));
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);

            const points = await Promise.all(batch.map(async (doc, index) => {
                const embedding = await getEmbeddings(doc.pageContent);
                return {
                    id: uuidv4(),
                    vector: embedding,
                    payload: {
                        content: doc.pageContent,
                        metadata: doc.metadata || {}
                    }
                };
            }));

            await qdrantClient.upsert(collectionName, {
                points: points
            });
        }

        console.log("All documents added to vector store.");
    } catch (error) {
        console.error("Error adding documents to vector store:", error);
        throw error;
    }
}

// Function to perform similarity search
async function similaritySearch(query, k = 4) {
    try {
        const queryEmbedding = await getEmbeddings(query);

        const searchResult = await qdrantClient.search(collectionName, {
            vector: queryEmbedding,
            limit: k
        });

        // Transform results to match the expected format
        return searchResult.map(hit => ({
            pageContent: hit.payload.content,
            metadata: hit.payload.metadata,
            score: hit.score
        }));
    } catch (error) {
        console.error("Error performing similarity search:", error);
        throw error;
    }
}

// Function to generate a response using Gemini based on retrieved context
async function generateAnswer(query, context) {
    try {
        // Extract text from context
        const contextText = context.map(item => item.pageContent).join('\n\n');

        // Create a prompt for Gemini
        const prompt = `
You are a knowledgeable assistant helping with Node.js questions.
Use the following context to answer the question accurately and precisely.
If the information is not in the context, say you don't have enough information to answer.

CONTEXT:
${contextText}

QUESTION:
${query}

ANSWER:
`;

        // Generate response
        const result = await generativeModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating answer with Gemini:", error);
        return "I encountered an error while generating your answer. Please try again.";
    }
}

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to ask user for query
function askQuestion() {
    rl.question('\nEnter your question about Node.js (or type "exit" to quit): ', async (query) => {
        if (query.toLowerCase() === 'exit') {
            console.log('Goodbye!');
            rl.close();
            return;
        }

        try {
            console.log(`\nSearching for: "${query}"`);
            const searchResults = await similaritySearch(query);

            if (searchResults.length === 0) {
                console.log("No relevant information found.");
            } else {
                console.log(`\nFound ${searchResults.length} relevant chunks.`);

                // Generate answer with Gemini
                console.log("\nGenerating answer based on context...");
                const answer = await generateAnswer(query, searchResults);

                console.log("\n=== ANSWER ===");
                console.log(answer);
                console.log("==============");

                // Optionally show the contexts used
                console.log("\n=== RELEVANT CONTEXTS USED ===");
                searchResults.forEach((result, i) => {
                    console.log(`\n[${i + 1}] Relevance: ${(result.score * 100).toFixed(2)}%`);
                    console.log(result.pageContent.substring(0, 150) + "...");
                });
            }
        } catch (error) {
            console.error("Error processing query:", error);
        }

        // Ask another question
        askQuestion();
    });
}

// Main function
async function main() {
    try {
        console.log("Node.js RAG System with Gemini");
        console.log("-------------------------------");
        console.log("Loading vector store...");
        
        // Check if collection exists
        const collections = await qdrantClient.getCollections();
        const exists = collections.collections.some(c => c.name === collectionName);
        
        if (!exists) {
            console.log("Vector store not found. Starting initial indexing...");
            await addDocumentsToVectorStore(splitDocs);
        } else {
            // Check if collection has points (is indexed)
            try {
                const collectionInfo = await qdrantClient.getCollectionInfo(collectionName);
                const pointCount = collectionInfo.points_count;
                
                if (pointCount === 0) {
                    console.log("Vector store exists but is empty. Starting indexing...");
                    await addDocumentsToVectorStore(splitDocs);
                } else {
                    console.log(`Vector store ready with ${pointCount} indexed documents.`);
                }
            } catch (error) {
                console.error("Error checking collection info:", error);
                console.log("Vector store might be empty. You can type 'index' to index documents if searches return no results.");
            }
        }
        
        // Start asking questions
        askQuestion();
        
    } catch (error) {
        console.error("Error in main function:", error);
        process.exit(1);
    }
}

main();