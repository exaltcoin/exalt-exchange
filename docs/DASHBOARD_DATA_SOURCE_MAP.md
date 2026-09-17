# Dashboard Data Source Map

Produced by reading the actual current `src/components/Dashboard.jsx`
(1,896 lines) before any visual restructuring, per the redesign safety
rule that a UI migration must not change what data means or where it
comes from.

**Overall finding: this component has already been through multiple
prior audit passes removing fabricated fallbacks** - the source has
explicit comments referencing "Batch F", "Batch K", "Phase 4/17",
"RC2", and "Release blocker" fixes, each explaining a real bug that
was found and corrected (documented below where relevant). This is
not a first pass at realness for this component.

## Trace: UI field → frontend state/service → API/backend source → transformation → fallback behavior

| UI field | State | Loader | Endpoint | Auth | Transform | Fallback behavior |
|---|---|---|---|---|---|---|
| Total balance (USD) | `totalBalanceValue` | `valueBalances(walletBalances)` | derived, not fetched directly | — | Sums each coin's real balance × its real price; **a coin with no live price is excluded from the sum entirely, not counted as $0 or a fabricated price** | If no prices are live yet, total is simply the sum of only the coins that do have one (can be $0 if none do) |
| Available balance (USD) | `availableBalanceValue` | derived | — | — | `max(0, totalBalanceValue - lockedBalanceValue)` | Same as above |
| Locked balance (USD) | `lockedBalanceValue` | derived | — | — | `valueBalances(walletLocked)` | Computed but **not currently rendered as its own line item** - only used to derive available balance |
| Per-asset balances (USDT/BNB/EXALT) | `walletBalances`, `walletLocked` | `loadExaltWalletBalance` | `GET /api/wallets/me` (real, authenticated) | Bearer token; if none, sets holdings to 0 and returns | Reads `data.wallet.balances`/`data.wallet.locked` directly | On request failure: caught, logged via `describeRequestError`, holdings reset to 0 - **not left at a stale previous value** |
| EXALT price | `exaltPrice` | `loadLiveMarkets` | `GET /api/market/live` (internal) | none | Matches the EXALT pair by symbol from the real pairs array | **Initial state is `null`, not a hardcoded number** - `coinPriceMap` explicitly treats `null`/non-positive prices as "no price yet" and excludes that coin from any USD total. See the inline comment at the state declaration: a prior version defaulted to a fabricated `0.02456` that silently priced real EXALT holdings even when no live fetch had ever succeeded - already found and fixed (Phase 4/17) |
| BNB price | `bnbPrice` | `loadLiveMarkets` | `GET /api/market/live` (internal) | none | Same pattern, searched across the full unsliced pairs list (not just the top-6 trending slice) | Same "excluded until real" rule via `coinPriceMap` |
| Other market prices / 24h change (trending list) | `coins` | `loadLiveMarkets` | `GET /api/market/live` (internal) | none | Top 6 pairs from the real response | Empty array if the request fails - renders as no trending coins, not fake ones |
| Market cap / Liquidity | `marketCap`, `liquidity` | `loadDexData` | `https://api.dexscreener.com/latest/dex/tokens/{EXALT_ADDRESS}` (external) | none | Real fields from DexScreener's response for the EXALT token address | On failure (including this sandbox's lack of external network access): caught and logged, values stay at their initial `0` - **this is the one place an "unavailable" value currently reads as `$0` rather than an explicit "unavailable" state, worth revisiting during the visual redesign** (see Finding 1 below) |
| PnL | *(not currently displayed anywhere)* | — | — | — | — | N/A - nothing to trace; correctly not fabricated by omission |
| Open orders (recent) | `openOrders` | `loadOpenOrders` | `GET /api/orders/my?status=open,partial&limit=5` (real, authenticated, ownership-scoped) | Bearer token; if none, empty array | Same endpoint family the real Orders page uses | Empty array on any failure/non-200 - renders as "no open orders", not fake ones |
| Recent transactions | `recentTx` | `loadRecentTransactions` | `GET /api/transactions?limit=5` (real, authenticated) | Bearer token; if none, empty array | Same endpoint the real Transactions page uses | Empty array on failure |
| Referral summary (count, approved rewards) | `referralSummary` | `loadReferralSummary` | `GET /api/referrals/me` (real, authenticated) | Bearer token | Same endpoint the real Referral page uses | Not yet fully traced past the loader in this pass - matches the established real-endpoint pattern of every other loader in this file |
| Reward/mining stats (approved/pending amounts, active miners, today's claims, mining pool remaining) | `rewardStats` | `loadRewardStats` | `GET /api/rewards/dashboard` (real, authenticated) | Bearer token; 401 handled explicitly (silent return, not an error) | Reads `data.data.myStats`/`platformStats`/`pools.mining` | Object stays at its initial all-zero shape on failure - **this is a real ambiguity**: an authenticated user with a genuine $0 balance and a user whose request failed both currently render identically as "0". Flagged as Finding 2 below |
| KYC / security status | *(not currently displayed)* | — | — | — | — | Real endpoints exist elsewhere in the app (`kycRoutes.js`) but Dashboard does not call them today - this is new wiring the redesign needs to add, not a fallback to fix |
| Notification count | *(not currently displayed)* | — | — | — | — | `NotificationBell.jsx` already fetches real unread counts via `GET /api/notifications/me` for the shell - Dashboard itself does not duplicate this today. Redesign should either reuse that same real data or leave notification count entirely to the shell's bell rather than inventing a second count |

## Findings from this trace (not yet acted on - recorded for the redesign/CSS batch to address deliberately)

**Finding 1 - `marketCap`/`liquidity` fail-state reads as `$0`, not "unavailable".**
Unlike every wallet/order/transaction loader in this file (which explicitly reset to an empty/zero *state* on failure that the UI can distinguish from "genuinely zero" via a separate loading/error flag), `loadDexData`'s catch block leaves `marketCap`/`liquidity` at their initial `0` with no error flag captured anywhere. A real $0 market cap and a failed DexScreener request are indistinguishable in the current UI. This is exactly the kind of "unsafe default success state" this batch's instructions call out. **Action for the redesign**: introduce a small per-metric status (`"loading" | "ready" | "unavailable"`) for at least this pair, and render an honest "unavailable" state instead of `$0` when the fetch fails - this is an isolated, testable frontend-only change, not a backend/financial-logic change.

**Finding 2 - `rewardStats` failure and genuine-zero are indistinguishable**, same root cause as Finding 1, for the reward/mining panel specifically. Same recommended fix.

**Finding 3 (pre-existing, unrelated to this migration) - two independent logout implementations.** `app.jsx`'s `logout()` (now wired to the real shell's account slot, see the App Shell migration checkpoint) clears `token`/`user` and returns to the `"auth"` page state via React, no full reload. `Dashboard.jsx`'s own `handleLogout` clears `token`/`user`/`wallet`/`walletAddress` and does a hard `window.location.href = "/"` redirect - a different key set and a different mechanism. Not fixed in this batch (out of scope for a UI migration; touching two independent auth-adjacent code paths without dedicated review risks a real regression) - recorded for the dead-code/inconsistency cleanup list.

**Finding 4 (pre-existing, unrelated) - `bottomNavigation` is a second, hand-maintained 6-item list** of `[icon, key, label]` tuples for the mobile quick-access bar, separate from `app.jsx`'s `menuItems`. Its purpose (a curated shortcut subset) is legitimately different from the full navigation menu, so this isn't the same class of problem as the sidebar duplication that was fixed in the App Shell migration, but it does mean the two lists must be kept in sync by hand. Recorded, not changed in this batch.

**Finding 5 - `totalBalanceValue`/`availableBalanceValue` are rendered twice** (two separate JSX blocks, lines ~819/826 and ~1147/1154), suggesting the current markup has duplicate/redundant stat displays - exactly the "duplicated statistic boxes" pattern the redesign is meant to remove. Confirmed real data both times (same state, same computation), not a fabrication issue - a structural duplication issue for the visual redesign to resolve by presenting the number once.

## What this means for the redesign

- No fabricated data was found actively reaching the UI as of this trace. The prior audit passes referenced in the source comments already did that work.
- Two real, small, isolated gaps exist (Findings 1 and 2) where a request failure currently reads identically to a genuine zero - these will be fixed as part of the redesign's request-state work (adding real loading/error/unavailable states was already part of this batch's scope), not deferred further.
- KYC status and notification count are new additions the redesign will wire to real existing endpoints, not fabricated placeholders.
- Findings 3 and 4 are recorded for the separate dead-code/inconsistency cleanup pass, not fixed here.
