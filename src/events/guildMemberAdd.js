/**
 * GUILD_MEMBER_ADD Event Handler
 * Triggered when a new member joins the server
 * Shows full user profile with sicil info
 */
const config = require('../../config');
const api = require('../utils/api');
const { createMemberJoinContainer } = require('../utils/container');
const db = require('../utils/database');

module.exports = {
    name: 'GUILD_MEMBER_ADD',
    execute: async (member, client) => {
        console.log(`[EVENT] New member joined: ${member.user.username} (${member.user.id})`);

        try {
            // Get guild config
            const guildConfig = await db.getGuildConfig(member.guild_id);
            if (!guildConfig) {
                console.log(`[EVENT] No config found for guild ${member.guild_id}`);
                return;
            }

            // Check if welcome channel is set
            if (!guildConfig.channels?.welcome) {
                console.log(`[EVENT] No welcome channel set for guild ${member.guild_id}`);
                return;
            }

            // Fetch full user profile from API
            const profile = await api.getFullUserProfile(member.user.id);

            // Create premium container with all user info
            const memberContainer = createMemberJoinContainer(member, profile);

            // Send to welcome channel
            await client.request('POST', `/channels/${guildConfig.channels.welcome}/messages`, {
                embeds: [],
                flags: 32768,
                components: [memberContainer]
            });

            // Auto-assign kayıtsız role if configured
            if (guildConfig.roles?.kayitsiz) {
                try {
                    await client.request('PUT', `/guilds/${member.guild_id}/members/${member.user.id}/roles/${guildConfig.roles.kayitsiz}`);
                    console.log(`[EVENT] Assigned kayıtsız role to ${member.user.username}`);
                } catch (roleError) {
                    console.error(`[EVENT] Failed to assign kayıtsız role:`, roleError.message);
                }
            }

        } catch (error) {
            console.error('[EVENT] GUILD_MEMBER_ADD Error:', error);
        }
    }
};
