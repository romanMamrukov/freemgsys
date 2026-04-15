const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');

const HOURLY_RATE_EUR = 50.0; // fallback
const INVOICES_DIR = path.join(__dirname, '..', '..', 'invoices_output');

if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR);
}

function generateInvoicePDF(invoiceId, tasks, totalHours, totalAmount, settings) {
    return new Promise(async (resolve, reject) => {
        const filename = `Invoice_${invoiceId}_${new Date().toISOString().split('T')[0]}.pdf`;
        const filepath = path.join(INVOICES_DIR, filename);
        
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        
        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
        doc.moveDown();
        
        const { invoiceFromName, invoiceToName, hourlyRate } = settings;
        const currentRate = parseFloat(hourlyRate || HOURLY_RATE_EUR);
        
        // Invoicing Details
        doc.fontSize(12).font('Helvetica-Bold').text('FROM:', 50, 100);
        doc.font('Helvetica').text(invoiceFromName || '[YOUR NAME / COMPANY PLACEHOLDER]', 50, 115);
        
        doc.font('Helvetica-Bold').text('TO:', 50, 150);
        doc.font('Helvetica').text(invoiceToName || '[CLIENT NAME PLACEHOLDER]', 50, 165);
        
        doc.font('Helvetica-Bold').text(`Invoice Number:`, 400, 100);
        doc.font('Helvetica').text(`#${invoiceId.toString().padStart(4, '0')}`, 400, 115);
        
        doc.font('Helvetica-Bold').text(`Date:`, 400, 150);
        doc.font('Helvetica').text(new Date().toISOString().split('T')[0], 400, 165);

        doc.moveDown(4);
        
        // Prepare table data
        const tableData = {
            title: "Tasks Performed",
            headers: [
                { label: "Date", property: "date", width: 80 },
                { label: "Ticket", property: "ticket", width: 80 },
                { label: "Description", property: "description", width: 220 },
                { label: "Time (hrs)", property: "time", width: 60, renderer: null },
                { label: "Total (€)", property: "total", width: 70, renderer: null }
            ],
            datas: tasks.map(t => {
                const hours = (t.actual_time / 60).toFixed(2);
                const taskTotal = (hours * currentRate).toFixed(2);
                const completeDate = t.updated_at ? t.updated_at.split(' ')[0] : new Date().toISOString().split('T')[0];
                
                let desc = t.title;
                if (t.comment) {
                    desc += `\nComment: ${t.comment}`;
                }
                
                let dates = [];
                if (t.created_at) dates.push(`Cr: ${t.created_at.split(' ')[0]}`);
                if (t.started_at) dates.push(`St: ${t.started_at.split(' ')[0]}`);
                if (t.completed_at) dates.push(`Cm: ${t.completed_at.split(' ')[0]}`);
                if (dates.length > 0) {
                    desc += `\n${dates.join(' | ')}`;
                }

                return {
                    date: completeDate,
                    ticket: t.external_id || `TASK-${t.id}`,
                    description: desc,
                    time: hours,
                    total: taskTotal
                };
            }),
        };

        await doc.table(tableData, { 
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: () => doc.font("Helvetica").fontSize(10),
            padding: 5,
            x: 50 // explicitly force it to the left margin
        });
        
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Total Hours: ${totalHours.toFixed(2)}`, { align: 'right' });
        doc.text(`Rate: ${currentRate.toFixed(2)} EUR / Hour`, { align: 'right' });
        
        doc.moveDown(0.5);
        doc.fontSize(16).text(`Total Amount Due: ${totalAmount.toFixed(2)} EUR`, { align: 'right' });
        
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
