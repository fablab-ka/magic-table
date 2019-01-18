const puppeteer = require("puppeteer");
const express = require("express");
const http = require("http");
const WebSocketServer = require("ws").Server;

const app = express();

app.use(express.static("public"));

const server = http.createServer(app).listen(3000, async () => {
  console.log("Example app listening on port 3000!");

  const width = 1920;
  const height = 1280;

  console.log("Starting automation");
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--start-fullscreen`, "--disable-infobars"]
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/");
  await page.setViewport({ height, width });

  console.log("Done");
});

console.log("Starting websocket server");
const wss = new WebSocketServer({
  server: server
});

wss.on("connection", (ws, req) => {
  console.log("WS Connection reveiced");
});
