/**
 * The physical paper the till prints on.
 *
 * A property of the printer, not of any one screen — the sales receipt and the
 * X-report both come off the same roll, so the width lives here rather than
 * being written twice.
 *
 * 80mm covers most Epson TM models (T20, T82, T88, M30); 58mm the narrow and
 * mobile ones. Set NEXT_PUBLIC_RECEIPT_WIDTH_MM and restart.
 *
 * At 58mm the page width, padding and body size follow, but headings inside the
 * printed blocks carry their own sizes from the markup and may need a pass —
 * print one and look before rolling it out to a shop.
 */
export const RECEIPT_WIDTH_MM = Number(process.env.NEXT_PUBLIC_RECEIPT_WIDTH_MM) || 80

/** Side margin, proportional so a 58mm roll keeps its usable width. */
export const RECEIPT_PADDING_MM = RECEIPT_WIDTH_MM >= 80 ? 5 : 3

/** Body type size, in px, that fits the roll without wrapping money columns. */
export const RECEIPT_FONT_PX = RECEIPT_WIDTH_MM >= 80 ? 12 : 10

/**
 * The print rules every roll printout needs.
 *
 * Thermal heads are black-on-white only: a coloured background or a reversed
 * panel comes out as a grey smear or a solid black block, so everything is
 * flattened. `size: <width> auto` is what makes the roll cut at the end of the
 * content instead of feeding a fixed page.
 */
export function receiptPrintCss(areaId: string): string {
    return `
        @page { size: ${RECEIPT_WIDTH_MM}mm auto; margin: 0; }
        /* The app shell is a full-height flex column with overflow hidden. Left
           alone it caps the printed page at one screen, which silently truncates
           a long X-report at whatever the till's monitor happens to fit. */
        html, body {
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
        }
        body * { visibility: hidden; }
        #${areaId}, #${areaId} * { visibility: visible; }
        #${areaId} {
            display: block !important;
            position: absolute; left: 0; top: 0;
            width: ${RECEIPT_WIDTH_MM}mm;
            padding: 6mm ${RECEIPT_PADDING_MM}mm;
            color: #000; background: #fff;
            font-family: 'Courier New', monospace;
            font-size: ${RECEIPT_FONT_PX}px;
            border: none !important; border-radius: 0 !important;
        }
        #${areaId} * {
            color: #000 !important;
            background: transparent !important;
            box-shadow: none !important;
        }
        .no-print { display: none !important; }
    `
}
