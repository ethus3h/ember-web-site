// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

window.onload = async function() {
    //eiteCall('startEite');
    EITE_STORAGE_CFG=['mysqlApi', 'http://futuramerlin.com/specification/engineering-and-tech/information-technology/software/env/web/api.php', 'mysqlApiUser', 'test', 'mysqlApiSecretKey', 'test'];
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
};

// @license-end
