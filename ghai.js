// ==UserScript==
// @name         Zimek Alis Tools
// @description  players info
// @namespace    http://tampermonkey.net/
// @version      2.0
// @author       Zimek
// @match        http://alis.io/*
// @match        *://*.alis.io/*
// @run-at       document-end
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* global sweetAlert, serverExtra, getHighestScore, playerDetails, userid, conn, myApp, updatePlayerDetails, emojisArr, moment, escapeHtml, errors, chatRoom, gayInterval, updateLbDiv, getLB, leaderboardTeamColorson, window */

$("li#bots-si").remove();
$("li#startmass-si").css("padding-bottom", "170px")

$("div#ad_main").remove(); //Adblock

// hacks
var playerSettings = {
    "normal": {
        "speed": 1,
        "recombineTime": 0,
        "maxCells": 64,
        "maxSize": 22500,
        "isToxic": 0,
        "ignoreBorders": 0,
        "decayRate": 0.002,
        "staticDecay": 0,
        "startMass": 1000,
    },
    "admin": {
        "speed": 0.00001,
        "recombineTime": 0,
        "maxCells": 1,
        "isAdmin": 1,
        "maxSize": 20000,
        "decayRate": -0.0001,
        "isUnpopable": 1,
        "staticDecay": 0,
        "isToxic": 0,
        "ignoreBorders": 1,
        "viewBaseX": 20000,
        "ejectSize": 300,
        "ejectSizeLoss": 0,
        "viewBaseY": 20000,
        "startMass": 4000,
    },
    "special": {
        "speed": 0.00001,
        "recombineTime": 0,
        "isUnpopable": 1,
        "maxCells": 1,
        "maxSize": 20000,
        "decayRate": -0.0001,
        "staticDecay": 0,
        "isToxic": 0,
        "ignoreBorders": 1,
        "viewBaseX": 10000,
        "ejectSize": 1,
        "ejectSizeLoss": 0,
        "viewBaseY": 10000,
        "startMass": 4000,
    },
    "frozen": {
        "speed": 0.00001,
        "recombineTime": 0,
        "maxCells": 1,
        "maxSize": 20000,
        "decayRate": -0.0001,
        "staticDecay": 0,
        "isToxic": 0,
        "ignoreBorders": 0,
        "viewBaseX": 10000,
        "ejectSize": 5,
        "ejectSizeLoss": 0,
        "viewBaseY": 10000,
        "startMass": 3000,
    },
    "selffeed": {
        "speed": 1,
        "recombineTime": 0,
        "maxCells": 32,
        "maxSize": 22500,
        "decayRate": -0.0001,
        "staticDecay": 0,
        "isToxic": 0,
        "ignoreBorders": 0,
        "ejectSize": 100,
        "ejectSizeLoss": 30,
        "startMass": 3000,
    },
    "fast": {
        "speed": 10,
        "recombineTime": 0,
        "maxCells": 1,
        "maxSize": 7000,
        "decayRate": -0.02,
        "staticDecay": 0,
        "isToxic": 0,
        "ignoreBorders": 1,
        "viewBaseX": 10000,
        "viewBaseY": 10000,
        "startMass": 5000,
    }
};

/* Complete list of available per-player detail settings:
# grep -roP "playerDetails\..+(\s+)" . | cut -d ' ' -f 1 | grep -oP playerDetails.+ | tr -d ');,' | sort | uniq
playerDetails.decayModifier - internal game mode use, changes do nothing
playerDetails.decayRate - only used if staticDecay is 1. values from 0.9 (extremely fast decay) to -1 (extremely fast growth)
playerDetails.dynamicDecay - internal game use, changes do nothing
playerDetails.hasToxicWall - razors gayest invention yet
playerDetails.ignoreBorders - can go outside map borders
playerDetails.isAdmin - enables/disables the use of hacks
playerDetails.isToxic - makes players toxic feed shrink eaters
playerDetails.isTroll - only used pre-connect to determine trollability of player
playerDetails.maxCells - number of cells player can be split into
playerDetails.maxSize - max size in RADIUS of cell, not mass
playerDetails.nameColor - array of RGB colors, can not be altered in game
playerDetails.nameColor.b - blue
playerDetails.nameColor.g - green
playerDetails.nameColor.r - red
playerDetails.recombineTime - how quickly can this player recombine, 30 is slow, 0 is instant
playerDetails.scoreDivisor - internal only, changes do nothing.
ejectSize, ejectSizeLoss, ejectDistance all pretty self explanatory
playerDetails.speed - how fast is the player, 1 for normal, 10 for very fast
playerDetails.startMass - starting size in cell mass
playerDetails.startSize - starting size in cell radius
playerDetails.staticDecay - off by default, uses dynamic decay formula based on total server mass. 1 for enabled a constant decay rate
playerDetails.sub - SUBJECT of json web token, used to identify their account across games
playerDetails.totalScore - internal to track last total score of the player
playerDetails.validFrom - internal only used during connection and token vlidation
playerDetails.viewBaseX - 1920 default, 10000 for massive view
playerDetails.viewBaseY - 1080 default, 10000 for massive view
You can do /set playerID settingName newValue to alter an individual players value above
Or you can do /playerDetails playerID to see their current values for all of these in console
*/
/* List of server-wide changes:
Coming soon...
*/
// Counter to roll through levels of hackery (index = nextHack modulous hackCount)
var nextHack = 1;

// Mass toggle values
var massToggle = [2000,22000];
var nextMass = 1;


/*<div id="lilinfos" style="z-index: 99999999999999999;">
MP: <span style="font-weight: bold;" id="lilMYPID"></span><br>
TP: <span style="font-weight: bold;" id="lilTPID"></span><br>
<br>
Name: <span style="font-weight: bold;" id="lilTNAME"></span><br>
LVL: <span style="font-weight: bold;" id="lilTLVL"></span>
<span style="font-weight: bold;" id="lilADMIN"></span><br>
</div>*/

// Add the dom elements we want to display information in

$(function() {
    // Fix the max length for the skin url box
    $("#skinurl").attr('maxlength','999999999');
    // Add the hack div to the overlay2 div
    $("body").prepend(`<div id="hackdiv">
<button id="showInfo" class="hackBtnShow">Info</button><img id="skinDisplayHack" src="http://i.imgur.com/Cig2GRy.png" width="95px" style="float:right;display:none">

<div id="infos" style="z-index: 99999999999999999;display:none;">
My PID: <span style="font-weight: bold;" id="yourplayerid"></span><br>
Target PID: <span style="font-weight: bold;" id="targetplayerid"></span><br>
Target Name: <input class="hackL" style="width: 140px;height: 22px;font-size: 14px;" id="hackName"><button class="copyBtn" id="copyName"><img src="https://i.imgur.com/2onKI5k.png" width="20px"></button><br>
Target UID: <input class="hackL" style="width: 90px;height: 21px;font-size: 14px;" id="hackUID"><button class="copyBtn" id="copyUID"><img src="https://i.imgur.com/2onKI5k.png" width="20px"></button><br>
Target Skin: <input class="hackL" style="width: 185px;font-size: 11px;" id="hackSkin"><button class="copyBtn" id="copySkin"><img src="https://i.imgur.com/2onKI5k.png" width="20px"></button><br>
Target teamHash: <input class="hackL" style="width: 210px;font-size: 11px;" id="hackTeam"><button class="copyBtn" id="copyTeam"><img src="https://i.imgur.com/2onKI5k.png" width="20px"></button><br>
<div>
<div style="float:left;">
Target Level: <span style="font-weight: bold;" id="hackLevel"></span><br>
Target Total XP: <span style="font-weight: bold;" id="hackTXP"></span><br>
Target Slb XP: <span style="font-weight: bold;" id="hackSXP"></span><br>
Target Slb coins: <span style="font-weight: bold;" id="hackScoins"></span><br>

Target isAdmin: <span style="font-weight: bold;" id="hackAdmin"></span></div>
<div style="float:right">
<div style="margin-top: 15px;margin-right: 15px;">
<a class="hackLinked" target="_blank" id="linkUpgrades">Upgrades</a>
<a class="hackLinked" target="_blank" id="linkScore">Score</a><br>
<center><a class="hackLinked" href="https://www.md5online.org/md5-decrypt.html" style="font-size: 15px;" target="_blank" id="linkMD5">MD5</a></center>
</div>
</div>
</div>
</div></div>`);

$("head").append(`<style>
#hackdiv{position: absolute;padding: 15px;top: 37px;left: 10px;z-index: 9999999999;border-radius: 20px;background-color: rgba(0,0,0,0.5);transition-duration: 0.1s;opacity: 0.5;}
#hackdiv:hover{opacity: 0.9;border-radius: 15px;background-color: rgba(0,0,0,0.7)}
.hackBtnShow{padding: 7px;background-color: #212121;border-radius: 0px;border: 0px solid #212121;color: #d1d1d1;font-size: 17px;transition-duration: 0.15s;}
.hackBtnShow:hover{cursor:pointer;background-color: #202020;color: white;border-radius: 5px;}
.hackBtnShow:active{color: #7fff94;}
.hackLinked{font-size: 14px;color:#91fff5;padding: 5px;}
.hackLinked:active{color: #7fff94;}
.hackL{background-color: #303030;outline: none;transition-duration: 0.4s;border: transparent;padding: 5px;font-size: 15px;width: 300px;color: #d1d1d1;};
.hackL:focus{color: white;}
::selection {
       background-color: #93fffd;
       color: #000;
}
.overLa{margin-top: 20%;background:#212121;border-radius:2px;display:none;height:300px;margin-left:30%;margin-right:-30px;padding:0;position:absolute;width:395px;z-index:300}
#chatroom{overflow-x: hidden;word-wrap: break-word}
.copyBtn{width: 21px;height: 21px;padding: 3px;background-color: #202020;border-radius: 5px;border: 0px solid #212121;transition-duration: 0.15s;margin-left: 2px;}
.copyBtn{cursor:pointer;background-color: #191919;border-radius: 5px;}
.copyBtn:active{background-color: #7fff94;}

</style>`)

    setTimeout(function(){
$("#hideall").css("width","34%");
$("button#infobtn").css("width","33%");
$(`<button id="hackUsers" class="zimekbtn2" style="width: 33%;height: 70px;"><img src="https://i.imgur.com/weHZAaD.png" width="50px"></button>`).insertAfter("button#hideall");
$(`
<div id="hackUserPanel" class="overLa" style="display: none;z-index: 9999999;box-shadow: 0 -5px 10px -5px black;">
<div style="padding: 20px;">
<div>
User ID: <input id="userHackID" class="hackL" style="width: 120px;height: 30px;font-size: 18px;"><button id="searchUser" class="copyBtn" style="padding: 5px;width: 80px;height: 30px;color: white;font-size: 16px;margin-left: 5px;">Search</button><br>
<br>
User Level: <span style="font-weight: bold;" id="userHackLevel"></span><br>
User Total XP: <span style="font-weight: bold;" id="userHackTXP"></span><br>
User Season XP: <span style="font-weight: bold;" id="userHackSXP"></span><br>
User Season coins: <span style="font-weight: bold;" id="userHackScoins"></span><br><br>

<a class="hackLinked"  style="font-size: 22px;" target="_blank" id="userHackUpgrades">Upgrades</a>
<a class="hackLinked" style="font-size: 22px;margin-left: 10px;" target="_blank" id="userHackScore">Score</a>
<button class="zimekbtn2" id="closeHacks" style="color: white;font-size: 22px;padding: 10px;margin-left: 20px;">Close</button>

</div>
</div>
</div>
`).insertBefore("#settingsoverlays");

$(document).ready(function(){
    $("#hackUsers").click(function(){
        $("#hackUserPanel").toggle();
    });

    $("#closeHacks").click(function(){
        $("#hackUserPanel").toggle();
    });

    $("#searchUser").click(function(){
$.getJSON(`http://api.alis.io/api/users/${document.getElementById('userHackID').value}/score`, function(data) {
    var seasonCoins = data.score_period/100*3;
        document.getElementById('userHackLevel').innerHTML = data.level;
        document.getElementById('userHackSXP').innerHTML = data.score_period;
        document.getElementById('userHackTXP').innerHTML = data.score;
        document.getElementById('userHackScoins').innerHTML = seasonCoins.toFixed(0);

});
$("#userHackUpgrades").attr("href", `http://api.alis.io/api/users/${document.getElementById('userHackID').value}/upgrades`);
$("#userHackScore").attr("href", `http://api.alis.io/api/users/${document.getElementById('userHackID').value}/score`);
    });


});


}, 2000);

/*Target customImages: <input class="hackL" style="width: 200px;font-size: 11px;" id="hackCI"><button id="copyCI">C</button><br>
Target Hat: <input class="hackL" style="width: 200px;font-size: 11px;" id="hackHat"><button id="copyHat">C</button><br>*/

    $(`<a href="https://www.md5online.org/md5-decrypt.html" target="_blank" style="right: 10;position: absolute;font-size: 25px;bottom: 15;z-index: 9999;
">MD5</a>`).insertBefore("#pp");
// make greeb sad
    $("iframe").remove();
    $('#hackdiv').css("margin-top", "55px");
    $("video").remove();
    $("#ad_main").remove();
});

window.sendChat = function(key) {
    console.log(key)
    key = key.trim();
    if (key.length < 400 && (key.length > 0 && window.webSocket)) {
        var data = new DataView(new ArrayBuffer(2 + 2 * key.length));
        var byteOffset = 0;
        data.setUint8(byteOffset++, 99);
        data.setUint8(byteOffset++, 0);
        var characterPosition = 0;
        for (; characterPosition < key.length; ++characterPosition) {
            data.setUint16(byteOffset, key.charCodeAt(characterPosition), true);
            byteOffset += 2;
        }
        window.webSocket.send(data);
    }
};

//text((playerDetails[344].teamHash))
// Wrapper to send commands
function sendHack(command) {
    //console.log('SENDING: ' + command);
    unsafeWindow.sendChat(command);
}
//window.playerDetails[$("#targetplayerid").text()].name


$(document).ready(function(){

    $("#showInfo").click(function(){
        $("#infos").toggle();
       // $("#lilinfos").toggle();
        $("#skinDisplayHack").toggle();
    }); $("#showHacks").click(function(){
        $("#hacks").toggle();
    });
    $("#hackUsers").click(function(){
        $("#hackUserPanel").toggle();
        $("#zimekmain").toggle();
    });




$("#copyName").click(function(){
        $("#hackName").select();
  document.execCommand("copy");
    });$("#copySkin").click(function(){
        $("#hackSkin").select();
  document.execCommand("copy");
    });$("#copyUID").click(function(){
        $("#hackUID").select();
  document.execCommand("copy");
    });$("#copyTeam").click(function(){
        $("#hackTeam").select();
  document.execCommand("copy");
    });$("#copyNC").click(function(){
        $("#hackNC").select();
  document.execCommand("copy");
    });$("#copyCI").click(function(){
        $("#hackCI").select();
  document.execCommand("copy");
    });$("#copyHat").click(function(){
        $("#hackHat").select();
  document.execCommand("copy");
    });
});


// Wrapper to send commands targeting to player(s)
function sendTargetHack(command, targets, params) {
    // If params is an array, join it with spaces
    if (Array.isArray(params)) {
        params = params.join(' ');
    }
    // if the targets are an array, send it to multiple targets
    if (Array.isArray(targets)) {
        for(var target in targets) {
            sendHack('/' + command + ' ' + targets[target] + ' ' + params);
        }
    } else {
        sendHack('/' + command + ' ' + targets + ' ' + params);
    }
}
unsafeWindow.sendHack = function (command, params) { sendTargetHack(command, JSON.parse($('#targetplayerid').html()), params); };

// helper for console fuckery
unsafeWindow.setAll = function(key, value) {
    // Get the json targets on our target player id list
    var targets = JSON.parse($('#targetplayerid').html());
    sendTargetHack('set', targets, [ key, value ]);
};

// Update our player ID every few seconds
var updateMyID = setInterval(function(){
    sendHack('/getmyid');
  //  $("#lilMYPID").text($("#yourplayerid").text())
}, 10000);

// Keypress handler
function keydown(event) {
    //console.log(event); // for debugging
    // Do not process keypress events NOT on the body element itself
    if(event.target.nodeName != "BODY") {
       return;
    }
    var command = '';

    // if we dont know our player id, request it
    if (!$('#yourplayerid').html()) {
        sendHack('/getmyid');
    }
    /*    if (!$('#lilMYPID').html()) {
        sendHack('/getmyid');
    }*/

    // This is ` or ~ key
    if (event.keyCode == 192) {
        $('#hackstatus').html('Set target = self');
        $('#targetplayerid').html(JSON.stringify($('#yourplayerid').html()));
    }

    // if the target ID is not defined, no commands will work
    if (!$('#targetplayerid').html()) {
        $('#hackstatus').html('target not set');
        return;
    }

    // Get the json targets on our target player id list
    var targets = JSON.parse($('#targetplayerid').html());
    /*
    // IF the targets list is an array of players, make sure our id is not in the target list
    if (Array.isArray(targets)) {
        var myID = parseInt($('#yourplayerid').html());
        var myIndex = targets.indexOf(myID);
        if (myIndex) {
            targets.splice( myIndex, 1 );
        }
    }*/
    // This is 1 key, toggle between hacks
    if (event.keyCode == 49) {
        // calculate index of hacks to apply
        var hackIndex = nextHack % Object.keys(playerSettings).length;
        var hackKey = Object.keys(playerSettings)[hackIndex];
        var settings = playerSettings[hackKey];
        // apply hacks
        for (var k in settings) {
            sendTargetHack('set', targets, [ k, settings[k] ]);
        }
        // set next hack to the next index
        nextHack++;
        $('#hackstatus').html('set target hacks to: ' + hackKey);
    }

    // 2 key, teleport to mouse location
    if (event.keyCode == 50) {
        sendTargetHack('teleport', targets, [ mouseX, mouseY ]);
        $('#hackstatus').html('teleported target');
    }

    // 3 key, toggle mass hack 2k/18k
    if (event.keyCode == 51) {
        var massKey = nextMass % massToggle.length;
        sendTargetHack('mass', targets ,massToggle[massKey]);
        $('#hackstatus').html('mass set to ' + massToggle[massKey]);
        nextMass++;
    }

    // 5 key, spawns virus cluster at mouse location
    if (event.keyCode == 53) {
        var sizes = [100, 200, 300, 500, 700, 900, 1000, 1300, 1600, 1900, 2200, 2500, 2800, 3000, 3100];
        sizes.forEach(function(size) {
            command = "/virus " + mouseX + " " + mouseY + " " + size;
            sendHack(command);
        });
        $('#hackstatus').html('spawned virus cluster');
    }

    // 4 key, spawns 1 virus
    if (event.keyCode == 52) {
        var sizesvir = [100];
        sizesvir.forEach(function(size) {
            command = "/virus " + mouseX + " " + mouseY + " " + size;
            sendHack(command);
        });

        $('#hackstatus').html('spawned virus cluster');
    }

    // 6 key, kill target(s)
    if (event.keyCode == 55) {
        sendTargetHack('kill', targets, '');
        $('#hackstatus').html('killed target player(s)');
        nextMass++;
    }
}

// Get target cell ID
function getClosestCellID(X, Y) {
    $('#hackstatus').html('searching for cell id near mouse ' + X + ',' + Y);
    var cells = unsafeWindow.allCells;

    // Loop through all the cells and extract JUST the players
    var playerCells = [];
    for (var i in cells) {
        var playerCell = cells[i];
        // Ignore food pellets & tiny cells
        if (playerCell.isFood || playerCell.size < 35) {
            continue;
        }
        // F is old agarplus obfuscated isVirus flag
        if (playerCell.f || playerCell.isVirus) {
            continue;
        }
        // Calculate the x and y distances
        var distx = playerCell.x - X;
        var disty = playerCell.y - Y;
        // calculates distance between two X,Y points
        var distance = Math.sqrt( Math.pow(distx, 2) + Math.pow(disty, 2) );
        // save our player cell info
        var razorCell = {};
        razorCell.id = i;
        razorCell.name = playerCell.name;
        razorCell.distance = distance;
        razorCell.size = playerCell.size;
        razorCell.x = playerCell.x;
        razorCell.y = playerCell.y;
        playerCells.push(razorCell);
    }
    // Sort the cells by distance ascending
    playerCells.sort(function (a, b) { return a.distance - b.distance; });
    //console.log('closest player identified: ');
    //console.table(playerCells.slice(0, 1));
    if (playerCells.length) {
        return playerCells[0].id;
    } else {
        return 0;
    }
}

// left Mouse click handler
function leftMouseClick()
{
    var cellid = getClosestCellID(mouseX, mouseY);
    if (cellid) {
        $('#hackstatus').html('requested player id of cell ' + cellid);
        var cell = unsafeWindow.allCells[cellid];
        if(cell.extra && cell.extra.pid) {
            $('#targetplayerid').html(JSON.stringify(cell.extra.pid));
           // $('#lilTPID').html(JSON.stringify(cell.extra.pid));
            $('#hackstatus').html('target player switched to ' + $('#targetplayerid').html());
            let hackName = unsafeWindow.playerDetails[$("#targetplayerid").text()].name;
            let hackSkin = unsafeWindow.playerDetails[$("#targetplayerid").text()].skinUrl;
            let hackUID = unsafeWindow.playerDetails[$("#targetplayerid").text()].uid;
            let hackTeam = unsafeWindow.playerDetails[$("#targetplayerid").text()].teamHash;
            let hackAdmin = unsafeWindow.playerDetails[$("#targetplayerid").text()].isAdmin;
if(!hackName){hackName = "Unnamed"};
if(!hackSkin){hackSkin = "No skin";setTimeout(function(){hackSkin = "https://i.imgur.com/1kK29wd.png"}, 100)};
if(!hackUID){hackUID = "No account"};
if(hackTeam === "d41d8cd98f00b204e9800998ecf8427e"){hackTeam = "No tag"};
if(hackTeam === "4dd507ad2b564b40b7a5c2ef8eb81a4e"){hackTeam = "Team2"};if(hackTeam === "58e6f2c12f1d05253b663c6744b9e93c"){hackTeam = "Team3"};
if(hackTeam === "fed2bcbeeaec391820d173aa2cd55a31"){hackTeam = "Team4"};if(hackTeam === "70fdd579d196e578d17aab6752878071"){hackTeam = "Team5"};
if(hackTeam === "69b7196bfcf1b2d32dec6ceb3f22c7fb"){hackTeam = "Team6"};if(hackTeam === "73621719584c49dbce1ab9c47575c93e"){hackTeam = "Team7"};
if(hackTeam === "6e5f8ee29ce0e7becbbe45fd7ee8bffc"){hackTeam = "Team8"};if(hackTeam === "92ef24bf0b11032c3ee3d2f29a07f0fe"){hackTeam = "Team9"};
if(hackTeam === "060dba505f333ed63bfb1c1afcdcb737"){hackTeam = "Team10"};if(hackTeam === "c8867457125653a9b4e61a12aa67df47"){hackTeam = "Team1"};
if(hackTeam === "caf1a3dfb505ffed0d024130f58c5cfa"){hackTeam = "321"};if(!hackAdmin){hackAdmin = "0"};
        document.getElementById('hackName').value = hackName;
      //  document.getElementById('lilTNAME').innerHTML = hackName;
        document.getElementById('hackSkin').value = hackSkin;
        document.getElementById('hackUID').value = hackUID;
        document.getElementById('hackTeam').value = hackTeam;
        document.getElementById('hackAdmin').innerHTML = hackAdmin;
      //  if(hackAdmin > 0){document.getElementById('lilADMIN').innerHTML = "Admin: " + hackAdmin;}else{document.getElementById('lilADMIN').innerHTML = " "}
  //  $("#lilMYPID").text($("#yourplayerid").text())
            if(document.getElementById('targetplayerid').innerHTML < 0){
        document.getElementById('hackName').value = "None";
      //  document.getElementById('lilTNAME').innerHTML = "None";
        document.getElementById('hackSkin').value = "None";
        document.getElementById('hackUID').value = "None";
        document.getElementById('hackTeam').value = "None";
        document.getElementById('hackAdmin').innerHTML = "None";
            }
            setTimeout(function(){
$.getJSON(`http://api.alis.io/api/users/${unsafeWindow.playerDetails[$("#targetplayerid").text()].uid}/score`, function(data) {
        document.getElementById('hackLevel').innerHTML = data.level;
          //  document.getElementById('lilTLVL').innerHTML = data.level;
        document.getElementById('hackSXP').innerHTML = data.score_period;
        document.getElementById('hackTXP').innerHTML = data.score;
        var seasonCoins = data.score_period/100*3;
            document.getElementById('hackScoins').innerHTML = seasonCoins.toFixed(0);


                if(document.getElementById('targetplayerid').innerHTML < 0){
        document.getElementById('hackLevel').innerHTML = "None";
        //    document.getElementById('lilTLVL').innerHTML = "None";
        document.getElementById('hackSXP').innerHTML = "None";
        document.getElementById('hackTXP').innerHTML = "None";
            }

});
                if(document.getElementById('hackUID').value === "No account"){
                        document.getElementById('hackAdmin').innerHTML = 0;
      //  document.getElementById('lilTLVL').innerHTML = "No account";
        document.getElementById('hackLevel').innerHTML = 0;
        document.getElementById('hackSXP').innerHTML = 0;
        document.getElementById('hackTXP').innerHTML = 0;
                }
$("#linkUpgrades").attr("href", `http://api.alis.io/api/users/${hackUID}/upgrades`)
$("#linkScore").attr("href", `http://api.alis.io/api/users/${hackUID}/score`)
$("#skinDisplayHack").attr("src", hackSkin)
            }, 200);

      //  document.getElementById('hackCI').value = unsafeWindow.playerDetails[$("#targetplayerid").text()].customImages[0].url + " " + unsafeWindow.playerDetails[$("#targetplayerid").text()].customImages[1].url + " " + unsafeWindow.playerDetails[$("#targetplayerid").text()].customImages[2].url + " " + unsafeWindow.playerDetails[$("#targetplayerid").text()].customImages[3].url;
      //  document.getElementById('hackHat').value = unsafeWindow.playerDetails[$("#targetplayerid").text()].hat;

        } else {
            $('#hackstatus').html('unable to get player id of cell ' + cellid);
        }
    }else{
        $('#hackstatus').html('could not get closest cell id');
    }
}
// middle Mouse click handler
function middleMouseClick()
{
    $('#hackstatus').html('setting target to all CELL IDs');
    // make sure to update the player list when doing this
    playerlist = [];
    command = "/playerlist";
    sendHack(command);
    setTimeout(function() {
        var playerIDs = [];
        for (var key in playerlist) {
            // Skip adding OURSELVES to the middle mouse click list
            if(playerlist[key].id == $('#yourplayerid').html()) {
                continue;
            }
            playerIDs.push(playerlist[key].id);
        }
        if (playerIDs.length) {
            $('#targetplayerid').html(JSON.stringify(playerIDs));
        } else {
            $('#hackstatus').html('Error updating player IDs');
        }
    }, 600);
}

// Add the event listener for key press events
$("body").keydown(keydown);
//window.addEventListener('keyup', keyup);
$("#overlays2").on('mousedown', function(event) {
    //console.log("mouse click event on overlays2 " + event.which);
    //console.log(event);
    if( event.which == 1 ) {
        //event.preventDefault();
        leftMouseClick();
    }
    if( event.which == 2 ) {
        event.preventDefault();
        //middleMouseClick();
    }
});

// global vars to keep stuff in for reference
playerlist = [];
commandlist = [];
playerdetails = [];

// handle server responses to our queries
onMultiChat = function(user, message) {
    if(user == 'SERVER' && message[0] == '/') {
        // remove the leading / and split command at the ": " response
        var split = message.slice(1, message.length).split(': ');
        var command = split[0];
        // remove the command we saved and recombine the array for parsing
        split.splice(0,1);
        var response = split.join().trim();
        // we got an OK response from a command
        if(command == 'ok') { return; }
        // We got our ID back from the server
        if(command == 'playerid') {
            $('#yourplayerid').html(response);
            return;
        }
        // List of supported commands
        if(command == 'commands') {
            commandlist = JSON.parse(response);
            console.log(commandlist);
            return;
        }
        // We got a list of all players from the server
        if(command == 'playerlist') {
            playerlist = JSON.parse(response);
            console.table(playerlist);
            return;
        }
        // We got the servers current configuration
        if(command == 'config') {
            config = JSON.parse(response);
            console.log(config);
            return;
        }
        // We got playerDetails for a client
        if(command == 'playerdetails') {
            playerdetails = JSON.parse(response);
            console.log(playerdetails);
            return;
        }
    }
};
//dildos
$(`
<li id="dildo">
        <a id="dildo">
          <p>Rain</p>
          <img width="20px" src="https://i.imgur.com/KzYUObY.png">
        </a>
      </li>
`).insertAfter("#yt");

$(document).ready(function(){
    $("#dildo").click(function(){
setTimeout(function(){
   $('div.rain').remove();
    console.log("%c[RAIN] Dildos Rain Finished", "background: #222; color: #7fff9a; padding: 3px;font-size: 13px;");
}, 39000);
     });
});
$(document).ready(function(){
    $("#dildo").click(function(){
console.log("%c[RAIN] Running Dildos Rain..", "background: #222; color: #ff7ff0; padding: 3px;font-size: 13px;");
window.rain = (function () {
    var songUrl = "https://nosx.cf/mp3/rainingmen.mp3";
    window.song = new Audio(songUrl);
    window.song.play();
    var t = (function () {
        var z = navigator.appVersion.toLowerCase();
        z = (z.indexOf("msie") > -1) ? parseInt(z.replace(/.*msie[ ]/, "").match(/^[0-9]+/)) : 0;
        return {
            ltIE6: z <= 6 && z != 0,
            ltIE7: z <= 7 && z != 0,
            ltIE8: z <= 8 && z != 0,
            ltIE9: z <= 9 && z != 0,
            ie: z != 0,
            firefox: window.globalStorage,
            opera: window.opera,
            webkit: !document.uniqueID && !window.opera && !window.globalStorage && window.localStorage,
            mobile: /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())
        }
    })();
    var o = "codes";
    var g = 100;
    var u = 2;
    var s = 15;
    var q = 3;
    var w = 1;
    var v = 0;
    var y = "png";
    var j = "http://htmlfreecodes.com/";
    var b = j + o + "/";
    var k = document.body;
    var c = "giffy_bp_" + o;
    var e = new Date().getTime();
    var d = 10;
    var f = 20;
    var l = 50;
    var p = 1000;
    var a = false;
    var r = new Array();
    var n = new Array();
    var x = 0;
    var h = {
        x: 0,
        y: 0
    };
    window[c] = {
        init: function () {
            for (i = 0; i < g; i++) {
                var A = document.createElement("div");
                A.className = "rain";
                A.style.position = "fixed";
                A.style.overflow = "hidden";
                A.style.visibility = "hidden";
                A.style.top = 0;
                A.style.left = 0;
                A.style.zIndex = p + i;
                var z = document.createElement("img");
                z.style.border = "0";
                A.appendChild(z);
                k.appendChild(A);
                r[i] = {
                    obj: A,
                    img: z,
                    action: 0,
                    from: h,
                    to: h,
                    begin: 0,
                    duration: 0
                }
            }
            for (i = 0; i < u; i++) {
                n[i] = new Image();
//                var imageSrc = "https:/" + "/nosx.ml/rain" + (i + 1) + ".png";
                var imageSrc = "https://i.imgur.com/KzYUObY.png"; //zimek was here
                n[i].src = imageSrc;
                //n[i].src = b + "b" + (i + 1) + "." + y + (v == 1 ? "?" + e : "")
            }
            m.action();
            x = setInterval(m.action, d)
        },
        action: function () {
            if (!a) {
                for (C = 0; C < u; C++) {
                    if (n[C].height == 0) {
                        return
                    }
                }
                a = true
            }
            var A = {
                height: m.getViewHeight(),
                width: m.getViewWidth(),
                top: 0,
                bottom: m.getViewHeight()
            };
            for (var C = 0; C < g; C++) {
                switch (r[C].action) {
                case 0:
                    if (m.getRandomNum(l) == 0) {
                        var B = n[m.getRandomNum(u)];
                        r[C].img.src = B.src;
                        var z = m.getRandomNum(A.width - B.width);
                        r[C].from = {
                            x: z,
                            y: 0
                        };
                        r[C].to = {
                            x: z,
                            y: A.height
                        };
                        r[C].begin = new Date() - 0;
                        r[C].duration = A.height * f / s;
                        if (q > 0) {
                            r[C].duration *= (1 + (0.1 * (m.getRandomNum(2) == 0 ? 1 : -1) * m.getRandomNum(q)))
                        }
                        r[C].action = 1;
                        m.move(r[C].obj, r[C].from);
                        m.setVisible(r[C].obj)
                    }
                    break;
                case 1:
                    var D = new Date() - r[C].begin;
                    if (D < r[C].duration) {
                        m.move(r[C].obj, m.easingPos(D, r[C].from, r[C].to, r[C].duration))
                    } else {
                        m.setHidden(r[C].obj);
                        r[C].action = 0
                    }
                    break
                }
            }
        },
        getRandomNum: function (z) {
            return Math.floor(Math.random() * z)
        },
        getViewHeight: function () {
            if (window.innerHeight) {
                return window.innerHeight
            }
            if (document.documentElement && document.documentElement.clientHeight) {
                return document.documentElement.clientHeight
            } else {
                if (document.body && document.body.clientHeight) {
                    return document.body.clientHeight
                }
            }
            return 0
        },
        getViewWidth: function () {
            if (window.innerWidth) {
                return window.innerWidth
            }
            if (document.documentElement && document.documentElement.clientWidth) {
                return document.documentElement.clientWidth
            } else {
                if (document.body && document.body.clientWidth) {
                    return document.body.clientWidth
                }
            }
            return 0
        },
        getViewTop: function () {
            if (window.scrollY) {
                return window.scrollY
            }
            if (window.pageYOffset) {
                return window.pageYOffset
            }
            if (document.documentElement && document.documentElement.scrollTop) {
                return document.documentElement.scrollTop
            } else {
                if (document.body && document.body.scrollTop) {
                    return document.body.scrollTop
                }
            }
            return 0
        },
        getViewBottom: function () {
            return m.getViewTop() + m.getViewHeight()
        },
        getViewLeft: function () {
            if (window.scrollX) {
                return window.scrollX
            }
            if (window.pageXOffset) {
                return window.pageXOffset
            }
            if (document.documentElement && document.documentElement.scrollLeft) {
                return document.documentElement.scrollLeft
            } else {
                if (document.body && document.body.scrollLeft) {
                    return document.body.scrollLeft
                }
            }
            return 0
        },
        getViewRight: function () {
            return m.getViewLeft() + m.getViewWidth()
        },
        easing: function (A, C, B, z) {
            return (B - C) * A / z + C
        },
        easingPos: function (A, C, B, z) {
            return {
                x: m.easing(A, C.x, B.x, z),
                y: m.easing(A, C.y, B.y, z)
            }
        },
        move: function (z, A) {
            z.style.top = A.y + "px";
            z.style.left = A.x + "px"
        },
        setHidden: function (z) {
            z.style.visibility = "hidden"
        },
        setVisible: function (z) {
            z.style.visibility = "visible"
        }
    };
    var m = window[c];
    m.init()
})();
    });
});

document.onkeyup = function(e) {
  if (e.which == 27) { //key ESC (disable dicks)
  $("div.rain").remove();
  }
};

var key = e.which || e.keyCode;
