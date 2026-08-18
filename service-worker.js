const CACHE_NAME = "expense-manager-Tarek-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",

    // CSS
    "./css/main.css",
    "./css/layout.css",
    "./css/responsive.css",
    "./css/pages.css",

    // JavaScript
    "./js/storage.js",
    "./js/app.js",
    "./js/dashboard.js",
    "./js/accounts.js",
    "./js/backup.js",
    "./js/budget.js",
    "./js/categories.js",
    "./js/charts.js",
    "./js/creditcard.js",
    "./js/credit-report.js",
    "./js/emi-history.js",
    "./js/goals.js",
    "./js/loan.js",
    "./js/network.js",
    "./js/payment-history.js",
    "./js/recurring.js",
    "./js/reports.js",
    "./js/settings.js",
    "./js/statement.js",
    "./js/statement-history.js",
    "./js/transactions.js",
    "./js/transfer.js",

    // HTML Pages
    "./accounts.html",
    "./backup.html",
    "./budget.html",
    "./categories.html",
    "./charts.html",
    "./creditcard.html",
    "./credit-report.html",
    "./emi-history.html",
    "./goals.html",
    "./loan.html",
    "./network.html",
    "./payment-history.html",
    "./recurring.html",
    "./reports.html",
    "./settings.html",
    "./statement.html",
    "./statement-history.html",
    "./transactions.html",
    "./transfer.html"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", event => {

    console.log("Expense Manager SW installing...");

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })
    );

    self.skipWaiting();

});


// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener("activate", event => {

    console.log("Expense Manager SW activated");

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))

            );

        })

    );

    self.clients.claim();

});


// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", event => {

    // ======================================
    // PAGE / NAVIGATION REQUEST
    // ======================================

    if (event.request.mode === "navigate") {

        event.respondWith(

            fetch(event.request)

                .catch(() => {

                    // First try requested page from cache
                    return caches.match(event.request)

                        .then(cachedPage => {

                            if (cachedPage) {
                                return cachedPage;
                            }

                            // Otherwise show cached index.html
                            return caches.match("./index.html");

                        });

                })

        );

        return;
    }


    // ======================================
    // CSS / JS / IMAGE / OTHER FILES
    // ======================================

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);

            })

            .catch(() => {

                return caches.match("./index.html");

            })

    );

});