"use server"

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function generateResponse(
    prompt: string,
    context?: string,
    modelName: string = "gemini-3-flash-preview",
    systemInstruction?: string
) {
    try {
        // Fallback to 1.5 flash if the specific 2.0 model isn't available or if user prefers
        // For now we use the requested model name
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction
        });

        let fullPrompt = prompt;
        if (context) {
            fullPrompt = `Context: ${context}\n\nUser: ${prompt}`;
        }

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, I encountered an error while processing your request. Please check your API key and try again.";
    }
}
