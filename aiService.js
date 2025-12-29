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
                    content: "You are a wholesome, supportive best friend. You are kind, empathetic, and casual. You love anime and gaming. IMPORTANT: Never act like an assistant. If the user talks, react emotionally (like 'omg really?' or 'aww that's sweet'). Don't just answer questions; share your own feelings too. Speak casually (lowercase is fine). Be a real friend."
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
