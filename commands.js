const { Client } = require('discord.js');
const db = require('./database');

function rollWaifu() {
  const roll = Math.random();

  if (roll < 0.01) {
    return { name: "Mikasa", rarity: 5, image: "https://i.pinimg.com/736x/10/df/e3/10dfe34514273608a93284ab85e6cad9.jpg"};
  } else if (roll < 0.10) {
    return { name: "Rare Waifu", rarity: 4, image: "https://i.pinimg.com/736x/10/df/e3/10dfe34514273608a93284ab85e6cad9.jpg"};
  } else {
    return { name: "Common Waifu", rarity: 1, image: "https://i.pinimg.com/736x/10/df/e3/10dfe34514273608a93284ab85e6cad9.jpg"};
  }
}

module.exports = {

  help: async (message) => {
    message.channel.send(`Available commands:\n!wish: Roll a waifu!\n!cheated: Tells you how many times your waifu cheated on you.\n!betray: doesnt work yet mb bro :(`);
  },

  wish: async (message) => {
    const waifu = rollWaifu();

    const sentMessage = await message.channel.send({
      content: `✨ A wild ${waifu.name} appeared! ⭐${waifu.rarity}\nReact with 💖 to claim!`,
      embeds: [
        {
          image: { url: waifu.image }
        }
      ]
    });

    await sentMessage.react("💖");

    const filter = (reaction, user) => {
      return reaction.emoji.name === "💖" && !user.bot;
    };

    const collector = sentMessage.createReactionCollector({
      filter,
      max: 1,
      time: 15000
    });

    collector.on("collect", async (reaction, user) => {

      const existingUser = await db.getUser(user.id);

      if (existingUser.waifu) {
        return message.channel.send(
          `<@${user.id}> you already have a waifu!`
        );
      }

      await db.setWaifu(user.id, {
        name: waifu.name,
        image: waifu.image,
        cheat_count: 0
      });

      message.channel.send(
        `💍 <@${user.id}> claimed ${waifu.name}!`
      );
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        message.channel.send("Nobody claimed her...");
      }
    });
  },

  cheated: async (message) => {
    const user = await db.getUser(message.author.id);
    message.channel.send(
      `Your waifu cheated on you ${user.cheat_count} times.`
    );
  },

  betray: async (message) => {
    const user = await db.getUser(message.author.id);

    if (!user.waifu) {
      return message.channel.send("You don't have a waifu.");
    }

    const betrayed = Math.random() < 0.2;

    if (betrayed) {
      user.waifu.cheat_count++;
      await db.saveUser(message.author.id, user);
      message.channel.send("💔 She betrayed you...");
    } else {
      message.channel.send("❤️ She stayed loyal.");
    }
  },
};