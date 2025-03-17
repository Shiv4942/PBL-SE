module.exports = {
    feeReceiptValidations: {
        studentName: /Student Name:\s*([A-Z\s]+)/i,
        rollNumber: /Roll No[:\s]+(\d{4,6})/i,
        receiptNo: /Receipt No[:\s]+(E-\d{4}-\d{2}-\d+)/i,
        date: /DATE[:\s]+(\d{2}-\d{2}-\d{4})/i,
        transactionId: /TRANSACTION ID[:\s]+([A-Z0-9]+)/i,
        amount: /Total Fee[\s\S]*?(\d{1,},?\d{2,}\.\d{2})/i
    },

    marathiSevenTwelveValidations: {
        surveyNumber: /(?:गट क्र|सर्वे नं)[\.:\s]*([\d\/]+)/i,
        ownerName: /(?:खातेदाराचे नाव|मालकाचे नाव)[\.:\s]*([^\n]+)/i,
        landArea: /क्षेत्र[\.:\s]*([\d\.]+\s*[^\s\d]+)/i,
        villageName: /(?:गाव|मौजे)[\.:\s]*([^\n,]+)/i,
        talukaName: /(?:तालुका|ता\.)[\.:\s]*([^\n,]+)/i,
        districtName: /(?:जिल्हा|जि\.)[\.:\s]*([^\n,]+)/i
    },

    englishSevenTwelveValidations: {
        surveyNumber: /(?:Survey No|Survey Number|S\. No\.)[\.:\s]*([\d\/]+)/i,
        ownerName: /(?:Owner(?:'s)? Name|Landholder|Khatedar)[\.:\s]*([^\n]+)/i,
        landArea: /(?:Area|Land Area|Extent)[\.:\s]*([\d\.]+\s*[^\s\d]+)/i,
        villageName: /(?:Village|Town)[\.:\s]*([^\n,]+)/i,
        talukaName: /(?:Taluka|Tehsil|Taluk)[\.:\s]*([^\n,]+)/i,
        districtName: /(?:District|Dist\.)[\.:\s]*([^\n,]+)/i,
        landType: /(?:Land Type|Type of Land|Classification|Land Classification)[\.:\s]*([^\n,]+)/i,
        cropDetails: /(?:Crop Details|Cultivation|Crops)[\.:\s]*([^\n,]+)/i
    }
};
