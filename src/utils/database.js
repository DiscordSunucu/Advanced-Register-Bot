/**
 * Simple JSON-based database for guild configs
 * Stores config per guild in a JSON file
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/guilds.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize DB file if not exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
}

/**
 * Load all data
 */
function loadData() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[DB] Load error:', error);
        return {};
    }
}

/**
 * Save all data
 */
function saveData(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('[DB] Save error:', error);
        return false;
    }
}

/**
 * Get guild config
 */
async function getGuildConfig(guildId) {
    const data = loadData();
    return data[guildId] || null;
}

/**
 * Set guild config
 */
async function setGuildConfig(guildId, config) {
    const data = loadData();
    data[guildId] = {
        ...data[guildId],
        ...config,
        updated_at: new Date().toISOString()
    };
    return saveData(data);
}

/**
 * Update specific field in guild config
 */
async function updateGuildConfig(guildId, field, value) {
    const data = loadData();
    if (!data[guildId]) {
        data[guildId] = { created_at: new Date().toISOString() };
    }
    data[guildId][field] = value;
    data[guildId].updated_at = new Date().toISOString();
    return saveData(data);
}

/**
 * Delete guild config
 */
async function deleteGuildConfig(guildId) {
    const data = loadData();
    delete data[guildId];
    return saveData(data);
}

module.exports = {
    getGuildConfig,
    setGuildConfig,
    updateGuildConfig,
    deleteGuildConfig
};
