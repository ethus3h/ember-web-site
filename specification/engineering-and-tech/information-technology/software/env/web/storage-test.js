// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

window.onload = async function() {
    //eiteCall('startEite');
    EITE_STORAGE_CFG=['mysqlApi', 'http://futuramerlin.com/specification/engineering-and-tech/information-technology/software/env/web/api.php', 'mysqlUser', 'test', 'mysqlSecretKey', 'test'];
    await storageSetup(EITE_STORAGE_CFG);
    alert('Ready to use');
    let attachFn = (elem, func) => {
        document.getElementById(elem).onclick=func;
    }
    async function addRow() {
        alert(await storageSave(await strToByteArray('Test node data')));
    }
    async function listRows() {
        alert(await internalStorageGetTable('node'));
    }
    async function getNode() {
        alert(await storageRetrieve(1));
    }
    async function getSecretKey() {
        alert(await strFromByteArray(await getFileFromPath(await kvGetValue(await getStorageSettings(), 'mysqlApi')+'?action=hashSecret&secretkey='+'test')));
    }
    attachFn('getSecretKey', getSecretKey);
    attachFn('addRow', addRow);
    attachFn('listRows', listRows);
    attachFn('getNode', getNode);
};

// @license-end
