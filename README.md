# Node.js RAG System with Gemini

A Retrieval-Augmented Generation (RAG) system built with Node.js that uses Google's Gemini AI and Qdrant vector database to answer questions about Node.js documentation.

![RAG System]

## 📋 Overview

This project implements a question-answering system that:

1. Processes a Node.js PDF documentation
2. Splits it into manageable chunks
3. Creates embeddings using Google's Gemini AI
4. Stores them in Qdrant vector database
5. Retrieves relevant context when a question is asked
6. Generates accurate answers based on the retrieved context

## ✨ Features

- **Document Processing**: Automatically processes PDF documents
- **Smart Chunking**: Splits documents with proper overlap
- **Vector Embeddings**: Creates high-quality embeddings with Gemini AI
- **Semantic Search**: Finds the most relevant context for any question
- **Answer Generation**: Produces concise and accurate answers
- **Interactive CLI**: Simple command-line interface for asking questions
- **Environment Variables**: Secure configuration with .env file

## 🛠️ Technologies

- Node.js
- Google Generative AI (Gemini)
- Qdrant Vector Database
- LangChain.js
- PDF Processing

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- Google Gemini API key
- Qdrant cloud account or local instance

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Edit the `.env` file with your API keys:
```
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
COLLECTION_NAME=learning_langchain
```

5. Place your Node.js documentation PDF in the project root:
```
node.pdf
```

### Usage

Run the RAG system:
```bash
node RAG.js
```

In the interactive prompt:
- Type your Node.js questions
- Type `exit` to quit the application
- Type `index` to reindex the document (if necessary)

## 📂 Project Structure

- `RAG.js` - Main application code
- `node.pdf` - Node.js documentation PDF
- `.env` - Environment variables (API keys, configuration)
- `package.json` - Project dependencies

## 🔧 Configuration

The system can be configured through the `.env` file:

```
GOOGLE_API_KEY=         # Your Google Gemini API key
QDRANT_URL=             # Qdrant server URL
QDRANT_API_KEY=         # Your Qdrant API key
COLLECTION_NAME=        # Name of your vector collection
```

## 📚 How It Works

1. **Document Loading**: PDF is loaded and processed
2. **Text Chunking**: Document is split into manageable chunks
3. **Embedding Creation**: Each chunk is converted to a vector embedding
4. **Vector Storage**: Embeddings are stored in Qdrant
5. **Query Processing**: User questions are converted to embeddings
6. **Similarity Search**: Most relevant document chunks are retrieved
7. **Response Generation**: AI generates answers based on retrieved context

## 📝 License

This project is licensed under the ISC License - see the `package.json` file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

Created by [amirahad](mailto:arahad4783@gmail.com)

