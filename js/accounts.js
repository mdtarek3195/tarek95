/* ==========================================
   Expense Manager Pro
   File: js/accounts.js
   ========================================== */

const Accounts = (() => {
	
	let editingAccountId = null;

    let accounts = [];

    // =========================
    // INIT
    // =========================

    function init() {

        loadAccounts();

        bindEvents();

        console.log("Accounts Module Loaded");
    }

    // =========================
    // LOAD ACCOUNTS
    // =========================

    function loadAccounts() {

        accounts = Storage.getAccounts();

        renderTable();

        updateSummary();
    }

    // =========================
    // SUMMARY
    // =========================



function updateSummary() {

    const totalAccounts =
        accounts.length;

    const totalBalance =

        accounts

        .filter(

            account =>

                account.type !==
                "creditcard"

        )

        .reduce(

            (sum, account) =>

                sum +

                Number(
                    account.balance || 0
                ),

            0

        );

    const totalAccountsEl =
        document.getElementById(
            "totalAccounts"
        );

    const totalBalanceEl =
        document.getElementById(
            "totalBalance"
        );

    if (totalAccountsEl) {

        totalAccountsEl.textContent =
            totalAccounts;

    }

    if (totalBalanceEl) {

        totalBalanceEl.textContent =

            App.formatCurrency(
                totalBalance
            );

    }

}


    // =========================
    // RENDER TABLE
    // =========================


function renderTable() {

    const tbody =
        document.getElementById(
            "accountTableBody"
        );

    if (!tbody)
        return;

    if (accounts.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="4"
                    class="text-center">

                    No Accounts Found

                </td>

            </tr>

        `;

        return;

    }

    const statements =
        Storage.getCardStatements();

    const emis =
        Storage.getEmiPurchases();

    const transactions =
        Storage.getTransactions();

    tbody.innerHTML = "";

    accounts.forEach(account => {

        let balanceHtml = "";

        if (

            account.type ===
            "creditcard"

        ) {

            /* =====================
               Statement Due
            ===================== */

            const statementDue =

                statements

                .filter(

                    s =>

                        s.card ===
                        account.name &&

                        s.status !==
                        "Paid"

                )

                .reduce(

                    (sum, s) =>

                        sum +

                        Number(
                            s.remaining || 0
                        ),

                    0

                );

            /* =====================
               Pending Expense
            ===================== */

            const pendingExpense =

                transactions

                .filter(

                    t =>

                        t.account ===
                        account.name &&

                        t.type ===
                        "expense" &&

                        !t.statementGenerated

                )

                .reduce(

                    (sum, t) =>

                        sum +

                        Number(
                            t.amount || 0
                        ),

                    0

                );

            const outstanding =

                statementDue +
                pendingExpense;

            /* =====================
               EMI Outstanding
            ===================== */

            const emiOutstanding =

                emis

                .filter(

                    e =>

                        e.card ===
                        account.name &&

                        e.status !==
                        "completed"

                )

                .reduce(

                    (sum, e) =>

                        sum +

                        Number(
                            e.remainingAmount || 0
                        ),

                    0

                );

            const used =

                outstanding +
                emiOutstanding;

            const limit =

                Number(
                    account.limit || 0
                );

            const available =

                limit -
                used;

            balanceHtml = `

                <div>

                    <strong>
                        Limit:
                    </strong>

                    ${App.formatCurrency(limit)}

                </div>

                <div>

                    <strong>
                        Outstanding:
                    </strong>

                    ${App.formatCurrency(outstanding)}

                </div>

                <div>

                    <strong>
                        EMI Outstanding:
                    </strong>

                    ${App.formatCurrency(emiOutstanding)}

                </div>

                <div>

                    <strong>
                        Used:
                    </strong>

                    ${App.formatCurrency(used)}

                </div>

                <div>

                    <strong>
                        Available:
                    </strong>

                    ${App.formatCurrency(available)}

                </div>

            `;

        }

        else {

            balanceHtml =

                App.formatCurrency(

                    account.balance || 0

                );

        }


let statementInfo = "";

if(account.type === "creditcard"){

    statementInfo = `
        <div>
            <strong>Statement Day:</strong>
            ${account.statementDay || 28}
        </div>

        <div>
            <strong>Due After:</strong>
            ${account.dueAfterDays || 15} Days
        </div>
    `;
}

        const row =

            document.createElement(
                "tr"
            );

        row.innerHTML = `

            <td>
                ${account.name}
            </td>

            <td>
                ${account.type || "bank"}
            </td>

			 <td>
				${balanceHtml}
				${statementInfo}
			</td>

            <td style="text-align: center">
			
				<button
					class="btn btn-primary"
					onclick="Accounts.editAccount(${account.id})">

					Edit
			
				</button>

                <button
                    class="btn btn-danger"
                    onclick="Accounts.deleteAccount(${account.id})">

                    Delete

                </button>

            </td>

        `;

        tbody.appendChild(
            row
        );

    });

}



    // =========================
    // Edit ACCOUNT
    // =========================
	

function editAccount(id){

    const account =
        accounts.find(
            a => a.id === id
        );

    if(!account)
        return;

    document.getElementById(
        "accountName"
    ).value =
        account.name;

    document.getElementById(
        "accountType"
    ).value =
        account.type;

    document.getElementById(
        "creditLimit"
    ).value =
        account.limit || 0;

    document.getElementById(
        "statementDay"
    ).value =
        account.statementDay || 28;

    document.getElementById(
        "dueAfterDays"
    ).value =
        account.dueAfterDays || 15;

    /* Show / Hide Credit Card Fields */

    document.getElementById(
        "creditLimitGroup"
    ).style.display =

        account.type ===
        "creditcard"

            ? "block"

            : "none";

    editingAccountId =
        id;

}


    // =========================
    // ADD ACCOUNT
    // =========================



function addAccount() {

    const accountName =
        document.getElementById(
            "accountName"
        ).value.trim();

    if (!accountName) {

        alert(
            "Please enter account name."
        );

        return;

    }

    const accountType =
        document.getElementById(
            "accountType"
        ).value;

    const creditLimit =
        Number(
            document
            .getElementById(
                "creditLimit"
            )?.value || 0
        );

    const statementDay =
        Number(
            document
            .getElementById(
                "statementDay"
            )?.value || 28
        );

    const dueAfterDays =
        Number(
            document
            .getElementById(
                "dueAfterDays"
            )?.value || 15
        );

    /* =========================
       EDIT ACCOUNT
    ========================= */

    if (editingAccountId) {

        const accounts =
            Storage.getAccounts();

        const account =
            accounts.find(
                a => a.id === editingAccountId
            );

        if (!account)
            return;

        account.name =
            accountName;

        account.type =
            accountType;

        account.limit =
            creditLimit;

        account.statementDay =
            statementDay;

        account.dueAfterDays =
            dueAfterDays;

        Storage.saveAccounts(
            accounts
        );

        /* =========================
           UPDATE CREDIT CARD
           STATEMENT SETTINGS
        ========================= */

        if (
            accountType === "creditcard"
        ) {

            const statements =
                Storage.getCardStatements();

            statements.forEach(s => {

                if (
                    s.card === accountName &&
                    s.status !== "Paid"
                ) {

                    const yearMonth =
                        s.month;

                    const statementDate =
                        `${yearMonth}-${String(
                            statementDay
                        ).padStart(2, "0")}`;

                    const dueDate =
                        new Date(
                            statementDate
                        );

                    dueDate.setDate(
                        dueDate.getDate() +
                        dueAfterDays
                    );

                    s.statementDate =
                        statementDate;

                    s.dueDate =
                        dueDate
                        .toISOString()
                        .split("T")[0];

                }

            });

            Storage.saveCardStatements(
                statements
            );

        }

        editingAccountId =
            null;

        loadAccounts();

        App.showToast(
            "Account Updated"
        );

    }

    /* =========================
       ADD ACCOUNT
    ========================= */

    else {

        Storage.addAccount({

            name:
                accountName,

            type:
                accountType,

            limit:
                creditLimit,

            statementDay:
                statementDay,

            dueAfterDays:
                dueAfterDays

        });

        loadAccounts();

        App.showToast(
            "Account Added Successfully"
        );

    }

    /* =========================
       CLEAR FORM
    ========================= */

    document.getElementById(
        "accountName"
    ).value = "";

    document.getElementById(
        "accountType"
    ).value = "bank";

    document.getElementById(
        "creditLimit"
    ).value = "";

    document.getElementById(
        "statementDay"
    ).value = 28;

    document.getElementById(
        "dueAfterDays"
    ).value = 15;

}

    // =========================
    // DELETE ACCOUNT
    // =========================

    function deleteAccount(id) {

        const confirmed =
            confirm(
                "Delete this account?"
            );

        if (!confirmed) return;

        Storage.deleteAccount(id);

        loadAccounts();

        App.showToast(
            "Account Deleted"
        );
    }

    // =========================
    // EVENTS
    // =========================

function bindEvents() {

    document
        .getElementById(
            "saveAccountBtn"
        )
        ?.addEventListener(
            "click",
            addAccount
        );

    document
        .getElementById(
            "accountType"
        )
        ?.addEventListener(
            "change",
            function () {

                document
                    .getElementById(
                        "creditLimitGroup"
                    )
                    .style.display =

                    this.value ===
                    "creditcard"

                        ? "block"
                        : "none";

            }
        );

}
    // =========================
    // PUBLIC API
    // =========================

    return {

        init,

        deleteAccount,
		
		editAccount

    };

})();


// =============================
// AUTO LOAD
// =============================

document.addEventListener(
    "DOMContentLoaded",
    Accounts.init
);