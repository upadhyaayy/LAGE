const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/generate', async (req, res) => {
    const userInput = req.body.text?.trim();

    if (!userInput) {
        return res.status(400).json({ error: 'Text input is required.' });
    }

    let promptParts = [];

    try {
        if (userInput.startsWith('/summary')) { 
            const content = userInput.replace('/summary', '').trim();
            promptParts = [
                { text: "Summarize the following legal document in no more than 6 professional lines:" },
                { text: content }
            ];

        } else if (userInput.startsWith('/find')) { 
            const query = userInput.replace('/find', '').trim();

            if (!query) {
                return res.status(400).json({ error: 'Search query is required.' });
            }

            try {
                // Use a search API to fetch relevant links
                const searchApiUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.SEARCH_API_KEY}&cx=${process.env.SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)} legal document`;

                const searchResponse = await fetch(searchApiUrl);
                if (!searchResponse.ok) {
                    const errorText = await searchResponse.text();
                    console.error(`Search API Error: ${errorText}`);
                    throw new Error(`Search API failed. Status: ${searchResponse.status}`);
                }

                const searchData = await searchResponse.json();
                const links = searchData.items?.map(item => ({
                    title: item.title,
                    link: item.link,
                    snippet: item.snippet,
                })) || [];

                // Return the links to the client
                return res.json({ links });
            } catch (error) {
                console.error(`Error in /find: ${error.message}`);
                return res.status(500).json({ error: 'Failed to fetch search results.' });
            }
            
        } else if (userInput.startsWith('/casepredict')) {
            const caseDescription = userInput.replace('/casepredict', '').trim();
            promptParts = [
                { text: "Given the following scenario, predict the possible legal outcome in maximum 7 professional lines:" },
                { text: caseDescription }
            ];

        } else if (userInput.startsWith('/draft')) {
            const draftInput = userInput.replace('/draft', '').trim();
            promptParts = [
                { text: "Draft a formal complaint letter based on the following details:" },
                { text: draftInput }
            ];

        } else {
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
