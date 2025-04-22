// aiModelsDatabase.js - Collection of AI model information for the router

// AI model information database with focused selection
const AI_MODEL_DATABASE = [
    // OpenAI Models
    {
        name: "GPT-4o",
        provider: "OpenAI",
        bestFor: "State-of-the-art reasoning, multimodal capabilities, complex instructions, and vision tasks",
        pricing: "~$0.01 per 1K tokens input, $0.03 per 1K tokens output",
        limitations: "Usage caps may apply, rate limits for API access"
    },
    {
        name: "GPT-4 Turbo",
        provider: "OpenAI",
        bestFor: "Advanced reasoning, complex instructions, creative writing, and nuanced content generation",
        pricing: "~$0.01 per 1K tokens input, $0.03 per 1K tokens output",
        limitations: "Can be expensive for large-scale use, slightly older than GPT-4o"
    },
    {
        name: "GPT-3.5-Turbo",
        provider: "OpenAI",
        bestFor: "Cost-effective chatbots, content generation, summarization, general applications",
        pricing: "~$0.0005 per 1K tokens input, $0.0015 per 1K tokens output",
        limitations: "Less capable than GPT-4, occasionally hallucinates"
    },

    // Claude Models
    {
        name: "Claude 3 Opus",
        provider: "Anthropic",
        bestFor: "Enterprise-grade reasoning, long-form content, instruction following with high accuracy",
        pricing: "~$0.015 per 1K input tokens, $0.075 per 1K output tokens",
        limitations: "Higher latency than some competitors, higher cost"
    },
    {
        name: "Claude 3 Sonnet",
        provider: "Anthropic",
        bestFor: "Balanced performance and cost for general purpose applications, reliable reasoning",
        pricing: "~$0.003 per 1K input tokens, $0.015 per 1K output tokens",
        limitations: "Less powerful than Opus, but more cost-effective"
    },
    {
        name: "Claude 3 Haiku",
        provider: "Anthropic",
        bestFor: "Fast responses, high throughput applications, embedding in products",
        pricing: "~$0.00025 per 1K input tokens, $0.00125 per 1K output tokens",
        limitations: "Less capable than larger Claude models, but fastest and most cost-effective"
    },
    {
        name: "Claude 3.7 Sonnet",
        provider: "Anthropic",
        bestFor: "   Best for: Advanced reasoning, high-quality creative content, complex coding tasks, technical problem solving",
        pricing: "~$0.005 per 1K input tokens, $0.025 per 1K output tokens",
        limitations: "Less capable than Claude 3, but cheaper and faster"
    },

    // Gemini Models
    {
        name: "Gemini 1.5 Pro",
        provider: "Google",
        bestFor: "1 million token context window, multimodal tasks, code generation, reasoning",
        pricing: "~$0.0007 per 1K input tokens, $0.0014 per 1K output tokens",
        limitations: "Performance can vary across specialized tasks"
    },
    {
        name: "Gemini 1.5 Flash",
        provider: "Google",
        bestFor: "Cost-effective, high-throughput applications with good performance",
        pricing: "~$0.00035 per 1K input tokens, $0.0007 per 1K output tokens",
        limitations: "Less powerful than Pro version, but faster and more cost-effective"
    },
    {
        name: "Gemini 1.0 Ultra",
        provider: "Google",
        bestFor: "Enterprise use cases requiring high accuracy and reliability",
        pricing: "Higher tier pricing through enterprise agreements",
        limitations: "Being phased out in favor of Gemini 1.5 models"
    },

    // DeepSeek Models
    {
        name: "DeepSeek Coder",
        provider: "DeepSeek",
        bestFor: "Specialized code generation, understanding, and editing across multiple languages",
        pricing: "Free for open-source version, API pricing varies",
        limitations: "More specialized for coding than general tasks"
    },
    {
        name: "DeepSeek LLM",
        provider: "DeepSeek",
        bestFor: "General language tasks with strong math and reasoning capabilities",
        pricing: "Free for open-source version, API pricing varies",
        limitations: "Less widely integrated into tools than competitors"
    },

    // Grok Model
    {
        name: "Grok-1",
        provider: "xAI",
        bestFor: "Real-time information access, conversational interactions with personality",
        pricing: "Available via X (Twitter) Premium subscription",
        limitations: "Limited availability, less enterprise integration options"
    },

    // Image Generation Models
    {
        name: "DALL-E 3",
        provider: "OpenAI",
        bestFor: "High-quality image generation from detailed text prompts",
        pricing: "~$0.04-0.12 per image depending on size",
        limitations: "Limited control over specific elements, no animation capabilities"
    },
    {
        name: "Midjourney v6",
        provider: "Midjourney",
        bestFor: "Artistic, highly aesthetic image generation with style control",
        pricing: "Subscription based: $10-60/month",
        limitations: "Discord-only interface unless using unofficial APIs, less precise than DALL-E for some instructions"
    },
    {
        name: "Stable Diffusion XL",
        provider: "Stability AI",
        bestFor: "Open-source image generation, local hosting, customization",
        pricing: "Free for self-hosting, API usage varies",
        limitations: "Requires technical setup for best results, higher resource needs for local deployment"
    },

    // Video Generation Models
    {
        name: "Sora",
        provider: "OpenAI",
        bestFor: "High-quality, longer video generation from text descriptions",
        pricing: "Limited access, pricing not publicly available",
        limitations: "Very limited availability, currently in research preview"
    },
    {
        name: "Gen-2",
        provider: "Runway",
        bestFor: "Short video generation, image-to-video, and video editing",
        pricing: "Subscription based: $15-95/month",
        limitations: "Limited video length (typically under 20 seconds), may require visual references"
    },
    {
        name: "Pika 1.0",
        provider: "Pika Labs",
        bestFor: "Accessible video generation with style control and image-to-video capabilities",
        pricing: "Freemium model with paid tiers",
        limitations: "Shorter video output, less photorealistic than some competitors"
    }
];

// Export the database for use in other files
export default AI_MODEL_DATABASE;