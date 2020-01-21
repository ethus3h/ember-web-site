// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0

// The below code is based on https://github.com/pwa-builder/pwabuilder-serviceworkers/blob/master/serviceWorker1/pwabuilder-sw.js
    /*
        Copyright (c) Microsoft Corporation

        All rights reserved.

        MIT License

        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ""Software""), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

        The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

        THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    // This is the "Offline page" service worker

    const CACHE = "pwabuilder-page";

    // TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
    const offlineFallbackPage = "offline.html";

    // Install stage sets up the offline page in the cache and opens a new cache
    self.addEventListener("install", function (event) {
    console.log("[PWA Builder] Install Event processing");

    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
        console.log("[PWA Builder] Cached offline page during install");

        return cache.add(offlineFallbackPage);
        })
    );
    });

    // If any fetch fails, it will show the offline page.
    self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request).catch(function (error) {
        // The following validates that the request was for a navigation to a new document
        if (
            event.request.destination !== "document" ||
            event.request.mode !== "navigate"
        ) {
            return;
        }

        console.error("[PWA Builder] Network request Failed. Serving offline page " + error);
        return caches.open(CACHE).then(function (cache) {
            return cache.match(offlineFallbackPage);
        });
        })
    );
    });

    // This is an event that can be fired from your page to tell the SW to update the offline page
    self.addEventListener("refreshOffline", function () {
    const offlinePageRequest = new Request(offlineFallbackPage);

    return fetch(offlineFallbackPage).then(function (response) {
        return caches.open(CACHE).then(function (cache) {
        console.log("[PWA Builder] Offline page updated from refreshOffline event: " + response.url);
        return cache.put(offlinePageRequest, response);
        });
    });
    });

// @license-end
