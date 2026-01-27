module.exports = {
    name: 'ready',
    once: true,
    execute(data, client) {
        console.log(`[BOT] ${client.user.username} is now online! 🚀`);
        console.log(`[BOT] Ready to serve ${client.shards?.size || 1} shard(s).`);
        console.log(`[BOT] Multi-Guild Register System Active.`);

        // Presence
        client.setPresence({ name: "DCSV.ME | Kayıt Sistemi", type: 0, status: "online" });
    },
};
