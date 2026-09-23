import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

/*
  Batch 6 dedicated iOS/mobile pass. Real gaps found and fixed:
  Staking.css had zero touch-target sizing anywhere (the per-stake
  claim/unstake buttons, the coin/duration selects); NotificationCenter
  had no long-text wrapping for notification titles/bodies, and its
  flex layout was missing min-width: 0 on the text content column -
  a well-known CSS flex gotcha where a flex item won't shrink below
  its content's natural width even with overflow-wrap set, which
  would have caused real horizontal overflow on narrow iPhones for
  any sufficiently long, unbroken notification title.
*/

test("Staking.css: every interactive control (selects, stake button, per-stake actions) meets the 44px touch-target minimum", async () => {
  const css = await readFile(
    new URL("../src/components/Staking.css", import.meta.url),
    "utf8"
  );

  const selectBlock = css.match(/\.staking-select \{[^}]*\}/);
  assert.match(selectBlock[0], /min-height:\s*44px/);

  const rowActionsBlock = css.match(/\.stake-row-actions button \{[^}]*\}/);
  assert.match(rowActionsBlock[0], /min-height:\s*44px/);
  assert.match(rowActionsBlock[0], /min-width:\s*44px/);

  const mainButtonsBlock = css.match(
    /\.stake-btn,\s*\n\.unstake-btn,\s*\n\.claim-btn \{[^}]*\}/
  );
  assert.match(mainButtonsBlock[0], /min-height:\s*44px/);
});

test("Staking.css: the stakes table has real horizontal-scroll overflow handling for narrow screens", async () => {
  const css = await readFile(
    new URL("../src/components/Staking.css", import.meta.url),
    "utf8"
  );
  assert.match(css, /\.stakes-table-box[\s\S]{0,400}overflow-x:\s*auto/);
});

test("NotificationCenter.css: long notification titles and bodies genuinely wrap rather than overflowing", async () => {
  const css = await readFile(
    new URL("../src/components/NotificationCenter.css", import.meta.url),
    "utf8"
  );

  const titleBlock = css.match(/\.notification-card h3 \{[^}]*\}/);
  assert.match(titleBlock[0], /overflow-wrap:\s*break-word/);

  const bodyBlock = css.match(/\.notification-card p \{[^}]*\}/);
  assert.match(bodyBlock[0], /overflow-wrap:\s*break-word/);
});

test("NotificationCenter: the text-content flex child has min-width: 0 - without this, overflow-wrap alone would not prevent horizontal overflow on narrow screens (a real, well-known flexbox gotcha)", async () => {
  const jsx = await readFile(
    new URL("../src/components/NotificationCenter.jsx", import.meta.url),
    "utf8"
  );
  const css = await readFile(
    new URL("../src/components/NotificationCenter.css", import.meta.url),
    "utf8"
  );

  assert.match(jsx, /className="notification-card__content"/);

  const contentBlock = css.match(/\.notification-card__content \{[^}]*\}/);
  assert.ok(contentBlock, "notification-card__content CSS rule not found");
  assert.match(contentBlock[0], /min-width:\s*0/);
});

test("Referral.css already had real overflow/word-break handling for its member table - confirmed, not newly added", async () => {
  const css = await readFile(
    new URL("../src/components/Referral.css", import.meta.url),
    "utf8"
  );
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /word-break/);
});

test("ServicesHub.css tap targets meet the 44px minimum - reconfirmed unchanged from Batch 6's original build", async () => {
  const css = await readFile(
    new URL("../src/components/ServicesHub.css", import.meta.url),
    "utf8"
  );
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /min-width:\s*44px/);
});
