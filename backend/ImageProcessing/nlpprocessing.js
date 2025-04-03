
const { extractTextFromFile } = require("./textextractor.js");
const { NlpManager } = require("@nlpjs/nlp");
const nlp = require("compromise");
const path = require("path");

// ✅ NLP Model Initialization
const initNLP = async () => {
    const manager = new NlpManager({ languages: ["en", "mr"] });

    // Add English intents
    manager.addDocument("en", "Owner Name", "owner_info");
    manager.addDocument("en", "Area", "land_info");
    manager.addDocument("en", "Village", "Village_info");
    manager.addDocument("en", "Crop Details", "Crop_info");
    manager.addDocument("en", "Survey No", "Survey_No_info");

    // Add Marathi intents
    manager.addDocument("mr", "भोगवटादाराचे नाव|मालकाचे नाव", "owner_info");
    manager.addDocument("mr", "क्षेत्र", "land_info");
    manager.addDocument("mr", "गाव|मौजे", "Village_info");
    manager.addDocument("mr", "तालुका|ता", "Taluka_info");
    manager.addDocument("mr", "जिल्हा|जि", "District_info");
    manager.addDocument("mr", "गट क्रमांक व उपविभाग", "Survey_No_info");
    await manager.train();
    return manager;
};


// ✅ NLP Processing Function
const processWithNLP = async (text) => {
    const manager = await initNLP();

    const result = await manager.process("mr", text);   // Process in Marathi
    console.log("\n🔍 NLP Analysis Results:");
    console.log("Intent:", result.intent);
    console.log("Entities:", result.entities);
    
    // Basic NLP processing with compromise
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');
    const numbers = doc.numbers().out('array');
    const dates = doc.dates().out('array');

    return {
        intent: result.intent,
        sentences,
        numbers,
        dates
    };
};


// ✅ Main Function to Extract and Apply NLP
const runOCRWithNLP = async (filePath, lang = "eng+mar") => {
    try {
        const extractedText = await extractTextFromFile(filePath, lang);

        console.log("\n📝 Extracted Text:");
        console.log(extractedText);

        const nlpResults = await processWithNLP(extractedText);

        console.log("\n✅ NLP Processed Data:");
        console.log(nlpResults);

    } catch (error) {
        console.error("Error:", error.message);
    }
};


// 🛠️ Execute the Pipeline
const uploadDir = path.join(__dirname, "../uploads");
const filePath = path.join(uploadDir, req.file.filename);  // Replace with your file path
runOCRWithNLP(filePath);
