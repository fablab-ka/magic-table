var rainbowEnable = false;
var connection = new WebSocket("ws://" + location.hostname + ":81/", [
  "arduino"
]);
connection.onopen = function() {
  connection.send("Connect " + new Date());
};
connection.onerror = function(error) {
  console.log("WebSocket Error ", error);
};
connection.onmessage = function(e) {
  console.log("Server: ", e.data);
};
connection.onclose = function() {
  console.log("WebSocket connection closed");
};

function moveLeft() {
  sendMovement("1");
}
function moveRight() {
  sendMovement("2");
}
function moveForward() {
  sendMovement("3");
}
function stop() {
  sendMovement("0");
}
function sendMovement(dir) {
  var duration = Math.floor(
    document.getElementById("duration").value ** 2 / 1023
  );

  var commandstr = "#" + dir + duration.toString(16);
  console.log("Command: " + commandstr);
  connection.send(commandstr);
}
