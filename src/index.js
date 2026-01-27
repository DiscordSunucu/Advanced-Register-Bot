const { Client, GatewayIntentBits } = require('dcsv.js');
const config = require('../config');
const loadEvents = require('./utils/eventLoader');

const client = new Client({
    intents:
        GatewayIntentBits.Guilds |
        GatewayIntentBits.GuildMembers |
        GatewayIntentBits.GuildMessages |
        GatewayIntentBits.MessageContent
});

// Load Events
loadEvents(client);

// Error Handling to prevent crash
process.on('unhandledRejection', error => {
    console.error('[FATAL] Unhandled Rejection:', error);
});

client.login(config.botToken);
