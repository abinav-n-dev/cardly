// Grab the elements we need from the page
const settingsBtn = document.getElementById("settings-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const settingsPanel = document.getElementById("settings-panel");
const apiKeyInput = document.getElementById("api-key-input");
const notesInput = document.getElementById("notes-input");
const pdfInput = document.getElementById("pdf-input");
const optSummary = document.getElementById("opt-summary");
const optFlashcards = document.getElementById("opt-flashcards");
const generateBtn = document.getElementById("generate-btn");
const statusMsg = document.getElementById("status-msg");
const output = document.getElementById("output");
const emptyState = document.getElementById("empty-state");
const keyBanner = document.querySelector(".key-banner");
const summarySection = document.getElementById("summary-section");
const summaryText = document.getElementById("summary-text");

const chatWidget = document.getElementById("chat-widget");
const chatToggleBtn = document.getElementById("chat-toggle-btn");
const chatPanel = document.getElementById("chat-panel");
const chatCloseBtn = document.getElementById("chat-close-btn");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSendBtn = document.getElementById("chat-send-btn");
const historyList = document.getElementById("history-list");
const statsLine = document.getElementById("stats-line");

const quizBtn = document.getElementById("quiz-btn");
const quizSection = document.getElementById("quiz-section");
const quizProgress = document.getElementById("quiz-progress");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizNextBtn = document.getElementById("quiz-next-btn");
const quizResult = document.getElementById("quiz-result");
const quizScoreText = document.getElementById("quiz-score-text");
const quizRestartBtn = document.getElementById("quiz-restart-btn");

// pdf.js needs this to process files in the background
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Keep track of the current notes so the chat feature can refer back to them
let currentNotesText = "";

// Quiz Mode state
let currentFlashcards = []; // the flashcards available to quiz on
let quizIndex = 0;          // which question we're currently on
let quizScore = 0;          // how many marked correct so far

// Wait for Firebase to finish loading (from the module script in index.html),
// then load any past sessions right away
window.addEventListener("firebase-ready", function() {
  loadHistory();
  loadStats();
});

// Show or hide the key banner based on whether a key is currently present
function updateKeyBanner() {
  if (apiKeyInput.value.trim() !== "") {
    keyBanner.classList.add("hidden");
  } else {
    keyBanner.classList.remove("hidden");
  }
}

// Check immediately on page load (covers a pre-filled value="...")
updateKeyBanner();

// Also check every time the user types into the key field
apiKeyInput.addEventListener("input", updateKeyBanner);

// ---- Dark mode toggle ----

// If the user picked dark mode before, apply it right away on page load
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggleBtn.textContent = "☀️";
}

themeToggleBtn.addEventListener("click", function() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    themeToggleBtn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggleBtn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// Show/hide the API key panel
settingsBtn.addEventListener("click", function() {
  settingsPanel.classList.toggle("hidden");
});

// Extract text from a PDF file, page by page
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(function(item) { return item.str; }).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

// When a PDF is uploaded, extract its text into the notes box
pdfInput.addEventListener("change", async function() {
  const file = pdfInput.files[0];
  if (!file) return;

  statusMsg.textContent = "Reading PDF...";
  const text = await extractPdfText(file);
  notesInput.value = text;
  statusMsg.textContent = "PDF loaded. Click Generate.";
});

// Build the AI prompt based on which checkboxes are ticked
function buildPrompt(notesText, wantSummary, wantFlashcards) {
  let instructions = "";
  let formatFields = [];

  if (wantSummary) {
    instructions += "Write a short 3-4 sentence summary. ";
    formatFields.push("\"summary\": \"...\"");
  }
  if (wantFlashcards) {
    instructions += "Create 8 to 12 flashcards covering distinct concepts. For each one, also include a short 'source' field quoting or referencing the exact part of the notes it came from. ";
    formatFields.push("\"flashcards\": [{\"question\": \"...\", \"answer\": \"...\", \"source\": \"...\"}]");
  }

  const format = "{" + formatFields.join(", ") + "}";

  return "From the following lecture notes, do this: " + instructions +
    "Reply with ONLY a JSON object in exactly this format: " + format + ". " +
    "Notes: " + notesText;
}

// Send the notes to Gemini and get back whatever was requested
async function generateContent(notesText, apiKey, wantSummary, wantFlashcards) {
  const prompt = buildPrompt(notesText, wantSummary, wantFlashcards);

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" + apiKey;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const replyText = data.candidates[0].content.parts[0].text;
  const cleanText = replyText.replace(/```json|```/g, "").trim();

  return JSON.parse(cleanText); // { summary?, flashcards? }
}

// Ask Gemini a follow-up question, using the notes as context
async function askDoubt(question, notesText, apiKey) {
  const prompt = "Using ONLY the following notes as context, answer the student's question " +
    "clearly and briefly. If the answer isn't in the notes, say so honestly.\n\n" +
    "Notes: " + notesText + "\n\nQuestion: " + question;

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" + apiKey;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Save a generated session (notes + summary + flashcards) to Firestore
async function saveSession(notesText, result) {
  const { collection, addDoc } = window.firestoreTools;

  await addDoc(collection(window.db, "sessions"), {
    notesPreview: notesText.slice(0, 100),
    summary: result.summary || null,
    flashcards: result.flashcards || null,
    createdAt: new Date().toISOString()
  });
}

// Load the 5 most recent sessions from Firestore and display them
async function loadHistory() {
  const { collection, getDocs, query, orderBy, limit } = window.firestoreTools;

  const historyQuery = query(
    collection(window.db, "sessions"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  const snapshot = await getDocs(historyQuery);
  historyList.innerHTML = "";

  if (snapshot.empty) {
    historyList.innerHTML = "<p class=\"history-empty\">No saved sessions yet.</p>";
    return;
  }

  snapshot.forEach(function(doc) {
    const session = doc.data();
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = session.notesPreview + "...";

    item.addEventListener("click", function() {
      currentNotesText = session.notesPreview;
      if (session.summary) renderSummary(session.summary);
      if (session.flashcards) renderFlashcards(session.flashcards);
      chatWidget.classList.remove("hidden");
    });

    historyList.appendChild(item);
  });
}

// Count total sessions and total flashcards ever saved, and show them
async function loadStats() {
  const { collection, getDocs } = window.firestoreTools;

  const snapshot = await getDocs(collection(window.db, "sessions"));

  if (snapshot.empty) {
    statsLine.classList.add("hidden");
    return;
  }

  let totalSessions = 0;
  let totalFlashcards = 0;

  snapshot.forEach(function(doc) {
    const session = doc.data();
    totalSessions++;
    if (session.flashcards) {
      totalFlashcards += session.flashcards.length;
    }
  });

  statsLine.textContent = "📊 " + totalSessions + " study sessions, " + totalFlashcards + " flashcards generated so far";
  statsLine.classList.remove("hidden");
}

// Build one flip-card per flashcard and add it to the page
function renderFlashcards(cards) {
  output.innerHTML = "";
  emptyState.classList.add("hidden");

  // Keep a copy for Quiz Mode to use later
  currentFlashcards = cards;
  quizBtn.classList.remove("hidden");
  quizSection.classList.add("hidden"); // hide any quiz in progress from a previous set

  cards.forEach(function(card) {
    const cardEl = document.createElement("div");
    cardEl.className = "card";

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const front = document.createElement("div");
    front.className = "card-face card-front";
    front.textContent = card.question;

    const back = document.createElement("div");
    back.className = "card-face card-back";

    const answerText = document.createElement("div");
    answerText.textContent = card.answer;
    back.appendChild(answerText);

    if (card.source) {
      const sourceCaption = document.createElement("div");
      sourceCaption.className = "card-source";
      sourceCaption.textContent = "From: " + card.source;
      back.appendChild(sourceCaption);
    }

    inner.appendChild(front);
    inner.appendChild(back);
    cardEl.appendChild(inner);

    cardEl.addEventListener("click", function() {
      cardEl.classList.toggle("flipped");
    });

    output.appendChild(cardEl);
  });
}

// Show the AI-generated summary
function renderSummary(summary) {
  summaryText.textContent = summary;
  summarySection.classList.remove("hidden");
}

// Add one message bubble to the doubt-chat window
function addChatMessage(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = sender === "user" ? "chat-bubble chat-user" : "chat-bubble chat-bot";
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate button — ties everything together
generateBtn.addEventListener("click", async function() {
  const notesText = notesInput.value;
  const apiKey = apiKeyInput.value;
  const wantSummary = optSummary.checked;
  const wantFlashcards = optFlashcards.checked;

  if (!wantSummary && !wantFlashcards) {
    statusMsg.textContent = "Pick at least one: Summary or Flashcards.";
    return;
  }

  statusMsg.textContent = "Generating...";
  output.innerHTML = "";
  summarySection.classList.add("hidden");

  const result = await generateContent(notesText, apiKey, wantSummary, wantFlashcards);

  statusMsg.textContent = "";
  currentNotesText = notesText;

  if (wantSummary) renderSummary(result.summary);
  if (wantFlashcards) renderFlashcards(result.flashcards);

  chatWidget.classList.remove("hidden");

  await saveSession(notesText, result);
  await loadHistory();
  await loadStats();
});

// Floating chat widget — open/close
chatToggleBtn.addEventListener("click", function() {
  chatPanel.classList.toggle("hidden");
});

chatCloseBtn.addEventListener("click", function() {
  chatPanel.classList.add("hidden");
});

// Doubt-chat send button
chatSendBtn.addEventListener("click", async function() {
  const question = chatInput.value.trim();
  const apiKey = apiKeyInput.value;
  if (question === "") return;

  addChatMessage(question, "user");
  chatInput.value = "";

  const answer = await askDoubt(question, currentNotesText, apiKey);
  addChatMessage(answer, "bot");
});

// ---- Quiz Mode (multiple choice) ----

// Shuffle an array into random order (Fisher-Yates shuffle)
function shuffleArray(array) {
  const copy = array.slice(); // work on a copy, don't change the original
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

// Build 4 answer options for a question: the correct one, plus up to 3
// wrong ones borrowed from OTHER flashcards' answers in this same set
function buildQuizOptions(correctCard) {
  const otherAnswers = currentFlashcards
    .filter(function(card) { return card !== correctCard; })
    .map(function(card) { return card.answer; });

  const wrongOptions = shuffleArray(otherAnswers).slice(0, 3);
  const allOptions = wrongOptions.concat([correctCard.answer]);

  return shuffleArray(allOptions);
}

// Show one question with 4 clickable options
function showQuizQuestion() {
  const card = currentFlashcards[quizIndex];
  const options = buildQuizOptions(card);

  quizProgress.textContent = "Question " + (quizIndex + 1) + " of " + currentFlashcards.length;
  quizQuestion.textContent = card.question;
  quizOptions.innerHTML = "";
  quizNextBtn.classList.add("hidden");
  quizResult.classList.add("hidden");

  options.forEach(function(optionText) {
    const optionBtn = document.createElement("button");
    optionBtn.className = "quiz-option-btn";
    optionBtn.textContent = optionText;

    optionBtn.addEventListener("click", function() {
      handleQuizAnswer(optionBtn, optionText, card.answer);
    });

    quizOptions.appendChild(optionBtn);
  });
}

// Called when the user picks an option — grades it and shows feedback
function handleQuizAnswer(clickedBtn, selectedText, correctText) {
  // Disable every option so the user can't click again after answering
  const allButtons = quizOptions.querySelectorAll(".quiz-option-btn");
  allButtons.forEach(function(btn) { btn.disabled = true; });

  if (selectedText === correctText) {
    clickedBtn.classList.add("quiz-option-correct");
    quizScore++;
  } else {
    clickedBtn.classList.add("quiz-option-wrong");
    // Also highlight which one WAS correct, for learning purposes
    allButtons.forEach(function(btn) {
      if (btn.textContent === correctText) {
        btn.classList.add("quiz-option-correct");
      }
    });
  }

  quizNextBtn.classList.remove("hidden");
}

// Move to the next question, or show the final score if we're done
function nextQuizQuestion() {
  quizIndex++;

  if (quizIndex >= currentFlashcards.length) {
    quizQuestion.textContent = "";
    quizOptions.innerHTML = "";
    quizNextBtn.classList.add("hidden");
    quizProgress.textContent = "";

    quizScoreText.textContent = "You got " + quizScore + " out of " + currentFlashcards.length + " right!";
    quizResult.classList.remove("hidden");
    return;
  }

  showQuizQuestion();
}

// Start (or restart) the quiz from the beginning
function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizSection.classList.remove("hidden");
  showQuizQuestion();
}

quizBtn.addEventListener("click", startQuiz);
quizRestartBtn.addEventListener("click", startQuiz);
quizNextBtn.addEventListener("click", nextQuizQuestion);
