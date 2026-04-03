const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                source TEXT DEFAULT 'MANUAL',
                external_id TEXT,
                status TEXT DEFAULT 'INBOX',
                estimated_time REAL DEFAULT 60.0,
                actual_time REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS time_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                duration_minutes REAL DEFAULT 0.0,
                manual_edit BOOLEAN DEFAULT 0,
                FOREIGN KEY(task_id) REFERENCES tasks(id)
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_hours REAL DEFAULT 0.0,
                total_amount_eur REAL DEFAULT 0.0,
                pdf_filepath TEXT
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);
            
            // Insert defaults if not exists
            const defaultSettings = [
                { key: 'invoiceFromName', value: 'My Company Name' },
                { key: 'invoiceToName', value: 'Client Company Name' },
                { key: 'hourlyRate', value: '50.0' },
                { key: 'gmailEmail', value: '' },
                { key: 'gmailAppPassword', value: '' },
                { key: 'jiraDomain', value: '' },
                { key: 'jiraEmail', value: '' },
                { key: 'jiraApiToken', value: '' }
            ];
            
            const stmt = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
            defaultSettings.forEach(s => {
                stmt.run(s.key, s.value);
            });
            stmt.finalize();
        });
    }
});

module.exports = db;
