// ==UserScript==
// @name          Link JobId Join
// @version       0.0.15
// @description   Join game with id (roblox.com/games/000/game?jobId=ServerJobId)
// @author        RHGRDev
// @namespace     https://github.com/RHGRDev
// @iconURL       https://www.roblox.com/favicon.ico
// @match         http*://*.roblox.com/games/*
// @grant         GM_notification
// @updateURL     https://github.com/RHGDEV/RobloxTMScripts/raw/main/LinkJobId.user.js
// @downloadURL   https://github.com/RHGDEV/RobloxTMScripts/raw/main/LinkJobId.user.js
// ==/UserScript==
/*global Roblox*/

function GetURLParameter(sParam){
    var sPageURL = window.location.search.substring(1); var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++){ var sParameterName = sURLVariables[i].split('='); if (sParameterName[0] == sParam) return String(sParameterName[1]); }
}

document.body.onload = function() {
    var PlaceID = String(location.href.match(/\/(\d+)\//g)).match(/\d+/g);
    var gameid = GetURLParameter("jobId");
    if (PlaceID && gameid){
        GM_notification({
            text: gameid,
            title: "JobId Detected. Join?",
            image: "https://www.roblox.com/favicon.ico",
            silent: true,
            timeout: 5e3,
            onClick: () => { Roblox.GameLauncher.joinGameInstance(PlaceID, gameid); }
        })
        /*Roblox.GameLauncher.joinGameInstance(PlaceID, gameid);*/
    }
};
