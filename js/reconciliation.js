document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAccounts();

        loadReconciliationAccountFilter();

        loadReconciliationHistory();

    }
);

function loadAccounts() {

    const accounts =

        Storage.getAccounts()

        .filter(

            a =>

                a.type !==
                "creditcard"

        );

    const select =

        document.getElementById(
            "reconAccount"
        );

    select.innerHTML = "";

    accounts.forEach(account => {

        select.innerHTML += `

            <option value="${account.name}">

                ${account.name}

            </option>

        `;

    });

    if(accounts.length){

        updateAppBalance();

    }

    select.addEventListener(

        "change",

        updateAppBalance

    );

}



function loadReconciliationAccountFilter() {

    const accounts =

        Storage.getAccounts()
        .filter(
            a => a.type !== "creditcard"
        );

    const select =
        document.getElementById(
            "reconHistoryAccount"
        );

    if (!select) return;

    select.innerHTML = `

        <option value="all">
            All Accounts
        </option>

    `;

    accounts.forEach(account => {

        select.innerHTML += `

            <option value="${account.name}">
                ${account.name}
            </option>

        `;

    });

    select.addEventListener(
        "change",
        loadReconciliationHistory
    );

}




function updateAppBalance() {

    const accountName =

        document.getElementById(
            "reconAccount"
        ).value;

    const account =

        Storage.getAccounts()

        .find(

            a =>

                a.name ===
                accountName

        );

    document.getElementById(
        "appBalance"
    ).value =

        account
            ? account.balance
            : 0;

}

function calculateDifference() {

    const appBalance =

        Number(

            document.getElementById(
                "appBalance"
            ).value

        );

    const actualBalance =

        Number(

            document.getElementById(
                "actualBalance"
            ).value

        );

    const diff =

        actualBalance -
        appBalance;

    document.getElementById(
        "difference"
    ).value =

        diff.toFixed(2);

}



function adjustBalance() {
	
		const actualBalance =

    Number(

        document.getElementById(
            "actualBalance"
        ).value

    );

    const accountName =

        document.getElementById(
            "reconAccount"
        ).value;

    const diff =

        Number(

            document.getElementById(
                "difference"
            ).value

        );

    if(diff === 0){

        App.showToast(
            "Already Matched"
        );

        return;

    }

    const accounts =

        Storage.getAccounts();

    const account =

        accounts.find(

            a =>

                a.name ===
                accountName

        );

    if(!account) return;

    account.balance += diff;

    Storage.saveAccounts(
        accounts
    );

    Storage.addTransaction({

        type:

            diff > 0
                ? "income"
                : "expense",

        date:

            new Date()
            .toISOString()
            .split("T")[0],

        category:

            "Reconciliation",

        account:

            accountName,

        amount:

            Math.abs(diff),

        note:

            "Balance Adjustment"

    });
	

	
	const history =

		JSON.parse(

			localStorage.getItem(
				"reconciliationHistory"
			)

		) || [];

history.push({

    id: Date.now(),

    account: accountName,

    appBalance:

        account.balance - diff,

    actualBalance:

        actualBalance,

    difference:

        diff,

    date:

        new Date()
        .toISOString()
        .split("T")[0]

});

	localStorage.setItem(

		"reconciliationHistory",

		JSON.stringify(history)

	);


    updateAppBalance();

    document.getElementById(
        "actualBalance"
    ).value = "";

    document.getElementById(
        "difference"
    ).value = "";

    App.showToast(
        "Balance Adjusted"
    );

}

function loadReconciliationHistory() {

    const history =
        JSON.parse(
            localStorage.getItem(
                "reconciliationHistory"
            )
        ) || [];

    const tbody =
        document.getElementById(
            "reconHistoryBody"
        );

    const selectedAccount =
        document.getElementById(
            "reconHistoryAccount"
        )?.value || "all";


    // =========================
    // Filter by Account
    // =========================

    const filteredHistory =
        history.filter(item => {

            return (
                selectedAccount === "all" ||
                item.account === selectedAccount
            );

        });


    // =========================
    // No History
    // =========================

    if (filteredHistory.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    No History Found

                </td>

            </tr>

        `;

        return;

    }


    // =========================
    // Latest Entry First
    // =========================

    const sortedHistory =
        [...filteredHistory].sort(
            (a, b) => b.id - a.id
        );


    // =========================
    // Render Table
    // =========================

    tbody.innerHTML =

        sortedHistory.map(item => `

            <tr>

                <td>
                    ${item.date}
                </td>

                <td>
                    ${item.account}
                </td>

                <td>
                    ${App.formatCurrency(
                        item.appBalance || 0
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        item.actualBalance || 0
                    )}
                </td>

                <td
                    style="
                        color: ${
                            item.difference < 0
                                ? '#dc2626'
                                : '#16a34a'
                        };
                        font-weight: 600;
                    "
                >
                    ${
                        item.difference > 0
                            ? '+'
                            : ''
                    }

                    ${App.formatCurrency(
                        item.difference || 0
                    )}
                </td>

            </tr>

        `).join("");

}