const puppeteer = require('puppeteer');
const express = require('express');
const http = require('http');
const WebSocketServer = require('ws').Server;

const app = express();

app.use(express.static('public'))

const server = http.createServer(app).listen(3000, async () => {
  console.log('Example app listening on port 3000!');

  console.log('Starting automation');
  const width = 1024;
  const height = 768;
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--window-size=${width},${height}`
    ],
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await page.screenshot({ path: 'example.png' });

  //await browser.close();

  console.log('Done');
});

console.log('Starting websocket server');
const wss = new WebSocketServer({
  server: server
});

wss.on('connection', (ws, req) => {
  console.log('WS Connection reveiced');
});