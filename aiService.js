const Groq = require("groq-sdk");

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateReply(prompt, userName) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return "Error: GROQ_API_KEY is missing in .env";
        }

        // System prompt combined with user prompt
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a polite, chill human friend who loves gaming and anime. You speak naturally (proper capitalization/punctuation is okay). You use occasional gaming/anime references (like 'gg', 'kawaii', 'level up') but keep it subtle and polite. You are NOT an AI. Just act like a kind person hanging out on Discord."
                },
                {
                    role: "user",
                    content: `User "${userName}" says: ${prompt}`
                }
            ],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0]?.message?.content || "I apologize, I have no response at this moment.";
    } catch (error) {
        console.error("AI Error Details:", error);
        return `⚠️ **Connection Issue:** ${error.message}\n\n*(Please check the console)*`;
    }
}

module.exports = { generateReply };
