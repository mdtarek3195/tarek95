let creditReportChart = null;
let outstandingTrendChart = null;

document.addEventListener(

    "DOMContentLoaded",

    () => {

        loadReportCards();

        setDefaultMonth();

        generateCreditReport();

    }

);

function loadReportCards() {

    const cards =

        Storage.getAccounts()

        .filter(

            a =>

                a.type ===
                "creditcard"

        );

    const select =

        document.getElementById(
            "reportCard"
        );

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

function setDefaultMonth() {

    const monthInput =

        document.getElementById(
            "reportMonth"
        );

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(

            today.getMonth() + 1

        ).padStart(
            2,
            "0"
        );

    monthInput.value =

        `${year}-${month}`;

}


function generateCreditReport() {

    const card =

        document.getElementById(
            "reportCard"
        ).value;

    const month =

        document.getElementById(
            "reportMonth"
        ).value;
		
	const fromDate =
		document.getElementById(
			"reportFromDate"
		).value;

	const toDate =
		document.getElementById(
			"reportToDate"
		).value;

	if (

		!month &&

		!(fromDate && toDate)

	) {

		alert(

			"Select Month or Date Range"

		);

		return;

	}

    /* =====================
       PURCHASE
    ===================== */

let purchases =

    Storage.getTransactions()

    .filter(
        t =>
            t.type ===
            "expense"
    );

if (card) {

    purchases =
        purchases.filter(
            t =>
                t.account ===
                card
        );

}

if (
    fromDate &&
    toDate
) {

    purchases =
        purchases.filter(

            t =>

                t.date >=
                fromDate &&

                t.date <=
                toDate

        );

}

else if (month) {

    purchases =
        purchases.filter(

            t =>

                t.date.startsWith(
                    month
                )

        );

}

    if (card) {

        purchases =

            purchases.filter(

                t =>

                    t.account === card

            );

    }

    const purchaseAmount =

        purchases.reduce(

            (sum, t) =>

                sum +

                Number(
                    t.amount || 0
                ),

            0

        );

    /* =====================
       EMI
    ===================== */

    let emis =

        Storage.getEmiPurchases()

        .filter(

            e =>

                e.status !==
                "completed"

        );

    if (card) {

        emis =

            emis.filter(

                e =>

                    e.card === card

            );

    }

    const emiAmount =

        emis.reduce(

            (sum, e) =>

                sum +

                Number(
                    e.emiAmount || 0
                ),

            0

        );

    /* =====================
       PAYMENT
    ===================== */

let payments =
    Storage.getCardPayments();

if (card) {

    payments =
        payments.filter(
            p =>
                p.card ===
                card
        );

}

if (
    fromDate &&
    toDate
) {

    payments =
        payments.filter(

            p =>

                p.paymentDate >=
                fromDate &&

                p.paymentDate <=
                toDate

        );

}

else if (month) {

    payments =
        payments.filter(

            p =>

                p.paymentDate.startsWith(
                    month
                )

        );

}

    if (card) {

        payments =

            payments.filter(

                p =>

                    p.card === card

            );

    }

    const paymentAmount =

        payments.reduce(

            (sum, p) =>

                sum +

                Number(
                    p.amount || 0
                ),

            0

        );

    /* =====================
       OUTSTANDING
    ===================== */

    let statements =

        Storage.getCardStatements()

        .filter(

            s =>

                s.status !==
                "Paid"

        );

    if (card) {

        statements =

            statements.filter(

                s =>

                    s.card === card

            );

    }

    const outstanding =

        statements.reduce(

            (sum, s) =>

                sum +

                Number(
                    s.remaining || 0
                ),

            0

        );

    /* =====================
       UI UPDATE
    ===================== */

    document.getElementById(
        "reportPurchase"
    ).textContent =

        App.formatCurrency(
            purchaseAmount
        );

    document.getElementById(
        "reportEMI"
    ).textContent =

        App.formatCurrency(
            emiAmount
        );

    document.getElementById(
        "reportPayment"
    ).textContent =

        App.formatCurrency(
            paymentAmount
        );

    document.getElementById(
        "reportOutstanding"
    ).textContent =

        App.formatCurrency(
            outstanding
        );

    renderCreditReportChart(

        purchaseAmount,

        paymentAmount,

        emiAmount

    );
	
	renderOutstandingTrend(card);


}


function renderOutstandingTrend(
    card
) {

    let statements =

        Storage.getCardStatements();

    if (card) {

        statements =

            statements.filter(

                s =>

                    s.card === card

            );

    }

    statements.sort(

        (a, b) =>

            a.month.localeCompare(
                b.month
            )

    );
	statements =

    statements.slice(-12);

    const labels =

        statements.map(
            s => s.month
        );

    const data =

        statements.map(

            s =>

                Number(
                    s.remaining || 0
                )

        );

    const ctx =

        document.getElementById(
            "outstandingTrendChart"
        );

    if (!ctx)
        return;

    if (

        outstandingTrendChart

    ) {

        outstandingTrendChart.destroy();

    }

    outstandingTrendChart =

        new Chart(

            ctx,

            {

                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Outstanding",

                            data,

                            tension: 0.3,

                            fill: false

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }

        );

}



function renderCreditReportChart(

    purchase,

    payment,

    emi

) {

    const ctx =

        document.getElementById(
            "creditReportChart"
        );

    if (!ctx)
        return;

    if (

        creditReportChart

    ) {

        creditReportChart.destroy();

    }

    creditReportChart =

        new Chart(

            ctx,

            {

                type: "bar",

                data: {

                    labels: [

                        "Purchase",

                        "Payment",

                        "EMI"

                    ],

                    datasets: [

                        {

                            label:
                                "Amount",

                            data: [

                                purchase,

                                payment,

                                emi

                            ]

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }

        );

}