require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const db = require('./database');
const commands = require('./commands');

//console.log(require('discord.js'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Track messages for coins
  await db.incrementMessages(message.author.id);

  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).split(" ");
  const command = args.shift().toLowerCase();


  if (commands[command]) {
    commands[command](message, args);
  }

  console.log("command: ", command);
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