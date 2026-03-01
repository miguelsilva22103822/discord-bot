const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./waifu.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      cheat_count INTEGER DEFAULT 0
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

function addCheat(id) {
  db.run(`UPDATE users SET cheat_count = cheat_count + 1 WHERE id = ?`, [id]);
}

module.exports = {
  getUser,
  incrementMessages,
  addCheat
};