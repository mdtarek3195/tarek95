/* ==========================================
   Expense Manager Pro
   File: js/reports.js
   ========================================== */

const Reports = (() => {

    let incomeExpenseChart = null;
    let categoryChart = null;

    let filteredTransactions = [];

    // =========================
    // INIT
    // =========================

function init() {

    loadFilters();

const today =
    new Date();

const fromDate =

    `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2,"0")}-01`;

const toDate =

    `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2,"0")}-${String(
        today.getDate()
    ).padStart(2,"0")}`;

document.getElementById(
    "fromDate"
).value = fromDate;

document.getElementById(
    "toDate"
).value = toDate;


    generateReport();

    bindEvents();
	
	loadBudgetVsActualReport();


}

    // =========================
    // DEFAULT DATES
    // =========================

    function setDefaultDates() {

        const today =
            new Date()
            .toISOString()
            .split("T")[0];

        const firstDay =
            new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
            )
            .toISOString()
            .split("T")[0];

        document.getElementById(
            "fromDate"
        ).value = firstDay;

        document.getElementById(
            "toDate"
        ).value = today;
    }

    // =========================
    // GENERATE REPORT
    // =========================

    function generateReport() {

        filteredTransactions =
            getFilteredTransactions();

        updateKPIs();

        renderAccountSummary();

        renderMonthlySummary();

        renderIncomeExpenseChart();

        renderCategoryChart();
		
		loadBudgetVsActualReport();

    }

    // =========================
    // FILTER DATA
    // =========================

function getFilteredTransactions() {

    let transactions =
        Storage.getTransactions();

    const fromDate =
        document.getElementById(
            "fromDate"
        )?.value;

    const toDate =
        document.getElementById(
            "toDate"
        )?.value;

    const type =
        document.getElementById(
            "reportType"
        )?.value;

    const account =
        document.getElementById(
            "reportAccount"
        )?.value;

    const category =
        document.getElementById(
            "reportCategory"
        )?.value;

    return transactions.filter(t => {

        if (
            fromDate &&
            t.date < fromDate
        ) {
            return false;
        }

        if (
            toDate &&
            t.date > toDate
        ) {
            return false;
        }

        if (
            type &&
            t.type !== type
        ) {
            return false;
        }

        if (
            account &&
            t.account !== account
        ) {
            return false;
        }

        if (
            category &&
            t.category !== category
        ) {
            return false;
        }

        return true;
    });
}
	
	
	
function loadFilters() {

    const accountSelect =
        document.getElementById(
            "reportAccount"
        );

    const categorySelect =
        document.getElementById(
            "reportCategory"
        );

    if (accountSelect) {

        Storage.getAccounts()
        .forEach(account => {

            accountSelect.innerHTML += `

                <option
                    value="${account.name}">

                    ${account.name}

                </option>

            `;
        });
    }

    if (categorySelect) {

        Storage.getCategories()
        .forEach(category => {

            categorySelect.innerHTML += `

                <option
                    value="${category.name}">

                    ${category.name}

                </option>

            `;
        });
    }
}	

    // =========================
    // KPI CARDS
    // =========================

    function updateKPIs() {

        const income =
            filteredTransactions
            .filter(
                t => t.type === "income"
            )
            .reduce(
                (sum, t) =>
                    sum + t.amount,
                0
            );

        const expense =
            filteredTransactions
            .filter(
                t => t.type === "expense"
            )
            .reduce(
                (sum, t) =>
                    sum + t.amount,
                0
            );

        const savings =
            income - expense;

        const savingsRate =
            income > 0
                ? (
                    (savings / income) *
                    100
                  ).toFixed(1)
                : 0;

        document.getElementById(
            "reportIncome"
        ).textContent =
            App.formatCurrency(
                income
            );

        document.getElementById(
            "reportExpense"
        ).textContent =
            App.formatCurrency(
                expense
            );

        document.getElementById(
            "reportSavings"
        ).textContent =
            App.formatCurrency(
                savings
            );

        document.getElementById(
            "reportSavingsRate"
        ).textContent =
            savingsRate + "%";
    }


//Month Format
function formatStatementMonth(month) {

    const [year, mon] =
        month.split("-");

    const months = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",

        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

    ];

    return `${months[
        Number(mon) - 1
    ]}-${year}`;

}


	
	
function loadBudgetVsActualReport() {
		const fromDate =

    document.getElementById(
        "fromDate"
    )?.value || "";

const toDate =

    document.getElementById(
        "toDate"
    )?.value || "";

const selectedCategory =

    document.getElementById(
        "reportCategory"
    )?.value || "";

const selectedAccount =

    document.getElementById(
        "reportAccount"
    )?.value || "";
		

    const tbody =

        document.getElementById(
            "budgetVsActualBody"
        );

    if (!tbody)
        return;

    tbody.innerHTML = "";

    const budgets =
        Storage.getBudgets();
		
		const filteredBudgets =

    budgets.filter(budget => {

        if (

            selectedCategory &&

            budget.category !==
            selectedCategory

        ) {

            return false;

        }

        if (

            fromDate &&
            toDate

        ) {

            const budgetMonth =

                budget.month;

            const fromMonth =

                fromDate.slice(0,7);

            const toMonth =

                toDate.slice(0,7);

            if (

                budgetMonth < fromMonth ||

                budgetMonth > toMonth

            ) {

                return false;

            }

        }

        return true;

    });

 filteredBudgets.forEach(budget => {

        const actual =

            Storage
            .getTransactions()

           .filter(t => {

    if (
        t.type !== "expense"
    ) {
        return false;
    }

    if (
        t.category !==
        budget.category
    ) {
        return false;
    }

    if (
        t.date.slice(0,7)
        !==
        budget.month
    ) {
        return false;
    }

    if (

        selectedAccount &&

        t.account !==
        selectedAccount

    ) {

        return false;

    }

    return true;

})

            .reduce(

                (sum,t) =>

                sum + t.amount,

                0

            );

        const variance =

            budget.amount -
            actual;

        const status =

            variance >= 0

            ?

            "🟢 Within Budget"

            :

            "🔴 Over Budget";

        tbody.innerHTML += `

            <tr>

                <td>
                    ${formatStatementMonth(budget.month)}
                </td>

                <td>
                    ${budget.category}
                </td>

                <td>
                    ${App.formatCurrency(
                        budget.amount
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        actual
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        variance
                    )}
                </td>

                <td>
                    ${status}
                </td>

            </tr>

        `;

    });

}





    // =========================
    // ACCOUNT SUMMARY
    // =========================

function renderAccountSummary() {

    const tbody =
        document.getElementById(
            "accountSummaryBody"
        );

    const accountMap = {};

    filteredTransactions.forEach(t => {

        if (!accountMap[t.account]) {

            accountMap[t.account] = 0;

        }

        if (t.type === "income") {

            accountMap[t.account] +=
                t.amount;

        } else {

            accountMap[t.account] -=
                t.amount;

        }

    });

    tbody.innerHTML = "";

    Object.keys(accountMap)
    .forEach(account => {

        tbody.innerHTML += `

            <tr>

                <td>
                    ${account}
                </td>

                <td>
                    ${App.formatCurrency(
                        accountMap[account]
                    )}
                </td>

            </tr>

        `;

    });

    if (
        Object.keys(accountMap)
        .length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="2">
                    No Data
                </td>

            </tr>

        `;
    }
}

    // =========================
    // MONTHLY SUMMARY
    // =========================

    function renderMonthlySummary() {

        const tbody =
            document.getElementById(
                "monthlySummaryBody"
            );

		 const months = {};

		filteredTransactions
		.forEach(t => {

            const month =
                new Date(t.date)
                .toLocaleString(
                    "en-US",
                    {
                        month: "short",
                        year: "numeric"
                    }
                );

            if (!months[month]) {

                months[month] = {
                    income: 0,
                    expense: 0
                };
            }

            if (
                t.type === "income"
            ) {

                months[month]
                .income += t.amount;

            } else {

                months[month]
                .expense += t.amount;
            }

        });

        tbody.innerHTML = "";

        Object.keys(months)
        .forEach(month => {

            const income =
                months[month].income;

            const expense =
                months[month].expense;

            const savings =
                income - expense;

            tbody.innerHTML += `
                <tr>

                    <td>${month}</td>

                    <td>
                        ${App.formatCurrency(
                            income
                        )}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            expense
                        )}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            savings
                        )}
                    </td>

                </tr>
            `;
        });
    }

    // =========================
    // BAR CHART
    // =========================

    function renderIncomeExpenseChart() {

        const ctx =
            document.getElementById(
                "reportIncomeExpenseChart"
            );

        if (!ctx) return;

        const income =
            filteredTransactions
            .filter(
                t => t.type === "income"
            )
            .reduce(
                (s,t) =>
                    s + t.amount,
                0
            );

        const expense =
            filteredTransactions
            .filter(
                t => t.type === "expense"
            )
            .reduce(
                (s,t) =>
                    s + t.amount,
                0
            );

        if (
            incomeExpenseChart &&
            typeof incomeExpenseChart.destroy === "function"
        ) {
            incomeExpenseChart.destroy();
        }

        incomeExpenseChart =
            new Chart(ctx, {

                type: "bar",

                data: {

                    labels: [
                        "Income",
                        "Expense"
                    ],

                    datasets: [{
                        data: [
                            income,
                            expense
                        ]
                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            });
    }

    // =========================
    // PIE CHART
    // =========================

    function renderCategoryChart() {

        const expenses =
            filteredTransactions
            .filter(
                t => t.type === "expense"
            );

        const categoryMap = {};

        expenses.forEach(t => {

            categoryMap[
                t.category
            ] =
            (
                categoryMap[
                    t.category
                ] || 0
            ) + t.amount;
        });

        const labels =
            Object.keys(
                categoryMap
            );

        const values =
            Object.values(
                categoryMap
            );

        const ctx =
            document.getElementById(
                "reportCategoryChart"
            );

        if (!ctx) return;

        if (
            categoryChart &&
            typeof categoryChart.destroy === "function"
        ) {
            categoryChart.destroy();
        }

        categoryChart =
            new Chart(ctx, {

                type: "pie",

                data: {

                    labels,

                    datasets: [{
                        data: values
                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            });
    }

    // =========================
    // EVENTS
    // =========================

function bindEvents() {

    document
    .getElementById(
        "generateReportBtn"
    )
    ?.addEventListener(
        "click",
        generateReport
    );

    document
    .getElementById(
        "exportCsvBtn"
    )
    ?.addEventListener(
        "click",
        exportCSV
    );

    document
    .getElementById(
        "printReportBtn"
    )
    ?.addEventListener(
        "click",
        printReport
    );
}

    // =========================
    // PUBLIC API
    // =========================

    return {
        init,
        generateReport
    };



function exportCSV() {
 alert("Export button clicked");
    if (
        filteredTransactions.length === 0
    ) {

        alert(
            "No data available."
        );

        return;
    }

    let csv =

        "Date,Type,Category,Account,Amount,Note\n";

    filteredTransactions
    .forEach(t => {

        csv +=

            `"${t.date}",` +

            `"${t.type}",` +

            `"${t.category}",` +

            `"${t.account}",` +

            `"${t.amount}",` +

            `"${t.note || ""}"\n`;

    });

    const blob =

        new Blob(

            [csv],

            {
                type:
                "text/csv"
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

        "expense-report.csv";

    a.click();

    URL.revokeObjectURL(
        url
    );

    App.showToast(
        "CSV Exported"
    );
}





})();


// =============================
// AUTO LOAD
// =============================

document.addEventListener(
    "DOMContentLoaded",
    Reports.init
);


function printReport() {

    window.print();

}