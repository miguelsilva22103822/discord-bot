const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./waifu.db');

function syncWaifus() {
    const rawData = fs.readFileSync('./waifus.json');
    const waifus = JSON.parse(rawData);
    
    db.serialize(() => {
        waifus.forEach((waifu) => {
            db.run(`
                INSERT INTO waifus (id, name, rarity, personality, base_difficulty)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                rarity = excluded.rarity,
                personality = excluded.personality,
                base_difficulty = excluded.base_difficulty
      `, [
                waifu.id,
                waifu.name,
                waifu.rarity,
                waifu.personality,
                waifu.base_difficulty
            ]);
        });
    });
    

    console.log("Waifu sync complete.");
}

function syncGifts() {
    const rawData = fs.readFileSync('./gifts.json');
    const gifts = JSON.parse(rawData);
    
    db.serialize(() => {
        gifts.forEach((gift) => {
            db.run(`
                INSERT INTO gifts (id, name, cost, affection_bonus)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                cost = excluded.cost,
                affection_bonus = excluded.affection_bonus
      `, [
                gift.id,
                gift.name,
                gift.cost,
                gift.affection_bonus
            ]);
        });
    });
    

    console.log("Gift sync complete.");
}

module.exports = {
    syncWaifus,
    syncGifts
}