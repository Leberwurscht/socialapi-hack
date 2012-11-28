var manifest_href;

function convert_to_absolute(url){ // http://james.padolsey.com/javascript/getting-a-fully-qualified-url/
  if (!url) return url;

  var img = document.createElement('img');
  img.src = url;
  url = img.src;
  img.src = null;
  return url;
}

var linkTags = document.getElementsByTagName("link");
for (var i=0; i<linkTags.length; i++) {
  if (linkTags[i].getAttribute("rel") != "manifest") continue;
  if (linkTags[i].getAttribute("type") != "text/json") continue;

  var href = linkTags[i].getAttribute("href");
  if (href) manifest_href = href;
}

self.port.emit("done", convert_to_absolute(manifest_href));

window.setTimeout(function(){ console.log("zombie..."); }, 1000);
