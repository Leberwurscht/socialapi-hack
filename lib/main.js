var data = require("self").data;
var tabs = require("tabs");
var widget = require("widget");
var panel = require("panel");
var Request = require("request").Request;
var URL = require("url").URL;
var preferences = require("preferences-service");
var notifications = require("notifications");
var storage = require("simple-storage").storage;
var self = require("self");

var addon_widget;

function reset_provider(json) {
  // restore default settings
  preferences.reset("social");

  var keys = preferences.keys("social");
  for (var i=0; i<keys.length; i++) preferences.reset(keys[i]);

  if (!json) return;

  // delete all social providers
  var keys = preferences.keys("social.manifest");
  for (var i=0; i<keys.length; i++) {
    preferences.set(keys[i], "");
  }

  // set new social provider
  preferences.set("social.manifest."+json.origin, JSON.stringify(json));
  preferences.set("social.enabled", false);
  preferences.set("social.active", false);
  preferences.set("social.activation.whitelist", json.origin);

  // make a note to enable social api on next startup
  storage.enable_on_startup = true;

  // tell user to restart
  notifications.notify({
    title: "Restart necessary",
    text: "You need to restart firefox to be able to use the new social provider "+json.name
  });
}

function open_panel(href) {
  var request = Request({
    url: href,
    onComplete: function (response) {
      var manifest = response.text;
      if (!manifest) return;

      // fix json: some have ,} in it (note: a bit dangerous)
      manifest = manifest.replace(/,\s*}/g, "}");

      try { manifest = JSON.parse(manifest); }
      catch (e) {
        console.log("invalid json");
        return;
      }

      if (!manifest.services || !manifest.services.social) return;
      icon = URL(manifest.services.social.iconURL, href).toString();
      sidebar = URL(manifest.services.social.sidebarURL, href).toString();
      worker = URL(manifest.services.social.workerURL, href).toString();
      name = manifest.services.social.name;

      var origin_url = URL(href);
      var origin = origin_url.scheme + "://" + origin_url.host;

      var addon_panel = panel.Panel({
        contentURL: data.url('panel.html'),
        contentScriptFile: data.url('panel.js')
      });
      addon_panel.show();
      addon_panel.on("hide", function() {
        addon_panel.destroy();
      });
      addon_panel.port.emit("set-provider", icon, name);
      addon_panel.port.on("ok", function() {
        var json = {
          workerURL: worker,
          sidebarURL: sidebar,
          iconURL: icon,
          name: name,
          origin: origin
        };

        reset_provider(json);
        addon_panel.destroy();
      });
    }
  });
  request.get();
}

function update_widget() {
  var tab = tabs.activeTab;
  if (!tab) return;

  var worker = tab.attach({
    contentScriptFile: data.url('get_manifest_href.js')
  });

  worker.port.on("done", function(href) {
    worker.destroy();

    if (addon_widget) {
      addon_widget.destroy();
      addon_widget = null;
    }
    if (href) {
      addon_widget = widget.Widget({
        id: "socialapi-hack",
        label: "Configure Social API for this site",
        contentURL: data.url('icon.png'), // http://openclipart.org/detail/35563/abstract-people-by-tobias-moon
        onClick: function() { open_panel(href); }
      });
    }
  });
}

tabs.on('activate', update_widget);
tabs.on('ready', update_widget);

if (self.loadReason=="startup" && storage.enable_on_startup) {
  preferences.set("social.enabled", true);
  preferences.set("social.active", true);

  storage.enable_on_startup = false;
}
