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

    const fromDate =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-01`;

    const toDate =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;

    document.getElementById(
        "statementFromDate"
    ).value = fromDate;

    document.getElementById(
        "statementToDate"
    ).value = toDate;

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

    const rows =
        document.querySelectorAll(
            "#statementTableBody tr"
        );

    if (rows.length === 0) {

        alert(
            "Generate statement first."
        );

        return;
    }

    // =========================
    // ACCOUNT / DATE INFORMATION
    // =========================

    const accountSelect =
        document.getElementById(
            "statementAccount"
        );

    const accountName =
        accountSelect
            ? accountSelect.options[
                accountSelect.selectedIndex
            ]?.text || ""
            : "";

    const fromDate =
        document.getElementById(
            "statementFromDate"
        )?.value || "";

    const toDate =
        document.getElementById(
            "statementToDate"
        )?.value || "";


    // =========================
    // CSV HEADER
    // =========================

    let csv = "";

    csv +=
        "ACCOUNT STATEMENT\n";

    csv +=
        `"Account","${accountName}"\n`;

    csv +=
        `"Statement Period","${fromDate} to ${toDate}"\n`;

    csv += "\n";

    csv +=
        "Date,Description,Debit,Credit,Balance\n";


    // =========================
    // LEDGER DATA
    // =========================

    rows.forEach(row => {

        const cols =
            row.querySelectorAll("td");

        if (cols.length === 5) {

            const date =
                cols[0].innerText.trim();

            const description =
                cols[1].innerText.trim();

            const debit =
                cols[2].innerText.trim();

            const credit =
                cols[3].innerText.trim();

            const balance =
                cols[4].innerText.trim();


            csv +=
                `"${date}",` +
                `"${description}",` +
                `"${debit}",` +
                `"${credit}",` +
                `"${balance}"\n`;
        }

    });


    // =========================
    // DOWNLOAD CSV
    // =========================

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "Account_Ledger.csv";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

}
	










function printStatement() {

    const summary =

        document.querySelector(
            ".stats-grid"
        ).outerHTML;

    const ledger =

        document.querySelector(
            ".table-container"
        ).outerHTML;

    const printWindow =
        window.open(
            "",
            "_blank"
        );

    printWindow.document.write(`

        <html>

        <head>

            <title>
                Account Statement
            </title>

            <style>

                body{

                    font-family: Arial, sans-serif;

                    padding:20px;

                }

                table{

                    width:100%;

                    border-collapse:collapse;

                }

                th,td{

                    border:1px solid #ccc;

                    padding:8px;

                }

            </style>

        </head>

        <body>

            <h2>
                Statement Summary
            </h2>

            ${summary}

            <h2>
                Account Ledger
            </h2>

            ${ledger}

        </body>

        </html>

    `);

    printWindow.document.close();

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
