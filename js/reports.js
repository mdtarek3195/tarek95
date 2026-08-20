/* ==========================================
   Expense Manager Pro
   File: js/reports.js
   ========================================== */

const Reports = (() => {

    let incomeExpenseChart = null;
    let categoryChart = null;

    let filteredTransactions = [];


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        loadFilters();

        setDefaultDates();

        bindEvents();

        generateReport();

    }


    /* =====================================================
       DEFAULT DATES
    ===================================================== */

    function setDefaultDates() {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");


        const firstDay =
            `${year}-${month}-01`;

        const todayString =
            `${year}-${month}-${day}`;


        const fromInput =
            document.getElementById(
                "fromDate"
            );

        const toInput =
            document.getElementById(
                "toDate"
            );


        if (fromInput) {

            fromInput.value =
                firstDay;

        }


        if (toInput) {

            toInput.value =
                todayString;

        }

    }


    /* =====================================================
       GENERATE REPORT
    ===================================================== */

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


    /* =====================================================
       GET FILTERED TRANSACTIONS
    ===================================================== */

    function getFilteredTransactions() {

        const transactions =
            Storage.getTransactions();


        const fromDate =
            document.getElementById(
                "fromDate"
            )?.value || "";


        const toDate =
            document.getElementById(
                "toDate"
            )?.value || "";


        const type =
            document.getElementById(
                "reportType"
            )?.value || "";


        const account =
            document.getElementById(
                "reportAccount"
            )?.value || "";


        const category =
            document.getElementById(
                "reportCategory"
            )?.value || "";


        return transactions.filter(
            transaction => {

                /* -----------------------------------------
                   DATE
                ----------------------------------------- */

                if (
                    fromDate &&
                    transaction.date < fromDate
                ) {
                    return false;
                }


                if (
                    toDate &&
                    transaction.date > toDate
                ) {
                    return false;
                }


                /* -----------------------------------------
                   TYPE
                ----------------------------------------- */

                if (type) {

                    /*
                     * Credit Card Payment is a cash
                     * outflow, therefore treat it as
                     * expense for the Type filter.
                     */

                    const transactionType =
                        transaction.type ===
                        "credit_card_payment"
                            ? "expense"
                            : transaction.type;


                    if (
                        transactionType !== type
                    ) {
                        return false;
                    }

                }


                /* -----------------------------------------
                   ACCOUNT
                ----------------------------------------- */

                if (
                    account &&
                    transaction.account !== account
                ) {
                    return false;
                }


                /* -----------------------------------------
                   CATEGORY
                ----------------------------------------- */

                if (
                    category &&
                    transaction.category !== category
                ) {
                    return false;
                }


                return true;

            }
        );

    }


    /* =====================================================
       LOAD FILTERS
    ===================================================== */

    function loadFilters() {

        const accountSelect =
            document.getElementById(
                "reportAccount"
            );


        const categorySelect =
            document.getElementById(
                "reportCategory"
            );


        /* ---------------------------------------------
           ACCOUNTS
        --------------------------------------------- */

        if (accountSelect) {

            accountSelect.innerHTML = `
                <option value="">
                    All Accounts
                </option>
            `;

Storage.getAccounts()
    .filter(account =>
        account.type === "bank" ||
        account.type === "cash"
    )
    .forEach(account => {

        accountSelect.innerHTML += `
            <option value="${account.name}">
                ${account.name}
            </option>
        `;

    });

        }


        /* ---------------------------------------------
           CATEGORIES
        --------------------------------------------- */

        if (categorySelect) {

            categorySelect.innerHTML = `
                <option value="">
                    All Categories
                </option>
            `;


            Storage.getCategories()
                .forEach(category => {

                    const categoryName =
                        typeof category === "string"
                            ? category
                            : category.name;


                    if (!categoryName) {
                        return;
                    }


                    categorySelect.innerHTML += `
                        <option
                            value="${categoryName}">
                            ${categoryName}
                        </option>
                    `;

                });

        }

    }


    /* =====================================================
       REPORT EXPENSE CHECK
    ===================================================== */

    function isReportExpense(transaction) {

        /*
         * Normal Expense
         */

        if (
            transaction.type === "expense"
        ) {
            return true;
        }


        /*
         * Credit Card Purchase is already
         * stored as expense.
         */

        if (
            transaction.type ===
            "credit_card_purchase"
        ) {
            return true;
        }


        return false;

    }


    /* =====================================================
       REPORT INCOME CHECK
    ===================================================== */

    function isReportIncome(transaction) {

        return (
            transaction.type ===
            "income"
        );

    }


    /* =====================================================
       CREDIT CARD PAYMENT CHECK
    ===================================================== */

    function isCreditCardPayment(transaction) {

        return (
            transaction.type ===
            "credit_card_payment"
        );

    }


    /* =====================================================
       CREDIT CARD EMI CHECK
    ===================================================== */

    function isCreditCardEMI(transaction) {

        return (
            transaction.isCreditCardEMI === true ||
            transaction.category ===
                "Credit Card EMI" ||
            (
                typeof transaction.note === "string" &&
                transaction.note.includes(
                    "CC EMI Payment"
                )
            )
        );

    }


    /* =====================================================
       KPI CARDS
    ===================================================== */

    function updateKPIs() {

        let totalIncome = 0;

        let totalExpense = 0;


        filteredTransactions.forEach(
            transaction => {

                const amount =
                    Number(
                        transaction.amount || 0
                    );


                /*
                 * Income
                 */

                if (
                    isReportIncome(
                        transaction
                    )
                ) {

                    totalIncome +=
                        amount;

                }


                /*
                 * Expense
                 *
                 * Includes:
                 * Normal Expense
                 * Credit Card Purchase
                 * Credit Card EMI
                 *
                 * Excludes:
                 * Credit Card Payment
                 */

                else if (
                    isReportExpense(
                        transaction
                    )
                ) {

                    /*
                     * Credit Card Payment should
                     * NEVER become report expense.
                     */

                    if (
                        isCreditCardPayment(
                            transaction
                        )
                    ) {
                        return;
                    }


                    totalExpense +=
                        amount;

                }

            }
        );


        const savings =
            totalIncome -
            totalExpense;


        const savingsRate =
            totalIncome > 0
                ? (
                    (
                        savings /
                        totalIncome
                    ) * 100
                  ).toFixed(1)
                : 0;


        document.getElementById(
            "reportIncome"
        ).textContent =
            App.formatCurrency(
                totalIncome
            );


        document.getElementById(
            "reportExpense"
        ).textContent =
            App.formatCurrency(
                totalExpense
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
            `${savingsRate}%`;

    }


    /* =====================================================
       ACCOUNT MOVEMENT SUMMARY
    ===================================================== */



function renderAccountSummary() {

    const tbody =
        document.getElementById("accountSummaryBody");

    if (!tbody) return;

    const accounts = Storage.getAccounts();

    // Only Bank & Cash accounts
    const statementAccounts = accounts.filter(
        account =>
            account.type === "bank" ||
            account.type === "cash"
    );

    const accountMap = {};

    statementAccounts.forEach(account => {
        accountMap[account.name] = {
            moneyIn: 0,
            moneyOut: 0
        };
    });


    // =====================================================
    // TRANSACTIONS
    // =====================================================

    filteredTransactions.forEach(transaction => {

        const accountName = transaction.account;

        if (!accountMap.hasOwnProperty(accountName)) {
            return;
        }

        const amount =
            Number(transaction.amount || 0);


        // -------------------------------------------------
        // Credit Card Payment
        // Bank/Cash money goes OUT
        // -------------------------------------------------

        if (
            transaction.type ===
            "credit_card_payment"
        ) {

            accountMap[accountName].moneyOut += amount;

            return;
        }


        // -------------------------------------------------
        // Credit Card EMI
        // Do NOT count as separate Bank/Cash movement
        // -------------------------------------------------

        if (
            transaction.isCreditCardEMI === true ||
            transaction.category === "Credit Card EMI" ||
            (
                typeof transaction.note === "string" &&
                transaction.note.includes("CC EMI Payment")
            )
        ) {

            return;
        }


        // -------------------------------------------------
        // Income
        // -------------------------------------------------

        if (
            transaction.type === "income"
        ) {

            accountMap[accountName].moneyIn += amount;

            return;
        }


        // -------------------------------------------------
        // Expense
        // -------------------------------------------------

        if (
            transaction.type === "expense"
        ) {

            accountMap[accountName].moneyOut += amount;

            return;
        }

    });


    // =====================================================
    // LOANS
    // =====================================================

    Storage.getLoans().forEach(loan => {

        const accountName = loan.account;

        if (!accountMap.hasOwnProperty(accountName)) {
            return;
        }

        if (!isDateInCurrentFilter(loan.date)) {
            return;
        }

        const amount =
            Number(loan.amount || 0);


        // Borrow / Loan Received
        // Money comes IN

        if (
            loan.type === "borrow" ||
            loan.type === "loan_received"
        ) {

            accountMap[accountName].moneyIn += amount;
        }


        // Repay / Loan Given
        // Money goes OUT

        else if (
            loan.type === "repay" ||
            loan.type === "loan_given"
        ) {

            accountMap[accountName].moneyOut += amount;
        }

    });


    // =====================================================
    // TRANSFERS
    // =====================================================

    Storage.getTransfers().forEach(transfer => {

        if (!isDateInCurrentFilter(transfer.date)) {
            return;
        }

        const fromAccount =
            transfer.fromAccount ||
            transfer.from;

        const toAccount =
            transfer.toAccount ||
            transfer.to;

        const amount =
            Number(transfer.amount || 0);


        const fromIsBankCash =
            accountMap.hasOwnProperty(fromAccount);

        const toIsBankCash =
            accountMap.hasOwnProperty(toAccount);


        // -------------------------------------------------
        // Bank/Cash → Bank/Cash
        //
        // One account money out
        // Another account money in
        // Combined movement = 0
        // -------------------------------------------------

        if (
            fromIsBankCash &&
            toIsBankCash
        ) {

            accountMap[fromAccount].moneyOut += amount;
            accountMap[toAccount].moneyIn += amount;

            return;
        }


        // -------------------------------------------------
        // Other Account → Bank/Cash
        // Money IN
        // -------------------------------------------------

        if (
            !fromIsBankCash &&
            toIsBankCash
        ) {

            accountMap[toAccount].moneyIn += amount;

            return;
        }


        // -------------------------------------------------
        // Bank/Cash → Other Account
        // Money OUT
        // -------------------------------------------------

        if (
            fromIsBankCash &&
            !toIsBankCash
        ) {

            accountMap[fromAccount].moneyOut += amount;

            return;
        }

    });


    // =====================================================
    // TOTALS
    // =====================================================

    let totalMoneyIn = 0;
    let totalMoneyOut = 0;


    Object.values(accountMap).forEach(account => {

        totalMoneyIn +=
            Number(account.moneyIn || 0);

        totalMoneyOut +=
            Number(account.moneyOut || 0);

    });


    const totalNetMovement =
        totalMoneyIn - totalMoneyOut;


    // =====================================================
    // RENDER TABLE
    // =====================================================

    tbody.innerHTML = "";


    Object.keys(accountMap).forEach(accountName => {

        const moneyIn =
            accountMap[accountName].moneyIn;

        const moneyOut =
            accountMap[accountName].moneyOut;

        const netMovement =
            moneyIn - moneyOut;


        tbody.innerHTML += `
            <tr>

                <td>
                    ${accountName}
                </td>

                <td>
                    ${App.formatCurrency(moneyIn)}
                </td>

                <td>
                    ${App.formatCurrency(moneyOut)}
                </td>

                <td>
                    <strong>
                        ${App.formatCurrency(netMovement)}
                    </strong>
                </td>

            </tr>
        `;

    });


    // =====================================================
    // TOTAL ROW
    // =====================================================

    if (
        Object.keys(accountMap).length > 0
    ) {

        tbody.innerHTML += `
            <tr
                style="
                    border-top:
                        2px solid
                        var(--border-color);
                    font-weight: 700;
                "
            >

                <td>
                    <strong>Total</strong>
                </td>

                <td>
                    <strong>
                        ${App.formatCurrency(
                            totalMoneyIn
                        )}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${App.formatCurrency(
                            totalMoneyOut
                        )}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${App.formatCurrency(
                            totalNetMovement
                        )}
                    </strong>
                </td>

            </tr>
        `;

    }


    // =====================================================
    // NO DATA
    // =====================================================

    if (
        Object.keys(accountMap).length === 0
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="4"
                    class="text-center"
                >
                    No Data
                </td>

            </tr>
        `;

    }

}



    /* =====================================================
       DATE FILTER CHECK
    ===================================================== */

    function isDateInCurrentFilter(date) {

        const fromDate =
            document.getElementById(
                "fromDate"
            )?.value || "";


        const toDate =
            document.getElementById(
                "toDate"
            )?.value || "";


        if (
            fromDate &&
            date < fromDate
        ) {
            return false;
        }


        if (
            toDate &&
            date > toDate
        ) {
            return false;
        }


        return true;

    }


    /* =====================================================
       MONTH FORMAT
    ===================================================== */

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


    /* =====================================================
       MONTHLY SUMMARY
    ===================================================== */

    function renderMonthlySummary() {

        const tbody =
            document.getElementById(
                "monthlySummaryBody"
            );


        if (!tbody) {
            return;
        }


        const months = {};


        filteredTransactions.forEach(
            transaction => {

                /*
                 * Ignore Credit Card Payment
                 * from Income/Expense report.
                 */

                if (
                    isCreditCardPayment(
                        transaction
                    )
                ) {
                    return;
                }


                const month =
                    transaction.date.slice(
                        0,
                        7
                    );


                if (!months[month]) {

                    months[month] = {

                        income: 0,

                        expense: 0

                    };

                }


                const amount =
                    Number(
                        transaction.amount || 0
                    );


                if (
                    transaction.type ===
                    "income"
                ) {

                    months[
                        month
                    ].income += amount;

                }


                else if (
                    transaction.type ===
                    "expense"
                ) {

                    months[
                        month
                    ].expense += amount;

                }

            }
        );


        tbody.innerHTML = "";


        Object.keys(months)
            .sort()
            .forEach(month => {

                const income =
                    months[
                        month
                    ].income;


                const expense =
                    months[
                        month
                    ].expense;


                const savings =
                    income -
                    expense;


                tbody.innerHTML += `
                    <tr>

                        <td>
                            ${formatStatementMonth(
                                month
                            )}
                        </td>

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


        if (
            Object.keys(months)
                .length === 0
        ) {

            tbody.innerHTML = `
                <tr>

                    <td colspan="4"
                        class="text-center">

                        No Data

                    </td>

                </tr>
            `;

        }

    }


    /* =====================================================
       INCOME VS EXPENSE CHART
    ===================================================== */

    function renderIncomeExpenseChart() {

        const ctx =
            document.getElementById(
                "reportIncomeExpenseChart"
            );


        if (!ctx) {
            return;
        }


        let income = 0;

        let expense = 0;


        filteredTransactions.forEach(
            transaction => {

                /*
                 * Credit Card Payment is
                 * excluded from Income/Expense.
                 */

                if (
                    isCreditCardPayment(
                        transaction
                    )
                ) {
                    return;
                }


                const amount =
                    Number(
                        transaction.amount || 0
                    );


                if (
                    transaction.type ===
                    "income"
                ) {

                    income += amount;

                }


                else if (
                    transaction.type ===
                    "expense"
                ) {

                    expense += amount;

                }

            }
        );


        if (
            incomeExpenseChart &&
            typeof incomeExpenseChart.destroy ===
                "function"
        ) {

            incomeExpenseChart.destroy();

        }


        incomeExpenseChart =
            new Chart(
                ctx,
                {

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

                        maintainAspectRatio:
                            false

                    }

                }
            );

    }


    /* =====================================================
       EXPENSE CATEGORY CHART
    ===================================================== */

    function renderCategoryChart() {

        const ctx =
            document.getElementById(
                "reportCategoryChart"
            );


        if (!ctx) {
            return;
        }


        const categoryMap = {};


        filteredTransactions.forEach(
            transaction => {

                /*
                 * Credit Card Payment is
                 * NOT an expense category.
                 */

                if (
                    isCreditCardPayment(
                        transaction
                    )
                ) {
                    return;
                }


                if (
                    transaction.type !==
                    "expense"
                ) {
                    return;
                }


                const category =
                    transaction.category ||
                    "Uncategorized";


                const amount =
                    Number(
                        transaction.amount || 0
                    );


                categoryMap[
                    category
                ] =
                    (
                        categoryMap[
                            category
                        ] || 0
                    ) + amount;

            }
        );


        const labels =
            Object.keys(
                categoryMap
            );


        const values =
            Object.values(
                categoryMap
            );


        if (
            categoryChart &&
            typeof categoryChart.destroy ===
                "function"
        ) {

            categoryChart.destroy();

        }


        categoryChart =
            new Chart(
                ctx,
                {

                    type: "pie",

                    data: {

                        labels,

                        datasets: [{

                            data: values

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false

                    }

                }
            );

    }


    /* =====================================================
       BUDGET VS ACTUAL
    ===================================================== */

    function loadBudgetVsActualReport() {

        const tbody =
            document.getElementById(
                "budgetVsActualBody"
            );


        if (!tbody) {
            return;
        }


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


        const budgets =
            Storage.getBudgets();


        const transactions =
            Storage.getTransactions();


        tbody.innerHTML = "";


        const filteredBudgets =
            budgets.filter(
                budget => {

                    /* ---------------------------------
                       CATEGORY
                    --------------------------------- */

                    if (
                        selectedCategory &&
                        budget.category !==
                            selectedCategory
                    ) {
                        return false;
                    }


                    /* ---------------------------------
                       MONTH
                    --------------------------------- */

                    const budgetMonth =
                        budget.month;


                    const fromMonth =
                        fromDate
                            ? fromDate.slice(0, 7)
                            : "";


                    const toMonth =
                        toDate
                            ? toDate.slice(0, 7)
                            : "";


                    if (
                        fromMonth &&
                        budgetMonth < fromMonth
                    ) {
                        return false;
                    }


                    if (
                        toMonth &&
                        budgetMonth > toMonth
                    ) {
                        return false;
                    }


                    return true;

                }
            );


        filteredBudgets.forEach(
            budget => {

                const actual =
                    transactions
                        .filter(
                            transaction => {

                                /*
                                 * Only expense
                                 */

                                if (
                                    transaction.type !==
                                    "expense"
                                ) {
                                    return false;
                                }


                                /*
                                 * Category
                                 */

                                if (
                                    transaction.category !==
                                    budget.category
                                ) {
                                    return false;
                                }


                                /*
                                 * Month
                                 */

                                if (
                                    transaction.date.slice(
                                        0,
                                        7
                                    ) !==
                                    budget.month
                                ) {
                                    return false;
                                }


                                /*
                                 * Account
                                 */

                                if (
                                    selectedAccount &&
                                    transaction.account !==
                                        selectedAccount
                                ) {
                                    return false;
                                }


                                /*
                                 * Credit Card Payment
                                 *
                                 * Should not be budget
                                 * expense.
                                 */

                                if (
                                    isCreditCardPayment(
                                        transaction
                                    )
                                ) {
                                    return false;
                                }


                                return true;

                            }
                        )
                        .reduce(
                            (
                                sum,
                                transaction
                            ) =>
                                sum +
                                Number(
                                    transaction.amount ||
                                    0
                                ),
                            0
                        );


                const variance =
                    Number(
                        budget.amount || 0
                    ) -
                    actual;


                const status =
                    variance >= 0
                        ? "🟢 Within Budget"
                        : "🔴 Over Budget";


                tbody.innerHTML += `
                    <tr>

                        <td>
                            ${formatStatementMonth(
                                budget.month
                            )}
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

            }
        );


        if (
            filteredBudgets.length === 0
        ) {

            tbody.innerHTML = `
                <tr>

                    <td colspan="6"
                        class="text-center">

                        No Data

                    </td>

                </tr>
            `;

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

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


    /* =====================================================
       EXPORT CSV
    ===================================================== */

    function exportCSV() {

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


        filteredTransactions.forEach(
            transaction => {

                csv +=
                    `"${transaction.date}",` +
                    `"${transaction.type}",` +
                    `"${transaction.category || ""}",` +
                    `"${transaction.account || ""}",` +
                    `"${transaction.amount || 0}",` +
                    `"${transaction.note || ""}"\n`;

            }
        );


        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;

        link.download =
            "expense-report.csv";


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        URL.revokeObjectURL(
            url
        );


        if (
            typeof App.showToast ===
            "function"
        ) {

            App.showToast(
                "CSV Exported"
            );

        }

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    return {

        init,

        generateReport

    };

})();


/* =========================================================
   AUTO LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    Reports.init
);


/* =========================================================
   PRINT
========================================================= */

function printReport() {

    window.print();

}