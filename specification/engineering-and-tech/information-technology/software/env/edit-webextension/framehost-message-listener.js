// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

window.addEventListener('message', function(message) {
    if (message.data[0] === 'b8316ea083754b2e9290591f37d94765EiteWebextensionMessage') {
        // Pass edited data back to content script
        browser.tabs.query(
            { currentWindow: true, active: true },
            function (tabArray) {
                browser.tabs.sendMessage(tabArray[0].id, message.data).then(response=>{
                    // Handle response from content script
                    window.close();
                }).catch(console.error.bind(console));
            }
        )}
    }
);

// @license-end
