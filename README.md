# Sight Words

An installable, offline PWA of Anki-style flashcards for a beginning reader. It works on iPhone and iPad through **Add to Home Screen**. It follows a 16-week plan that blends the **Fry First 50** and **Dolch Pre-Primer** sight-word lists, with a CVC phonics focus each week.

## The plan

The two lists have **75** unique words: 15 on both lists, 35 Fry-only and 25 Dolch-only.

| Month | Weeks | Focus |
|---|---|---|
| August | 1–4 | The overlap words, colors and sizes · short A and short E |
| September | 5–8 | Connectors, action verbs, pronouns · short I, then decodable books |
| October | 9–12 | Question words, numbers, the hardest Fry words · short O and short U |
| November | 13–16 | No new words. Review, writing, comprehension · ch, sh, th |

The whole plan is in `public/deck.js`: each week's words, phonics words, sentences, review sets and activity tips.

## Features

- **Four card types:**
  - **Read it:** the parent grades the card Again, Good or Easy. A Hard button is optional.
  - **Find it:** the app says a word and he taps it from four choices. These cards grade themselves by speed, timed from when the word has been spoken: right within 3 seconds is Easy, within 8 seconds is Good, slower is Hard, and any wrong tap first is Again. Practice games aren't graded.
  - **Sound it out:** CVC words as letter tiles, with the vowels in red. He taps a tile to hear its sound.
  - **Sentences:** each one uses only words he can read by that week. The tests check this.
- **Scheduling:** an SM-2 scheduler like Anki's (`public/srs.js`, shared with [hk-chinese-srs](https://github.com/bthecorgi/hk-chinese-srs)). Learning steps are 1 minute and 10 minutes, then intervals grow in days. The study day rolls over at 04:00.
- **Weekly unlocking:** new words unlock by plan week, counted from the start date. You can jump ahead or go back from the Plan tab or Settings. New words alternate abstract (Fry) and concrete (Dolch), as the plan suggests. The first time a word appears, the app introduces it with a picture and an example sentence. A Find it card unlocks the day after its word has been learned.
- **Daily limits:** sight words, phonics words and sentences each have a daily limit (3 / 2 / 1 by default). There is also a cap on reviews and a reminder after 15 minutes, so sessions stay around 15–20 minutes.
- **Practice games:** tricky words, this week's words, the Find-it game, and each review week's set. These drills don't change the schedule.
- **For a young child:**
  - He earns a star for every card.
  - A streak counts the days in a row he practises.
  - A word garden shows each word growing: 🌱 → 🌷 → 🌻.
  - Words are shown in Andika, a font designed for beginning readers, with single-storey *a* and *g* (SIL OFL, in `public/fonts/`).
- **Voice:** every word, sentence and letter sound is a recording in `public/audio/`, made with the open-source [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) voice (Apache-2.0). Recordings replaced the device voice because speech synthesis went silent in iOS 27 home-screen apps. Anything without a recording falls back to the device voice. After adding words or sentences, run `scripts/make-audio.py`; its setup is in the file. `npm test` fails if a recording is missing.
- **Profiles:** each child gets their own profile.
- **Storage:** progress stays on the device in `localStorage`. You can export and import a JSON backup.

The letter sounds are generated from phonetic spellings ("kuh", "sss"). If one sounds wrong, say the sound for him yourself.

## Run locally

```sh
npm run serve   # then open http://localhost:8080
npm test        # word lists, decodable sentences, queue and scheduler tests
```

## Install on iPhone

`.github/workflows/pages.yml` deploys `public/` to GitHub Pages on every push to `main`. To turn this on, go to **Settings → Pages → Source: GitHub Actions** in the repo; you only need to do this once. The app is then at **https://bthecorgi.github.io/sight-words/**. Open that URL in Safari, tap **Share → Add to Home Screen**, and launch the app from the home screen icon.

After changing anything in `public/`, bump `VERSION` in `public/sw.js` so installed apps pick up the update.
