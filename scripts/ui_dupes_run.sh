#!/usr/bin/env bash
set -u
PORT=4173; CDP=9222; LOG=ui_dupes_final.txt
: > "$LOG"
python3 -m http.server $PORT --directory games/rhrf-bullseye/.friendsdk >/tmp/srv.log 2>&1 & SRV=$!
pkill -f brave 2>/dev/null; sleep 2
brave --profile-directory="Profile 1" --remote-debugging-port=$CDP >/tmp/brave.log 2>&1 & BRV=$!
trap 'kill $SRV 2>/dev/null; pkill -f brave 2>/dev/null' EXIT INT TERM
for i in $(seq 1 40); do curl -s 127.0.0.1:$CDP/json/version >/dev/null 2>&1 && break; sleep .5; done
node scripts/ui_dupes_final.mjs 2>&1 | tee "$LOG"
echo "лог: $PWD/$LOG"
