# RHRF Bullseye

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
