const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Enable CORS for local development
app.use(cors());
app.use(express.json());

// Serve the frontend HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'gnec.html'));
});

// Endpoint to handle API requests
// Endpoint to handle API requests
app.post('/api/generate', async (req, res) => {
    const userInput = req.body.text?.trim();

    if (!userInput) {
        return res.status(400).json({ error: 'Text input is required.' });
    }

    let promptParts = [];

    try {
        if (userInput.startsWith('//summary')) {
            const content = userInput.replace('//summary', '').trim();
            promptParts = [
                { text: "Summarize the following legal document in no more than 5 professional lines:" },
                { text: content }
            ];

        } else if (userInput.startsWith('//find')) {
            const keyword = userInput.replace('//find', '').trim();
            const documentText = findDocumentByKeyword(keyword); // You implement this
            if (!documentText) {
                return res.json({ candidates: [{ content: "No document found with that keyword." }] });
            }
            promptParts = [
                { text: `Summarize and describe the legal document related to "${keyword}" in 5 lines:` },
                { text: documentText }
            ];

        } else if (userInput.startsWith('//casepredict')) {
            const caseDescription = userInput.replace('//casepredict', '').trim();
            promptParts = [
                { text: "Given the following scenario, predict the possible legal outcome in 5 professional lines:" },
                { text: caseDescription }
            ];

        } else if (userInput.startsWith('//draft')) {
            const draftInput = userInput.replace('//draft', '').trim();
            promptParts = [
                { text: "Draft a short legal statement or notice (max 5 lines) for the following case:" },
                { text: draftInput }
            ];

        } else {
            // Default behavior – normal legal Q&A
            promptParts = [
                { text: "You are a legal assistant helping women with gender discrimination issues. Respond professionally in no more than 5 lines." },
                { text: userInput }
            ];
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    { parts: promptParts }
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API Error: ${errorText}`);
            throw new Error(`Gemini API failed. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Gemini API Response:', data);
        res.json(data);

    } catch (error) {
        console.error(`Server Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});