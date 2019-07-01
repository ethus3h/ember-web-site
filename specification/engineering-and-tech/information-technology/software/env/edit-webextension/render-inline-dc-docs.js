// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

//https://stackoverflow.com/questions/19196337/string-contains-doesnt-exist-while-working-in-chrome
if(!('contains' in String.prototype)) {
    String.prototype.contains = function(str, startIndex) {
            return -1 !== String.prototype.indexOf.call(this, str, startIndex);
    };
}

(async function() {
    const sleep = t => x => new Promise(r => setTimeout(()=>r(x), t));
    await sleep(100);
    //let elems=document.getElementsByTagName('*');
    let textNodesUnder = function(el) {
        let n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
        while (n=walk.nextNode()) {
            a.push(n);
        }
        return a;
    }
    // from https://stackoverflow.com/questions/36532307/rem-px-in-javascript
    let convertRemToPixels = function(rem) {
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    let elems=textNodesUnder(document.body);
    let added=false;
    let addCssIfNeeded = function() {
        if (!added) {
            added=true;
            let stylesheet = document.head.appendChild(document.createElement("style")).sheet;
            let addRule = (function(sheet) {
                    // https://web.archive.org/web/20190311175426/https://stackoverflow.com/questions/4481485/changing-css-pseudo-element-styles-via-javascript
                    return function (selector, css) {
                        let propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {
                            return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
                        }).join(";");
                        sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
                    };
                })(stylesheet);
            // https://github.com/codepo8/CSS3-Rainbow-Dividers/blob/master/rainbows.css
            stylesheet.insertRule('@keyframes keyframeRule { from { background-position: top left; } to { background-position: top right; } }', stylesheet.cssRules.length);
            addRule(".b8316ea083754b2e9290591f37d94765EiteWebextensionInlineRenderSpan", {
                    position: "relative",
                    display: "inline-block"
                });
            addRule(".b8316ea083754b2e9290591f37d94765EiteWebextensionInlineRenderFrame", {
                    display: "none",
                    border: 0
                });
            addRule(".b8316ea083754b2e9290591f37d94765EiteWebextensionInlineRenderSpan::before", {
                    display: "block",
                    animation: "keyframeRule 2.5s forwards linear infinite",
                    width: "100%",
                    height: "0.2rem",
                    position: "absolute",
                    "background-image": "linear-gradient( left, red, orange, yellow, green, blue, indigo, violet, indigo, blue, green, yellow, orange, red )",
                    "background-image": "-moz-linear-gradient( left, red, orange, yellow, green, blue, indigo, violet, indigo, blue, green, yellow, orange, red )",
                    //background: "red",
                    "background-size": "50% auto",
                    content: "' '"
                });
        }
    }
    let el;
    let re=/􍁝􋶀󼷢󺀊󸥎􈺍󲋠􏺐/g;
    let nodeVal;
    let foundIndex;
    let begin;
    let ifr;
    let matched;
    let textNode;
    let parentNode;
    let span;
    let replacedAll;
    let limit = 1;
    let j;
    // from https://web.archive.org/web/20190314133524/https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
    function getScrollBarWidth () {
        var inner = document.createElement('p');
        inner.style.width = "100%";
        inner.style.height = "200px";

        var outer = document.createElement('div');
        outer.style.position = "absolute";
        outer.style.top = "0px";
        outer.style.left = "0px";
        outer.style.visibility = "hidden";
        outer.style.width = "200px";
        outer.style.height = "150px";
        outer.style.overflow = "hidden";
        outer.appendChild (inner);

        document.body.appendChild (outer);
        var w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        var w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        document.body.removeChild (outer);

        return (w1 - w2);
    };
    let scrollBarWidth;
    // May be wrong if the page zoom changes, but I'm not sure what to do about that.
    scrollBarWidth=getScrollBarWidth();
    for (let i=0;i<elems.length;i++) {
        el=elems[i];
        if (el.textContent.match(re)) {
            addCssIfNeeded();
            replacedAll = false;
            j = 0;
            while (!replacedAll && j < limit) {
                j = j + 1;
                // based on https://web.archive.org/web/20190311140420/https://stackoverflow.com/questions/8644428/how-to-highlight-text-using-javascript
                nodeVal = el.nodeValue;
                foundIndex = nodeVal.indexOf('􍁝􋶀󼷢󺀊󸥎􈺍󲋠􏺐');
                if (foundIndex < 0) {
                    replacedAll = true;
                }
                else {
                    begin = nodeVal.substring(0, foundIndex);
                    parentNode = el.parentNode;
                    matched = el.textContent.match(new RegExp('􍁝􋶀󼷢󺀊󸥎􈺍󲋠􏺐(.*)󼅹󴶯􈡺󿔊􆲦􍸂󲀰􏼝'))[0];
                    if (begin.length > 0) {
                        textNode = document.createTextNode(begin);
                        parentNode.insertBefore(textNode, el);
                    }
                    span = document.createElement("span");
                    span.className = span.className + ' b8316ea083754b2e9290591f37d94765EiteWebextensionInlineRenderSpan';
                    span.appendChild(document.createTextNode(matched));
                    parentNode.insertBefore(span, el);
                    ifr=document.createElement('iframe');
                    el.nodeValue = nodeVal.substring(foundIndex + matched.length);
                    ifr.id='b8316ea083754b2e9290591f37d94765EiteWebextensionInlineRenderFrameId'+i;
                    console.log('Sending document data ' + i + ' to background script: '+matched);
                    browser.runtime.sendMessage(['b8316ea083754b2e9290591f37d94765EiteWebextensionMessageDocumentId'+i,matched]).then(function() {
                    });
                        ifr.className='b8316ea083754b2e9290591f37d94765EiteWebextensionInlineRenderFrame';
                        ifr.src=browser.runtime.getURL('edit.html')+'#'+'b8316ea083754b2e9290591f37d94765EiteWebextensionMessageDocumentId'+i;
                        ifr.style.height=(scrollBarWidth + span.clientHeight + convertRemToPixels(0.1))+'px';
                        ifr.style.width=(scrollBarWidth + span.clientWidth + convertRemToPixels(0.1))+'px';
                        ifr.style.border='0.1rem dotted black';
                        parentNode.insertBefore(ifr, el);
                        ifr=document.getElementById('b8316ea083754b2e9290591f37d94765EiteWebextensionInlineRenderFrameId'+i);
                        let replaceSpan=function(span, ifr){/*console.log('tebuice');*/span.style.display='none';ifr.style.display='inline-block';};
                        replaceSpan(span, ifr);
                        // console.log('bubube');
                        //alert('a');
                        //const sleep = t => x => new Promise(r => setTimeout(()=>r(x), t));
                        //await sleep(1000); alert('b');
                        //window.setTimeout(alert, 1);
                        //window.setTimeout(replaceSpan, 1, span, ifr);
                        //ifr.contentWindow.postMessage([ 'b8316ea083754b2e9290591f37d94765EiteWebextensionMessageUtf8', false, matched], ifr.src);
                    //});
                }
            }
        }
    }
})();

// @license-end
