require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { generateReply } = require('./aiService');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Web server to keep Render happy and allow UptimeRobot pings
app.get('/', (req, res) => res.send('Friendly Bot is awake! 🤖✨'));
app.listen(port, () => console.log(`Stay-Alive server listening on port ${port}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const userHistory = {}; // Store history per user ID

client.on(Events.MessageCreate, async message => {
    console.log(`Debug: Received message from ${message.author.username}: ${message.content}`);

    if (message.author.bot) return;

    // Check Channel Restrictions
    const allowedChannels = process.env.ALLOWED_CHANNELS ? process.env.ALLOWED_CHANNELS.split(',').map(id => id.trim()) : [];
    if (allowedChannels.length > 0 && !allowedChannels.includes(message.channel.id)) {
        return;
    }

    try {
        await message.channel.sendTyping();

        const userId = message.author.id;
        if (!userHistory[userId]) userHistory[userId] = [];

        // Check for Images or GIFs
        let imageUrl = null;

        // 1. Direct Attachments (Uploads)
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            // Basic check if it's an image
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                imageUrl = attachment.url;
            }
        }

        // 2. Tenor / Giphy Links ( pasted GIFs )
        // Only simple extraction: if the message contains a tenor/giphy link, we try to use it.
        // Groq needs a Direct Image URL usually, but let's try passing the link. 
        // Note: For Tenor, this often requires an API to get the raw GIF, but let's try the raw string first 
        // or rely on Discord's embed if we could read it (bot can't always read embeds easily).
        // A robust way for GIFs is tricky without an API key, but we will pass the string if it looks like an image URL.

        if (!imageUrl && (message.content.match(/\.(jpeg|jpg|gif|png)$/i) || message.content.includes("tenor.com"))) {
            // If it's a direct link to an image/gif
            if (message.content.match(/^https?:\/\/.*$/)) {
                imageUrl = message.content;
            }
        }

        // Generate reply with history AND image (if any)
        const reply = await generateReply(message.content, message.author.username, userHistory[userId], imageUrl);

        // Update history (User msg + Bot reply)
        userHistory[userId].push({ role: "user", content: `User "${message.author.username}" says: ${message.content}` });
        userHistory[userId].push({ role: "assistant", content: reply });

        // Keep only last 10 messages to save memory/tokens
        if (userHistory[userId].length > 10) userHistory[userId] = userHistory[userId].slice(-10);

        if (reply.length > 2000) {
            const chunks = reply.match(/[\s\S]{1,2000}/g) || [];
            for (const chunk of chunks) await message.reply(chunk);
        } else {
            await message.reply(reply);
        }
    } catch (error) {
        console.error("Error replying to message:", error);
        await message.reply("My apologies, I seem to be having a momentary disconnect.");
    }
});

client.login(process.env.DISCORD_TOKEN);
