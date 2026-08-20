/* ==========================================
   Expense Manager Pro
   File: js/recurring.js
   ========================================== */

const Recurring = (() => {

function init() {

    loadAccounts();

    loadCategories();

    loadRecurring();

    document
    .getElementById(
        "recurringType"
    )
    .addEventListener(
        "change",
        loadCategories
    );

    document.getElementById(
        "recurringStartDate"
    ).value =
        new Date()
        .toISOString()
        .split("T")[0];

}

    // =========================
    // LOAD ACCOUNTS
    // =========================

    function loadAccounts() {

        const accounts =
            Storage.getAccounts();

        const dropdown =
            document.getElementById(
                "recurringAccount"
            );

        if (!dropdown)
            return;

        dropdown.innerHTML = "";

        accounts.forEach(account => {

            dropdown.innerHTML += `

                <option value="${account.name}">
                    ${account.name}
                </option>

            `;

        });

    }
	
	
function loadCategories() {

    const selectedType =
        document.getElementById(
            "recurringType"
        ).value;

    const categories =
        Storage.getCategories();

    const dropdown =
        document.getElementById(
            "recurringCategory"
        );

    dropdown.innerHTML = "";

    categories
    .filter(
        c =>
            c.type === selectedType
    )
    .forEach(cat => {

        dropdown.innerHTML += `

            <option value="${cat.name}">
                ${cat.name}
            </option>

        `;

    });

}

    // =========================
    // SAVE
    // =========================

    function saveRecurring() {

        const type =
            document.getElementById(
                "recurringType"
            ).value;

        const category =
            document.getElementById(
                "recurringCategory"
            ).value;

        const account =
            document.getElementById(
                "recurringAccount"
            ).value;

        const amount =
            Number(
                document.getElementById(
                    "recurringAmount"
                ).value
            );

        const frequency =
            document.getElementById(
                "recurringFrequency"
            ).value;

        const startDate =
            document.getElementById(
                "recurringStartDate"
            ).value;

        const note =
            document.getElementById(
                "recurringNote"
            ).value;

        if (
            !category ||
            !amount
        ) {

            alert(
                "Please enter category and amount."
            );

            return;
        }

        Storage.addRecurring({

            type,

            category,

            account,

            amount,

            frequency,

            startDate,

            note,

            createdAt:
                new Date()
                .toISOString()

        });

        loadRecurring();

        clearForm();

    }

    // =========================
    // LOAD TABLE
    // =========================

    function loadRecurring() {

        const recurring =
            Storage.getRecurring();

        const tbody =
            document.getElementById(
                "recurringTableBody"
            );

        if (!tbody)
            return;

        tbody.innerHTML = "";

        recurring.forEach(item => {

            tbody.innerHTML += `

                <tr>

                    <td>
                        ${capitalize(
                            item.type
                        )}
                    </td>

                    <td>
                        ${item.category}
                    </td>

                    <td>
                        ${item.account}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            item.amount
                        )}
                    </td>

                    <td>
                        ${capitalize(
                            item.frequency
                        )}
                    </td>

                    <td>
                        ${App.formatDate(
                            item.startDate
                        )}
                    </td>

                    <td>

                        <button
                            class="btn btn-danger"
                            onclick="Recurring.deleteRecurring(${item.id})">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        });

    }

    // =========================
    // DELETE
    // =========================

    function deleteRecurring(id) {

        if (
            !confirm(
                "Delete recurring transaction?"
            )
        ) {

            return;
        }

        Storage.deleteRecurring(
            id
        );

        loadRecurring();

    }

    // =========================
    // CLEAR
    // =========================

    function clearForm() {

        document.getElementById(
            "recurringCategory"
        ).value = "";

        document.getElementById(
            "recurringAmount"
        ).value = "";

        document.getElementById(
            "recurringNote"
        ).value = "";

    }

    // =========================
    // HELPER
    // =========================

    function capitalize(text) {

        if (!text)
            return "";

        return text.charAt(0)
            .toUpperCase()
            +
            text.slice(1);

    }

    // =========================
    // PUBLIC
    // =========================

    return {

        init,

        saveRecurring,

        deleteRecurring

    };

})();

document.addEventListener(

    "DOMContentLoaded",

    Recurring.init

);