# RHRF Bullseye

<p align="center">
  <img src="https://perpetuumcontinuum.github.io/RHRF_Bullseye/favicon.svg" alt="RHRF Bullseye favicon" width="96" />
</p>

<p align="center">
  <img alt="FriendSDK" src="https://img.shields.io/badge/FriendSDK-v0.1.4-ff2bd6?logo=github&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19.2.8-00eaff?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6.0.3-3178c6?logo=typescript&logoColor=white" />
  <img alt="Renderer" src="https://img.shields.io/badge/renderer-SVG-ccff00" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-00eaff" />
  <img alt="Hosting" src="https://img.shields.io/badge/hosting-GitHub%20Pages-0a0022?logo=github&logoColor=white" />
  <img alt="Category" src="https://img.shields.io/badge/category-Character%20Spotlight-ff2bd6" />
</p>

Cyber archery minigame for the Rare Friends Vibeathon. The selected Generations NFT is the archer; RF is a simulated score label.

- **Category:** Character Spotlight
- **Stack:** React, TypeScript, FriendSDK v0.1.4, SVG renderer, i18n (27 locales)
- **License:** MIT

## Quick start

Dependencies install from the v0.1.4 GitHub release tarball declared in package.json, so npm install needs outbound HTTPS access to github.com.

    npm install
    npm run dev          # friendsdk dev ./games/rhrf-bullseye
    npm run build        # friendsdk build ./games/rhrf-bullseye
    npm run typecheck    # tsc --noEmit

## Layout

    games/rhrf-bullseye/   game source (index.tsx, engine/, style.css, game.json)
    artifacts/             reference screenshots at 360px and 960px

## Submission

Full rules, controls, simulated economy tables, checks and known issues live in submissions/rhrf-bullseye/README.md.

Playable preview: https://perpetuumcontinuum.github.io/RHRF_Bullseye/

Running the preview requires a wallet holding a Generations NFT (gen 1 or higher) on Robinhood mainnet, per the event rules.

## Quick local run

    git clone https://github.com/perpetuumcontinuum/RHRF_Bullseye.git
    cd RHRF_Bullseye
    npm install
    npx friendsdk dev ./games/rhrf-bullseye

Open the printed local URL, normally http://localhost:4173. Connect a browser wallet on Robinhood mainnet (chain 4663) holding a hardwired Rare Friends Generations NFT, generation 1 or higher, to pass the Friend-selection gate.

Validate the build:

    npm run build
    npx friendsdk check ./games/rhrf-bullseye

## Passive income

RHRF Bullseye is idle-friendly: you do not have to master the aim to progress. A satellite periodically drops a rare energy consumable into your inventory simply for being in the game. Accrual keeps running even while the game is paused, so a new player can park on the pause screen, let charges accumulate, then spend them in the shop. Energy stacks up to a cap of 100 and can be sold at the standard rates (quick sale 50%, offer 60%) to fund bows, outfits, amulets, arrows and armor. This lowers the skill floor and makes the first legendary run reachable without reflexes.

## License, but make it fun 🏹

This whole thing is **MIT**. No strings, no gatekeeping, no "ask first".

- 🎯 Fork it, remix it, ship it — go wild.
- 👽 Swap the archer for your own Rare Friend and call it yours.
- ⛓️ Wire it to a real economy someday; the simulated RF is just a label today, and the door is wide open.
- 🤘 Built with an AI coding agent Qwen 💜🤖❤️, by a human who kept the weird ideas. That's the spirit of the vibeathon.

Use it as much as you want, for as long as you want. If it makes someone's day brighter or their neon ridge a little more defendable — that's the whole point. 

Provided as is, no warranties, no promises, no refunds on a missed bullseye. The bow is yours now. 😎

### Economy update

- Bows: 4000 / 20000 / 100000 RF (rare/epic/legendary).
- Outfits: 4000 / 20000 / 100000 RF (rare/epic/legendary).
- Amulets: 4000 / 20000 / 100000 RF (rare/epic/legendary).
- Consumables: arrows 60/300/1500 RF, energy 300/800/1600 RF, armor 5/10/15 RF (rare/epic/legendary).
- Selling item: 50 percent of listed price.
- Offer sale: 60 percent of listed price.
- Current price tuning is modest; when stat persistence arrives, the economy will become deeper and new features will appear.
