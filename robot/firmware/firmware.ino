#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ArduinoOTA.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <FS.h>
#include <WebSocketsServer.h>
#include "WEMOS_Motor.h"

ESP8266WiFiMulti wifiMulti;

ESP8266WebServer server(80);
WebSocketsServer webSocket(81);

File fsUploadFile;

const char *ssid = "Magic Robot 1";
const char *password = "foobar42";

const char *OTAName = "ESP8266"; // A name and a password for the OTA service
const char *OTAPassword = "esp8266";

const char *mdnsName = "magicrobot";

const int LED_POWER = D3;
const int LED_CONNECTION = D4;

//Motor shiled I2C Address: 0x30
//PWM frequency: 1000Hz(1kHz)
Motor M1(0x30, _MOTOR_A, 1000); //Motor A
Motor M2(0x30, _MOTOR_B, 1000); //Motor B

// wheel rotation calculations
// 5.4cm wheels -> 17.1cm wheel circumference
// 10 / 17.1cm -> 0.58 rotations for 10cm
// wheels are 10cm apart -> 31.41cm robot rotation circumference
// -> 29.217 / 17.1 = 1.65 wheel rotations for a full robot rotation
const float rotationsPerSecond[] = {1.04,
                                    2.775,
                                    5.96};
const float wheelRotationsForFullTurn[] = {2, 1.7, 1.65};
const float secondsPerFullTurn[] = {
    wheelRotationsForFullTurn[0] / rotationsPerSecond[0],
    wheelRotationsForFullTurn[1] / rotationsPerSecond[1],
    wheelRotationsForFullTurn[2] / rotationsPerSecond[2]};
const float wheelRotationsForTenCentimenters[] = {1, 0.8, 1};
const float secondsPerTenCentimenters[] = {
    wheelRotationsForTenCentimenters[0] / rotationsPerSecond[0],
    wheelRotationsForTenCentimenters[1] / rotationsPerSecond[1],
    wheelRotationsForTenCentimenters[2] / rotationsPerSecond[2]};
int const pwmPerVelocity[] = {
    15,
    40,
    255};

const int16_t MIN_DISTANCE_TO_TARGET = 20;
const int16_t MIN_ROTATION_DELTA = 10;
const int16_t MAX_DISTANCE_PER_TICK = 10;
const int16_t MAX_ROTATION_PER_TICK = 10;

int motorStopTime = -1;
int16_t currentDirectionX = 0;
int16_t currentDirectionY = 1;
int16_t targetPositionX = 0;
int16_t targetPositionY = 0;
int16_t targetRotation = 0;
bool isMoving = false;

void setup()
{
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_POWER, OUTPUT);
  pinMode(LED_CONNECTION, OUTPUT);

  digitalWrite(LED_POWER, 1);
  digitalWrite(LED_CONNECTION, 0);

  Serial.begin(115200);
  delay(10);
  Serial.println("\r\n");

  startWiFi(); // Start a Wi-Fi access point, and try to connect to some given access points. Then wait for either an AP or STA connection

  startOTA(); // Start the OTA service

  startSPIFFS(); // Start the SPIFFS and list all contents

  startWebSocket(); // Start a WebSocket server

  startMDNS(); // Start the mDNS responder

  startServer(); // Start a HTTP server with a file read handler and an upload handler

  digitalWrite(LED_CONNECTION, 1);
}

void loop()
{
  webSocket.loop();      // constantly check for websocket events
  server.handleClient(); // run the server
  ArduinoOTA.handle();   // listen for OTA events

  if (motorStopTime > 0 && motorStopTime <= millis())
  {
    motorStopTime = -1;

    M2.setmotor(_SHORT_BRAKE);
    M1.setmotor(_SHORT_BRAKE);
    delay(100);
    M2.setmotor(_STOP);
    M1.setmotor(_STOP);
  }

  if (abs(targetPositionX) > 0 || abs(targetPositionY) > 0 || abs(targetRotation) > 0)
  {
    isMoving = true;

    moveTo(targetPositionX, targetPositionY, targetRotation)
  }
  else if (isMoving)
  {
    isMoving = false;

    M2.setmotor(_SHORT_BRAKE);
    M1.setmotor(_SHORT_BRAKE);
    delay(100);
    M2.setmotor(_STOP);
    M1.setmotor(_STOP);
  }
}

void rotateToAngle(int16_t angle)
{
  // TODO better ramp up
  int amount = abs(angle) / 360 * 255;
  if (angle > 0)
  {
    M1.setmotor(_CW, 50);
    M2.setmotor(_CCW, 50);
    delay(10);
    M1.setmotor(_CW, pwmPerVelocity[0]);
    M2.setmotor(_CCW, pwmPerVelocity[0]);
    motorStopTime = millis() + getRotationTime(0, amount);
  }
  else
  {
    M1.setmotor(_CCW, 50);
    M2.setmotor(_CW, 50);
    delay(10);
    M1.setmotor(_CCW, pwmPerVelocity[0]);
    M2.setmotor(_CW, pwmPerVelocity[0]);
    motorStopTime = millis() + getRotationTime(0, amount);
  }

  float radAngle = angle / 360.0 * PI;
  currentDirectionX = currentDirectionX * cos(radAngle) - currentDirectionY * sin(radAngle);
  currentDirectionY = currentDirectionX * sin(radAngle) - currentDirectionY * cos(radAngle);
}

void driveForward(float distance)
{
  // TODO better ramp up
  M1.setmotor(_CW, 50);
  M2.setmotor(_CW, 50);
  delay(10);
  M1.setmotor(_CW, pwmPerVelocity[0]);
  M2.setmotor(_CW, pwmPerVelocity[0]);
  motorStopTime = millis() + getMovementTime(0, amount);

  float currentDirectionVectorLength = getVectorLength(currentDirectionX, currentDirectionY);
  float normDirX = currentDirectionX / currentDirectionVectorLength;
  float normDirY = currentDirectionY / currentDirectionVectorLength;

  currentDirectionX += normDirX * distance;
  currentDirectionY += normDirY * distance;
}

int16_t getAngleBetween(v1x, v1y, v2x, v2y)
{
  int16_t result = atan2(v2y, v2x) - atan2(v1y, v1x);
  if (result > PI)
  {
    result -= 2 * PI;
  }
  else if (result <= -PI)
  {
    result += 2 * PI;
  }

  return (result / PI) * 180;
}

float getVectorLength(int16_t x, int16_t y)
{
  return sqrt(x * x + y * y);
}

void moveTo(int16_t movementVectorX, int16_t movementVectorY, int16_t angle)
{
  float distance = getVectorLength(x, y);

  if (distance > MIN_DISTANCE_TO_TARGET)
  {
    const rotationDelta = getAngleBetween(
        movementVectorX, movementVectorY,
        currentDirectionX, currentDirectionY);
    if (abs(rotationDelta) > MIN_ROTATION_DELTA)
    {
      // look at target
      rotateToAngle(rotationDelta % MAX_ROTATION_PER_TICK);
    }
    else
    {
      // move to target
      driveForward(distance % MAX_DISTANCE_PER_TICK);
    }
  }
  else
  {
    const rotationDelta = targetRotation - currentRotation;
    if (abs(rotationDelta) > MIN_ROTATION_DELTA)
    {
      // rotate to targetrotation
      rotateToAngle(rotationDelta % MAX_ROTATION_PER_TICK);
    }
    else
    {
      // Turtle arrived at destination
    }
  }
}

void startWiFi()
{                              // Start a Wi-Fi access point, and try to connect to some given access points. Then wait for either an AP or STA connection
  WiFi.softAP(ssid, password); // Start the access point
  Serial.print("Access Point \"");
  Serial.print(ssid);
  Serial.println("\" started\r\n");

  wifiMulti.addAP("Fablab Karlsruhe", "foobar42"); // add Wi-Fi networks you want to connect to
  wifiMulti.addAP("matrix", "einlangesundtollespasswort");

  Serial.println("Connecting");
  while (wifiMulti.run() != WL_CONNECTED && WiFi.softAPgetStationNum() < 1)
  { // Wait for the Wi-Fi to connect
    delay(250);
    Serial.print('.');
  }
  Serial.println("\r\n");
  if (WiFi.softAPgetStationNum() == 0)
  { // If the ESP is connected to an AP
    Serial.print("Connected to ");
    Serial.println(WiFi.SSID()); // Tell us what network we're connected to
    Serial.print("IP address:\t");
    Serial.print(WiFi.localIP()); // Send the IP address of the ESP8266 to the computer
  }
  else
  { // If a station is connected to the ESP SoftAP
    Serial.print("Station connected to ESP8266 AP");
  }
  Serial.println("\r\n");
}

void startOTA()
{ // Start the OTA service
  ArduinoOTA.setHostname(OTAName);
  ArduinoOTA.setPassword(OTAPassword);

  ArduinoOTA.onStart([]() {
    Serial.println("Start");
    M1.setmotor(_STOP);
    M2.setmotor(_STOP);

    digitalWrite(LED_BUILTIN, 0);
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\r\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR)
      Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR)
      Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR)
      Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR)
      Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR)
      Serial.println("End Failed");
  });
  ArduinoOTA.begin();
  Serial.println("OTA ready\r\n");
}

void startSPIFFS()
{                 // Start the SPIFFS and list all contents
  SPIFFS.begin(); // Start the SPI Flash File System (SPIFFS)
  Serial.println("SPIFFS started. Contents:");
  {
    Dir dir = SPIFFS.openDir("/");
    while (dir.next())
    { // List the file system contents
      String fileName = dir.fileName();
      size_t fileSize = dir.fileSize();
      Serial.printf("\tFS File: %s, size: %s\r\n", fileName.c_str(), formatBytes(fileSize).c_str());
    }
    Serial.printf("\n");
  }
}

void startWebSocket()
{                                    // Start a WebSocket server
  webSocket.begin();                 // start the websocket server
  webSocket.onEvent(webSocketEvent); // if there's an incomming websocket message, go to function 'webSocketEvent'
  Serial.println("WebSocket server started.");
}

void startMDNS()
{                       // Start the mDNS responder
  MDNS.begin(mdnsName); // start the multicast domain name server
  Serial.print("mDNS responder started: http://");
  Serial.print(mdnsName);
  Serial.println(".local");
}

void startServer()
{                                           // Start a HTTP server with a file read handler and an upload handler
  server.on("/edit.html", HTTP_POST, []() { // If a POST request is sent to the /edit.html address,
    server.send(200, "text/plain", "");
  },
            handleFileUpload); // go to 'handleFileUpload'

  server.onNotFound(handleNotFound); // if someone requests any other file or page, go to function 'handleNotFound'
                                     // and check if the file exists

  server.begin(); // start the HTTP server
  Serial.println("HTTP server started.");
}

void handleNotFound()
{ // if the requested file or page doesn't exist, return a 404 not found error
  if (!handleFileRead(server.uri()))
  { // check if the file exists in the flash memory (SPIFFS), if so, send it
    server.send(404, "text/plain", "404: File Not Found");
  }
}

bool handleFileRead(String path)
{ // send the right file to the client (if it exists)
  Serial.println("handleFileRead: " + path);
  if (path.endsWith("/"))
    path += "index.html";                    // If a folder is requested, send the index file
  String contentType = getContentType(path); // Get the MIME type
  String pathWithGz = path + ".gz";
  if (SPIFFS.exists(pathWithGz) || SPIFFS.exists(path))
  {                                                     // If the file exists, either as a compressed archive, or normal
    if (SPIFFS.exists(pathWithGz))                      // If there's a compressed version available
      path += ".gz";                                    // Use the compressed verion
    File file = SPIFFS.open(path, "r");                 // Open the file
    size_t sent = server.streamFile(file, contentType); // Send it to the client
    file.close();                                       // Close the file again
    Serial.println(String("\tSent file: ") + path);
    return true;
  }
  Serial.println(String("\tFile Not Found: ") + path); // If the file doesn't exist, return false
  return false;
}

void handleFileUpload()
{ // upload a new file to the SPIFFS
  HTTPUpload &upload = server.upload();
  String path;
  if (upload.status == UPLOAD_FILE_START)
  {
    path = upload.filename;
    if (!path.startsWith("/"))
      path = "/" + path;
    if (!path.endsWith(".gz"))
    {                                   // The file server always prefers a compressed version of a file
      String pathWithGz = path + ".gz"; // So if an uploaded file is not compressed, the existing compressed
      if (SPIFFS.exists(pathWithGz))    // version of that file must be deleted (if it exists)
        SPIFFS.remove(pathWithGz);
    }
    Serial.print("handleFileUpload Name: ");
    Serial.println(path);
    fsUploadFile = SPIFFS.open(path, "w"); // Open the file for writing in SPIFFS (create if it doesn't exist)
    path = String();
  }
  else if (upload.status == UPLOAD_FILE_WRITE)
  {
    if (fsUploadFile)
      fsUploadFile.write(upload.buf, upload.currentSize); // Write the received bytes to the file
  }
  else if (upload.status == UPLOAD_FILE_END)
  {
    if (fsUploadFile)
    {                       // If the file was successfully created
      fsUploadFile.close(); // Close the file again
      Serial.print("handleFileUpload Size: ");
      Serial.println(upload.totalSize);
      server.sendHeader("Location", "/success.html"); // Redirect the client to the success page
      server.send(303);
    }
    else
    {
      server.send(500, "text/plain", "500: couldn't create file");
    }
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t lenght)
{ // When a WebSocket message is received
  switch (type)
  {
  case WStype_DISCONNECTED: // if the websocket is disconnected
    Serial.printf("[%u] Disconnected!\n", num);
    break;
  case WStype_CONNECTED:
  { // if a new websocket connection is established
    IPAddress ip = webSocket.remoteIP(num);
    Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);

    M2.setmotor(_STANDBY);
    M2.setmotor(_STANDBY);
  }
  break;
  case WStype_TEXT: // if new text data is received
    Serial.printf("[%u] get Text: %s\n", num, payload);
    if (payload[0] == '>')
    {
      targetPositionX = (int16_t)strtol((const char *)&payload[1], NULL, 16);
      targetPositionY = (int16_t)strtol((const char *)&payload[2], NULL, 16);
      targetRotation = (int16_t)strtol((const char *)&payload[3], NULL, 16);
      Serial.print("go to ");
      Serial.print(targetPositionX);
      Serial.print(":");
      Serial.print(targetPositionY);
      Serial.print(":");
      Serial.println(targetRotation);
    }
    else if (payload[0] == '#')
    { // we get a move command
      const char dir = payload[1];
      uint8_t velocity = (uint8_t)strtol((const char *)&payload[2], NULL, 8);
      uint32_t amount = (uint32_t)strtol((const char *)&payload[4], NULL, 16);
      Serial.println(velocity);

      if (velocity < 0 || velocity > 2)
      {
        return;
      }

      if (dir == '0')
      {
        Serial.println("Full stop");
        M1.setmotor(_SHORT_BRAKE);
        M2.setmotor(_SHORT_BRAKE);
        M1.setmotor(_STOP);
        M2.setmotor(_STOP);
      }
      else if (dir == '1')
      {
        Serial.print("Rotate Left ");
        Serial.print(pwmPerVelocity[velocity]);
        Serial.print(" ");
        Serial.println(amount);

        M1.setmotor(_CCW, 50);
        M2.setmotor(_CW, 50);
        delay(10);
        M1.setmotor(_CCW, pwmPerVelocity[velocity]);
        M2.setmotor(_CW, pwmPerVelocity[velocity]);
        motorStopTime = millis() + getRotationTime(velocity, amount);
      }
      else if (dir == '2')
      {
        Serial.print("Rotate Right ");
        Serial.print(pwmPerVelocity[velocity]);
        Serial.print(" ");
        Serial.println(amount);

        M1.setmotor(_CW, 50);
        M2.setmotor(_CCW, 50);
        delay(10);
        M1.setmotor(_CW, pwmPerVelocity[velocity]);
        M2.setmotor(_CCW, pwmPerVelocity[velocity]);
        motorStopTime = millis() + getRotationTime(velocity, amount);
      }
      else if (dir == '3')
      {
        Serial.print("Forward ");
        Serial.print(pwmPerVelocity[velocity]);
        Serial.print(" ");
        Serial.println(amount);

        M1.setmotor(_CW, 50);
        M2.setmotor(_CW, 50);
        delay(10);
        M1.setmotor(_CW, pwmPerVelocity[velocity]);
        M2.setmotor(_CW, pwmPerVelocity[velocity]);
        motorStopTime = millis() + getMovementTime(velocity, amount);
      }
      else if (dir == '4')
      {
        Serial.print("Backward");
        Serial.print(pwmPerVelocity[velocity]);
        Serial.print(" ");
        Serial.println(amount);

        M1.setmotor(_CCW, 50);
        M2.setmotor(_CCW, 50);
        delay(10);
        M1.setmotor(_CCW, pwmPerVelocity[velocity]);
        M2.setmotor(_CCW, pwmPerVelocity[velocity]);
        motorStopTime = millis() + getMovementTime(velocity, amount);
      }

      delay(100);
    }
    break;
  }
}

int getMovementTime(int velocity, int distance)
{
  float movementFactor = distance / 255.0;
  return secondsPerTenCentimenters[velocity] * movementFactor * 1000;
}

int getRotationTime(int velocity, int rotationAmount)
{
  float rotationFactor = rotationAmount / 255.0;
  return secondsPerFullTurn[velocity] * rotationFactor * 1000;
}

String formatBytes(size_t bytes)
{ // convert sizes in bytes to KB and MB
  if (bytes < 1024)
  {
    return String(bytes) + "B";
  }
  else if (bytes < (1024 * 1024))
  {
    return String(bytes / 1024.0) + "KB";
  }
  else if (bytes < (1024 * 1024 * 1024))
  {
    return String(bytes / 1024.0 / 1024.0) + "MB";
  }
}

String getContentType(String filename)
{ // determine the filetype of a given filename, based on the extension
  if (filename.endsWith(".html"))
    return "text/html";
  else if (filename.endsWith(".css"))
    return "text/css";
  else if (filename.endsWith(".js"))
    return "application/javascript";
  else if (filename.endsWith(".ico"))
    return "image/x-icon";
  else if (filename.endsWith(".gz"))
    return "application/x-gzip";
  return "text/plain";
}
