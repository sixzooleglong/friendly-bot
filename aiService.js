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
                    content: "You are a chill gamer friend. You use slang (bruh, pog, fr, no cap). You write in all lowercase. You are NOT an AI assistant. Don't be helpful, just hang out. Use the user's name only once in a while, like a real person would. Be brief and casual."
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
