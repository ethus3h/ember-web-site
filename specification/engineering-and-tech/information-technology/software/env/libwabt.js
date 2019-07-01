
var WabtModule = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  return (
function(WabtModule) {
  WabtModule = WabtModule || {};

// Copyright 2010 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof WabtModule !== 'undefined' ? WabtModule : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

Module['arguments'] = [];
Module['thisProgram'] = './this.program';
Module['quit'] = function(status, toThrow) {
  throw toThrow;
};
Module['preRun'] = [];
Module['postRun'] = [];

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;



// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)




// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/';

  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    var ret;
      if (!nodeFS) nodeFS = require('fs');
      if (!nodePath) nodePath = require('path');
      filename = nodePath['normalize'](filename);
      ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  if (process['argv'].length > 1) {
    Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  }

  Module['arguments'] = process['argv'].slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  // Currently node will swallow unhandled rejections, but this behavior is
  // deprecated, and in the future it will exit with error status.
  process['on']('unhandledRejection', abort);

  Module['quit'] = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    Module['read'] = function shell_read(f) {
      return read(f);
    };
  }

  Module['readBinary'] = function readBinary(f) {
    var data;
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status) {
      quit(status);
    }
  }
} else
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // When MODULARIZE (and not _INSTANCE), this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptDir) {
    scriptDirectory = _scriptDir;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  Module['read'] = function shell_read(url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  Module['setWindowTitle'] = function(title) { document.title = title };
} else
{
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
// If the user provided Module.print or printErr, use that. Otherwise,
// console.log is checked first, as 'print' on the web will open a print dialogue
// printErr is preferable to console.warn (works better in shells)
// bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message



// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;


function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  if (end <= _emscripten_get_heap_size()) {
    HEAP32[DYNAMICTOP_PTR>>2] = end;
  } else {
    var success = _emscripten_resize_heap(end);
    if (!success) return 0;
  }
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

var asm2wasmImports = { // special asm2wasm imports
    "f64-rem": function(x, y) {
        return x % y;
    },
    "debugger": function() {
        debugger;
    }
};



var jsCallStartIndex = 877;
var jsCallSigOrder = {"ii":0,"iii":1,"iiii":2,"iiiii":3,"iiiiii":4,"iiiiiii":5,"iiiiiiii":6,"iiij":7,"iij":8,"v":9,"vi":10,"vii":11,"viii":12,"viiii":13,"viiiii":14,"viiiiii":15};
var jsCallNumSigs = Object.keys(jsCallSigOrder).length;
var functionPointers = new Array(jsCallNumSigs * 10);

// Add a wasm function to the table.
// Attempting to call this with JS function will cause of table.set() to fail
function addWasmFunction(func) {
  var table = wasmTable;
  var ret = table.length;
  table.grow(1);
  table.set(ret, func);
  return ret;
}

// 'sig' parameter is currently only used for LLVM backend under certain
// circumstance: RESERVED_FUNCTION_POINTERS=1, EMULATED_FUNCTION_POINTERS=0.
function addFunction(func, sig) {

  assert(typeof sig !== 'undefined',
         'Second argument of addFunction should be a wasm function signature ' +
         'string');
  var base = jsCallSigOrder[sig] * 10;
  for (var i = base; i < base + 10; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';

}

function removeFunction(index) {
  functionPointers[index-jsCallStartIndex] = null;
}

var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
}

var getTempRet0 = function() {
  return tempRet0;
}


var Runtime = {
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;




// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


if (typeof WebAssembly !== 'object') {
  err('no native wasm support detected');
}


/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}




// Wasm globals

var wasmMemory;

// Potentially used for direct table calls.
var wasmTable;


//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}




/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  abort("this function has been removed - you should use UTF8ToString(ptr, maxBytesToRead) instead!");
}

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}


// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = u8Array[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}


// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}





function demangle(func) {
  return func;
}

function demangleAll(text) {
  var regex =
    /_Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (y + ' [' + x + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}


var STATIC_BASE = 1024,
    STACK_BASE = 5576720,
    STACKTOP = STACK_BASE,
    STACK_MAX = 333840,
    DYNAMIC_BASE = 5576720,
    DYNAMICTOP_PTR = 333584;




var TOTAL_STACK = 5242880;

var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory







// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
} else {
  // Use a WebAssembly memory where available
  if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
    wasmMemory = new WebAssembly.Memory({ 'initial': TOTAL_MEMORY / WASM_PAGE_SIZE });
    buffer = wasmMemory.buffer;
  } else
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  Module['buffer'] = buffer;
}
updateGlobalBufferViews();


HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;






// Endianness check (note: assumes compiler arch was little-endian)

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}



var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;






// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




var wasmBinaryFile = 'libwabt.wasm';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (Module['wasmBinary']) {
      return new Uint8Array(Module['wasmBinary']);
    }
    if (Module['readBinary']) {
      return Module['readBinary'](wasmBinaryFile);
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // if we don't have the binary yet, and have the Fetch api, use that
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm(env) {
  // prepare imports
  var info = {
    'env': env
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    removeRunDependency('wasm-instantiate');
  }
  addRunDependency('wasm-instantiate');

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
      // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
      // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }
  function instantiateArrayBuffer(receiver) {
    getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);
      abort(reason);
    });
  }
  // Prefer streaming instantiation if available.
  if (!Module['wasmBinary'] &&
      typeof WebAssembly.instantiateStreaming === 'function' &&
      !isDataURI(wasmBinaryFile) &&
      typeof fetch === 'function') {
    WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, { credentials: 'same-origin' }), info)
      .then(receiveInstantiatedSource, function(reason) {
        // We expect the most common failure cause to be a bad MIME type for the binary,
        // in which case falling back to ArrayBuffer instantiation should work.
        err('wasm streaming compile failed: ' + reason);
        err('falling back to ArrayBuffer instantiation');
        instantiateArrayBuffer(receiveInstantiatedSource);
      });
  } else {
    instantiateArrayBuffer(receiveInstantiatedSource);
  }
  return {}; // no exports yet; we'll fill them in later
}

// Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
// the wasm module at that time, and it receives imports and provides exports and so forth, the app
// doesn't need to care that it is wasm or asm.js.

Module['asm'] = function(global, env, providedBuffer) {
  // memory was already allocated (so js could use the buffer)
  env['memory'] = wasmMemory
  ;
  // import table
  env['table'] = wasmTable = new WebAssembly.Table({
    'initial': 1037,
    'maximum': 1037,
    'element': 'anyfunc'
  });
  env['__memory_base'] = 1024; // tell the memory segments where to place themselves
  env['__table_base'] = 0; // table starts at 0 by default (even in dynamic linking, for the main module)

  var exports = createWasm(env);
  return exports;
};

// === Body ===

var ASM_CONSTS = [];




// STATICTOP = STATIC_BASE + 332816;
/* global initializers */  __ATINIT__.push({ func: function() { ___post_instantiate() } });



/* no memory initializer */
var tempDoublePtr = 333824

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}

function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}

// {{PRE_LIBRARY}}


  
  var ENV={};function ___buildEnvironment(environ) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = ENV['LOGNAME'] = 'web_user';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/web_user';
        ENV['LANG'] = 'C.UTF-8';
        ENV['_'] = Module['thisProgram'];
        // Allocate memory.
        poolPtr = getMemory(TOTAL_ENV_SIZE);
        envPtr = getMemory(MAX_ENV_VALUES * 4);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in ENV) {
        if (typeof ENV[key] === 'string') {
          var line = key + '=' + ENV[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }

  
  var SYSCALLS={buffers:[null,[],[]],printChar:function (stream, curr) {
        var buffer = SYSCALLS.buffers[stream];
        if (curr === 0 || curr === 10) {
          (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
          buffer.length = 0;
        } else {
          buffer.push(curr);
        }
      },varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = UTF8ToString(SYSCALLS.get());
        return ret;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        return low;
      },getZero:function () {
        SYSCALLS.get();
      }};function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  function flush_NO_FILESYSTEM() {
      // flush anything remaining in the buffers during shutdown
      var fflush = Module["_fflush"];
      if (fflush) fflush(0);
      var buffers = SYSCALLS.buffers;
      if (buffers[1].length) SYSCALLS.printChar(1, 10);
      if (buffers[2].length) SYSCALLS.printChar(2, 10);
    }function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      // hack to support printf in FILESYSTEM=0
      var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(((iov)+(i*8))>>2)];
        var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
        for (var j = 0; j < len; j++) {
          SYSCALLS.printChar(stream, HEAPU8[ptr+j]);
        }
        ret += len;
      }
      return ret;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function _abort() {
      Module['abort']();
    }

  function _emscripten_get_heap_size() {
      return TOTAL_MEMORY;
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
    }

  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('OOM');
    }
  
  function emscripten_realloc_buffer(size) {
      var PAGE_MULTIPLE = 65536;
      size = alignUp(size, PAGE_MULTIPLE); // round up to wasm page size
      var old = Module['buffer'];
      var oldSize = old.byteLength;
      // native wasm support
      try {
        var result = wasmMemory.grow((size - oldSize) / 65536); // .grow() takes a delta compared to the previous size
        if (result !== (-1 | 0)) {
          // success in native wasm memory growth, get the buffer from the memory
          return Module['buffer'] = wasmMemory.buffer;
        } else {
          return null;
        }
      } catch(e) {
        return null;
      }
    }function _emscripten_resize_heap(requestedSize) {
      var oldSize = _emscripten_get_heap_size();
      // TOTAL_MEMORY is the current size of the actual array, and DYNAMICTOP is the new top.
  
  
      var PAGE_MULTIPLE = 65536;
      var LIMIT = 2147483648 - PAGE_MULTIPLE; // We can do one page short of 2GB as theoretical maximum.
  
      if (requestedSize > LIMIT) {
        return false;
      }
  
      var MIN_TOTAL_MEMORY = 16777216;
      var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY); // So the loop below will not be infinite, and minimum asm.js memory size is 16MB.
  
      while (newSize < requestedSize) { // Keep incrementing the heap size as long as it's less than what is requested.
        if (newSize <= 536870912) {
          newSize = alignUp(2 * newSize, PAGE_MULTIPLE); // Simple heuristic: double until 1GB...
        } else {
          // ..., but after that, add smaller increments towards 2GB, which we cannot reach
          newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
        }
      }
  
  
  
      var replacement = emscripten_realloc_buffer(newSize);
      if (!replacement || replacement.byteLength != newSize) {
        return false;
      }
  
      // everything worked
      updateGlobalBuffer(replacement);
      updateGlobalBufferViews();
  
      TOTAL_MEMORY = newSize;
      HEAPU32[DYNAMICTOP_PTR>>2] = requestedSize;
  
  
  
      return true;
    }

  var _fabs=Math_abs;

  function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = UTF8ToString(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocateUTF8(ENV[name]);
      return _getenv.ret;
    }

  
  var _Int8Array=undefined;
  
  var _Int32Array=undefined;function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      var aligned_dest_end = 0;
      var block_aligned_dest_end = 0;
      var dest_end = 0;
      // Test against a benchmarked cutoff limit for when HEAPU8.set() becomes faster to use.
      if ((num|0) >= 8192) {
        _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
        return dest|0;
      }
  
      ret = dest|0;
      dest_end = (dest + num)|0;
      if ((dest&3) == (src&3)) {
        // The initial unaligned < 4-byte front.
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        aligned_dest_end = (dest_end & -4)|0;
        block_aligned_dest_end = (aligned_dest_end - 64)|0;
        while ((dest|0) <= (block_aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          HEAP32[(((dest)+(4))>>2)]=((HEAP32[(((src)+(4))>>2)])|0);
          HEAP32[(((dest)+(8))>>2)]=((HEAP32[(((src)+(8))>>2)])|0);
          HEAP32[(((dest)+(12))>>2)]=((HEAP32[(((src)+(12))>>2)])|0);
          HEAP32[(((dest)+(16))>>2)]=((HEAP32[(((src)+(16))>>2)])|0);
          HEAP32[(((dest)+(20))>>2)]=((HEAP32[(((src)+(20))>>2)])|0);
          HEAP32[(((dest)+(24))>>2)]=((HEAP32[(((src)+(24))>>2)])|0);
          HEAP32[(((dest)+(28))>>2)]=((HEAP32[(((src)+(28))>>2)])|0);
          HEAP32[(((dest)+(32))>>2)]=((HEAP32[(((src)+(32))>>2)])|0);
          HEAP32[(((dest)+(36))>>2)]=((HEAP32[(((src)+(36))>>2)])|0);
          HEAP32[(((dest)+(40))>>2)]=((HEAP32[(((src)+(40))>>2)])|0);
          HEAP32[(((dest)+(44))>>2)]=((HEAP32[(((src)+(44))>>2)])|0);
          HEAP32[(((dest)+(48))>>2)]=((HEAP32[(((src)+(48))>>2)])|0);
          HEAP32[(((dest)+(52))>>2)]=((HEAP32[(((src)+(52))>>2)])|0);
          HEAP32[(((dest)+(56))>>2)]=((HEAP32[(((src)+(56))>>2)])|0);
          HEAP32[(((dest)+(60))>>2)]=((HEAP32[(((src)+(60))>>2)])|0);
          dest = (dest+64)|0;
          src = (src+64)|0;
        }
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      } else {
        // In the unaligned copy case, unroll a bit as well.
        aligned_dest_end = (dest_end - 4)|0;
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          HEAP8[(((dest)+(1))>>0)]=((HEAP8[(((src)+(1))>>0)])|0);
          HEAP8[(((dest)+(2))>>0)]=((HEAP8[(((src)+(2))>>0)])|0);
          HEAP8[(((dest)+(3))>>0)]=((HEAP8[(((src)+(3))>>0)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      }
      // The remaining unaligned < 4 byte tail.
      while ((dest|0) < (dest_end|0)) {
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
      }
      return ret|0;
    }

  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var end = 0, aligned_end = 0, block_aligned_end = 0, value4 = 0;
      end = (ptr + num)|0;
  
      value = value & 0xff;
      if ((num|0) >= 67 /* 64 bytes for an unrolled loop + 3 bytes for unaligned head*/) {
        while ((ptr&3) != 0) {
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
  
        aligned_end = (end & -4)|0;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
  
        block_aligned_end = (aligned_end - 64)|0;
  
        while((ptr|0) <= (block_aligned_end|0)) {
          HEAP32[((ptr)>>2)]=value4;
          HEAP32[(((ptr)+(4))>>2)]=value4;
          HEAP32[(((ptr)+(8))>>2)]=value4;
          HEAP32[(((ptr)+(12))>>2)]=value4;
          HEAP32[(((ptr)+(16))>>2)]=value4;
          HEAP32[(((ptr)+(20))>>2)]=value4;
          HEAP32[(((ptr)+(24))>>2)]=value4;
          HEAP32[(((ptr)+(28))>>2)]=value4;
          HEAP32[(((ptr)+(32))>>2)]=value4;
          HEAP32[(((ptr)+(36))>>2)]=value4;
          HEAP32[(((ptr)+(40))>>2)]=value4;
          HEAP32[(((ptr)+(44))>>2)]=value4;
          HEAP32[(((ptr)+(48))>>2)]=value4;
          HEAP32[(((ptr)+(52))>>2)]=value4;
          HEAP32[(((ptr)+(56))>>2)]=value4;
          HEAP32[(((ptr)+(60))>>2)]=value4;
          ptr = (ptr + 64)|0;
        }
  
        while ((ptr|0) < (aligned_end|0) ) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      // The remaining bytes.
      while ((ptr|0) < (end|0)) {
        HEAP8[((ptr)>>0)]=value;
        ptr = (ptr+1)|0;
      }
      return (end-num)|0;
    }

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      return value;
    }function _sbrk(increment) {
      increment = increment|0;
      var oldDynamicTop = 0;
      var oldDynamicTopOnChange = 0;
      var newDynamicTop = 0;
      var totalMemory = 0;
      oldDynamicTop = HEAP32[DYNAMICTOP_PTR>>2]|0;
      newDynamicTop = oldDynamicTop + increment | 0;
  
      if (((increment|0) > 0 & (newDynamicTop|0) < (oldDynamicTop|0)) // Detect and fail if we would wrap around signed 32-bit int.
        | (newDynamicTop|0) < 0) { // Also underflow, sbrk() should be able to be used to subtract.
        abortOnCannotGrowMemory(newDynamicTop|0)|0;
        ___setErrNo(12);
        return -1;
      }
  
      totalMemory = _emscripten_get_heap_size()|0;
      if ((newDynamicTop|0) <= (totalMemory|0)) {
        HEAP32[DYNAMICTOP_PTR>>2] = newDynamicTop|0;
      } else {
        if ((_emscripten_resize_heap(newDynamicTop|0)|0) == 0) {
          ___setErrNo(12);
          return -1;
        }
      }
      return oldDynamicTop|0;
    }
var ASSERTIONS = false;

// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// ASM_LIBRARY EXTERN PRIMITIVES: Int8Array,Int32Array

var asmGlobalArg = {};
var asmLibraryArg = { "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "__buildEnvironment": ___buildEnvironment, "__setErrNo": ___setErrNo, "__syscall140": ___syscall140, "__syscall146": ___syscall146, "__syscall54": ___syscall54, "__syscall6": ___syscall6, "abort": _abort, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "emscripten_get_heap_size": _emscripten_get_heap_size, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_realloc_buffer": emscripten_realloc_buffer, "emscripten_resize_heap": _emscripten_resize_heap, "fabs": _fabs, "flush_NO_FILESYSTEM": flush_NO_FILESYSTEM, "getenv": _getenv, "jsCall_ii": jsCall_ii, "jsCall_iii": jsCall_iii, "jsCall_iiii": jsCall_iiii, "jsCall_iiiii": jsCall_iiiii, "jsCall_iiiiii": jsCall_iiiiii, "jsCall_iiiiiii": jsCall_iiiiiii, "jsCall_iiiiiiii": jsCall_iiiiiiii, "jsCall_iiij": jsCall_iiij, "jsCall_iij": jsCall_iij, "jsCall_v": jsCall_v, "jsCall_vi": jsCall_vi, "jsCall_vii": jsCall_vii, "jsCall_viii": jsCall_viii, "jsCall_viiii": jsCall_viiii, "jsCall_viiiii": jsCall_viiiii, "jsCall_viiiiii": jsCall_viiiiii, "memcpy": _memcpy, "memset": _memset, "sbrk": _sbrk };
var asm = Module['asm'](asmGlobalArg, asmLibraryArg, buffer);
Module["asm"] = asm;
var ____errno_location = Module["____errno_location"] = function() {  return Module["asm"]["___errno_location"].apply(null, arguments) };
var ___data_end = Module["___data_end"] = function() {  return Module["asm"]["__data_end"].apply(null, arguments) };
var ___errno_location = Module["___errno_location"] = function() {  return Module["asm"]["__errno_location"].apply(null, arguments) };
var ___get_environ = Module["___get_environ"] = function() {  return Module["asm"]["__get_environ"].apply(null, arguments) };
var ___growWasmMemory = Module["___growWasmMemory"] = function() {  return Module["asm"]["__growWasmMemory"].apply(null, arguments) };
var ___heap_base = Module["___heap_base"] = function() {  return Module["asm"]["__heap_base"].apply(null, arguments) };
var ___post_instantiate = Module["___post_instantiate"] = function() {  return Module["asm"]["__post_instantiate"].apply(null, arguments) };
var __dummy_workaround_for_emscripten_issue_7073 = Module["__dummy_workaround_for_emscripten_issue_7073"] = function() {  return Module["asm"]["_dummy_workaround_for_emscripten_issue_7073"].apply(null, arguments) };
var __free = Module["__free"] = function() {  return Module["asm"]["_free"].apply(null, arguments) };
var __get_environ = Module["__get_environ"] = function() {  return Module["asm"]["_get_environ"].apply(null, arguments) };
var __malloc = Module["__malloc"] = function() {  return Module["asm"]["_malloc"].apply(null, arguments) };
var __setThrew = Module["__setThrew"] = function() {  return Module["asm"]["_setThrew"].apply(null, arguments) };
var __wabt_apply_names_module = Module["__wabt_apply_names_module"] = function() {  return Module["asm"]["_wabt_apply_names_module"].apply(null, arguments) };
var __wabt_bulk_memory_enabled = Module["__wabt_bulk_memory_enabled"] = function() {  return Module["asm"]["_wabt_bulk_memory_enabled"].apply(null, arguments) };
var __wabt_destroy_errors = Module["__wabt_destroy_errors"] = function() {  return Module["asm"]["_wabt_destroy_errors"].apply(null, arguments) };
var __wabt_destroy_features = Module["__wabt_destroy_features"] = function() {  return Module["asm"]["_wabt_destroy_features"].apply(null, arguments) };
var __wabt_destroy_module = Module["__wabt_destroy_module"] = function() {  return Module["asm"]["_wabt_destroy_module"].apply(null, arguments) };
var __wabt_destroy_output_buffer = Module["__wabt_destroy_output_buffer"] = function() {  return Module["asm"]["_wabt_destroy_output_buffer"].apply(null, arguments) };
var __wabt_destroy_parse_wat_result = Module["__wabt_destroy_parse_wat_result"] = function() {  return Module["asm"]["_wabt_destroy_parse_wat_result"].apply(null, arguments) };
var __wabt_destroy_read_binary_result = Module["__wabt_destroy_read_binary_result"] = function() {  return Module["asm"]["_wabt_destroy_read_binary_result"].apply(null, arguments) };
var __wabt_destroy_wast_lexer = Module["__wabt_destroy_wast_lexer"] = function() {  return Module["asm"]["_wabt_destroy_wast_lexer"].apply(null, arguments) };
var __wabt_destroy_write_module_result = Module["__wabt_destroy_write_module_result"] = function() {  return Module["asm"]["_wabt_destroy_write_module_result"].apply(null, arguments) };
var __wabt_exceptions_enabled = Module["__wabt_exceptions_enabled"] = function() {  return Module["asm"]["_wabt_exceptions_enabled"].apply(null, arguments) };
var __wabt_format_binary_errors = Module["__wabt_format_binary_errors"] = function() {  return Module["asm"]["_wabt_format_binary_errors"].apply(null, arguments) };
var __wabt_format_text_errors = Module["__wabt_format_text_errors"] = function() {  return Module["asm"]["_wabt_format_text_errors"].apply(null, arguments) };
var __wabt_generate_names_module = Module["__wabt_generate_names_module"] = function() {  return Module["asm"]["_wabt_generate_names_module"].apply(null, arguments) };
var __wabt_multi_value_enabled = Module["__wabt_multi_value_enabled"] = function() {  return Module["asm"]["_wabt_multi_value_enabled"].apply(null, arguments) };
var __wabt_mutable_globals_enabled = Module["__wabt_mutable_globals_enabled"] = function() {  return Module["asm"]["_wabt_mutable_globals_enabled"].apply(null, arguments) };
var __wabt_new_errors = Module["__wabt_new_errors"] = function() {  return Module["asm"]["_wabt_new_errors"].apply(null, arguments) };
var __wabt_new_features = Module["__wabt_new_features"] = function() {  return Module["asm"]["_wabt_new_features"].apply(null, arguments) };
var __wabt_new_wast_buffer_lexer = Module["__wabt_new_wast_buffer_lexer"] = function() {  return Module["asm"]["_wabt_new_wast_buffer_lexer"].apply(null, arguments) };
var __wabt_output_buffer_get_data = Module["__wabt_output_buffer_get_data"] = function() {  return Module["asm"]["_wabt_output_buffer_get_data"].apply(null, arguments) };
var __wabt_output_buffer_get_size = Module["__wabt_output_buffer_get_size"] = function() {  return Module["asm"]["_wabt_output_buffer_get_size"].apply(null, arguments) };
var __wabt_parse_wast = Module["__wabt_parse_wast"] = function() {  return Module["asm"]["_wabt_parse_wast"].apply(null, arguments) };
var __wabt_parse_wast_result_get_result = Module["__wabt_parse_wast_result_get_result"] = function() {  return Module["asm"]["_wabt_parse_wast_result_get_result"].apply(null, arguments) };
var __wabt_parse_wast_result_release_module = Module["__wabt_parse_wast_result_release_module"] = function() {  return Module["asm"]["_wabt_parse_wast_result_release_module"].apply(null, arguments) };
var __wabt_parse_wat = Module["__wabt_parse_wat"] = function() {  return Module["asm"]["_wabt_parse_wat"].apply(null, arguments) };
var __wabt_parse_wat_result_get_result = Module["__wabt_parse_wat_result_get_result"] = function() {  return Module["asm"]["_wabt_parse_wat_result_get_result"].apply(null, arguments) };
var __wabt_parse_wat_result_release_module = Module["__wabt_parse_wat_result_release_module"] = function() {  return Module["asm"]["_wabt_parse_wat_result_release_module"].apply(null, arguments) };
var __wabt_read_binary = Module["__wabt_read_binary"] = function() {  return Module["asm"]["_wabt_read_binary"].apply(null, arguments) };
var __wabt_read_binary_result_get_result = Module["__wabt_read_binary_result_get_result"] = function() {  return Module["asm"]["_wabt_read_binary_result_get_result"].apply(null, arguments) };
var __wabt_read_binary_result_release_module = Module["__wabt_read_binary_result_release_module"] = function() {  return Module["asm"]["_wabt_read_binary_result_release_module"].apply(null, arguments) };
var __wabt_reference_types_enabled = Module["__wabt_reference_types_enabled"] = function() {  return Module["asm"]["_wabt_reference_types_enabled"].apply(null, arguments) };
var __wabt_resolve_names_module = Module["__wabt_resolve_names_module"] = function() {  return Module["asm"]["_wabt_resolve_names_module"].apply(null, arguments) };
var __wabt_sat_float_to_int_enabled = Module["__wabt_sat_float_to_int_enabled"] = function() {  return Module["asm"]["_wabt_sat_float_to_int_enabled"].apply(null, arguments) };
var __wabt_set_bulk_memory_enabled = Module["__wabt_set_bulk_memory_enabled"] = function() {  return Module["asm"]["_wabt_set_bulk_memory_enabled"].apply(null, arguments) };
var __wabt_set_exceptions_enabled = Module["__wabt_set_exceptions_enabled"] = function() {  return Module["asm"]["_wabt_set_exceptions_enabled"].apply(null, arguments) };
var __wabt_set_multi_value_enabled = Module["__wabt_set_multi_value_enabled"] = function() {  return Module["asm"]["_wabt_set_multi_value_enabled"].apply(null, arguments) };
var __wabt_set_mutable_globals_enabled = Module["__wabt_set_mutable_globals_enabled"] = function() {  return Module["asm"]["_wabt_set_mutable_globals_enabled"].apply(null, arguments) };
var __wabt_set_reference_types_enabled = Module["__wabt_set_reference_types_enabled"] = function() {  return Module["asm"]["_wabt_set_reference_types_enabled"].apply(null, arguments) };
var __wabt_set_sat_float_to_int_enabled = Module["__wabt_set_sat_float_to_int_enabled"] = function() {  return Module["asm"]["_wabt_set_sat_float_to_int_enabled"].apply(null, arguments) };
var __wabt_set_sign_extension_enabled = Module["__wabt_set_sign_extension_enabled"] = function() {  return Module["asm"]["_wabt_set_sign_extension_enabled"].apply(null, arguments) };
var __wabt_set_simd_enabled = Module["__wabt_set_simd_enabled"] = function() {  return Module["asm"]["_wabt_set_simd_enabled"].apply(null, arguments) };
var __wabt_set_tail_call_enabled = Module["__wabt_set_tail_call_enabled"] = function() {  return Module["asm"]["_wabt_set_tail_call_enabled"].apply(null, arguments) };
var __wabt_set_threads_enabled = Module["__wabt_set_threads_enabled"] = function() {  return Module["asm"]["_wabt_set_threads_enabled"].apply(null, arguments) };
var __wabt_sign_extension_enabled = Module["__wabt_sign_extension_enabled"] = function() {  return Module["asm"]["_wabt_sign_extension_enabled"].apply(null, arguments) };
var __wabt_simd_enabled = Module["__wabt_simd_enabled"] = function() {  return Module["asm"]["_wabt_simd_enabled"].apply(null, arguments) };
var __wabt_tail_call_enabled = Module["__wabt_tail_call_enabled"] = function() {  return Module["asm"]["_wabt_tail_call_enabled"].apply(null, arguments) };
var __wabt_threads_enabled = Module["__wabt_threads_enabled"] = function() {  return Module["asm"]["_wabt_threads_enabled"].apply(null, arguments) };
var __wabt_validate_module = Module["__wabt_validate_module"] = function() {  return Module["asm"]["_wabt_validate_module"].apply(null, arguments) };
var __wabt_validate_script = Module["__wabt_validate_script"] = function() {  return Module["asm"]["_wabt_validate_script"].apply(null, arguments) };
var __wabt_write_binary_module = Module["__wabt_write_binary_module"] = function() {  return Module["asm"]["_wabt_write_binary_module"].apply(null, arguments) };
var __wabt_write_binary_spec_script = Module["__wabt_write_binary_spec_script"] = function() {  return Module["asm"]["_wabt_write_binary_spec_script"].apply(null, arguments) };
var __wabt_write_module_result_get_result = Module["__wabt_write_module_result_get_result"] = function() {  return Module["asm"]["_wabt_write_module_result_get_result"].apply(null, arguments) };
var __wabt_write_module_result_release_log_output_buffer = Module["__wabt_write_module_result_release_log_output_buffer"] = function() {  return Module["asm"]["_wabt_write_module_result_release_log_output_buffer"].apply(null, arguments) };
var __wabt_write_module_result_release_output_buffer = Module["__wabt_write_module_result_release_output_buffer"] = function() {  return Module["asm"]["_wabt_write_module_result_release_output_buffer"].apply(null, arguments) };
var __wabt_write_text_module = Module["__wabt_write_text_module"] = function() {  return Module["asm"]["_wabt_write_text_module"].apply(null, arguments) };
var _dummy_workaround_for_emscripten_issue_7073 = Module["_dummy_workaround_for_emscripten_issue_7073"] = function() {  return Module["asm"]["dummy_workaround_for_emscripten_issue_7073"].apply(null, arguments) };
var dynCall_ii = Module["dynCall_ii"] = function() {  return Module["asm"]["dynCall_ii"].apply(null, arguments) };
var dynCall_iii = Module["dynCall_iii"] = function() {  return Module["asm"]["dynCall_iii"].apply(null, arguments) };
var dynCall_iiii = Module["dynCall_iiii"] = function() {  return Module["asm"]["dynCall_iiii"].apply(null, arguments) };
var dynCall_iiiii = Module["dynCall_iiiii"] = function() {  return Module["asm"]["dynCall_iiiii"].apply(null, arguments) };
var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {  return Module["asm"]["dynCall_iiiiii"].apply(null, arguments) };
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments) };
var dynCall_iiij = Module["dynCall_iiij"] = function() {  return Module["asm"]["dynCall_iiij"].apply(null, arguments) };
var dynCall_iij = Module["dynCall_iij"] = function() {  return Module["asm"]["dynCall_iij"].apply(null, arguments) };
var dynCall_vi = Module["dynCall_vi"] = function() {  return Module["asm"]["dynCall_vi"].apply(null, arguments) };
var dynCall_vii = Module["dynCall_vii"] = function() {  return Module["asm"]["dynCall_vii"].apply(null, arguments) };
var dynCall_viii = Module["dynCall_viii"] = function() {  return Module["asm"]["dynCall_viii"].apply(null, arguments) };
var dynCall_viiii = Module["dynCall_viiii"] = function() {  return Module["asm"]["dynCall_viiii"].apply(null, arguments) };
var dynCall_viiiii = Module["dynCall_viiiii"] = function() {  return Module["asm"]["dynCall_viiiii"].apply(null, arguments) };
var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {  return Module["asm"]["dynCall_viiiiii"].apply(null, arguments) };
var _free = Module["_free"] = function() {  return Module["asm"]["free"].apply(null, arguments) };
var _malloc = Module["_malloc"] = function() {  return Module["asm"]["malloc"].apply(null, arguments) };
var _setThrew = Module["_setThrew"] = function() {  return Module["asm"]["setThrew"].apply(null, arguments) };
var stackAlloc = Module["stackAlloc"] = function() {  return Module["asm"]["stackAlloc"].apply(null, arguments) };
var stackRestore = Module["stackRestore"] = function() {  return Module["asm"]["stackRestore"].apply(null, arguments) };
var stackSave = Module["stackSave"] = function() {  return Module["asm"]["stackSave"].apply(null, arguments) };
var _wabt_apply_names_module = Module["_wabt_apply_names_module"] = function() {  return Module["asm"]["wabt_apply_names_module"].apply(null, arguments) };
var _wabt_bulk_memory_enabled = Module["_wabt_bulk_memory_enabled"] = function() {  return Module["asm"]["wabt_bulk_memory_enabled"].apply(null, arguments) };
var _wabt_destroy_errors = Module["_wabt_destroy_errors"] = function() {  return Module["asm"]["wabt_destroy_errors"].apply(null, arguments) };
var _wabt_destroy_features = Module["_wabt_destroy_features"] = function() {  return Module["asm"]["wabt_destroy_features"].apply(null, arguments) };
var _wabt_destroy_module = Module["_wabt_destroy_module"] = function() {  return Module["asm"]["wabt_destroy_module"].apply(null, arguments) };
var _wabt_destroy_output_buffer = Module["_wabt_destroy_output_buffer"] = function() {  return Module["asm"]["wabt_destroy_output_buffer"].apply(null, arguments) };
var _wabt_destroy_parse_wat_result = Module["_wabt_destroy_parse_wat_result"] = function() {  return Module["asm"]["wabt_destroy_parse_wat_result"].apply(null, arguments) };
var _wabt_destroy_read_binary_result = Module["_wabt_destroy_read_binary_result"] = function() {  return Module["asm"]["wabt_destroy_read_binary_result"].apply(null, arguments) };
var _wabt_destroy_wast_lexer = Module["_wabt_destroy_wast_lexer"] = function() {  return Module["asm"]["wabt_destroy_wast_lexer"].apply(null, arguments) };
var _wabt_destroy_write_module_result = Module["_wabt_destroy_write_module_result"] = function() {  return Module["asm"]["wabt_destroy_write_module_result"].apply(null, arguments) };
var _wabt_exceptions_enabled = Module["_wabt_exceptions_enabled"] = function() {  return Module["asm"]["wabt_exceptions_enabled"].apply(null, arguments) };
var _wabt_format_binary_errors = Module["_wabt_format_binary_errors"] = function() {  return Module["asm"]["wabt_format_binary_errors"].apply(null, arguments) };
var _wabt_format_text_errors = Module["_wabt_format_text_errors"] = function() {  return Module["asm"]["wabt_format_text_errors"].apply(null, arguments) };
var _wabt_generate_names_module = Module["_wabt_generate_names_module"] = function() {  return Module["asm"]["wabt_generate_names_module"].apply(null, arguments) };
var _wabt_multi_value_enabled = Module["_wabt_multi_value_enabled"] = function() {  return Module["asm"]["wabt_multi_value_enabled"].apply(null, arguments) };
var _wabt_mutable_globals_enabled = Module["_wabt_mutable_globals_enabled"] = function() {  return Module["asm"]["wabt_mutable_globals_enabled"].apply(null, arguments) };
var _wabt_new_errors = Module["_wabt_new_errors"] = function() {  return Module["asm"]["wabt_new_errors"].apply(null, arguments) };
var _wabt_new_features = Module["_wabt_new_features"] = function() {  return Module["asm"]["wabt_new_features"].apply(null, arguments) };
var _wabt_new_wast_buffer_lexer = Module["_wabt_new_wast_buffer_lexer"] = function() {  return Module["asm"]["wabt_new_wast_buffer_lexer"].apply(null, arguments) };
var _wabt_output_buffer_get_data = Module["_wabt_output_buffer_get_data"] = function() {  return Module["asm"]["wabt_output_buffer_get_data"].apply(null, arguments) };
var _wabt_output_buffer_get_size = Module["_wabt_output_buffer_get_size"] = function() {  return Module["asm"]["wabt_output_buffer_get_size"].apply(null, arguments) };
var _wabt_parse_wast = Module["_wabt_parse_wast"] = function() {  return Module["asm"]["wabt_parse_wast"].apply(null, arguments) };
var _wabt_parse_wast_result_get_result = Module["_wabt_parse_wast_result_get_result"] = function() {  return Module["asm"]["wabt_parse_wast_result_get_result"].apply(null, arguments) };
var _wabt_parse_wast_result_release_module = Module["_wabt_parse_wast_result_release_module"] = function() {  return Module["asm"]["wabt_parse_wast_result_release_module"].apply(null, arguments) };
var _wabt_parse_wat = Module["_wabt_parse_wat"] = function() {  return Module["asm"]["wabt_parse_wat"].apply(null, arguments) };
var _wabt_parse_wat_result_get_result = Module["_wabt_parse_wat_result_get_result"] = function() {  return Module["asm"]["wabt_parse_wat_result_get_result"].apply(null, arguments) };
var _wabt_parse_wat_result_release_module = Module["_wabt_parse_wat_result_release_module"] = function() {  return Module["asm"]["wabt_parse_wat_result_release_module"].apply(null, arguments) };
var _wabt_read_binary = Module["_wabt_read_binary"] = function() {  return Module["asm"]["wabt_read_binary"].apply(null, arguments) };
var _wabt_read_binary_result_get_result = Module["_wabt_read_binary_result_get_result"] = function() {  return Module["asm"]["wabt_read_binary_result_get_result"].apply(null, arguments) };
var _wabt_read_binary_result_release_module = Module["_wabt_read_binary_result_release_module"] = function() {  return Module["asm"]["wabt_read_binary_result_release_module"].apply(null, arguments) };
var _wabt_reference_types_enabled = Module["_wabt_reference_types_enabled"] = function() {  return Module["asm"]["wabt_reference_types_enabled"].apply(null, arguments) };
var _wabt_resolve_names_module = Module["_wabt_resolve_names_module"] = function() {  return Module["asm"]["wabt_resolve_names_module"].apply(null, arguments) };
var _wabt_sat_float_to_int_enabled = Module["_wabt_sat_float_to_int_enabled"] = function() {  return Module["asm"]["wabt_sat_float_to_int_enabled"].apply(null, arguments) };
var _wabt_set_bulk_memory_enabled = Module["_wabt_set_bulk_memory_enabled"] = function() {  return Module["asm"]["wabt_set_bulk_memory_enabled"].apply(null, arguments) };
var _wabt_set_exceptions_enabled = Module["_wabt_set_exceptions_enabled"] = function() {  return Module["asm"]["wabt_set_exceptions_enabled"].apply(null, arguments) };
var _wabt_set_multi_value_enabled = Module["_wabt_set_multi_value_enabled"] = function() {  return Module["asm"]["wabt_set_multi_value_enabled"].apply(null, arguments) };
var _wabt_set_mutable_globals_enabled = Module["_wabt_set_mutable_globals_enabled"] = function() {  return Module["asm"]["wabt_set_mutable_globals_enabled"].apply(null, arguments) };
var _wabt_set_reference_types_enabled = Module["_wabt_set_reference_types_enabled"] = function() {  return Module["asm"]["wabt_set_reference_types_enabled"].apply(null, arguments) };
var _wabt_set_sat_float_to_int_enabled = Module["_wabt_set_sat_float_to_int_enabled"] = function() {  return Module["asm"]["wabt_set_sat_float_to_int_enabled"].apply(null, arguments) };
var _wabt_set_sign_extension_enabled = Module["_wabt_set_sign_extension_enabled"] = function() {  return Module["asm"]["wabt_set_sign_extension_enabled"].apply(null, arguments) };
var _wabt_set_simd_enabled = Module["_wabt_set_simd_enabled"] = function() {  return Module["asm"]["wabt_set_simd_enabled"].apply(null, arguments) };
var _wabt_set_tail_call_enabled = Module["_wabt_set_tail_call_enabled"] = function() {  return Module["asm"]["wabt_set_tail_call_enabled"].apply(null, arguments) };
var _wabt_set_threads_enabled = Module["_wabt_set_threads_enabled"] = function() {  return Module["asm"]["wabt_set_threads_enabled"].apply(null, arguments) };
var _wabt_sign_extension_enabled = Module["_wabt_sign_extension_enabled"] = function() {  return Module["asm"]["wabt_sign_extension_enabled"].apply(null, arguments) };
var _wabt_simd_enabled = Module["_wabt_simd_enabled"] = function() {  return Module["asm"]["wabt_simd_enabled"].apply(null, arguments) };
var _wabt_tail_call_enabled = Module["_wabt_tail_call_enabled"] = function() {  return Module["asm"]["wabt_tail_call_enabled"].apply(null, arguments) };
var _wabt_threads_enabled = Module["_wabt_threads_enabled"] = function() {  return Module["asm"]["wabt_threads_enabled"].apply(null, arguments) };
var _wabt_validate_module = Module["_wabt_validate_module"] = function() {  return Module["asm"]["wabt_validate_module"].apply(null, arguments) };
var _wabt_validate_script = Module["_wabt_validate_script"] = function() {  return Module["asm"]["wabt_validate_script"].apply(null, arguments) };
var _wabt_write_binary_module = Module["_wabt_write_binary_module"] = function() {  return Module["asm"]["wabt_write_binary_module"].apply(null, arguments) };
var _wabt_write_binary_spec_script = Module["_wabt_write_binary_spec_script"] = function() {  return Module["asm"]["wabt_write_binary_spec_script"].apply(null, arguments) };
var _wabt_write_module_result_get_result = Module["_wabt_write_module_result_get_result"] = function() {  return Module["asm"]["wabt_write_module_result_get_result"].apply(null, arguments) };
var _wabt_write_module_result_release_log_output_buffer = Module["_wabt_write_module_result_release_log_output_buffer"] = function() {  return Module["asm"]["wabt_write_module_result_release_log_output_buffer"].apply(null, arguments) };
var _wabt_write_module_result_release_output_buffer = Module["_wabt_write_module_result_release_output_buffer"] = function() {  return Module["asm"]["wabt_write_module_result_release_output_buffer"].apply(null, arguments) };
var _wabt_write_text_module = Module["_wabt_write_text_module"] = function() {  return Module["asm"]["wabt_write_text_module"].apply(null, arguments) };

function jsCall_ii(index,a1) {
    return functionPointers[index + 0](a1);
}

function jsCall_iii(index,a1,a2) {
    return functionPointers[index + 10](a1,a2);
}

function jsCall_iiii(index,a1,a2,a3) {
    return functionPointers[index + 20](a1,a2,a3);
}

function jsCall_iiiii(index,a1,a2,a3,a4) {
    return functionPointers[index + 30](a1,a2,a3,a4);
}

function jsCall_iiiiii(index,a1,a2,a3,a4,a5) {
    return functionPointers[index + 40](a1,a2,a3,a4,a5);
}

function jsCall_iiiiiii(index,a1,a2,a3,a4,a5,a6) {
    return functionPointers[index + 50](a1,a2,a3,a4,a5,a6);
}

function jsCall_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
    return functionPointers[index + 60](a1,a2,a3,a4,a5,a6,a7);
}

function jsCall_iiij(index,a1,a2,a3) {
    return functionPointers[index + 70](a1,a2,a3);
}

function jsCall_iij(index,a1,a2) {
    return functionPointers[index + 80](a1,a2);
}

function jsCall_v(index) {
    functionPointers[index + 90]();
}

function jsCall_vi(index,a1) {
    functionPointers[index + 100](a1);
}

function jsCall_vii(index,a1,a2) {
    functionPointers[index + 110](a1,a2);
}

function jsCall_viii(index,a1,a2,a3) {
    functionPointers[index + 120](a1,a2,a3);
}

function jsCall_viiii(index,a1,a2,a3,a4) {
    functionPointers[index + 130](a1,a2,a3,a4);
}

function jsCall_viiiii(index,a1,a2,a3,a4,a5) {
    functionPointers[index + 140](a1,a2,a3,a4,a5);
}

function jsCall_viiiiii(index,a1,a2,a3,a4,a5,a6) {
    functionPointers[index + 150](a1,a2,a3,a4,a5,a6);
}



// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;











































































// Modularize mode returns a function, which can be called to
// create instances. The instances provide a then() method,
// must like a Promise, that receives a callback. The callback
// is called when the module is ready to run, with the module
// as a parameter. (Like a Promise, it also returns the module
// so you can use the output of .then(..)).
Module['then'] = function(func) {
  // We may already be ready to run code at this time. if
  // so, just queue a call to the callback.
  if (Module['calledRun']) {
    func(Module);
  } else {
    // we are not ready to call then() yet. we must call it
    // at the same time we would call onRuntimeInitialized.
    var old = Module['onRuntimeInitialized'];
    Module['onRuntimeInitialized'] = function() {
      if (old) old();
      func(Module);
    };
  }
  return Module;
};

/**
 * @constructor
 * @extends {Error}
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}





/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();


    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = run;


function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && Module['noExitRuntime'] && status === 0) {
    return;
  }

  if (Module['noExitRuntime']) {
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  Module['quit'](status, new ExitStatus(status));
}

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';
}
Module['abort'] = abort;

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}


  Module["noExitRuntime"] = true;

run();





// {{MODULE_ADDITIONS}}



/*
 * Copyright 2016 WebAssembly Community Group participants
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var WABT_OK = 0;
var WABT_ERROR = 1;
var FEATURES = [
  'exceptions',
  'mutable_globals',
  'sat_float_to_int',
  'sign_extension',
  'simd',
  'threads',
  'multi_value',
  'tail_call',
  'bulk_memory',
  'reference_types',
];

/// If value is not undefined, return it. Otherwise return default_.
function maybeDefault(value, default_) {
  if (value === undefined) {
    return default_;
  }
  return value;
}

/// Coerce value to boolean if not undefined. Otherwise return default_.
function booleanOrDefault(value, default_) {
  return !!maybeDefault(value, default_);
}

/// Allocate memory in the Module.
function malloc(size) {
  var addr = Module._malloc(size);
  if (addr == 0) {
    throw new Error('out of memory');
  }
  return addr;
}

/// Convert an ArrayBuffer/TypedArray/string into a buffer that can be
/// used by the Module.
function allocateBuffer(buf) {
  var addr;
  var size;
  if (buf instanceof ArrayBuffer) {
    size = buf.byteLength;
    addr = malloc(size);
    (new Uint8Array(HEAP8.buffer, addr, size)).set(new Uint8Array(buf))
  } else if (ArrayBuffer.isView(buf)) {
    size = buf.buffer.byteLength;
    addr = malloc(size);
    (new Uint8Array(HEAP8.buffer, addr, size)).set(buf);
  } else if (typeof buf == 'string') {
    size = buf.length;
    addr = malloc(size);
    writeAsciiToMemory(buf, addr, true);  // don't null-terminate
  } else {
    throw new Error('unknown buffer type: ' + buf);
  }
  return {addr: addr, size: size};
}

function allocateCString(s) {
  var size = s.length;
  var addr = malloc(size);
  writeAsciiToMemory(s, addr);
  return {addr: addr, size: size};
}


/// Features
function Features(obj) {
  this.addr = Module._wabt_new_features();
  for (var i = 0; i < FEATURES.length; ++i) {
    var feature = FEATURES[i];
    this[feature] = obj[feature] | 0;
  }
}
Features.prototype = Object.create(Object.prototype);

Features.prototype.destroy = function() {
  Module._wabt_destroy_features(this.addr);
};

FEATURES.forEach(function(feature) {
  Object.defineProperty(Features.prototype, feature, {
    enumerable: true,
    get: function() {
      return Module['_wabt_' + feature + '_enabled'](this.addr);
    },
    set: function(newValue) {
      Module['_wabt_set_' + feature + '_enabled'](this.addr, newValue | 0);
    }
  });
});


/// Lexer
function Lexer(filename, buffer) {
  this.filenameObj = allocateCString(filename);
  this.bufferObj = allocateBuffer(buffer);
  this.addr = Module._wabt_new_wast_buffer_lexer(
      this.filenameObj.addr, this.bufferObj.addr, this.bufferObj.size);
}
Lexer.prototype = Object.create(Object.prototype);

Lexer.prototype.destroy = function() {
  Module._wabt_destroy_wast_lexer(this.addr);
  Module._free(this.bufferObj.addr);
  Module._free(this.filenameObj.addr);
};


/// OutputBuffer
function OutputBuffer(addr) {
  this.addr = addr;
}
OutputBuffer.prototype = Object.create(Object.prototype);

OutputBuffer.prototype.toTypedArray = function() {
  if (!this.addr) {
    return null;
  }

  var addr = Module._wabt_output_buffer_get_data(this.addr);
  var size = Module._wabt_output_buffer_get_size(this.addr);
  var buffer = new Uint8Array(size);
  buffer.set(new Uint8Array(HEAPU8.buffer, addr, size));
  return buffer;
};

OutputBuffer.prototype.toString = function() {
  if (!this.addr) {
    return '';
  }

  var addr = Module._wabt_output_buffer_get_data(this.addr);
  var size = Module._wabt_output_buffer_get_size(this.addr);
  return UTF8ToString(addr, size);
};

OutputBuffer.prototype.destroy = function() {
  Module._wabt_destroy_output_buffer(this.addr);
};


/// Errors
function Errors(kind, lexer) {
  this.kind = kind;
  this.addr = Module._wabt_new_errors();
  this.lexer = lexer;
}
Errors.prototype = Object.create(Object.prototype);

Errors.prototype.format = function() {
  var buffer;
  switch (this.kind) {
    case 'text':
      buffer = new OutputBuffer(
          Module._wabt_format_text_errors(this.addr, this.lexer.addr));
      break;
    case 'binary':
      buffer = new OutputBuffer(Module._wabt_format_binary_errors(this.addr));
      break;
    default:
      throw new Error('Invalid Errors kind: ' + this.kind);
  }
  var message = buffer.toString();
  buffer.destroy();
  return message;
};

Errors.prototype.destroy = function() {
  Module._wabt_destroy_errors(this.addr);
  if (this.lexer) {
    this.lexer.destroy();
  }
};


/// parseWat
function parseWat(filename, buffer, options) {
  var lexer = new Lexer(filename, buffer);
  var errors = new Errors('text', lexer);
  var features = new Features(options || {});

  try {
    var parseResult_addr =
        Module._wabt_parse_wat(lexer.addr, features.addr, errors.addr);

    var result = Module._wabt_parse_wat_result_get_result(parseResult_addr);
    if (result !== WABT_OK) {
      throw new Error('parseWat failed:\n' + errors.format());
    }

    var module_addr =
        Module._wabt_parse_wat_result_release_module(parseResult_addr);
    var result = new WasmModule(module_addr, errors);
    // Clear errors so it isn't destroyed below.
    errors = null;
    return result;
  } finally {
    Module._wabt_destroy_parse_wat_result(parseResult_addr);
    features.destroy();
    if (errors) {
      errors.destroy();
    }
  }
}


// readWasm
function readWasm(buffer, options) {
  var bufferObj = allocateBuffer(buffer);
  var errors = new Errors('binary');
  var readDebugNames = booleanOrDefault(options.readDebugNames, false);
  var features = new Features(options);

  try {
    var readBinaryResult_addr = Module._wabt_read_binary(
        bufferObj.addr, bufferObj.size, readDebugNames, features.addr,
        errors.addr);

    var result =
        Module._wabt_read_binary_result_get_result(readBinaryResult_addr);
    if (result !== WABT_OK) {
      throw new Error('readWasm failed:\n' + errors.format());
    }

    var module_addr =
        Module._wabt_read_binary_result_release_module(readBinaryResult_addr);
    var result = new WasmModule(module_addr, errors);
    // Clear errors so it isn't destroyed below.
    errors = null;
    return result;
  } finally {
    Module._wabt_destroy_read_binary_result(readBinaryResult_addr);
    features.destroy();
    if (errors) {
      errors.destroy();
    }
    Module._free(bufferObj.addr);
  }
}


// WasmModule (can't call it Module because emscripten has claimed it.)
function WasmModule(module_addr, errors) {
  this.module_addr = module_addr;
  this.errors = errors;
}
WasmModule.prototype = Object.create(Object.prototype);

WasmModule.prototype.validate = function(options) {
  var features = new Features(options || {});
  try {
    var result = Module._wabt_validate_module(
        this.module_addr, features.addr, this.errors.addr);
    if (result !== WABT_OK) {
      throw new Error('validate failed:\n' + this.errors.format());
    }
  } finally {
    features.destroy();
  }
};

WasmModule.prototype.resolveNames = function() {
  var result =
      Module._wabt_resolve_names_module(this.module_addr, this.errors.addr);
  if (result !== WABT_OK) {
    throw new Error('resolveNames failed:\n' + this.errors.format());
  }
};

WasmModule.prototype.generateNames = function() {
  var result = Module._wabt_generate_names_module(this.module_addr);
  if (result !== WABT_OK) {
    throw new Error('generateNames failed.');
  }
};

WasmModule.prototype.applyNames = function() {
  var result = Module._wabt_apply_names_module(this.module_addr);
  if (result !== WABT_OK) {
    throw new Error('applyNames failed.');
  }
};

WasmModule.prototype.toText = function(options) {
  var foldExprs = booleanOrDefault(options.foldExprs, false);
  var inlineExport = booleanOrDefault(options.inlineExport, false);

  var writeModuleResult_addr =
      Module._wabt_write_text_module(this.module_addr, foldExprs, inlineExport);

  var result = Module._wabt_write_module_result_get_result(
      writeModuleResult_addr);

  try {
    if (result !== WABT_OK) {
      throw new Error('toText failed.');
    }

    var outputBuffer = new OutputBuffer(
        Module._wabt_write_module_result_release_output_buffer(
            writeModuleResult_addr));

    return outputBuffer.toString();

  } finally {
    if (outputBuffer) {
      outputBuffer.destroy();
    }
    Module._wabt_destroy_write_module_result(writeModuleResult_addr);
  }
};

WasmModule.prototype.toBinary = function(options) {
  var log = booleanOrDefault(options.log, false);
  var canonicalize_lebs = booleanOrDefault(options.canonicalize_lebs, true);
  var relocatable = booleanOrDefault(options.relocatable, false);
  var write_debug_names = booleanOrDefault(options.write_debug_names, false);

  var writeModuleResult_addr = Module._wabt_write_binary_module(
      this.module_addr, log, canonicalize_lebs, relocatable, write_debug_names);

  var result =
      Module._wabt_write_module_result_get_result(writeModuleResult_addr);

  try {
    if (result !== WABT_OK) {
      throw new Error('toBinary failed.');
    }

    var binaryOutputBuffer =
        new OutputBuffer(Module._wabt_write_module_result_release_output_buffer(
            writeModuleResult_addr));
    var logOutputBuffer = new OutputBuffer(
        Module._wabt_write_module_result_release_log_output_buffer(
            writeModuleResult_addr));

    return {
      buffer: binaryOutputBuffer.toTypedArray(),
      log: logOutputBuffer.toString()
    };

  } finally {
    if (binaryOutputBuffer) {
      binaryOutputBuffer.destroy();
    }
    if (logOutputBuffer) {
      logOutputBuffer.destroy();
    }
    Module._wabt_destroy_write_module_result(writeModuleResult_addr);
  }
};

WasmModule.prototype.destroy = function() {
  Module._wabt_destroy_module(this.module_addr);
  if (this.errors) {
    this.errors.destroy();
  }
};

Module['parseWat'] = parseWat;
Module['readWasm'] = readWasm;



  return WabtModule;
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = WabtModule;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return WabtModule; });
    else if (typeof exports === 'object')
      exports["WabtModule"] = WabtModule;
    