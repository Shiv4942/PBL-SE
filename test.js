const Jimp = require("jimp");

Jimp.read("test.png")
  .then(image => console.log("Jimp is working!"))
  .catch(err => console.error("Jimp error:", err));
