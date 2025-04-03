const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("your_actual_api_key_here");

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log(models);
    } catch (error) {
        console.error("Error fetching model list:", error);
    }
}
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

listModels();
