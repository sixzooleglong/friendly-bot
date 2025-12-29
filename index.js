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

client.on(Events.MessageCreate, async message => {
    console.log(`Debug: Received message from ${message.author.username}: ${message.content}`);

    // Ignore updates from self
    if (message.author.bot) {
        console.log("Debug: Ignoring message from a bot.");
        return;
    }

    try {
        // Show typing indicator
        await message.channel.sendTyping();

        // Generate reply
        const reply = await generateReply(message.content, message.author.username);

        // Discord has a 2000 character limit per message
        if (reply.length > 2000) {
            // Simple split if too long (basic implementation)
            const chunks = reply.match(/[\s\S]{1,2000}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(reply);
        }
    } catch (error) {
        console.error("Error replying to message:", error);
        await message.reply("My apologies, I seem to be having a momentary disconnect.");
    }
});

client.login(process.env.DISCORD_TOKEN);
