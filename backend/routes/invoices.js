const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const HOURLY_RATE_EUR = 50.0; // fallback
const INVOICES_DIR = path.join(__dirname, '..', '..', 'invoices_output');

if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR);
}

function generateInvoicePDF(invoiceId, tasks, totalHours, totalAmount, settings) {
    return new Promise((resolve, reject) => {
        const filename = `Invoice_${invoiceId}_${new Date().toISOString().split('T')[0]}.pdf`;
        const filepath = path.join(INVOICES_DIR, filename);
        
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        
        doc.fontSize(20).text('INVOICE', { align: 'left' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice ID: ${invoiceId}`);
        doc.text(`Date: ${new Date().toISOString().split('T')[0]}`);
        doc.moveDown();
        
        const { invoiceFromName, invoiceToName, hourlyRate } = settings;
        doc.text(`From: ${invoiceFromName || '[YOUR NAME / COMPANY PLACEHOLDER]'}`);
        doc.text(`To: ${invoiceToName || '[CLIENT NAME PLACEHOLDER]'}`);
        doc.moveDown();
        
        doc.fontSize(14).text('Tasks Performed:', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(10);
        tasks.forEach(t => {
            const hours = (t.actual_time / 60).toFixed(2);
            doc.text(`- ${t.title}: ${hours} hours`);
        });
        
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Total Hours: ${totalHours.toFixed(2)}`, { align: 'right' });
        doc.text(`Rate: ${parseFloat(settings.hourlyRate || HOURLY_RATE_EUR).toFixed(2)} EUR / Hour`, { align: 'right' });
        doc.text(`Total Amount Due: ${totalAmount.toFixed(2)} EUR`, { align: 'right' });
        
        doc.end();
        
        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
    });
}

router.post('/generate', (req, res) => {
    const { task_ids } = req.body;
    if (!task_ids || task_ids.length === 0) {
        return res.status(400).json({ error: 'No tasks provided' });
    }
    // Get settings first
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        const currentHourlyRate = parseFloat(settings.hourlyRate) || HOURLY_RATE_EUR;

        // Get tasks
        const placeholders = task_ids.map(() => '?').join(',');
        db.all(`SELECT * FROM tasks WHERE id IN (${placeholders})`, task_ids, async (err, tasks) => {
            if (err) return res.status(500).json({ error: err.message });
            if (tasks.length === 0) return res.status(400).json({ error: 'Tasks not found' });
            
            let totalMinutes = 0;
            tasks.forEach(t => totalMinutes += t.actual_time);
            
            const totalHours = totalMinutes / 60.0;
            const totalAmount = totalHours * currentHourlyRate;
            
            db.run(
                `INSERT INTO invoices (total_hours, total_amount_eur) VALUES (?, ?)`,
                [totalHours, totalAmount],
                async function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    const invoiceId = this.lastID;
                    
                    try {
                        const pdfPath = await generateInvoicePDF(invoiceId, tasks, totalHours, totalAmount, settings);
                        db.run(`UPDATE invoices SET pdf_filepath = ? WHERE id = ?`, [pdfPath, invoiceId]);
                        
                        // update tasks to INVOICED
                        db.run(`UPDATE tasks SET status = 'INVOICED' WHERE id IN (${placeholders})`, task_ids);
                        
                        res.json({ id: invoiceId, total_hours: totalHours, total_amount_eur: totalAmount, pdf_filepath: pdfPath });
                    } catch (e) {
                        res.status(500).json({ error: 'Failed to generate PDF' });
                    }
                }
            );
        });
    });
});

router.get('/', (req, res) => {
    db.all('SELECT * FROM invoices ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:id/download', (req, res) => {
    db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row || !row.pdf_filepath) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.download(row.pdf_filepath);
    });
});

module.exports = router;
