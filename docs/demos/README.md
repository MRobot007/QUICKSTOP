# Demonstration assets

Screenshots of the running application, and the scripts that reproduce them.

| Item | Status |
| --- | --- |
| [screenshot-index.md](screenshot-index.md) | 28 images — 14 desktop, 14 mobile |
| [demo-scripts.md](demo-scripts.md) | Narration and click-path for recordings |
| `screenshots/desktop/` | 1680x1050 PNG |
| `screenshots/mobile/` | 780x1688 PNG, genuine 390x844 phone viewport at 2x |
| [video-index.md](video-index.md) | 4 narrated recordings, 44–60s each |
| `videos/` | MP4, H.264 + AAC, 1280x800 |

## Everything here is synthetic

Images were captured against a disposable store seeded by
`scripts/seed-demo-data.mjs`. The people are invented; the phone numbers come
from the +1-202-555-0100 to 0199 block reserved for fiction. No real customer,
staff or trading record appears in any asset, and no production database was
opened during capture.

## Reproducing the screenshots

```bash
# 1. A disposable store, served on the port the app expects
DB_FILE=/tmp/demo.sqlite SEED_PASSWORD=<choose-one> \
  php -S 127.0.0.1:8080 -t . api/router.php &

# 2. Synthetic data: GST rates, six customers, five sales
DEMO_PASSWORD=<same-one> node scripts/seed-demo-data.mjs

# 3. The application
npm run dev -- -p 3001

# 4. Capture
DEMO_PASSWORD=<same-one> node scripts/capture-screenshots.mjs
```

The capture script drives an installed Chrome or Edge over the DevTools
protocol using Node's built-in WebSocket — no browser automation package is
added to the project. It verifies every saved PNG by reading its header and
exits non-zero if any image misses its size target.

Credentials are read from the environment. They are never written into the
scripts, the images or this repository.

## Recording the videos

```bash
DEMO_PASSWORD=<pw> node scripts/record-demo.mjs
```

`scripts/record-demo.mjs` drives the same headless Chrome over the DevTools
protocol, captures its screencast frames and pipes them to ffmpeg. Because
screencast frames only arrive when the page changes, the last frame is
re-emitted on a fixed cadence — otherwise a still moment would record nothing.

Each line is spoken by a neural text-to-speech voice and the same text appears
as a caption, so the videos work with the sound off. The narration is
synthesised and measured first, then the picture is held to match it.

Output is MP4 (H.264 + AAC). See [video-index.md](video-index.md) for the
requirements and the shot list of each recording.
