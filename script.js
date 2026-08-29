// Grab the elements we need from the page
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const apiKeyInput = document.getElementById("api-key-input");
const notesInput = document.getElementById("notes-input");
const pdfInput = document.getElementById("pdf-input");
const generateBtn = document.getElementById("generate-btn");
const statusMsg = document.getElementById("status-msg");
const output = document.getElementById("output");
const emptyState = document.getElementById("empty-state");

// pdf.js needs this to process files in the background
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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

// Send the notes to Gemini and get back flashcards
async function generateFlashcards(notesText, apiKey) {
  const prompt = "Create 8 to 12 flashcards from these notes, covering as many distinct concepts as reasonably fit. Reply with ONLY a JSON array in this exact format: [{\"question\": \"...\", \"answer\": \"...\"}]. Notes: " + notesText;

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

  return JSON.parse(cleanText);
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

// Generate button — ties everything together
generateBtn.addEventListener("click", async function() {
  const notesText = notesInput.value;
  const apiKey = apiKeyInput.value;

  statusMsg.textContent = "Generating...";
  output.innerHTML = "";

  const cards = await generateFlashcards(notesText, apiKey);

  statusMsg.textContent = "";
  renderFlashcards(cards);
});
