# Job Scoring Rules

Edit this file to control how jobs are scored and filtered.
Restart the dev server after saving (`pnpm dev`).

Matching is case-insensitive and whole-word/whole-phrase — a pattern only
matches when it's not glued to other letters/numbers, so `java` matches
"Java Developer" but not "JavaScript". Avoid short common English words as
patterns (e.g. bare `go`) since they'll match ordinary sentences too — prefer
a more specific phrase (`go developer`) or a distinctive term (`golang`).

---

## Blocked Companies

Jobs from these companies are scored 0 and hidden by default, regardless of
role or keyword match. Matches against the job's company name field only.

- Jobgether
- Hire Feed
- Turing

---

## Elimination Rules

Jobs matching ANY of these patterns are scored 0 and hidden by default.
Matching checks the job title + description (not the company name — use
"Blocked Companies" above for that).
Add a new `- pattern` line whenever you want to block a category.

- c++
- c#
- java
- php
- .net developer
- golang
- golang developer
- go developer
- go engineer
- rust developer
- game developer
- game development
- unity engine
- unreal engine
- veri mühendisi
- veri analisti
- veri bilimci
- data engineer
- data scientist
- machine learning engineer
- ml engineer
- embedded systems
- embedded software
- firmware engineer
- devops engineer
- site reliability engineer
- sre engineer
- android developer
- ios developer
- mobile developer
- sales manager
- sales executive
- sales representative
- account executive
- account manager
- business development
- marketing manager
- marketing specialist
- recruiter
- talent acquisition
- hr manager
- human resources
- customer success
- customer support
- customer service

---

## Core Skills

Each matched skill adds **+2** to the score.
Use commas to list synonyms that count as the same skill (e.g. `node.js, nodejs, node js`).

- typescript
- javascript, js developer
- node.js, nodejs, node js
- react
- next.js, nextjs, next js
- nestjs, nest.js, nest js
- rest api, restful api, rest apis
- graphql
- postgresql, postgres
- redis

---

## Secondary Skills

Each matched skill adds **+1** to the score.

- react native
- redux
- tailwind
- mongodb
- docker
- aws, amazon web services
- lambda
- ci/cd, cicd, github actions

---

## Blockchain Skills

Only counted when the job is blockchain-related. Each match adds **+2**.

- solidity
- foundry
- hardhat
- web3
- smart contract
- viem
- wagmi
- the graph
