# Rupok Originals

Series, episodes, comics, reading progress and purchases. All source, assets,
styles, build configuration and dependency lockfiles live in this repository.

Run `npm ci`, copy `.env.example` to `.env`, then `npm run dev`.
Development: http://localhost:5177. API proxy: http://localhost:5000;
set `API_URL` to override. Configure the three `VITE_*_URL` platform addresses.
Build with `npm run build`.

Originals uses the same Rupok account as Stories and Books. The server repo's
Docker Compose environment serves it at http://localhost:5203.

Comics and series passes use the shared Rupok Coins wallet. Top up from Account → Coins. Existing purchases remain valid; the direct-payment checkout is retired.
