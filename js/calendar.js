/* ==========================================
   Expense Manager Pro
   File: js/calendar.js
   ========================================== */

const Calendar = (() => {

    let currentDate = new Date();

    let selectedDate = null;


    /* =========================
       INIT
    ========================= */

    function init() {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        selectedDate = today;

        bindEvents();

        renderCalendar();

        loadMonthlySummary();

        loadDateSummary(today);

    }


    /* =========================
       EVENTS
    ========================= */

    function bindEvents() {

        const prevBtn =
            document.getElementById(
                "calendarPrevBtn"
            );

        if (prevBtn) {

            prevBtn.addEventListener(
                "click",
                previousMonth
            );

        }


        const nextBtn =
            document.getElementById(
                "calendarNextBtn"
            );

        if (nextBtn) {

            nextBtn.addEventListener(
                "click",
                nextMonth
            );

        }


        const todayBtn =
            document.getElementById(
                "calendarTodayBtn"
            );

        if (todayBtn) {

            todayBtn.addEventListener(
                "click",
                goToToday
            );

        }


        const closeBtn =
            document.getElementById(
                "calendarTransactionModalClose"
            );

        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                closeTransactionModal
            );

        }


        const modal =
            document.getElementById(
                "calendarTransactionDetailsModal"
            );


        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        closeTransactionModal();

                    }

                }
            );

        }



/* =========================
   PRINT
========================= */

const printBtn =
    document.getElementById(
        "calendarPrintBtn"
    );

if (printBtn) {

    printBtn.addEventListener(
        "click",
        printCalendarTransactions
    );

}


/* =========================
   PDF
========================= */

const pdfBtn =
    document.getElementById(
        "calendarPdfBtn"
    );

if (pdfBtn) {

    pdfBtn.addEventListener(
        "click",
        exportCalendarPDF
    );

}


/* =========================
   EXCEL
========================= */

const excelBtn =
    document.getElementById(
        "calendarExcelBtn"
    );

if (excelBtn) {

    excelBtn.addEventListener(
        "click",
        exportCalendarExcel
    );

}
    }


    /* =========================
       MONTHLY SUMMARY
    ========================= */

    function loadMonthlySummary() {

        const year =
            currentDate.getFullYear();

        const month =
            currentDate.getMonth();


        const transactions =
            Storage
                .getTransactions()
                .filter(t => {

                    if (!t.date) {
                        return false;
                    }


                    const parts =
                        String(t.date)
                            .substring(0, 10)
                            .split("-");


                    return (

                        Number(parts[0]) ===
                        year &&

                        Number(parts[1]) - 1 ===
                        month

                    );

                });


        const income =
            transactions
                .filter(
                    t =>
                        t.type === "income"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(
                            t.amount || 0
                        ),
                    0
                );


        const expense =
            transactions
                .filter(
                    t =>
                        t.type === "expense"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(
                            t.amount || 0
                        ),
                    0
                );


        const incomeElement =
            document.getElementById(
                "calendarMonthlyIncome"
            );

        const expenseElement =
            document.getElementById(
                "calendarMonthlyExpense"
            );

        const netElement =
            document.getElementById(
                "calendarMonthlyNet"
            );

        const transactionElement =
            document.getElementById(
                "calendarMonthlyTransactions"
            );


        if (incomeElement) {

            incomeElement.textContent =
                "৳ " +
                income.toLocaleString();

        }


        if (expenseElement) {

            expenseElement.textContent =
                "৳ " +
                expense.toLocaleString();

        }


        if (netElement) {

            netElement.textContent =
                "৳ " +
                (
                    income -
                    expense
                ).toLocaleString();

        }


        if (transactionElement) {

            transactionElement.textContent =
                transactions.length
                    .toLocaleString();

        }

    }


    /* =========================
       RENDER CALENDAR
    ========================= */

    function renderCalendar() {

        const grid =
            document.getElementById(
                "calendarGrid"
            );

        if (!grid) return;


        const year =
            currentDate.getFullYear();

        const month =
            currentDate.getMonth();


        updateMonthHeader(
            year,
            month
        );


        grid.innerHTML = "";


        const firstDay =
            new Date(
                year,
                month,
                1
            ).getDay();


        const daysInMonth =
            new Date(
                year,
                month + 1,
                0
            ).getDate();


        /* EMPTY CELLS */

        for (
            let i = 0;
            i < firstDay;
            i++
        ) {

            const emptyCell =
                document.createElement(
                    "div"
                );

            emptyCell.className =
                "calendar-day empty";

            grid.appendChild(
                emptyCell
            );

        }


        /* DATE CELLS */

        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            const dateString =
                formatDateString(
                    year,
                    month,
                    day
                );


            const cell =
                createDateCell(
                    day,
                    dateString
                );


            grid.appendChild(
                cell
            );

        }

    }


    /* =========================
       CREATE DATE CELL
    ========================= */

    function createDateCell(
        day,
        dateString
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        /* TODAY */

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        if (
            dateString === today
        ) {

            cell.classList.add(
                "today"
            );

        }


        /* SELECTED */

        if (
            selectedDate ===
            dateString
        ) {

            cell.classList.add(
                "selected"
            );

        }


        /* TRANSACTIONS */

        const transactions =
            getTransactionsByDate(
                dateString
            );


        const income =
            transactions
                .filter(
                    t =>
                        t.type === "income"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(
                            t.amount || 0
                        ),
                    0
                );


        const expense =
            transactions
                .filter(
                    t =>
                        t.type === "expense"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(
                            t.amount || 0
                        ),
                    0
                );


        const count =
            transactions.length;


        if (count > 0) {

            cell.classList.add(
                "has-transactions"
            );

        }


        let html = `

            <div class="calendar-date">
                ${day}
            </div>

        `;


        if (income > 0) {

            html += `

                <div class="calendar-income-total">
                    + ৳${income.toLocaleString()}
                </div>

            `;

        }


        if (expense > 0) {

            html += `

                <div class="calendar-expense-total">
                    - ৳${expense.toLocaleString()}
                </div>

            `;

        }


        if (count > 0) {

            html += `

                <div class="calendar-transaction-total">
                    ${count} Txn
                </div>

            `;

        }


        cell.innerHTML =
            html;


        /* CLICK */

        cell.addEventListener(
            "click",
            function () {

                selectDate(
                    dateString
                );

            }
        );


        return cell;

    }


    /* =========================
       SELECT DATE
    ========================= */

    function selectDate(
        dateString
    ) {

        selectedDate =
            dateString;


        renderCalendar();

        loadDateSummary(
            dateString
        );


        /* OPEN MODAL */

        openTransactionModal(
            dateString
        );

    }


    /* =========================
       GET TRANSACTIONS BY DATE
    ========================= */

    function getTransactionsByDate(
        dateString
    ) {

        return Storage
            .getTransactions()
            .filter(t => {

                if (!t.date) {
                    return false;
                }


                return (

                    String(t.date)
                        .substring(0, 10)

                    ===

                    dateString

                );

            });

    }


    /* =========================
       DATE SUMMARY
    ========================= */

    function loadDateSummary(
        dateString
    ) {

        const transactions =
            getTransactionsByDate(
                dateString
            );


        const income =
            transactions
                .filter(
                    t =>
                        t.type === "income"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(
                            t.amount || 0
                        ),
                    0
                );


        const expense =
            transactions
                .filter(
                    t =>
                        t.type === "expense"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(
                            t.amount || 0
                        ),
                    0
                );


        const dateElement =
            document.getElementById(
                "calendarSelectedDate"
            );

        if (dateElement) {

            dateElement.textContent =
                dateString;

        }


        const incomeElement =
            document.getElementById(
                "calendarDailyIncome"
            );

        if (incomeElement) {

            incomeElement.textContent =
                "৳ " +
                income.toLocaleString();

        }


        const expenseElement =
            document.getElementById(
                "calendarDailyExpense"
            );

        if (expenseElement) {

            expenseElement.textContent =
                "৳ " +
                expense.toLocaleString();

        }


        const netElement =
            document.getElementById(
                "calendarDailyNet"
            );

        if (netElement) {

            netElement.textContent =
                "৳ " +
                (
                    income -
                    expense
                ).toLocaleString();

        }


        const countElement =
            document.getElementById(
                "calendarTransactionCount"
            );

        if (countElement) {

            countElement.textContent =

                transactions.length > 0

                    ?

                    transactions.length +
                    " Transactions"

                    :

                    "No transactions";

        }

    }


    /* =========================
       OPEN TRANSACTION MODAL
    ========================= */

  function openTransactionModal(dateString) {

    const modal =
        document.getElementById(
            "calendarTransactionDetailsModal"
        );

    const title =
        document.getElementById(
            "calendarTransactionModalTitle"
        );

    const tbody =
        document.getElementById(
            "calendarTransactionModalBody"
        );


    if (!modal || !tbody) {

        console.warn(
            "Calendar transaction modal elements not found."
        );

        return;

    }


    /* =========================
       GET TRANSACTIONS
    ========================= */

    const transactions =
        getTransactionsByDate(
            dateString
        );


    /* =========================
       TITLE
    ========================= */

    if (title) {

        title.textContent =
            `Transactions - ${dateString}`;

    }


    /* =========================
       CLEAR TABLE
    ========================= */

    tbody.innerHTML = "";


    /* =========================
       NO TRANSACTIONS
    ========================= */

    if (transactions.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center"
                >

                    No Transactions Found

                </td>

            </tr>

        `;

        modal.style.display = "flex";

        return;

    }


    /* =========================
       TOTALS
    ========================= */

    let incomeTotal = 0;

    let expenseTotal = 0;


    /* =========================
       TRANSACTION ROWS
    ========================= */

    transactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount || 0
                );


            if (
                transaction.type ===
                "income"
            ) {

                incomeTotal += amount;

            }

            else if (
                transaction.type ===
                "expense"
            ) {

                expenseTotal += amount;

            }


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${transaction.date}
                </td>


                <td>

                    <span class="
                        badge
                        ${
                            transaction.type ===
                            "income"

                                ? "badge-success"

                                : "badge-danger"
                        }
                    ">

                        ${transaction.type}

                    </span>

                </td>


                <td>
                    ${
                        transaction.category ||
                        "-"
                    }
                </td>


                <td>
                    ${
                        transaction.account ||
                        "-"
                    }
                </td>


                <td>
                    ${
                        transaction.note ||
                        "-"
                    }
                </td>


                <td>

                    ${
                        transaction.type ===
                        "income"
                            ? "+"
                            : "-"
                    }

                    ৳${amount.toLocaleString()}

                </td>

            `;


            tbody.appendChild(row);

        }
    );


    /* =========================
       INCOME TOTAL
    ========================= */

    if (incomeTotal > 0) {

        const incomeRow =
            document.createElement(
                "tr"
            );

        incomeRow.innerHTML = `

            <th
                colspan="5"
                style="text-align:right;"
            >

                Income Total

            </th>

            <th>

                + ৳${incomeTotal.toLocaleString()}

            </th>

        `;

        tbody.appendChild(
            incomeRow
        );

    }


    /* =========================
       EXPENSE TOTAL
    ========================= */

    if (expenseTotal > 0) {

        const expenseRow =
            document.createElement(
                "tr"
            );

        expenseRow.innerHTML = `

            <th
                colspan="5"
                style="text-align:right;"
            >

                Expense Total

            </th>

            <th>

                - ৳${expenseTotal.toLocaleString()}

            </th>

        `;

        tbody.appendChild(
            expenseRow
        );

    }


    /* =========================
       NET
    ========================= */

    const net =
        incomeTotal -
        expenseTotal;


    const netRow =
        document.createElement(
            "tr"
        );


    netRow.innerHTML = `

        <th
            colspan="5"
            style="text-align:right;"
        >

            Net

        </th>

        <th>

            ${
                net >= 0
                    ? "+"
                    : "-"
            }

            ৳${Math.abs(net).toLocaleString()}

        </th>

    `;


    tbody.appendChild(
        netRow
    );


    /* =========================
       SHOW MODAL
    ========================= */

    modal.style.display = "flex";

}

    /* =========================
       CLOSE TRANSACTION MODAL
    ========================= */

    function closeTransactionModal() {

        const modal =
            document.getElementById(
                "calendarTransactionDetailsModal"
            );


        if (!modal) return;


        modal.style.display =
            "none";

    }


    /* =========================
       PREVIOUS MONTH
    ========================= */

    function previousMonth() {

        currentDate =
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                1
            );


        renderCalendar();

        loadMonthlySummary();

    }


    /* =========================
       NEXT MONTH
    ========================= */

    function nextMonth() {

        currentDate =
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                1
            );


        renderCalendar();

        loadMonthlySummary();

    }


    /* =========================
       TODAY
    ========================= */

    function goToToday() {

        currentDate =
            new Date();


        selectedDate =
            new Date()
                .toISOString()
                .split("T")[0];


        renderCalendar();

        loadMonthlySummary();

        loadDateSummary(
            selectedDate
        );

    }


    /* =========================
       MONTH HEADER
    ========================= */

    function updateMonthHeader(
        year,
        month
    ) {

        const months = [

            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"

        ];


        const header =
            document.getElementById(
                "calendarMonthYear"
            );


        if (!header) return;


        header.textContent =
            `${months[month]} ${year}`;

    }



/* =========================================
   CALENDAR EXPORT
========================================= */


/* =========================
   GET CURRENT MODAL DATA
========================= */

function getCalendarModalData() {

    const title =
        document.getElementById(
            "calendarTransactionModalTitle"
        );

    const tbody =
        document.getElementById(
            "calendarTransactionModalBody"
        );


    if (!tbody) {

        return null;

    }


    return {

        title:
            title
                ? title.textContent.trim()
                : "Calendar Transactions",

        html:
            tbody.innerHTML

    };

}


/* =========================
   PRINT
========================= */

function printCalendarTransactions() {

    const data =
        getCalendarModalData();

    if (!data) return;


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1000,height=700"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print."
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${data.title}
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        sans-serif;

                    padding:30px;

                }

                h2 {

                    margin-bottom:20px;

                }

                table {

                    width:100%;

                    border-collapse:
                        collapse;

                }

                th,
                td {

                    border:1px solid #ccc;

                    padding:8px;

                    text-align:left;

                }

                th {

                    background:#f1f5f9;

                }

                th:last-child,
                td:last-child {

                    text-align:right;

                }

                .badge {

                    font-weight:600;

                }

                @media print {

                    body {

                        padding:0;

                    }

                }

            </style>

        </head>

        <body>

            <h2>
                ${data.title}
            </h2>

            <table>

                <thead>

                    <tr>

                        <th>Date</th>

                        <th>Type</th>

                        <th>Category</th>

                        <th>Account</th>

                        <th>Note</th>

                        <th>Amount</th>

                    </tr>

                </thead>

                <tbody>

                    ${data.html}

                </tbody>

            </table>

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        function () {

            printWindow.print();

            printWindow.close();

        },
        300
    );

}


/* =========================
   PDF
========================= */

function exportCalendarPDF() {

    /*
        Browser Print dialog
        থেকে "Save as PDF"
        নির্বাচন করা যাবে.
    */

    printCalendarTransactions();

}


/* =========================
   EXCEL
========================= */

function exportCalendarExcel() {

    const transactions =
        getTransactionsByDate(
            selectedDate
        );


    if (
        !transactions ||
        transactions.length === 0
    ) {

        alert(
            "No transactions found."
        );

        return;

    }


    let incomeTotal = 0;
    let expenseTotal = 0;


    let csv =
        "\uFEFF";


    /* =========================
       HEADER
    ========================= */

    csv +=
        "Date,Type,Category,Account,Note,Amount\n";


    /* =========================
       TRANSACTIONS
    ========================= */

    transactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount || 0
                );


            if (
                transaction.type ===
                "income"
            ) {

                incomeTotal += amount;

            }

            else if (
                transaction.type ===
                "expense"
            ) {

                expenseTotal += amount;

            }


            const row = [

                transaction.date || "",

                transaction.type || "",

                transaction.category || "",

                transaction.account || "",

                transaction.note || "",

                amount

            ];


            csv +=

                row
                .map(
                    value => {

                        const text =
                            String(
                                value
                            )
                            .replace(
                                /"/g,
                                '""'
                            );

                        return `"${text}"`;

                    }
                )
                .join(",") +

                "\n";

        }
    );


    /* =========================
       TOTALS
    ========================= */

    csv += "\n";


    csv +=
        `"Income Total","","","","",${incomeTotal}\n`;


    csv +=
        `"Expense Total","","","","",${expenseTotal}\n`;


    csv +=
        `"Net","","","","",${incomeTotal - expenseTotal}\n`;


    /* =========================
       DOWNLOAD
    ========================= */

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;


    link.download =
        `Calendar-${selectedDate}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}

    /* =========================
       DATE FORMAT
    ========================= */

    function formatDateString(
        year,
        month,
        day
    ) {

        const mm =
            String(
                month + 1
            )
            .padStart(
                2,
                "0"
            );


        const dd =
            String(day)
                .padStart(
                    2,
                    "0"
                );


        return (
            `${year}-${mm}-${dd}`
        );

    }


    /* =========================
       PUBLIC API
    ========================= */

    return {

        init

    };

})();


/* =========================
   AUTO INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        Calendar.init();

    }
);