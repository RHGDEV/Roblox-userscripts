// ==UserScript==
// @name          Better Roblox Badges
// @version       0.0.16
// @description   Improves Roblox Badges
// @author        jmkd3v - RHGRDev (Tampermonkey Port)
// @homepage      https://github.com/jmkd3v/Better-Roblox-Badges-Extension
// @iconURL       https://raw.githubusercontent.com/jmkd3v/Better-Roblox-Badges-Extension/main/images/RocketLogo.svg
// @match         http*://*.roblox.com/users/*/profile
// @run-at        document-idle
// @updateURL     https://github.com/RHGDEV/RobloxTMScripts/raw/main/src/betterrobloxbadges.user.js
// @downloadURL   https://github.com/RHGDEV/RobloxTMScripts/raw/main/src/betterrobloxbadges.user.js
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

function generateBadgeElement(name, description, href, image) {
	// this should be using React, but whatever
	let baseElement = document.createElement("li"); // the list item that everything is contained in
	baseElement.classList.add("list-item", "asset-item", "custom-badge-item");

	let innerElement = document.createElement("a"); // makes it "clickable"
	innerElement.href = href;
	innerElement.title = description;

	let imageElement = document.createElement("span"); // the image
	imageElement.classList.add("border", "asset-thumb-container", "icon-custom-badges");
	imageElement.title = name;
    imageElement.style.display = "inline-block";
	imageElement.style.backgroundImage = "url('" + image + "')";
    imageElement.style.backgroundSize = "cover";

	let nameElement = document.createElement("span"); // the name
	nameElement.classList.add("font-header-2", "text-overflow", "item-name");
	nameElement.innerHTML = name;

	// add the image and name to the inner element
	innerElement.appendChild(imageElement);
	innerElement.appendChild(nameElement);

	// add the inner element to the base element
	baseElement.appendChild(innerElement);

	return baseElement;
}

(async () => {
    let badgeContainer = awaitElement("#roblox-badges-container > .section-content > ul")
	// let dataContainer = document.querySelector("div[data-profileuserid]");
	if (badgeContainer) {
        badgeContainer = document.querySelector("#roblox-badges-container > .section-content > ul")
        console.log("Found badge container");

		// for testing use Roblox.CurrentUser.userId;
		// let userId = dataContainer["data-profileuserid"]
		let userId = parseInt(
			location.pathname.substring(7, location.pathname.length - 8)
		);

		let badgesRequest = await fetch("https://api.jmk.gg/badges/user/" + userId);
		let badges = await badgesRequest.json();
		badges = badges.badges;

		for (let badge of badges) {
			console.log(badge);
			//badgeContainer.prepend(
            document.getElementsByClassName('hlist badge-list')[0].prepend(
				generateBadgeElement(
					badge.name,
					badge.description,
					badge.link,
					badge.image
				)
			);
		}
	}
})();