const Groq = require("groq-sdk");

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateReply(prompt, userName, history = [], imageUrl = null) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return "Error: GROQ_API_KEY is missing in .env";
        }

        let model = "llama-3.3-70b-versatile";
        let userContent = `User "${userName}" says: ${prompt}`;

        // Prepare messages
        const messages = [
            {
                role: "system",
                content: "You are a polite, sweet, and chill best friend. You use slang, kindness, and are not helpful (just supportive). You are allowed to be very casual. Never ask 'how can I help'. Just chat. IMPORTANT: Do NOT use the user's name. Just talk to them directly."
            },
            ...history
        ];

        // Handle Vision (Image)
        if (imageUrl) {
            model = "meta-llama/llama-4-scout-17b-16e-instruct"; // Switch to Llama 4 Scout (Vision)

            // Vision models require a slightly different message format
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: userContent },
                    { type: "image_url", image_url: { url: imageUrl } }
                ]
            });
        } else {
            // Normal Text
            messages.push({
                role: "user",
                content: userContent
            });
        }

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: model,
        });

        return completion.choices[0]?.message?.content || "I apologize, I have no response at this moment.";
    } catch (error) {
        console.error("AI Error Details:", error);
        return `⚠️ **Connection Issue:** ${error.message}\n\n*(Please check the console)*`;
    }
}

module.exports = { generateReply };
