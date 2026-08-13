document.addEventListener(

    "DOMContentLoaded",

    () => {

		loadCardFilter();
        loadPaymentHistory();
		

    }

);


function loadCardFilter() {

    const cards =

        Storage.getAccounts()

        .filter(
            a =>
                a.type ===
                "creditcard"
        );

    const select =

        document.getElementById(
            "filterCard"
        );

    if (!select)
        return;

    select.innerHTML =

        `

        <option value="">
            All Cards
        </option>

    ` +

        cards.map(card => `

            <option
                value="${card.name}"
            >

                ${card.name}

            </option>

        `).join("");

}

function loadPaymentHistory() {

    let payments =

        Storage.getCardPayments();

    const card =

        document.getElementById(
            "filterCard"
        )?.value || "";

    const month =

        document.getElementById(
            "filterMonth"
        )?.value || "";

    const fromDate =

        document.getElementById(
            "filterFromDate"
        )?.value || "";

    const toDate =

        document.getElementById(
            "filterToDate"
        )?.value || "";

    /* =====================
       FILTERS
    ===================== */

    if (card) {

        payments =

            payments.filter(

                p =>

                    p.card === card

            );

    }

    if (month) {

        payments =

            payments.filter(

                p =>

                    p.statementMonth ===
                    month

            );

    }

    if (fromDate) {

        payments =

            payments.filter(

                p =>

                    p.paymentDate >=
                    fromDate

            );

    }

    if (toDate) {

        payments =

            payments.filter(

                p =>

                    p.paymentDate <=
                    toDate

            );

    }

    /* =====================
       SUMMARY
    ===================== */

    const totalPayment =

        payments.reduce(

            (sum, p) =>

                sum +

                Number(
                    p.amount || 0
                ),

            0

        );
	

	document.getElementById(
		"paymentHistoryTotal"
	).textContent =

		App.formatCurrency(
			totalPayment
		);	

    document.getElementById(
        "totalPaymentAmount"
    ).textContent =

        App.formatCurrency(
            totalPayment
        );

    document.getElementById(
        "totalPaymentCount"
    ).textContent =

        payments.length;

    /* =====================
       TABLE
    ===================== */

    const tbody =

        document.getElementById(
            "paymentHistoryTable"
        );

    if (

        payments.length === 0

    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    No Payment History Found

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =

        payments

        .sort(

            (a, b) =>

                new Date(
                    b.paymentDate
                ) -

                new Date(
                    a.paymentDate
                )

        )

        .map(p => `

            <tr>

                <td>
                    ${p.paymentDate}
                </td>

                <td>
                    ${p.card}
                </td>

                <td>
                    ${p.statementMonth}
                </td>

                <td>
                    ${App.formatCurrency(
                        p.amount
                    )}
                </td>

                <td>
                    ${p.account}
                </td>

            </tr>

        `)

        .join("");

}


function resetPaymentFilters() {

    document.getElementById(
        "filterCard"
    ).value = "";

    document.getElementById(
        "filterMonth"
    ).value = "";

    document.getElementById(
        "filterFromDate"
    ).value = "";

    document.getElementById(
        "filterToDate"
    ).value = "";

    loadPaymentHistory();

}

window.resetPaymentFilters =
    resetPaymentFilters;


