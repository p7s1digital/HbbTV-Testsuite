<?php
$ROOTDIR='..';
require("$ROOTDIR/base.php");
sendContentType();
openDocument();

?>
<script type="text/javascript" src="app.js"></script>

</head>
<body>

<div>
    <object id="drmplugin" type="application/oipfDrmAgent" width="0" height="0"></object>
    <object id="appmgr" type="application/oipfApplicationManager"
            style="position: absolute; left: 0px; top: 0px; width: 0px; height: 0px;"></object>
    <object id="oipfcfg" type="application/oipfConfiguration"
            style="position: absolute; left: 0px; top: 0px; width: 0px; height: 0px;"></object>

</div>
<div style="left: 0px; top: 0px; width: 1280px; height: 720px; background-color: #132d48;"/>

<div style="left: 700px; top: 36px; width: 250px; height: 50px; background-image: url(castlabs-logo.png);"></div>
<div id="vidcontainer" style="left: 700px; top: 220px; width: 416px; height: 234px; background-color: #000000;"></div>

<div id="title" class="txtdiv txtlg" style="left: 110px; top: 60px; width: 500px; height: 30px;">MIT-xperts HBBTV tests</div>

<div id="instr" class="txtdiv" style="left: 700px; top: 114px; width: 400px; height: 360px;"></div>
<div id="vidstatus" class="txtdiv" style="left: 700px; top: 460px; width: 416px;"></div>
<ul id="menu" class="menu" style="left: 100px; top: 100px;">
    <li id="playvid_dash_irt">IRT DASH</li>
    <li id="playvid_dash_drm_dolby">Dolby DASH + DRM</li>
    <li id="playvid_dash_philipp">Philipp DASH</li>
    <li id="playvid_dash_drm_philipp">Philipp DASH + DRM</li>
    <li id="playvid_dash_drm_tos">DASH + DRM TOS</li>
    <li id="playvid_dash_drm_tos_bento4">DASH + DRM TOS (bento4)</li>
    <li id="playvid_dash_p7">DASH P7S1 Trailer</li>
    <li id="playvid_dash_drm">DASH + DRM P7S1 Trailer</li>
</ul>
<div id="status" style="left: 700px; top: 530px; width: 400px; height: 160px;"></div>
<div id="hint" class="txtdiv" style="left: 100px; top: 420px; width: 400px; height: 260px;">DRM Playback. The DUT SHALL
    correctly decode and playback the audio and video content IF DRM system is supported.
</div>

</body>
</html>
