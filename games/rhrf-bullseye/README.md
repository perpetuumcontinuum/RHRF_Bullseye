RHRF Bullseye
=============

:Project name: RHRF Bullseye
:Builder: [YOUR_HANDLE_OR_NAME]
:Contact: [TELEGRAM/GITHUB/DISCORD]
:Category: Character Spotlight
:Stack: React, TypeScript, FriendSDK, SVG
:FriendSDK version: v0.1.4
:License: MIT
:Source repository: [GITHUB_REPO_URL]
:Playable preview: [PUBLIC_PREVIEW_URL]

One sentence: RHRF Bullseye is a fun cyber archery minigame where the selected Rare Friend defends the planet, builds streaks, manages inventory and can share results to X. RF is only the name of simulated score points and is not convertible into anything.

RF disclaimer
-------------

RF in this game is a simulated score label. It is not a token balance, not a wallet balance, not redeemable, not transferable and not connected to live $RAREFRIENDS activity in this preview. The MIT license lets other developers adapt the project for future token or economy integrations if they choose.

Wallet and network
------------------

This is a FriendSDK game, so the preview runtime still requires:

- browser wallet connected to Robinhood mainnet, chain 4663;
- owned hardwired Rare Friends Generations NFT, generation 1 or higher.

The preview uses FriendSDK v0.1.4 without ``--deployment``. Live RF transfers, approvals, signing, contract writes and unused raw-transaction actions are excluded from the preview bundle. All gameplay purchases and rewards are simulated.

How to play
-----------

The selected Rare Friend becomes the archer. The player shoots a moving target, dodges ghosts, deflects asteroids, earns simulated RF, manages inventory and can generate a screenshot/share text for X.

Game UI stays inside the sandboxed FriendSDK container. The reference layout is 960 x 640.

Controls:

- SHOT: fire the arrow. Hotkey: 2
- JUMP: dodge ghosts. Hotkey: 3
- TOWER LASER: destroy asteroids. Hotkey: 1
- SHOP: buy, equip and sell items. Hotkey: 6 or S
- PROFILE: inspect equipment, stats and cyber style. Hotkey: 7 or P
- GUIDE: open rules and controls. Hotkey: 8 or G
- MUTE: toggle audio. Hotkey: 5 or M
- PAUSE: freeze gameplay while shop, mute and screenshot controls remain available. Hotkey: 4 or Space
- X SHARE: generate scene snapshot and share text. Button only, no hotkey.
- Close any overlay: Esc

Touch controls are available through on-screen buttons. Keyboard shortcuts cover all main actions (1-8, Space, M, S, P, G) and Esc closes overlays; the same list is shown in the in-game Guide.

Rules
-----

Target scoring:

- Bullseye: 10 points, animated cyber shimmer.
- Epic zone: 9 to 7 points, violet ring.
- Rare zone: 6 to 4 points, lime ring.
- Common zone: 3 to 1 points, cyan ring.
- Miss: 0 points and streak reset.

A bullseye hit always uses the cyber shimmer effect on the score popup and score button. This makes precision shooting visually rewarding even when Cyber Style is not equipped.

Streaks:

- Cyber streak: consecutive bullseye hits.
- Ghost streak: consecutive ghosts dodged without being hit.
- Asteroid streak: consecutive asteroids destroyed.

A failed action resets the corresponding streak. The local leaderboard displays streaks of 3 or more.

Passive income:

- A satellite event can award a rare laser consumable.
- Laser inventory is capped at 100.
- Passive laser accrual can continue while gameplay is paused.
- The player can still sell lasers up to the cap.

Cyber Style:

- Requires Legendary Bow, Legendary Outfit and Legendary Amulet.
- Changes character presentation.
- Grants reduced screen shake during asteroid impacts.

Simulated economy
-----------------

All values below are simulated score points. They are not token balances and have no financial value.

- Target hit: score-based RF.
- Asteroid destroyed: score bounty scaled by the equipped energy charge (x2 rare, x3 epic, x4 legendary) and it extends the asteroid streak.
- Selling item: 50 percent of listed price.
- Offer sale: 60 percent of listed price.
- Legendary Bow: 1800 RF.
- Rare Outfit: 350 RF.
- Epic Outfit: 800 RF.
- Legendary Outfit: 1600 RF.
- Rare Amulet: 450 RF.
- Epic Amulet: 1000 RF.
- Legendary Amulet: 2000 RF.
- Consumables: arrows 60/150/300 RF, energy 300/800/1600 RF, armor 100/220/400 RF (rare/epic/legendary).
- Current price tuning is modest; when stat persistence arrives, the economy will become deeper and new features will appear.

Consumables are split into arrows, armor and energy. Arrows affect shot rarity and color, armor affects protection, and energy affects tower laser availability or power.

Before submission, copy exact costs, outcome weights, maximum prize and expected reward from ``engine/catalog.ts`` and ``game.json`` into this section.

Run and validate
----------------

Install dependencies::

    npm install

Install FriendSDK v0.1.4 from the official release archive::

    npm install https://github.com/spokesz/friendsdk/releases/download/v0.1.4/rarefriends-friendsdk-0.1.4.tgz --save-exact

Run local preview::

    npx friendsdk dev ./games/rhrf-bullseye

Open::

    http://127.0.0.1:4173

Build::

    npx friendsdk build ./games/rhrf-bullseye

Check::

    npx friendsdk check ./games/rhrf-bullseye

Typecheck::

    npm run typecheck

Optional browser test::

    npm install -D playwright
    npx playwright install chromium
    npx friendsdk test ./games/rhrf-bullseye --screenshot ./artifacts/game.png

Checks
------

- FriendSDK v0.1.4 installed from official release archive.
- Preview build excludes live transaction code.
- Wallet and network requirements documented.
- RF disclaimer documented.
- English-only game UI.
- No emoji in gameplay code or UI.
- On-screen touch controls available.
- Keyboard controls available through in-game Guide.
- Mute control available.
- Pause control available.
- Screenshot and share fallback implemented.
- Local leaderboard is session-only due to SDK sandbox storage limits.
- Simulated shop purchase, equip and sell flow tested manually.

Known issues
------------

- The FriendSDK sandbox does not guarantee persistent ``localStorage`` or IndexedDB access, so local stats may reset after reload.
- Native sharing, downloads and popups may be blocked inside sandboxed iframes. The share button degrades safely: native share, then download, then X intent.
- Cross-origin stylesheet access may be blocked during screenshot serialization. The screenshot logic falls back from JPEG to SVG.
- Server-backed multiplayer leaderboard is not implemented yet. The current leaderboard is local-only.
- Reduced-motion support should be verified on target devices before final submission.
- Exact economy values are sourced from ``engine/catalog.ts`` and ``game.json``; update this README if those files change.

License
-------

This project is licensed under the MIT License. See ``LICENSE``.

SPDX-License-Identifier: MIT

Credits
-------

- FriendSDK runtime, wallet gate, Friend selection, sprites and sound kit: FriendSDK project, Apache-2.0 source, artwork terms per NOTICE.md.
- Game code and original design: MIT License.
- No third-party gameplay assets are required for the core experience.

## Post-vibeathon polish

### Localization
27 locales in `locales/` (ar cs da de el en es fi fr hi hu id it ja ko nl no pl pt ro ru sv th tr uk vi zh). UI chrome + Guide translated; flavor text (streak/time/RF phrases, badge titles) stays English by design — badges are proper-noun titles. `scripts/check-locales.mjs` enforces key parity vs `en.ts` and registry sync; runtime falls back `lang -> en -> raw key`. RTL (`ar`, reserved `he/fa/ur`) flips text direction via `isRTL()` + `.rf-rtl`. Language choice persists in `localStorage` where available, else per-session.

### Badges & persistence groundwork
48 badges in 5 rarity-colored blocks: RF 5 (red, top), Ghost 11 (lime), Asteroid 11 (purple), Cyber 9 (orange), Time 12 (cyan, shimmering dial). IDs are `${kind}_${n}` (`time_1001`, `ghost_101`, `rf_1000`) and are independent of label/icon/color — renaming or restyling never breaks unlock state or a future on-chain mapping. When the SDK ships a save API the mint path is a pure diff: `local.earnedBadges - wallet.minted = queue`. Badges are cosmetic with no RF redemption promise, so they need no prize reserve, only mint gas. On v0.1.4 (no save API, no localStorage in sandbox) progress is session-only; the start banner says so.

### Verification hooks (localhost/test hosts only)
Console: `__RHRF_ADD_HOURS__(n)` fast-forwards play time, `__RHRF_ADD_RF__(n)` fast-forwards earned RF. Both drive the real crossing -> unlock -> banner path, so badge reveals are testable without grinding.

### Design invariants & known traps
- Jump arc is single-sourced in `engine/jump.ts`: `JUMP_ARC_MS=1155` equals the CSS `archerJumpSpin360 1.155s`; the safe-dodge window `200..955ms` is symmetric inside it. Do not edit the CSS duration without editing `JUMP_ARC_MS` — the earlier 1200ms outlier produced a "visually airborne but vulnerable" tail.
- `GHOST_START=1155` in `BackgroundEvents.tsx` is a spawn X coordinate that numerically collides with the arc ms. Unrelated; do not "unify" it.
- CI pins `node-version: 22` (SDK requirement) and `runs-on: ubuntu-24.04`. Node20 left runners 23.09.2026; the lingering "Node 20 deprecated" annotation is action metadata being force-run on Node24, so deploys stay green and bumping majors is cosmetic. `ubuntu-latest` migrates to 26.04 from 19.10.2026 — the pin is the documented mitigation.
