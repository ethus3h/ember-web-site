// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

//https://stackoverflow.com/questions/19196337/string-contains-doesnt-exist-while-working-in-chrome
if(!('contains' in String.prototype)) {
    String.prototype.contains = function(str, startIndex) {
            return -1 !== String.prototype.indexOf.call(this, str, startIndex);
    };
}

let messageEventHandler = function(message) {
    function onRemove(element, onDetachCallback) {
        // https://stackoverflow.com/questions/31798816/simple-mutationobserver-version-of-domnoderemovedfromdocument
        if (element !== null) {
            const observer = new MutationObserver(function () {
                function isDetached(el) {
                    if (el.parentNode === document) {
                        return false;
                    } else if (el.parentNode === null) {
                        return true;
                    } else {
                        isDetached(el.parentNode);
                    }
                }
                if (isDetached(element)) {
                    observer.disconnect();
                    onDetachCallback();
                }
            });

            observer.observe(document, {
                childList: true,
                subtree: true
            });
        }
    }

    async function eiteReadyCallback(message) {
        if ((message.data[0] === 'b8316ea083754b2e9290591f37d94765EiteWebextensionMessage') || (message.data[0] === 'b8316ea083754b2e9290591f37d94765EiteWebextensionMessageUtf8')) {
            startSpinner();
            window.setTimeout(async function() {
                canEdit=message.data[1];
                contents=message.data[2];
                window.b8316ea083754b2e9290591f37d94765EiteWebextensionMessageUri=message.data[3];
                let utf8encoder = new TextEncoder();
                let tempInterpreted;
                if (message.data[0] === 'b8316ea083754b2e9290591f37d94765EiteWebextensionMessage'){
                    tempInterpreted=await eiteCall('importAndExport', ['ascii', 'integerList', new Uint8Array(utf8encoder.encode(contents))]);
                }
                else {
                    await pushImportSettings(await getFormatId('utf8'), 'variants:dcBasenb,');
                    tempInterpreted=await eiteCall('importAndExport', ['utf8', 'integerList', new Uint8Array(utf8encoder.encode(contents))]);
                    await popImportSettings(await getFormatId('utf8'));
                }
                document.getElementById('inputarea').value = await eiteCall('strFromByteArray', [tempInterpreted]);
                removeSpinner();
                RunDocumentHandler(async function() {
                    if (!canEdit) {
                        openAlertDialog('Note: The requested content is read-only.');
                    }
                    else {
                        let elem=document.importNode(document.getElementById('doneButtonTemplate').content, true);
                        elem.firstChild.onclick=function(){updateNearestDcLabel(document.getElementById('inputarea'));DoneEditingHandler();};
                        elem.disabled=false;
                        document.getElementById('editorButtons').appendChild(elem.firstChild);
                    }
                });
            }, 500);
        }
    };

    let DoneEditingHandler = async function() {
        startSpinner();
        window.setTimeout(async function() {
            let utf8decoder = new TextDecoder();
            window.parent.postMessage(['b8316ea083754b2e9290591f37d94765EiteWebextensionMessage',utf8decoder.decode(new Uint8Array(await eiteCall('importAndExport', ['integerList', 'ascii', await getInputDoc()])))], window.b8316ea083754b2e9290591f37d94765EiteWebextensionMessageUri);
        }, 500);
    }
    window.DoneEditingHandler = DoneEditingHandler;

    onRemove(document.getElementById('overlay'), function() {
        eiteReadyCallback(message);
    });
};
document.addEventListener('message', messageEventHandler);
window.addEventListener('message', messageEventHandler);

if (window.location.hash.contains('b8316ea083754b2e9290591f37d94765EiteWebextensionMessageDocumentId')) {
    browser.runtime.sendMessage([window.location.hash.substr(1).replace('Document','GetDocumentBy')]).then(async function(responseMessage) {
        await setupIfNeeded();
        document.getElementById('DcSelection').style.display='none';
        document.getElementById('editorColumn').style.display='none';
        document.getElementById('editorButtons').style.display='none';
        document.getElementById('eiteDocumentRoot').style.border='none';
        document.getElementById('eiteDocumentRoot').style.fontSize='1rem';
        // Doing it like this should work, but I can't figure out the scopes and lifetimes of the settings array easily enough.
        //await pushExportSettings(await getFormatId('utf8'), 'variants:dcBasenb,');
        //await runDocument(await importDocument('utf8', new TextEncoder().encode(responseMessage.response)));
        //await popExportSettings(await getFormatId('utf8'));
        //await eiteCall('setupIfNeeded', []);
        //alert('erciorcl');
        //alert(await eiteCall('dcaFromDcbnbFragmentUtf8', [new TextEncoder().encode(responseMessage.response)]));
        // Encoded response: 244,141,129,157,244,139,182,128,243,188,183,162,243,186,128,138,243,184,165,142,244,136,186,141,243,178,139,160,244,143,186,144,99,111,108,108,97,98,111,114,97,116,105,111,110,32,111,110,32,97,32,244,131,173,161,244,143,191,173,115,112,101,99,105,102,105,99,97,116,105,111,110,244,131,173,160,244,143,191,173,243,188,133,185,243,180,182,175,244,136,161,186,243,191,148,138,244,134,178,166,244,141,184,130,243,178,128,176,244,143,188,157
        await runDocument(await dcaFromDcbnbUtf8(new TextEncoder().encode(responseMessage.response)));
        //await runDocument(await eiteCall('dcaFromDcbnbFragmentUtf8', [new TextEncoder().encode(responseMessage.response)]));
        //await eiteCall('runDocument', [await eiteCall('dcaFromDcbnbFragmentUtf8', [new TextEncoder().encode(responseMessage.response)])]);
        await removeSpinner();
        document.getElementById('overlay').remove();
    });
}

// @license-end
