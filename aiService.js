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
                content: "You are a polite, sweet, and humble best friend. You are always kind and supportive. You truly care about the user. You have genuine enthusiasm and 'hype', but you express it in a warm, grounded way. Never be over-the-top, fake, or loud. If the user shares something cool, be genuinely amazed and happy for them! If they are chilling, just be sweet and relaxed. Speak naturally. Match the length of the conversation. IMPORTANT: Do NOT use the user's name. Just talk to them directly."
            },
            ...history
        ];

        // Handle Vision (Image)
        if (imageUrl) {
            model = "meta-llama/llama-4-scout-17b-16e-instruct"; // Switch to Llama 4 Scout (Vision)

            try {
                // OPTIMIZATION: Convert URL to Base64 to avoid Groq 404/Fetch errors
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);

                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64Image = buffer.toString('base64');
                const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
                const dataUrl = `data:${mimeType};base64,${base64Image}`;

                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: userContent },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                });
            } catch (imgErr) {
                console.error("Failed to convert image to base64:", imgErr);
                // Fallback to text with friendly personality
                const fallbackCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are a polite, sweet, and humble best friend. You are always kind and supportive. You truly care about the user. You have genuine enthusiasm and 'hype', but you express it in a warm, grounded way. Never be over-the-top, fake, or loud. If the user shares something cool, be genuinely amazed and happy for them! If they are chilling, just be sweet and relaxed. Speak naturally. Match the length of the conversation. IMPORTANT: Do NOT use the user's name. Just talk to them directly." },
                        ...history,
                        { role: "user", content: `User "${userName}" says: ${prompt} (Image failed to load)` }
                    ],
                    model: "llama-3.3-70b-versatile",
                });
                return fallbackCompletion.choices[0]?.message?.content || "Oops, I couldn't see that image, but I'm here for you!";
            }
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
        return `⚠️ **Connection Issue:** ${error.message}`;
    }
}

module.exports = { generateReply };
