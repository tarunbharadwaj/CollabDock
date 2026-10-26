import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const palette = {
  ink: rgb(0.075, 0.075, 0.11),
  muted: rgb(0.39, 0.40, 0.47),
  faint: rgb(0.54, 0.55, 0.62),
  line: rgb(0.88, 0.88, 0.92),
  surface: rgb(0.965, 0.965, 0.985),
  surfaceAlt: rgb(0.985, 0.984, 0.995),
  violet: rgb(0.32, 0.25, 0.76),
  pink: rgb(1, 0.31, 0.64),
  violetSoft: rgb(0.925, 0.91, 0.995),
  header: rgb(0.105, 0.09, 0.16),
  white: rgb(1, 1, 1),
  headerMuted: rgb(0.72, 0.69, 0.82),
};

const clean = (value = '') => String(value).replace(/[^\x20-\x7E]/g, '');
const money = (paisa) => `INR ${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function fitText(text, font, size, maxWidth) {
  const value = clean(text);
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let result = value;
  while (result && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) result = result.slice(0, -1);
  return `${result.trimEnd()}...`;
}

function wrapText(text, font, size, maxWidth, maxLines = 3) {
  const words = clean(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      return;
    }
    if (current) lines.push(current);
    current = fitText(word, font, size, maxWidth);
  });
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = fitText(`${visible[maxLines - 1]}...`, font, size, maxWidth);
  return visible;
}

export async function buildInvoicePdf(invoice) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const editorial = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
  let page;

  const draw = (text, x, y, size = 10, font = regular, color = palette.ink) => {
    page.drawText(clean(text), { x, y, size, font, color });
  };
  const drawRight = (text, right, y, size = 10, font = regular, color = palette.ink) => {
    const value = clean(text);
    draw(value, right - font.widthOfTextAtSize(value, size), y, size, font, color);
  };
  const drawLines = (lines, x, y, size = 9, font = regular, color = palette.muted, leading = 12) => {
    lines.forEach((line, index) => draw(line, x, y - index * leading, size, font, color));
  };
  const label = (text, x, y, color = palette.muted) => draw(text.toUpperCase(), x, y, 7.5, bold, color);
  const labelRight = (text, right, y, color = palette.muted) => drawRight(text.toUpperCase(), right, y, 7.5, bold, color);

  const drawBrand = (x, y, inverse = false) => {
    const wordColor = inverse ? palette.white : palette.ink;
    draw('Collab', x, y, 14, editorial, wordColor);
    draw('DOCK', x + 42, y + 1.2, 11, bold, wordColor);
    page.drawLine({ start: { x: x + 41, y: y - 2.5 }, end: { x: x + 84, y: y - 2.5 }, thickness: 2.5, color: palette.violet });
    draw('*', x + 84, y + 10, 10, bold, palette.pink);
  };

  const drawTableHeader = (y) => {
    page.drawRectangle({ x: MARGIN, y, width: CONTENT_WIDTH, height: 32, color: palette.surface });
    label('Description', MARGIN + 12, y + 12);
    label('Qty', 420, y + 12);
    label('Amount', 493, y + 12);
    return y;
  };

  const addContinuationPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBrand(MARGIN, 796);
    label('Invoice', 407, 802);
    drawRight(invoice.invoiceNumber, PAGE_WIDTH - MARGIN, 782, 11, bold);
    page.drawLine({ start: { x: MARGIN, y: 764 }, end: { x: PAGE_WIDTH - MARGIN, y: 764 }, thickness: 0.7, color: palette.line });
    label('Line items continued', MARGIN, 738, palette.violet);
    return drawTableHeader(690);
  };

  const addSummaryPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBrand(MARGIN, 796);
    label('Invoice', 407, 802);
    drawRight(invoice.invoiceNumber, PAGE_WIDTH - MARGIN, 782, 11, bold);
    page.drawLine({ start: { x: MARGIN, y: 764 }, end: { x: PAGE_WIDTH - MARGIN, y: 764 }, thickness: 0.7, color: palette.line });
    label('Invoice summary', MARGIN, 738, palette.violet);
    return 710;
  };

  page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: 700, width: PAGE_WIDTH, height: 142, color: palette.header });
  page.drawRectangle({ x: 0, y: 700, width: 7, height: 142, color: palette.violet });
  drawBrand(MARGIN, 802, true);
  draw('Invoice', MARGIN, 724, 30, bold, palette.white);

  labelRight('Invoice number', PAGE_WIDTH - MARGIN, 794, palette.headerMuted);
  drawRight(invoice.invoiceNumber, PAGE_WIDTH - MARGIN, 774, 12, bold, palette.white);
  labelRight('Amount due', PAGE_WIDTH - MARGIN, 746, palette.headerMuted);
  drawRight(money(invoice.totalPaisa), PAGE_WIDTH - MARGIN, 722, 15, bold, palette.white);

  const drawPartyColumn = (party, title, shortLabel, x, width) => {
    const y = 568;
    page.drawRectangle({ x: x + 16, y: y + 67, width: 22, height: 22, color: palette.violetSoft });
    draw(shortLabel, x + 23, y + 74, 8, bold, palette.violet);
    label(title, x + 47, y + 75, palette.violet);
    draw(fitText(party.name, bold, 12, width - 32), x + 16, y + 48, 12, bold);
    const details = [party.email, party.phone, party.address].filter(Boolean).join('  |  ');
    drawLines(wrapText(details, regular, 8.5, width - 32, 2), x + 16, y + 29, 8.5, regular, palette.muted, 12);
  };

  page.drawRectangle({ x: MARGIN, y: 568, width: CONTENT_WIDTH, height: 106, color: palette.surfaceAlt, borderColor: palette.line, borderWidth: 0.7 });
  page.drawRectangle({ x: MARGIN, y: 568, width: 4, height: 106, color: palette.violet });
  page.drawLine({ start: { x: 297.5, y: 584 }, end: { x: 297.5, y: 658 }, thickness: 0.7, color: palette.line });
  drawPartyColumn(invoice.from, 'From', 'F', MARGIN, 253.5);
  drawPartyColumn(invoice.billTo, 'Bill to', 'B', 297.5, 253.5);

  page.drawRectangle({ x: MARGIN, y: 496, width: CONTENT_WIDTH, height: 44, color: palette.white, borderColor: palette.line, borderWidth: 0.7 });
  const metadata = [
    ['Invoice date', date(invoice.invoiceDate), MARGIN + 14],
    ['Due date', date(invoice.dueDate), 218],
    ['Currency', invoice.currency || 'INR', 393],
  ];
  metadata.forEach(([title, value, x]) => {
    label(title, x, 520);
    draw(value, x, 504, 9.5, bold);
  });

  let cursorY = drawTableHeader(442);
  invoice.lineItems.forEach((item, index) => {
    const descriptionLines = wrapText(item.description, regular, 9, 330, 2);
    const rowHeight = Math.max(40, descriptionLines.length * 11 + 18);
    if (cursorY - rowHeight < 220) cursorY = addContinuationPage();

    const rowBottom = cursorY - rowHeight;
    if (index % 2 === 1) page.drawRectangle({ x: MARGIN, y: rowBottom, width: CONTENT_WIDTH, height: rowHeight, color: palette.surfaceAlt });
    drawLines(descriptionLines, MARGIN + 12, cursorY - 24, 9, regular, palette.ink, 11);
    draw(String(item.quantity), 420, cursorY - 24, 9);
    drawRight(money(item.amountPaisa), PAGE_WIDTH - MARGIN - 12, cursorY - 24, 8.5, bold);
    page.drawLine({ start: { x: MARGIN, y: rowBottom }, end: { x: PAGE_WIDTH - MARGIN, y: rowBottom }, thickness: 0.55, color: palette.line });
    cursorY = rowBottom;
  });

  if (cursorY < 255) cursorY = addSummaryPage();
  const summaryTop = cursorY - 22;
  const paymentText = invoice.paymentInstructions || 'Please use the invoice number as the payment reference.';
  const paymentLines = wrapText(paymentText, regular, 8.5, 265, 4);

  page.drawRectangle({ x: MARGIN, y: summaryTop - 82, width: 290, height: 82, color: palette.surfaceAlt, borderColor: palette.line, borderWidth: 0.7 });
  label('Payment details', MARGIN + 14, summaryTop - 22, palette.violet);
  drawLines(paymentLines, MARGIN + 14, summaryTop - 42, 8.5, regular, palette.muted, 11);

  page.drawRectangle({ x: 348, y: summaryTop - 82, width: 203, height: 82, color: palette.violetSoft });
  label('Total due', 364, summaryTop - 25, palette.violet);
  drawRight(money(invoice.totalPaisa), 535, summaryTop - 56, 16, bold, palette.violet);

  if (invoice.notes) {
    const notesTop = summaryTop - 105;
    label('Notes', MARGIN, notesTop, palette.violet);
    drawLines(wrapText(invoice.notes, regular, 8.5, CONTENT_WIDTH, 3), MARGIN, notesTop - 18, 8.5, regular, palette.muted, 11);
  }

  const pages = pdf.getPages();
  pages.forEach((pdfPage, index) => {
    pdfPage.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 0.55, color: palette.line });
    pdfPage.drawText('Generated with CollabDock. Tax information is provided by the issuer where applicable.', { x: MARGIN, y: 24, size: 7.5, font: regular, color: palette.faint });
    const pageNumber = `${index + 1} / ${pages.length}`;
    pdfPage.drawText(pageNumber, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageNumber, 7.5), y: 24, size: 7.5, font: regular, color: palette.faint });
  });

  return Buffer.from(await pdf.save());
}
