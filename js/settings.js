const Settings = (() => {

    // =========================
    // INIT
    // =========================

    function init() {

        loadSettings();

        loadStatistics();

        bindEvents();

        console.log(
            "Settings Module Loaded"
        );
    }

    // =========================
    // LOAD SETTINGS
    // =========================

    function loadSettings() {

        const settings =
            Storage.getSettings
            ? Storage.getSettings()
            : {};

        // Theme

        document.getElementById(
            "themeSelect"
        ).value =
            settings.theme ||
            "light";

        // Currency

        document.getElementById(
            "currencySelect"
        ).value =
            settings.currency ||
            "৳";
    }

    // =========================
    // SAVE SETTINGS
    // =========================

    function saveSettings() {

        const settings = {

            theme:
                document.getElementById(
                    "themeSelect"
                ).value,

            currency:
                document.getElementById(
                    "currencySelect"
                ).value

        };

        Storage.saveSettings(
            settings
        );

        applyTheme(
            settings.theme
        );

        App.showToast(
            "Settings Saved"
        );
    }

    // =========================
    // THEME
    // =========================

    function applyTheme(theme) {

        if (
            theme === "dark"
        ) {

            document.body.classList.add(
                "dark-mode"
            );

        } else {

            document.body.classList.remove(
                "dark-mode"
            );
        }
    }

    // =========================
    // STATISTICS
    // =========================

    function loadStatistics() {

        const accounts =
            Storage.getAccounts() || [];

        const transactions =
            Storage.getTransactions() || [];

        const goals =
            Storage.getGoals
            ? Storage.getGoals()
            : [];

        document.getElementById(
            "infoAccounts"
        ).textContent =
            accounts.length;

        document.getElementById(
            "infoTransactions"
        ).textContent =
            transactions.length;

        document.getElementById(
            "infoGoals"
        ).textContent =
            goals.length;
    }

    // =========================
    // EXPORT BACKUP
    // =========================

    function exportBackup() {

        const backupData = {

            accounts:
                Storage.getAccounts(),

            transactions:
                Storage.getTransactions(),

            categories:
                Storage.getCategories(),

            budgets:
                Storage.getBudgets
                ? Storage.getBudgets()
                : [],
			
			transfers:
                Storage.getTransfers
              ? Storage.getTransfers()
              : [],
			
			loans: Storage.getLoans
				? Storage.getLoans()
				: [],

            goals:
                Storage.getGoals
                ? Storage.getGoals()
                : [],

            settings:
                Storage.getSettings
                ? Storage.getSettings()
                : {}

        };

        const blob =
            new Blob(

                [
                    JSON.stringify(
                        backupData,
                        null,
                        2
                    )
                ],

                {
                    type:
                        "application/json"
                }

            );

        const url =
            URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        a.href = url;

        a.download =
            "expense-manager-backup.json";

        a.click();

        URL.revokeObjectURL(
            url
        );

        App.showToast(
            "Backup Downloaded"
        );
    }

    // =========================
    // IMPORT BACKUP
    // =========================

    function importBackup(
        event
    ) {

        const file =
            event.target.files[0];

        if (!file)
            return;

        const reader =
            new FileReader();

        reader.onload =
            function(e) {

                try {

                    const data =
                        JSON.parse(
                            e.target.result
                        );

                    if (
                        data.accounts
                    ) {

                        localStorage.setItem(

                            "em_accounts",

                            JSON.stringify(
                                data.accounts
                            )

                        );
                    }

                    if (
                        data.transactions
                    ) {

                        localStorage.setItem(

                            "em_transactions",

                            JSON.stringify(
                                data.transactions
                            )

                        );
                    }

                    if (
                        data.categories
                    ) {

                        localStorage.setItem(

                            "em_categories",

                            JSON.stringify(
                                data.categories
                            )

                        );
                    }

                    if (
                        data.budgets
                    ) {

                        localStorage.setItem(

                            "em_budgets",

                            JSON.stringify(
                                data.budgets
                            )

                        );
                    }

                    if (
                        data.transfers
                    ) {

                        localStorage.setItem(

                            "em_transfers",

                            JSON.stringify(
                                data.transfers
                            )

                        );
                    }

                    if (
                        data.loans
                    ) {

                        localStorage.setItem(

                            "em_loans",

                            JSON.stringify(
                                data.loans
                            )

                        );
                    }

                    if (
                        data.goals
                    ) {

                        localStorage.setItem(

                            "em_goals",

                            JSON.stringify(
                                data.goals
                            )

                        );
                    }

                    if (
                        data.settings
                    ) {

                        localStorage.setItem(

                            "em_settings",

                            JSON.stringify(
                                data.settings
                            )

                        );
                    }

                    App.showToast(
                        "Backup Restored"
                    );

                    setTimeout(
                        () =>
                            location.reload(),
                        1000
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Invalid Backup File"
                    );
                }
            };

        reader.readAsText(
            file
        );
    }

    // =========================
    // RESET DATA
    // =========================

    function resetData() {

        const confirmReset =
            confirm(

                "Are you sure?\n\nAll data will be deleted."

            );

        if (
            !confirmReset
        )
            return;

        localStorage.clear();

        App.showToast(
            "All Data Deleted"
        );

        setTimeout(
            () =>
                location.reload(),
            1000
        );
    }

    // =========================
    // EVENTS
    // =========================

    function bindEvents() {

        document
        .getElementById(
            "themeSelect"
        )
        ?.addEventListener(
            "change",
            saveSettings
        );

        document
        .getElementById(
            "currencySelect"
        )
        ?.addEventListener(
            "change",
            saveSettings
        );

        document
        .getElementById(
            "exportBackupBtn"
        )
        ?.addEventListener(
            "click",
            exportBackup
        );

        document
        .getElementById(
            "importBackupFile"
        )
        ?.addEventListener(
            "change",
            importBackup
        );

        document
        .getElementById(
            "resetDataBtn"
        )
        ?.addEventListener(
            "click",
            resetData
        );
    }

    // =========================
    // PUBLIC
    // =========================

    return {

        init

    };

})();

document.addEventListener(

    "DOMContentLoaded",

    Settings.init

);