// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

/* math, provides:
    implAdd
    implSub
    implMul
    implDiv
    implMod
*/

async function implAdd(intA, intB) {
    assertIsInt(intA); assertIsInt(intB); let intReturn;

    intReturn = intA + intB; await assertIsInt(intReturn); return intReturn;
}

async function implSub(intA, intB) {
    assertIsInt(intA); assertIsInt(intB); let intReturn;

    intReturn = intA - intB; await assertIsInt(intReturn); return intReturn;
}

async function implMul(intA, intB) {
    assertIsInt(intA); assertIsInt(intB); let intReturn;

    intReturn = intA * intB; await assertIsInt(intReturn); return intReturn;
}

async function implDiv(intA, intB) {
    assertIsInt(intA); assertIsInt(intB); let intReturn;

    // Should round towards zero. Note a portability gotcha: before C99, rounding was different. See https://stackoverflow.com/questions/17795421/bug-in-glibc-div-code
    // It may be preferable to implement it in StageL directly at some point, but I can't be bothered to figure out how right now, and it would probably be slower than relying on native implementations.

    floatReturn = intA / intB;
    if (floatReturn < 0) {
        intReturn = Math.ceil(floatReturn);
    }
    else {
        intReturn = Math.floor(floatReturn);
    }
    assertIsInt(intReturn); return intReturn;
}

async function implMod(intA, intB) {
    assertIsInt(intA); assertIsInt(intB); let intReturn;

    intReturn = intA % intB; await assertIsInt(intReturn); return intReturn;
}

async function getFileFromPath(path) {
    // Returns an array of bytes.
    let response = await new Promise(resolve => {
        var oReq = new XMLHttpRequest();
        oReq.open('GET', path, true);
        oReq.responseType = 'arraybuffer';
        oReq.onload = function(oEvent) {
            resolve(new Uint8Array(oReq.response)); // Note: not oReq.responseText
        };
        oReq.onerror = function() {
            resolve(undefined);
        }
        oReq.send(null);
    });
    if (response !== undefined) {
        return response;
    }
    await implDie('An error was encountered loading the requested document '+path+'.');
}

// Implementations of routines provided in public-interface.stagel.

async function internalRunDocument(execId) {
    await assertIsExecId(execId);

    // Start actually running the document
    startDocumentExec(execId);

    // Watch for events and add them into strArrayDocumentExecEvents as needed

    let eventsToNotify = [];
    eventsToNotify = await getDesiredEventNotifications(execId);

    // FIXME Unimplemented
}

// Schema: node[id, version, data]; idxPerson[nodeId, publicId, hashedSecretKey]; idxSession[nodeId, sessionKey, created, expires, events]
// Node table is append only. Index tables are read-write. API currently doesn't have person-level permission granularity, or support sessions, and will need breaking changes to fix that. idxPerson and idxSession are both in the idxPerson database for mysql backend.

async function storageSetup(kvStorageCfgParam) {
    kvStorageCfg=kvStorageCfgParam;
    if (typeof kvStorageCfg === 'undefined') {
        kvStorageCfg=[];
    }
    let temp;
    // Later, use OrbitDB. Currently they don't support granting write access after a database has been created, which makes it unusable for this.
    /* ipfsNode = new IPFS();
    await new Promise(resolve => {
        ipfsNode.once('ready', () => {
            resolve()
        });
    }); */
    // Now, set default values for storage providers configuration
    // Provider: MySQL
    temp=await kvGetValue(kvStorageCfg, 'mysqlApi')
    if (''===temp) {
        kvStorageCfg=await kvSetValue(kvStorageCfg, 'mysqlApi', 'http://futuramerlin.com/specification/engineering-and-tech/information-technology/software/env/web/api.php');
    }
    temp=await kvGetValue(kvStorageCfg, 'mysqlUser')
    if (''===temp) {
        kvStorageCfg=await kvSetValue(kvStorageCfg
        , 'mysqlUser', 'UNCONFIGURED');
    }
    temp=await kvGetValue(kvStorageCfg, 'mysqlSecretKey')
    if (''===temp) {
        kvStorageCfg=await kvSetValue(kvStorageCfg
        , 'mysqlSecretKey', 'UNCONFIGURED');
    }
    await setStorageSettings(kvStorageCfg);
    temp=await kvGetValue(kvStorageCfg, 'mysqlSession')
    if (''===temp) {
        let session=await internalStorageMysqlApiRequest('table=idxPerson&action=getSession&user='+await kvGetValue(await getStorageSettings(), 'mysqlUser')+'&secretkey='+await kvGetValue(await getStorageSettings(), 'mysqlSecretKey'));
        if (session === null || session === undefined) {
            await implError('Could not log in!');
        }
        else {
            kvStorageCfg=await kvSetValue(kvStorageCfg, 'mysqlSession', session);
        }
    }
    // Done, so now set the global value to the prepared configuration key-value pairs
    await setStorageSettings(kvStorageCfg);
}

async function storageSave(data) {
    await assertIsIntArray(data); let intRes;
    if (data.constructor.name !== 'Uint8Array') {
        data = new Uint8Array(data);
    }
    /* ipfsNode.files.add(ipfsNode.types.Buffer.from(data), (err, files) => {
        if (err) {
            await implDie(err.toString());
        }
        // "'hash', known as CID, is a string uniquely addressing the data and can be used to get it again. 'files' is an array because 'add' supports multiple additions, but we only added one entry" —https://js.ipfs.io/
        return files[0].hash;
    }); */
    intRes=await intFromIntStr(await internalStorageMysqlApiRequest('table=node&action=insertNode&session='+await kvGetValue(await getStorageSettings(), 'mysqlSession')+'&data=version,0,data,'+await intArrayToBase64(data)));
    await assertIsInt(intRes); return intRes;
}

async function storageRetrieve(id) {
    await assertIsInt(id); let intArrayRes;
    /* ipfsNode.files.cat(id, (err, data) => {
        if (err) {
            await implDie(err.toString());
        }
        return new Uint8Array(data);
    }); */
    intArrayRes=await strToByteArray((await internalStorageMysqlApiRequest('table=node&action=getRowByValue&session='+await kvGetValue(await getStorageSettings(), 'mysqlSession')+'&field=id&value='+await strFrom(id)))['data']);
    await assertIsIntArray(intArrayRes); return intArrayRes;
}

async function storageGetLastNodeID() {
    // Get the latest node ID
    let intRes;
    await assertIsInt(intRes); return intRes;
}

async function internalStorageMysqlApiRequest(queryString) {
    let url=await kvGetValue(await getStorageSettings(), 'mysqlApi')+'?'+queryString;
    let response = await new Promise(resolve => {
    var oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.responseType = 'json';
    oReq.onload = function(oEvent) {
        if (oReq.status !== 200) {
            resolve(null);
        }
        else {
            resolve(oReq.response);
        }
    };
    oReq.onerror = function() {
        resolve(null);
    }
    oReq.send(null);
    });
    return response;
}

async function internalStorageGetTable(tableName) {
    // For testing; will be removed eventually
    let qs='action=getTable&session='+await kvGetValue(await getStorageSettings(), 'mysqlSession')+'&table='+tableName;
    return await internalStorageMysqlApiRequest(qs);
}

eiteLibrarySetup(); // This function call should be the only code other than exports, for easy moduleification. This has to run somehow regardless of whether EITE is being used as a library or normally. This does not call setupIfNeeded, meaning things like nice error messages that that provides aren't available.
async function eiteLibrarySetup() {
    // This function is run when the eite is imported as a script tag. It has to be manually run when eite is imported as a module (unless you call setupIfNeeded or an API interface that calls it for you as the first thing after importing it).
    if (true !== await getSharedState('librarySetupFinished') && true !== await getSharedState('librarySetupStarted')) {
        // Preferences (most preferences should be implemented in EITE itself rather than this implementation of its data format): set defaults if not set already
        await setSharedState('librarySetupStarted', true);
        await setSharedState('librarySetupFinished', false);
        if (await getSharedState('STAGEL_DEBUG') === undefined) {
            await setSharedState('STAGEL_DEBUG', 0);
            await setSharedState('STAGEL_DEBUG_UNSET', true);
        }
        if (await getSharedState('EITE_STORAGE_CFG') === undefined) {
            await setSharedState('EITE_STORAGE_CFG', []);
        }
        if (await getSharedState('importSettings') === undefined) {
            await setSharedState('importSettings', []);
        }
        if (await getSharedState('exportSettings') === undefined) {
            await setSharedState('exportSettings', []);
        }
        if (await getSharedState('envPreferredFormat') === undefined) {
            await setSharedState('envPreferredFormat', '');
        }
        if (await getSharedState('envCharEncoding') === undefined) {
            await setSharedState('envCharEncoding', 'asciiSafeSubset');
        }
        if (await getSharedState('envTerminalType') === undefined) {
            await setSharedState('envTerminalType', 'vt100');
        }
        if (await getSharedState('envLanguage') === undefined) {
            await setSharedState('envLanguage', 'en-US');
        }
        if (await getSharedState('envLocaleConfig') === undefined) {
            await setSharedState('envLocaleConfig', 'inherit:usa,');
        }
        if (await getSharedState('envCodeLanguage') === undefined) {
            await setSharedState('envCodeLanguage', 'javascript');
        }
        if (await getSharedState('envResolutionW') === undefined) {
            await setSharedState('envResolutionW', '0');
        }
        if (await getSharedState('envResolutionH') === undefined) {
            await setSharedState('envResolutionH', '0');
        }

        // Shared state variables
        await setSharedState('datasets', []); // as
        await setSharedState('datasetsLoaded', false);
        await setSharedState('dcData', []); // an
        await setSharedState('strArrayDocumentExecData', []); // as: holds the current document state for any documents being executed.
        await setSharedState('strArrayDocumentExecSymbolIndex', []); // as: holds a key-value-pair list of symbols for each doc. Example string that could go in this: "25 1 0 1 :129,5 1 3 278 :343," indicates that the document it goes with contains two symbols: the first is named 25 1 0 1 (which is Dcs) and is located at strArrayDocumentExecData[129], and the second is named 5 1 3 278 and is located at strArrayDocumentExecData[343]. Symbols get stuck onto the end of the currently executing document's data and their positions recorded in this index.
        await setSharedState('strArrayDocumentExecPtrs', []); // as: holds the current execution state of each document as a comma-separated list of ints with the last indicating the position in the document where execution is (the earlier ints represent where execution should return to upon exiting the current scope, so it acts as a stack). When the document finishes executing (the pointer runs off the end of the document), the pointer position is set to -1. (not implemented)
        await setSharedState('strArrayDocumentExecFrames', []); // as: holds strings of space-terminated integers representing Dcs to be rendered.
        await setSharedState('strArrayDocumentExecEvents', []); // as: holds comma-delimited strings of space-terminated integers representing the Dcs of event data that have not been processed yet.
        await setSharedState('strArrayDocumentExecLogs', []); // as: holds comma-delimited strings of warning messages, like the import and export warning logs, except with a separate warning message array for each document execution.
        await setSharedState('strArrayDocumentExecSettings', []); // as: holds comma-delimited strings of exec setting key/value pairs. For example, might be a good setting string for running a unit test that aborts if it's still running at 50 ticks and running without I/O: stopExecAtTick:50,runHeadless:true,
        await setSharedState('setupFinished', false);
        await setSharedState('intPassedTests', 0);
        await setSharedState('intFailedTests', 0);
        await setSharedState('intTotalTests', 0);
        await setSharedState('intArrayTestFrameBuffer', []); // an
        await setSharedState('eiteWasmModule', undefined);
        await setSharedState('strArrayImportDeferredSettingsStack', []); // as
        await setSharedState('strArrayExportDeferredSettingsStack', []); // as
        await setSharedState('strArrayImportWarnings', []); // as
        await setSharedState('strArrayExportWarnings', []); // as
        await setSharedState('strArrayStorageCfg', []); // as
        await setSharedState('ipfsNode', undefined);
        await setSharedState('haveDom', false);
        await setSharedState('internalDelegateStateRequests', false); // if set to true, pass back get/set shared state requests to the Web worker's host, allowing state to be kept in sync between the worker and host.

        await setSharedState('stagelDebugCallstack', []);
        await setSharedState('stagelDebugCallNames', []);
        await setSharedState('stagelDebugCallCounts', []);
        await setSharedState('stagelDebugCollection', "");
        //alert("Setting up logging");

        // Next code is support for the eiteCall routine which allows calling other eite routines using a Web worker if available.

        // To call a routine from eite, running it as a worker if available, run: await eiteCall('routineName', [param1, param2, param3...]); (with the brackets around the params). There's also eiteHostCall('routineName', [params...]) for calling functions from the worker that can't be called from a worker.

        // Promise-wrapped worker strategy is inspired by Gilad Dayagi's implementation described at https://codeburst.io/promises-for-the-web-worker-9311b7831733

        if (typeof window !== 'undefined') {
            // Not running as a Web worker
            window.eiteCall = async function(funcName, args) {
                if (args === undefined) {
                    args=[];
                }
                return await window[funcName]( ...args );
            };
            window.eiteHostCall = window.eiteCall;
            if (window.Worker) {
                window.eiteWorker = new Worker('eite.js');
                window.eiteWorkerResolveCallbacks = {};
                window.eiteWorkerCallID = 0;
                // no need to declare it async when it explicitly returns a promise
                window.eiteCall = function(funcName, args) {
                    if (args === undefined) {
                        args=[];
                    }
                    window.eiteWorkerCallID = window.eiteWorkerCallID + 1;
                    let thisCallId=window.eiteWorkerCallID;
                    let thisCall={uuid: 'b8316ea083754b2e9290591f37d94765EiteWebworkerRequest', msgid: thisCallId, args: [funcName, args]};
                    return new Promise(function(resolve) {
                        window.eiteWorkerResolveCallbacks[thisCallId]=resolve;
                        window.eiteWorker.postMessage(thisCall);
                    });
                };
                window.eiteHostRequestInternalOnMessage = async function(message) {
                    // The host accepted a message; this function processes it
                    const uuid = message.data.uuid;
                    const msgid = message.data.msgid;
                    const args = message.data.args;
                    await implDebug('Host understood message '+msgid+' from worker: '+args, 1);
                    await internalDebugLogJSObject(message);
                    let res = await window[args[0]]( ...args[1] );
                    await implDebug('Request made of host by worker in message '+msgid+' returned the result: '+res, 1);
                    window.eiteWorker.postMessage({uuid: 'b8316ea083754b2e9290591f37d94765EiteWebworkerHostResponse', msgid: msgid, args: res});
                }
                window.eiteWorker.onmessage = async function(message) {
                    // Handle messages sent to this code when it is not running as a Web worker
                    const uuid = message.data.uuid;
                    const msgid = message.data.msgid;
                    const msgdata = message.data.args;
                    await implDebug('Host got message '+msgid+' from worker: '+msgdata, 1);
                    await internalDebugLogJSObject(message);
                    if (uuid === 'b8316ea083754b2e9290591f37d94765EiteWebworkerResponse') {
                        if (msgdata === undefined) {
                            await implDebug('Web worker returned undefined result in message '+msgid+'.', 1);
                        }
                        let resolveCallback;
                        resolveCallback = window.eiteWorkerResolveCallbacks[msgid];
                        if (resolveCallback !== undefined) {
                            resolveCallback(msgdata);
                            delete window.eiteWorkerResolveCallbacks[msgid];
                        }
                        else {
                            await implDie('Web worker returned invalid message ID '+msgid+'.');
                            throw 'Web worker returned invalid message ID '+msgid+'.';
                        }
                    }
                    else if (uuid === 'b8316ea083754b2e9290591f37d94765EiteWebworkerHostRequest') {
                        window.eiteHostRequestInternalOnMessage(message);
                    }
                    else if (uuid === 'b8316ea083754b2e9290591f37d94765EiteWebworkerError') {
                        await implDie('Web worker with message '+msgid+' encountered an error: '+msgdata+'.');
                        throw 'Web worker with message '+msgid+' encountered an error: '+msgdata+'.';
                    }
                };
            }
        }
        else {
            self.eiteCall = async function(funcName, args) {
                if (args === undefined) {
                    args=[];
                }
                return await self[funcName]( ...args );
            }
            self.eiteHostCall = self.eiteCall;
        }

        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            // Running as a Web worker, so set up accordingly
            self.internalOnMessage = async function(message) {
                // The worker accepted a message; this function processes it
                const uuid = message.data.uuid;
                const msgid = message.data.msgid;
                const args = message.data.args;
                await implDebug('Worker understood message '+msgid+' from host: '+args, 1);
                await internalDebugLogJSObject(message);
                let res;
                try {
                    res = await self[args[0]]( ...args[1] );
                }
                catch(error) {
                    self.postMessage({uuid: 'b8316ea083754b2e9290591f37d94765EiteWebworkerError', msgid: msgid, args: error.message + ' (call: ' + args[0] + ', ' + args[1].toString() + ')'});
                    throw error;
                }
                await implDebug('Request made of worker by host in message '+msgid+' returned the result: '+res, 1);
                self.postMessage({uuid: 'b8316ea083754b2e9290591f37d94765EiteWebworkerResponse', msgid: msgid, args: res});
            }

            self.onmessage = async function(message) {
                // Handle messages sent to this code when it is running as a Web worker
                const uuid = message.data.uuid;
                const msgid = message.data.msgid;
                const args = message.data.args;
                await implDebug('Worker got message '+msgid+' from host: '+args, 1);
                await internalDebugLogJSObject(message);
                if (uuid === 'b8316ea083754b2e9290591f37d94765EiteWebworkerRequest') {
                    self.internalOnMessage(message);
                }
                else if (uuid === 'b8316ea083754b2e9290591f37d94765EiteWebworkerHostResponse') {
                    if (args === undefined) {
                        await implDebug('Host sent undefined contents in message '+msgid+'.', 1);
                    }
                    let resolveCallback;
                    resolveCallback = self.eiteWorkerHostResolveCallbacks[msgid];
                    if (resolveCallback !== undefined) {
                        resolveCallback(args);
                        delete self.eiteWorkerHostResolveCallbacks[msgid];
                    }
                    else {
                        await implDie('Host returned invalid message ID.');
                        throw 'Host returned invalid message ID.';
                    }
                }
            }

            self.eiteWorkerHostResolveCallbacks = {};
            self.eiteWorkerHostCallID = 0;
            // no need to declare it async when it explicitly returns a promise
            self.eiteHostCall = function(funcName, args) {
                if (args === undefined) {
                    args=[];
                }
                self.eiteWorkerHostCallID = self.eiteWorkerHostCallID + 1;
                let thisCallId=self.eiteWorkerHostCallID;
                let thisCall={uuid: 'b8316ea083754b2e9290591f37d94765EiteWebworkerHostRequest', msgid: thisCallId, args: [funcName, args]};
                return new Promise(function(resolve) {
                    self.eiteWorkerHostResolveCallbacks[thisCallId]=resolve;
                    self.postMessage(thisCall);
                });
            };
            //getWindowOrSelf()['internalDelegateStateRequests'] = true; // This would make the host and worker use the same shared state. That breaks things though, so don't. Still, it's interesting to have support in the code for it, just as reference to show that it can be done even without SharedArrayBuffer. (not exactly groundbreaking, I know, but whatever, it's only a couple of extra lines to leave the delegated requests support in)
        }
        await setSharedState('librarySetupFinished', true);
        /*if (await getSharedState('STAGEL_DEBUG_UNSET') === 'true') {
            if (await getSharedState('STAGEL_DEBUG') === 0) {
                await setSharedState('STAGEL_DEBUG', 1);
            }
        }*/
    }
}

function internalSleep(ms) {
    // from https://web.archive.org/web/20190111230631/https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getSharedState(name) {
    if (getWindowOrSelf()['internalDelegateStateRequests'] === true) {
        return await eiteHostCall('getSharedState', [name]);
    }
    else {
        return getWindowOrSelf()[name];
    }
}

async function setSharedState(name, value) {
    if (getWindowOrSelf()['internalDelegateStateRequests'] === true) {
        await eiteHostCall('setSharedState', [name, value]);
    }
    else {
        await implDebug('State change for ' + name + ' to ' + value + '.', 3);
        getWindowOrSelf()[name] = value;
    }
}

async function isSetupFinished() {
    return await getSharedState('setupFinished');
}

async function setupIfNeeded() {
    if (await getSharedState('librarySetupFinished') !== 'true') {
        await eiteLibrarySetup();
    }
    if (await getSharedState('setupFinished')) {
        return;
    }
    await internalSetup();
}

// Main setup logic
async function internalSetup() {
    // Load WebAssembly components. Functions provided by them are available with await wasmCall('functionName', argument), where argument is an int or an array of ints.
    // https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running
    await eiteHostCall('internalEiteReqWasmLoad', ['wasm-common/eite-c-exts.c.wat']);

    // Set up environment variables.

    // Detect if we can create DOM nodes (otherwise we'll output to a terminal). This is used to provide getEnvironmentPreferredFormat.
    if (await eiteHostCall('internalEiteReqTypeofWindow') !== 'undefined') {
        await setSharedState('haveDom', true);
    }
    let charset = await eiteHostCall('internalEiteReqCharset');
    if (charset === 'utf-8') {
        await setSharedState('envCharEncoding', 'utf8');
    }
    else {
        await implWarn("Unimplemented character set: " + charset + ". Falling back to asciiSafeSubset.");
    }
    if (await getSharedState('haveDom')) {
        // Web browsers, etc.
        await setSharedState('envPreferredFormat', 'htmlFragment');
        await setSharedState('envResolutionW', await eiteHostCall('internalEiteReqOutputWidth'));
        await setSharedState('envResolutionH', await eiteHostCall('internalEiteReqOutputHeight'));
    }
    else {
        // Command-line, e.g. Node.js
        await setSharedState('envPreferredFormat', 'characterCells');
        await setSharedState('envResolutionW', process.stdout.columns);
        await setSharedState('envResolutionH', process.stdout.rows);
        if (await getSharedState('envResolutionW') === 0 || await getSharedState('envResolutionH') === 0 || await getSharedState('envResolutionW') === undefined || await getSharedState('envResolutionH') === undefined) {
            await setSharedState('envPreferredFormat', 'immutableCharacterCells');
            // Maybe it's headless, or going to a text file or something? Not tested, but let's just assume we've got 80 columns to work with, and set the height to 1 so apps don't try to draw text-mode GUIs and stuff maybe.
            await setSharedState('envResolutionW', 80);
            await setSharedState('envResolutionH', 1);
        }
    }
    if (await getSharedState('envResolutionW') === 0 || await getSharedState('envResolutionH') === 0 || await getSharedState('envResolutionW') === undefined || await getSharedState('envResolutionH') === undefined) {
        await implWarn('The resolution detected was zero in at least one dimension. Width = '+await getSharedState('envResolutionW')+'; height = '+await getSharedState('envResolutionH')+'. Things may draw incorrectly. TODO: Add a way to configure this for environments that misreport it.');
    }

    // Set up data sets.

    await setSharedState('datasets', await listDcDatasets());
    if (!await getSharedState('datasetsLoaded')) {
        await internalLoadDatasets();
    }

    // Fill out format settings arrays in case they aren't yet
    let settingsCount=Object.keys(await listFormats()).length;
    let tempSettings;
    for (let settingsCounter=0; settingsCounter < settingsCount; settingsCounter++) {
        if (await getSharedState('importSettings')[settingsCounter] === undefined) {
            tempSettings = await getSharedState('importSettings');
            tempSettings[settingsCounter] = '';
            await setSharedState('importSettings', tempSettings);
            tempSettings = [];
        }
    }
    settingsCount=Object.keys(await listFormats()).length;
    for (let settingsCounter=0; settingsCounter < settingsCount; settingsCounter++) {
        if (exportSettings[settingsCounter] === undefined) {
            tempSettings = await getSharedState('exportSettings');
            tempSettings[settingsCounter] = '';
            await setSharedState('exportSettings', tempSettings);
        }
    }

    // Set up storage

    await storageSetup(await getSharedState('EITE_STORAGE_CFG'));

    // Other startup stuff.

    if (await getSharedState('haveDom')) {
        // Override error reporting method to show alert

        registerSpeedup('implError', async function (strMessage) {
            if(typeof strMessage !== "string") {
                await eiteHostCall('internalEiteReqAlert', ["EITE reported an error! You may want to reload the page. The error was: Nonstring error message!"]);
                throw "Nonstring error message";
            }
            // Don't call await assertIsStr(strMessage); here since it can call implDie and cause a recursive loop — maybe??

            //await FIXMEUnimplemented("implError");
            await implWarn(strMessage);

            await console.trace();
            await eiteHostCall('internalEiteReqAlert', ["EITE reported an error! You may want to reload the page. The error was: " + strMessage]);
        });

        registerSpeedup('implWarn', async function (strMessage) {
            await assertIsStr(strMessage);
            // Log the provided message

            await FIXMEUnimplemented("implWarn");
            await implLog(strMessage);

            await console.trace();
        });

        registerSpeedup('implLog', async function (strMessage) {
            await assertIsStr(strMessage);
            // Log the provided message

            await console.log(strMessage);
            //await console.trace();
            if(await Object.keys(stagelDebugCallstack).length > 0) {
                await console.log("Previous message sent at: " + await internalDebugPrintStack());
            }
            else {
                if (2 <= await getSharedState('STAGEL_DEBUG') && 3 > await getSharedState('STAGEL_DEBUG')) {
                    await console.log("(Previous message sent from non-StageL code.)");
                    await console.trace();
                }
            }
            if (3 <= await getSharedState('STAGEL_DEBUG')) {
                await console.trace();
            }
        });
    }

    await setSharedState('setupFinished', true);
}

function getWindowOrSelf() {
    if (typeof this !== 'undefined') {
        return this;
    }
    else if (typeof window !== 'undefined') {
        return window;
    }
    else {
        return self;
    }
}

function registerSpeedup(name, func) {
    getWindowOrSelf()[name] = func;
}

// Routines needed for Web worker requests
async function internalEiteReqCharset() {
    return document.characterSet.toLowerCase();
}

async function internalEiteReqOutputWidth() {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}

async function internalEiteReqOutputHeight() {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
}

async function internalEiteReqWat2Wabt(watData) {
    let watStr=await strFromByteArray(watData);
    let wasmArray;
    let wabtWasmObject;
    let wabtFeaturesArray = [ 'exceptions', 'mutable_globals', 'sat_float_to_int', 'sign_extension', 'simd', 'threads', 'multi_value', 'tail_call' ];
    let wabtFeaturesObject={};
    for (let feature of wabtFeaturesArray) {
        wabtFeaturesObject[feature] = false;
    }
    return await new Promise(resolve => {
        WabtModule().then(async function(wabt) {
            try {
                wabtWasmObject=wabt.parseWat('test.wast', watStr, wabtFeaturesObject);
                wabtWasmObject.resolveNames();
                wabtWasmObject.validate(wabtFeaturesObject);
                wasmArray=new Uint8Array(await new Response(new Blob([wabtWasmObject.toBinary({log: true, write_debug_names:true}).buffer])).arrayBuffer());
                resolve(wasmArray);
            } catch (e) {
                await implDie('Failed loading WebAssembly module.');
            } finally {
                if (wabtWasmObject) {
                    wabtWasmObject.destroy();
                }
            }
        });
    });
}

async function internalEiteReqWasmLoad(path) {
    let importObject = {
        imports: {
            // If there were JavaScript functions that the C code could call, they would go here. For calling C functions from JavaScript, use instance.exports.exported_func();. I could have an import object passed to internalEiteReqWasmLoad, but don't see the need for it at the moment, so this is just here for documentation.
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate
            /*
            imported_func: function(arg) {
                console.log(arg);
            }
            */
        }
    };
    let wasmData=await eiteHostCall('internalEiteReqWat2Wabt', [await getFileFromPath(path)]);
    await setSharedState('eiteWasmModule', await WebAssembly.instantiate(wasmData, importObject));
}

async function internalEiteReqTypeofWindow() {
    return typeof window;
}

async function internalEiteReqAlert(msg) {
    await alert(msg);
    return null;
}

async function internalEiteReqLoadDataset(dataset) {
    // Papa.parse call has to be run from the main thread because Papa isn't defined in the worker since it was only imported in the main thread.
    return await new Promise(resolve => {
        Papa.parse('data/' + dataset + '.csv', {
            download: true,
            encoding: "UTF-8",
            newline: "\n",
            delimiter: ",",
            quoteChar: "\"",
            complete: async function(results, file) {
                resolve(results.data);
            },
            error: async function(results, file) {
                await implError("Error reported while parsing "+dataset+"!");
                resolve(undefined);
            }
        });
    });
}

async function internalLoadDatasets() {
    // This is a separate function since it may later be desirable to dynamically load datasets while a document is running (so only the needed datasets are loaded).
    let count = 0;
    let dataset = '';
    let temp;
    let datasets=await getSharedState('datasets');
    while (count < Object.keys(datasets).length) {
        dataset = datasets[count];
        temp=await getSharedState('dcData');
        temp[dataset] = [];
        // I guess the anonymous functions defined as parameters to the Papa.parse call inherit the value of dataset from the environment where they were defined (i.e., here)??
        temp[dataset] = await eiteHostCall('internalEiteReqLoadDataset', [dataset]);
        await setSharedState('dcData', temp);
        count = count + 1;
    }
    await setSharedState('datasetsLoaded', true);
}

let Base16b = {
    /* Based on https://web.archive.org/web/20090902074623/http://www.base16b.org/doc/specification/version/0.1/base16b.pdf */
    // This code for the Base16b object is included under the following license:
    /**
    * Base16b family encode / decode
    * http://base16b.org/lib/version/0.1/js/base16b.js
    * or http://base16b.org/lib/js/base16b.js
    **/
    /*
    Copyright (c) 2009 Base16b.org
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
    */
    // private variables
    // +UF0000 is the first code point in the Asyntactic script
    _asStart: {
        value: 0x0000,
        cp: 0xF0000
    },
    _noncont: function() {
        let nc = []; // array of cp : value mappings for the non-contiguous code points
        nc[0] = {
            value: 0xFFFE,
            cp: 0xF80A
        };
        nc[1] = {
            value: 0xFFFF,
            cp: 0xF80B
        };
        nc[2] = {
            value: 0x1FFFE,
            cp: 0xF80C
        };
        nc[3] = {
            value: 0x1FFFF,
            cp: 0xF80D
        };
        return nc;
    },
    // private methods
    _CharBytes: function(segmCP) { // return the number of bytes needed for the character. Usually 2.
        if (this._fixedCharCodeAt(segmCP, 0) && this._fixedCharCodeAt(segmCP, 1)) {
            return 2;
        }
        else {
            return 1;
        }
    },
    _CharBytesFixed: function(segmCP) { // return the number of bytes needed for the character. Usually 2.
        let code = segmCP.charCodeAt(0);
        if (0xD800 <= code && code <= 0xDBFF) { // High surrogate
            return 2;
        }
        if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
            return 2;
        }
        return 1;
    },
    _invertVal: function(segmVal, base) {
        // Two's complement of the value for this base
        return Math.pow(2, base) - (segmVal + 1);
    },
    _fromCodePoint: function(segmCP, bytes) {
        // Map Code Point to a segment value as specified by the mapping table for this base in the Asyntactic script
        if (bytes === 2) {
            return this._fixedCharCodeAt(segmCP, 0) - this._asStart.cp;
        }
        let i;
        for (i = 0; i < this._noncont().length; i++) {
            // handle non-contiguous code points for last two CPs in bases 16 and 17
            if (this._fixedFromCharCode(this._noncont()[i].cp) === segmCP) {
                return this._noncont()[i].value;
            }
        }
    },
    _toCodePoint: function(segmVal, base) {
        // Map a segment value to the Code Point specified by the mapping table for this base in the Asyntactic script
        if (base < 16) {
            return this._asStart.cp + segmVal;
        }
        let i;
        for (i = 0; i < this._noncont().length; i++) {
            // handle non-contiguous code points for bases 16 and 17
            if (this._noncont()[i].value === segmVal) {
                return this._noncont()[i].cp;
            }
        }
        return this._asStart.cp + segmVal;
    },
    _fixedFromCharCode: function(codePt) {
        // Fix the standard String.FromCharCode method to handle non-BMP unicode planes
        // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/String/fromCharCode
        if (codePt > 0xFFFF) {
            codePt -= 0x10000;
            return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
        }
        else {
            return String.fromCharCode(codePt);
        }
    },
    _fixedCharCodeAt: function(str, idx) {
        // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/String/charCodeAt
        let code = str.charCodeAt(idx);
        let hi;
        let low;
        if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
            hi = code;
            low = str.charCodeAt(idx + 1);
            return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
        }
        if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
            hi = str.charCodeAt(idx - 1);
            low = code;
            return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
        }
        return code;
    },
    // public method for encoding
    encode: function(inputArr, base) {
        /*
        Encode an array of pseudo-booleans (0 or 1)
        The specification of the encoding is documented elsewhere on this site. (Search Asyntactic script and Base16b.)
        */
        try {
            if (!(base >= 7 && base <= 17)) {
                throw ('invalid encoding base: ' + base);
            }
            let resultArr = [];
            let fullSegments = Math.floor(inputArr.length / base);
            let remainBits = inputArr.length - (fullSegments * base);
            let segment;
            let bit;
            let segmstart;
            let segmVal; // construct the value of the bits in the current segment
            let currsegm;
            // convert the next segment of base number of bits to decimal
            for (segment = 0; segment < fullSegments; segment++) {
                // input and output both read from left to right
                segmstart = base * segment;
                currsegm = inputArr.slice(segmstart, segmstart + base);
                // most significant bit at the start (left) / least significant bit at the end (right).
                segmVal = 0;
                for (bit = base - 1; bit >= 0; bit--) {
                    segmVal += (currsegm[bit] * Math.pow(2, (base - 1) - bit));
                }
                resultArr[segment] = this._fixedFromCharCode(this._toCodePoint(segmVal, base));
            }
            // encode the termination character
            segmVal = 0;
            segmstart = base * segment;
            currsegm = inputArr.slice(segmstart);
            for (bit = remainBits - 1; bit >= 0; bit--) {
                segmVal += (currsegm[bit] * Math.pow(2, (remainBits - 1) - bit));
            }
            resultArr[segment] = this._fixedFromCharCode(this._toCodePoint(this._invertVal(segmVal, base), base));
            return resultArr.join('');
        }
        catch (e) {
            //alert(e);
            return false;
        }
    },
    // public method for decoding
    decode: function(inputStr, remainderLength) {
        // remainderLength is not in the original version of this code. It should be provided to get the expected result. It is the input length in bits, mod the number of bits per character (the second argument to the encode function). Other fixes to decoding are also made if remainderLength is provided. If it is not provided, the output should be the same as with original API (if not, that's a bug).
        /*
        Decode a string encoded in the Asyntactic script. Return an array of pseudo-booleans (0 or 1)
        The specification of the encoding is documented elsewhere on this site. (Search Asyntactic script and Base16b.)
        */
        try {
            let originalApi = true;
            if (remainderLength !== undefined) {
                originalApi = false;
            }
            let resultArr = [];
            let termCharBytes = this._CharBytesFixed(inputStr.slice(-1));
            let termCharCP = inputStr.slice(-termCharBytes); // get the termination character
            let termCharVal = this._fromCodePoint(termCharCP, termCharBytes);
            let bit = 17;
            let base;
            // decode the base from the termination character
            while (Math.floor(termCharVal / Math.pow(2, bit - 1)) === 0 && bit >= 7) {
                bit--;
            }
            if (!(bit >= 7 && bit <= 17)) {
                throw ('invalid encoding base');
            }
            else {
                base = bit;
            }
            let segmVal;
            let currCharBytes;
            let bytesUsed = 0;
            let fullBytes = inputStr.length - termCharBytes;
            let decodedBit = 0;
            let segmentBitLength = currCharBytes * 8;
            if (!originalApi) {
                segmentBitLength = base;
            }
            while (bytesUsed < fullBytes) {
                // decode the code point segments in sequence
                currCharBytes = this._CharBytesFixed(inputStr.slice(bytesUsed, bytesUsed + 1)); // taste before taking a byte
                termCharCP = inputStr.slice(bytesUsed, bytesUsed + currCharBytes);
                let segmVal = this._fromCodePoint(termCharCP, currCharBytes);
                // most significant bit at the start (left) / least significant bit at the end (right).
                for (bit = segmentBitLength - 1; bit >= 0; bit--) {
                    decodedBit=Math.floor((segmVal / Math.pow(2, (bit))) % 2);
                    if (!originalApi) {
                        if (Number.isNaN(decodedBit)) {
                            throw ('Found NaN while decoding');
                        }
                    }
                    resultArr.push(decodedBit);
                }
                bytesUsed += currCharBytes;
            }
            // remainder
            let remainVal = this._invertVal(termCharVal, base); // decode the remainder from the termination character
            bit = (termCharBytes * 8) - 1;
            if (!originalApi) {
                bit = remainderLength - 1;
            }
            for (bit; bit >= 0; bit--) {
                resultArr.push(Math.floor((remainVal / Math.pow(2, (bit))) % 2));
            }
            return resultArr;
        }
        catch (e) {
            //alert(e);
            return false;
        }
    },
    // public method for counting Unicode characters
    trueLength: function(inputStr) {
        /*
        Count the number of characters in a string.
        This function can handle stings of mixed BMP plane and higher Unicode planes.
        Fixes a problem with Javascript which incorrectly that assumes each character is only one byte.
        */
        let strBytes = inputStr.length;
        let strLength = 0;
        let tallyBytes = 0;
        try {
            while (tallyBytes < strBytes) {
                tallyBytes += this._CharBytes(inputStr.slice(tallyBytes, tallyBytes + 2));
                strLength += 1;
            }
            return strLength;
        }
        catch (e) {
            //alert(e);
            return false;
        }
    }
};

/* type-conversion, provides:
    intFromIntStr
    strFrom
    charFromByte
    byteFromChar
*/

async function intFromIntStr(str) {
    await assertStrContainsOnlyInt(str); let intReturn;

    intReturn = parseInt(str, 10); await assertIsInt(intReturn); return intReturn;
}

async function strFrom(input) {
    await assertIsGeneric(input); let strReturn;

    strReturn = String(input); await assertIsStr(strReturn); return strReturn;
}

async function charFromByte(intInput) {
    await assertIsInt(intInput); let strReturn;

    // Expects a decimal byte as input. Bear in mind that StageL doesn't attempt to support Unicode.

    strReturn = String.fromCharCode(intInput); await assertIsStr(strReturn); return strReturn;
}

async function byteFromChar(strInput) {
    await assertIsStr(strInput);
    // Bear in mind that StageL doesn't attempt to support Unicode.
    // We can't use assertIsChar here, because it depends on byteFromChar.
    let intReturn;
    intReturn = strInput.charCodeAt(0);

    await assertIsTrue(intReturn > 31);
    await assertIsTrue(intReturn < 127);

    await assertIsInt(intReturn); return intReturn;
}

async function utf8BytesFromDecimalChar(intInput) {
    // Returns a Uint8 array of bytes representing the UTF-8 encoding of the character, given decimal representation of the character as input. FIXME: Probably doesn't support unpaired surrogates or byte sequences outside of the range allowed by Unicode characters, but it probably should.
    let utf8encoder = new TextEncoder();
    return utf8encoder.encode(String.fromCodePoint(intInput));
}

async function firstCharOfUtf8String(intArrayInput) {
    // Returns a decimal representing the Unicode codepoint of the first character, given decimal representation of a UTF-8 string as input.
    let utf8decoder = new TextDecoder();
    return utf8decoder.decode(new Uint8Array(intArrayInput)).codePointAt(0);
}

async function lastCharOfUtf8String(intArrayInput) {
    // Returns a decimal representing the Unicode codepoint of the last character, given decimal representation of a UTF-8 string as input.
    await assertIsTrue(await arrNonempty(intArrayInput));
    let utf8decoder = new TextDecoder();
    // You have got to be kidding me. https://web.archive.org/web/20190318025116/https://stackoverflow.com/questions/46157867/how-to-get-the-nth-unicode-character-from-a-string-in-javascript
    let tempStrCharArray = [...utf8decoder.decode(new Uint8Array(intArrayInput))];
    return tempStrCharArray.slice(-1)[0].codePointAt(0);
}

async function internalIntBitArrayToBasenbString(intBase, intBitArrayInput) {
    let res;
    res=Base16b.encode(intBitArrayInput, intBase);
    if (res !== false) {
        return new TextEncoder().encode(res);
    }
    await implDie('Base16b.encode returned false');
}

async function internalIntBitArrayFromBasenbString(byteArrayInput, intRemainder) {
    let res;
    res=Base16b.decode(new TextDecoder().decode(new Uint8Array(byteArrayInput)), intRemainder);
    if (res !== false) {
        return res;
    }
    await implDie('Base16b.decode returned false');
}

async function intArrayToBase64(byteArrayInput) {
    await assertIsByteArray(byteArrayInput); let strRes;
    // based on https://stackoverflow.com/questions/6978156/get-base64-encode-file-data-from-input-form
    let uint8ToString = function uint8ToString(buf) {
        let i;
        let length;
        let out = '';
        for (i = 0, length = buf.length; i < length; i += 1) {
            out += String.fromCharCode(buf[i]);
        }
        return out;
    }
    if (byteArrayInput.constructor.name !== 'Uint8Array') {
        byteArrayInput = new Uint8Array(byteArrayInput);
    }
    return btoa(uint8ToString(byteArrayInput));
}

/* arrays, provides:
    append
    subset
    push
    pop
    shift
    hasIndex
    get
    getNext
    first
    last
    setElement
    count
*/

async function append(array1, array2) {
    await assertIsArray(array1); await assertIsGenericItem(array2); let arrayReturn;

    if (array1.constructor.name !== 'Uint8Array' && array2.constructor.name !== 'Uint8Array') {
        arrayReturn=array1.concat(array2);
    }
    else {
        if (array1.constructor.name !== 'Uint8Array') {
            arrayReturn=array1.concat(Array.from(array2));
        }
        else {
            if(array2.constructor.name !== 'Uint8Array') {
                arrayReturn=Array.from(array1).concat(array2);
            }
            else {
                arrayReturn=Array.from(array1).concat(Array.from(array2));
            }
        }
    }
    await assertIsArray(arrayReturn); return arrayReturn;
}

async function subset(array, start, end) {
    await assertIsArray(array); await assertIsInt(start); await assertIsInt(end); let arrayReturn;

    arrayReturn=array.slice(start, end);

    await assertIsArray(arrayReturn); return arrayReturn;
}

async function push(array1, array2) {
    // Not necessary since it just wraps append, which does this anyway: await assertIsArray(array1); await assertIsArray(array2);

    return await append(array1, array2);
}

async function pop(array) {
    return await subset(array, 0, -2);
}

async function shift(array) {
    return await subset(array, 1, -1);
}

async function hasIndex(array, index) {
    let len = await count(array);
    if (index > count - 1) {
        return false;
    }
    return true;
}

async function get(array, index) {
    await assertIsArray(array); await assertIsInt(index); let returnVal;

    await assertHasIndex(array, index);
    if (index < 0) {
        /* JavaScript arrays don't allow negative indices without doing it this way */
        returnVal = array.slice(index)[0];
    }
    else {
        returnVal=array[index];
    }

    await assertIsGeneric(returnVal); return returnVal;
}

async function getNext(array, index) {
    await assertIsArray(array); await assertIsInt(index); let returnVal;

    returnVal=array[index + 1];

    await assertIsGeneric(returnVal); return returnVal;
}

async function first(array) {
    await assertIsArray(array); let returnVal;

    returnVal=array[0];

    await assertIsGeneric(returnVal); return returnVal;
}

async function last(array) {
    await assertIsArray(array); let returnVal;

    returnVal=array.slice(-1)[0];

    await assertIsGeneric(returnVal); return returnVal;
}

async function setElement(array, index, value) {
    await assertIsArray(array); await assertIsInt(index); await assertIsGeneric(value);

    let len = await count(array);
    if (index > count) {
        await implDie("Cannot insert to a position greater than appending to the length of the array.");
    }
    if (index < 0) {
        index = len + index;
    }
    array[index] = value;

    await assertIsArray(array); return array;
}

async function setElem(array, index, value) {
    return await setElement(array, index, value);
}

async function count(array) {
    if (array.constructor.name === 'Uint8Array') {
        return array.byteLength;
    }
    await assertIsArray(array);
    return Object.keys(array).length;
}

/* strings, provides:
    implCat
    substring
    len
*/

async function implCat(strA, strB) {
    await assertIsStr(strA); await assertIsStr(strB); let strReturn;

    return strA + "" + strB;
}

async function substring(str, intStart, intLength) {
    await assertIsStr(str); await assertIsInt(intStart); await assertIsInt(intLength); let strReturn;

    if (intLength < 0) {
        intLength = str.length + 1 + intLength;
    }

    return str.substring(intStart, intStart + intLength);
}

async function len(str) {
    await assertIsStr(str); let intReturn;

    return str.length;
}

async function strReplace(str, find, replace) {
    await assertIsStr(str); await assertIsStr(find); await assertIsStr(replace);

    return str.replace(find+'', replace+''.replace('$', '$$'));
}

/* logging, provides:
    implDie
    implWarn
    implLog
    implDebug
    setDebugLevel
    FIXMEUnimplemented
*/

async function implDie(strMessage) {
    // Don't call await assertIsStr(strMessage); here since it can call implDie and cause a recursive loop

    await implError(strMessage);

    throw strMessage;
}

async function implError(strMessage) {
    if(typeof strMessage !== "string") {
        throw "Nonstring error message";
    }
    // Don't call await assertIsStr(strMessage); here since it can call implDie and cause a recursive loop — maybe??

    //await FIXMEUnimplemented("implError");
    await implWarn(strMessage);
}

async function implWarn(strMessage) {
    if(typeof strMessage !== "string") {
        throw "Nonstring error message";
    }
    await assertIsStr(strMessage);
    // Log the provided message

    await FIXMEUnimplemented("implWarn");

    await implLog(strMessage);
}

async function implLog(strMessage) {
    if(typeof strMessage !== "string") {
        throw "Nonstring error message";
    }
    await assertIsStr(strMessage);
    // Log the provided message
    await console.log(strMessage);
    // use getWindowOrSelf instead of getSharedState to avoid recursion
    let temp=getWindowOrSelf()['stagelDebugCallstack'];
    if(temp !== undefined) {
        if(await Object.keys(temp).length > 0) {
            await console.log("Previous message sent at: " + await internalDebugPrintStack());
        }
        else {
            // use getWindowOrSelf instead of getSharedState to avoid recursion
            if (2 <= getWindowOrSelf()['STAGEL_DEBUG']) {
                await console.log("(Previous message sent from non-StageL code.)");
            }
        }
    }
    else {
        console.log('Warning: implLog called before EITE finished setting up. Log message is: '+strMessage);
    }
}

async function implDebug(strMessage, intLevel) {
    if(typeof strMessage !== "string") {
        throw "Nonstring error message";
    }
    if ((! Number.isInteger(intLevel)) || typeof intLevel === "undefined" || intLevel === null || intLevel < -2147483648 || intLevel > 2147483647) {
        throw "Non-integer debug level";
    }
    await assertIsStr(strMessage); await assertIsInt(intLevel);
    // Log the provided message

    // use getWindowOrSelf instead of getSharedState to avoid recursion
    if (intLevel <= getWindowOrSelf()['STAGEL_DEBUG']) {
        await implLog(strMessage);
    }
}

async function setDebugLevel(intLevel) {
    await assertIsInt(intLevel);
    // Set the debug level to the level specified. Int from 0 to 2 inclusive. Default 0. 0 = no debug messages printed; 1 = normal debug messages printed; 2 = block entry printed; 3 = verbose printing

    await setSharedState('STAGEL_DEBUG', intLevel);
}

async function FIXMEUnimplemented(strLocation) {
    await assertIsStr(strLocation);

    await implLog("FIXME: Unimplemented in " + strLocation);
}

// Internal functions

async function internalDebugQuiet(strMessage, intLevel) {
    await assertIsStr(strMessage); await assertIsInt(intLevel);
    // Log the provided message, but don't print a trace for it

    if (intLevel <= getWindowOrSelf()['STAGEL_DEBUG']) {
        // await implLog(strMessage);
        console.log(strMessage);
    }
}

async function internalDebugCollect(strMessageFragment) {
    getWindowOrSelf()['stagelDebugCollection'] = getWindowOrSelf()['stagelDebugCollection'] + strMessageFragment;
}

async function internalDebugFlush() {
    /* console.log("Flushing debug message fragment collector, which contains: " + stagelDebugCollection); */
    let temp;
    temp = getWindowOrSelf()['stagelDebugCollection'];
    getWindowOrSelf()['stagelDebugCollection'] = "";
    return temp;
}

async function internalDebugStackEnter(strBlockName) {
    if (strBlockName === undefined) {
        await implDie("Block entry specified but no block name given");
    }

    let tempCounts;

    let tempNames = getWindowOrSelf()['stagelDebugCallNames'];
    if (tempNames.indexOf(strBlockName) < 0) {
        tempNames=getWindowOrSelf()['stagelDebugCallNames'];
        tempNames.push(strBlockName);
        getWindowOrSelf()['stagelDebugCallNames'] = tempNames;
        tempNames=getWindowOrSelf()['stagelDebugCallNames'];
        tempCounts=getWindowOrSelf()['stagelDebugCallCounts'];
        tempCounts[tempNames.indexOf(strBlockName)] = 0;
        getWindowOrSelf()['stagelDebugCallCounts'] = tempCounts;
    }

    let ind;
    tempNames=getWindowOrSelf()['stagelDebugCallNames'];
    ind = tempNames.indexOf(strBlockName);
    tempCounts=getWindowOrSelf()['stagelDebugCallCounts'];
    tempCounts[ind] = tempCounts[ind] + 1;
    getWindowOrSelf()['stagelDebugCallCounts'] = tempCounts;

    let temp;
    temp=getWindowOrSelf()['stagelDebugCallstack'];
    temp.push(strBlockName + " (" + await internalDebugFlush() + ")");
    getWindowOrSelf()['stagelDebugCallstack'] = temp;

    if (2 <= getWindowOrSelf()['STAGEL_DEBUG']) {
        let callstackLevel=stagelDebugCallstack.length;
        let callstackLevelStr='';
        let i=0;
        while (i<callstackLevel) {
            if (i%4 === 0) {
                callstackLevelStr=callstackLevelStr+'|';
            }
            else {
                callstackLevelStr=callstackLevelStr+':';
            }
            i=i+1;
        }
        //let callstackLevelStr=":".repeat(callstackLevel);
        await internalDebugQuiet(callstackLevelStr+"Entered block: " + (getWindowOrSelf()['stagelDebugCallstack']).slice(-1)[0], 2);
    }
}

async function internalDebugStackExit() {
    //alert("Dbgstackext");
    let tempStack;
    tempStack=getWindowOrSelf()['stagelDebugCallstack'];
    if (tempStack.slice(-1)[0] === undefined) {
        await implDie("Exited block, but no block on stack");
    }
    tempStack=getWindowOrSelf()['stagelDebugCallstack'];
    await internalDebugQuiet("Exited block: " + await tempStack.pop(), 3);
    getWindowOrSelf()['stagelDebugCallstack'] = tempStack;
}

async function internalDebugPrintHotspots() {
    let n = 0;
    n = getWindowOrSelf()['stagelDebugCallNames'].length;
    let i = 0;
    if (n === 0) {
        console.log('No routine calls have been logged.');
    }
    while (i < n){
        console.log(getWindowOrSelf()['stagelDebugCallNames'][i] + ' was called ' + getWindowOrSelf()['stagelDebugCallCounts'][i] + ' times.');
        i = i + 1;
    }
    let sum = 0;
    sum = getWindowOrSelf()['stagelDebugCallCounts'].reduce(function (accumulator, currentValue) {
        return accumulator + currentValue;
    }, 0);
    console.log('Total function calls: ' + sum);
}

async function internalDebugPrintStack() {
    let i;
    // use getWindowOrSelf instead of getSharedState to avoid recursion
    i = await Object.keys(getWindowOrSelf()['stagelDebugCallstack']).length - 1;
    let result="";
    let arrow=" < "
    while (i>=0) {
        /* FIXME: This could probably be optimized if it's problematically slow. */
        if (i==0) {
            arrow=""
        }
        result = result + getWindowOrSelf()['stagelDebugCallstack'].slice(i)[0] + arrow;
        i = i - 1;
    }
    return result;
}

async function internalDebugLogJSObject(obj) {
    if (1 <= await getWindowOrSelf()['STAGEL_DEBUG']) {
        console.log(obj);
    }
}

// Eventually the WASM stuff should all be available in pure StageL (+ getFileFromPath to load it), and this file's contents used only as speedups.

async function internalEiteReqWasmCall(strRoutine, giVal, returnsArray=false) {
    let func=await getSharedState('eiteWasmModule').instance.exports[strRoutine];
    let eiteWasmMemory;
    if (giVal === null) {
        return func();
    }
    else if ((typeof giVal === 'number') && (!returnsArray)) {
        return func(giVal);
    }
    else {
        // Either it returns an array, it has an array argument, or both.
        // If it accepts an array as a parameter, it takes int* arr, int size as its parameters.
        if (typeof await getSharedState('eiteWasmModule').instance.exports['memory'] !== 'undefined') {
            eiteWasmMemory=await getSharedState('eiteWasmModule').instance.exports['memory'];
        }
    }
}

async function internalWasmCall(strRoutine, intVal) {
    return await eiteHostCall('internalEiteReqWasmCall', [strRoutine, intVal, false]);
}

async function internalWasmCallNoArgs(strRoutine) {
    // Only returns an int
    return await eiteHostCall('internalEiteReqWasmCall', [strRoutine, null, false]);
}

async function internalWasmCallArrIn(strRoutine, intArrayVals) {
    return await eiteHostCall('internalEiteReqWasmCall', [strRoutine, intArrayVals, false]);
}

async function internalWasmCallArrOut(strRoutine, intVal) {
    return await eiteHostCall('internalEiteReqWasmCall', [strRoutine, intVal, true]);
}

async function internalWasmCallArrInOut(strRoutine, intArrayVals) {
    return await eiteHostCall('internalEiteReqWasmCall', [strRoutine, intArrayVals, true]);
}

/* booleans, provides:
    implAnd
    implNot
*/

async function implAnd(a,b) {
    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return a && b;
    }
    await assertIsBool(a); await assertIsBool(b);
}

async function implNot(a) {
    if (typeof a === 'boolean') {
        return !a;
    }
    await assertIsBool(a);
}

/* comparison, provides:
    implEq
    implGt
    implLt
*/

async function implEq(genericA, genericB) {
    await assertIsGeneric(genericA); await assertIsGeneric(genericB); let boolReturn;

    return genericA === genericB;
}

async function implGt(intA, intB) {
    await assertIsInt(intA); await assertIsInt(intB); let boolReturn;

    return intA > intB;
}

async function implLt(intA, intB) {
    await assertIsInt(intA); await assertIsInt(intB); let boolReturn;

    return intA < intB;
}

// Note: Both rows and columns are zero-indexed from the perspective of callers of these routines. The header row is not counted for this purpose (the first row after the header is index 0), while the ID column (where present) *is* counted (so it is index 0).

async function dcDatasetLength(dataset) {
    assertIsDcDataset(dataset); let intReturn;

    // - 2: one for the header; one for the last newline, which is (reasonably, looking at the newlines as separators rather than terminators) included as an extra line of data in the parse results
    intReturn = (await getSharedState('dcData'))[dataset].length - 2; await assertIsInt(intReturn); return intReturn;
}

async function dcDataLookupById(dataset, rowNum, fieldNum) {
    await assertIsDcDataset(dataset); await assertIsInt(rowNum); await assertIsInt(fieldNum); let strReturn;

    // This routine returns the value of the specified cell of the nth row in the dataset (zero-indexed, such that the 0th row is the first content row, and the header row is not available (would be -1 but isn't available from this routine)).
    if ((await getSharedState('dcData'))[dataset] === undefined) {
        await implDie('dcDataLookupById called, but dataset '+dataset+' does not appear to be available.');
    }

    // Add 1 to account for header row
    rowNum = rowNum + 1;

    // and another 1 to account for last row
    if (rowNum + 1 >= (await getSharedState('dcData'))[dataset].length) {
        strReturn = "89315802-d53d-4d11-ba5d-bf505e8ed454"
    }
    else {
        strReturn = (await getSharedState('dcData'))[dataset][rowNum][fieldNum];
    }
    await assertIsStr(strReturn); return strReturn;
}

async function dcDataLookupByValue(dataset, filterField, genericFilterValue, desiredField) {
    await assertIsDcDataset(dataset); await assertIsInt(filterField); await assertIsGeneric(genericFilterValue); await assertIsInt(desiredField); let strReturn;

    let intLength = (await getSharedState('dcData'))[dataset].length - 2;
    // start at 1 to skip header row
    let filterValue = await strFrom(genericFilterValue);
    for (let row = 1; row <= intLength; row++) {
        if((await getSharedState('dcData'))[dataset][row][filterField] === filterValue) {
            strReturn = (await getSharedState('dcData'))[dataset][row][desiredField]; await assertIsStr(strReturn); return strReturn;
        }
    }
    //await console.log("SEARCHING", dataset, filterField, genericFilterValue, desiredField, dcData);
    //await implDie('Could not find required dataset entry by value (parameters: '+dataset+'/'+filterField+'/'+genericFilterValue+'/'+desiredField+').');
    // TODO: this should be available as a "lookupbyvalue" and a "lookupbyvalueForgiving" versions that do and don't die on this; the forgiving would return the exception UUID.
    // If nothing was found, return this UUID.
    strReturn="89315802-d53d-4d11-ba5d-bf505e8ed454"; await assertIsStr(strReturn); return strReturn;
}

async function dcDataFilterByValue(dataset, filterField, genericFilterValue, desiredField) {
    await assertIsDcDataset(dataset); await assertIsInt(filterField); await assertIsGeneric(genericFilterValue); await assertIsInt(desiredField); let asReturn;

    // This routine returns an array of values of the desired column when the filter field matches the filter value. While dcDataLookupByValue gives a single (the first) result, this returns all matching results.

    asReturn = [];

    let intLength = (await getSharedState('dcData'))[dataset].length - 2;
    // start at 1 to skip header row
    let filterValue = await strFrom(genericFilterValue);
    for (let row = 1; row <= intLength; row++) {
        if((await getSharedState('dcData'))[dataset][row][filterField] === filterValue) {
            asReturn = asReturn.concat((await getSharedState('dcData'))[dataset][row][desiredField]);
        }
    }
    await assertIsStrArray(asReturn); return asReturn;
}

async function dcDataFilterByValueGreater(dataset, filterField, filterValue, desiredField) {
    await assertIsDcDataset(dataset); await assertIsInt(filterField); await assertIsInt(filterValue); await assertIsInt(desiredField); let asReturn;

    // This routine returns an array of values of the desired column when the filter field is greater than the filter value. (e.g. filter for 1 will return rows with 2 and 3 but not 1 or 0) While dcDataLookupByValue gives a single (the first) result, this returns all matching results.

    asReturn = [];

    let intLength = (await getSharedState('dcData'))[dataset].length - 2;
    // start at 1 to skip header row
    for (let row = 1; row <= intLength; row++) {
        if(parseInt((await getSharedState('dcData'))[dataset][row][filterField], 10) > filterValue) {
            asReturn = asReturn.concat((await getSharedState('dcData'))[dataset][row][desiredField]);
        }
    }
    await assertIsStrArray(asReturn); return asReturn;
}

// Based on https://web.archive.org/web/20190305073920/https://github.com/mathiasbynens/wtf-8/blob/58c6b976c6678144d180b2307bee5615457e2cc7/wtf-8.js
// This code for wtf8 is included under the following license (from https://web.archive.org/web/20190305074047/https://github.com/mathiasbynens/wtf-8/blob/58c6b976c6678144d180b2307bee5615457e2cc7/LICENSE-MIT.txt):
/*
Copyright Mathias Bynens <https://mathiasbynens.be/>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Encoding
function intArrayPackWtf8(intValue) {
    let createByte = function(intValue, shift) {
        return String.fromCharCode(((intValue >> shift) & 0x3F) | 0x80);
    }

    let symbol = '';
    if ((intValue & 0xFFFFFF80) == 0) { // 1-byte sequence
        symbol = String.fromCharCode(intValue);
    }
    else {
        if ((intValue & 0xFFFFF800) == 0) { // 2-byte sequence
            symbol = String.fromCharCode(((intValue >> 6) & 0x1F) | 0xC0);
        }
        else if ((intValue & 0xFFFF0000) == 0) { // 3-byte sequence
            symbol = String.fromCharCode(((intValue >> 12) & 0x0F) | 0xE0);
            symbol += createByte(intValue, 6);
        }
        else if ((intValue & 0xFFE00000) == 0) { // 4-byte sequence
            symbol = String.fromCharCode(((intValue >> 18) & 0x07) | 0xF0);
            symbol += createByte(intValue, 12);
            symbol += createByte(intValue, 6);
        }
        symbol += String.fromCharCode((intValue & 0x3F) | 0x80);
    }
    let res = [];
    let len = symbol.length;
    let i = 0;
    while (i<len) {
        res.push(symbol.charCodeAt(i));
        i = i+1;
    }
    return res;
}

//Decoding
async function intUnpackWtf8(byteArrayInput) {
    let byteIndex = 0;
    let byteCount = byteArrayInput.length;
    let readContinuationByte = async function() {
        if (byteIndex >= byteCount) {
            await implDie('Invalid byte index');
        }

        let continuationByte = byteArrayInput[byteIndex] & 0xFF;
        byteIndex++;

        if ((continuationByte & 0xC0) == 0x80) {
            return continuationByte & 0x3F;
        }

        // If we end up here, it’s not a continuation byte.
        await implDie('Invalid continuation byte');
    }

    let byte1;
    let byte2;
    let byte3;
    let byte4;
    let intValue;

    if (byteIndex > byteCount) {
        await implDie('Invalid byte index');
    }

    if (byteIndex == byteCount) {
        return false;
    }

    // Read the first byte.
    byte1 = byteArrayInput[byteIndex] & 0xFF;
    byteIndex++;

    // 1-byte sequence (no continuation bytes)
    if ((byte1 & 0x80) == 0) {
        return byte1;
    }

    // 2-byte sequence
    if ((byte1 & 0xE0) == 0xC0) {
        let byte2 = await readContinuationByte();
        intValue = ((byte1 & 0x1F) << 6) | byte2;
        if (intValue >= 0x80) {
            return intValue;
        } else {
            await implDie('Invalid continuation byte');
        }
    }

    // 3-byte sequence (may include unpaired surrogates)
    if ((byte1 & 0xF0) == 0xE0) {
        byte2 = await readContinuationByte();
        byte3 = await readContinuationByte();
        intValue = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
        if (intValue >= 0x0800) {
            return intValue;
        } else {
            await implDie('Invalid continuation byte');
        }
    }

    // 4-byte sequence
    if ((byte1 & 0xF8) == 0xF0) {
        byte2 = await readContinuationByte();
        byte3 = await readContinuationByte();
        byte4 = await readContinuationByte();
        intValue = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
            (byte3 << 0x06) | byte4;
        if (intValue >= 0x010000 && intValue <= 0x10FFFF) {
            return intValue;
        }
    }

    await implDie('Invalid WTF-8 detected');
}

//Copy of the decoder that returns a boolean indicating whether the input was a valid char
async function boolIsUnpackableWtf8(byteArrayInput) {
    let byteIndex = 0;
    let byteCount = byteArrayInput.length;
    let readContinuationByte = async function() {
        if (byteIndex >= byteCount) {
            return false;
        }

        let continuationByte = byteArrayInput[byteIndex] & 0xFF;
        byteIndex++;

        if ((continuationByte & 0xC0) == 0x80) {
            return continuationByte & 0x3F;
        }

        // If we end up here, it’s not a continuation byte.
        return false;
    }

    let byte1;
    let byte2;
    let byte3;
    let byte4;
    let intValue;

    if (byteIndex > byteCount) {
        return false;
    }

    if (byteIndex == byteCount) {
        return false;
    }

    // Read the first byte.
    byte1 = byteArrayInput[byteIndex] & 0xFF;
    byteIndex++;

    // 1-byte sequence (no continuation bytes)
    if ((byte1 & 0x80) == 0) {
        return true;
    }

    // 2-byte sequence
    if ((byte1 & 0xE0) == 0xC0) {
        let byte2 = await readContinuationByte();
        if (byte2 === false) {
            return false;
        }
        intValue = ((byte1 & 0x1F) << 6) | byte2;
        if (intValue >= 0x80) {
            return true;
        } else {
            return false;
        }
    }

    // 3-byte sequence (may include unpaired surrogates)
    if ((byte1 & 0xF0) == 0xE0) {
        byte2 = await readContinuationByte();
        if (byte2 === false) {
            return false;
        }
        byte3 = await readContinuationByte();
        if (byte3 === false) {
            return false;
        }
        intValue = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
        if (intValue >= 0x0800) {
            return true;
        } else {
            return false;
        }
    }

    // 4-byte sequence
    if ((byte1 & 0xF8) == 0xF0) {
        byte2 = await readContinuationByte();
        if (byte2 === false) {
            return false;
        }
        byte3 = await readContinuationByte();
        if (byte3 === false) {
            return false;
        }
        byte4 = await readContinuationByte();
        if (byte4 === false) {
            return false;
        }
        intValue = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
            (byte3 << 0x06) | byte4;
        if (intValue >= 0x010000 && intValue <= 0x10FFFF) {
            return true;
        }
    }

    return false;
}

/* assertions, provides:
    assertIsBool
    assertIsTrue
    assertIsFalse
    assertIsInt
    assertIsStr
    assertIsGeneric
    assertIsGenericArray
    assertIsGenericItem
    assertionFailed
*/

// Assertions that something is a given type

async function isBool(bool) {
    if (typeof bool === 'boolean') {
        return true;
    }
    return false;
}

async function assertIsBool(bool) {
    if (typeof bool === 'boolean') {
        return;
    }
    await assertionFailed(bool+' is not a boolean.');
}

async function isInt(v) {
    if (await Number.isInteger(v) && v >= -2147483648 && v <= 2147483647) {
        return true;
    }
    return false;
}

async function assertIsInt(v) {
    if (await Number.isInteger(v) && v >= -2147483648 && v <= 2147483647) {
        return;
    }
    await assertionFailed(v+" is not an int, or is outside the currently allowed range of 32 bit signed (-2,147,483,648 to 2,147,483,647).");
}

async function isStr(str) {
    if (typeof str === 'string') {
        return true;
    }
    return false;
}

async function assertIsStr(str) {
    if (typeof str === 'string') {
        return;
    }
    await assertionFailed(str+" is not a string.");
}

async function assertHasIndex(array, index) {
    if (!await hasIndex(array, index)) {
        await assertionFailed("Array does not have the requested index "+index+".");
    }
}

async function isGeneric(v) {
    // We have to do isGeneric in native code because otherwise the assertion at the start of the function would call it.
    if (typeof v === 'boolean' || typeof v === 'string' || (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647)) {
        return true;
    }
    return false;
}

async function assertIsGeneric(v) {
    if (typeof v === 'boolean' || typeof v === 'string' || (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647)) {
        return true;
    }
    await assertionFailed(v+" cannot be used as a generic.");
}

async function isGenericArray(val) {
    if (val === undefined) {
        await assertionFailed('isGenericArray called with non-StageL-supported argument type.');
    }
    if (val.constructor.name === 'Uint8Array') {
        return true;
    }
    if (val.constructor.name !== 'Array') {
        return false;
    }
    function isGenericSync(v) {
        return (typeof v === 'boolean' || typeof v === 'string' || (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647));
    }
    return val.every(isGenericSync);
}

async function assertIsGenericArray(val) {
    if (val === undefined) {
        await assertionFailed('assertIsGenericArray called with non-StageL-supported argument type.');
    }
    if (val.constructor.name === 'Uint8Array') {
        return;
    }
    if (val.constructor.name !== 'Array') {
        await assertionFailed(val+" cannot be used as a generic array.");
    }
    function isGenericSync(v) {
        return (typeof v === 'boolean' || typeof v === 'string' || (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647));
    }
    if (val.every(isGenericSync)) {
        return;
    }
    else {
        await assertionFailed(val+" cannot be used as a generic array.");
    }
}

async function isGenericItem(val) {
    /* Should this support returning false for non-StageL-supported items? Otherwise it always returns true. I think probably not, since that wouldn't be consistent across languages; giving an assertion failure seems more sensible. */
    if (val === undefined) {
        await assertionFailed('isGenericItem called with non-StageL-supported argument type.');
    }
    if (typeof val === 'boolean' || typeof val === 'string' || (Number.isInteger(val) && val >= -2147483648 && val <= 2147483647) || val.constructor.name === 'Uint8Array') {
        return true;
    }
    if (val.constructor.name !== 'Array') {
        await assertionFailed('isGenericItem called with non-StageL-supported argument type.');
    }
    function isGenericSync(v) {
        return (typeof v === 'boolean' || typeof v === 'string' || (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647));
    }
    if (val.every(isGenericSync)) {
        return true;
    }
    else {
        await assertionFailed('isGenericItem called with non-StageL-supported argument type.');
    }
}

async function assertIsGenericItem(val) {
    if (val === undefined) {
        await assertionFailed('assertIsGenericItem called with non-StageL-supported argument type.');
    }
    if (typeof val === 'boolean' || typeof val === 'string' || (Number.isInteger(val) && val >= -2147483648 && val <= 2147483647) || val.constructor.name === 'Uint8Array') {
        return true;
    }
    if (val.constructor.name !== 'Array') {
        await assertionFailed('assertIsGenericItem called with non-StageL-supported argument type.');
    }
    function isGenericSync(v) {
        return (typeof v === 'boolean' || typeof v === 'string' || (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647));
    }
    if (val.every(isGenericSync)) {
        return true;
    }
    else {
        await assertionFailed('assertIsGenericItem called with non-StageL-supported argument type.');
    }
}

async function assertionFailed(message) {
    await implDie("Assertion failed: "+message);
}

/* bits, provides:
    bitAnd
    bitNot
*/

// Note that bitwise operations in StageL operate on bytes rather than int32s. Consequently, C-style 8-bit bitwise operations must be emulated for the Javascript implementation. That said, C-style bitwise operators depend on the types being operated upon. So, there should probably be a set of functions like bitLshift8, bitLshift32, etc. maybe. Do these really make much sense in StageL, which is mostly higher-level? How would one implement these in languages that don't provide them natively? Mmh.

async function bitAnd8(byteA, byteB) {
    await assertIsByte(byteA); await assertIsByte(byteB); let byteReturn;

    byteReturn = await internalBitwiseMask(byteA & byteB);

    await assertIsByte(byteReturn); return byteReturn;
}

async function bitNot8(byteA) {
    await assertIsByte(byteA); let byteReturn;

    byteReturn = await internalBitwiseMask(~byteA);
    await assertIsByte(byteReturn); return byteReturn;
}

async function bitLshift8(byteA, intPlaces) {
    await assertIsByte(byteA); await assertIsInt(intPlaces); let byteReturn;

    await assertIsBetween(intPlaces, 0, 8);

    byteReturn = await internalBitwiseMask(byteA << intPlaces);

    await assertIsByte(byteReturn); return byteReturn;
}

async function bitRshift8(byteA, intPlaces) {
    await assertIsByte(byteA); await assertIsInt(intPlaces); let byteReturn;

    await assertIsBetween(intPlaces, 0, 8);

    byteReturn = await internalBitwiseMask(byteA >>> intPlaces); /* >>> is needed in JavaScript to make it fill zeroes behind it. >> does something else. */

    await assertIsByte(byteReturn); return byteReturn;
}

// Internal function

async function leastSignificantByte(int32input) {
    let byteReturn;
    let byteMask;
    byteMask = 255;
    byteReturn = int32input & byteMask; /* zero out all but the least significant bits, which are what we want */
    return byteReturn;
}

async function getEnvPreferredFormat() {
    // Note that this routine will produce different outputs on different StageL target platforms, and that's not a problem since that's what it's for.
    return await getSharedState('envPreferredFormat');
}

async function getEnvResolutionW() {
    // Result for this is either in pixels or characters. For immutableCharacterCells, it's just the number of columns available, defaulting to 80 if we can't tell, and says 1 line available. If it's -1, it's unlimited (probably this would only occur if explicitly configured as such).
    return await getSharedState('envResolutionW');
}

async function getEnvResolutionH() {
    // See getEnvResolutionW description.
    return await getSharedState('envResolutionH');
}

async function getEnvCharEncoding() {
    return await getSharedState('envCharEncoding');
}

async function getEnvTerminalType() {
    return await getSharedState('envTerminalType');
}

async function getEnvLanguage() {
    return await getSharedState('envLanguage');
}

async function getEnvCodeLanguage() {
    return await getSharedState('envCodeLanguage');
}

async function getEnvLocaleConfig() {
    return await getSharedState('envLocaleConfig');
}

async function renderDrawContents(renderBuffer) {
    // Whether it appends to or replaces the frame would depend on the environment. In this implementation, HTML replaces, and terminal appends.
    // The input is an array of bytes of the rendered document, either of HTML or text.
    await assertIsByteArray(renderBuffer);
    let utf8decoder = new TextDecoder('utf-8');
    let string = utf8decoder.decode(Uint8Array.from(renderBuffer));
    if (haveDom) {
        await eiteHostCall('internalRequestRenderDrawHTMLToDOM', [string]);
    }
    else {
        await console.log(string);
    }
}

async function internalRequestRenderDrawHTMLToDOM(htmlString) {
    let htmlOutputRootElement = await document.getElementById('eiteDocumentRoot');
    htmlOutputRootElement.innerHTML = htmlString;
    htmlOutputRootElement.scrollTop = htmlOutputRootElement.scrollHeight;
}

async function getImportSettingsArr() {
    await assertIsStrArray(await getSharedState('importSettings'));

    return await getSharedState('importSettings');
}

async function getExportSettingsArr() {
    await assertIsStrArray(await getSharedState('exportSettings'));

    return await getSharedState('exportSettings');
}

async function setImportSettings(formatId, strNewSettings) {
    await assertIsStr(strNewSettings);

    await implDebug('State change for import settings for '+formatId+' to '+strNewSettings+'.', 1);

    let temp;
    temp=await getSharedState('importSettings');
    temp[formatId]=strNewSettings;
    await setSharedState('importSettings', temp);
}

async function setExportSettings(formatId, strNewSettings) {
    await assertIsStr(strNewSettings);

    await implDebug('State change for export settings for '+formatId+' to '+strNewSettings+'.', 1);

    let temp;
    temp=await getSharedState('exportSettings');
    temp[formatId]=strNewSettings;
    await setSharedState('exportSettings', temp);
}

async function setImportDeferredSettingsStack(newStack) {
    await assertIsStrArray(newStack);

    await implDebug('State change for import deferred settings stack to '+newStack+'.', 1);

    await setSharedState('strArrayImportDeferredSettingsStack', newStack);
}

async function setExportDeferredSettings(newStack) {
    await assertIsStr(newStack);

    await implDebug('State change for export deferred settings stack to '+newStack+'.', 1);

    await setSharedState('strArrayImportDeferredSettingsStack', newStack);
}

async function setStorageSettings(strArrayNewSettings) {
    await assertIsStrArray(strArrayNewSettings);
    await setSharedState('strArrayStorageCfg', strArrayNewSettings);
}

async function getStorageSettings(strArrayNewSettings) {
    return await getSharedState('strArrayStorageCfg');
}

/* type-tools, provides:
    implIntBytearrayLength
*/

async function intBytearrayLength(bytearray) {
    assertIsBytearray(bytearray); let intReturn;

    intReturn = bytearray.byteLength; await assertIsInt(intReturn); return intReturn;
}


// @license-end
