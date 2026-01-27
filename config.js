require('dotenv').config();

module.exports = {
    // BOT CONFIGURATION
    botToken: process.env.BOT_TOKEN,
    apiKey: process.env.API_KEY,

    // Command Prefix
    prefix: ".", // User requested configurable prefix, defaulting to .

    // API Configuration
    api: {
        baseURL: "https://dcsv.me/api/v1", // Using dcsv.me API V1
        userAgent: "DCSV-Register-Bot/1.0"
    },

    // Role Configuration (Auto-assigned roles)
    // Bu roller artık sunucu bazlı olarak .setup komutu ile ayarlanır / These roles are now set per-server via .setup command
    roles: {
        // Default Config Structure (for reference)
        // kayitsiz: "ID",
        // kayitli: "ID"
    },

    // Settings
    settings: {
        tag: "", // Optional tag to add to nickname
        // logChannel: "ID",
        // welcomeChannel: "ID",
        autoRegisterUnisex: false // If true, registers unisex automatically without error
    },

    // Emoji Configuration
    emojis: {
        success: "✅",
        error: "❌",
        loading: "🔄",
        shield: "🛡️",
        server: "🏰",
        info: "ℹ️"
    }
};
