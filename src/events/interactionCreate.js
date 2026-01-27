/**
 * INTERACTION_CREATE Event Handler
 * Handles all button clicks and select menus
 */
const config = require('../../config');
const db = require('../utils/database');
const api = require('../utils/api');
const {
    text,
    divider,
    actionRow,
    button,
    linkButton,
    container,
    createSicilContainer,
    createSuccessContainer,
    createErrorContainer,
    createRoleSelect,
    createChannelSelect,
    createActionRow,
    E
} = require('../utils/container');

// Cooldown map
const cooldowns = new Map();

// Pending setup selections
const pendingSetup = new Map();

module.exports = {
    name: 'interactionCreate',
    execute: async (interaction, client) => {
        const userId = interaction.user?.id;
        if (!userId) return;

        // Rate limiting (3 seconds)
        const now = Date.now();
        if (cooldowns.has(userId)) {
            const expiration = cooldowns.get(userId) + 3000;
            if (now < expiration) {
                return interaction.reply({
                    content: "⏳ Lütfen biraz bekleyin!",
                    flags: 64
                });
            }
        }
        cooldowns.set(userId, now);

        try {
            const componentType = interaction.data?.component_type;

            // Handle Button Clicks (component_type: 2)
            if (interaction.type === 3 && componentType === 2) {
                await handleButton(interaction, client);
            }

            // Handle Select Menus (component_type: 3=string, 6=role, 8=channel)
            else if (interaction.type === 3 && componentType >= 3) {
                await handleSelectMenu(interaction, client);
            }

        } catch (error) {
            console.error('[INTERACTION] Error:', error);
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: `❌ Bir hata oluştu: ${error.message}`,
                        flags: 64
                    });
                }
            } catch (e) { }
        }
    }
};

/**
 * Handle Button Interactions
 */
async function handleButton(interaction, client) {
    const customId = interaction.data?.custom_id || interaction.customId;
    const guildId = interaction.guildId;
    const memberId = interaction.user.id;

    console.log(`[BUTTON] ${customId} clicked by ${interaction.user.username}`);

    // ==================== SETUP BUTTONS ====================

    // Setup: Welcome Channel
    if (customId === 'setup_welcome_channel') {
        await interaction.reply({
            content: "📢 **Hoşgeldin kanalını seçin:**\nYeni üyeler katıldığında mesaj bu kanala gönderilecek.",
            components: [createActionRow(createChannelSelect('select_welcome_channel', 'Kanal seçin...', [0]))],
            flags: 64
        });
    }

    // Setup: Log Channel
    else if (customId === 'setup_log_channel') {
        await interaction.reply({
            content: "📝 **Log kanalını seçin:**\nKayıt işlemleri bu kanala loglanacak.",
            components: [createActionRow(createChannelSelect('select_log_channel', 'Kanal seçin...', [0]))],
            flags: 64
        });
    }

    // Setup: Yetkili Role
    else if (customId === 'setup_yetkili_role') {
        await interaction.reply({
            content: "👤 **Yetkili rolünü seçin:**\nSadece bu role sahip kişiler kayıt yapabilir.",
            components: [createActionRow(createRoleSelect('select_yetkili_role', 'Rol seçin...'))],
            flags: 64
        });
    }

    // Setup: Kayıtsız Role
    else if (customId === 'setup_kayitsiz_role') {
        await interaction.reply({
            content: "🚫 **Kayıtsız rolünü seçin:**\nYeni katılan üyelere otomatik verilecek.",
            components: [createActionRow(createRoleSelect('select_kayitsiz_role', 'Rol seçin...'))],
            flags: 64
        });
    }

    // Setup: Kayıtlı Role
    else if (customId === 'setup_kayitli_role') {
        await interaction.reply({
            content: "✅ **Kayıtlı rolünü seçin:**\nKayıt sonrası verilecek.",
            components: [createActionRow(createRoleSelect('select_kayitli_role', 'Rol seçin...'))],
            flags: 64
        });
    }



    // Setup: Save
    else if (customId === 'setup_save') {
        const guildConfig = await db.getGuildConfig(guildId);
        if (guildConfig) {
            await interaction.reply({
                content: "✅ **Ayarlar kaydedildi!**\n\nBot artık kullanıma hazır. Yeni üyeler katıldığında hoşgeldin kanalına otomatik mesaj gönderilecek.",
                flags: 64
            });
        } else {
            await interaction.reply({
                content: "❌ Henüz hiçbir ayar yapılmamış!",
                flags: 64
            });
        }
    }

    // Setup: Reset
    else if (customId === 'setup_reset') {
        await db.deleteGuildConfig(guildId);
        await interaction.reply({
            content: "🗑️ **Ayarlar sıfırlandı!**\nTekrar `.setup` komutu ile yapılandırabilirsiniz.",
            flags: 64
        });
    }

    // ==================== REGISTRATION BUTTONS ====================

    // Register User
    else if (customId.startsWith('register_')) {
        const targetUserId = customId.split('_')[1];
        await handleRegister(interaction, client, targetUserId);
    }

    // View Sicil Details
    else if (customId.startsWith('sicil_')) {
        const targetUserId = customId.split('_')[1];
        await handleSicil(interaction, client, targetUserId);
    }

    // View Profile - Direct link
    else if (customId.startsWith('profile_')) {
        const targetUserId = customId.split('_')[1];
        const userInfo = await api.getUserInfo(targetUserId);
        const username = userInfo?.username || targetUserId;

        await interaction.reply({
            content: `https://dcsv.me/@${username}`,
            flags: 64
        });
    }

    // Kick User
    else if (customId.startsWith('kick_')) {
        const targetUserId = customId.split('_')[1];
        await handleKick(interaction, client, targetUserId);
    }
}

/**
 * Handle Select Menu Interactions
 */
async function handleSelectMenu(interaction, client) {
    const customId = interaction.data?.custom_id;
    const values = interaction.data?.values || [];
    const guildId = interaction.guildId;

    console.log(`[SELECT] ${customId} selected: ${values.join(', ')}`);

    if (values.length === 0) return;

    const value = values[0];
    let updateField = null;
    let displayName = null;

    switch (customId) {
        case 'select_welcome_channel':
            await db.updateGuildConfig(guildId, 'welcome_channel', value);
            displayName = 'Hoşgeldin Kanalı';
            break;
        case 'select_log_channel':
            await db.updateGuildConfig(guildId, 'log_channel', value);
            displayName = 'Log Kanalı';
            break;
        case 'select_yetkili_role':
            await updateRole(guildId, 'yetkili', value);
            displayName = 'Yetkili Rolü';
            break;
        case 'select_kayitsiz_role':
            await updateRole(guildId, 'kayitsiz', value);
            displayName = 'Kayıtsız Rolü';
            break;
        case 'select_kayitli_role':
            await updateRole(guildId, 'kayitli', value);
            displayName = 'Kayıtlı Rolü';
            break;

    }

    if (displayName) {
        await interaction.reply({
            content: `✅ **${displayName}** başarıyla ayarlandı!`,
            flags: 64
        });
    }
}

/**
 * Update role in config
 */
async function updateRole(guildId, roleType, roleId) {
    const config = await db.getGuildConfig(guildId) || {};
    const roles = config.roles || {};
    roles[roleType] = roleId;
    await db.updateGuildConfig(guildId, 'roles', roles);
}

/**
 * Handle User Registration
 */
async function handleRegister(interaction, client, targetUserId) {
    const guildId = interaction.guildId;
    const guildConfig = await db.getGuildConfig(guildId);

    // Check if user has yetkili role
    if (guildConfig?.roles?.yetkili) {
        const memberRoles = interaction.member?.roles || [];
        if (!memberRoles.includes(guildConfig.roles.yetkili)) {
            return interaction.reply({
                embeds: [],
                flags: 32768 | 64,
                components: [createErrorContainer("Yetkisiz", "Bu işlemi yapmak için yetkili rolüne sahip olmalısınız!")]
            });
        }
    }

    await interaction.deferReply(true);

    try {
        // Get user info from API
        const userInfo = await api.getUserInfo(targetUserId);

        // Determine name and gender
        let name = userInfo?.display_name || `Üye`;

        // Build nickname
        const tag = guildConfig?.tag || '';
        const nickname = tag ? `${tag} ${name}` : name;

        // Role operations
        const rolesToAdd = [];
        const rolesToRemove = [];

        if (guildConfig?.roles?.kayitli) rolesToAdd.push(guildConfig.roles.kayitli);
        if (guildConfig?.roles?.kayitsiz) rolesToRemove.push(guildConfig.roles.kayitsiz);

        // Update nickname
        await client.request('PATCH', `/guilds/${guildId}/members/${targetUserId}`, {
            nick: nickname.substring(0, 32)
        }).catch(e => console.error("Nick error:", e));

        // Add roles
        for (const roleId of rolesToAdd) {
            await client.request('PUT', `/guilds/${guildId}/members/${targetUserId}/roles/${roleId}`)
                .catch(e => console.error("Add role error:", e));
        }

        // Remove roles
        for (const roleId of rolesToRemove) {
            await client.request('DELETE', `/guilds/${guildId}/members/${targetUserId}/roles/${roleId}`)
                .catch(e => console.error("Remove role error:", e));
        }

        const successContainer = container([
            text(`## Kayıt Başarılı\n\n<@${targetUserId}> kayıt edildi.\n\n-# İsim: ${name} · Kayıt eden: <@${interaction.user.id}>`)
        ]);

        await interaction.editReply({
            embeds: [],
            flags: 32768,
            components: [successContainer]
        });

        // Log to log channel
        if (guildConfig?.log_channel) {
            const logContainer = container([
                text(`## Kayıt Logu\n\n**Kullanıcı:** <@${targetUserId}>\n**Kayıt Eden:** <@${interaction.user.id}>\n**İsim:** ${name}`)
            ]);

            await client.request('POST', `/channels/${guildConfig.log_channel}/messages`, {
                embeds: [],
                flags: 32768,
                components: [logContainer]
            }).catch(e => console.error("Log error:", e));
        }

    } catch (error) {
        console.error('[REGISTER] Error:', error);
        await interaction.editReply({
            embeds: [],
            flags: 32768,
            components: [createErrorContainer("Hata", `Kayıt sırasında hata: ${error.message}`)]
        });
    }
}

/**
 * Handle Sicil (Ban History) View
 */
async function handleSicil(interaction, client, targetUserId) {
    await interaction.deferReply(true);

    try {
        const [userInfo, trustData, banData] = await Promise.all([
            api.getUserInfo(targetUserId),
            api.getUserTrust(targetUserId),
            api.getUserBans(targetUserId)
        ]);

        const sicilContainer = createSicilContainer(targetUserId, userInfo, trustData, banData);

        await interaction.editReply({
            embeds: [],
            flags: 32768,
            components: [sicilContainer]
        });

    } catch (error) {
        console.error('[SICIL] Error:', error);
        await interaction.editReply({
            embeds: [],
            flags: 32768,
            components: [createErrorContainer("Hata", `Sicil sorgulanırken hata: ${error.message}`)]
        });
    }
}

/**
 * Handle User Kick
 */
async function handleKick(interaction, client, targetUserId) {
    const guildId = interaction.guildId;
    const guildConfig = await db.getGuildConfig(guildId);

    // Check if user has yetkili role
    if (guildConfig?.roles?.yetkili) {
        const memberRoles = interaction.member?.roles || [];
        if (!memberRoles.includes(guildConfig.roles.yetkili)) {
            return interaction.reply({
                embeds: [],
                flags: 32768 | 64,
                components: [createErrorContainer("Yetkisiz", "Bu işlemi yapmak için yetkili rolüne sahip olmalısınız!")]
            });
        }
    }

    try {
        await client.request('DELETE', `/guilds/${guildId}/members/${targetUserId}`);

        await interaction.reply({
            embeds: [],
            flags: 32768 | 64,
            components: [createSuccessContainer("Kullanıcı Atıldı", `<@${targetUserId}> sunucudan atıldı.`)]
        });

        // Log
        if (guildConfig?.log_channel) {
            const logContainer = container([
                text(`## Kullanıcı Atıldı\n\n**Kullanıcı:** <@${targetUserId}>\n**Atan:** <@${interaction.user.id}>`)
            ]);

            await client.request('POST', `/channels/${guildConfig.log_channel}/messages`, {
                embeds: [],
                flags: 32768,
                components: [logContainer]
            }).catch(e => console.error("Log error:", e));
        }

    } catch (error) {
        await interaction.reply({
            embeds: [],
            flags: 32768 | 64,
            components: [createErrorContainer("Hata", `Kullanıcı atılamadı: ${error.message}`)]
        });
    }
}
