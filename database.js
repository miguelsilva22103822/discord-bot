const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./waifu.db');

const dbLoader = require('./dbLoader');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        coins INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0
        )`
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS waifus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rarity INTEGER,
        personality TEXT,
        base_difficulty INTEGER
        )`
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS relationships (
        user_id TEXT,
        waifu_id INTEGER,
        affection INTEGER DEFAULT 0,
        trust INTEGER DEFAULT 0,
        jealousy INTEGER DEFAULT 0,
        times_cheated INTEGER DEFAULT 0,
        dating_level INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, waifu_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (waifu_id) REFERENCES waifus(id)
        )`
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS gifts (
        id INTEGER PRIMARY KEY,
        name TEXT,
        cost INTEGER,
        affection_bonus INTEGER
        )`
    );

    dbLoader.syncWaifus();
    dbLoader.syncGifts();
});

function getUser(id) {
    return new Promise((resolve) => {
        db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
            if (!row) {
                db.run(`INSERT INTO users (id) VALUES (?)`, [id]);
                resolve({ id, coins: 0, message_count: 0 });
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