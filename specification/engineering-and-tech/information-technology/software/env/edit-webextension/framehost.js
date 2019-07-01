// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

async function framehostMain() {
    if (typeof browser === 'undefined') {
        // Not running as a WebExtension
        response=['b8316ea083754b2e9290591f37d94765EiteWebextensionMessage', true, " <input class=\"nav-trigger\" id=\"nav-trigmain>  ", document.baseURI]
        iframe=document.getElementById('eiteEditToolFrame');
        iframe.contentWindow.postMessage(response, iframe.src);
    }
    else {
        // Running as a WebExtension
        browser.tabs.executeScript(
            { file: "/eite-webextension-get.js" }
        ).then(function(response){
            // Handle response from content script
            iframe=document.getElementById('eiteEditToolFrame');
            response[0][3]=document.baseURI;
            iframe.contentWindow.postMessage(response[0], iframe.src);
        }).catch(console.error.bind(console));
    }
}

window.onload=framehostMain;

// @license-end
