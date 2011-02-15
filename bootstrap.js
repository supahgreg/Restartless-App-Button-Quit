const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");

let cleanupAry = [];

function main(win) {
  let appButton = win.document.getElementById("appmenu-button");

  function abQuit(e) {
    // Only care about left-clicking
    if (e.button !== 0) return;
    win.document.getElementById('cmd_closeWindow').doCommand();
  }

  appButton.addEventListener("dblclick", abQuit, true);

  let idx1 = cleanupAry.push(function() {
    appButton.removeEventListener("dblclick", abQuit, true);
  }) - 1;
  let idx2 = cleanupAry.push(function() (
      win.removeEventListener("unload", winUnloader, false))) - 1;
  function winUnloader() {
    cleanupAry[idx1] = null;
    cleanupAry[idx2] = null;
  }
  win.addEventListener("unload", winUnloader, false);
}

function install(){}
function uninstall(){}
function startup() {
  let browserWins = Services.wm.getEnumerator("navigator:browser");
  while (browserWins.hasMoreElements()) main(browserWins.getNext());

  function winObs(aSubject, aTopic) {
    if ("domwindowopened" != aTopic) return;
    let winLoad = function() {
      aSubject.removeEventListener("load", winLoad, false);
      if ("navigator:browser" ==
          aSubject.document.documentElement.getAttribute("windowtype"))
        main(aSubject);
    }
    aSubject.addEventListener("load", winLoad, false);
  }
  Services.ww.registerNotification(winObs);
  cleanupAry.push(function() Services.ww.unregisterNotification(winObs));
}
function shutdown(data, reason) {
  if (reason !== APP_SHUTDOWN)
    for (let [, cleaner] in Iterator(cleanupAry)) cleaner && cleaner();
}
