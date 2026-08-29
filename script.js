// Grab the elements we need from the page
const settingsBtn = document.getElementById("settings-btn");
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

// pdf.js needs this to process files in the background
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Keep track of the current notes so the chat feature can refer back to them
let currentNotesText = "";

// Hide the key banner once the user types something into the key field
apiKeyInput.addEventListener("input", function() {
  if (apiKeyInput.value.trim() !== "") {
    keyBanner.classList.add("hidden");
  } else {
    keyBanner.classList.remove("hidden");
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
    instructions += "Create 8 to 12 flashcards covering distinct concepts. ";
    formatFields.push("\"flashcards\": [{\"question\": \"...\", \"answer\": \"...\"}]");
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

// Build one flip-card per flashcard and add it to the page
function renderFlashcards(cards) {
  output.innerHTML = "";
  emptyState.classList.add("hidden");

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
    back.textContent = card.answer;

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
