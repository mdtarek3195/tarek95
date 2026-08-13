document.addEventListener(
    "DOMContentLoaded",
    () => {
        loadStatementHistory();
    }
);

function loadStatementHistory() {

    const history =
        Storage.getStatementHistory();

    const tbody =
        document.getElementById(
            "statementHistoryTable"
        );

    if (
        !history ||
        history.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No History Found
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
                    ${new Date(
                        item.archivedAt
                    ).toLocaleDateString()}
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