// ==UserScript==
// @name          Roblox Tools
// @version       0.0.55
// @description   Tools for roblox games
// @author        RHGDev
// @license       MIT
// @iconURL       https://doy2mn9upadnk.cloudfront.net/uploads/default/optimized/4X/3/7/4/374b2f132433065f2087b88c43080aba75c21aff_2_32x32.svg
// @match         http*://*.roblox.com/games/*
// @grant         GM_notification
// @grant         GM_setClipboard
// @run-at        document-body
// @updateURL     https://github.com/RHGDEV/RobloxTMScripts/raw/main/gametools.user.js
// @downloadURL   https://github.com/RHGDEV/RobloxTMScripts/raw/main/gametools.user.js
// ==/UserScript==

function awaitElement(selector, parent = document) {
    return new Promise((resolve, reject) => {
        const ELEMENT = parent.querySelector(selector)
        if (ELEMENT) resolve(ELEMENT)

        let resolved = false
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                for (var node of Array.from(mutation.addedNodes)) {
                    if (node.matches && node.matches(selector)) {
                        observer.disconnect()
                        resolved = true

                        resolve(node)
                    }
                }
            })
        })

        observer.observe(parent, {
            childList: true,
            subtree: true
        })

        setTimeout(() => {
            if (resolved == false) {
                reject()
            }
        }, 10000)
    })
}

(async () => {
    // Gets the game ID
    const gameUrl = window.location
    const gid = Number(gameUrl.pathname.split('/')[2]);
    let findAttemptCount = 0
    if (!gid) return;
    /*GM_notification({
        text: "Roblox Game Tool Loaded!",
        title: "Loading..",
        image: "https://www.roblox.com/favicon.ico",
        silent: true,
        timeout: 5e3,
        onClick: null
    });*/

    const searchForGame = function (gid, min, max) {
        //console.log(findAttemptCount)
        if (findAttemptCount >= 50) {
            GM_notification({
                text: "No empty server was found.",
                title: "Failed..",
                image: "https://www.roblox.com/favicon.ico",
                silent: true,
                timeout: 5e3,
                onClick: null
            });
            return false
        }

        // Get the game page
        var page = Math.round((max + min) / 2);
        // Fetch roblox's servers
        fetch(`https://www.roblox.com/games/getgameinstancesjson?placeId=${gid}&startindex=${page}`)
            // Turn the response into JSON
            .then((resp) => resp.json())
            .then(function (data) {
                if (data.Collection.length < 10 && data.Collection.length > 0 && Number(data.Collection[data.Collection.length - 1].CurrentPlayers.length) >= 1) {
                    var server = data.Collection[data.Collection.length - 1];
                    console.log('Found empty server:', server, '\nCurrent Total Players:', server.CurrentPlayers.length);
                    if (confirm(`Would you like to join this server?\n${server.CurrentPlayers.length} players.\n${server.Ping} ping.\n${server.Fps} FPS.\n${server.Guid}`)) {
                        try {
                            /*eslint no-eval: 0*/
                            eval(server.JoinScript);
                        } catch (e) {
                            console.log('Error:', e);
                        };
                    } else {
                        min = page;
                        console.log('User canceled, trying new server:', page);
                        searchForGame(gid, min, max);
                        return false;
                    };
                    return true;
                } else if (data.Collection.length == 0) {
                    max = page;
                    console.log('Page empty, trying new page:', page);
                    findAttemptCount++
                    searchForGame(gid, min, max);
                } else {
                    min = page;
                    console.log('Not empty, trying new server:', page);
                    findAttemptCount++
                    searchForGame(gid, min, max);
                }
            })
    }

    const createInviteGame = function (gid, min, max) {
        GM_notification({
            text: "Starting searcher with id \"" + gid + "\"",
            title: "Starting..",
            image: "https://www.roblox.com/favicon.ico",
            silent: true,
            timeout: 5e3,
            onClick: null
        });

        var gId = prompt("Please enter the server gID", "00000000-0000-00000-0000-000000000000");
        if (gId == null || gId == "") {} else {
            let gidUrl = gameUrl + `?jobId=` + gId
            GM_setClipboard(gidUrl, "text")

            GM_notification({
                text: gidUrl,
                title: "Copied to Clipboard!",
                silent: true,
                timeout: 8e3,
                onClick: () => {
                    GM_openInTab(gidUrl, {
                        active: true,
                        insert: true,
                        setParent: true,
                    })
                }
            })
        }
    }

    /*let h3ader = document.createElement("h3")
    h3ader.innerHTML = "Game Tools"
    h3ader.setAttribute("style", "display: flex; width: 100%; margin-bottom: 1rem; align-items: center; column-gap: 1rem;")

    let fsBtn = document.createElement("span");
    fsBtn.id = "-RHG-findServer"
    fsBtn.onclick = function() {searchForGame(gid, 0, 10000);};
    fsBtn.innerHTML = "Find an empty server"
    fsBtn.className = "btn-growth-md btn-primary-md"//"btn-full-width btn-control-xs rbx-game-server-join"//"btn-secondary-md"

    let jgIDBtn = document.createElement("span");
    jgIDBtn.id = "-RHG-jgID"
    jgIDBtn.onclick = function() {searchForGame(gid, 0, 10000);};
    jgIDBtn.innerHTML = "Join via GameID"
    jgIDBtn.className = "btn-growth-md btn-primary-md" //"btn-full-width btn-control-xs rbx-game-server-join"//"btn-secondary-md"

    document.getElementById("game-instances").prepend(jgIDBtn)
    document.getElementById("game-instances").prepend(fsBtn)
    document.getElementById("game-instances").prepend(h3ader)*/

    awaitElement("#container-main .content")
        .then(content => {
            const container = document.createElement("div")
            const findServerButton = document.createElement("button")
            const createInviteButton = document.createElement("button")

            container.setAttribute("style", "display: flex; width: 100%; margin-bottom: 1rem; align-items: center; column-gap: 1rem;")
            container.innerHTML = `
                <label class="text-label">Game Tools</label>
            `

            findServerButton.classList.add("btn-growth-md")
            findServerButton.classList.add("btn-primary-md")
            findServerButton.textContent = "Find Server"
            findServerButton.addEventListener("click", () => {
                findAttemptCount = 0;
                searchForGame(gid, 0, 10000);
            })
            createInviteButton.classList.add("btn-growth-md")
            createInviteButton.classList.add("btn-primary-md")
            createInviteButton.textContent = "Create Invite"
            createInviteButton.addEventListener("click", () => {
                createInviteGame();
            })

            container.append(findServerButton)
            container.append(createInviteButton)
            content.prepend(container)
        })
})();
