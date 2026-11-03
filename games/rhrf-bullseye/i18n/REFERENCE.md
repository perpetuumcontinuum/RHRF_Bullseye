# RHRF BULLSEYE — i18n reference (источник истины для 27 языков)

## Объём на один язык
- **85 UI-ключей**: 40 `guide.*` + 38 `mission.*` + 4 extra (`ui.depart.fallback`, `arc.title.line/exit/credit`) + 3 `ui.dialog.*`
- **16 сцен аркады** в `engine/dialogs/<lang>.ts` (97 реплик по ru-эталону)
- **11 badge-синхрон**: код (`achievements.tsx`) читает `badge.cyber_20…_101` + `badge.kind.anomaly`; в 24 локалях лежат старые id `_3…_11` — привести к новым
- **`names.ts`**: блок `<lang>` с именами говорящих + народы по сценам

## Порядок задач (1 язык = 1 задача = UI + аркада + names)
<!-- uk = ISO 639-1 Ukrainian; британский en-GB -> en (покрыт) -->
en (pivot, с ru) → uk, cs, pl (с ru) → es, pt, fr, it, de, nl, sv, da, no, fi, hu, ro, el, tr, ar, hi, id, vi, th, ja, ko, zh (с en)

## Глоссарий (канон, не переводить вольно)
| Термин | Значение |
|---|---|
| ETHER | имя собственное, латиница, капсом, НЕ «Эфириум/Эфир» |
| Peg / Mint / Hash | позывные rep, латиница во всех локалях |
| peg / depeg / repeg | якорь привязки стейблкоина; «держим peg» = hold the peg |
| floor / floor price | нижняя цена коллекции |
| soulbound | неизвлекаемый актив |
| provenance | история владения |
| allowlist | белый список минта |
| rug pull, gas war, reorg, orphan, 51%-атака | крипто-жаргон, латиница/кальки по языку |
| RF | Rare Force, внутриигровая валюта, без реальной ценности |
| Кибер-плато | Cyber Plateau |
| Источник | the Source |
| Камень / булыжник | the Stone |
| Bullseye | яблочко/мишень, имя-обращение героя |
| RWA | название планеты, латиница |
| Костюм (не «наряд») | outfit, `guide.tbl.outfit` + `mission.outfit.*` |

## Народы (crowd по сценам, `names.ts`)
| Сцена | ru | en |
|---|---|---|
| stableDeparture | ПРИВЯЗАНЫЕ | PEGGED |
| nftDeparture | РЕДКИЕ | RARE |
| bitcoinDeparture | МАЙНЯЩИЕ | MINERS |
| arcFinal | КИБЕРЫ | CYBERS |
| иначе (фолбэк) | ЖИТЕЛИ | CROWD |

## Кто говорит (SceneWho)
`rep` (позывной планеты) · `cyber` (герой) · `crowd` (народ) · `ether` · `elder` (старейшина, arcFinal) · `cyber_npc`

## 16 ключей сцен (types.ts)
arcIntro · stableArrival/Thanks/Departure/Shield · nftArrival/Thanks/Departure/Shield · bitcoinArrival/Thanks/Departure/Shield · rwaIntro · rwaFarewell · arcFinal

## Правила
- `who` и порядок реплик = структура, не трогать; переводится только `text`
- `action: "armWave"` (arcIntro, реплика 6) и `action: "giveBow"` (arcIntro, реплика 25) — не двигать
- pun-notes (`// pun:`) оставлять в коде для переводчиков ниже по цепочке
- en = pivot: 23 локали переводят с en, uk/cs/pl — с ru
- `FALLBACK = "en"`: отсутствие ключа → английское значение, сырой ключ не показывается

## Текущее покрытие

<!-- COVERAGE:BEGIN -->
| Язык | Аркада (16 сцен) | UI | Ключей UI | Источник |
|---|---|---|---|---|
| ru | DONE 97/97 | DONE | 296 | эталон |
| en | DONE 97/97 | DONE | 296 | ru |
| cs | DONE 97/97 | DONE | 296 | ru |
| uk | DONE 97/97 | DONE | 296 | ru |
| pl | DONE 97/97 | DONE | 296 | ru |
| es | DONE 97/97 | DONE | 296 | en |
| pt | DONE 97/97 | DONE | 296 | en |
| fr | DONE 97/97 | DONE | 296 | en |
| it | DONE 97/97 | DONE | 296 | en |
| ar | DONE 97/97 | DONE | 296 | en |
| da | DONE 97/97 | DONE | 296 | en |
| de | DONE 97/97 | DONE | 296 | en |
| el | DONE 97/97 | DONE | 296 | en |
| fi | DONE 97/97 | DONE | 296 | en |
| hi | DONE 97/97 | DONE | 296 | en |
| hu | DONE 97/97 | DONE | 296 | en |
| id | DONE 97/97 | DONE | 296 | en |
| ja | DONE 97/97 | DONE | 296 | en |
| ko | DONE 97/97 | DONE | 296 | en |
| nl | DONE 97/97 | DONE | 296 | en |
| no | DONE 97/97 | DONE | 296 | en |
| ro | DONE 97/97 | DONE | 296 | en |
| sv | DONE 97/97 | DONE | 296 | en |
| th | DONE 97/97 | DONE | 296 | en |
| tr | DONE 97/97 | DONE | 296 | en |
| vi | DONE 97/97 | DONE | 296 | en |
| zh | DONE 97/97 | DONE | 296 | en |
<!-- COVERAGE:END -->
