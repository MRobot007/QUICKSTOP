/**
 * Names shown in the interface and on printed output.
 *
 * Two different things used to be spelled the same way, which is why this file
 * exists:
 *
 *  - PRODUCT_NAME is what the software calls itself, in the sidebar, the
 *    sign-in panel and the browser tab. It is deliberately descriptive rather
 *    than a brand, so the same build can be shown to anyone.
 *
 *  - SHOP_NAME is the *merchant's* name, printed on customer receipts, on
 *    exported report headers and in purchase-order emails to suppliers. It
 *    belongs to whoever is running the till, not to the software, so it is
 *    configuration. It was previously a constant copied into three components,
 *    meaning a shop could not put its own name on its own receipts.
 */

/** What the software calls itself. Descriptive, not a brand. */
export const PRODUCT_NAME = 'Retail POS'

/** One line for the browser tab and metadata. */
export const PRODUCT_DESCRIPTION = 'Point of sale and back office for convenience retail'

/**
 * The trading name printed on receipts, exports and supplier emails.
 *
 * Set NEXT_PUBLIC_SHOP_NAME per deployment. NEXT_PUBLIC_* is inlined at build
 * time, so a change needs a restart. The default is deliberately obviously a
 * placeholder: a receipt headed "Demo Store" is self-evidently a sample, where
 * a real-looking default would quietly end up on a customer's receipt.
 */
export const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME?.trim() || 'Demo Store'
