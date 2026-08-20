let creditReportChart = null;
let outstandingTrendChart = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadReportCards();

    setDefaultMonth();

    generateCreditReport();

});


/* =========================================================
   LOAD CREDIT CARDS
========================================================= */

function loadReportCards() {

    const cards =
        Storage.getAccounts()
        .filter(
            a =>
                String(a.type)
                    .toLowerCase()
                    .replaceAll(" ", "") ===
                "creditcard"
        );

    const select =
        document.getElementById("reportCard");

    if (!select) return;

    select.innerHTML =
        `<option value="">All Cards</option>` +

        cards.map(card => `
            <option value="${card.name}">
                ${card.name}
            </option>
        `).join("");

}


/* =========================================================
   DEFAULT MONTH
========================================================= */

function setDefaultMonth() {

    const monthInput =
        document.getElementById("reportMonth");

    if (!monthInput) return;

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    monthInput.value =
        `${year}-${month}`;

}


/* =========================================================
   GET CREDIT CARD ACCOUNTS
========================================================= */

function getCreditCards() {

    return Storage.getAccounts()
        .filter(
            a =>
                String(a.type)
                    .toLowerCase()
                    .replaceAll(" ", "") ===
                "creditcard"
        );

}


/* =========================================================
   GET EMI STATEMENT PERIOD
========================================================= */

function getEMIStatementPeriod(emi) {

    const purchaseDate =
        new Date(emi.startDate);

    if (
        isNaN(
            purchaseDate.getTime()
        )
    ) {

        return null;

    }


    const cardInfo =
        Storage.getAccounts()
        .find(
            c =>
                c.name === emi.card
        );


    /*
       User's saved Statement Day.

       Example:

       Purchase = 15-Jul-2026
       Statement Day = 5

       15 > 5

       First EMI Statement =
       Aug-2026
    */

    const statementDay =
        Number(
            cardInfo?.statementDay || 5
        );


    let firstStatementDate =
        new Date(purchaseDate);


    if (
        purchaseDate.getDate() >
        statementDay
    ) {

        firstStatementDate.setMonth(
            firstStatementDate.getMonth() + 1
        );

    }


    /*
       Normalize to first day
       of statement month
    */

    firstStatementDate =
        new Date(
            firstStatementDate.getFullYear(),
            firstStatementDate.getMonth(),
            1
        );


    /*
       Last EMI statement
    */

    const lastStatementDate =
        new Date(
            firstStatementDate
        );


    lastStatementDate.setMonth(

        lastStatementDate.getMonth() +

        Number(
            emi.months || 0
        ) -

        1

    );


    return {

        firstStatementDate,

        lastStatementDate

    };

}


/* =========================================================
   GET EMI FOR SELECTED MONTH
========================================================= */

function getEMIAmountForMonth(
    card,
    month
) {

    let total = 0;


    /*
       -----------------------------------------------------
       1. FIRST: Check already generated statement
       -----------------------------------------------------

       This is important for historical reports.

       Even if EMI is now completed,
       its old statement still contains emiDetails.
    */

    let statements =
        Storage.getCardStatements();


    statements =
        statements.filter(
            s =>
                s.month === month &&
                (!card || s.card === card)
        );


    statements.forEach(statement => {

        if (
            Array.isArray(
                statement.emiDetails
            )
        ) {

            statement.emiDetails.forEach(
                emi => {

                    total += Number(
                        emi.amount || 0
                    );

                }
            );

        }

    });


    /*
       If statement already contains EMI,
       return that historical EMI amount.
    */

    if (total > 0) {

        return total;

    }


    /*
       -----------------------------------------------------
       2. CURRENT / FUTURE EMI
       -----------------------------------------------------
    */

    let emis =
        Storage.getEmiPurchases();


    emis =
        emis.filter(emi => {

            /*
               Card filter
            */

            if (
                card &&
                emi.card !== card
            ) {

                return false;

            }


            /*
               Completed EMI is ignored here
               because historical completed EMI
               is already handled above.
            */

            if (
                emi.status === "completed"
            ) {

                return false;

            }


            const period =
                getEMIStatementPeriod(emi);


            if (!period) {

                return false;

            }


            const selectedMonth =
                new Date(
                    month + "-01"
                );


            return (

                selectedMonth >=
                period.firstStatementDate &&

                selectedMonth <=
                period.lastStatementDate

            );

        });


    emis.forEach(emi => {

        total += Number(
            emi.emiAmount || 0
        );

    });


    return total;

}


/* =========================================================
   GET EMI FOR DATE RANGE
========================================================= */

function getEMIAmountForDateRange(
    card,
    fromDate,
    toDate
) {

    let total = 0;


    const rangeStart =
        new Date(fromDate);

    const rangeEnd =
        new Date(toDate);


    /*
       -----------------------------------------------------
       1. Generated statements
       -----------------------------------------------------
    */

    const statements =
        Storage.getCardStatements()
        .filter(s => {

            if (
                card &&
                s.card !== card
            ) {

                return false;

            }


            const statementDate =
                new Date(
                    s.statementDate ||
                    `${s.month}-01`
                );


            return (
                statementDate >= rangeStart &&
                statementDate <= rangeEnd
            );

        });


    statements.forEach(statement => {

        if (
            Array.isArray(
                statement.emiDetails
            )
        ) {

            statement.emiDetails.forEach(
                emi => {

                    total += Number(
                        emi.amount || 0
                    );

                }
            );

        }

    });


    /*
       -----------------------------------------------------
       2. Active EMI schedules
       -----------------------------------------------------
    */

    const emis =
        Storage.getEmiPurchases()
        .filter(emi => {

            if (
                emi.status === "completed"
            ) {

                return false;

            }


            if (
                card &&
                emi.card !== card
            ) {

                return false;

            }


            const period =
                getEMIStatementPeriod(emi);


            if (!period) {

                return false;

            }


            /*
               Check whether EMI statement
               period overlaps selected range.
            */

            return (

                period.firstStatementDate <=
                rangeEnd &&

                period.lastStatementDate >=
                rangeStart

            );

        });


    emis.forEach(emi => {

        const period =
            getEMIStatementPeriod(emi);


        /*
           Avoid double counting if that
           statement already exists.
        */

        let currentMonth =
            new Date(
                period.firstStatementDate
            );


        while (
            currentMonth <=
            period.lastStatementDate
        ) {

            const year =
                currentMonth.getFullYear();

            const month =
                String(
                    currentMonth.getMonth() + 1
                ).padStart(2, "0");

            const monthKey =
                `${year}-${month}`;


            const statementExists =
                statements.some(
                    s =>
                        s.month ===
                        monthKey &&
                        s.card ===
                        emi.card
                );


            const currentDate =
                new Date(
                    currentMonth
                );


            if (
                currentDate >= rangeStart &&
                currentDate <= rangeEnd &&
                !statementExists
            ) {

                total += Number(
                    emi.emiAmount || 0
                );

            }


            currentMonth.setMonth(
                currentMonth.getMonth() + 1
            );

        }

    });


    return total;

}


/* =========================================================
   MAIN CREDIT REPORT
========================================================= */

function generateCreditReport() {

    const card =
        document.getElementById(
            "reportCard"
        )?.value || "";


    const month =
        document.getElementById(
            "reportMonth"
        )?.value || "";


    const fromDate =
        document.getElementById(
            "reportFromDate"
        )?.value || "";


    const toDate =
        document.getElementById(
            "reportToDate"
        )?.value || "";


    /*
       Require either:
       Month
       OR
       complete Date Range
    */

    if (
        !month &&
        !(fromDate && toDate)
    ) {

        alert(
            "Select Month or Date Range"
        );

        return;

    }


    /* =====================================================
       CREDIT CARD ACCOUNTS
    ===================================================== */

    const creditCards =
        getCreditCards();


    const creditCardNames =
        creditCards.map(
            c => c.name
        );


    /* =====================================================
       PURCHASE
    ===================================================== */

    let purchases =
        Storage.getTransactions()
        .filter(t => {

            /*
               Only expenses
            */

            if (
                t.type !== "expense"
            ) {

                return false;

            }


            /*
               Only Credit Card accounts
            */

            if (
                !creditCardNames.includes(
                    t.account
                )
            ) {

                return false;

            }


            /*
               Selected card
            */

            if (
                card &&
                t.account !== card
            ) {

                return false;

            }


            return true;

        });


    /*
       Month filter
    */

    if (month) {

        purchases =
            purchases.filter(

                t =>
                    t.date &&
                    t.date.startsWith(
                        month
                    )

            );

    }


    /*
       Date range filter
    */

    else if (
        fromDate &&
        toDate
    ) {

        purchases =
            purchases.filter(

                t =>

                    t.date >= fromDate &&
                    t.date <= toDate

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


    /* =====================================================
       EMI
    ===================================================== */

    let emiAmount = 0;


    if (month) {

        emiAmount =
            getEMIAmountForMonth(
                card,
                month
            );

    }
    else if (
        fromDate &&
        toDate
    ) {

        emiAmount =
            getEMIAmountForDateRange(
                card,
                fromDate,
                toDate
            );

    }


    /* =====================================================
       PAYMENT
    ===================================================== */

    let payments =
        Storage.getCardPayments();


    /*
       Card filter
    */

    if (card) {

        payments =
            payments.filter(
                p =>
                    p.card === card
            );

    }
    else {

        /*
           All Cards:
           Only payments belonging
           to actual credit cards.
        */

        payments =
            payments.filter(
                p =>
                    creditCardNames.includes(
                        p.card
                    )
            );

    }


    /*
       Month filter
    */

    if (month) {

        payments =
            payments.filter(

                p =>

                    p.paymentDate &&
                    p.paymentDate.startsWith(
                        month
                    )

            );

    }


    /*
       Date range filter
    */

    else if (
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


    const paymentAmount =
        payments.reduce(

            (sum, p) =>

                sum +
                Number(
                    p.amount || 0
                ),

            0

        );


    /* =====================================================
       OUTSTANDING
    ===================================================== */

    let statements =
        Storage.getCardStatements();


    /*
       Card filter
    */

    if (card) {

        statements =
            statements.filter(
                s =>
                    s.card === card
            );

    }
    else {

        statements =
            statements.filter(
                s =>
                    creditCardNames.includes(
                        s.card
                    )
            );

    }


    /*
       -----------------------------------------------------
       MONTH
       -----------------------------------------------------

       Outstanding means the remaining balance
       of THAT month's statement.

       We do NOT add multiple months together.
    */

    if (month) {

        statements =
            statements.filter(
                s =>
                    s.month === month
            );

    }


    /*
       -----------------------------------------------------
       DATE RANGE
       -----------------------------------------------------

       If multiple statements fall inside
       the range, use the latest statement.

       Example:

       From = Aug 1
       To   = Oct 31

       We use October's remaining balance,
       NOT:

       August + September + October
    */

    else if (
        fromDate &&
        toDate
    ) {

        statements =
            statements.filter(s => {

                const statementDate =
                    s.statementDate ||
                    `${s.month}-01`;

                return (

                    statementDate >=
                    fromDate &&

                    statementDate <=
                    toDate

                );

            });

    }


    /*
       Sort latest statement first
    */

    statements.sort(

        (a, b) => {

            const dateA =
                a.statementDate ||
                `${a.month}-01`;

            const dateB =
                b.statementDate ||
                `${b.month}-01`;

            return dateB.localeCompare(
                dateA
            );

        }

    );


    /*
       IMPORTANT:
       Outstanding is ONE statement,
       not sum of all statements.
    */

    let outstanding = 0;


    if (
        statements.length > 0
    ) {

        outstanding =
            Number(
                statements[0].remaining ||
                0
            );

    }


    /* =====================================================
       UI UPDATE
    ===================================================== */

    const purchaseElement =
        document.getElementById(
            "reportPurchase"
        );

    const emiElement =
        document.getElementById(
            "reportEMI"
        );

    const paymentElement =
        document.getElementById(
            "reportPayment"
        );

    const outstandingElement =
        document.getElementById(
            "reportOutstanding"
        );


    if (purchaseElement) {

        purchaseElement.textContent =
            App.formatCurrency(
                purchaseAmount
            );

    }


    if (emiElement) {

        emiElement.textContent =
            App.formatCurrency(
                emiAmount
            );

    }


    if (paymentElement) {

        paymentElement.textContent =
            App.formatCurrency(
                paymentAmount
            );

    }


    if (outstandingElement) {

        outstandingElement.textContent =
            App.formatCurrency(
                outstanding
            );

    }


    /* =====================================================
       CHARTS
    ===================================================== */

    renderCreditReportChart(

        purchaseAmount,

        paymentAmount,

        emiAmount

    );


    renderOutstandingTrend(card);

}


/* =========================================================
   OUTSTANDING TREND
========================================================= */

function renderOutstandingTrend(card) {

    let statements =
        Storage.getCardStatements();


    /*
       Only Credit Card statements
    */

    const creditCardNames =
        getCreditCards()
        .map(
            c => c.name
        );


    statements =
        statements.filter(
            s =>
                creditCardNames.includes(
                    s.card
                )
        );


    /*
       Card filter
    */

    if (card) {

        statements =
            statements.filter(
                s =>
                    s.card === card
            );

    }


    /*
       Sort by month
    */

    statements.sort(

        (a, b) =>

            a.month.localeCompare(
                b.month
            )

    );


    /*
       Last 12 months
    */

    statements =
        statements.slice(-12);


    const labels =
        statements.map(
            s =>
                s.month
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


    if (!ctx) return;


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

                    responsive: true,

                    maintainAspectRatio:
                        false

                }

            }

        );

}


/* =========================================================
   CREDIT REPORT BAR CHART
========================================================= */

function renderCreditReportChart(

    purchase,

    payment,

    emi

) {

    const ctx =
        document.getElementById(
            "creditReportChart"
        );


    if (!ctx) return;


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

                    responsive: true,

                    maintainAspectRatio:
                        false

                }

            }

        );

}