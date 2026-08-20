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



  /* =====================================================
       MONTH FORMAT
    ===================================================== */

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
   CREDIT CARD STATEMENT MONTH HELPER
========================================================= */

function getCreditCardStatementMonth(transaction) {

    const accountObj =
        Storage.getAccounts().find(
            a => a.name === transaction.account
        );

    const statementDay =
        Number(
            accountObj?.statementDay || 5
        );

    const trxDate =
        new Date(transaction.date);

    if (isNaN(trxDate.getTime())) {
        return "";
    }

    let statementDate =
        new Date(trxDate);

    /*
       Statement Day = 5

       01-05  -> Same Month
       06-end -> Next Month

       Example:
       20/08/2026 -> 09/2026
    */

    if (
        trxDate.getDate() >
        statementDay
    ) {
        statementDate.setMonth(
            statementDate.getMonth() + 1
        );
    }

    return (
        `${statementDate.getFullYear()}-` +
        `${String(
            statementDate.getMonth() + 1
        ).padStart(2, "0")}`
    );
}


/* =========================================================
   GENERATE CREDIT REPORT
========================================================= */

function generateCreditReport() {

    const card =
        document.getElementById("reportCard")?.value || "";

    const month =
        document.getElementById("reportMonth")?.value || "";

    const fromDate =
        document.getElementById("reportFromDate")?.value || "";

    const toDate =
        document.getElementById("reportToDate")?.value || "";


    // ==========================================
    // LOAD DATA
    // ==========================================

    const transactions =
        Storage.getTransactions();

    const accounts =
        Storage.getAccounts();

    let purchases =
        transactions.filter(t => {

            if (
                t.type !== "expense" ||
                t.isEmi
            ) {
                return false;
            }

            const account =
                accounts.find(
                    a => a.name === t.account
                );

            return (
                t.isCreditCardExpense === true ||
                account?.type === "creditcard"
            );

        });


    let payments =
        Storage.getCardPayments();

    let statements =
        Storage.getCardStatements();


    // ==========================================
    // CARD FILTER
    // ==========================================

    if (card) {

        purchases =
            purchases.filter(
                t => t.account === card
            );

        payments =
            payments.filter(
                p => p.card === card
            );

        statements =
            statements.filter(
                s => s.card === card
            );

    }


    // ==========================================
    // STATEMENT MONTH FILTER
    // ==========================================

    if (month) {

        purchases =
            purchases.filter(
                t =>
                    getCreditCardStatementMonth(t)
                    === month
            );

        payments =
            payments.filter(
                p =>
                    p.statementMonth === month
            );

        statements =
            statements.filter(
                s =>
                    s.month === month
            );

    }


    // ==========================================
    // FROM DATE
    //
    // IMPORTANT:
    // Date filter is applied to transactions/
    // payments only.
    //
    // Statement month logic is not changed.
    // ==========================================

    if (fromDate) {

        purchases =
            purchases.filter(
                t =>
                    String(t.date)
                    >= fromDate
            );

        payments =
            payments.filter(
                p =>
                    String(p.paymentDate)
                    >= fromDate
            );

    }


    // ==========================================
    // TO DATE
    // ==========================================

    if (toDate) {

        purchases =
            purchases.filter(
                t =>
                    String(t.date)
                    <= toDate
            );

        payments =
            payments.filter(
                p =>
                    String(p.paymentDate)
                    <= toDate
            );

    }


    // ==========================================
    // TOTAL PURCHASE
    // ==========================================

    const reportPurchase =
        purchases.reduce(
            (sum, t) =>
                sum +
                Number(t.amount || 0),
            0
        );


    // ==========================================
    // TOTAL EMI
    // ==========================================

    const reportEMI =
        statements.reduce(
            (sum, s) => {

                if (
                    Array.isArray(
                        s.emiDetails
                    )
                ) {

                    return (
                        sum +
                        s.emiDetails.reduce(
                            (
                                emiSum,
                                emi
                            ) =>
                                emiSum +
                                Number(
                                    emi.amount || 0
                                ),
                            0
                        )
                    );

                }

                return (
                    sum +
                    Number(
                        s.emiAmount || 0
                    )
                );

            },
            0
        );


    // ==========================================
    // TOTAL PAYMENT
    // ==========================================

    const reportPayment =
        payments.reduce(
            (sum, p) =>
                sum +
                Number(p.amount || 0),
            0
        );


    // ==========================================
    // TOTAL OUTSTANDING
    // ==========================================

    const reportOutstanding =
        statements.reduce(
            (sum, s) =>
                sum +
                Number(
                    s.remaining || 0
                ),
            0
        );


    // ==========================================
    // UPDATE KPI
    // ==========================================

    const purchaseEl =
        document.getElementById(
            "reportPurchase"
        );

    if (purchaseEl) {

        purchaseEl.textContent =
            `৳ ${reportPurchase.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`;

    }


    const emiEl =
        document.getElementById(
            "reportEMI"
        );

    if (emiEl) {

        emiEl.textContent =
            `৳ ${reportEMI.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`;

    }


    const paymentEl =
        document.getElementById(
            "reportPayment"
        );

    if (paymentEl) {

        paymentEl.textContent =
            `৳ ${reportPayment.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`;

    }


    const outstandingEl =
        document.getElementById(
            "reportOutstanding"
        );

    if (outstandingEl) {

        outstandingEl.textContent =
            `৳ ${reportOutstanding.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}`;

    }


    // ==========================================
    // STATEMENT HEADER
    // ==========================================

    const selectedStatement =
        statements.length > 0
            ? statements[statements.length - 1]
            : null;


    if (selectedStatement) {

        const reportCardEl =
            document.getElementById(
                "printReportCard"
            );

        if (reportCardEl) {

            reportCardEl.textContent =
                selectedStatement.card ||
                card ||
                "Credit Card";

        }


        const statementMonthEl =
            document.getElementById(
                "printStatementMonth"
            );

        if (statementMonthEl) {

            statementMonthEl.textContent =
                formatStatementMonth(
                    selectedStatement.month
                );

        }


        const statementAmount =
            Number(
                selectedStatement.amount ??
                selectedStatement.total ??
                selectedStatement.statementAmount ??
                0
            );


        const statementAmountEl =
            document.getElementById(
                "printStatementAmount"
            );

        if (statementAmountEl) {

            statementAmountEl.textContent =
                `BDT ${statementAmount.toLocaleString(
                    "en-BD",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )}`;

        }


        const statementDateEl =
            document.getElementById(
                "printStatementDate"
            );

        if (statementDateEl) {

            statementDateEl.textContent =
                formatReportDate(
                    selectedStatement.statementDate
                );

        }


        const dueDateEl =
            document.getElementById(
                "printDueDate"
            );

        if (dueDateEl) {

            dueDateEl.textContent =
                formatReportDate(
                    selectedStatement.dueDate
                );

        }


        const statusEl =
            document.getElementById(
                "printStatementStatus"
            );

        if (statusEl) {

            statusEl.textContent =
                selectedStatement.status ||
                "-";

        }

    }


    // ==========================================
    // STATEMENT SUMMARY TABLE
    // ==========================================

    const summaryTable =
        document.getElementById(
            "statementSummaryTable"
        );

    if (summaryTable) {

        summaryTable.innerHTML = "";

        statements.forEach(
            statement => {

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `

                    <td>
                        ${
                            formatStatementMonth(
                                statement.month
                            )
                        }
                    </td>

                    <td>
                        BDT ${
                            Number(
                                statement.amount ??
                                statement.total ??
                                statement.statementAmount ??
                                0
                            ).toLocaleString(
                                "en-BD",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )
                        }
                    </td>

                    <td>
                        BDT ${
                            Number(
                                statement.paid || 0
                            ).toLocaleString(
                                "en-BD",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )
                        }
                    </td>

                    <td>
                        BDT ${
                            Number(
                                statement.remaining || 0
                            ).toLocaleString(
                                "en-BD",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )
                        }
                    </td>

                    <td>
                        ${
                            statement.status || "-"
                        }
                    </td>

                `;

                summaryTable.appendChild(
                    row
                );

            }
        );

    }


    // ==========================================
    // CHARTS
    // ==========================================

    renderCreditReportChart(
        reportPurchase,
        reportPayment,
        reportEMI
    );


    renderOutstandingTrend(
        statements
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

    if (!ctx) {
        return;
    }

    if (creditReportChart) {
        creditReportChart.destroy();
        creditReportChart = null;
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
                            label: "Amount",

                            data: [
                                Number(purchase) || 0,
                                Number(payment) || 0,
                                Number(emi) || 0
                            ]
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
}


function renderOutstandingTrend(
    statements = []
) {

    const ctx =
        document.getElementById(
            "outstandingTrendChart"
        );

    if (!ctx) {
        return;
    }

    if (outstandingTrendChart) {
        outstandingTrendChart.destroy();
        outstandingTrendChart = null;
    }

    statements = [...statements];

    statements.sort(
        (a, b) =>
            String(a.month || "").localeCompare(
                String(b.month || "")
            )
    );

    statements =
        statements.slice(-12);

    const labels =
        statements.map(
            s => s.month || ""
        );

    const data =
        statements.map(
            s =>
                Number(
                    s.remaining || 0
                )
        );

    outstandingTrendChart =
        new Chart(
            ctx,
            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Outstanding",

                            data: data,

                            tension: 0.3,

                            fill: false
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
}



function printCreditReport() {

    const report =
        document.querySelector(".creditReport");

    if (!report) {
        alert("Credit Report not found.");
        return;
    }


    // =========================
    // GET PURCHASE / PAYMENT / EMI CHART
    // =========================

    const chart =
        document.getElementById(
            "creditReportChart"
        );

    const chartImage =
        chart
            ? chart.toDataURL("image/png")
            : "";


    // =========================
    // CLONE REPORT
    // =========================

    const clone =
        report.cloneNode(true);


    // =========================
    // REPLACE CHART CANVAS
    // WITH IMAGE
    // =========================

    const clonedChart =
        clone.querySelector(
            "#creditReportChart"
        );

    if (
        clonedChart &&
        chartImage
    ) {

        const image =
            document.createElement("img");

        image.src =
            chartImage;

        image.className =
            "print-chart";

        clonedChart.replaceWith(
            image
        );
    }


    // =========================
    // REMOVE OUTSTANDING TREND
    // COMPLETELY
    // =========================

    const cards =
        clone.querySelectorAll(
            ".card"
        );

    cards.forEach(card => {

        const heading =
            card.querySelector("h3");

        if (
            heading &&
            heading.textContent
                .trim() ===
            "Outstanding Trend"
        ) {

            card.remove();
        }

    });


    // =========================
    // REMOVE PRINT / PDF BUTTONS
    // =========================

    const actions =
        clone.querySelector(
            ".report-actions"
        );

    if (actions) {
        actions.remove();
    }


    // =========================
    // OPEN PRINT WINDOW
    // =========================

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=900"
        );

    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the report."
        );

        return;
    }


    // =========================
    // PRINT HTML
    // =========================

    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Credit Card Report
            </title>

            <meta charset="UTF-8">


            <style>

                * {
                    box-sizing: border-box;
                }


                body {

                    margin: 0;

                    padding: 0;

                    background: #ffffff;

                    color: #222;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                }


                .creditReport {

                    width: 100%;

                }


                /* =========================
                   KPI GRID
                ========================= */

                .kpi-grid {

                    display: grid;

                    grid-template-columns:
                        repeat(4, 1fr);

                    gap: 12px;

                    margin-bottom: 20px;

                }


                /* =========================
                   CARD
                ========================= */

                .card {

                    background: #ffffff;

                    border: 1px solid #dcdcdc;

                    border-radius: 8px;

                    padding: 16px;

                    margin-bottom: 20px;

                    box-shadow: none;

                }


                .card-title {

                    font-size: 13px;

                    font-weight: 600;

                    color: #555;

                    margin-bottom: 8px;

                }


                .card-value {

                    font-size: 22px;

                    font-weight: 700;

                    color: #111;

                }


                /* =========================
                   HEADINGS
                ========================= */

                h3 {

                    margin: 0 0 15px 0;

                    font-size: 17px;

                    font-weight: 700;

                }


                /* =========================
                   CHART
                ========================= */

                .print-chart {

                    display: block;

                    width: 100%;

                    height: auto;

                    max-height: 105mm;

                    object-fit: contain;

                    margin: 0 auto;

                }


                /* =========================
                   TABLE
                ========================= */

                .table-container {

                    width: 100%;

                    overflow: visible;

                }


                table {

                    width: 100%;

                    border-collapse: collapse;

                    font-size: 12px;

                }


                th {

                    background: #f2f2f2;

                    font-weight: 700;

                }


                th,
                td {

                    border: 1px solid #d5d5d5;

                    padding: 8px;

                    text-align: left;

                }


                /* =========================
                   SPACING
                ========================= */

                .mb-10 {
                    margin-bottom: 10px;
                }

                .mb-20 {
                    margin-bottom: 20px;
                }

                .mt-20 {
                    margin-top: 20px;
                }


                /* =========================
                   PRINT
                ========================= */

                @media print {

                    @page {

                        size: A4 portrait;

                        margin: 12mm;

                    }


                    body {

                        padding: 0;

                    }


                    .card {

                        break-inside: avoid;

                        page-break-inside: avoid;

                    }


                    table {

                        page-break-inside: auto;

                    }


                    tr {

                        page-break-inside: avoid;

                    }

                }

            </style>

        </head>


        <body>

            ${clone.outerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();


    // =========================
    // START PRINT
    // =========================

    printWindow.onload =
        function () {

            setTimeout(
                function () {

                    printWindow.focus();

                    printWindow.print();

                },
                500
            );

        };

}



async function downloadCreditReportPDF() {

    const report =
        document.getElementById("creditReport");

    if (!report) {
        alert("Credit Report not found.");
        return;
    }

    const canvas =
        await html2canvas(report, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
        });

    const imgData =
        canvas.toDataURL("image/png");

    const {
        jsPDF
    } = window.jspdf;

    const pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );

    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();

    const margin = 10;

    const imgWidth =
        pageWidth - (margin * 2);

    const imgHeight =
        canvas.height *
        imgWidth /
        canvas.width;

    let heightLeft =
        imgHeight;

    let position = margin;

    pdf.addImage(
        imgData,
        "PNG",
        margin,
        position,
        imgWidth,
        imgHeight
    );

    heightLeft -=
        pageHeight - (margin * 2);

    while (heightLeft > 0) {

        position =
            heightLeft -
            imgHeight +
            margin;

        pdf.addPage();

        pdf.addImage(
            imgData,
            "PNG",
            margin,
            position,
            imgWidth,
            imgHeight
        );

        heightLeft -=
            pageHeight - (margin * 2);
    }

    pdf.save(
        "Credit-Card-Report.pdf"
    );
}


function formatStatementMonth(month) {

    if (!month) {
        return "-";
    }

    const date =
        new Date(`${month}-01`);

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            year: "numeric"
        }
    ).replace(",", "-");
}


function formatReportDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return (
        String(date.getDate()).padStart(2, "0") +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        date.getFullYear()
    );
}