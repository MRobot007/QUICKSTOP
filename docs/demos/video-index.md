# Video index

Four narrated recordings of the running application, captured against a
disposable store holding only synthetic data.

| File | Duration | Size | Spoken lines | Shows |
| --- | --- | --- | --- | --- |
| `videos/01-product-overview.mp4` | 0:60 | 1.4 MB | 9 | The till, then each back-office area in turn |
| `videos/02-primary-workflow.mp4` | 0:54 | 1.1 MB | 10 | A complete sale: items, ID check, payment, receipt itemising three tax bands |
| `videos/03-tax-automation.mp4` | 0:49 | 1.0 MB | 9 | Changing a division&rsquo;s tax rate and seeing it reach the next bill |
| `videos/04-business-value.mp4` | 0:44 | 1.0 MB | 7 | Shift float, drawer position, audit trail |

All four fall inside the 30&ndash;90 second target.

## Format

**MP4 &mdash; H.264 video, AAC audio, 1280x800, 12 fps.** Plays everywhere:
browsers, PowerPoint, Keynote, phones, and as an email attachment.

Narration is spoken by a neural text-to-speech voice (`en-US-AriaNeural`),
slightly under default speed. The same text appears as an on-screen caption, so
the videos are usable with the sound off.

## How the timing works

The narration is synthesised **before** the screen is recorded, and each clip is
measured. A caption is then held on screen for at least as long as its line
takes to say, and the audio is placed at a cue taken from the video frame
counter rather than from wall clock. Voice and picture therefore line up by
construction instead of by adjustment.

## Reproducing

```bash
DB_FILE=/tmp/demo.sqlite SEED_PASSWORD=<pw> php -S 127.0.0.1:8080 -t . api/router.php &
DEMO_PASSWORD=<pw> node scripts/seed-demo-data.mjs
npm run dev -- -p 3001
DEMO_PASSWORD=<pw> node scripts/record-demo.mjs                      # all four
DEMO_PASSWORD=<pw> node scripts/record-demo.mjs 03-tax-automation    # just one
```

Start from a freshly seeded store. Recording changes data &mdash; video 03 edits a
tax rate, video 02 completes a sale &mdash; so a second run over the same store will
not match the narration.

Synthesised lines are cached on their text, so re-running only re-fetches speech
for lines that changed.

### Requirements

| Tool | Why | Note |
| --- | --- | --- |
| Chrome or Edge | Drives and captures the page | Already installed |
| ffmpeg with H.264 and AAC | Encodes and muxes | Installed via `winget install Gyan.FFmpeg`; remove with `winget uninstall Gyan.FFmpeg` |
| Python with `edge-tts` | Neural narration | Needs network while synthesising |

Override any of them with the `FFMPEG`, `FFPROBE`, `PYTHON`, `DEMO_VOICE` and
`DEMO_VOICE_RATE` environment variables.

## Verified on the captured set

- Every file carries both an H.264 video stream and an AAC audio stream, and
  each duration was read back from the file.
- Audio was level-checked, so none is silent.
- No password, token or credential appears in any frame.
- No client or product brand name appears; the receipt header reads the
  placeholder shop name.
- Every person, phone number and sale is fictional.
- Narration describes only what the software does. No figure is claimed for time
  saved, shrinkage or efficiency &mdash; none has been measured.
