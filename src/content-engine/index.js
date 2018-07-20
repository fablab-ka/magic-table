const puppeteer = require('puppeteer');
const express = require('express');
const child_process = require('child_process'); // To be used later for running FFmpeg
const http = require('http');
const WebSocketServer = require('ws').Server;

const app = express();

app.use(express.static('public'))

app.get('/', (req, res) => res.send('Hello World!'));

const server = http.createServer(app).listen(3000, () => {
  console.log('Example app listening on port 3000!');

  console.log('Starting automation');
  const width = 1024;
  const height = 768;
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--window-size=${width},${height}`
      ],
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/');
    await page.screenshot({ path: 'example.png' });

    //await browser.close();
  })();
  console.log('Done');
});

console.log('Starting websocket server');
const wss = new WebSocketServer({
  server: server
});

wss.on('connection', (ws, req) => {
  console.log('WS Connection reveiced');

  const rtmpUrl = 'rtp://127.0.0.1:1234';
  console.log('Target RTMP URL:', rtmpUrl);

  // Launch FFmpeg to handle all appropriate transcoding, muxing, and RTMP.
  // If 'ffmpeg' isn't in your path, specify the full path to the ffmpeg binary.
  const ffmpeg = child_process.spawn('ffmpeg', [
    // Remove this line, as well as `-shortest`, if you send audio from the browser.
    //'-f', 'lavfi', '-i', 'anullsrc',

    // FFmpeg will read input video from STDIN
    '-i', '-',


    // Because we're using a generated audio source which never ends,
    // specify that we'll stop at end of other input.  Remove this line if you
    // send audio from the browser.
    //'-shortest',

    // If we're encoding H.264 in-browser, we can set the video codec to 'copy'
    // so that we don't waste any CPU and quality with unnecessary transcoding.
    // If the browser doesn't support H.264, set the video codec to 'libx264'
    // or similar to transcode it to H.264 here on the server.
    '-vcodec', 'copy',

    // AAC audio is required for Facebook Live.  No browser currently supports
    // encoding AAC, so we must transcode the audio to AAC here on the server.
    //'-acodec', 'aac',

    // FLV is the container format used in conjunction with RTMP
    '-f', 'rtp',

    // The output RTMP URL.
    // For debugging, you could set this to a filename like 'test.flv', and play
    // the resulting file with VLC.  Please also read the security considerations
    // later on in this tutorial.
    rtmpUrl
  ]);

  // If FFmpeg stops for any reason, close the WebSocket connection.
  ffmpeg.on('close', (code, signal) => {
    console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
    ws.terminate();
  });

  // Handle STDIN pipe errors by logging to the console.
  // These errors most commonly occur when FFmpeg closes and there is still
  // data to write.  If left unhandled, the server will crash.
  ffmpeg.stdin.on('error', (e) => {
    console.log('FFmpeg STDIN Error', e);
  });

  // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
  ffmpeg.stderr.on('data', (data) => {
    console.log('FFmpeg STDERR:', data.toString());
  });

  // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
  ws.on('message', (msg) => {
    console.log('DATA', msg);
    ffmpeg.stdin.write(msg);
  });

  // If the client disconnects, stop FFmpeg.
  ws.on('close', (e) => {
    ffmpeg.kill('SIGINT');
  });
});