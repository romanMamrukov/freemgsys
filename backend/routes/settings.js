const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all settings
router.get('/', (req, res) => {
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settingsObj = {};
        rows.forEach(row => {
            settingsObj[row.key] = row.value;
        });
        res.json(settingsObj);
    });
});

// POST to update settings
router.post('/', (req, res) => {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings payload' });
    }

    const stmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        for (const [key, value] of Object.entries(settings)) {
            stmt.run(key, value);
        }
        db.run('COMMIT', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update settings' });
            }
            res.json({ message: 'Settings updated successfully' });
        });
    });
    stmt.finalize();
});

module.exports = router;
