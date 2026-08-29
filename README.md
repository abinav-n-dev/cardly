# Cardly

An AI-powered study tool that turns your notes into summaries, testable flashcards, and answers.

## Overview

Cardly turns passive note-reading into active studying. Upload your lecture notes — typed or as a PDF — and instantly get a summary, flip-flashcards with source citations, a scored quiz to test yourself, and an AI chat assistant grounded in your own notes for clearing doubts.

Unlike using a general-purpose AI chatbot directly, Cardly automates the entire study workflow: extracting text from PDFs, structuring output into reviewable flashcards, citing sources for trust, scoring your recall, and remembering your study history — all in one purpose-built tool.

## Features

- **PDF upload** — automatically extracts text from an uploaded PDF, no manual copy-pasting
- **AI summary** — a concise, plain-language overview of your notes
- **Flip flashcards** — question on the front, answer on the back, with a source citation showing exactly where each answer came from in your notes
- **Custom output** — choose Summary only, Flashcards only, or both before generating
- **Quiz mode** — turns your flashcards into a real multiple-choice test with instant, objective scoring
- **Ask a doubt** — a floating AI chat assistant that answers questions using only your notes as context, not generic knowledge
- **Session history** — every generated session is saved to a cloud database and can be revisited anytime
- **Usage stats** — track total study sessions and flashcards generated over time
- **Dark mode** — toggle between light and dark themes, remembered across visits

## Tech Stack

- **Frontend** — plain HTML, CSS, and JavaScript. No framework, no build step.
- **AI** — [Google Gemini API](https://ai.google.dev/), used for summaries, flashcard generation, source citations, and the doubt-clearing chat
- **Database** — [Firebase Firestore](https://firebase.google.com/docs/firestore), a NoSQL, document-based cloud database
- **PDF parsing** — [pdf.js](https://mozilla.github.io/pdf.js/), extracts text from uploaded PDFs entirely in the browser

## Architecture

Cardly uses a Backend-as-a-Service architecture. There is no custom backend server — the browser communicates directly with two external services: Gemini's API for all AI generation, and Firestore for storing and retrieving study sessions. This design kept development focused on the AI integration and user experience rather than building and hosting a custom server.

## Getting Started

1. Clone this repository
2. Open `index.html` in any modern browser — no installation or build step required
3. Click Settings and paste in your own free Gemini API key ([get one here](https://aistudio.google.com/apikey))
4. Paste your notes or upload a PDF, choose what to generate, and click Generate

Some features require the page to be served over `http://` or `https://` rather than opened as a raw local file. For local testing:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Project Structure

```
cardly/
├── index.html      page structure and Firebase setup
├── style.css       all styling, including dark mode
└── script.js       all application logic
```

## Known Limitations

Built under hackathon time constraints — these are known, honest gaps:

- No per-user privacy — session history is currently shared across all users, since authentication is not active
- No error handling for malformed AI responses — a bad response can fail silently
- No duplicate-submission protection — rapid clicking of Generate can fire overlapping requests
- Subject to the Gemini API free-tier rate limits

## Roadmap

- Restore Google Sign-In with per-user session privacy (built and tested, rolled back for demo stability)
- Add robust error handling and user-facing error messages
- Mastery tracking — mark flashcards easy or hard, resurface hard ones first
- Adjustable explanation difficulty (simple vs. detailed)

## License

Built for a hackathon, provided as-is for learning and demonstration purposes.
