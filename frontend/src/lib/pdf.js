import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

let fontPromise;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function loadUnicodeFont(doc) {
  if (!fontPromise) {
    fontPromise = fetch(`${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`)
      .then((response) => {
        if (!response.ok) throw new Error('Invoice font could not be loaded.');
        return response.arrayBuffer();
      })
      .then(arrayBufferToBase64);
  }

  try {
    const font = await fontPromise;
    doc.addFileToVFS('DejaVuSans.ttf', font);
    doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal');
    doc.setFont('DejaVu', 'normal');
    return 'DejaVu';
  } catch (error) {
    console.warn('Falling back to the built-in PDF font.', error);
    doc.setFont('helvetica', 'normal');
    return 'helvetica';
  }
}

function money(value, currency) {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency}`;
  }
}

function partyLines(party) {
  return [
    party.name,
    party.registration ? `Registration: ${party.registration}` : '',
    party.address,
    party.email,
    party.phone,
  ].filter(Boolean);
}

function filename(invoice) {
  return `Invoice-${invoice.number}-${invoice.issueDate}.pdf`.replace(/[^a-z0-9_.-]+/gi, '-');
}

export async function downloadInvoicePdf(invoice) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const font = await loadUnicodeFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;

  doc.setFillColor(4, 47, 61);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(font, 'normal');
  doc.setFontSize(23);
  doc.text('INVOICE', margin, 23);
  doc.setFontSize(10);
  doc.text(invoice.number, pageWidth - margin, 17, { align: 'right' });
  doc.text(`Issued ${invoice.issueDate}`, pageWidth - margin, 23, { align: 'right' });
  doc.text(`Due ${invoice.dueDate}`, pageWidth - margin, 29, { align: 'right' });

  doc.setTextColor(30, 43, 47);
  doc.setFontSize(8);
  doc.text('FROM', margin, 48);
  doc.text('BILL TO', 112, 48);
  doc.setFontSize(10);
  doc.text(partyLines(invoice.seller).join('\n') || 'Seller details not configured', margin, 55, {
    maxWidth: 80,
    lineHeightFactor: 1.45,
  });
  doc.text(partyLines(invoice.buyer).join('\n') || 'Client details not configured', 112, 55, {
    maxWidth: 80,
    lineHeightFactor: 1.45,
  });

  autoTable(doc, {
    startY: 86,
    margin: { left: margin, right: margin },
    head: [['Date', 'Reference', 'Description', 'Hours', 'Rate', 'Amount']],
    body: invoice.lines.map((line) => [
      line.date,
      line.reference,
      line.description,
      Number(line.hours).toFixed(2),
      money(line.rate, invoice.currency),
      money(line.amount, invoice.currency),
    ]),
    styles: {
      font,
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: 3,
      lineColor: [214, 222, 219],
      lineWidth: 0.15,
      textColor: [30, 43, 47],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [57, 117, 92],
      textColor: [255, 255, 255],
      fontStyle: 'normal',
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
  });

  let y = doc.lastAutoTable.finalY + 9;
  const totalsX = pageWidth - margin;
  doc.setFontSize(9);
  doc.text(`Subtotal: ${money(invoice.subtotal, invoice.currency)}`, totalsX, y, { align: 'right' });
  if (Number(invoice.taxRate) > 0) {
    y += 6;
    doc.text(`Tax (${invoice.taxRate}%): ${money(invoice.taxAmount, invoice.currency)}`, totalsX, y, { align: 'right' });
  }
  y += 8;
  doc.setFontSize(13);
  doc.setTextColor(4, 47, 61);
  doc.text(`Total due: ${money(invoice.total, invoice.currency)}`, totalsX, y, { align: 'right' });

  const payment = [
    invoice.seller.bank,
    invoice.seller.iban ? `IBAN: ${invoice.seller.iban}` : '',
    invoice.seller.swift ? `SWIFT/BIC: ${invoice.seller.swift}` : '',
  ].filter(Boolean);

  y += 17;
  doc.setTextColor(30, 43, 47);
  doc.setFontSize(8);
  if (payment.length) {
    doc.text('PAYMENT DETAILS', margin, y);
    doc.setFontSize(9);
    doc.text(payment.join('\n'), margin, y + 6, { lineHeightFactor: 1.4 });
  }
  if (invoice.notes) {
    const notesX = payment.length ? 112 : margin;
    doc.setFontSize(8);
    doc.text('NOTES', notesX, y);
    doc.setFontSize(9);
    doc.text(invoice.notes, notesX, y + 6, { maxWidth: payment.length ? 82 : 178, lineHeightFactor: 1.4 });
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont(font, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(105, 114, 110);
    doc.text('Generated by Freelance IT Ops Console', margin, 289);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, 289, { align: 'right' });
  }

  doc.save(filename(invoice));
}
