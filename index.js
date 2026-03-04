require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const db = require('./database');
const commands = require('./commands');

//console.log(require('discord.js'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.once('clientReady', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    //random chance to spawn waifu
    const roll = Math.random();
    if (roll < 0.1) {
        //actually choose a random waifu instead of hardcoded
        const waifu = await db.getRandomWaifu();

        await message.channel.send({
            content: `✨ A wild ${waifu.name} appeared! ⭐${waifu.rarity}\n ${message.author.globalName} and waifu are now married! 💍`,
            embeds: [
                {
                    image: { url: waifu.image_url }
                }
            ]
        });

        //register on database
        db.marryWaifu(message.author.id, waifu.id)
        return;
    }

    //Track messages for coins
    //await db.incrementMessages(message.author.id);

    if (!message.content.startsWith("cc!")) return;

    const args = message.content.slice(3).split(" ");
    const command = args.shift().toLowerCase();

    if (commands[command]) {
        console.log("command: ", command);
        commands[command](message, args);
    }
});


/*
//test
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    // respond to !ping or bot mention
    if (message.content === '!ping' || message.mentions.has(client.user)) {
        message.channel.send('Pong!');
    }
});
*/

client.login(process.env.TOKEN);