const http = require("http");
const path = require("path");
const fs = require("fs");
const { URL } = require("url");
const questionBank = require("./data/questions.json");

const port = process.env.PORT || 3000;
const baseDir = __dirname;
const publicFiles = new Set(["/", "/index.html", "/app.js", "/style.css", "/data/questions.json"]);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": contentTypes[".json"] });
  res.end(JSON.stringify(payload));
};

const sendFile = (res, filePath) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 500, { error: "Unable to read file." });
      return;
    }
    const ext = path.extname(filePath) || ".html";
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain; charset=utf-8" });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (requestUrl.pathname === "/api/questions") {
    const level = requestUrl.searchParams.get("level");
    if (!level || !questionBank[level]) {
      sendJson(res, 400, {
        error: "Invalid or missing level parameter.",
        availableLevels: Object.keys(questionBank)
      });
      return;
    }
    sendJson(res, 200, { level, questions: questionBank[level] });
    return;
  }

  if (!publicFiles.has(requestUrl.pathname)) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  const filePath = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
  sendFile(res, path.join(baseDir, filePath));
});

server.listen(port, () => {
  console.log(`Aviation quiz server running on port ${port}`);
});
