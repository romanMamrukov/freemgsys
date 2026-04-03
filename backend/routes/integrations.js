const express = require('express');
const router = express.Router();
const db = require('../db');

function insertMockTask(source, title, description, external_id) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO tasks (title, description, source, external_id) VALUES (?, ?, ?, ?)`,
            [title, description, source, external_id],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

router.post('/gmail', async (req, res) => {
    try {
        const id = Math.floor(Math.random() * 10000);
        await insertMockTask(
            'GMAIL', 
            `Email: Urgent Client Request #${id}`, 
            `Mock email content for request ${id}...`, 
            `msg_${id}`
        );
        res.json({ message: "Gmail sync completed, mock task added" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/jira', async (req, res) => {
    try {
        const id = Math.floor(Math.random() * 10000);
        await insertMockTask(
            'JIRA', 
            `PROJ-${id}: Fix critical bug`, 
            `Mock Jira issue description...`, 
            `PROJ-${id}`
        );
        res.json({ message: "Jira sync completed, mock task added" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
