const Groq = require("groq-sdk");

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateReply(prompt, userName, history = []) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return "Error: GROQ_API_KEY is missing in .env";
        }

        // System prompt + History + Current Prompt
        const messages = [
            {
                role: "system",
                content: "You are a polite, sweet, and chill best friend. You use slang, kindness, and are not helpful (just supportive). You are allowed to be very casual. Never ask 'how can I help'. Just chat. IMPORTANT: Do NOT use the user's name. Just talk to them directly."
            },
            ...history, // Add past conversation
            {
                role: "user",
                content: `User "${userName}" says: ${prompt}`
            }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0]?.message?.content || "I apologize, I have no response at this moment.";
    } catch (error) {
        console.error("AI Error Details:", error);
        return `⚠️ **Connection Issue:** ${error.message}\n\n*(Please check the console)*`;
    }
}

module.exports = { generateReply };
