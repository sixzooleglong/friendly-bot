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

    try {
        await message.channel.sendTyping();

        const userId = message.author.id;
        if (!userHistory[userId]) userHistory[userId] = [];

        // Generate reply with history
        const reply = await generateReply(message.content, message.author.username, userHistory[userId]);

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
