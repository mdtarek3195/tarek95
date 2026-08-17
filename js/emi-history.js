document.addEventListener(

    "DOMContentLoaded",

    () => {
		
		loadEmiHistoryYears();
        loadEmiHistory();

    }

);


function loadEmiHistory() {

    const search =

        document.getElementById(
            "emiHistorySearch"
        )?.value
        .toLowerCase() || "";

    const status =

        document.getElementById(
            "emiHistoryStatus"
        )?.value || "all";

    const year =

        document.getElementById(
            "emiHistoryYear"
        )?.value || "all";

    const history =

        Storage.getEmiHistory()

        .filter(emi => {

            const matchesSearch =

                emi.item
                ?.toLowerCase()
                .includes(search);

            const matchesStatus =

                status === "all"

                ||

                emi.status ===
                status;

            const emiYear =

                (
                    emi.completedDate ||

                    emi.archivedAt ||

                    ""
                )

                .substring(0, 4);

            const matchesYear =

                year === "all"

                ||

                emiYear === year;

            return (

                matchesSearch &&

                matchesStatus &&

                matchesYear

            );

        })

        .sort(

            (a, b) =>

                new Date(

                    b.completedDate ||

                    b.archivedAt ||

                    0

                )

                -

                new Date(

                    a.completedDate ||

                    a.archivedAt ||

                    0

                )

        );

    const tbody =

        document.getElementById(
            "emiHistoryTable"
        );

    if (
        !tbody
    ) return;

    if (
        history.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7">

                    No Archived EMI Found.

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =

        history.map(emi => `

            <tr>

                <td>
                    ${emi.item}
                </td>

                <td>
                    ${emi.card}
                </td>

                <td>
                    ${App.formatCurrency(
                        emi.totalAmount
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        emi.emiAmount
                    )}
                </td>

                <td>
                    ${emi.months}
                </td>

                <td>

                    <span class="badge">

                        ${emi.status}

                    </span>

                </td>

                <td>

                    <button
                        class="btn btn-success btn-sm"
                        onclick="restoreEmi(${emi.id})"
                    >

                        Restore

                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="deleteHistoryEmi(${emi.id})"
                    >

                        Delete

                    </button>

                </td>

            </tr>

        `).join("");

}



window.loadEmiHistory =
    loadEmiHistory;
	
	
function loadEmiHistoryYears() {

    const history =

        Storage.getEmiHistory();

    const years = [

        ...new Set(

            history.map(

                emi =>

                    (
                        emi.completedDate ||

                        emi.archivedAt ||

                        ""
                    )

                    .substring(0, 4)

            )

        )

    ]

    .filter(Boolean)

    .sort()

    .reverse();

    const select =

        document.getElementById(
            "emiHistoryYear"
        );

    if (!select)
        return;

    select.innerHTML =

        `<option value="all">
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
	
	

function restoreEmi(id) {

    const history =

        Storage.getEmiHistory();

    const emi =

        history.find(
            e => e.id === id
        );

    if (!emi)
        return;

    const active =

        Storage.getEmiPurchases();

    active.push({

        ...emi,

        status: "active"

    });

    Storage.saveEmiPurchases(
        active
    );

    Storage.saveEmiHistory(

        history.filter(
            e => e.id !== id
        )

    );

    loadEmiHistory();

    App.showToast(
        "EMI Restored"
    );

}

window.restoreEmi =
    restoreEmi;
	

function deleteHistoryEmi(id) {

    if (

        !confirm(
            "Delete Permanently?"
        )

    ) return;

    const history =

        Storage.getEmiHistory();

    Storage.saveEmiHistory(

        history.filter(
            e => e.id !== id
        )

    );

    loadEmiHistory();

    App.showToast(
        "Deleted Permanently"
    );

}

window.deleteHistoryEmi =
    deleteHistoryEmi;