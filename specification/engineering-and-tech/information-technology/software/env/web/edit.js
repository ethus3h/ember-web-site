// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

globalCachedInputState="";
window.onload = function() {
    (async function(){
        window.dcNames=[];
        await eiteCall('setupIfNeeded');
        console.log('ok');
        await setupIfNeeded(); /* Set up normally and in Web worker because things that need performance on quick calls e.g. to respond when typing are too slow going through the Web worker */
        window.dcNames=await eiteCall('dcGetColumn', ['DcData', 1]);
        let datasetLength=await eiteCall('dcDatasetLength', ['DcData']);
        await handleSearchResultUpdate();
        //console.log(window.dcNames);
        // Attach event listeners to elements
        document.getElementById('searchDcs').addEventListener('input', function(){
            handleSearchResultUpdate();
        });
        document.getElementById('searchDcs').addEventListener('keyup', function(ev){
            if (ev.key === "Escape") {
                clearDcFilters();
            }
        });
        document.getElementById('dcsShowAllButton').addEventListener('click', function(){
            clearDcFilters();
        });
        document.getElementById('ImportDocument').onclick=function(){updateNearestDcLabel(document.getElementById('inputarea'));openImportDialog();};
        document.getElementById('ExportDocument').onclick=function(){updateNearestDcLabel(document.getElementById('inputarea'));ExportDocument();};
        document.getElementById('RunDocument').onclick=function(){updateNearestDcLabel(document.getElementById('inputarea'));RunDocumentHandler();};
        inputarea=document.getElementById('inputarea');
        inputarea.disabled=false;
        document.addEventListener('input', function() {
            updateNearestDcLabel(inputarea,false);
        }, false);
        document.addEventListener('keydown', function(e) {
            updateNearestDcLabel(inputarea,false);
            globalCachedInputState=e.key;
        }, false);
        document.addEventListener('keyup', function() {
            updateNearestDcLabel(inputarea,false);
        }, false);
        document.addEventListener('click', function() {
            updateNearestDcLabel(inputarea);
        }, false);
        inputarea.addEventListener('input', function(event) {
            handleDcEditingKeystroke(event, inputarea);
        });
        inputarea.onkeydown = function(event) {
            return handleDcBackspaceOrDelKeystroke(event, inputarea);
        };
        document.getElementById('ImportDocument').disabled=false;
        document.getElementById('ExportDocument').disabled=false;
        document.getElementById('RunDocument').disabled=false;
        inFormat=document.getElementById('inFormat');
        inFormat.innerHTML='';
        let formats=[];
        formats = await eiteCall('listInputFormats');
        for (let i=0;i<Object.keys(formats).length;i++) {
            let elem=document.createElement('option');
            elem.innerHTML=formats[i];
            inFormat.appendChild(elem);
        }
        inFormat.disabled=false;
        outFormat=document.getElementById('outFormat');
        outFormat.innerHTML='';
        formats = await eiteCall('listOutputFormats');
        for (let i=0;i<Object.keys(formats).length;i++) {
            let elem=document.createElement('option');
            elem.innerHTML=formats[i];
            outFormat.appendChild(elem);
        }
        outFormat.disabled=false;
        editFormat=document.getElementById('editFormat');
        editFormat.innerHTML='';
        formats = ['utf8', 'integerList'];
        for (let i=0;i<Object.keys(formats).length;i++) {
            let elem=document.createElement('option');
            elem.innerHTML=formats[i];
            editFormat.appendChild(elem);
        }
        window.editFormatValue=document.getElementById('editFormat').value;
        document.getElementById('editFormat').onchange=function(){
            startSpinner();
            window.setTimeout(async function(){
                let oldEditFormat=window.editFormatValue;
                let editFormat=document.getElementById('editFormat').value;
                let inputarea=document.getElementById('inputarea');
                await eiteCall('pushExportSettings', [await getFormatId('utf8'), 'variants:dcBasenb,']);
                let tempInputValue=await eiteCall('importAndExport', ['integerList', editFormat, await getInputDoc(oldEditFormat)]);
                await eiteCall('popExportSettings', [await getFormatId('utf8')]);
                if (editFormat === 'utf8') {
                    inputarea.value=new TextDecoder().decode(new Uint8Array(tempInputValue));
                }
                else {
                    inputarea.value=await eiteCall('strFromByteArray', [tempInputValue]);
                }
                window.editFormatValue=editFormat;
                removeSpinner(true);
            }, 500);
        };
        editFormat.disabled=false;
        window.setTimeout(function(){
            let overlay=document.getElementById('overlay');
            overlay.style.opacity=0;
            overlay.style.transform='scale(3)';
            let overlayLoadingSpinner=document.getElementById('overlayLoadingSpinner');
            overlayLoadingSpinner.style.opacity=0;
            window.setTimeout(function(){document.getElementById('overlay').remove()},1500);
        }, 500);
    })();
};

function clearDcFilters() {
    document.getElementById('searchDcs').value="";
    handleSearchResultUpdate();
}

function editInts(overrideEditFormat) {
    if (overrideEditFormat === undefined) {
        overrideEditFormat=document.getElementById('editFormat').value;
    }
    return 'integerList' === overrideEditFormat;
}

async function handleSearchResultUpdate() {
    let searchQuery=document.getElementById('searchDcs').value;
    let re=new RegExp('.*');
    document.getElementById('dcsShowAllButton').style.display='none';
    if (searchQuery.length !== 0) {
        re=new RegExp(searchQuery, 'i');
        document.getElementById('dcsShowAllButton').style.display='block';
    }
    let datasetLength=await eiteCall('dcDatasetLength', ['DcData']);
    Array.from(document.getElementsByClassName('dcInsertButton')).forEach(function(e) {
        e.remove();
    });
    for (let i=0; i<datasetLength; i++) {
        if (window.dcNames[i].match(re)) {
            let elem=document.createElement('button');
            elem.onclick=async function() {
                if (editInts()) {
                    editAreaInsert(i+'');
                }
                else {
                    // Calling editAreaInsert(await dcaToDcbnbFragmentUtf8([i])) (without the temp variable) gives an error saying missing ) after argument list, for some reason. I don't understand why, but this fixes it.
                    let temp;
                    temp=await dcaToDcbnbFragmentUtf8([i]);
                    editAreaInsert(new TextDecoder().decode(new Uint8Array(temp)));
                }
            };
            elem.innerHTML=window.dcNames[i]+' <small>('+i+')</small>';
            elem.className='dcInsertButton';
            document.getElementById('DcSelection').appendChild(elem);
        }
    }
}

function handleDcEditingKeystroke(event) {
    if (editInts()) {
        if (globalCachedInputState.length === 1) {
            if (globalCachedInputState !== " " && isNaN(parseInt(globalCachedInputState))) {
                if (inputarea.value.includes(globalCachedInputState)) {
                    (async function(elem, char) {
                        let start = elem.selectionStart;
                        let end = elem.selectionEnd;
                        elem.value = elem.value.replace(char, '');
                        elem.selectionStart = start - 1;
                        elem.selectionEnd = end - 1;
                        typeInTextareaSpaced(elem, await printArr(await dcaFromFormat('utf8', new TextEncoder().encode(char))));
                    })(inputarea, globalCachedInputState);
                }
            }
        }
    }
}

function handleDcBackspaceOrDelKeystroke(event) {
    if (editInts()) {
        // https://stackoverflow.com/questions/9906885/detect-backspace-and-del-on-input-event
        let key=event.keyCode || event.charCode;
        if (key === 8 || key === 46) {
            let el = document.getElementById('inputarea');
            let start = el.selectionStart;
            let end = el.selectionEnd;
            let text = el.value;
            let before = text.substring(0, start);
            let after  = text.substring(end, text.length);
            let length = 0;
            if (key === 8) {
                // Backspace
                before = before.trim().split(' ').slice(0, -1).join(' ');
            }
            else {
                // Delete
                after = after.trim().split(' ').slice(1).join(' ');
            }
            start = before.length;
            if (before.substr(-1) !== ' ' && after.substr(0, 1) !== ' ') {
                el.value = (before + ' ' + after);
            }
            else {
                el.value = (before + '' + after);
            }
            el.selectionStart = el.selectionEnd = start;
            el.focus();
            return false;
        }
    }
}

function startSpinner() {
    // Display loading spinner
    document.getElementById('inputarea').disabled='true';
    /* the [...foo] syntax is the "spread syntax". https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax */
    [...document.getElementsByTagName('select')].forEach(elem => {
        elem.disabled = true;
    });
    [...document.getElementsByTagName('button')].forEach(elem => {
        elem.disabled = true;
    });
    document.getElementById('eiteDocumentRoot').innerHTML = '';
    document.getElementById('eiteDocumentRoot').appendChild(document.importNode(document.getElementById('documentRootLoadingSpinnerTemplate').content, true));
}

function removeSpinner(clear=false) {
    // Remove the loading spinner
    if(clear) {
        document.getElementById('eiteDocumentRoot').innerHTML='';
    }
    document.getElementById('eiteDocumentRoot').style.backgroundColor="white";
    document.getElementById('inputarea').disabled=false;
    [...document.getElementsByTagName('select')].forEach(elem => {
        elem.disabled = false;
    });
    [...document.getElementsByTagName('button')].forEach(elem => {
        elem.disabled = false;
    });
}

function editAreaInsert(text) {
    if (editInts()) {
        typeInTextareaSpaced(document.getElementById('inputarea'), text);
    }
    else {
        typeInTextarea(document.getElementById('inputarea'), text);
    }
}

function setNearestDcLabel(id, text) {
    let nearestDcLabel = document.getElementById('currentDcLabel');
    let nearestDcId = document.getElementById('currentDcId');
    nearestDcLabel.innerHTML=text;
    nearestDcLabel.title=id + ': ' + text;
    nearestDcId.innerHTML=id;
}

function autoformatInputArea(el) {
    if (editInts()) {
        // Autoformat input area
        // I'm not sure why, but trying to calculate the change in start position is confused by forward delete. I guess I'll just leave it like this for now since it works, even though I don't understand why.
        let start = el.selectionStart;
        let end = el.selectionEnd;
        let len = el.value.length;
        /* console.log('old value ='+el.value);
        console.log('old len ='+len);
        console.log('old start ='+start);*/
        let oldValue = el.value;
        el.value = oldValue + ' ';
        el.value = el.value.replace(/\s+/g, ' ');
        /* len = len - el.value.length;
        console.log('new value ='+el.value);
        console.log('new len ='+len);
        console.log('new start ='+(start - len));
        el.selectionStart = el.selectionEnd = start - len; */
        if (oldValue !== el.value) {
            el.selectionStart = el.selectionEnd = start;
        }
        else {
            // There was no change in the contents, so we can preserve the end value
            el.selectionStart = start;
            el.selectionEnd = end;
        }
        // Check if the cursor is in the middle of a character, and try to get it outside of it.
        // if ()
    }
}

function updateNearestDcLabel(el, autoformat=true) {
    if (autoformat) {
        autoformatInputArea(el);
    }
    else {
        setTimeout(function(){autoformatInputArea(el)}, 750);
    }
    updateNearestDcLabelInner(el);
}

async function updateNearestDcLabelInner(el) {
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (start !== end) {
        setNearestDcLabel('', '');
        return;
    }
    let text = el.value;
    let before = text.substring(0, start);
    let after  = text.substring(end, text.length);
    let currentDc = '';
    if (editInts()) {
        after=after.substring(0, after.indexOf(' '));
        before=before+after;
        currentDc=parseInt(before.trim().split(' ').slice(-1));
    }
    else {
        //currentDc=before.slice(-1);
        currentDc=new TextDecoder().decode(new Uint8Array(await dcbnbGetLastChar(new TextEncoder().encode(before))));
        if (currentDc.length === 0) {
            //currentDc=after[0];
            currentDc=new TextDecoder().decode(new Uint8Array(await dcbnbGetFirstChar(new TextEncoder().encode(after))));
        }
        if (currentDc !== undefined) {
            currentDc=await dcaFromDcbnbFragmentUtf8(new TextEncoder().encode(currentDc));
            currentDc=currentDc[0];
        }
    }
    if (isNaN(currentDc) || (! await isKnownDc(currentDc))) {
        setNearestDcLabel('', '');
        return;
    }
    setNearestDcLabel(currentDc, await dcGetName(currentDc));
}

function typeInTextarea(el, newText) {
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

function typeInTextareaSpaced(el, newText) {
    // Based on Jayant Bhawal's post at https://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
    let start = el.selectionStart;
    let end = el.selectionEnd;
    let text = el.value;
    let before = text.substring(0, start);
    let after  = text.substring(end, text.length);
    if (before.substr(-1) === ' ' || before.substr(-1) === '') {
        newText = newText + ' ';
        el.value = (before + newText + after);
    }
    else {
        newText = ' ' + newText;
        el.value = (before + newText + after);
    }
    el.selectionStart = el.selectionEnd = start + newText.length;
    el.focus();
}

async function getInputDoc(overrideEditFormat) {
    let res;
    if(editInts(overrideEditFormat)) {
        res = document.getElementById('inputarea').value;
    }
    else {
        res = new TextEncoder().encode(document.getElementById('inputarea').value);
        await eiteCall('pushImportSettings', [await getFormatId('utf8'), 'variants:dcBasenb dcBasenbFragment,']);
        res = await eiteCall('printArr', [await eiteCall('importDocument', ['utf8', res])]);
        await eiteCall('popImportSettings', [await getFormatId('utf8')]);
    }
    return await eiteCall('strToByteArray', [res]);
}

async function RunDocumentHandler(callback) {
    startSpinner();
    // Timeout is an awful hack to give the browser time to start displaying the loading spinner. There should be a better way to do this, but I don't know what it is. This method would presumably break on slower computers.
    window.setTimeout(async function(){
        // Do the computation-heavy work
        await eiteCall('runDocument', [await eiteCall('importDocument', ['integerList', await getInputDoc()])]);
        if (callback !== undefined) {
            window.setTimeout(async function() {
                await callback();
                await removeSpinner();
            }, 500);
        }
        else {
            await removeSpinner();
        }
    }, 500);
};

function closeImportDialog() {
    notificationOverlay.removeEventListener('keyup', importDialogEscapeListener);
    let e=document.getElementsByClassName('importDialog');
    i=0;
    while (Object.keys(e).length > 0 && i < Object.keys(e).length) {
        notificationOverlay.style.opacity=0;
        e[i].style.opacity=0;
        e[i].style.transform='translate(-50%, -50%) scale(0.75)';
        i=i+1;
    };
    setTimeout(function(){
        let e=document.getElementsByClassName('importDialog');
        while (Object.keys(e).length > 0) {
            e[0].parentNode.removeChild(e[0]);
        };
        notificationOverlay.style.display='none';
    }, 750);
}

function closeAlertDialog() {
    notificationOverlay.removeEventListener('keyup', alertDialogEscapeListener);
    // Alert dialog also shares importDialog class. Maybe it shouldn't, but anyway.
    let e=document.getElementsByClassName('importDialog');
    i=0;
    while (Object.keys(e).length > 0 && i < Object.keys(e).length) {
        notificationOverlay.style.opacity=0;
        e[i].style.opacity=0;
        e[i].style.transform='translate(-50%, -50%) scale(0.75)';
        i=i+1;
    };
    setTimeout(function(){
        let e=document.getElementsByClassName('importDialog');
        while (Object.keys(e).length > 0) {
            e[0].parentNode.removeChild(e[0]);
        };
        notificationOverlay.style.display='none';
    }, 750);
}

function importDialogEscapeListener(event) {
    if (event.key === 'Escape') {
        closeImportDialog();
    }
}

function alertDialogEscapeListener(event) {
    if (event.key === 'Escape') {
        closeAlertDialog();
    }
}

function openImportDialog() {
    let elem=document.importNode(document.getElementById('importDialogTemplate').content, true);
    elem.firstChild.getElementsByClassName('importFromFileBtn')[0].onclick=function(){importDocumentFromFile();};
    elem.firstChild.getElementsByClassName('importFromUrlBtn')[0].onclick=function(){importDocumentFromURL(prompt('What URL do you want? Note that the same-origin policy must allow the URL to be fetched. (Dangerous workaround if it does not: do NOT do this unless you know what you are doing: To disable same-origin enforcement, you can use CORS Everywhere add-on for Firefox, but it allows any Web site access to any other, including your current logins.)'));};
    elem.firstChild.getElementsByClassName('closeImportDiaBtn')[0].onclick=function(){closeImportDialog();};
    document.addEventListener('keyup', importDialogEscapeListener);
    notificationOverlay=document.getElementById('notificationOverlay');
    notificationOverlay.addEventListener('click', function(event) {
        closeImportDialog();
    });
    notificationOverlay.style.display='block';
    notificationOverlay.style.opacity=1;
    document.body.appendChild(elem.firstChild);
}

function openAlertDialog(message) {
    let elem=document.importNode(document.getElementById('alertDialogTemplate').content, true);
    elem.firstChild.getElementsByClassName('closeAlertDiaBtn')[0].onclick=function(){closeAlertDialog();};
    elem.querySelector('.alertDialogMessageRegion').innerHTML=message;
    document.addEventListener('keyup', alertDialogEscapeListener);
    notificationOverlay=document.getElementById('notificationOverlay');
    notificationOverlay.addEventListener('click', function(event) {
        closeAlertDialog();
    });
    notificationOverlay.style.display='block';
    notificationOverlay.style.opacity=1;
    document.body.appendChild(elem.firstChild);
}

function importDocumentFromFile() {
    startSpinner();
    closeImportDialog();
    window.setTimeout(async function(){
        inFormat=document.getElementById('inFormat').value;
        if (!await eiteCall('isSupportedInputFormat', [inFormat])) {
            await implDie(inFormat+' is not a supported input format!');
        }
        let picker=document.getElementById('filepicker');
        picker.click();
        let file=picker.files[0];
        if (file !== undefined && file !== null) {
            let fr=new FileReader();
            await new Promise(resolve => {
                fr.onload=function (){
                    resolve(undefined);
                };
                fr.readAsArrayBuffer(file);
            });
            document.getElementById('inputarea').value = await eiteCall('strFromByteArray', [await eiteCall('importAndExport', [inFormat, 'integerList', new Uint8Array(fr.result)])]);
        }
        removeSpinner(true);
    }, 500);
};

function importDocumentFromURL(path) {
    if (path === null) {
        return;
    }
    if (path === undefined) {
        closeImportDialog();
        return;
    }
    startSpinner();
    closeImportDialog();
    window.setTimeout(async function(){
        inFormat=document.getElementById('inFormat').value;
        if (!await eiteCall('isSupportedInputFormat', [inFormat])) {
            await implDie(inFormat+' is not a supported input format!');
        }
        try {
            document.getElementById('inputarea').value = await eiteCall('strFromByteArray', [await eiteCall('importAndExport', [inFormat, 'integerList', await eiteCall('getFileFromPath', [path])])]);
        }
        catch(e) {
            removeSpinner(true);
        }
        removeSpinner(true);
    }, 500);
};

function exportNotify(name) {
    let elem=document.importNode(document.getElementById('exportNotifyTemplate').content, true);
    elem.firstChild.innerHTML=name;
    elem.firstChild.id='exportNotifyTempId';
    notificationOverlay=document.getElementById('notificationOverlay');
    notificationOverlay.style.display='block';
    notificationOverlay.style.opacity=1;
    document.body.appendChild(elem.firstChild);
    let elemAppended=document.getElementById('exportNotifyTempId');
    elemAppended.removeAttribute('id');
    setTimeout(function() {
        let e=document.getElementsByClassName('exportNotification');
        i=0;
        while (Object.keys(e).length > 0 && i < Object.keys(e).length) {
            notificationOverlay.style.opacity=0;
            e[0].style.opacity=0;
            e[0].style.transform='translate(-50%, -50%) scale(0.75)';
            i=i+1;
        };
        setTimeout(function(){
            let e=document.getElementsByClassName('exportNotification');
            while (Object.keys(e).length > 0) {
                e[0].parentNode.removeChild(e[0]);
            };
            notificationOverlay.style.display='none';
        }, 2000);
    }, 1250);
}

async function ExportDocument() {
    startSpinner();
    window.setTimeout(async function(){
        let outFormat=document.getElementById('outFormat').value;
        if (!await eiteCall('isSupportedOutputFormat', [outFormat])) {
            await implDie(outFormat+' is not a supported output format!');
        }
        let exported=Uint8Array.from(await eiteCall('importAndExport', ['sems', outFormat, await getInputDoc()]));
        let blob=await new Blob([exported], { type: 'application/octet-stream' });
        let link=document.createElement('a');
        link.href=window.URL.createObjectURL(blob);
        let date=new Date();
        let outName='Export-'+date.getUTCFullYear()+'m'+(date.getUTCMonth()+1)+'d'+date.getUTCDate()+'-'+date.getUTCHours()+'-'+date.getUTCMinutes()+'-'+date.getUTCSeconds()+'-'+date.getUTCMilliseconds()+'-'+date.getTimezoneOffset()+'.'+await eiteCall('getExportExtension', [outFormat]);
        exportNotify(outName);
        link.download=outName;
        link.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: window}));
        removeSpinner(true);
    }, 500);
};

// @license-end
