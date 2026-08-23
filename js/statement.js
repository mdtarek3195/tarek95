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

    if (!dropdown) {
        return;
    }


    /* =========================
       RESET DROPDOWN
    ========================= */

    dropdown.innerHTML = `
        <option value="ALL">
            All Accounts
        </option>
    `;


    /* =========================
       ONLY BANK + CASH ACCOUNTS
    ========================= */

    const statementAccounts =
        accounts.filter(
            account =>
                account.type === "bank" ||
                account.type === "cash"
        );


    /* =========================
       ADD ACCOUNTS
    ========================= */

    statementAccounts.forEach(
        account => {

            dropdown.innerHTML += `
                <option value="${account.name}">
                    ${account.name}
                </option>
            `;

        }
    );

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

    /* =====================================================
       BASIC DATA
    ===================================================== */

    const transactions =
        Storage.getTransactions();

    const transfers =
        Storage.getTransfers();

    const loans =
        Storage.getLoans();

    const accounts =
        Storage.getAccounts();


    /* =====================================================
       FILTER VALUES
    ===================================================== */

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


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!account) {

        alert(
            "Please select account."
        );

        return;
    }


    /* =====================================================
       BANK + CASH ACCOUNTS ONLY
    ===================================================== */

    const statementAccounts =
        accounts.filter(
            acc =>
                acc.type === "bank" ||
                acc.type === "cash"
        );


    const statementAccountNames =
        statementAccounts.map(
            acc => acc.name
        );


    /* =====================================================
       LEDGER
    ===================================================== */

    let ledgerEntries = [];


    /* =====================================================
       TRANSACTIONS
    ===================================================== */

    transactions.forEach(t => {

        /* ---------------------------------------------
           Account must be Bank / Cash
        --------------------------------------------- */

        if (
            !statementAccountNames.includes(
                t.account
            )
        ) {
            return;
        }


        /* ---------------------------------------------
           Selected Account
        --------------------------------------------- */

        if (
            account !== "ALL" &&
            t.account !== account
        ) {
            return;
        }


        /* ---------------------------------------------
           Date Filter
        --------------------------------------------- */

        if (
            fromDate &&
            t.date < fromDate
        ) {
            return;
        }

        if (
            toDate &&
            t.date > toDate
        ) {
            return;
        }


        /* ---------------------------------------------
           CREDIT CARD EMI

           EMI is NOT a separate Bank/Cash
           statement outflow.

           The actual Credit Card Statement Payment
           is handled separately.
        --------------------------------------------- */

        const isCreditCardEMI =
            t.isCreditCardEMI === true ||
            t.category === "Credit Card EMI" ||
            (
                typeof t.note === "string" &&
                t.note.includes(
                    "CC EMI Payment"
                )
            );


        if (isCreditCardEMI) {
            return;
        }


        /* ---------------------------------------------
           NORMAL TRANSACTION
        --------------------------------------------- */

        let type = null;


        if (t.type === "income") {

            type = "income";

        }
        else if (t.type === "expense") {

            type = "expense";

        }
        else if (
            t.type === "credit_card_payment"
        ) {

            /*
             * Credit Card Payment from Bank/Cash
             * is a real cash outflow.
             */

            type = "expense";

        }


        if (!type) {
            return;
        }


        ledgerEntries.push({

            entryType: "transaction",

            date: t.date,

            type: type,

            category:
                t.category ||
                "Transaction",

            amount:
                Number(
                    t.amount || 0
                ),

            note:
                t.note ||
                "",

            account:
                t.account || ""

        });

    });


    /* =====================================================
       LOANS
    ===================================================== */

    loans.forEach(loan => {

        /* ---------------------------------------------
           Find Loan Account
        --------------------------------------------- */

        const loanAccount =
            statementAccounts.find(
                acc =>
                    acc.name === loan.account
            );


        /*
         * Ignore Credit Card / other accounts
         */

        if (!loanAccount) {
            return;
        }


        /* ---------------------------------------------
           Selected Account
        --------------------------------------------- */

        if (
            account !== "ALL" &&
            loan.account !== account
        ) {
            return;
        }


        /* ---------------------------------------------
           Date Filter
        --------------------------------------------- */

        if (
            fromDate &&
            loan.date < fromDate
        ) {
            return;
        }

        if (
            toDate &&
            loan.date > toDate
        ) {
            return;
        }


        /* ---------------------------------------------
           Loan Type
        --------------------------------------------- */

        let type = null;
        let category = "";


        if (
            loan.type === "borrow"
        ) {

            type = "income";
            category = "Borrow";

        }
        else if (
            loan.type === "loan_received"
        ) {

            type = "income";
            category = "Loan Received";

        }
        else if (
            loan.type === "repay"
        ) {

            type = "expense";
            category = "Loan Repayment";

        }
        else if (
            loan.type === "loan_given"
        ) {

            type = "expense";
            category = "Loan Given";

        }


        if (!type) {
            return;
        }


        /* ---------------------------------------------
           Add Loan to Statement
        --------------------------------------------- */

        ledgerEntries.push({

            entryType: "loan",

            date: loan.date,

            type: type,

            category: category,

            amount:
                Number(
                    loan.amount || 0
                ),

            note:
                loan.note ||
                `${category} - ${loan.person || ""}`,

            account:
                loan.account || ""

        });

    });


    /* =====================================================
       TRANSFERS
    ===================================================== */

    transfers.forEach(transfer => {

        const fromAccount =
            transfer.fromAccount ||
            transfer.from;

        const toAccount =
            transfer.toAccount ||
            transfer.to;


        /* ---------------------------------------------
           Both accounts must be Bank / Cash
        --------------------------------------------- */

        const fromIsStatementAccount =
            statementAccountNames.includes(
                fromAccount
            );

        const toIsStatementAccount =
            statementAccountNames.includes(
                toAccount
            );


        /*
         * Ignore transfers that do not involve
         * Bank/Cash accounts.
         */

        if (
            !fromIsStatementAccount &&
            !toIsStatementAccount
        ) {
            return;
        }


        /* ---------------------------------------------
           Date Filter
        --------------------------------------------- */

        const transferDate =
            transfer.date;


        if (
            fromDate &&
            transferDate < fromDate
        ) {
            return;
        }

        if (
            toDate &&
            transferDate > toDate
        ) {
            return;
        }


        const amount =
            Number(
                transfer.amount || 0
            );


        /* =================================================
           ALL ACCOUNTS
        ================================================= */

        if (account === "ALL") {

            /*
             * Bank/Cash transfer inside the same
             * statement scope has ZERO net effect.
             *
             * Therefore we do not add it to ALL
             * statement.
             */

            if (
                fromIsStatementAccount &&
                toIsStatementAccount
            ) {
                return;
            }


            /*
             * If money comes from Credit Card/other
             * account to Bank/Cash, show as income.
             */

            if (
                toIsStatementAccount &&
                !fromIsStatementAccount
            ) {

                ledgerEntries.push({

                    entryType: "transfer-in",

                    date: transferDate,

                    type: "income",

                    category: "Transfer In",

                    amount: amount,

                    note:
                        transfer.note ||
                        `Transfer from ${fromAccount}`,

                    account: toAccount

                });

            }


            /*
             * If money goes from Bank/Cash to
             * Credit Card/other account, show expense.
             */

            else if (
                fromIsStatementAccount &&
                !toIsStatementAccount
            ) {

                ledgerEntries.push({

                    entryType: "transfer-out",

                    date: transferDate,

                    type: "expense",

                    category: "Transfer Out",

                    amount: amount,

                    note:
                        transfer.note ||
                        `Transfer to ${toAccount}`,

                    account: fromAccount

                });

            }


            return;
        }


        /* =================================================
           SPECIFIC ACCOUNT
        ================================================= */

        /*
         * Money coming INTO selected account
         */

        if (
            toAccount === account
        ) {

            ledgerEntries.push({

                entryType: "transfer-in",

                date: transferDate,

                type: "income",

                category: "Transfer In",

                amount: amount,

                note:
                    transfer.note ||
                    `Transfer from ${fromAccount}`,

                account: account

            });

        }


        /*
         * Money going OUT from selected account
         */

        if (
            fromAccount === account
        ) {

            ledgerEntries.push({

                entryType: "transfer-out",

                date: transferDate,

                type: "expense",

                category: "Transfer Out",

                amount: amount,

                note:
                    transfer.note ||
                    `Transfer to ${toAccount}`,

                account: account

            });

        }

    });


    /* =====================================================
       SORT BY DATE
    ===================================================== */

    ledgerEntries.sort(
        (a, b) => {

            const dateCompare =
                a.date.localeCompare(
                    b.date
                );

            if (
                dateCompare !== 0
            ) {
                return dateCompare;
            }

            /*
             * Keep original insertion order
             * when dates are same.
             */

            return 0;

        }
    );


    /* =====================================================
       OPENING BALANCE
    ===================================================== */

    const openingBalance =
        calculateOpeningBalance(
            account,
            fromDate
        );


    /* =====================================================
       SAVE STATEMENT DATA
    ===================================================== */

    statementData =
        ledgerEntries;


    /* =====================================================
       RENDER
    ===================================================== */

    renderStatement(
        ledgerEntries,
        openingBalance
    );


    /* =====================================================
       SUMMARY
    ===================================================== */

    updateSummary(
        ledgerEntries,
        openingBalance
    );

}



function calculateOpeningBalance(
    account,
    fromDate
) {

    /* =====================================================
       BASIC DATA
    ===================================================== */

    const transactions =
        Storage.getTransactions();

    const transfers =
        Storage.getTransfers();

    const loans =
        Storage.getLoans();

    const accounts =
        Storage.getAccounts();


    /* =====================================================
       BANK + CASH ACCOUNTS ONLY
    ===================================================== */

    const statementAccounts =
        accounts.filter(
            acc =>
                acc.type === "bank" ||
                acc.type === "cash"
        );


    const statementAccountNames =
        statementAccounts.map(
            acc => acc.name
        );


    /* =====================================================
       OPENING BALANCE
    ===================================================== */

    let balance = 0;


    /* =====================================================
       TRANSACTIONS
    ===================================================== */

    transactions.forEach(t => {

        /* ---------------------------------------------
           Only Bank / Cash
        --------------------------------------------- */

        if (
            !statementAccountNames.includes(
                t.account
            )
        ) {
            return;
        }


        /* ---------------------------------------------
           Selected Account
        --------------------------------------------- */

        if (
            account !== "ALL" &&
            t.account !== account
        ) {
            return;
        }


        /* ---------------------------------------------
           Only transactions BEFORE fromDate
        --------------------------------------------- */

        if (
            fromDate &&
            t.date >= fromDate
        ) {
            return;
        }


        /* ---------------------------------------------
           Credit Card EMI

           Do NOT count separately.
        --------------------------------------------- */

        const isCreditCardEMI =
            t.isCreditCardEMI === true ||
            t.category === "Credit Card EMI" ||
            (
                typeof t.note === "string" &&
                t.note.includes(
                    "CC EMI Payment"
                )
            );


        if (isCreditCardEMI) {
            return;
        }


        /* ---------------------------------------------
           Amount
        --------------------------------------------- */

        const amount =
            Number(
                t.amount || 0
            );


        /* ---------------------------------------------
           Income
        --------------------------------------------- */

        if (
            t.type === "income"
        ) {

            balance += amount;

        }


        /* ---------------------------------------------
           Normal Expense
        --------------------------------------------- */

        else if (
            t.type === "expense"
        ) {

            balance -= amount;

        }


        /* ---------------------------------------------
           Credit Card Payment

           Bank/Cash payment to CC is real
           cash outflow.
        --------------------------------------------- */

        else if (
            t.type === "credit_card_payment"
        ) {

            balance -= amount;

        }

    });


    /* =====================================================
       LOANS
    ===================================================== */

    loans.forEach(loan => {

        /* ---------------------------------------------
           Loan account must be Bank / Cash
        --------------------------------------------- */

        if (
            !statementAccountNames.includes(
                loan.account
            )
        ) {
            return;
        }


        /* ---------------------------------------------
           Selected Account
        --------------------------------------------- */

        if (
            account !== "ALL" &&
            loan.account !== account
        ) {
            return;
        }


        /* ---------------------------------------------
           Only loans BEFORE fromDate
        --------------------------------------------- */

        if (
            fromDate &&
            loan.date >= fromDate
        ) {
            return;
        }


        const amount =
            Number(
                loan.amount || 0
            );


        /* ---------------------------------------------
           Borrow / Loan Received
           = Money IN
        --------------------------------------------- */

        if (
            loan.type === "borrow" ||
            loan.type === "loan_received"
        ) {

            balance += amount;

        }


        /* ---------------------------------------------
           Repay / Loan Given
           = Money OUT
        --------------------------------------------- */

        else if (
            loan.type === "repay" ||
            loan.type === "loan_given"
        ) {

            balance -= amount;

        }

    });


    /* =====================================================
       TRANSFERS
    ===================================================== */

    transfers.forEach(transfer => {

        const fromAccount =
            transfer.fromAccount ||
            transfer.from;

        const toAccount =
            transfer.toAccount ||
            transfer.to;


        const amount =
            Number(
                transfer.amount || 0
            );


        /* ---------------------------------------------
           Check Bank/Cash
        --------------------------------------------- */

        const fromIsStatementAccount =
            statementAccountNames.includes(
                fromAccount
            );

        const toIsStatementAccount =
            statementAccountNames.includes(
                toAccount
            );


        /*
         * Ignore transfers which do not involve
         * Bank/Cash.
         */

        if (
            !fromIsStatementAccount &&
            !toIsStatementAccount
        ) {
            return;
        }


        /* ---------------------------------------------
           Only transfers BEFORE fromDate
        --------------------------------------------- */

        if (
            fromDate &&
            transfer.date >= fromDate
        ) {
            return;
        }


        /* =================================================
           ALL ACCOUNTS
        ================================================= */

        if (
            account === "ALL"
        ) {

            /*
             * Bank -> Cash
             * Cash -> Bank
             *
             * Both are already inside the
             * combined Bank + Cash balance.
             *
             * Therefore net effect = ZERO.
             */

            if (
                fromIsStatementAccount &&
                toIsStatementAccount
            ) {

                return;

            }


            /*
             * Other Account -> Bank/Cash
             */

            if (
                toIsStatementAccount &&
                !fromIsStatementAccount
            ) {

                balance += amount;

            }


            /*
             * Bank/Cash -> Other Account
             */

            else if (
                fromIsStatementAccount &&
                !toIsStatementAccount
            ) {

                balance -= amount;

            }

            return;
        }


        /* =================================================
           SPECIFIC ACCOUNT
        ================================================= */

        /*
         * Money INTO selected account
         */

        if (
            toAccount === account
        ) {

            balance += amount;

        }


        /*
         * Money OUT OF selected account
         */

        if (
            fromAccount === account
        ) {

            balance -= amount;

        }

    });


    /* =====================================================
       FINAL BALANCE
    ===================================================== */

    return Number(
        balance.toFixed(2)
    );

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


    /* =====================================================
       NO DATA
    ===================================================== */

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

        document.getElementById(
            "statementBalance"
        ).textContent =
            App.formatCurrency(
                openingBalance
            );

        return;
    }


    /* =====================================================
       CLEAR TABLE
    ===================================================== */

    tbody.innerHTML = "";


    /* =====================================================
       OPENING BALANCE
    ===================================================== */

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


    /* =====================================================
       RUNNING BALANCE
    ===================================================== */

    let runningBalance =
        Number(openingBalance || 0);


    /* =====================================================
       PROCESS LEDGER
    ===================================================== */

    transactions.forEach(item => {

        let debit = 0;
        let credit = 0;

        let description = "";

        const amount =
            Number(
                item.amount || 0
            );


        /* =================================================
           DESCRIPTION
        ================================================= */

        description =
            item.category ||
            "-";


        /* =================================================
           TRANSACTION
        ================================================= */

        if (
            item.entryType ===
            "transaction"
        ) {

            if (
                item.type === "income"
            ) {

                credit =
                    amount;

                runningBalance +=
                    amount;

            }
            else if (
                item.type === "expense" ||
                item.type === "credit_card_payment"
            ) {

                debit =
                    amount;

                runningBalance -=
                    amount;

            }

        }


        /* =================================================
           LOAN
        ================================================= */

        else if (
            item.entryType ===
            "loan"
        ) {

            /*
             * Borrow / Loan Received
             * = Credit
             */

            if (
                item.type === "income"
            ) {

                credit =
                    amount;

                runningBalance +=
                    amount;

            }

            /*
             * Repay / Loan Given
             * = Debit
             */

            else if (
                item.type === "expense"
            ) {

                debit =
                    amount;

                runningBalance -=
                    amount;

            }

        }


        /* =================================================
           TRANSFER OUT
        ================================================= */

        else if (
            item.entryType ===
            "transfer-out"
        ) {

            description =
                item.note ||
                "Transfer Out";

            debit =
                amount;

            runningBalance -=
                amount;

        }


        /* =================================================
           TRANSFER IN
        ================================================= */

        else if (
            item.entryType ===
            "transfer-in"
        ) {

            description =
                item.note ||
                "Transfer In";

            credit =
                amount;

            runningBalance +=
                amount;

        }


        /* =================================================
           ALL ACCOUNTS TRANSFER
        ================================================= */

        else if (
            item.entryType ===
            "transfer"
        ) {

            description =
                item.note ||
                "Transfer";

            debit =
                amount;

            credit =
                amount;

            /*
             * No balance change.
             */

        }


        /* =================================================
           TABLE ROW
        ================================================= */

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


    /* =====================================================
       FINAL BALANCE
    ===================================================== */

    const balanceElement =
        document.getElementById(
            "statementBalance"
        );

    if (balanceElement) {

        balanceElement.textContent =
            App.formatCurrency(
                runningBalance
            );

    }

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


    /* =====================================================
       CALCULATE SUMMARY
    ===================================================== */

    ledgerEntries.forEach(item => {

        const amount =
            Number(
                item.amount || 0
            );


        /* =================================================
           TRANSACTION
        ================================================= */

        if (
            item.entryType ===
            "transaction"
        ) {

            if (
                item.type === "income"
            ) {

                totalCredit += amount;

            }
            else if (
                item.type === "expense" ||
                item.type === "credit_card_payment"
            ) {

                totalDebit += amount;

            }

        }


        /* =================================================
           LOAN
        ================================================= */

        else if (
            item.entryType ===
            "loan"
        ) {

            /*
             * Borrow / Loan Received
             * = Credit
             */

            if (
                item.type === "income"
            ) {

                totalCredit += amount;

            }

            /*
             * Repay / Loan Given
             * = Debit
             */

            else if (
                item.type === "expense"
            ) {

                totalDebit += amount;

            }

        }


        /* =================================================
           TRANSFER IN
        ================================================= */

        else if (
            item.entryType ===
            "transfer-in"
        ) {

            totalCredit += amount;

        }


        /* =================================================
           TRANSFER OUT
        ================================================= */

        else if (
            item.entryType ===
            "transfer-out"
        ) {

            totalDebit += amount;

        }


        /* =================================================
           ALL ACCOUNT TRANSFER

           Debit and Credit are both shown,
           therefore net effect = ZERO.
        ================================================= */

        else if (
            item.entryType ===
            "transfer"
        ) {

            totalCredit += amount;
            totalDebit += amount;

        }

    });


    /* =====================================================
       CLOSING BALANCE
    ===================================================== */

    const closingBalance =
        Number(openingBalance || 0) +
        totalCredit -
        totalDebit;


    /* =====================================================
       UPDATE TOTAL CREDIT
    ===================================================== */

    const creditElement =
        document.getElementById(
            "statementCredit"
        );

    if (creditElement) {

        creditElement.textContent =
            App.formatCurrency(
                totalCredit
            );

    }


    /* =====================================================
       UPDATE TOTAL DEBIT
    ===================================================== */

    const debitElement =
        document.getElementById(
            "statementDebit"
        );

    if (debitElement) {

        debitElement.textContent =
            App.formatCurrency(
                totalDebit
            );

    }


    /* =====================================================
       UPDATE CLOSING BALANCE
    ===================================================== */

    const balanceElement =
        document.getElementById(
            "statementBalance"
        );

    if (balanceElement) {

        balanceElement.textContent =
            App.formatCurrency(
                closingBalance
            );

    }

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
