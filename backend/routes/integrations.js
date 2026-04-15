const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const imaps = require('imap-simple');
const xml2js = require('xml2js');

function getSettings() {
    return new Promise((resolve, reject) => {
        db.all('SELECT key, value FROM settings', [], (err, rows) => {
            if (err) return reject(err);
            const settings = {};
            rows.forEach(r => settings[r.key] = r.value);
            resolve(settings);
        });
    });
}

function insertTask(source, title, description, external_id) {
    return new Promise((resolve, reject) => {
        // Deduplicate
        db.get('SELECT id FROM tasks WHERE external_id = ?', [external_id], (err, row) => {
            if (row) return resolve(row.id);
            db.run(
                `INSERT INTO tasks (title, description, source, external_id) VALUES (?, ?, ?, ?)`,
                [title, description, source, external_id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });
}

router.post('/gmail', async (req, res) => {
    try {
        const settings = await getSettings();
        const { gmailEmail, gmailAppPassword } = settings;
        if (!gmailEmail || !gmailAppPassword) {
            throw new Error("Missing Gmail credentials matching settings.");
        }

        const config = {
            imap: {
                user: gmailEmail,
                password: gmailAppPassword,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 3000
            }
        };

        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');
        // Fetch emails from the last 3 days instead of relying on 'UNSEEN' flag which resets if you look at it
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        const searchCriteria = [['SINCE', pastDate]];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };
        const results = await connection.search(searchCriteria, fetchOptions);

        let added = 0;
        for (let item of results) {
            const header = item.parts.find(p => p.which === 'HEADER').body;
            const subject = header.subject ? header.subject[0] : 'No Subject';
            const from = header.from ? header.from[0] : 'Unknown';
            
            // Filter strictly in javascript to avoid IMAP string syntax errors
            if (!from.toLowerCase().includes('jira@acolad.com') && !subject.toLowerCase().includes('[jira]')) continue;
            
            // Extract Jira code like (AS-283147) from "[jira] (AS-283147) Cable..."
            const match = subject.match(/\(([a-zA-Z]+-\d+)\)/);
            const externalId = match ? match[1] : `email-${Date.now()}`;
            const cleanTitle = subject.replace(/\[jira\]\s*/i, '');
            
            await insertTask('GMAIL', `${cleanTitle}`, `From: ${from}\n(via Email)`, externalId);
            added++;
        }
        
        connection.end();
        res.json({ message: `Gmail sync completed. Added ${added} parsed Jira emails.` });
    } catch (e) {
        console.error("IMAP Error (falling back to mock):", e.message);
        const id = Math.floor(Math.random() * 10000);
        await insertTask('GMAIL', `[MOCK] Urgent Request #${id}`, `Mock email content...`, `msg_${id}`);
        res.json({ message: "Gmail sync failed, generated mock task instead." });
    }
});

const https = require('https');

router.post('/jira-xml', async (req, res) => {
    try {
        const { xmlData } = req.body;
        if (!xmlData) return res.status(400).json({ error: "No XML content provided" });

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        
        // Jira RSS export structure usually puts items under rss.channel.item
        let items = result?.rss?.channel?.item;
        if (!items) {
            return res.status(400).json({ error: "Invalid Jira XML format. No <item> elements found." });
        }
        if (!Array.isArray(items)) items = [items];
        
        let added = 0;
        for (let issue of items) {
            const issueKey = issue.key._ || issue.key;
            const title = issue.summary || issue.title;
            const desc = (issue.description && typeof issue.description === 'object' && issue.description._) ? issue.description._ : (issue.description || '');
            
            await insertTask('JIRA', `${issueKey}: ${title}`, desc, issueKey);
            added++;
        }
        
        res.json({ message: `XML Imported successfully. Added ${added} issues.` });
    } catch (e) {
        console.error("XML Import Error:", e.message);
        res.status(500).json({ error: "Failed to parse XML file" });
    }
});

router.post('/jira', async (req, res) => {
    try {
        const settings = await getSettings();
        const { jiraDomain, jiraApiToken } = settings;
        if (!jiraDomain || !jiraApiToken) {
            throw new Error("Missing Jira domain or token.");
        }

        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const headers = { 
            'Authorization': `Bearer ${jiraApiToken}`,
            'Accept': 'application/json',
            'X-Atlassian-Token': 'no-check'
        };
        
        // Reverting to GET with strictly encoded parameters prevents Tomcat 500 HTML errors
        const jql = encodeURIComponent('assignee=currentUser() AND status!=Closed');
        const endpoint = `${jiraDomain.replace(/\/$/, '')}/rest/api/2/search?jql=${jql}&maxResults=50`;
        
        const response = await axios.get(endpoint, { headers, httpsAgent });
        const issues = response.data.issues || [];
        
        let added = 0;
        for (let issue of issues) {
            await insertTask('JIRA', `${issue.key}: ${issue.fields.summary}`, issue.fields.description || '', issue.key);
            added++;
        }
        
        res.json({ message: `Jira sync completed. Added ${added} live issues.` });
    } catch (e) {
        const errorDetails = e.response && typeof e.response.data === 'string' 
            ? e.response.data.substring(0, 150) + "..." 
            : e.message;
        console.error("Jira Error (falling back to mock):", errorDetails);
        const id = Math.floor(Math.random() * 10000);
        await insertTask('JIRA', `[MOCK] PROJ-${id}: Fix critical bug`, `Mock issue...`, `PROJ-${id}`);
        res.json({ message: "Jira sync failed, generated mock task instead." });
    }
});

module.exports = router;
