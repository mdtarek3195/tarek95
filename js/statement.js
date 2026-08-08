/* ==========================================
   Expense Manager Pro
   File: js/statement.js
   ========================================== */

const Statement = (() => {

    let statementData = [];

    // =========================
    // INIT
    // =========================

    function init() {

        loadAccounts();

        setDefaultDates();

        console.log(
            "Statement Module Loaded"
        );
    }

    // =========================
    // LOAD ACCOUNTS
    // =========================

    function loadAccounts() {

        const accounts =
            Storage.getAccounts();

        const dropdown =
            document.getElementById(
                "statementAccount"
            );

        if (!dropdown)
            return;

        dropdown.innerHTML = `

    <option value="ALL">

        All Accounts

    </option>

`;

        accounts.forEach(account => {

            dropdown.innerHTML += `

                <option
                    value="${account.name}">

                    ${account.name}

                </option>

            `;

        });
    }

    // =========================
    // DEFAULT DATES
    // =========================

    function setDefaultDates() {

        const today =
            new Date();

        const firstDay =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        document.getElementById(
            "statementFromDate"
        ).value =
            firstDay
            .toISOString()
            .split("T")[0];

        document.getElementById(
            "statementToDate"
        ).value =
            today
            .toISOString()
            .split("T")[0];
    }

    // =========================
    // GENERATE STATEMENT
    // =========================

 function generateStatement() {

    let transactions = Storage.getTransactions();

    const account =
        document.getElementById(
            "statementAccount"
        ).value;

    const fromDate =
        document.getElementById(
            "statementFromDate"
        ).value;

    const toDate =
        document.getElementById(
            "statementToDate"
        ).value;

    if (!account) {

        alert(
            "Please select account."
        );

        return;
    }

    // Account Filter

    if (
        account !== "ALL"
    ) {

        transactions =
            transactions.filter(
                t =>
                    t.account === account
            );
    }

    // Date Filter

    transactions =
        transactions.filter(
            t =>
                (!fromDate ||
                    t.date >= fromDate)
                &&
                (!toDate ||
                    t.date <= toDate)
        );

    // Transfers

    const transfers =
        Storage.getTransfers()
        .filter(t =>

            (
                account === "ALL"
                ||
                t.fromAccount === account
                ||
                t.toAccount === account
            )

            &&

            (!fromDate ||
                t.date >= fromDate)

            &&

            (!toDate ||
                t.date <= toDate)

        );

    // Ledger Entries

    const ledgerEntries = [];

    transactions.forEach(t => {

        ledgerEntries.push({

            entryType:
                "transaction",

            date:
                t.date,

            type:
                t.type,

            category:
                t.category,

            amount:
                Number(t.amount),

            note:
                t.note || ""

        });

    });

    transfers.forEach(t => {

        if (
            account === "ALL"
        ) {

            ledgerEntries.push({

                entryType:
                    "transfer",

                date:
                    t.date,

                amount:
                    Number(t.amount),

                note:
                    `Transfer ${t.fromAccount} → ${t.toAccount}`

            });

        }
        else {

            if (
                t.fromAccount === account
            ) {

                ledgerEntries.push({

                    entryType:
                        "transfer-out",

                    date:
                        t.date,

                    amount:
                        Number(t.amount),

                    note:
                        `Transfer To ${t.toAccount}`

                });

            }

            if (
                t.toAccount === account
            ) {

                ledgerEntries.push({

                    entryType:
                        "transfer-in",

                    date:
                        t.date,

                    amount:
                        Number(t.amount),

                    note:
                        `Transfer From ${t.fromAccount}`

                });

            }

        }

    });

    // Sort

    ledgerEntries.sort(

        (a, b) =>

            new Date(a.date) -
            new Date(b.date)

    );

    const openingBalance =
        calculateOpeningBalance(
            account,
            fromDate
        );

    statementData =
        ledgerEntries;

    renderStatement(
        ledgerEntries,
        openingBalance
    );

	updateSummary(
		ledgerEntries,
		openingBalance
	);

}   
		

			

    // =========================
    // RENDER TABLE
    // =========================

function calculateOpeningBalance(

    account,

    fromDate

) {

    const transactions =

        Storage.getTransactions();

    let balance = 0;

    transactions.forEach(t => {

        const accountMatch =

            account === "ALL"

            ||

            t.account === account;

        if (

            accountMatch

            &&

            t.date < fromDate

        ) {

            if (

                t.type === "income"

            ) {

                balance +=

                    t.amount;

            } else {

                balance -=

                    t.amount;

            }

        }

    });

    return balance;

}

	
function renderStatement(
    transactions,
    openingBalance
) {

    const tbody =
        document.getElementById(
            "statementTableBody"
        );

    if (!tbody) return;

    if (
        transactions.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No transactions found
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = "";

    tbody.innerHTML += `
        <tr>
            <td>-</td>
            <td>
                <strong>
                    Opening Balance
                </strong>
            </td>
            <td>-</td>
            <td>-</td>
            <td>
                <strong>
                    ${App.formatCurrency(
                        openingBalance
                    )}
                </strong>
            </td>
        </tr>
    `;

    let runningBalance =
        openingBalance;

    transactions.forEach(item => {

        let debit = 0;
        let credit = 0;

        let description = "";

        // Transaction
        if (
            item.entryType ===
            "transaction"
        ) {

            description =
                item.category || "-";

            if (
                item.type === "income"
            ) {

                credit =
                    Number(item.amount);

                runningBalance +=
                    Number(item.amount);

            } else {

                debit =
                    Number(item.amount);

                runningBalance -=
                    Number(item.amount);
            }
        }

        // Transfer Out
        else if (
            item.entryType ===
            "transfer-out"
        ) {

            description =
                item.note;

            debit =
                Number(item.amount);

            runningBalance -=
                Number(item.amount);
        }

        // Transfer In
        else if (
            item.entryType ===
            "transfer-in"
        ) {

            description =
                item.note;

            credit =
                Number(item.amount);

            runningBalance +=
                Number(item.amount);
        }

        // ALL Accounts Transfer
        else if (
            item.entryType ===
            "transfer"
        ) {

            description =
                item.note;

            debit =
                Number(item.amount);

            credit =
                Number(item.amount);

            // runningBalance change হবে না
        }

        tbody.innerHTML += `
            <tr>

                <td>
                    ${App.formatDate(
                        item.date
                    )}
                </td>

                <td>
                    ${description}
                    <br>
                    <small>
                        ${item.note || ""}
                    </small>
                </td>

                <td>
                    ${
                        debit > 0
                        ? App.formatCurrency(
                            debit
                          )
                        : "-"
                    }
                </td>

                <td>
                    ${
                        credit > 0
                        ? App.formatCurrency(
                            credit
                          )
                        : "-"
                    }
                </td>

                <td>
                    ${App.formatCurrency(
                        runningBalance
                    )}
                </td>

            </tr>
        `;

    });

    document.getElementById(
        "statementBalance"
    ).textContent =
        App.formatCurrency(
            runningBalance
        );
}

			
					
		
    // =========================
    // SUMMARY
    // =========================

	
function updateSummary(
    ledgerEntries,
    openingBalance
) {

    let totalCredit = 0;
    let totalDebit = 0;

    ledgerEntries.forEach(item => {

        if (
            item.entryType === "transaction"
        ) {

            if (
                item.type === "income"
            ) {

                totalCredit += Number(item.amount);

            } else {

                totalDebit += Number(item.amount);

            }
        }

        else if (
            item.entryType === "transfer-in"
        ) {

            totalCredit += Number(item.amount);

        }

        else if (
            item.entryType === "transfer-out"
        ) {

            totalDebit += Number(item.amount);

        }
    });

    const closingBalance =
        openingBalance +
        totalCredit -
        totalDebit;

    document.getElementById(
        "statementCredit"
    ).textContent =
        App.formatCurrency(
            totalCredit
        );

    document.getElementById(
        "statementDebit"
    ).textContent =
        App.formatCurrency(
            totalDebit
        );

    document.getElementById(
        "statementBalance"
    ).textContent =
        App.formatCurrency(
            closingBalance
        );
}



    // =========================
    // EXPORT CSV
    // =========================

    function exportCSV() {

        if (
            statementData.length === 0
        ) {

            alert(
                "Generate statement first."
            );

            return;
        }

        let csv =

            "Date,Category,Type,Amount,Account,Note\n";

        statementData.forEach(t => {

            csv +=

                `${t.date},` +

                `${t.category || ""},` +

                `${t.type},` +

                `${t.amount},` +

                `${t.account},` +

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
            "account_statement.csv";

        a.click();

        URL.revokeObjectURL(
            url
        );
    }
	
	function printStatement() {

    const statementArea =

        document.querySelector(
            ".table-responsive"
        );

    if (!statementArea) {

        alert(
            "No statement found."
        );

        return;
    }

    const printWindow =
        window.open(
            "",
            "",
            "width=1000,height=700"
        );

    printWindow.document.write(`

        <html>

        <head>

            <title>
                Account Statement
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        sans-serif;

                    padding: 20px;
                }

                h2 {

                    text-align: center;
                }

                table {

                    width: 100%;

                    border-collapse:
                        collapse;
                }

                th,
                td {

                    border:
                        1px solid #ccc;

                    padding: 8px;

                    text-align: left;
                }

                th {

                    background:
                        #f5f5f5;
                }

            </style>

        </head>

        <body>

            <h2>
                Account Statement
            </h2>

            ${statementArea.innerHTML}

        </body>

        </html>

    `);

    printWindow.document.close();

    printWindow.focus();

    printWindow.print();
}

    // =========================
    // PUBLIC API
    // =========================

	return {

		init,

		generateStatement,

		exportCSV,

		printStatement

	};

})();

document.addEventListener(

    "DOMContentLoaded",

    Statement.init

);
