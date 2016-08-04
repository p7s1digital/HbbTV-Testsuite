var PLAYSTATES = ['stopped', 'playing', 'paused', 'connecting', 'buffering', 'finished', 'error'];
var PLAYERRORS = ['A/V format not supported', 'cannot connect to server or lost connection', 'unidentified error',
  'insufficient resources', 'content corrupt or invalid', 'content not available', 'content not available at given position',
  'content blocked due to parental control'];

//var vidurl = 'http://192.168.178.39:8080/content/TOS-enc.mp4';
//var vidurl = 'http://192.168.178.39:8080/content/Manifest.mpd';
//var vidurl = 'http://192.168.248.150:8080/content/Manifest.mpd';
var vidurls = {
  dash_drm_dolby: 'http://streaming.dolby.com/ftproot/mitXperts/dash_enc/dash_playready.mpd',
  dash_philipp: 'http://hbbtv.prosieben.de/extern/castlabs/videos/philipp-dash/stream.mpd',
  dash_drm_philipp: 'http://hbbtv.prosieben.de/extern/castlabs/videos/philipp-drm/stream.mpd',
  //dash_irt: 'http://itv.mit-xperts.com/video/dash/new.php/test.mpd',
  dash_irt: 'http://akamai-progressive.irt.de/irt_reference_clips_10min/MPD/1280x720p50/V-1280x720p50_6bar_2ch_libx264_high_yuv420p_gop100_bit5M_seg0_frag5_A1-384k_libfdk_lc_48k_2ch_eng_A2-448k_libfdk_lc_48k_6ch_ger.mpd',
  dash_p7: 'http://hbbtv.prosieben.de/extern/castlabs/videos/pro7trailerplain/stream.mpd',

  dash_drm: 'http://hbbtv.prosieben.de/extern/castlabs/videos/pro7trailer/stream.mpd',
  dash_drm_tos: 'http://hbbtv.prosieben.de/extern/castlabs/videos/tos/Manifest.mpd.bak',
  dash_drm_tos_bento4: 'http://hbbtv.prosieben.de/extern/castlabs/videos/tos-bento4/stream.mpd',
  sannies: 'http://192.168.248.150:8080/content/output/stream.mpd'
};
var hbbtv12 = false;
var vid = null;
var vidtimer = null;
var testTimeout = null;
var expected = [];

function runStep(name) {
  try {
    if (vidtimer) {
      clearTimeout(vidtimer);
      vidtimer = null;
    }
    vid.stop();
  } catch (e) {
    // ignore
  }
  vid.data = vidurls[name.replace(/^playvid_/, '')];
  try {
    vid.play(1);
    showVidData();
    showStatus(true, 'Video should be playing now');
  } catch (e) {
    showStatus(false, 'Video playback failed: ' + e);
  }
}

window.onload = function () {
  menuInit();
  registerKeyEventListener();
  initApp();
  showVid();
  setInstr('Please run all steps in the displayed order. Navigate to the test using up/down, then press OK to start the test.');
  try {
    var cfg = document.getElementById("oipfcfg").configuration;
    var uagent = "" + navigator.userAgent;
    if (uagent.indexOf("HbbTV/") >= 0 && uagent.indexOf("HbbTV/1.1") < 0 && (cfg.preferredAudioLanguage || cfg.preferredSubtitleLanguage)) {
      hbbtv12 = true;
    }
  } catch (ignore) {
  }
};
function showVid() {
  vid = document.createElement("object");
  vid.type = 'application/dash+xml';
  vid.setAttribute("type", vid.type);
  vid.setAttribute("style", "position: absolute; left: 0px; top: 0px; width: 416px; height: 234px; outline: transparent;");
  vid.style.position = "absolute";
  vid.style.left = "0px";
  vid.style.top = "0px";
  vid.style.width = "416px";
  vid.style.height = "234px";
  vid.style.outline = "transparent";
  document.getElementById("vidcontainer").appendChild(vid);
}
function showVidData() {
  if (vidtimer) {
    clearTimeout(vidtimer);
    vidtimer = null;
  }
  document.getElementById("vidstatus").innerHTML = 'Video play state = ' + PLAYSTATES[vid.playState] + (vid.playState === 6 ? ' (' + PLAYERRORS[vid.error] + ')' : '') + '<br />play position = ' + vid.playPosition;
  vidtimer = setTimeout(function () {
    vidtimer = null;
    showVidData();
  }, 1000);
}
function gotoPos(scnds) {
  try {
    vid.seek(scnds * 1000);
    setInstr('Waiting for playback to resume to check reported playback position...');
    testPos(scnds);
  } catch (e) {
    showStatus(false, 'Cannot change playback position');
  }
}
function testPos(scnds) {
  if (testTimeout) {
    clearTimeout(testTimeout);
  }
  testTimeout = setTimeout(function () {
    testTimeout = false;
    if (vid.playState && (vid.playState == 2 || vid.playState == 3 || vid.playState == 4)) {
      testPos(scnds); // delay test, we are not playing yet.
      return;
    }
    var secs = isNaN(vid.playPosition) ? -1 : Math.floor(vid.playPosition / 1000);
    if (secs >= 0 && secs >= (scnds - 2) && secs <= (scnds + 10)) {
      showStatus(true, 'Video playback position is at ' + secs + ' seconds');
    } else {
      showStatus(false, 'Seek succeeded, but reported playbackposition is at ' + secs + ' seconds');
    }
  }, 2000);
}
function compareComponent(checkvc, expectedIdx, intType) {
  var key, vcvalue, expectStream = expected[expectedIdx];
  try {
    if (intType !== checkvc.type) {
      showStatus(false, 'call getComponents(' + intType + ') returned invalid component of type ' + checkvc.type);
      return -1;
    }
    for (key in expectStream) {
      if (key === 'displayname') {
        continue; // skip this
      }
      vcvalue = 'undefined';
      eval('vcvalue = checkvc.' + key + ';');
      if (key === 'language') {
        vcvalue = vcvalue.toLowerCase();
      }
      if (key === 'audioChannels') {
        vcvalue = Math.floor(vcvalue);
      }
      if (vcvalue !== expectStream[key]) {
        return 0;
      }
    }
  } catch (e) {
    showStatus(false, 'problem while accessing properties of getComponents(' + intType + ')');
    return -1;
  }
  return 1;
}
function getActiveComponentIdx() {
  var i, activevc, found, intType = vid.COMPONENT_TYPE_AUDIO;
  try {
    activevc = vid.getCurrentActiveComponents(intType);
  } catch (e) {
    showStatus(false, 'error while calling getCurrentActiveComponents(' + intType + ') after selecting component');
    return false;
  }
  if (!activevc || activevc.length !== 1) {
    return -2;
  }
  for (i = 0; i < expected.length; i++) {
    found = compareComponent(activevc[0], i, intType);
    if (found > 0) {
      return i;
    }
  }
  return -1;
}
function showActiveComponent() {
  var i;
  getComponents();
  i = getActiveComponentIdx();
  if (i < -1) {
    showStatus(true, "No component is currently active.");
  } else if (i === -1) {
    showStatus(false, "Unable to determine active component.");
  } else if (i === false) {
    // error already displayed
  } else {
    showStatus(true, "Active component: " + expected[i].displayname);
  }
}
function getComponents() {
  var intType = vid.COMPONENT_TYPE_AUDIO, vc = false, i, j;
  var expectStream, checkvc, found, key, descrStr;
  if (intType < 0 || (typeof intType) === 'undefined') {
    showStatus(false, 'COMPONENT_TYPE_AUDIO undefined');
    return false;
  }
  try {
    vc = vid.getComponents(intType);
  } catch (e) {
    showStatus(false, 'call getComponents failed.');
    return false;
  }
  if (!vc) {
    showStatus(false, 'call getComponents(' + intType + ') returned null.');
    return false;
  }
  if (vc.length !== expected.length) {
    showStatus(false, 'call getComponents(' + intType + ') returned ' + vc.length + ' elements, expected are ' + expected.length + ' elements.');
    return false;
  }
  var foundStreams = [];
  for (i = 0; i < expected.length; i++) {
    expectStream = expected[i];
    foundStreams[i] = null;
    for (j = 0; j < vc.length; j++) {
      checkvc = vc[j];
      found = compareComponent(checkvc, i, intType);
      if (found < 0) {
        return false; // compare failed
      }
      if (found) {
        foundStreams[i] = checkvc;
        break;
      }
    }
    if (foundStreams[i] === null) {
      descrStr = 'type=' + intType;
      for (key in expectStream) {
        if (key === 'displayname') {
          continue; // skip this
        }
        descrStr += ', ' + key + '=' + expectStream[key];
      }
      showStatus(false, 'cannot find the following AVComponent: ' + descrStr);
      return false;
    }
  }
  return foundStreams;
}
function selectComponents(index) {
  var vc = getComponents();
  var i, shouldBe, activevc, intType = vid.COMPONENT_TYPE_AUDIO;
  if (!vc) {
    showStatus(false, 'no components');
    return false;
  }
  if (!hbbtv12) {
    for (i = 0; i < vc.length; i++) {
      try {
        vid.unselectComponent(vc[i]);
      } catch (e) {
        showStatus(false, 'cannot unselect component ' + vc[i]);
        return false;
      }
    }
  }
  if (hbbtv12 && index < 0) {
    // We need to use unselectComponent(componentType) in HbbTV 1.2 due to
    // OIPF DAE Vol. 5, section 7.16.5.1.3, unselectComponent(AVComponent):
    // "If property preferredAudioLanguage in the Configuration object
    // (see section 7.3.1.1) is set then unselecting a specific component
    // returns to the default preferred audio language."
    // Only this call ensures that no component of this type is selected.
    try {
      vid.unselectComponent(intType);
    } catch (e) {
      showStatus(false, 'cannot unselect component by type ' + vc[i]);
      return false;
    }
  }
  setTimeout(function () {
    selectComponentsStage2(index, vc);
  }, (hbbtv12 && index >= 0) ? 100 : 2000);
}
function selectComponentsStage2(index, vc) {
  var i, shouldBe, activevc, intType = vid.COMPONENT_TYPE_AUDIO;
  try {
    activevc = vid.getCurrentActiveComponents(intType);
  } catch (e) {
    showStatus(false, 'error while calling getCurrentActiveComponents(' + intType + ')');
    return false;
  }
  if (activevc && activevc.length !== 0 && (!hbbtv12 || index < 0)) {
    showStatus(false, 'getCurrentActiveComponents returned a non-empty array after unselecting all components');
    return false;
  }
  if (index >= 0 && index < vc.length) {
    shouldBe = vc[index];
    try {
      vid.selectComponent(shouldBe);
    } catch (e) {
      showStatus(false, 'cannot select component ' + index + ' = ' + vc[index]);
      return false;
    }
    setTimeout(function () {
      var i = getActiveComponentIdx();
      if (i === -2) {
        showStatus(false, 'error while calling getCurrentActiveComponents(' + intType + ') after selecting component');
      } else if (i === -1) {
        showStatus(false, 'getCurrentActiveComponents returned invalid component after selecting desired component');
      } else if (i === false) {
        // error already displayed
      } else if (i === index) {
        showStatus(true, 'component should now be selected.');
      } else {
        showStatus(false, "Active component: " + expected[i].displayname + ", expected: " + expected[index].displayname);
      }
    }, 2000);
    setInstr('Waiting for component selection to finish...');
    return;
  }
  showStatus(true, 'component should now be selected.');
}
function handleKeyCode(kc) {
  if (kc == VK_UP) {
    menuSelect(selected - 1);
    return true;
  } else if (kc == VK_DOWN) {
    menuSelect(selected + 1);
    return true;
  } else if (kc == VK_ENTER) {
    var liid = opts[selected].getAttribute('id');
    if (liid == 'exit') {
      document.location.href = 'index.php';
    } else {
      runStep(liid);
    }
    return true;
  }
  if (kc == VK_YELLOW) {
    document.getElementById('title').innerHTML = 'RELOADING';
    setTimeout(function() {
      window.location.href = window.location.href.split('?')[0] + "?t=" + Math.round(Math.random() * 1000000);
    }, 300);
  }

  return false;
}
