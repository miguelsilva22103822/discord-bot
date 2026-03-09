const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./waifu.db');

const dbLoader = require('./dbLoader');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            coins INTEGER NOT NULL DEFAULT 0,
            message_count INTEGER DEFAULT 0
        )`
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS waifus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_url TEXT,
            rarity INTEGER,
            base_price INTEGER NOT NULL,
            loyalty INTEGER
        )`
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL UNIQUE,
            waifu_id INTEGER NOT NULL,

            times_kissed_today INTEGER NOT NULL DEFAULT 0,
            times_sex_today INTEGER NOT NULL DEFAULT 0,
            gifts_given_today INTEGER NOT NULL DEFAULT 0,

            last_reset_date TEXT NOT NULL DEFAULT (DATE('now')),

            times_cheated INTEGER NOT NULL DEFAULT 0,

            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (waifu_id) REFERENCES waifu_id(id) ON DELETE CASCADE
        )`
    );

    dbLoader.syncWaifus();
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

function getCoins(userId) {
    return new Promise((resolve) => {
        db.get(`SELECT coins FROM users WHERE id = ?`, [userId], (coins) => {
            resolve(coins)
        });
    });
}

function getRandomWaifu() {
    return new Promise((resolve, reject) => {
        db.all("SELECT id, name, image_url, rarity, base_price, loyalty FROM waifus", [], (err, rows) => {
            if (err) return reject(err);
            if (!rows.length) return resolve(null);

            // Calculate weights
            let totalWeight = 0;
            const weighted = rows.map(w => {
                const weight = 1 / (w.rarity || 1);
                totalWeight += weight;
                return { ...w, weight };
            });

            // Pick random number
            const random = Math.random() * totalWeight;

            let cumulative = 0;
            for (const w of weighted) {
                cumulative += w.weight;
                if (random <= cumulative) {
                    return resolve({
                        id: w.id,
                        name: w.name,
                        image_url: w.image_url,
                        rarity: w.rarity,
                        base_price: w.base_price,
                        loyalty: w.loyalty
                    });
                }
            }

            // Fallback (shouldn't happen)
            const last = weighted[weighted.length - 1];
            resolve({
                id: w.id,
                name: w.name,
                image_url: w.image_url,
                rarity: w.rarity,
                base_price: w.base_price,
                loyalty: w.loyalty
            });
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

function marryWaifu(userId, waifuId) {
    return new Promise((resolve, reject) => {

        db.serialize(() => {

            // Remove existing relationship (if any)
            db.run(
                "DELETE FROM relationships WHERE user_id = ?",
                [userId],
                function (err) {
                    if (err) return reject(err);

                    // Insert new relationship
                    db.run(
                        `INSERT INTO relationships (user_id, waifu_id)
                         VALUES (?, ?)`,
                        [userId, waifuId],
                        function (err) {
                            if (err) return reject(err);
                            resolve(true);
                        }
                    );
                }
            );

        });

    });
}

function addCheat(id) {
    db.run(`UPDATE users SET cheat_count = cheat_count + 1 WHERE id = ?`, [id]);
}

module.exports = {
    getRandomWaifu,
    getUser,
    incrementMessages,
    marryWaifu,
    addCheat,
    getCoins
};