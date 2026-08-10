/* ==========================================
   Expense Manager Pro
   File: js/accounts.js
   ========================================== */

const Accounts = (() => {

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
            accounts.reduce(
                (sum, account) =>
                    sum + (account.balance || 0),
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

    tbody.innerHTML = "";

    accounts.forEach(account => {

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
                ${App.formatCurrency(
                    account.balance || 0
                )}
            </td>

            <td>

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
            )
            ?.value || 0
        );

    Storage.addAccount({

        name:
            accountName,

        type:
            accountType,

        limit:
            creditLimit

    });

    loadAccounts();

    App.showToast(
        "Account Added Successfully"
    );

}

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

    tbody.innerHTML = "";

    accounts.forEach(account => {

        let balanceHtml = "";

        if (

            account.type ===
            "creditcard"

        ) {

            const used =

                account.balance || 0;

            const limit =

                account.limit || 0;

            const available =

                limit - used;

            balanceHtml = `

                <div>

                    <strong>
                        Limit:
                    </strong>

                    ${App.formatCurrency(limit)}

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

            </td>

            <td>

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

        deleteAccount

    };

})();


// =============================
// AUTO LOAD
// =============================

document.addEventListener(
    "DOMContentLoaded",
    Accounts.init
);