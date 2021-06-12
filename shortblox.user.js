// ==UserScript==
// @name         ShortBlox - URL Shortener
// @namespace    csqrl.railworks2.shortblox
// @version      0.0.5
// @license      MIT
// @description  Copies a short URL for the current page to the clipboard, using ShortBlox by railworks2
// @author       csqrl
// @match        http*://*.roblox.com/*
// @match        http*://devforum.roblox.com/*
// @homepage     https://devforum.link/779370/4
// @updateURL    https://github.com/RHGDEV/RobloxTMScripts/raw/main/shortblox.user.js
// @downloadURL  https://github.com/RHGDEV/RobloxTMScripts/raw/main/shortblox.user.js
// @iconURL      https://doy2mn9upadnk.cloudfront.net/uploads/default/optimized/4X/3/7/4/374b2f132433065f2087b88c43080aba75c21aff_2_32x32.svg
// @run-at       document-body
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// ==/UserScript==

const Enum = {
    Site: {
        Unknown: 0,
        Roblox: 100,
        DevForum: 200,
    },
    ContentType: {
        Unknown: 0,
        Game: 100,
        Profile: 200,
        Catalogue: 300,
        Group: 400,
        Library: 500,
        DevForumPost: 600,
        DevForumHome: 700,
    },
    DataKeys: {
        CopyProfileByUsername: "CopyProfileByUsername",
    },
}

Enum.ShortBlox = {
    [Enum.ContentType.Game]: "rblx.games",
    [Enum.ContentType.Profile]: "rblx.name",
    [Enum.ContentType.Catalogue]: "rblx.clothing",
    [Enum.ContentType.Group]: "rblx.social",
    [Enum.ContentType.Library]: "rblx.media",
    [Enum.ContentType.DevForumPost]: "devforum.link",
    [Enum.ContentType.DevForumHome]: "devforum.link",

    ProfileAsUsername: "user.rblx.name",
}

Enum.IdPosition = {
    [Enum.ContentType.Game]: 2,
    [Enum.ContentType.Profile]: 2,
    [Enum.ContentType.Catalogue]: 2,
    [Enum.ContentType.Group]: 2,
    [Enum.ContentType.Library]: 2,
    [Enum.ContentType.DevForumPost]: 3,
    [Enum.ContentType.DevForumHome]: 0,
}

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

        observer.observe(parent, { childList: true, subtree: true })

        setTimeout(() => {
            if (resolved == false) {
                reject()
            }
        }, 10000)
    })
}

function getPageType(hostname = location.hostname) {
    return (hostname === "devforum.roblox.com")
        ? Enum.Site.DevForum
        : Enum.Site.Roblox
}

function getContentType(pathname = location.pathname) {
    const pageType = getPageType()

    if (pageType === Enum.Site.DevForum) {
        return pathname === "/"
            ? Enum.ContentType.DevForumHome
            : pathname.startsWith("/t/")
                ? Enum.ContentType.DevForumPost
                : Enum.ContentType.Unknown
    } else {
        const category = pathname.split("/")[1]

        switch (category) {
            case "library":
                return Enum.ContentType.Library
            case "groups":
                return Enum.ContentType.Group
            case "catalog":
                return Enum.ContentType.Catalogue
            case "users":
                return Enum.ContentType.Profile
            case "games":
                return Enum.ContentType.Game
            default:
                return Enum.ContentType.Unknown
        }
    }
}

function makeURL(url = location.href) {
    const location = new URL(url)
    const contentType = getContentType(location.pathname)
    const path = location.pathname.split("/")

    if (contentType === Enum.ContentType.DevForumPost) {
        const idPosition = Enum.IdPosition[contentType]
        const filteredPath = path.filter((_, idx) => idx >= idPosition).join("/")

        return `https://${Enum.ShortBlox[contentType]}/${filteredPath}`
    } else if (contentType === Enum.ContentType.Profile) {
        const useUsernames = GM_getValue(Enum.DataKeys.CopyProfileByUsername, false)
        const metaDescription = document.querySelector("meta[name='description']")

        if (useUsernames && metaDescription) {
            const usernameText = metaDescription.getAttribute("content")
            const username = usernameText.substr(0, usernameText.indexOf(" ")).trim()

            if (username.length) {
                return `https://${Enum.ShortBlox.ProfileAsUsername}/${username}`
            }
        }
    }

    const pathId = path[Enum.IdPosition[contentType]] || ""
    return `https://${Enum.ShortBlox[contentType]}/${pathId}`
}

function copyShortURLToClipboard(shortURL = makeURL()) {
    GM_setClipboard(shortURL, "text")

    GM_notification({
        text: `${shortURL}`,
        title: "Copied to Clipboard!",
        silent: true,
        timeout: 6e3,
        onClick: () => {
            GM_openInTab(`${shortURL}`, {
                active: true,
                insert: true,
                setParent: true,
            })
        }
    })
}

function buildRobloxShortener() {
    const shortURL = makeURL()

    awaitElement("#container-main .content")
        .then(content => {
            const container = document.createElement("div")
            const copyButton = document.createElement("button")

            container.setAttribute("style", "display: flex; width: 100%; margin-bottom: 1rem; align-items: center; column-gap: 1rem;")
            container.innerHTML = `
                <label class="text-label">Share</label>
                <input class="form-control input-field" value="${shortURL}" readonly style="cursor: text;">
            `

            copyButton.classList.add("btn-growth-md")
            copyButton.classList.add("btn-primary-md")
            copyButton.textContent = "Copy"

            copyButton.addEventListener("click", () => copyShortURLToClipboard(shortURL))

            container.append(copyButton)
            content.prepend(container)
        })
}

function buildDevForumShortener(focusTarget) {
    if (!focusTarget.matches("#share-link input[type='text']")) {
        return
    }

    const textInput = focusTarget
    if (textInput.getAttribute("data-csqrl")) {
        return
    }

    awaitElement("head")
        .then(head => {
            if (head.querySelector("link[data-csqrl]")) {
                return
            }

            const faLink = document.createElement("link")
            faLink.setAttribute("rel", "stylesheet")
            faLink.setAttribute("href", "https://use.fontawesome.com/releases/v5.14.0/css/fontawesome.css")

            const faSolidLink = document.createElement("link")
            faSolidLink.setAttribute("rel", "stylesheet")
            faSolidLink.setAttribute("href", "https://use.fontawesome.com/releases/v5.14.0/css/solid.css")
            faSolidLink.setAttribute("data-csqrl", true)

            head.append(faLink)
            head.append(faSolidLink)
        })

    function onTextInputFocused() {
        const inputText = textInput.value
        const inputURL = new URL(inputText)

        if (inputURL.hostname !== "devforum.roblox.com") {
            return
        }

        const shortURL = makeURL(inputText)
        textInput.value = `${shortURL}`

        textInput.select()
    }

    const copyButton = document.createElement("a")
    copyButton.setAttribute("title", "Copy to Clipboard")
    copyButton.setAttribute("aria-label", "Copy to Clipboard")
    copyButton.setAttribute("style", "position: absolute; right: 0; top: 50%; height: 32px; width: 32px; display: flex; align-items: center; justify-content: center; transform: translateY(-50%); cursor: pointer; color: inherit;")
    copyButton.innerHTML = `<i class="fas fa-clipboard"></i>`

    copyButton.addEventListener("click", evt => {
        evt.preventDefault()
        copyShortURLToClipboard(textInput.value)
        textInput.select()
    })

    textInput.parentNode.append(copyButton)
    textInput.parentNode.style.position = "relative"
    textInput.setAttribute("data-csqrl", true)
    textInput.addEventListener("focus", () => onTextInputFocused())

    onTextInputFocused()
}

(async () => {
    const siteType = getPageType()

    if (siteType === Enum.Site.DevForum) {
        document.addEventListener("focusin", evt => {
            buildDevForumShortener(evt.target)
        })
    } else {
        if (getContentType() === Enum.ContentType.Unknown) {
            return
        }

        buildRobloxShortener()
    }
})()

try {
    GM_registerMenuCommand("Copy Profiles by Username", () => {
        const doLink = !GM_getValue(Enum.DataKeys.CopyProfileByUsername, false)
        const isProfile = getContentType() === Enum.ContentType.Profile

        GM_setValue(Enum.DataKeys.CopyProfileByUsername, doLink)

        GM_notification({
            title: `Profile Links: ${doLink ? "Usernames" : "User IDs"}`,
            text: isProfile ? "Reload to apply changes." : `Profile links will be generated using ${doLink ? "usernames" : "user IDs"}`,
            silent: true,
            timeout: 6e3,
            onclick: () => window.location.reload(),
        })
    })
} catch (_) {}
