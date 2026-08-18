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

			(a, b) => {

				const dateCompare =

					new Date(
						b.paymentDate
					) -

					new Date(
						a.paymentDate
					);

				if (dateCompare !== 0) {

					return dateCompare;

				}

				return b.id - a.id;

			}

		)

        .map(p => `


			<tr>

				<td>${formatDate(p.paymentDate)}</td>

				<td>${p.card}</td>

				<td>${formatStatementMonth(p.statementMonth)}</td>

				<td>

					${

						p.emiItems

						?.map(

							e => e.item

						)

						.join(", ")

						|| "-"

					}

				</td>

				<td>

					${

						p.emiItems

						?.map(

							e => e.type

						)

						.join(", ")

						|| "-"

					}

				</td>
				
				<td>

					${App.formatCurrency(

						p.emiItems?.[0]
						?.totalAmount || 0

					)}

				</td>

				<td>

					${App.formatCurrency(

						p.emiItems?.[0]
						?.remainingAmount || 0

					)}

				</td>

				<td>

					${App.formatCurrency(
						p.amount
					)}

				</td>

				<td>${p.account}</td>

				<td>

					<button

						class="btn btn-danger btn-sm"

						onclick="deletePayment(${p.id})"

					>

						Delete

					</button>

				</td>

			</tr>


        `)

        .join("");

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



function formatStatementMonth(month) {

    const [year, mon] =
        month.split("-");

    const months = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",

        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

    ];

    return `${months[
        Number(mon) - 1
    ]}-${year}`;

}












function deletePayment(id) {

    const payments =

        Storage.getCardPayments();

    const payment =

        payments.find(
            p => p.id === id
        );

    if (!payment)
        return;

    if (

        !confirm(
            "Delete this payment?"
        )

    ) return;

    /* =====================
       Reverse Account Balance
    ===================== */

    Storage.updateAccountBalance(

        payment.account,

        payment.amount,

        "income"

    );

    /* =====================
       Restore Statement
    ===================== */

    const statements =

        Storage.getCardStatements();

    const statement =

        statements.find(

            s =>

                s.id ===
                payment.statementId

        );

    if (statement) {

        statement.paid = Number(

            (
                Number(
                    statement.paid || 0
                ) -

                Number(
                    payment.amount || 0
                )

            ).toFixed(2)

        );

        statement.remaining = Number(

            (
                Number(
                    statement.amount || 0
                ) -

                statement.paid

            ).toFixed(2)

        );

        if (

            statement.paid <= 0

        ) {

            statement.paid = 0;

            statement.status =
                "Unpaid";

        }

        else {

            statement.status =
                "Partial";

        }

        Storage.saveCardStatements(
            statements
        );



				
		/* =====================
		   Remove Auto Transaction
		===================== */

		const transactions =
			Storage.getTransactions();

		Storage.saveTransactions(

			transactions.filter(

				t =>

					t.paymentId !==
					payment.id

			)

		);

			}

    /* =====================
       Remove Payment Record
    ===================== */

    Storage.saveCardPayments(

        payments.filter(

            p => p.id !== id

        )

    );

    loadPaymentHistory();

    loadSummary();

    renderCards();

    App.showToast(
        "Payment Deleted"
    );

}

window.deletePayment =
    deletePayment;



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


