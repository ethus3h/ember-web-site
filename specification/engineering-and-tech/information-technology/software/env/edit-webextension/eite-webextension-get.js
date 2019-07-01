// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

// I swear this file isn't obfuscated. Replace b8316ea083754b2e9290591f37d94765EiteWebextensionProvider with empty string to make it more readable. Doing that would cause problems though since all this gets dumped into the window namespace of random Web pages.

// Don't use let since it will persist between executions of this script.
b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetResponse=[];
function b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetSelectionText() {
    /* https://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text */
    var text = "";
    var activeEl = document.activeElement;
    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
      (activeElTagName == "textarea") || (activeElTagName == "input" &&
      /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
      (typeof activeEl.selectionStart == "number")
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}
b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText=b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetSelectionText();
b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem=document.activeElement;
b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSavedSelStart=b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.selectionStart;
b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSavedSelEnd=b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.selectionEnd;
b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSavedSelLength=b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText.length;

if (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSavedSelLength > 0) {
    if ((b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem instanceof HTMLInputElement && (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.type == 'text' || b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.type == 'search')) || (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem instanceof HTMLTextAreaElement)) {
        b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetResponse=['b8316ea083754b2e9290591f37d94765EiteWebextensionMessage', true, b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText];
    }
    else {
        b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetResponse=['b8316ea083754b2e9290591f37d94765EiteWebextensionMessage', false, b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText];
    }
}
else {
    if ((b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem instanceof HTMLInputElement && (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.type == 'text' || b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.type == 'search')) || (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem instanceof HTMLTextAreaElement)) {
        b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetResponse=['b8316ea083754b2e9290591f37d94765EiteWebextensionMessage', true, document.activeElement.value];
    }
    else {
        b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText=document.activeElement;
        b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText=b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText.innerText || b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText.textContent;
        if (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText.length > 256) {
            alert('EITE: Not loading the more than 256 characters of contents of the current element to avoid locking up the browser. You can explicitly choose an area to view by selecting it.')
        }
        else {
            b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetResponse=['b8316ea083754b2e9290591f37d94765EiteWebextensionMessage', false, b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSelectionText];
        }
    }
}

function b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTypeInTextarea(el, newText) {
    // Based on Jayant Bhawal's post at https://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
    let start = el.selectionStart;
    let end = el.selectionEnd;
    let text = el.value;
    let before = text.substring(0, start);
    let after  = text.substring(end, text.length);
    el.value = (before + newText + after);
    el.selectionStart = el.selectionEnd = start + newText.length;
    el.focus();
}

browser.runtime.onMessage.addListener(function(message) {
    if (message[0] === 'b8316ea083754b2e9290591f37d94765EiteWebextensionMessage') {
        // Put the edited content back where it goes
        if ((b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem instanceof HTMLInputElement && (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.type == 'text' || b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.type == 'search')) || (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem instanceof HTMLTextAreaElement)) {
            if (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetSelectionText().length > 0) {
                b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTypeInTextarea(b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem, message[1]);
            }
            else {
                if (b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSavedSelLength > 0) {
                    // Losing focus by opening the addon clears selection from input element, so restore it before entering the content
                    b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.selectionStart=b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSavedSelStart;
                    b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.selectionEnd=b8316ea083754b2e9290591f37d94765EiteWebextensionProviderSavedSelEnd;
                    b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.focus();
                    b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTypeInTextarea(b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem, message[1]);
                }
                else {
                    b8316ea083754b2e9290591f37d94765EiteWebextensionProviderTempElem.value = message[1];
                }
            }
        }
        else {
            // An element that isn't editable has had content sent back to be saved into it. What?!
            alert("A bug has been encountered in EITE: An element that is not editable has had content returned for it.");
        }
    }
});
b8316ea083754b2e9290591f37d94765EiteWebextensionProviderGetResponse;

// @license-end
