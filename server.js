const express = require("express");
const path = require("path");
const questionBank = require("./data/questions.json");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get("/api/questions", (req, res) => {
  const level = req.query.level;
  if (!level || !questionBank[level]) {
    return res.status(400).json({
      error: "Invalid or missing level parameter.",
      availableLevels: Object.keys(questionBank)
    });
  }
  return res.json({
    level,
    questions: questionBank[level]
  });
});

app.listen(port, () => {
  console.log(`Aviation quiz server running on port ${port}`);
});
