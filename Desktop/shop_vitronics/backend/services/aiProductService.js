const { GENERATE_PROMPT, EDIT_PROMPT } = require('../config/aiPrompts');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq free models
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'; // vision (image support)
const TEXT_MODEL   = 'llama-3.1-8b-instant';                      // text only (edit)



function parseAIResponse(rawText) {
    const clean = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
}

async function generateFromImage(imageBuffer, mimeType) {
    const base64Image = imageBuffer.toString('base64');

    const result = await groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: { url: `data:${mimeType};base64,${base64Image}` }
                    },
                    {
                        type: 'text',
                        text: GENERATE_PROMPT
                    }
                ]
            }
        ],
        max_tokens: 1024
    });

    const rawText = result.choices[0].message.content;
    return parseAIResponse(rawText);
}

async function editDescription(currentContent, editInstruction) {
    const result = await groq.chat.completions.create({
        model: TEXT_MODEL,
        messages: [
            {
                role: 'system',
                content: EDIT_PROMPT
            },
            {
                role: 'user',
                content: `Current content:\n${JSON.stringify(currentContent, null, 2)}\n\nEdit instruction: ${editInstruction.trim()}`
            }
        ],
        max_tokens: 1024
    });

    const rawText = result.choices[0].message.content;
    return parseAIResponse(rawText);
}

module.exports = { generateFromImage, editDescription };
