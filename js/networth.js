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
		
		renderLiabilityTable();

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
			accounts
			.filter(
				acc => acc.type !== "creditcard"
			)
			.reduce(
				(sum, acc) =>
					sum + Number(acc.balance || 0),
				0
			);
			
		const cardOutstanding =
			Storage.getCardStatements()
			.filter(
				s => s.status !== "Paid"
			)
			.reduce(
				(sum, s) =>
					sum + Number(
						s.remaining || 0
					),
				0
			);

		const emiOutstanding =
			Storage.getEmiPurchases()
			.filter(
				e => e.status !== "completed"
			)
			.reduce(
				(sum, e) =>
					sum + Number(
						e.remainingAmount || 0
					),
				0
			);

		const loanOutstanding =
			Storage.getLoans
			? Storage.getLoans()
			  .reduce(
				(sum, l) =>
					sum + Number(
						l.remainingAmount || 0
					),
				0
			  )
			: 0;

		const totalLiabilities =
			cardOutstanding +
			emiOutstanding +
			loanOutstanding;

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
			goalSavings -
			totalLiabilities;

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
    Storage.getAccounts()
    .filter(
        acc => acc.type !== "creditcard"
    );

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
	
	
function renderLiabilityTable(){

    const cardOutstanding =
        Storage.getCardStatements()
        .filter(
            s => s.status !== "Paid"
        )
        .reduce(
            (sum, s) =>
                sum + Number(
                    s.remaining || 0
                ),
            0
        );

    const emiOutstanding =
        Storage.getEmiPurchases()
        .filter(
            e => e.status !== "completed"
        )
        .reduce(
            (sum, e) =>
                sum + Number(
                    e.remainingAmount || 0
                ),
            0
        );

    const loanOutstanding =
        Storage.getLoans
        ? Storage.getLoans().reduce(
            (sum, l) =>
                sum + Number(
                    l.remainingAmount || 0
                ),
            0
        )
        : 0;

    const tbody =
        document.getElementById(
            "liabilityTableBody"
        );

    if(!tbody) return;

    tbody.innerHTML = `

        <tr>
            <td>Credit Card Outstanding</td>
            <td>${App.formatCurrency(cardOutstanding)}</td>
        </tr>

        <tr>
            <td>EMI Outstanding</td>
            <td>${App.formatCurrency(emiOutstanding)}</td>
        </tr>

        <tr>
            <td>Loan Outstanding</td>
            <td>${App.formatCurrency(loanOutstanding)}</td>
        </tr>

    `;
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
		
		renderLiabilityTable();

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