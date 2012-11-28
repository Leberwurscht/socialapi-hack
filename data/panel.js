self.port.on("set-provider", function(icon, name) {
  document.getElementById("icon").src = icon;

  var nameEl = document.getElementById("name");
  while(nameEl.childNodes.length >= 1) {
    nameEl.removeChild(nameEl.firstChild);
  }
  nameEl.appendChild(nameEl.ownerDocument.createTextNode(name));
});

document.getElementById("ok").onclick = function () {
  self.port.emit("ok");
};
