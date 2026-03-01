const db = require('./database');

function rollWaifu() {
  const roll = Math.random();

  if (roll < 0.01) {
    return { name: "Mikasa", rarity: 5 };
  
  } else if (roll < 0.10) {
    return { name: "Rare Waifu", rarity: 4 };
  } else {
    return { name: "Common Waifu", rarity: 1 };
  }
}

module.exports = {

  wish: async (message) => {
    const waifu = rollWaifu();
    message.channel.send(`✨ A wild ${waifu.name} appeared! ⭐${waifu.rarity}`);
  },

  cheated: async (message) => {
    const user = await db.getUser(message.author.id);
    message.channel.send(
      `Your waifu cheated on you ${user.cheat_count} times.`
    );
  },

  betray: async (message) => {
    const betrayed = Math.random() < 0.2;

    if (betrayed) {
      db.addCheat(message.author.id);
      message.channel.send("💔 Your waifu betrayed you...");
    } else {
      message.channel.send("❤️ She stayed loyal.");
    }
  }

};