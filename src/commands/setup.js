const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionsBitField } = require('dcsv.js');
const db = require('../utils/database');
const config = require('../../config');

module.exports = {
    name: 'setup',
    description: 'Bot kurulumunu yapmanızı sağlar.',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: `${config.emojis.error} Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız.` });
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`${config.emojis.server} Bot Kurulum Sihirbazı`)
            .setDescription(`Aşağıdaki butonları kullanarak botun ayarlarını yapabilirsiniz.\n\n**Mevcut Ayarlar:**\n${await getSettingsStatus(message.guild.id)}`)
            .setFooter({ text: 'DCSV Register Bot' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('setup_roles')
                    .setLabel('Rolleri Ayarla')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎭'),
                new ButtonBuilder()
                    .setCustomId('setup_channels')
                    .setLabel('Kanalları Ayarla')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📢'),
                new ButtonBuilder()
                    .setCustomId('finish_setup')
                    .setLabel('Kurulumu Tamamla')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: 'Bu işlemi sadece komutu kullanan kişi yapabilir.', ephemeral: true });

            if (i.customId === 'finish_setup') {
                await i.update({ content: `${config.emojis.success} Kurulum tamamlandı!`, components: [] });
                collector.stop();
                return;
            }

            if (i.customId === 'setup_roles') {
                await i.reply({ content: 'Lütfen sırasıyla şu Rol IDlerini veya Etiketlerini yazın:\n`Kayıtsız Rolü`, `Kayıtlı Rolü`, `Erkek Rolü`, `Kadın Rolü`\n\nÖrnek: `@Kayitsiz @Uye @Erkek @Kadin`\n*(Aralarında boşluk bırakarak yazın)*', ephemeral: true });

                const filter = m => m.author.id === message.author.id;
                try {
                    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
                    const content = collected.first().content;
                    const roles = content.split(/\s+/).map(r => r.replace(/[<@&>]/g, ''));

                    if (roles.length < 4) {
                        return message.channel.send(`${config.emojis.error} Lütfen en az 4 rol belirtin! İşlem iptal edildi.`);
                    }

                    const currentConfig = await db.getGuildConfig(message.guild.id) || {};
                    const newRoles = {
                        kayitsiz: roles[0],
                        kayitli: roles[1]
                    };

                    await db.setGuildConfig(message.guild.id, { ...currentConfig, roles: newRoles });

                    // Update main embed
                    embed.setDescription(`Aşağıdaki butonları kullanarak botun ayarlarını yapabilirsiniz.\n\n**Mevcut Ayarlar:**\n${await getSettingsStatus(message.guild.id)}`);
                    await msg.edit({ embeds: [embed] });

                    collected.first().delete().catch(() => { }); // Clean up user message
                    await i.followUp({ content: `${config.emojis.success} Roller başarıyla kaydedildi!`, ephemeral: true });

                } catch (e) {
                    message.channel.send('Süre doldu veya bir hata oluştu.');
                }
            }

            if (i.customId === 'setup_channels') {
                await i.reply({ content: 'Lütfen sırasıyla şu Kanal IDlerini veya Etiketlerini yazın:\n`Hoşgeldin Kanalı`, `Log Kanalı`\n\nÖrnek: `#hosgeldin #register-log`\n*(Aralarında boşluk bırakarak yazın)*', ephemeral: true });

                const filter = m => m.author.id === message.author.id;
                try {
                    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
                    const content = collected.first().content;
                    const channels = content.split(/\s+/).map(c => c.replace(/[<@#>]/g, ''));

                    if (channels.length < 2) {
                        return message.channel.send(`${config.emojis.error} Lütfen 2 kanal belirtin! İşlem iptal edildi.`);
                    }

                    const currentConfig = await db.getGuildConfig(message.guild.id) || {};
                    const newChannels = {
                        welcome: channels[0],
                        log: channels[1]
                    };

                    await db.setGuildConfig(message.guild.id, { ...currentConfig, channels: newChannels });

                    // Update main embed
                    embed.setDescription(`Aşağıdaki butonları kullanarak botun ayarlarını yapabilirsiniz.\n\n**Mevcut Ayarlar:**\n${await getSettingsStatus(message.guild.id)}`);
                    await msg.edit({ embeds: [embed] });

                    collected.first().delete().catch(() => { });
                    await i.followUp({ content: `${config.emojis.success} Kanallar başarıyla kaydedildi!`, ephemeral: true });

                } catch (e) {
                    message.channel.send('Süre doldu veya bir hata oluştu.');
                }
            }
        });
    }
};

async function getSettingsStatus(guildId) {
    const settings = await db.getGuildConfig(guildId);
    if (!settings) return "⚠ Kurulum yapılmamış!";

    const check = (val) => val ? "✅" : "❌";

    let text = "";
    text += `${check(settings.roles?.kayitsiz)} Kayıtsız Rolü\n`;
    text += `${check(settings.roles?.kayitli)} Kayıtlı Rolü\n`;
    text += `${check(settings.channels?.welcome)} Hoşgeldin Kanalı\n`;
    text += `${check(settings.channels?.log)} Log Kanalı`;

    return text;
}
