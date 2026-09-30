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
- **Stack:** React, TypeScript, FriendSDK v0.1.4, SVG renderer
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

