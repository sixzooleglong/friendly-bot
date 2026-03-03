require('dotenv').config();

// Prevent crashes on unhandled errors to keep the service alive
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

const { Client, GatewayIntentBits, Events } = require('discord.js');
const { generateReply } = require('./aiService');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Web server for health checks (UptimeRobot / Railway pings)
app.get('/', (req, res) => res.send('Friendly Bot is awake! 🤖✨'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Bind to 0.0.0.0 so Railway/Render can reach it
const server = app.listen(port, '0.0.0.0', () => console.log(`Stay-Alive server listening on port ${port}`));
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 125 * 1000;

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
    const allowedChannels = process.env.ALLOWED_CHANNELS
        ? process.env.ALLOWED_CHANNELS.split(',').map(id => id.trim())
        : [];
    if (allowedChannels.length > 0 && !allowedChannels.includes(message.channel.id)) return;

    try {
        await message.channel.sendTyping();

        const userId = message.author.id;
        if (!userHistory[userId]) userHistory[userId] = [];

        let imageUrl = null;

        // 1. Direct image attachments
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                imageUrl = attachment.url;
            }
        }

        // 2. Tenor / Giphy / direct image links
        if (!imageUrl && message.content.match(/^https?:\/\/.*$/)) {
            const url = message.content;
            if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                imageUrl = url;
            } else if (url.includes('tenor.com') || url.includes('giphy.com')) {
                try {
                    const response = await fetch(url);
                    const html = await response.text();
                    const match = html.match(/<meta property="og:image" content="([^"]+)"/);
                    if (match && match[1]) imageUrl = match[1];
                } catch (err) {
                    console.log('Error extracting GIF URL:', err);
                }
            }
        }

        const reply = await generateReply(message.content, message.author.username, userHistory[userId], imageUrl);

        userHistory[userId].push({ role: 'user', content: `User "${message.author.username}" says: ${message.content}` });
        userHistory[userId].push({ role: 'assistant', content: reply });

        // Keep only last 10 messages to save memory/tokens
        if (userHistory[userId].length > 10) userHistory[userId] = userHistory[userId].slice(-10);

        if (reply.length > 2000) {
            const chunks = reply.match(/[\s\S]{1,2000}/g) || [];
            for (const chunk of chunks) await message.reply(chunk);
        } else {
            await message.reply(reply);
        }
    } catch (error) {
        console.error('Error replying to message:', error);
        await message.reply('My apologies, I seem to be having a momentary disconnect.');
    }
});

// Exit on login failure so Railway/Render auto-restarts the service
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Discord Login Failed:', error);
    process.exit(1);
});
