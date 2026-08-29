# Cardly

Cardly turns your lecture notes into a summary, flashcards, and a chat assistant you can ask doubts to — all powered by Google's Gemini AI.

## Features

- **Paste notes or upload a PDF** — PDF text is automatically extracted using pdf.js, no manual copy-pasting needed
- **Choose your output** — pick Summary, Flashcards, or both, before generating
- **AI-generated summary** — a short, plain-language overview of your notes
- **Flip flashcards** — question on the front, answer on the back, click to flip
- **Ask a doubt** — a floating chat widget lets you ask follow-up questions about your notes; answers are grounded in the actual notes you provided, not general knowledge

## Tech stack

- **HTML, CSS, JavaScript** — no framework, no build step
- **[Gemini API](https://ai.google.dev/)** — generates the summary, flashcards, and chat answers
- **[pdf.js](https://mozilla.github.io/pdf.js/)** — extracts text from uploaded PDF files, loaded via CDN

No backend server — the browser calls Gemini's API directly.

## Running it locally

1. Clone or download this repository
2. Open `index.html` in any modern browser — no installation or build step required
3. Click **⚙ Settings** and paste in your own Gemini API key ([get a free one here](https://aistudio.google.com/apikey))
4. Paste your notes or upload a PDF, choose Summary and/or Flashcards, and click **Generate**

## Why no API key is included

Each user needs their own Gemini API key — this keeps usage tied to your own free-tier quota and avoids exposing a shared key publicly. The key is only used client-side, at the moment you click Generate or Ask; it isn't stored or sent anywhere else.

## How it works, briefly

1. Notes (typed or PDF-extracted) are sent to Gemini along with instructions to return a summary and/or flashcards as structured JSON, based on what's selected
2. The response is parsed and rendered — flashcards become individual flip-cards, built dynamically since the number and content vary every time
3. Questions asked in the chat widget are sent to Gemini together with the original notes as context, so answers stay grounded in what you're actually studying

## Known limitations

- No error handling yet if the AI returns malformed data
- API key is entered per session, not securely stored — not intended for production use as-is
- No persistence — flashcard sets aren't saved between sessions
- Subject to the Gemini free-tier rate limits
