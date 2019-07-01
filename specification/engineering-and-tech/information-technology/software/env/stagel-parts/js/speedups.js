// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

registerSpeedup('assertIsFalse', async function (bool) {
    if (bool === false) {
        return;
    }
    await assertionFailed(bool+' is true, but should be false.');
});

registerSpeedup('assertIsTrue', async function (bool) {
    if (bool === true) {
        return;
    }
    await assertionFailed(bool+' is not true.');
});

registerSpeedup('assertIsDc', async function (v) {
    if (await Number.isInteger(v) && v >= 0 && v <= 2147483647) {
        return true;
    }
    await assertIsTrue(false);
});

registerSpeedup('assertIsDcDataset', async function (str) {
    if ((await getSharedState('datasets')).includes(str)) {
        return;
    }
    await assertIsTrue(false);
});

registerSpeedup('or', async function (a,b) {
    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return a || b;
    }
    await assertIsBool(a); await assertIsBool(b);
});

registerSpeedup('isTrue', async function (bool) {
    if (bool === true) {
        // Can't simplify to if(bool) because non-bools might evaluate to true and give wrong result
        return true;
    }
    return false;
});

registerSpeedup('isFalse', async function (bool) {
    if (bool === false) {
        return true;
    }
    return false;
});

registerSpeedup('isIntArray', async function (val) {
    if (val === undefined) {
        await assertionFailed('isGenericArray called with non-StageL-supported argument type.'); /* Claim to fail the isGenericArray assertion here, because that's what would get called in the portable implementation. */
    }
    if (val.constructor.name === 'Uint8Array') {
        return true;
    }
    if (val.constructor.name !== 'Array') {
        return false;
    }
    function isIntSync(v) {
        return (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647);
    }
    return val.every(isIntSync);
});

registerSpeedup('assertIsIntArray', async function (val) {
    if (val === undefined) {
        await assertionFailed('isGenericArray called with non-StageL-supported argument type.'); /* Claim to fail the isGenericArray assertion here, because that's what would get called in the portable implementation. */
    }
    if (val.constructor.name === 'Uint8Array') {
        return true;
    }
    if (val.constructor.name !== 'Array') {
        await assertIsTrue(false);
    }
    function isIntSync(v) {
        return (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647);
    }
    if (val.every(isIntSync)) {
        return;
    }
    else {
        await assertIsTrue(false);
    }
});

registerSpeedup('ne', async function (genericA, genericB) {
    await assertIsGeneric(genericA); await assertIsGeneric(genericB); let boolReturn;

    return genericA !== genericB;
});

registerSpeedup('le', async function (intA, intB) {
    await assertIsInt(intA); await assertIsInt(intB); let boolReturn;

    return intA <= intB;
});

registerSpeedup('ge', async function (intA, intB) {
    await assertIsInt(intA); await assertIsInt(intB); let boolReturn;

    return intA >= intB;
});

registerSpeedup('arrEq', async function (genericArrayA, genericArrayB) {
    if (((genericArrayA.constructor.name !== 'Uint8Array') && (genericArrayA.constructor.name !== 'Array')) || ((genericArrayB.constructor.name !== 'Uint8Array') && (genericArrayB.constructor.name !== 'Array'))) {
        await assertIsGenericArray(genericArrayA);
        await assertIsGenericArray(genericArrayB);
    }
    function countSync(array) {
        if (array.constructor.name === 'Uint8Array') {
            return array.byteLength;
        }
        return Object.keys(array).length;
    }
    let intCount = 0;
    intCount = countSync(genericArrayA);
    if (intCount !== countSync(genericArrayB)) {
        return false;
    }
    let genericElem;
    let intI = 0;
    while (intI < intCount) {
        genericElem = genericArrayA[intI];
        if (genericElem !== genericArrayB[intI]) {
            return false;
        }
        intI = intI + 1;
    }
    return true;
});
/*
registerSpeedup('kvHasValue', async function (strArrayData, strKey) {
    let boolReturn;

    await assertIsKvArray(strArrayData); //based on https://stackoverflow.com/questions/52723904/every-other-element-in-an-array
    if (strArrayData.filter((elem,i) => i&1).includes(strKey)) {
        await internalDebugStackExit();
        return true;
    }
    return false;
});

registerSpeedup('kvGetValue', async function (strArrayData, strKey) {
    let boolReturn;

    await assertIsKvArray(strArrayData); //based on https://stackoverflow.com/questions/52723904/every-other-element-in-an-array
    if (strArrayData.filter((elem,i) => i&1).includes(strKey)) {
        await internalDebugStackExit();
        return strArrayData[strKey];
    }
    return '';
});
*/
// FIXME: Replace (or supplement if necessary) this next bit with polyfills for kv functions (which are slow)
// Unconscionable hack FIXME
registerSpeedup('isIntArray', async function (val) {
    return true;
});
registerSpeedup('assertIsIntArray', async function (val) {
    return true;
});
registerSpeedup('isArray', async function (val) {
    return true;
});
registerSpeedup('assertIsArray', async function (val) {
    return true;
});
registerSpeedup('isStrArray', async function (val) {
    return true;
});
registerSpeedup('assertIsStrArray', async function (val) {
    return true;
});

// @license-end
