const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./waifu.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      waifu TEXT DEFAULT NULL
    )
  `);
});

function getUser(id) {
  return new Promise((resolve) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
      if (!row) {
        db.run(`INSERT INTO users (id) VALUES (?)`, [id]);
        resolve({ id, coins: 0, message_count: 0, cheat_count: 0 });
      } else {
        resolve(row);
      }
    });
  });
}

function saveUser(id, user) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (id, coins, message_count, waifu)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         coins = excluded.coins,
         message_count = excluded.message_count,
         waifu = excluded.waifu`,
      [
        id,
        user.coins || 0,
        user.message_count || 0,
        JSON.stringify(user.waifu || null)
      ],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function incrementMessages(id) {
  return new Promise(async (resolve) => {
    const user = await getUser(id);

    const newCount = user.message_count + 1;
    let coins = user.coins;

    if (newCount % 100 === 0) {
      coins += 50;
      console.log(`💰 ${id} earned 50 coins`);
    }

    db.run(
      `UPDATE users SET message_count = ?, coins = ? WHERE id = ?`,
      [newCount, coins, id]
    );

    resolve();
  });
}

async function setWaifu(userId, waifuData) {
  const user = getUser(userId);
  user.waifu = waifuData;
  saveUser(userId, user);
}

function addCheat(id) {
  db.run(`UPDATE users SET cheat_count = cheat_count + 1 WHERE id = ?`, [id]);
}

module.exports = {
  getUser,
  incrementMessages,
  setWaifu,
  addCheat
};