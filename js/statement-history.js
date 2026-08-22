document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadStatementHistory();
		loadHistoryFilters();
    }
);

function loadStatementHistory() {
	
let history =
    Storage.getStatementHistory();

const cardFilter =

    document.getElementById(
        "historyCardFilter"
    )?.value || "";

const statusFilter =

    document.getElementById(
        "historyStatusFilter"
    )?.value || "";

const yearFilter =

    document.getElementById(
        "historyYearFilter"
    )?.value || "";

const fromDate =

    document.getElementById(
        "historyFromDate"
    )?.value || "";

const toDate =

    document.getElementById(
        "historyToDate"
    )?.value || "";	
	

    const tbody =
        document.getElementById(
            "statementHistoryTable"
        );

if (cardFilter) {

    history = history.filter(

        h => h.card === cardFilter

    );

}

if (statusFilter) {

    history = history.filter(

        h => h.status === statusFilter

    );

}

if (yearFilter) {

    history = history.filter(

        h =>

            h.statementDate?.startsWith(
                yearFilter
            )

    );

}

if (fromDate) {

    history = history.filter(

        h =>

            h.statementDate >= fromDate

    );

}

if (toDate) {

    history = history.filter(

        h =>

            h.statementDate <= toDate

    );

}   


   if (
        !history ||
        history.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No Archived Statements Found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        history.map(item => `

            <tr>

                <td>${item.card}</td>

                <td>${item.month}</td>

                <td>
                    ${App.formatCurrency(item.amount)}
                </td>

                <td>${item.status}</td>

                <td>
                 ${formatDate(new Date(
                        item.archivedAt
                    ).toLocaleDateString())}
                </td>

                <td>
					
                    <button
                        class="btn btn-success"
                        onclick="restoreStatement(${item.id})"
                    >
                        Restore
                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="deleteHistoryStatement(${item.id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `).join("");
}


function resetStatementHistoryFilters() {

    document.getElementById(
        "historyCardFilter"
    ).value = "";

    document.getElementById(
        "historyStatusFilter"
    ).value = "";

    document.getElementById(
        "historyYearFilter"
    ).value = "";

    document.getElementById(
        "historyFromDate"
    ).value = "";

    document.getElementById(
        "historyToDate"
    ).value = "";

    loadStatementHistory();

}



//Date format
function formatDate(dateStr) {

    const date =
        new Date(dateStr);

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const year =
        date.getFullYear();

    return `${day}-${month}-${year}`;

}








function loadHistoryFilters() {

    const history =

        Storage.getStatementHistory();

    const cardSelect =

        document.getElementById(
            "historyCardFilter"
        );

    const yearSelect =

        document.getElementById(
            "historyYearFilter"
        );

    if (!history)
        return;

    const cards = [

        ...new Set(

            history.map(
                h => h.card
            )

        )

    ];

    cardSelect.innerHTML =

        `<option value="">
            All Cards
        </option>`

        +

        cards.map(

            c =>

                `<option value="${c}">
                    ${c}
                </option>`

        ).join("");

    const years = [

        ...new Set(

            history.map(

                h =>

                    h.statementDate
                    ?.substring(0, 4)

            )

        )

    ]

    .filter(Boolean)

    .sort()

    .reverse();

    yearSelect.innerHTML =

        `<option value="">
            All Years
        </option>`

        +

        years.map(

            y =>

                `<option value="${y}">
                    ${y}
                </option>`

        ).join("");

}


function restoreStatement(id) {

    const history =
        Storage.getStatementHistory();

    const statement =
        history.find(
            s => s.id === id
        );

    if (!statement)
        return;

    const active =
        Storage.getCardStatements();

    active.push({
        ...statement
    });

    Storage.saveCardStatements(
        active
    );

    Storage.saveStatementHistory(
        history.filter(
            s => s.id !== id
        )
    );

    loadStatementHistory();

    App.showToast(
        "Statement Restored"
    );
}

function deleteHistoryStatement(id) {

    if (
        !confirm(
            "Delete Permanently?"
        )
    ) return;

    const history =
        Storage.getStatementHistory();

    Storage.saveStatementHistory(
        history.filter(
            s => s.id !== id
        )
    );

    loadStatementHistory();

    App.showToast(
        "Deleted Permanently"
    );
}

/* ==========================
   WINDOW EXPORT
========================== */

window.loadStatementHistory =
    loadStatementHistory;

window.restoreStatement =
    restoreStatement;

window.deleteHistoryStatement =
    deleteHistoryStatement;