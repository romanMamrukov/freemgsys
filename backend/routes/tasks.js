const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    const status = req.query.status;
    let sql = 'SELECT * FROM tasks';
    let params = [];
    if (status) {
        const statuses = status.split(',');
        const placeholders = statuses.map(() => '?').join(',');
        sql += ` WHERE status IN (${placeholders})`;
        params.push(...statuses);
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const { title, description, source, external_id } = req.body;
    db.run(
        `INSERT INTO tasks (title, description, source, external_id) VALUES (?, ?, ?, ?)`,
        [title, description, source || 'MANUAL', external_id || null],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            db.get(`SELECT * FROM tasks WHERE id = ?`, [this.lastID], (err, row) => {
                res.json(row);
            });
        }
    );
});

router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    let sql = `UPDATE tasks SET status = ?`;
    const params = [status];
    
    if (status === 'IN_PROGRESS') {
        sql += `, started_at = COALESCE(started_at, CURRENT_TIMESTAMP)`;
    } else if (status === 'COMPLETED') {
        sql += `, completed_at = CURRENT_TIMESTAMP`;
    }
    
    sql += ` WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM tasks WHERE id = ?`, [req.params.id], (err, row) => {
            res.json(row);
        });
    });
});

router.put('/:id', (req, res) => {
    const { comment } = req.body;
    let sql = `UPDATE tasks SET updated_at = CURRENT_TIMESTAMP`;
    const params = [];
    
    if (comment !== undefined) {
        sql += `, comment = ?`;
        params.push(comment);
    }
    
    sql += ` WHERE id = ?`;
    params.push(req.params.id);
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

router.put('/:id/time', (req, res) => {
    const { actual_time } = req.body;
    db.run(`UPDATE tasks SET actual_time = ? WHERE id = ?`, [actual_time, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.get(`SELECT * FROM tasks WHERE id = ?`, [req.params.id], (err, row) => {
            res.json(row);
        });
    });
});

router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM tasks WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

module.exports = router;
