var TAB_ACTION = new Object();
var TAB_TITLE = new Object();
var TAB_URL = new Object();
var TAB_ICON = new Object();

// var CLOSED_TITLE = new Array();
// var CLOSED_URL = new Array();
// var CLOSED_ICON = new Array();
// var CLOSED_ACTION = new Array();
// var CLOSED_DETAILS = new Array();

var TAB_IDS = new Array();
var STAY_OPEN = 420000; //7 minutes
//var STAY_OPEN = 15000; //DEBUG


function checkAutoLock(tab_id,url) {
  var wl_data = getLsOr("whitelist");
  var wl_len = wl_data.length;
  var locked_ids = getLsOr("locked_ids");

  for ( var i=0;i<wl_len;i++ ) {
    if ( url.indexOf(wl_data[i]) != -1 ) {
      if ( locked_ids.indexOf(tab_id) == -1 ) {
	locked_ids.push(tab_id);
      }
    }
  }
  localStorage["locked_ids"] = JSON.stringify(locked_ids);

}
function updateTabs(tab) {

    TAB_ACTION[tab.id] = new Date().getTime();

    TAB_TITLE[tab.id] = tab.title;
    TAB_URL[tab.id] = tab.url;
    TAB_ICON[tab.id] = tab.favIconUrl;

    if ( TAB_IDS.indexOf(tab.id) == -1 ) {
      TAB_IDS.push(tab.id);
    } else {
     //alert("not added, id exists already");
    }
}

function onUpdateAction(tabId,changeInfo,tab) {
    return updateTabs(tab);
}

function onSelectAction(tabId,selectInfo) {
   var tab = new Object();
   tab.id = tabId;
   tab.title = TAB_TITLE[tabId];
   tab.url = TAB_URL[tabId];
   tab.favIconUrl = TAB_ICON[tabId];
   return updateTabs(tab);
}


function initTabs(tabs) {
  var tl = tabs.length;

  for (var i = 0; i !== tl; i++) {
    var f = tabs[i].favIconUrl;
    var t = tabs[i].title;
    var u = tabs[i].url;
    var tid = tabs[i].id;
    //so we don't have to wait 5 seconds
    checkAutoLock(tabs[i].id,tabs[i].url);
    TAB_ACTION[tid] = new Date().getTime();
    TAB_TITLE[tid] = t;
    TAB_URL[tid] = u;
    TAB_ICON[tid] = f;

    TAB_IDS.push(tid);
  }
}

function checkToClose() {
  refreshOptions();
  chrome.tabs.getSelected(null,updateTabs);

  var tabNum = TAB_IDS.length;
  for ( var i=0; i < tabNum; i++ ) {
    checkAutoLock(TAB_IDS[i],TAB_URL[TAB_IDS[i]]);
  }
  var locked_ids = getLsOr("locked_ids");
  var rightNow = new Date().getTime();
  var toCut = new Array();
  for ( var i=0; i < tabNum; i++ ) {
	var timeGone = parseInt(rightNow) - parseInt(TAB_ACTION[TAB_IDS[i]]);
	var lock_check = locked_ids.indexOf(TAB_IDS[i]);
        if ( timeGone >= STAY_OPEN && lock_check == -1) {
          try {
          chrome.tabs.remove(TAB_IDS[i]);
	  addToCorral(TAB_IDS[i],TAB_TITLE[TAB_IDS[i]],
		      TAB_URL[TAB_IDS[i]],TAB_ICON[TAB_IDS[i]],
		      new Date().getTime());
          } catch(e) {

          }

          // CLOSED_TITLE.push(TAB_TITLE[TAB_IDS[i]]);
          // CLOSED_URL.push(TAB_URL[TAB_IDS[i]]);
          // CLOSED_ICON.push(TAB_ICON[TAB_IDS[i]]);
	  // CLOSED_ACTION.push(new Date().getTime());


          // localStorage["closed_tab_titles"] = JSON.stringify(CLOSED_TITLE);
          // localStorage["closed_tab_urls"] = JSON.stringify(CLOSED_URL);
          // localStorage["closed_tab_icons"] = JSON.stringify(CLOSED_ICON);
          // localStorage["closed_tab_actions"] = JSON.stringify(CLOSED_ACTION);

          toCut.push(TAB_IDS[i]);
        } else {
	    // if tab is locked...keep it updated...
	    if ( lock_check > -1 ) {
	        TAB_ACTION[TAB_IDS[i]] = new Date().getTime();
	    }
	}
  }



  for ( var x=0;x < toCut.length;x++ ) {
      TAB_IDS.splice(TAB_IDS.indexOf(toCut[x]),1);
  }

  // remove locked id if not an active tab..
  for ( var x=0;x < locked_ids.length;x++ ) {
      if ( TAB_IDS.indexOf(locked_ids[x]) == -1 ) {
	  	  locked_ids.splice(locked_ids.indexOf(locked_ids[x]),1);
      }
  }
  localStorage["locked_ids"] = JSON.stringify(locked_ids);

}

function refreshOptions() {
  var m = localStorage["minutes_inactive"];
  if ( m ) {
    STAY_OPEN = parseInt(m) * 60000;
    //STAY_OPEN = 15000; //DEBUG
  }
}

function startup() {
    // clear closed tabs DATA in options
    // CLEAR OLD DATA EVERY WHAT?..
    localStorage["closed_tab_ids"] = "";
    localStorage["closed_tab_titles"] = "";
    localStorage["closed_tab_urls"] = "";
    localStorage["closed_tab_icons"] = "";
    localStorage["closed_tab_actions"] = "";

    localStorage["locked_ids"] = "";

  refreshOptions();
  chrome.tabs.getAllInWindow(null, initTabs);
  chrome.tabs.onCreated.addListener(updateTabs);

  chrome.tabs.onUpdated.addListener(onUpdateAction);
  chrome.tabs.onSelectionChanged.addListener(onSelectAction);
  window.setInterval(checkToClose,5000);
}


window.onload = startup;