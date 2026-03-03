
# Fix PDF format: proper A4 pagination

## Problem
The current code uses `Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)` which scales the entire document to fit on ONE page. For tall documents, this results in a tiny, unreadable single-page PDF.

## Solution
In `src/components/dialogs/ViewDocumentDialog.tsx`, fix `handleDownloadPDF`:

1. **Set the clone width to 794px** (A4 at 96dpi) so html2canvas captures at proper A4 proportions
2. **Scale to fit A4 width only** (`ratio = pdfWidth / imgWidth`)
3. **Paginate**: slice the canvas into chunks of `pdfHeight` and add each as a separate PDF page using `addImage` with a negative Y offset for each subsequent page

This produces a multi-page A4 PDF with properly sized, readable text — exactly like a real document.

### File changed
- `src/components/dialogs/ViewDocumentDialog.tsx` — rewrite lines 86-126 with width-based scaling + multi-page loop
