/* ==========================================
   Expense Manager Pro
   File: js/app.js
   ========================================== */

const App = (() => {

    const APP_NAME = "Expense Manager Pro";
    const VERSION = "1.0.0";

    // =========================
    // INIT
    // =========================

    function init() {
        console.log(`${APP_NAME} v${VERSION}`);

        initializeStorage();
        loadTheme();

        console.log("Application Ready");
    }

    // =========================
    // STORAGE INIT
    // =========================

    function initializeStorage() {

        if (typeof Storage === "undefined") {
            console.error("Storage.js not loaded");
            return;
        }

        Storage.initialize();
    }

    // =========================
    // THEME
    // =========================

    function loadTheme() {

        const settings = Storage.getSettings();

        const theme = settings.theme || "light";

        document.documentElement.setAttribute(
            "data-theme",
            theme
        );
    }

    function setTheme(theme) {

        document.documentElement.setAttribute(
            "data-theme",
            theme
        );

        const settings = Storage.getSettings();

        settings.theme = theme;

        Storage.saveSettings(settings);
    }

    // =========================
    // FORMATTERS
    // =========================

 function formatCurrency(amount) {

    return new Intl.NumberFormat(

        "en-BD",

        {

            style: "currency",

            currency: "BDT",

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }

    ).format(

        Number(amount || 0)

    );

}

    function formatDate(dateString) {

        const date = new Date(dateString);

        return date.toLocaleDateString("en-GB");

    }

    // =========================
    // TOAST
    // =========================

    function showToast(message, type = "success") {

        const toast = document.createElement("div");

        toast.className = `toast toast-${type}`;

        toast.innerText = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("show");
        }, 50);

        setTimeout(() => {

            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 300);

        }, 2500);
    }

    // =========================
    // CONFIRM
    // =========================

    function confirmAction(message) {
        return confirm(message);
    }

    // =========================
    // UUID
    // =========================

    function generateId() {

        return Date.now() +
               Math.floor(Math.random() * 1000);

    }

    // =========================
    // PUBLIC API
    // =========================

    return {

        init,

        setTheme,

        formatCurrency,

        formatDate,

        showToast,

        confirmAction,

        generateId

    };

})();


// ==================================
// AUTO START
// ==================================

document.addEventListener(
    "DOMContentLoaded",
    App.init
);