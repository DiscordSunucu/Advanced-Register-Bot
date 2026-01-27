/**
 * MESSAGE_CREATE Event Handler
 * Handles prefix commands like .setup
 */
const config = require('../../config');
const db = require('../utils/database');
const {
    text,
    divider,
    actionRow,
    button,
    container,
    createErrorContainer,
    E
} = require('../utils/container');

module.exports = {
    name: 'messageCreate',
    execute: async (message, client) => {
        if (!message.content || message.author?.bot) return;

        const prefix = config.prefix;

        // ==================== .setup Command ====================
        if (message.content.toLowerCase() === `${prefix}setup`) {
            try {
                // Get current config
                const guildConfig = await db.getGuildConfig(message.guild_id) || {};

                // Current Settings - Compact
                const welcomeCh = guildConfig.welcome_channel ? `<#${guildConfig.welcome_channel}>` : '—';
                const logCh = guildConfig.log_channel ? `<#${guildConfig.log_channel}>` : '—';
                const kayitsizR = guildConfig.roles?.kayitsiz ? `<@&${guildConfig.roles.kayitsiz}>` : '—';
                const kayitliR = guildConfig.roles?.kayitli ? `<@&${guildConfig.roles.kayitli}>` : '—';
                const yetkiliR = guildConfig.roles?.yetkili ? `<@&${guildConfig.roles.yetkili}>` : '—';

                // All inside container
                const setupContainer = container([
                    text(
                        `## Kayıt Botu Kurulumu\n\n` +
                        `> **Kanallar:** ${welcomeCh} · ${logCh}\n` +
                        `> **Roller:** ${kayitsizR} · ${kayitliR} · ${yetkiliR}`
                    ),
                    divider(1),
                    actionRow(
                        button("Hoşgeldin", "setup_welcome_channel", 2),
                        button("Log", "setup_log_channel", 2),
                        button("Yetkili", "setup_yetkili_role", 2)
                    ),
                    actionRow(
                        button("Kayıtsız", "setup_kayitsiz_role", 2),
                        button("Kayıtlı", "setup_kayitli_role", 2)
                    ),
                    actionRow(
                        button("Kaydet", "setup_save", 2),
                        button("Sıfırla", "setup_reset", 2)
                    )
                ]);

                await client.request('POST', `/channels/${message.channel_id}/messages`, {
                    embeds: [],
                    flags: 32768,
                    components: [setupContainer]
                });

                console.log(`[CMD] Setup command executed by ${message.author.username} in guild ${message.guild_id}`);

            } catch (error) {
                console.error('[CMD] Setup Error:', JSON.stringify(error, null, 2));
                await client.request('POST', `/channels/${message.channel_id}/messages`, {
                    content: `❌ Hata: ${error.message || JSON.stringify(error)}`
                });
            }
        }

        // ==================== .test Command (for testing member join) ====================
        if (message.content.toLowerCase().startsWith(`${prefix}test`)) {
            console.log(`[CMD] Test command received from ${message.author?.username}`);

            try {
                // Parse userId from command (e.g., .test 123456789)
                const args = message.content.split(' ');
                let targetUserId = message.author.id;
                let targetUser = message.author;

                if (args[1]) {
                    // Extract user ID from mention or raw ID
                    targetUserId = args[1].replace(/[<@!>]/g, '');

                    // Try to fetch user info
                    try {
                        const fetchedUser = await client.request('GET', `/users/${targetUserId}`);
                        targetUser = fetchedUser;
                    } catch (e) {
                        // Use minimal user object
                        targetUser = { id: targetUserId, username: `User#${targetUserId}` };
                    }
                }

                const api = require('../utils/api');
                const { createMemberJoinContainer } = require('../utils/container');

                const profile = await api.getFullUserProfile(targetUserId);
                const memberJoinContainer = createMemberJoinContainer({
                    user: targetUser,
                    guild_id: message.guild_id
                }, profile);

                await client.request('POST', `/channels/${message.channel_id}/messages`, {
                    embeds: [],
                    flags: 32768,
                    components: [memberJoinContainer]
                });

                console.log(`[CMD] Test command executed for ${targetUserId} by ${message.author.username}`);
            } catch (error) {
                console.error('[CMD] Test Error:', error);
                await client.request('POST', `/channels/${message.channel_id}/messages`, {
                    content: `❌ Hata: ${error.message}`
                });
            }
        }
    }
};
