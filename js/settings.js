const Settings = (() => {

    // =========================
    // INIT
    // =========================

    function init() {
		
		loadDashboardWidgets();
		
        loadSettings();

        loadStatistics();

        bindEvents();


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


    const infoAccounts =
        document.getElementById(
            "infoAccounts"
        );

    const infoTransactions =
        document.getElementById(
            "infoTransactions"
        );

    const infoGoals =
        document.getElementById(
            "infoGoals"
        );


    if (infoAccounts) {

        infoAccounts.textContent =
            accounts.length;

    }


    if (infoTransactions) {

        infoTransactions.textContent =
            transactions.length;

    }


    if (infoGoals) {

        infoGoals.textContent =
            goals.length;

    }

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




function saveDashboardWidgets() {

    const settings = {

        todayExpense:

            document.getElementById(
                "todayExpenseWidget"
            ).checked,

        currentBalance:

            document.getElementById(
                "currentBalanceWidget"
            ).checked,

        creditCardDue:

            document.getElementById(
                "creditCardDueWidget"
            ).checked,

        creditAvailable:

            document.getElementById(
                "creditAvailableWidget"
            ).checked,

        monthlyIncome:

            document.getElementById(
                "monthlyIncomeWidget"
            ).checked,

        monthlyExpense:

            document.getElementById(
                "monthlyExpenseWidget"
            ).checked,

        netWorth:

            document.getElementById(
                "netWorthWidget"
            ).checked,

        outstandingLoan:

            document.getElementById(
                "outstandingLoanWidget"
            ).checked,

        monthlySavings:

            document.getElementById(
                "monthlySavingsWidget"
            ).checked,

        savingsRate:

            document.getElementById(
                "savingsRateWidget"
            ).checked

    };

    localStorage.setItem(

        "dashboardWidgets",

        JSON.stringify(
            settings
        )

    );

    App.showToast(
        "Widget Settings Saved"
    );

}


function loadDashboardWidgets() {

    const settings =
        JSON.parse(
            localStorage.getItem(
                "dashboardWidgets"
            )
        ) || {};


    document.getElementById(
        "todayExpenseWidget"
    ).checked =
        settings.todayExpense ?? true;


    document.getElementById(
        "currentBalanceWidget"
    ).checked =
        settings.currentBalance ?? true;


    document.getElementById(
        "creditCardDueWidget"
    ).checked =
        settings.creditCardDue ?? true;


    document.getElementById(
        "creditAvailableWidget"
    ).checked =
        settings.creditAvailable ?? true;


    document.getElementById(
        "monthlyIncomeWidget"
    ).checked =
        settings.monthlyIncome ?? true;


    document.getElementById(
        "monthlyExpenseWidget"
    ).checked =
        settings.monthlyExpense ?? true;


    document.getElementById(
        "netWorthWidget"
    ).checked =
        settings.netWorth ?? true;


    document.getElementById(
        "outstandingLoanWidget"
    ).checked =
        settings.outstandingLoan ?? true;


    document.getElementById(
        "monthlySavingsWidget"
    ).checked =
        settings.monthlySavings ?? true;


    document.getElementById(
        "savingsRateWidget"
    ).checked =
        settings.savingsRate ?? true;


    document.getElementById(
        "goalProgressWidget"
    ).checked =
        settings.goalProgress ?? true;


    document.getElementById(
        "goalForecastWidget"
    ).checked =
        settings.goalForecast ?? true;


    document.getElementById(
        "forecastSavingsWidget"
    ).checked =
        settings.forecastSavings ?? true;


    document.getElementById(
        "healthScoreWidget"
    ).checked =
        settings.healthScore ?? true;


    document.getElementById(
        "cashFlowWidget"
    ).checked =
        settings.cashFlow ?? true;
		
    document.getElementById(
        "spendingInsightsWidget"
    ).checked =
        settings.spendingInsights ?? true;
		
    document.getElementById(
        "smartInsightsWidget"
    ).checked =
        settings.smartInsights ?? true;

    document.getElementById(
        "budgetAlertsWidget"
    ).checked =
        settings.budgetAlerts ?? true;

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




function saveDashboardWidgets() {

    const settings = {

        todayExpense:
            document.getElementById(
                "todayExpenseWidget"
            ).checked,


        currentBalance:
            document.getElementById(
                "currentBalanceWidget"
            ).checked,


        creditCardDue:
            document.getElementById(
                "creditCardDueWidget"
            ).checked,


        creditAvailable:
            document.getElementById(
                "creditAvailableWidget"
            ).checked,


        monthlyIncome:
            document.getElementById(
                "monthlyIncomeWidget"
            ).checked,


        monthlyExpense:
            document.getElementById(
                "monthlyExpenseWidget"
            ).checked,


        netWorth:
            document.getElementById(
                "netWorthWidget"
            ).checked,


        outstandingLoan:
            document.getElementById(
                "outstandingLoanWidget"
            ).checked,


        monthlySavings:
            document.getElementById(
                "monthlySavingsWidget"
            ).checked,


        savingsRate:
            document.getElementById(
                "savingsRateWidget"
            ).checked,


        goalProgress:
            document.getElementById(
                "goalProgressWidget"
            ).checked,


        goalForecast:
            document.getElementById(
                "goalForecastWidget"
            ).checked,


        forecastSavings:
            document.getElementById(
                "forecastSavingsWidget"
            ).checked,


        healthScore:
            document.getElementById(
                "healthScoreWidget"
            ).checked,


        cashFlow:
            document.getElementById(
                "cashFlowWidget"
            ).checked,


        spendingInsights:
            document.getElementById(
                "spendingInsightsWidget"
            ).checked,


        smartInsights:
            document.getElementById(
                "smartInsightsWidget"
            ).checked,


        budgetAlerts:
            document.getElementById(
                "budgetAlertsWidget"
            ).checked

    };


    localStorage.setItem(
        "dashboardWidgets",
        JSON.stringify(settings)
    );


    alert(
        "Dashboard Widgets Saved Successfully"
    );

}

function selectAllDashboardWidgets() {

    const widgets = [
        "todayExpenseWidget",
        "currentBalanceWidget",
        "creditCardDueWidget",
        "creditAvailableWidget",
        "monthlyIncomeWidget",
        "monthlyExpenseWidget",
        "netWorthWidget",
        "outstandingLoanWidget",
        "monthlySavingsWidget",
        "savingsRateWidget",
        "goalProgressWidget",
        "goalForecastWidget",
        "forecastSavingsWidget",
        "healthScoreWidget",
        "cashFlowWidget",
        "spendingInsightsWidget",
        "smartInsightsWidget",
        "budgetAlertsWidget"
    ];


    widgets.forEach(id => {

        const checkbox =
            document.getElementById(id);

        if (checkbox) {

            checkbox.checked = true;

        }

    });

}

function hideAllDashboardWidgets() {

    const widgets = [
        "todayExpenseWidget",
        "currentBalanceWidget",
        "creditCardDueWidget",
        "creditAvailableWidget",
        "monthlyIncomeWidget",
        "monthlyExpenseWidget",
        "netWorthWidget",
        "outstandingLoanWidget",
        "monthlySavingsWidget",
        "savingsRateWidget",
        "goalProgressWidget",
        "goalForecastWidget",
        "forecastSavingsWidget",
        "healthScoreWidget",
        "cashFlowWidget",
        "spendingInsightsWidget",
        "smartInsightsWidget",
        "budgetAlertsWidget"
    ];


    widgets.forEach(id => {

        const checkbox =
            document.getElementById(id);

        if (checkbox) {

            checkbox.checked = false;

        }

    });

}

function resetDashboardWidgets() {

    const widgets = [
        "todayExpenseWidget",
        "currentBalanceWidget",
        "creditCardDueWidget",
        "creditAvailableWidget",
        "monthlyIncomeWidget",
        "monthlyExpenseWidget",
        "netWorthWidget",
        "outstandingLoanWidget",
        "monthlySavingsWidget",
        "savingsRateWidget",
        "goalProgressWidget",
        "goalForecastWidget",
        "forecastSavingsWidget",
        "healthScoreWidget",
        "cashFlowWidget",
        "spendingInsightsWidget",
        "smartInsightsWidget",
        "budgetAlertsWidget"
    ];


    widgets.forEach(id => {

        const checkbox =
            document.getElementById(id);

        if (checkbox) {

            checkbox.checked = true;

        }

    });

}




document.addEventListener(

    "DOMContentLoaded",

    Settings.init

);