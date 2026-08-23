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
        Storage.getCardPayments() || [];


    const statements =
        Storage.getCardStatements() || [];


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


    if (!tbody)
        return;


    if (
        payments.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="10">

                    No Payment History Found

                </td>

            </tr>

        `;

        return;

    }


    /* =====================
       SORT
    ===================== */

    payments.sort(
        (a, b) => {

            const dateCompare =
                new Date(
                    b.paymentDate
                ) -
                new Date(
                    a.paymentDate
                );


            if (
                dateCompare !== 0
            ) {

                return dateCompare;

            }


            return (
                Number(b.id || 0) -
                Number(a.id || 0)
            );

        }
    );


    /* =====================
       RENDER
    ===================== */

    tbody.innerHTML =

        payments
        .map(p => {


            /* =====================
               FIND STATEMENT
            ===================== */

            const statement =
                statements.find(
                    s =>
                        Number(
                            s.id
                        ) ===
                        Number(
                            p.statementId
                        )
                );


            /* =====================
               STATEMENT TOTAL
            ===================== */

            const statementTotal =
                Number(
                    statement?.totalAmount ||
                    statement?.statementTotal ||
                    statement?.amount ||
                    0
                );


            /* =====================
               PAID
            ===================== */

            const paid =
                Number(
                    p.amount || 0
                );


            /* =====================
               DUE
            ===================== */

            const due =
                Math.max(
                    0,
                    Number(
                        (
                            statementTotal -
                            paid
                        ).toFixed(2)
                    )
                );


            /* =====================
               EMI DATA
               (Existing Columns)
            ===================== */

            const emiItems =
                Array.isArray(
                    p.emiItems
                )
                    ? p.emiItems
                    : [];


            const emiItem =
                emiItems
                .map(
                    e =>
                        e.item
                )
                .join(", ") ||
                "-";


            const emiType =
                emiItems
                .map(
                    e =>
                        e.type
                )
                .join(", ") ||
                "-";


            const emiTotalAmount =
                Number(
                    emiItems?.[0]
                    ?.totalAmount ||
                    0
                );


            const emiRemainingAmount =
                Number(
                    emiItems?.[0]
                    ?.remainingAmount ||
                    0
                );


            return `

                <tr>

                    <!-- DATE -->

                    <td>

                        ${
                            p.paymentDate
                                ? formatDate(
                                    p.paymentDate
                                )
                                : "-"
                        }

                    </td>


                    <!-- CARD -->

                    <td>

                        ${
                            p.card ||
                            "-"
                        }

                    </td>


                    <!-- STATEMENT MONTH -->

                    <td>

                        ${
                            p.statementMonth
                                ? formatStatementMonth(
                                    p.statementMonth
                                )
                                : "-"
                        }

                    </td>







                    <!-- STATEMENT TOTAL -->

                    <td>

                        ${
                            App.formatCurrency(
                                statementTotal
                            )
                        }

                    </td>


 


                    <!-- PAID -->

                    <td>

                        ${
                            App.formatCurrency(
                                paid
                            )
                        }

                    </td>


                    <!-- ACCOUNT -->

                    <td>

                        ${
                            p.account ||
                            "-"
                        }

                    </td>


                    <!-- DELETE -->

                    <td>

                        <button

                            class="btn btn-danger btn-sm"

                            onclick="
                                deletePayment(
                                    ${p.id}
                                )
                            "

                        >

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        })
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


    /* =====================
       Find Payment Transactions
    ===================== */

    const transactions =
        Storage.getTransactions();

    const paymentTransactions =
        transactions.filter(
            t =>
                t.paymentId ===
                payment.id
        );


    /* =====================
       Calculate EMI Expense
       To Rollback
    ===================== */

    const emiExpenseDeleted =
        paymentTransactions
            .filter(
                t =>
                    t.type === "expense" &&
                    t.isCreditCardEMI === true
            )
            .reduce(
                (sum, t) =>
                    sum +
                    Number(
                        t.amount || 0
                    ),
                0
            );


    /* =====================
       Restore Statement
    ===================== */

    if (statement) {

        statement.paid =
            Number(
                (
                    Number(
                        statement.paid || 0
                    ) -
                    Number(
                        payment.amount || 0
                    )
                ).toFixed(2)
            );


        if (statement.paid < 0) {
            statement.paid = 0;
        }


        statement.remaining =
            Number(
                (
                    Number(
                        statement.amount || 0
                    ) -
                    statement.paid
                ).toFixed(2)
            );


        /* =====================
           Restore EMI Paid
        ===================== */

        if (emiExpenseDeleted > 0) {

            statement.emiPaid =
                Number(
                    Math.max(
                        0,
                        Number(
                            statement.emiPaid || 0
                        ) -
                        emiExpenseDeleted
                    ).toFixed(2)
                );

        }


        /* =====================
           Restore Status
        ===================== */

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
    }


    /* =====================
       Remove Payment Transactions
       
       Includes:
       1. credit_card_payment
       2. Credit Card EMI expense
    ===================== */

    Storage.saveTransactions(

        transactions.filter(

            t =>
                t.paymentId !==
                payment.id

        )

    );


    /* =====================
       Remove Payment Record
    ===================== */

    Storage.saveCardPayments(

        payments.filter(

            p =>
                p.id !== id

        )

    );


    /* =====================
       Refresh UI
    ===================== */

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


