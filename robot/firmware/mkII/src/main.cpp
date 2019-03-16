#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ArduinoOTA.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <FS.h>
#include <WebSocketsServer.h>
#include "WEMOS_Motor.h"

#define DEBUG

ESP8266WiFiMulti wifiMulti;

ESP8266WebServer server(80);
WebSocketsServer webSocket(81);

File fsUploadFile;

const char *ssid = "Magic Robot 3";
const char *password = "foobar42";

const char *OTAName = "magicrobot3"; // A name and a password for the OTA service
const char *OTAPassword = "magic";

const char *mdnsName = "magicrobot3";

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
float rotationsPerSecond[] = {1.04,
                                    2.775,
                                    5.96};
float wheelRotationsForFullTurn[] = {2, 1.7, 1.65};
float secondsPerFullTurn[] = {
    wheelRotationsForFullTurn[0] / rotationsPerSecond[0],
    wheelRotationsForFullTurn[1] / rotationsPerSecond[1],
    wheelRotationsForFullTurn[2] / rotationsPerSecond[2]};
float wheelRotationsForTenCentimenters[] = {1, 0.8, 1};
float secondsPerTenCentimenters[] = {
    wheelRotationsForTenCentimenters[0] / rotationsPerSecond[0],
    wheelRotationsForTenCentimenters[1] / rotationsPerSecond[1],
    wheelRotationsForTenCentimenters[2] / rotationsPerSecond[2]};
int pwmPerVelocity[] = {
    15,
    40,
    200};
int COMMAND_PWM = 40;

float angularVelocity = 0;
float linearVelocity = 0;

float MIN_DISTANCE_TO_TARGET = 20;
float MIN_ROTATION_DELTA = 15;
float MICROSECONDS_PER_MM_FORWARD = 2000;
float MICROSECONDS_PER_DEGREE_ROTATING = 2700;
float ANGULAR_ELLIPSIS = 0.05;
float LINEAR_ELLIPSIS = 0.05;
float ANGULAR_RAMP_UP_STEP = 0.00001;
float LINEAR_RAMP_UP_STEP = 0.00001;
float MIN_PWM = 15;


unsigned long motorStopTime = -1;
float targetPositionX = 0;
float targetPositionY = 0;
float targetRotation = 0;
float didRotateToDirectionLastTick = false;
float didRotateToTargetLastTick = false;
float didDriveForwardLastTick = false;

unsigned long lastMovementTime = 0;

unsigned long getMovementTime(int velocity, int distance)
{
  float movementFactor = distance / 255.0;
  return secondsPerTenCentimenters[velocity] * movementFactor * 1000;
}

unsigned long getRotationTime(int velocity, int rotationAmount)
{
  float rotationFactor = rotationAmount / 255.0;
  return secondsPerFullTurn[velocity] * rotationFactor * 1000;
}

float calculatePWMForVelocity(float velocity) {
  return velocity * (COMMAND_PWM - MIN_PWM) + MIN_PWM;
}

void setClockwiseMotorRotation(float velocity) {
  M1.setmotor(_CCW, calculatePWMForVelocity(velocity));
  M2.setmotor(_CW, calculatePWMForVelocity(velocity));
}

void setCounterClockwiseMotorRotation(float velocity) {
  M1.setmotor(_CW, -calculatePWMForVelocity(velocity));
  M2.setmotor(_CCW, -calculatePWMForVelocity(velocity));
}

void setMotorForward(float velocity) {
  M1.setmotor(_CCW, -calculatePWMForVelocity(velocity));
  M2.setmotor(_CCW, -calculatePWMForVelocity(velocity));
}

void rotateToAngle(float dt, float angle)
{
  #ifdef DEBUG
  char buffer [40];
  sprintf(buffer, "rotate to angle\n angle=%f", angle);
  webSocket.broadcastTXT(buffer);
  #endif

  int amount = fabs(angle) / 360 * 255;
  if (linearVelocity > LINEAR_ELLIPSIS) {
    #ifdef DEBUG
    webSocket.broadcastTXT("breaking linear velocity");
    #endif

    linearVelocity = 0;

    M1.setmotor(_SHORT_BRAKE);
    M2.setmotor(_SHORT_BRAKE);
    M1.setmotor(_STOP);
    M2.setmotor(_STOP);
  }

  if (angle > 0)
  {
    if (angularVelocity < -ANGULAR_ELLIPSIS) {
      #ifdef DEBUG
      webSocket.broadcastTXT("breaking angular left rotation");
      #endif

      angularVelocity = 0;

      M1.setmotor(_SHORT_BRAKE);
      M2.setmotor(_SHORT_BRAKE);
      M1.setmotor(_STOP);
      M2.setmotor(_STOP);
    }

    #ifdef DEBUG
    webSocket.broadcastTXT("rotating right");
    #endif

    setClockwiseMotorRotation(angularVelocity);

    angularVelocity += ANGULAR_RAMP_UP_STEP * dt;
    if (angularVelocity > 1) { angularVelocity = 1; }
  }
  else
  {
    if (angularVelocity > ANGULAR_ELLIPSIS) {
      #ifdef DEBUG
      webSocket.broadcastTXT("breaking angular right rotation");
      #endif

      angularVelocity = 0;

      M1.setmotor(_SHORT_BRAKE);
      M2.setmotor(_SHORT_BRAKE);
      M1.setmotor(_STOP);
      M2.setmotor(_STOP);
    }

    #ifdef DEBUG
    webSocket.broadcastTXT("rotating left");
    #endif

    setCounterClockwiseMotorRotation(angularVelocity);


    angularVelocity -= ANGULAR_RAMP_UP_STEP * dt;
    if (angularVelocity < -1) { angularVelocity = -1; }
  }
}

void driveForward(float dt)
{
  #ifdef DEBUG
  webSocket.broadcastTXT("drive forward");
  #endif

  if (fabs(angularVelocity) > ANGULAR_ELLIPSIS) {
    #ifdef DEBUG
    webSocket.broadcastTXT("breaking right rotation");
    #endif

    angularVelocity = 0;

    M1.setmotor(_SHORT_BRAKE);
    M2.setmotor(_SHORT_BRAKE);
    M1.setmotor(_STOP);
    M2.setmotor(_STOP);
  }

  setMotorForward(linearVelocity);

  linearVelocity += LINEAR_RAMP_UP_STEP * dt;
  if (linearVelocity > 1) { linearVelocity = 1; }
}

float getAngleToTargetVector()
{
  float result = atan2(1, 0) - atan2(targetPositionY, targetPositionX);
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

float getTargetVectorLength()
{
  return sqrt(targetPositionX * targetPositionX + targetPositionY * targetPositionY);
}

template <typename type>
type sign(type value) {
 return type((value > 0) - (value < 0));
}

void rotateTargetPosition(float angle) {
  float radAngle = (float)angle / 180.0 * PI;
  float oldTargetPositionX = targetPositionX;
  targetPositionX = targetPositionX * cos(radAngle) - targetPositionY * sin(radAngle);
  targetPositionY = oldTargetPositionX * sin(radAngle) + targetPositionY * cos(radAngle);
  targetRotation -= angle;
}

void makeDirectionRotationLookCorrect(float rotationDelta) {
  #ifdef DEBUG
  char buffer [60];
  sprintf(buffer, "makeDirectionRotationLookCorrect, angle to correct=%f", rotationDelta);
  webSocket.broadcastTXT(buffer);
  #endif

  rotateTargetPosition(rotationDelta);
}

void updateTargetData(float dt) {
  if (didRotateToDirectionLastTick) {
    didRotateToDirectionLastTick = false;

    float angle = (dt / MICROSECONDS_PER_DEGREE_ROTATING) * angularVelocity*angularVelocity; //EXPERIMENT with expontential velocity

    #ifdef DEBUG
    char buffer [32];
    sprintf(buffer, "rotation angle=%f", angle);
    webSocket.broadcastTXT(buffer);
    #endif

    rotateTargetPosition(angle);
  }

  if (didDriveForwardLastTick) {
    didDriveForwardLastTick = false;

    targetPositionY -= (dt / MICROSECONDS_PER_MM_FORWARD) * linearVelocity*linearVelocity; //EXPERIMENT with expontential velocity
  }

  if (didRotateToTargetLastTick) {
    didRotateToTargetLastTick = false;

    targetRotation -= (dt / MICROSECONDS_PER_DEGREE_ROTATING) * angularVelocity*angularVelocity; //EXPERIMENT with expontential velocity
  }
}

void moveToTarget(float dt, float distance)
{
  #ifdef DEBUG
  char buffer [512];
  sprintf(
    buffer,
    "move to target\n distance=%f\n dt=%f\n targetPositionX=%f\n targetPositionY=%f\n targetRotation=%f\n angularVelocity=%f\n linearVelocity=%f",
    distance,
    dt,
    targetPositionX,
    targetPositionY,
    targetRotation,
    angularVelocity,
    linearVelocity
  );
  webSocket.broadcastTXT(buffer);
  #endif

  updateTargetData(dt);

  if (distance > MIN_DISTANCE_TO_TARGET)
  {
    float rotationDelta = getAngleToTargetVector();

    #ifdef DEBUG
    char buffer [20];
    sprintf(buffer, "rotationDelta=%f", rotationDelta);
    webSocket.broadcastTXT(buffer);
    #endif

    if (fabs(rotationDelta) > MIN_ROTATION_DELTA)
    {
      rotateToAngle(dt, rotationDelta);
      didRotateToDirectionLastTick = true;
    }
    else
    {
      if (fabs(rotationDelta) > 0.0001) { // it's good enough
          makeDirectionRotationLookCorrect(rotationDelta);
      }

      driveForward(dt);
      didDriveForwardLastTick = true;
    }
  }
  else
  {
    if (fabs(targetRotation) > MIN_ROTATION_DELTA)
    {
      rotateToAngle(dt, targetRotation);
      didRotateToTargetLastTick = true;
    }
    else
    {
      #ifdef DEBUG
      webSocket.broadcastTXT("Turtle arrived at destination");
      #endif
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
    server.streamFile(file, contentType); // Send it to the client
    file.close();                                       // Close the file again
    Serial.println(String("\tSent file: ") + path);
    return true;
  }
  Serial.println(String("\tFile Not Found: ") + path); // If the file doesn't exist, return false
  return false;
}

void handleNotFound()
{ // if the requested file or page doesn't exist, return a 404 not found error
  if (!handleFileRead(server.uri()))
  { // check if the file exists in the flash memory (SPIFFS), if so, send it
    server.send(404, "text/plain", "404: File Not Found");
  }
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
  char * pEnd;

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
      targetPositionX = (float)strtol((const char *)&payload[1], &pEnd, 16);
      targetPositionY = (float)strtol(pEnd, &pEnd, 16);
      targetRotation = (float)strtol(pEnd, NULL, 16);
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

        angularVelocity = 0;
        linearVelocity = 0;
        targetPositionX = 0;
        targetRotation = 0;
      }
      else if (dir == '1')
      {
        Serial.print("Rotate Left ");
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
      else if (dir == '2')
      {
        Serial.print("Rotate Right ");
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
      else if (dir == '3')
      {
        Serial.print("Forward ");
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
      else if (dir == '4')
      {
        Serial.print("Backward");
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

      delay(100);
    }
    break;
  }
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

    angularVelocity = 0;
    linearVelocity = 0;
  }


  unsigned long now = micros();
  float dt;
  if (lastMovementTime > 0) {
    dt = (now - lastMovementTime);
  } else {
    dt = 0;
  }
  lastMovementTime = now;

  float distance = getTargetVectorLength();
  if (distance > MIN_DISTANCE_TO_TARGET || fabs(targetRotation) > MIN_ROTATION_DELTA)
  {
    moveToTarget(dt, distance);
  }
  else
  {
    M2.setmotor(_SHORT_BRAKE);
    M1.setmotor(_SHORT_BRAKE);
    delay(100);
    M2.setmotor(_STOP);
    M1.setmotor(_STOP);

    angularVelocity = 0;
    linearVelocity = 0;
  }
}
