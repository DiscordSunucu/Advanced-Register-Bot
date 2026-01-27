/**
 * Container and Component Utilities
 * Premium quality Discord containers - NO COLORS
 */

// Emoji IDs from dcsv_mini_bot
const E = {
    logo: '1329844625833197589',
    confirm: '1230083926895362068',
    punishment: '1230085672187072614',
    member: '1208159372744720414',
    shield: '997651107172065280',
    warning: '997666633671782522',
    check: '997855617370837002',
    cross: '997666633671782522',
    link: '1204351166037753866',
    notification: '1204351166037753866',
    wallet: '1230085424870068235',
    calendar: '1204352118824116224'
};

const COLORS = {
    SUCCESS: 0x57F287,
    WARNING: 0xFEE75C,
    DANGER: 0xED4245,
    INFO: 0x5865F2,
    DEFAULT: 0x2F3136
};

// ==================== COMPONENT BUILDERS ====================

function text(content) {
    return { type: 10, content };
}

function divider(spacing = 1) {
    return { type: 14, spacing };
}

function actionRow(...buttons) {
    return { type: 1, components: buttons.flat() };
}

function button(label, customId, style = 2, emoji = null, disabled = false) {
    const btn = { type: 2, label, style, custom_id: customId };
    if (disabled) btn.disabled = true;
    if (emoji) btn.emoji = typeof emoji === 'string' ? { id: emoji } : emoji;
    return btn;
}

function linkButton(label, url, emoji = null) {
    const btn = { type: 2, style: 5, label, url };
    if (emoji) btn.emoji = typeof emoji === 'string' ? { id: emoji } : emoji;
    return btn;
}

function section(content, accessoryButton) {
    return { type: 9, components: [text(content)], accessory: accessoryButton };
}

// Container WITHOUT accent_color
function container(components) {
    return { type: 17, components };
}

// ==================== MEMBER JOIN CONTAINER (COMPACT + AVATAR) ====================

function createMemberJoinContainer(member, profile) {
    const user = profile.user;
    const trust = profile.trust;
    const bans = profile.bans;

    const punishmentCount = trust?.punishment_count || 0;
    const isGlobalBanned = bans?.is_globally_banned || false;
    const trustScore = trust?.trust_score || 0;
    const trustLevel = trust?.trust_level_label || 'Bilinmiyor';

    let statusBadge = "✅ Temiz";
    if (isGlobalBanned) statusBadge = "🚫 GLOBAL BAN";
    else if (punishmentCount > 2) statusBadge = `⛔ ${punishmentCount} Sicil`;
    else if (punishmentCount > 0) statusBadge = `⚠️ ${punishmentCount} Sicil`;

    const createdTs = Math.floor((parseInt(member.user.id) / 4194304 + 1420070400000) / 1000);

    // User avatar URL
    const avatarHash = member.user.avatar;
    const avatarUrl = avatarHash
        ? `https://cdn.discordapp.com/avatars/${member.user.id}/${avatarHash}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(member.user.id) % 5}.png`;

    const components = [];

    // Build info text for header section
    let headerInfo = `## ${member.user.username}\n`;
    headerInfo += `-# <@${member.user.id}> · \`${member.user.id}\`\n`;
    headerInfo += `-# Hesap: <t:${createdTs}:D> (<t:${createdTs}:R>)\n`;
    headerInfo += `-# ${statusBadge} · Güven: \`${trustScore}/100\` ${trustLevel}`;
    // User votes info removed to optimize API calls

    // HEADER with avatar thumbnail - ALL INFO
    components.push({
        type: 9,
        components: [text(headerInfo)],
        accessory: {
            type: 11,
            media: { url: avatarUrl }
        }
    });

    // Recent bans if any
    if (punishmentCount > 0 && bans?.bans?.length > 0) {
        components.push(divider(1));
        const banList = bans.bans.slice(0, 3).map(b =>
            `-# • ${(b.server_name || '?').substring(0, 15)}: ${(b.reason || '-').substring(0, 25)}`
        ).join('\n');
        components.push(text(`**Sicil (${punishmentCount})**\n${banList}`));
    }

    components.push(divider(1));

    // Action Buttons
    const profileUrl = `https://dcsv.me/user/${member.user.id}`;
    components.push(actionRow(
        button("Kayıt", `register_${member.user.id}`, 2),
        button("Kick", `kick_${member.user.id}`, 2),
        button("Sicil", `sicil_${member.user.id}`, 2),
        linkButton("Profil", profileUrl)
    ));

    return container(components);
}

// ==================== RESPONSE CONTAINERS ====================

function createSuccessContainer(title, message) {
    return container([
        text(`## ${title}\n\n${message}`)
    ]);
}

function createErrorContainer(title, message) {
    return container([
        text(`## ${title}\n\n${message}`)
    ]);
}

function createInfoContainer(title, message, buttons = null) {
    const components = [text(`## ${title}\n\n${message}`)];
    if (buttons) {
        components.push(divider(1));
        components.push(actionRow(buttons));
    }
    return container(components);
}

// Sicil Container - 20 items max, limited descriptions
function createSicilContainer(userId, userInfo, trustData, banData) {
    const punishmentCount = trustData?.punishment_count || 0;
    const isGlobalBanned = banData?.is_globally_banned || false;
    const trustScore = trustData?.trust_score || 0;
    const trustLevel = trustData?.trust_level_label || 'Bilinmiyor';
    const bans = banData?.bans || [];

    const components = [];

    // Header
    components.push(text(
        `## Sicil Raporu\n` +
        `-# ${userInfo?.display_name || userId}`
    ));
    components.push(divider(1));

    // Stats
    components.push(text(
        `**Güven:** \`${trustScore}/100\` · ${trustLevel}\n` +
        `**Sicil:** ${punishmentCount} kayıt · ${isGlobalBanned ? 'GLOBAL BAN' : 'Global ban yok'}`
    ));

    // Ban list - MAX 20, short descriptions
    if (bans.length > 0) {
        components.push(divider(1));
        const banList = bans.slice(0, 20).map((b, i) => {
            const serverName = (b.server_name || '?').substring(0, 12);
            const reason = (b.reason || '-').substring(0, 25);
            const status = b.is_active ? '●' : '○';
            return `-# ${status} **${serverName}** ${reason}`;
        }).join('\n');
        components.push(text(`**Sicil Listesi (${Math.min(bans.length, 20)}/${bans.length})**\n${banList}`));
    }

    return container(components);
}

// ==================== SELECT MENUS ====================

function createRoleSelect(customId, placeholder, minValues = 1, maxValues = 1) {
    return { type: 6, custom_id: customId, placeholder, min_values: minValues, max_values: maxValues };
}

function createChannelSelect(customId, placeholder, channelTypes = [0], minValues = 1, maxValues = 1) {
    return { type: 8, custom_id: customId, placeholder, channel_types: channelTypes, min_values: minValues, max_values: maxValues };
}

// ==================== EXPORTS ====================

module.exports = {
    E,
    COLORS,
    text,
    divider,
    actionRow,
    button,
    linkButton,
    section,
    container,
    createMemberJoinContainer,
    createSuccessContainer,
    createErrorContainer,
    createInfoContainer,
    createSicilContainer,
    createRoleSelect,
    createChannelSelect,
    createButton: button,
    createActionRow: actionRow
};
