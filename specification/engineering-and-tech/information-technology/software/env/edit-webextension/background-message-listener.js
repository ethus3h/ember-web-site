// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

window.b8316ea083754b2e9290591f37d94765EiteWebextensionMessageDocuments={};

//https://stackoverflow.com/questions/19196337/string-contains-doesnt-exist-while-working-in-chrome
if(!('contains' in String.prototype)) {
    String.prototype.contains = function(str, startIndex) {
            return -1 !== String.prototype.indexOf.call(this, str, startIndex);
    };
}

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Inline document renderer messages.
    // Architecture:
    /*
     * • Content script = render-inline-dc-docs.js;
     * • Editor in frame = edit-webext-request-handler.js;
     * • Background message listener = background-message-listener.js (this file)
     *
     *  Content script
     *      │
     *      │ ⑴ On spotting a document, sends the document contents to the
     *      │   message listener with a frame ID, then makes a frame with
     *      │   a URL with the frame ID in the anchor (# part of the URL).
     *      │
     *      ├─────────────────────────────────┐
     *      ↓                                 ↓
     *    Editor in frame            Background message listener
     *      ↑   │                            ↑        │
     *      │   │ ⑵ Asks message listener    │        │ ⑶ Sends document contents
     *      │   │   for document matching    │        │   back to editor in frame
     *      │   │   ID in anchor             │        │
     *      │   └────────────────────────────┘        │
     *      └─────────────────────────────────────────┘
     * */
    if (message[0].contains('b8316ea083754b2e9290591f37d94765EiteWebextensionMessageDocumentId')) {
        // We've been given document contents by the render-inline-dc-docs.js.
        console.log('Document was saved '+message[0]+' : '+message[1]);
        window.b8316ea083754b2e9290591f37d94765EiteWebextensionMessageDocuments[message[0]]=message[1];
    }
    else if (message[0].contains('b8316ea083754b2e9290591f37d94765EiteWebextensionMessageGetDocumentById')) {
        console.log('Document was requested '+message[0]);
        sendResponse({response: window.b8316ea083754b2e9290591f37d94765EiteWebextensionMessageDocuments[message[0].replace('GetDocumentBy','Document')]});
    }
});

// @license-end
