const CreditCards = (() => {

    function init() {

        loadSummary();

        renderCards();
		
		loadEMICards();

		loadEMITable();
		
		loadStatementYears();
		
		loadStatementTable();

		bindEMIEvents();
		
		document
		.getElementById(
			"statementMonth"
		)
		.value =

        new Date()
        .toISOString()
        .slice(0, 7);
		

    }

function loadEMICards() {

    const cards =

        Storage.getAccounts()

        .filter(

            a =>

                String(a.type)
                .toLowerCase()
                .replaceAll(" ", "")

                ===

                "creditcard"

        );

    const emiSelect =

        document.getElementById(
            "emiCard"
        );

    const statementSelect =

        document.getElementById(
            "statementCard"
        );

    if (emiSelect) {

        emiSelect.innerHTML = "";

        cards.forEach(card => {

            emiSelect.innerHTML += `

                <option value="${card.name}">

                    ${card.name}

                </option>

            `;

        });

    }

    if (statementSelect) {

        statementSelect.innerHTML = "";

        cards.forEach(card => {

            statementSelect.innerHTML += `

                <option value="${card.name}">

                    ${card.name}

                </option>

            `;

        });

    }

}






function generateStatement() {

    const card =
        document.getElementById(
            "statementCard"
        ).value;

    const month =
        document.getElementById(
            "statementMonth"
        ).value;

    if (!card || !month) {

        alert(
            "Select card and month"
        );

        return;

    }

    const statements =
        Storage.getCardStatements();

    const exists =
        statements.some(

            s =>

                s.card === card &&

                s.month === month

        );

    if (exists) {

        alert(
            "Statement already exists"
        );

        return;

    }

    /* =====================
       NORMAL TRANSACTIONS
    ===================== */

    const transactions =

        Storage
        .getTransactions()

        .filter(

            t =>

                t.account === card &&

                t.date.startsWith(
                    month
                )

        );

    const normalTransactions =

        transactions.filter(
            t => !t.isEmi
        );

    const normalAmount =

        normalTransactions.reduce(

            (sum, t) =>

                sum +

                Number(
                    t.amount || 0
                ),

            0

        );

    /* =====================
       EMI FOR THIS MONTH
    ===================== */

    const allEmis =
        Storage.getEmiPurchases();

    const emis =

        allEmis.filter(emi => {

            if (

                emi.card !== card ||

                emi.status ===
                "completed"

            ) {

                return false;

            }

		const purchaseDate =
			new Date(
				emi.startDate
			);

		const cardInfo =
			Storage.getAccounts()
			.find(
				c => c.name === card
			);

		const statementDay =
			cardInfo?.statementDay || 5;

		let startDate =
			new Date(
				purchaseDate
			);

		if (

			purchaseDate.getDate() >

			statementDay

		) {

			startDate.setMonth(
				startDate.getMonth() + 1
			);

		}

		startDate = new Date(

			startDate.getFullYear(),

			startDate.getMonth(),

			1

		);

            const selectedDate =
                new Date(
                    month + "-01"
                );

            const endDate =
                new Date(startDate);

            endDate.setMonth(

                endDate.getMonth() +

                Number(
                    emi.months
                ) - 1

            );

            return (

                selectedDate >=
                startDate &&

                selectedDate <=
                endDate

            );

        });

    const emiTotal =

        emis.reduce(

            (sum, emi) =>

                sum +

                Number(
                    emi.emiAmount || 0
                ),

            0

        );

    /* =====================
       TOTAL STATEMENT
    ===================== */

    const amount = Number(

        (
            normalAmount +
            emiTotal
        ).toFixed(2)

    );

    if (amount <= 0) {

        alert(
            "No transactions found"
        );

        return;

    }

    /* =====================
       REDUCE EMI PRINCIPAL
       AFTER STATEMENT
    ===================== */

    emis.forEach(emi => {

        emi.remainingAmount = Number(

            Math.max(

                0,

                Number(
                    emi.remainingAmount || 0
                ) -

                Number(
                    emi.emiAmount || 0
                )

            ).toFixed(2)

        );

        emi.remainingMonths =

            Math.max(

                0,

                Number(
                    emi.remainingMonths || 0
                ) - 1

            );

if (

    emi.remainingAmount <= 0 ||

    emi.remainingMonths <= 0

) {

    emi.remainingAmount = 0;

    emi.remainingMonths = 0;

    emi.status =
        "completed";

    /* =====================
       MOVE TO EMI HISTORY
    ===================== */

    const history =

        Storage.getEmiHistory();

    const exists =

        history.some(

            h =>

                h.id ===
                emi.id

        );

    if (!exists) {

        history.push({

            ...emi,

            completedDate:

                new Date()

                .toISOString()

                .split("T")[0]

        });

        Storage.saveEmiHistory(
            history
        );

    }

}

    });

    Storage.saveEmiPurchases(
        allEmis
    );

    /* =====================
       MARK EXPENSE AS
       STATEMENT GENERATED
    ===================== */

const allTransactions =
    Storage.getTransactions();

allTransactions.forEach(t => {

    if (

        t.account === card &&

        t.date.startsWith(month) &&

        t.type === "expense" &&

        !t.isEmi

    ) {

        t.statementGenerated = true;

    }

});

Storage.saveTransactions(
    allTransactions
);



    /* =====================
       DATES
    ===================== */
const cardInfo =
    Storage.getAccounts()
    .find(
        c => c.name === card
    );

const statementDay =
    cardInfo?.statementDay || 28;

const dueDays =
    cardInfo?.dueAfterDays || 15;

const statementDate =
    `${month}-${String(statementDay)
        .padStart(2, "0")}`;

const dueDate =
    new Date(statementDate);

dueDate.setDate(
    dueDate.getDate() + dueDays
);

    /* =====================
       SAVE STATEMENT
    ===================== */

    statements.push({

        id: Date.now(),

        card,

        month,

        statementDate,

        dueDate:
            dueDate
            .toISOString()
            .split("T")[0],

        amount,

        paid: 0,

        remaining: amount,

        status: "Unpaid",

        transactions:

            normalTransactions.map(
                t => ({

                    date: t.date,

                    description:
                        t.note ||
                        t.category,

                    amount:
                        Number(
                            t.amount
                        )

                })
            ),

        emiDetails:

            emis.map(
                emi => ({

                    id:
                        emi.id,

                    item:
                        emi.item,

                    type:
                        emi.emiType,
					
					 totalAmount:
						emi.totalAmount,

                    amount:
                        emi.emiAmount,
						
					remainingAmount:
						emi.remainingAmount,

                    remainingMonths:
                        emi.remainingMonths

                })
            )

    });

    Storage.saveCardStatements(
        statements
    );

    loadSummary();
    renderCards();
    loadStatementTable();
	

    App.showToast(
        "Statement Generated Successfully"
    );

}









function loadStatementTable() {

const statusFilter =

    document.getElementById(
        "statementStatusFilter"
    )?.value || "all";

const yearFilter =

    document.getElementById(
        "statementYearFilter"
    )?.value || "all";
	
    const tbody =

        document.getElementById(
            "statementTableBody"
        );

    if (!tbody) return;


const statements =

    Storage.getCardStatements()

    .filter(statement => {

        const matchesStatus =

            statusFilter === "all"

            ||

            statement.status ===
            statusFilter;

        const matchesYear =

            yearFilter === "all"

            ||

            statement.statementDate
            .startsWith(
                yearFilter
            );

        return (

            matchesStatus &&

            matchesYear

        );

    });




    if (

        statements.length === 0

    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7"
                    class="text-center">

                    No Statements Found

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =

        statements

        .sort(

            (a,b) =>

                new Date(
                    b.statementDate
                ) -

                new Date(
                    a.statementDate
                )

        )

        .map(statement => `

            <tr>

                <td>

                    ${statement.card}

                </td>

                <td>

                    ${formatDate(statement.statementDate)}

                </td>

                <td>

                    ${formatDate(statement.dueDate)}

                </td>

                <td>

                    ${App.formatCurrency(
                        statement.amount || 0
                    )}

                </td>

                <td>

                    ${App.formatCurrency(
                        statement.paid || 0
                    )}

                </td>

                <td>

                    ${App.formatCurrency(
                        statement.remaining || 0
                    )}

                </td>

                <td>

                    ${statement.status}

                </td>

				<td>
					
					<button
						class="btn btn-primary"
						onclick="viewStatement(${statement.id})">

						View

					</button>

					<button
						class="btn btn-primary"
						onclick="archiveStatement(${statement.id})">
						Archive
						
					</button>

					<button
						class="btn btn-danger"
						onclick="deleteStatement(${statement.id})">

						Delete

					</button>
					</div>

				

            </tr>

        `)

        .join("");

}

window.loadStatementTable =
    loadStatementTable;



function bindEMIEvents() {
	document
.getElementById(
    "generateStatementBtn"
)
?.addEventListener(
    "click",
    generateStatement
);

    document
        .getElementById(
            "saveEmiBtn"
        )
        ?.addEventListener(
            "click",
            saveEMI
        );

}




function saveEMI() {

    const item =
        document.getElementById(
            "emiItem"
        ).value.trim();

    const emiType =
        document.getElementById(
            "emiType"
        )?.value || "purchase";

    const card =
        document.getElementById(
            "emiCard"
        ).value;

    const amount =
        Number(
            document.getElementById(
                "emiAmount"
            ).value
        );

    const months =
        Number(
            document.getElementById(
                "emiMonths"
            ).value
        );

    const startDate =
        document.getElementById(
            "emiStartDate"
        ).value;

    /* Validation */

    if (

        !item ||

        !card ||

        !amount ||

        amount <= 0 ||

        !months ||

        months <= 0 ||

        !startDate

    ) {

        alert(
            "Fill all fields correctly"
        );

        return;

    }

    /* Duplicate Check */

    const existing =

        Storage
        .getEmiPurchases()

        .find(

            e =>

                e.item === item &&

                e.card === card &&

                e.status === "active"

        );

    if (existing) {

        alert(
            "EMI already exists"
        );

        return;

    }

    /* EMI Amount */

    const emiAmount =

        Math.floor(

            (amount / months) * 100

        ) / 100;

    Storage.addEmiPurchase({

        id: Date.now(),

        item,

        emiType,

        card,

        totalAmount: amount,

        remainingAmount: amount,

        emiAmount,
		
		startDate,

        months,

        remainingMonths: months,

        startDate,

        status: "active"

    });

    /* Mark Original Transaction */

    const transactions =
        Storage.getTransactions();

    const trx =
        transactions.find(

            t =>

                t.account === card &&

                Number(t.amount) === amount &&

                !t.isEmi

        );

    if (trx) {

        trx.isEmi = true;

        Storage.saveTransactions(
            transactions
        );

    }

    loadEMITable();

    loadSummary?.();

    renderCards?.();
	
	loadStatementTable();

    App.showToast(
        "EMI Created Successfully"
    );

}



function loadStatementYears() {

    const statements =

        Storage.getCardStatements();

    const years = [

        ...new Set(

            statements.map(

                s =>

                    s.statementDate
                    .substring(0, 4)

            )

        )

    ]

    .sort()

    .reverse();

    const select =

        document.getElementById(
            "statementYearFilter"
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

window.loadStatementYears =
    loadStatementYears;




function loadEMITable() {

    const tbody =
        document.getElementById(
            "emiTableBody"
        );

    if (!tbody)
        return;

    const emis =

        Storage.getEmiPurchases()

        .filter(

            emi =>

                emi.status ===
                "active"

        );

    if (
        emis.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="text-center"
                >

                    No Active EMI Found

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =

        emis.map(emi => `

            <tr>

                <td>
                    ${emi.item}
                </td>

                <td>

                    ${

                        emi.emiType ===
                        "loan"

                            ?

                            "Loan EMI"

                            :

                            "Purchase EMI"

                    }

                </td>

                <td>
                    ${emi.card}
                </td>

                <td>
					${formatDate(emi.startDate || "-")}
				</td>

                <td>
                    ${App.formatCurrency(
                        emi.totalAmount
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        emi.remainingAmount || 0
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        emi.emiAmount
                    )}
                </td>

                <td style="text-align: center">
                    ${emi.remainingMonths}
                </td>

                <td>

                    <button
                        class="btn btn-primary"
                        onclick="archiveEmi(${emi.id})"
                    >

                        Archive

                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="deleteEmi(${emi.id})"
                    >

                        Delete

                    </button>

                </td>

            </tr>

        `).join("");

}



function deleteEmi(id) {

    if (
        !confirm(
            "Delete EMI?"
        )
    ) return;

    const emis =
        Storage.getEmiPurchases();

    const emi =
        emis.find(
            e => e.id === id
        );

    if (!emi)
        return;

    const accounts =
        Storage.getAccounts();

    const card =
        accounts.find(
            a =>
                a.name ===
                emi.card
        );

    if (card) {

        card.balance = Number(

            (
                Number(
                    card.balance || 0
                )

                -

                Number(
                    emi.totalAmount || 0
                )

            ).toFixed(2)

        );

        Storage.saveAccounts(
            accounts
        );

    }

		const history =

			Storage.getEmiHistory();

		history.push({

			...emi,

			archivedAt:
				new Date()
				.toISOString()

		});

		Storage.saveEmiHistory(
			history
		);

		Storage.saveEmiPurchases(

			emis.filter(
				e => e.id !== id
			)

		);



    loadSummary();
    renderCards();
    loadEMITable();

    App.showToast(
        "EMI Deleted Successfully"
    );

}

window.deleteEmi =
    deleteEmi;	
		


function archiveEmi(id) {

    if (
        !confirm(
            "Archive EMI?"
        )
    ) return;

    const emis =
        Storage.getEmiPurchases();

    const emi =
        emis.find(
            e => e.id === id
        );

    if (!emi)
        return;

    const history =
        Storage.getEmiHistory();

    history.push({

        ...emi,

        archivedAt:
            new Date()
            .toISOString(),

        status:
            "archived"

    });

    Storage.saveEmiHistory(
        history
    );

    Storage.saveEmiPurchases(

        emis.filter(
            e => e.id !== id
        )

    );

    loadEMITable();

    loadSummary();

    renderCards();

    App.showToast(
        "EMI Archived Successfully"
    );

}

window.archiveEmi =
    archiveEmi;



function deleteStatement(id) {

    if (
        !confirm(
            "Delete Statement?"
        )
    ) return;

    const statements =
        Storage.getCardStatements();

    const statement =
        statements.find(
            s => s.id === id
        );

    if (!statement)
        return;

    const paidAmount =
        Number(
            statement.paid || 0
        );

    /* =====================
       Restore Bank Balance
    ===================== */

    if (

        statement.paymentAccount &&

        paidAmount > 0

    ) {

        const accounts =
            Storage.getAccounts();

        const bank =
            accounts.find(

                a =>

                    a.name ===
                    statement.paymentAccount

            );

        if (bank) {

            bank.balance = Number(

                (
                    Number(
                        bank.balance || 0
                    ) +

                    paidAmount

                ).toFixed(2)

            );

        }

        Storage.saveAccounts(
            accounts
        );

    }

    /* =====================
       Restore Transactions
    ===================== */

    const allTransactions =
        Storage.getTransactions();

    allTransactions.forEach(t => {

        if (

            t.account ===
            statement.card &&

            t.statementGenerated

        ) {

            const exists =
                statement.transactions?.some(

                    st =>

                        Number(
                            st.amount
                        ) ===

                        Number(
                            t.amount
                        )

                );

            if (exists) {

                t.statementGenerated =
                    false;

            }

        }

    });

    Storage.saveTransactions(
        allTransactions
    );

    /* =====================
       Restore EMI
    ===================== */

    if (
        statement.emiDetails
    ) {

        const emis =
            Storage.getEmiPurchases();

        statement.emiDetails.forEach(

            stmtEmi => {

                const emi =
                    emis.find(

                        e =>

                            e.id ===
                            stmtEmi.id

                    );

                if (!emi)
                    return;

                emi.remainingAmount =
                    Number(

                        (
                            Number(
                                emi.remainingAmount || 0
                            ) +

                            Number(
                                stmtEmi.amount || 0
                            )

                        ).toFixed(2)

                    );

                emi.remainingMonths =
                    Number(
                        emi.remainingMonths || 0
                    ) + 1;

                emi.status =
                    "active";

            }

        );

        Storage.saveEmiPurchases(
            emis
        );

    }

    /* =====================
       Delete Statement
    ===================== */

    Storage.saveCardStatements(

        statements.filter(
            s => s.id !== id
        )

    );

    /* =====================
       Refresh UI
    ===================== */

    loadSummary();

    renderCards();

    loadEMITable();

    loadStatementTable();

    viewStatement?.(null);

    App.showToast(
        "Statement Deleted Successfully"
    );

}

window.deleteStatement =
    deleteStatement;

	
function archiveStatement(id) {

    const statements =
        Storage.getCardStatements();

    const statement =
        statements.find(
            s => s.id === id
        );

    if (!statement)
        return;

    const history =
        Storage.getStatementHistory();

    history.push({

        ...statement,

        archivedAt:
            new Date()
            .toISOString()

    });

    Storage.saveStatementHistory(
        history
    );

    Storage.saveCardStatements(

        statements.filter(
            s => s.id !== id
        )

    );

    loadSummary();
    renderCards();
    loadStatementTable();

    App.showToast(
        "Statement Archived Successfully"
    );

}		

 window.archiveStatement =
    archiveStatement;           





function printStatementModal() {

    const tempDiv =
        document.createElement("div");

    tempDiv.innerHTML =
        document.getElementById(
            "statementDetails"
        ).innerHTML;

    const paymentSection =
        tempDiv.querySelector(
            "#paymentSection"
        );

    if (paymentSection) {

        paymentSection.remove();

    }

    const content =
        tempDiv.innerHTML;

    const printWindow =
        window.open(
            "",
            "_blank"
        );

    printWindow.document.write(`

        <html>

        <head>

            <title>
                Credit Card Statement
            </title>

            <style>

                body {

                    font-family: Arial, sans-serif;

                    padding: 20px;

                }

                table {

                    width: 100%;

                    border-collapse: collapse;

                }

                th,
                td {

                    border: 1px solid #ddd;

                    padding: 8px;

                    text-align: left;

                }

                h3,
                h4 {

                    margin-bottom: 10px;

                }

            </style>

        </head>

        <body>

            ${content}

        </body>

        </html>

    `);

    printWindow.document.close();

    printWindow.focus();

    printWindow.print();

}

window.printStatementModal =
    printStatementModal;






function viewStatement(id) {

    const statement =

        Storage
        .getCardStatements()
        .find(
            s => s.id === id
        );

    if (!statement)
        return;

    document
    .getElementById(
        "statementDetails"
    )
    .innerHTML = `

        <h3>
            ${statement.card}
        </h3>

        <p>
			Statement Month:
			${formatStatementMonth(
				statement.month
			)}
        </p>
		
		<p>
			Statement Amount :
			${App.formatCurrency(statement.amount)}
		</p>

        <p>
			Statement Date:
			${formatDate(
				statement.statementDate
			)}
        </p>

        <p>
			Due Date:
			${formatDate(
				statement.dueDate
			)}
        </p>
		
		<p>
			Status :
			${statement.status}
		</p>

        <hr>

        <h4>
            Transactions
        </h4>
		
		
		<div class="table-container">
        <table class="table">

            <thead>

                <tr>

                    <th>Date</th>

                    <th>Description</th>

                    <th>Amount</th>

                </tr>

            </thead>

            <tbody>

                ${(statement.transactions || [])

                .map(t => `

                    <tr>

                        <td>
                            ${formatDate(t.date)}
                        </td>

                        <td>
                            ${t.description}
                        </td>

                        <td>
                            ${App.formatCurrency(
                                t.amount
                            )}
                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
		</div>

        <hr>

        <h4>
            EMI Installments
        </h4>
		
		<div class="table-container">
        <table class="table">

            <thead>

                <tr>

                    <th>Item</th>

                    <th>Type</th>

                    <th>Monthly EMI</th>

                    <th>Outstanding</th>

                    <th>Remaining Months</th>

                </tr>

            </thead>

            <tbody>

                ${(statement.emiDetails || [])

                .map(emi => `

                    <tr>

                        <td>
                            ${emi.item}
                        </td>

                        <td>

                            ${emi.emiType === "loan"

                                ? "Loan EMI"

                                : "Purchase EMI"}

                        </td>

                        <td>

                            ${App.formatCurrency(
                                emi.amount
                            )}

                        </td>

                        <td>

                            ${App.formatCurrency(
                                emi.remainingAmount || 0
                            )}

                        </td>

                        <td>

                            ${emi.remainingMonths}

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
		</div>

        <hr>

        <h4>
            Total:
            ${App.formatCurrency(
                statement.amount || 0
            )}

        </h4>

        <h4>

            Paid:
            ${App.formatCurrency(
                statement.paid || 0
            )}

        </h4>

        <h4>

            Outstanding:
            ${App.formatCurrency(
                statement.remaining || 0
            )}

        </h4>
		
		
		<hr>
			<!-- PAYMENT_SECTION_START -->
			<div id="paymentSection">
		<h4>Make Payment</h4>

		<div class="form-group">

			<label>Pay From Account</label>

			<select
				id="statementPaymentAccount"
				class="form-control">

			</select>

		</div>

		<div class="form-group">

			<label>Payment Amount</label>

			<input
				type="number"
				id="statementPaymentAmount"
				class="form-control"
				step="0.01"
				placeholder="Enter Amount">

		</div>

		<button
			class="btn btn-success"
			onclick="payStatement(${statement.id})">

			Pay Now

		</button>
</div>
<!-- PAYMENT_SECTION_END -->

    `;

    document
    .getElementById(
        "statementModal"
    )
    .style.display =
        "block";

const accountSelect =

    document.getElementById(
        "statementPaymentAccount"
    );

accountSelect.innerHTML = "";

Storage.getAccounts()

.filter(

    a =>
        a.type !==
        "creditcard"

)

.forEach(account => {

    accountSelect.innerHTML += `

        <option value="${account.name}">

            ${account.name}

        </option>

    `;

});

}



//Date & Month Format

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




function loadDueReminder() {

    const statements =

        Storage.getCardStatements()

        .filter(

            s =>

                s.status !==
                "Paid"

        );

    if (

        statements.length === 0

    ) {

        document.getElementById(
            "nextDueAmount"
        ).textContent =

            "৳ 0";

        document.getElementById(
            "nextDueDate"
        ).textContent =

            "No Due";

        return;

    }

    statements.sort(

        (a, b) =>

            new Date(
                a.dueDate
            ) -

            new Date(
                b.dueDate
            )

    );

    const nextDue =

        statements[0];

    const today =
        new Date();

    const dueDate =
        new Date(
            nextDue.dueDate
        );

    const daysLeft =

        Math.ceil(

            (
                dueDate -
                today
            )

            /

            (
                1000 *
                60 *
                60 *
                24
            )

        );

	const warningBox =

		document.getElementById(
			"dueWarning"
		);

    document.getElementById(
        "nextDueAmount"
    ).textContent =

        App.formatCurrency(
            nextDue.remaining
        );

    document.getElementById(
        "nextDueDate"
    ).textContent =

        `${nextDue.dueDate}
        (${daysLeft} Days Left)`;
		
	if (daysLeft <= 7 && daysLeft >= 0) {

		warningBox.style.display =
			"block";

		warningBox.textContent =

			`⚠ Payment Due in ${daysLeft} Days`;

	}

	else if (daysLeft < 0) {

		warningBox.style.display =
			"block";

		warningBox.textContent =

			`🚨 Overdue by ${Math.abs(daysLeft)} Days`;

	}

	else {

		warningBox.style.display =
			"none";

	}



}



function payStatement(id) {

    const statements =
        Storage.getCardStatements();

    const statement =
        statements.find(
            s => s.id === id
        );

    if (!statement) return;

    const fromAccount =

        document.getElementById(
            "statementPaymentAccount"
        )?.value;

    const payment = Number(

        document.getElementById(
            "statementPaymentAmount"
        )?.value

    );

    if (

        !fromAccount ||

        isNaN(payment) ||

        payment <= 0

    ) {

        alert(
            "Enter valid payment amount"
        );

        return;

    }

    if (

        payment >

        Number(
            statement.remaining || 0
        )

    ) {

        alert(
            "Payment exceeds outstanding amount"
        );

        return;

    }

    /* =====================
       Deduct Bank Balance
    ===================== */

    Storage.updateAccountBalance(

        fromAccount,

        payment,

        "expense"

    );


		const paymentId = Date.now();

		Storage.addTransaction({

			type: "expense",

			date:
				new Date()
				.toISOString()
				.split("T")[0],

			category:
				"Credit Card Payment",

			account:
				fromAccount,

			amount:
				payment,

			note:
				`${statement.card} Statement Payment (${statement.month})`,

			paymentId:
				paymentId,

			statementId:
				statement.id

		});





	/* =====================
       Update Statement
    ===================== */

    statement.paymentAccount =
        fromAccount;

    statement.paid = Number(

        (
            Number(
                statement.paid || 0
            ) +

            payment

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

        statement.remaining <= 0

    ) {

        statement.remaining = 0;

        statement.status =
            "Paid";

    }

    else {

        statement.status =
            "Partial";

    }

    Storage.saveCardStatements(
        statements
    );
	
	
Storage.addCardPayment({

    id: paymentId,

    card: statement.card,

    statementMonth: statement.month,

    amount: payment,

    account: fromAccount,

    paymentDate: new Date()
        .toISOString()
        .split("T")[0],

    statementId: statement.id,

    emiItems: statement.emiDetails || []

});
	

    /* =====================
       Refresh UI
    ===================== */

    loadSummary();

    renderCards();

    loadStatementTable();
    App.showToast(
        "Payment Added Successfully"
    );
    viewStatement(id);



}

window.payStatement =
    payStatement;



function closeStatementModal() {

    document
    .getElementById(
        "statementModal"
    )
    .style.display =
        "none";

}

window.viewStatement =
    viewStatement;

window.closeStatementModal =
    closeStatementModal;
	
	
function loadSummary() {

    const cards = Storage
        .getAccounts()
        .filter(a => a.type === "creditcard");

    const statements =
        Storage.getCardStatements();

    const emis =
        Storage.getEmiPurchases();

    const transactions =
        Storage.getTransactions();

    /* =====================
       Total Credit Limit
    ===================== */

    const totalLimit = cards.reduce(
        (sum, card) =>
            sum + Number(card.limit || 0),
        0
    );

    /* =====================
       Statement Outstanding
    ===================== */

    const statementOutstanding =
        statements
            .filter(
                s => s.status !== "Paid"
            )
            .reduce(
                (sum, s) =>
                    sum +
                    Number(
                        s.remaining || 0
                    ),
                0
            );

    /* =====================
       Unbilled Credit Card Expense
    ===================== */

    const pendingExpense =
        transactions
            .filter(
                t =>
                    t.type === "expense" &&
                    !t.statementGenerated &&
                    cards.some(
                        c =>
                            c.name ===
                            t.account
                    )
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
       Total Outstanding
    ===================== */

    const totalOutstanding =
        statementOutstanding +
        pendingExpense;

    /* =====================
       EMI Outstanding
       (Remaining Principal)
    ===================== */

    const emiOutstanding =
        emis
            .filter(
                e =>
                    e.status !==
                    "completed"
            )
            .reduce(
                (sum, e) =>
                    sum +
                    Number(
                        e.remainingAmount || 0
                    ),
                0
            );

    /* =====================
       Used / Available
    ===================== */

    const totalUsed =
        totalOutstanding +
        emiOutstanding;

    const availableCredit =
        Math.max(
            0,
            totalLimit - totalUsed
        );

    const utilization =
        totalLimit > 0
            ? (
                totalUsed /
                totalLimit
              ) * 100
            : 0;

    /* =====================
       UI Update
    ===================== */

    document.getElementById(
        "totalCardLimit"
    ).textContent =
        App.formatCurrency(
            totalLimit
        );

    document.getElementById(
        "totalOutstanding"
    ).textContent =
        App.formatCurrency(
            totalOutstanding
        );

    document.getElementById(
        "emiOutstanding"
    ).textContent =
        App.formatCurrency(
            emiOutstanding
        );

    document.getElementById(
        "availableCredit"
    ).textContent =
        App.formatCurrency(
            availableCredit
        );

    document.getElementById(
        "utilizationPercent"
    ).textContent =
        utilization.toFixed(1) + "%";

   loadDueReminder();

}

/* Global Access */
window.loadSummary =
    loadSummary;


function renderCards() {

    const cards =
        Storage.getAccounts()
        .filter(
            a =>
                a.type === "creditcard"
        );

    const statements =
        Storage.getCardStatements();

    const transactions =
        Storage.getTransactions();

    const emis =
        Storage.getEmiPurchases();

    const container =
        document.getElementById(
            "creditCardList"
        );

    if (!container) return;

    if (cards.length === 0) {

        container.innerHTML =
            "<p>No Credit Cards Found</p>";

        return;

    }

    container.innerHTML = cards.map(card => {

        /* =====================
           Statement Due
        ===================== */

        const statementDue =

            statements

            .filter(

                s =>

                    s.card === card.name &&

                    s.status !== "Paid"

            )

            .reduce(

                (sum, s) =>

                    sum +

                    Number(
                        s.remaining || 0
                    ),

                0

            );

        /* =====================
           Unbilled Expense
        ===================== */

        const pendingExpense =

            transactions

            .filter(

                t =>

                    t.account === card.name &&

                    t.type === "expense" &&

                    !t.statementGenerated

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
           Outstanding
        ===================== */

        const totalOutstanding =

            statementDue +

            pendingExpense;

        /* =====================
           EMI Outstanding
           Remaining Principal
        ===================== */

        const emiOutstanding =

            emis

            .filter(

                e =>

                    e.card === card.name &&

                    e.status !== "completed"

            )

            .reduce(

                (sum, e) =>

                    sum +

                    Number(
                        e.remainingAmount || 0
                    ),

                0

            );

        /* =====================
           Used / Available
        ===================== */

        const limit =
            Number(
                card.limit || 0
            );

        const used =

            totalOutstanding +

            emiOutstanding;

        const available =
   
                limit - used;
       
        const utilization =

            limit > 0

                ?

                (
                    used / limit
                ) * 100

                :

                0;

        return `

            <div class="card mb-15">

                <h4>${card.name}</h4>

                <p>
                    <strong>Limit:</strong>
                    ${App.formatCurrency(limit)}
                </p>

                <p>
                    <strong>Outstanding:</strong>
                    ${App.formatCurrency(totalOutstanding)}
                </p>

                <p>
                    <strong>EMI Outstanding:</strong>
                    ${App.formatCurrency(emiOutstanding)}
                </p>

                <p>
                    <strong>Used:</strong>
                    ${App.formatCurrency(used)}
                </p>

                <p>
                    <strong>Available:</strong>
                    ${App.formatCurrency(available)}
                </p>

                <p>
                    <strong>Utilization:</strong>
                    ${utilization.toFixed(1)}%
                </p>

            </div>

        `;

    }).join("");

}

window.renderCards = renderCards;







	
	
	
	

    return {

        init,
		deleteEmi

    };

})();
window.CreditCards =
    CreditCards;

document.addEventListener(

    "DOMContentLoaded",

    CreditCards.init

);
