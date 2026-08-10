/* ==========================================
   Expense Manager Pro
   File: js/networth.js
   ========================================== */

const NetWorth = (() => {

    let netWorthChart = null;

    // =========================
    // INIT
    // =========================

    function init() {

        loadKPIs();

        renderAssetTable();

        renderGoalSummary();

        renderNetWorthChart();

        console.log(
            "Net Worth Module Loaded"
        );
    }

    // =========================
    // KPI CARDS
    // =========================

    function loadKPIs() {

        const accounts =
            Storage.getAccounts();

        const goals =
            Storage.getGoals();

        const totalAssets =
            accounts.reduce(
                (sum, acc) =>
                    sum +
                    Number(
                        acc.balance || 0
                    ),
                0
            );

        const goalSavings =
            goals.reduce(
                (sum, goal) =>
                    sum +
                    Number(
                        goal.saved || 0
                    ),
                0
            );

        const netWorth =
            totalAssets +
            goalSavings;

        document.getElementById(
            "totalAssets"
        ).textContent =
            App.formatCurrency(
                totalAssets
            );

        document.getElementById(
            "goalSavings"
        ).textContent =
            App.formatCurrency(
                goalSavings
            );

        document.getElementById(
            "netWorthValue"
        ).textContent =
            App.formatCurrency(
                netWorth
            );
    }

    // =========================
    // ASSET TABLE
    // =========================

    function renderAssetTable() {

        const tbody =
            document.getElementById(
                "assetTableBody"
            );

        if (!tbody)
            return;

        const accounts =
            Storage.getAccounts();

        if (
            accounts.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="2"
                        class="text-center">

                        No Accounts Found

                    </td>

                </tr>

            `;

            return;
        }

        tbody.innerHTML = "";

        accounts.forEach(account => {

            tbody.innerHTML += `

                <tr>

                    <td>

                        ${account.name}

                    </td>

                    <td>

                        ${App.formatCurrency(
                            account.balance || 0
                        )}

                    </td>

                </tr>

            `;

        });

    }

    // =========================
    // GOAL SUMMARY
    // =========================

    function renderGoalSummary() {

        const tbody =
            document.getElementById(
                "goalSummaryBody"
            );

        if (!tbody)
            return;

        const goals =
            Storage.getGoals();

        if (
            goals.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="4"
                        class="text-center">

                        No Goals Found

                    </td>

                </tr>

            `;

            return;
        }

        tbody.innerHTML = "";

        goals.forEach(goal => {

            const saved =
                Number(
                    goal.saved || 0
                );

			const target =
				Number(
					goal.target || 0
				);

            const progress =
                target > 0
                ? (
                    saved /
                    target *
                    100
                  ).toFixed(1)
                : 0;

            tbody.innerHTML += `

                <tr>

                    <td>

                        ${goal.name}

                    </td>

                    <td>

                        ${App.formatCurrency(
                            target
                        )}

                    </td>

                    <td>

                        ${App.formatCurrency(
                            saved
                        )}

                    </td>

                    <td>

                        ${progress}%

                    </td>

                </tr>

            `;

        });

    }

    // =========================
    // NET WORTH TREND
    // =========================

    function renderNetWorthChart() {

        const accounts =
            Storage.getAccounts();

        const goals =
            Storage.getGoals();

        const totalAssets =
            accounts.reduce(
                (sum, acc) =>
                    sum +
                    Number(
                        acc.balance || 0
                    ),
                0
            );

        const goalSavings =
            goals.reduce(
                (sum, goal) =>
                    sum +
                    Number(
                        goal.saved || 0
                    ),
                0
            );

        const netWorth =
            totalAssets +
            goalSavings;

        const ctx =
            document.getElementById(
                "netWorthChart"
            );

        if (!ctx)
            return;

        if (
            netWorthChart &&
            typeof netWorthChart.destroy ===
            "function"
        ) {

            netWorthChart.destroy();
        }

        netWorthChart =
            new Chart(ctx, {

                type: "line",

                data: {

                    labels: [

                        "Current"

                    ],

                    datasets: [

                        {

                            label:
                                "Net Worth",

                            data: [

                                netWorth

                            ],

                            tension:
                                0.3

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false

                }

            });

    }

    // =========================
    // REFRESH
    // =========================

    function refresh() {

        loadKPIs();

        renderAssetTable();

        renderGoalSummary();

        renderNetWorthChart();

    }

    // =========================
    // PUBLIC API
    // =========================

    return {

        init,

        refresh

    };

})();


// =========================
// AUTO LOAD
// =========================

document.addEventListener(

    "DOMContentLoaded",

    NetWorth.init

);