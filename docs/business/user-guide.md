# User guide

Written from the running interface. Screens referenced here appear in
[../demos/screenshot-index.md](../demos/screenshot-index.md).

## Signing in

1. Open the application. The sign-in screen appears.
2. Enter your email address and password, then select **Sign In**.
3. Owners and managers land on the dashboard; cashiers land on the till.

The screen shows no account hints. If sign-in fails repeatedly for the same
account from the same place, further attempts are refused for a short period —
wait, rather than retrying.

If a banner reports the server is unreachable, sign-in will not work until it is
back. That banner is not a password error.

## Opening a shift (cashier)

1. On the till, a banner asks for the opening cash float.
2. Count the drawer and enter the amount.
3. Select **Confirm**. The float is recorded against your shift.

Sales cannot be completed without an open register and shift.

## Serving a customer

1. Scan the barcode, or type a name, SKU or barcode into the search box.
2. Select a product to add it to the basket. Select again to increase quantity.
3. Adjust quantities or remove lines in the basket on the right.
4. Optionally **Add Customer** to attach a loyalty record.
5. Choose **Cash**, **Card** or **Split**.
   - For cash, enter the amount received; change due is shown.
   - For split, enter each amount; they must add up to the total.
6. For alcohol, tobacco or vapes, confirm the ID check when prompted. The sale
   cannot complete until you do.
7. Select **Complete Payment**. The receipt opens; print or close it.

Subtotal, GST and grand total update as you go. The figures printed on the
receipt come from the server, so they are what was actually charged.

### Holding a basket

Select **Hold Bill** to set a basket aside, and **Resume** to bring it back.
Useful when a customer goes back for something.

## Setting GST rates (owner)

1. Go to **GST & Tax** in the sidebar.
2. For a division, type a percentage or select one of the preset slabs.
3. Select **Save** on that row.

Leaving the box empty means the division uses the store default rather than 0%.
Rates apply to later sales only; earlier receipts keep what they were charged.

## Managing products

1. Go to **Products**.
2. **New Product** to add one; select a row to edit it.
3. Set price, stock, category, supplier and a low-stock threshold.
4. Use **Import CSV** to load many at once, **Export CSV** to take them away.

Products whose name or aisle suggests alcohol, tobacco or vapes are flagged
age-restricted automatically; the flag can also be set by hand.

## Taking a refund (manager or owner)

1. Go to **Reversal Logs** and start a refund against the original sale.
2. Choose the lines and quantities being returned.
3. Record a reason, and tick restock for anything going back on the shelf.
4. Confirm. Cash refunds reduce the drawer.

You cannot refund more than was sold, or more than remains unrefunded.

## Closing a shift

1. Open the **X-report** for the position so far.
2. Count the drawer.
3. Close the shift and enter the counted figure. The Z-report finalises it.

Cash, card and digital are listed separately — compare counted cash against
expected cash only.

## Managing staff (manager or owner)

1. Go to **Team Members**.
2. **Add** a member with a name, email, role and password.
3. Use **Reset Password** or deactivate an account that should no longer sign in.

Managers can create and manage cashiers only. Deactivating is preferred over
deleting, because it keeps that person's sales history attributable.

## Reviewing activity (owner)

**Audit Trail** lists sign-ins, failed sign-ins, sales, refunds and GST rate
changes with times and the person responsible.

## Troubleshooting

| Symptom | What it means | What to do |
| --- | --- | --- |
| "Can't reach the server" banner | The API is down or unreachable | Check the API is running; it is not a password problem |
| "Too many failed sign-ins" | Throttling after repeated failures | Wait for the window to pass |
| Signed out unexpectedly | The token expired or was revoked | Sign in again |
| Sale refused: "Register is not open" | No open register | Open the register and set a float |
| Sale refused: age verification | Restricted line not confirmed | Complete the ID prompt |
| Totals differ from expectation | Server recalculates from its own records | Check the product price and the division's GST rate |
| Product missing from the till | Out of stock, or filtered out | Clear the search and category filter; check stock |
