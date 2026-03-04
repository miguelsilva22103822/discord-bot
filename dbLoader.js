const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./waifu.db');

function syncWaifus() {
    const rawData = fs.readFileSync('./waifus.json');
    const waifus = JSON.parse(rawData);
    
    db.serialize(() => {
        waifus.forEach((waifu) => {
            db.run(`
                INSERT INTO waifus (id, name, image_url, rarity, base_price, loyalty)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                image_url = excluded.image_url,
                rarity = excluded.rarity,
                base_price = excluded.base_price,
                loyalty = excluded.loyalty
      `, [
                waifu.id,
                waifu.name,
                waifu.image_url,
                waifu.rarity,
                waifu.base_price,
                waifu.loyalty
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