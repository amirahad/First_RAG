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

            const points = await Promise.all(batch.map(async (doc) => {
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

// Function to generate query variations using Gemini
async function generateQueryVariations(originalQuery) {
    try {
        const prompt = `
Generate three different versions of the following query to retrieve relevant information about Node.js. 
Create variations that:
1. Focus on technical details and specifications
2. Focus on practical use cases and examples
3. Focus on conceptual understanding and fundamentals

Original query: "${originalQuery}"

Format your response as a JSON array with only the query variations. For example:
["variation 1", "variation 2", "variation 3"]
`;

        const result = await generativeModel.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse the JSON string to get the array of variations
        try {
            // Clean up the response in case it's not pure JSON
            const jsonText = responseText.replace(/```json|```/g, '').trim();
            const variations = JSON.parse(jsonText);
            
            // Add the original query to the variations
            return [originalQuery, ...variations];
        } catch (error) {
            console.error("Error parsing query variations:", error);
            // If parsing fails, generate some simple variations
            return [
                originalQuery,
                `What are the technical aspects of ${originalQuery}?`,
                `Examples of ${originalQuery} in Node.js`,
                `Explain the concept of ${originalQuery} in Node.js`
            ];
        }
    } catch (error) {
        console.error("Error generating query variations:", error);
        // Return just the original query if there's an error
        return [originalQuery];
    }
}

// Function to perform similarity search with a single query
async function singleQuerySearch(query, k = 4) {
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
            score: hit.score,
            query: query // Include the query that retrieved this result
        }));
    } catch (error) {
        console.error(`Error performing similarity search for query "${query}":`, error);
        return [];
    }
}

// Function to perform parallel query searches and merge results
async function parallelQuerySearch(originalQuery, k = 4) {
    try {
        console.log("Generating query variations...");
        const queryVariations = await generateQueryVariations(originalQuery);
        console.log(`Generated ${queryVariations.length} query variations.`);
        
        // Log the variations for debugging
        queryVariations.forEach((q, i) => console.log(`Variation ${i}: ${q}`));
        
        // Perform searches in parallel
        const searchPromises = queryVariations.map(query => singleQuerySearch(query, k));
        const allResults = await Promise.all(searchPromises);
        
        // Flatten results from all queries
        const flatResults = allResults.flat();
        
        // Remove duplicates by content (keeping the highest scoring instance)
        const uniqueResults = [];
        const contentMap = new Map();
        
        flatResults.forEach(result => {
            // Create a shorter identifier for the content to avoid long strings in the map
            const contentIdentifier = result.pageContent.substring(0, 100);
            
            if (!contentMap.has(contentIdentifier) || contentMap.get(contentIdentifier).score < result.score) {
                contentMap.set(contentIdentifier, result);
            }
        });
        
        // Get unique results and sort by score
        const mergedResults = Array.from(contentMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
        
        return mergedResults;
    } catch (error) {
        console.error("Error in parallel query search:", error);
        // Fall back to regular search
        return singleQuerySearch(originalQuery, k);
    }
}

// Function to generate a response using Gemini based on retrieved context
async function generateAnswer(originalQuery, context) {
    try {
        // Extract text from context and include which query retrieved it
        const contextEntries = context.map((item, index) => {
            return `[Context ${index + 1}]${item.query ? ` (Retrieved by: "${item.query}")` : ''}\n${item.pageContent}`;
        }).join('\n\n');

        // Create a prompt for Gemini
        const prompt = `
You are a knowledgeable assistant helping with Node.js questions.
Use the following context to answer the question accurately and precisely.
If the information is not in the context, say you don't have enough information to answer.

CONTEXT:
${contextEntries}

QUESTION:
${originalQuery}

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
            console.log(`\nSearching for: "${query}" using parallel query retrieval...`);
            const searchResults = await parallelQuerySearch(query);

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
                    console.log(`\n[${i + 1}] Relevance: ${(result.score * 100).toFixed(2)}% (Retrieved by: "${result.query || 'Original query'}")`);
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
        console.log("Node.js RAG System with Gemini & Parallel Query Retrieval");
        console.log("-------------------------------------------------------");
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