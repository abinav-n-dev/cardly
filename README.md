# 🃏 Cardly

**Turn your notes into summaries, flashcards, and answers — powered by AI.**

Cardly takes your lecture notes (typed or uploaded as a PDF) and instantly generates a summary, a set of flip-flashcards, and a chat assistant you can ask follow-up questions to — all grounded in your actual notes, not generic AI knowledge.

---

## ✨ Features

- 📄 **PDF upload** — automatically extracts text from an uploaded PDF, no manual copy-pasting
- 📝 **AI-generated summary** — a short, clear overview of your notes
- 🃏 **Flip flashcards** — question on the front, answer on the back, with a **source citation** showing exactly which part of your notes each answer came from
- ✅ **Pick your output** — choose Summary, Flashcards, or both before generating
- 🧠 **Quiz Mode** — turn your flashcards into a real multiple-choice self-test with instant scoring
- 💬 **Ask a doubt** — a floating chat assistant that answers questions using only your notes as context
- 🗂️ **Session history** — every generated session is saved to a cloud database and can be revisited anytime
- 📊 **Usage stats** — see your total sessions and flashcards generated over time
- 🌙 **Dark mode** — toggle between light and dark themes, remembered across visits

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Plain HTML, CSS, JavaScript — no framework, no build step |
| AI | [Google Gemini API](https://ai.google.dev/) |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) (NoSQL, cloud-hosted) |
| PDF parsing | [pdf.js](https://mozilla.github.io/pdf.js/) |

Cardly has **no traditional backend server** — the browser talks directly to Gemini's API and Firestore, both of which handle the "backend" role (a Backend-as-a-Service architecture).

---

## 🚀 Getting Started

1. Clone this repository
2. Open `index.html` in any modern browser — no installation, no build step
3. Click **⚙ Settings** and paste in your own free Gemini API key ([get one here](https://aistudio.google.com/apikey))
4. Paste your notes or upload a PDF, choose what you want generated, and hit **✨ Generate**

> **Note:** Google Sign-In popups require the page be served over `http://` or `https://`, not opened as a raw local file. For local testing with auth-dependent features, run a simple local server:
> ```
> python3 -m http.server 8000
> ```
> then visit `http://localhost:8000`.

---

## 📁 Project Structure

```
cardly/
├── index.html      # Page structure + Firebase setup
├── style.css       # All styling, including dark mode
└── script.js       # All application logic
```

---

## 🗺️ Roadmap / Known Limitations

This project is still actively being developed. Current known gaps:

- **No per-user privacy** — session history is currently shared across everyone using the app (no authentication is active right now)
- **No error handling** for malformed AI responses — a bad response can silently fail
- **No duplicate-submission protection** — clicking Generate rapidly can fire multiple overlapping requests
- Subject to the Gemini API's free-tier rate limits

Planned improvements:
- [ ] Restore Google Sign-In with per-user session privacy
- [ ] Add proper error handling and user-facing error messages
- [ ] Mastery tracking (mark flashcards easy/hard, resurface hard ones first)
- [ ] Adjustable explanation difficulty (simple vs detailed)

---

## 🙌 Contributing

This is a hackathon project under active development — feedback and suggestions are welcome. Feel free to open an issue or reach out.

---

## 📄 License

This project was built for a hackathon and is provided as-is for learning and demonstration purposes.
