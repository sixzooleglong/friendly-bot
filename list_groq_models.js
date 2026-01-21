const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    const models = await groq.models.list();
    console.log("Available Models:");
    models.data.forEach((model) => {
        console.log(`- ${model.id}`);
    });
}

main().catch(console.error);
