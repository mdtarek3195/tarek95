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

 /* =====================
   NORMAL TRANSACTIONS
   STATEMENT CYCLE
===================== */

const cardInfo =
    Storage.getAccounts()
    .find(
        c => c.name === card
    );

const statementDay =
    cardInfo?.statementDay || 5;


/*
   Selected statement month

   Example:
   Statement Day = 4
   September Statement
   = 05-Aug to 04-Sep
*/

const selectedMonthDate =
    new Date(month + "-01");


const statementStartDate =
    new Date(
        selectedMonthDate
    );

statementStartDate.setMonth(
    statementStartDate.getMonth() - 1
);

statementStartDate.setDate(
    statementDay + 1
);


const statementEndDate =
    new Date(
        selectedMonthDate.getFullYear(),
        selectedMonthDate.getMonth(),
        statementDay
    );


const transactions =
    Storage
    .getTransactions()
    .filter(t => {

        if (
            t.account !== card ||
            t.type !== "expense" ||
            t.isEmi
        ) {
            return false;
        }

        const transactionDate =
            new Date(t.date);

        return (

            transactionDate >=
                statementStartDate &&

            transactionDate <=
                statementEndDate

        );

    });


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

/* =====================
   MARK EXPENSE AS
   STATEMENT GENERATED
===================== */

const allTransactions =
    Storage.getTransactions();

allTransactions.forEach(t => {

    if (

        t.account === card &&

        t.type === "expense" &&

        !t.isEmi

    ) {

        const transactionDate =
            new Date(t.date);

        if (

            transactionDate >=
                statementStartDate &&

            transactionDate <=
                statementEndDate

        ) {

            t.statementGenerated = true;

        }

    }

});

Storage.saveTransactions(
    allTransactions
);



    /* =====================
       DATES
    ===================== */


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
						class="btn btn-success"
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
                    ${formatDate(
                        emi.startDate || "-"
                    )}
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

                <td
                    style="text-align: center"
                >
                    ${emi.remainingMonths}
                </td>

                <td>

                    <button
                        class="btn btn-success"
                        onclick="viewEmiDetails(${emi.id})"
                    >

                        Details

                    </button>

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


    /* =====================
       Paid Amount
    ===================== */

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

            bank.balance =
                Number(
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
       Restore Normal
       CC Transactions
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
                            st.amount || 0
                        ) ===
                        Number(
                            t.amount || 0
                        ) &&
                        st.date === t.date
                );

            if (exists) {

                t.statementGenerated =
                    false;
            }
        }
    });


    /* =====================
       Remove Payment
       Transactions
    ===================== */

    const statementTransactions =
        allTransactions.filter(
            t =>
                t.statementId ===
                statement.id
        );


    /*
       Remove all transactions
       belonging to this statement.

       This includes:
       - credit_card_payment
       - Credit Card EMI expense
    */

    const remainingTransactions =
        allTransactions.filter(
            t =>
                t.statementId !==
                statement.id
        );


    Storage.saveTransactions(
        remainingTransactions
    );


    /* =====================
       Restore EMI
    ===================== */

    if (
        statement.emiDetails &&
        statement.emiDetails.length > 0
    ) {

        const emis =
            Storage.getEmiPurchases();

        const emiHistory =
            Storage.getEmiHistory();


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


                /* =====================
                   Restore EMI Amount
                ===================== */

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


                /* =====================
                   Restore EMI Month
                ===================== */

                emi.remainingMonths =
                    Number(
                        emi.remainingMonths || 0
                    ) + 1;


                /* =====================
                   Reactivate EMI
                ===================== */

                emi.status =
                    "active";


                /* =====================
                   Remove Completed
                   EMI History Record
                ===================== */

                const historyIndex =
                    emiHistory.findIndex(
                        h =>
                            h.id === emi.id
                    );

                if (
                    historyIndex !== -1
                ) {

                    emiHistory.splice(
                        historyIndex,
                        1
                    );

                }

            }
        );


        Storage.saveEmiPurchases(
            emis
        );

        Storage.saveEmiHistory(
            emiHistory
        );
    }


    /* =====================
       Remove Card Payment
       History
    ===================== */

    const payments =
        Storage.getCardPayments();

    Storage.saveCardPayments(

        payments.filter(
            p =>
                p.statementId !==
                statement.id
        )

    );


    /* =====================
       Delete Statement
    ===================== */

    Storage.saveCardStatements(

        statements.filter(
            s =>
                s.id !== id
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

    const modal =
        document.getElementById(
            "statementModal"
        );

    if (!modal) {

        alert(
            "Statement modal not found."
        );

        return;

    }


    /* =====================================================
       CREATE PRINT WINDOW
    ===================================================== */

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print."
        );

        return;

    }


    /* =====================================================
       CLONE COMPLETE MODAL
    ===================================================== */

    const modalClone =
        modal.cloneNode(true);


    /* =====================================================
       REMOVE ACTION BUTTONS
       Print / Close button print হবে না
    ===================================================== */

    const actionButton =
        modalClone.querySelector(
            ".statement-modal-header .action-button"
        );


    if (actionButton) {

        actionButton.remove();

    }


    /* =====================================================
       REMOVE PAYMENT SECTION
       Existing behavior preserve করা হলো
    ===================================================== */

    const paymentSection =
        modalClone.querySelector(
            "#paymentSection"
        );


    if (paymentSection) {

        paymentSection.remove();

    }


    /* =====================================================
       PRINT DOCUMENT
    ===================================================== */

    printWindow.document.open();


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Credit Card Statement
            </title>


            <!-- =========================================
                 EXISTING MAIN CSS
            ========================================== -->

            <link
                rel="stylesheet"
                href="css/main.css"
            >


            <style>

                /* =========================================
                   PRINT PAGE
                ========================================= */

                @page {

                    size: A4;

                    margin: 12mm;

                }


                html,
                body {

                    margin: 0 !important;

                    padding: 0 !important;

                    background: #ffffff !important;

                    font-family:
                        "Segoe UI",
                        Arial,
                        sans-serif;

                }


                /* =========================================
                   COMPLETE MODAL
                ========================================= */

                .statement-modal {

                    display: block !important;

                    position: static !important;

                    width: 100% !important;

                    height: auto !important;

                    padding: 0 !important;

                    margin: 0 !important;

                    background: transparent !important;

                    backdrop-filter: none !important;

                    overflow: visible !important;

                }


                /* =========================================
                   MODAL CONTENT
                ========================================= */

                .statement-modal-content {

                    width: 100% !important;

                    max-width: 900px !important;

                    margin: 0 auto !important;

                    background: #ffffff !important;

                    border-radius: 20px !important;

                    box-shadow:
                        0 15px 50px
                        rgba(0,0,0,.25) !important;

                    overflow: hidden !important;

                }


                /* =========================================
                   HEADER
                ========================================= */

                .statement-modal-header {

                    display: flex !important;

                    justify-content:
                        space-between !important;

                    align-items: center !important;

                    padding: 20px 25px !important;

                    background: #2196f3 !important;

                    color: #ffffff !important;

                }


                .statement-modal-header h2 {

                    margin: 0 !important;

                    font-size: 20px !important;

                    font-weight: 700 !important;

                    color: #ffffff !important;

                }


                /* =========================================
                   STATEMENT BODY
                ========================================= */

                #statementDetails {

                    padding: 25px !important;

                    background: #ffffff !important;

                }


                /* =========================================
                   HEADINGS
                ========================================= */

                #statementDetails h3 {

                    margin-bottom: 10px !important;

                }


                #statementDetails h4 {

                    margin-top: 20px !important;

                    margin-bottom: 10px !important;

                }


                /* =========================================
                   TABLE CONTAINER
                ========================================= */

                #statementDetails .table-container {

                    width: 100% !important;

                    overflow: visible !important;

                }


                /* =========================================
                   TABLE
                ========================================= */

                #statementDetails table {

                    width: 100% !important;

                    border-collapse: collapse !important;

                    margin-top: 10px !important;

                    background: #ffffff !important;

                }


                #statementDetails th {

                    background: #f3f6fa !important;

                    padding: 12px !important;

                    text-align: left !important;

                    border:
                        1px solid #e5e5e5 !important;

                    color: #0f172a !important;

                    font-weight: 700 !important;

                }


                #statementDetails td {

                    padding: 12px !important;

                    border:
                        1px solid #e5e5e5 !important;

                    color: #0f172a !important;

                }


                /* =========================================
                   TOTAL
                ========================================= */

                #statementDetails tfoot tr {

                    background: #f5f7fa !important;

                }


                #statementDetails tfoot th {

                    font-weight: 700 !important;

                    border-top:
                        2px solid #ddd !important;

                    background: #f5f7fa !important;

                }


                /* =========================================
                   BADGES
                ========================================= */

                #statementDetails .badge {

                    display: inline-block !important;

                    padding: 4px 10px !important;

                    border-radius: 999px !important;

                    font-size: 12px !important;

                    font-weight: 600 !important;

                }


                #statementDetails .badge-success {

                    background:
                        rgba(22,163,74,.15) !important;

                    color: #16a34a !important;

                }


                #statementDetails .badge-danger {

                    background:
                        rgba(220,38,38,.15) !important;

                    color: #dc2626 !important;

                }


                /* =========================================
                   HORIZONTAL SCROLL REMOVE
                ========================================== */

                .table-container {

                    overflow: visible !important;

                }


                /* =========================================
                   PAGE BREAK
                ========================================== */

                table {

                    page-break-inside: auto !important;

                }


                tr {

                    page-break-inside: avoid !important;

                    page-break-after: auto !important;

                }


                h3,
                h4 {

                    page-break-after: avoid !important;

                }


                /* =========================================
                   PRESERVE COLORS
                ========================================== */

                * {

                    -webkit-print-color-adjust:
                        exact !important;

                    print-color-adjust:
                        exact !important;

                }

            </style>

        </head>


        <body>

            ${modalClone.outerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();


    /* =====================================================
       WAIT FOR CSS
    ===================================================== */

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


/* =========================================================
   GLOBAL FUNCTION
   ========================================================= */

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

			type: "credit_card_payment",

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
   EMI EXPENSE
   ===================== */

const totalEMI =

    (statement.emiDetails || [])
    .reduce(

        (sum, emi) =>

            sum +
            Number(
                emi.amount || 0
            ),

        0

    );


/*
   EMI already recorded from
   previous partial payments
*/

const previousEMIPaid =
    Number(
        statement.emiPaid || 0
    );


/*
   Remaining EMI expense
*/

const remainingEMI =
    Math.max(

        0,

        totalEMI -
        previousEMIPaid

    );


/*
   Current payment can only
   record up to remaining EMI
*/

const currentEMIExpense =
    Math.min(

        payment,

        remainingEMI

    );


if (currentEMIExpense > 0) {

    Storage.addTransaction({

        type: "expense",

        date:
            new Date()
            .toISOString()
            .split("T")[0],

        category:
            "Credit Card EMI",

        account:
            fromAccount,

        amount:
            Number(
                currentEMIExpense.toFixed(2)
            ),

        note:
            `${statement.card} EMI Payment (${statement.month})`,

        paymentId:
            paymentId,

        statementId:
            statement.id,

        isCreditCardEMI:
            true

    });


    /*
       Remember EMI already
       recorded as expense
    */

    statement.emiPaid =
        Number(

            (
                previousEMIPaid +
                currentEMIExpense

            ).toFixed(2)

        );

}


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


/* =========================================================
   VIEW EMI DETAILS
========================================================= */

function viewEmiDetails(id) {

    const emis =
        Storage.getEmiPurchases() || [];

    const emi =
        emis.find(
            e =>
                Number(e.id) ===
                Number(id)
        );

    if (!emi) {

        alert("EMI details not found");

        return;

    }


    const details =
        document.getElementById(
            "emiDetails"
        );

    if (!details) return;


    /* =====================================================
       EMI BASIC DATA
    ===================================================== */

    const totalMonths =
        Number(
            emi.months ||
            emi.totalMonths ||
            emi.installments ||
            0
        );


    const emiAmount =
        Number(
            emi.emiAmount || 0
        );


    const totalAmount =
        Number(
            emi.totalAmount || 0
        );


    /* =====================================================
       ACTUAL EMI PAYMENT
    ===================================================== */

    const paymentInfo =
        getActualEmiPaymentInfo(emi);


    const totalPaidAmount =
        paymentInfo.totalPaidAmount;


    /*
       Only COMPLETE EMI counts as Paid EMI.

       Example:

       EMI = 3000

       Paid = 2500

       Paid EMI = 0

       Next payment = 500

       Total Paid = 3000

       Paid EMI = 1
    */

    const paidMonths =
        emiAmount > 0

            ? Math.min(
                totalMonths,
                Math.floor(
                    (
                        totalPaidAmount +
                        0.001
                    ) /
                    emiAmount
                )
            )

            : 0;


    const remainingMonths =
        Math.max(
            0,
            totalMonths -
            paidMonths
        );


    const remainingAmount =
        Math.max(
            0,
            Number(
                (
                    totalAmount -
                    totalPaidAmount
                ).toFixed(2)
            )
        );


    /* =====================================================
       STATUS
    ===================================================== */

    const status =
        totalPaidAmount >=
        totalAmount
            ? "Paid"
            : "Active";


    /* =====================================================
       MODAL BODY
    ===================================================== */

    details.innerHTML = `

        <h3>
            ${emi.item || "EMI"}
        </h3>


        <p>
            Card:
            <strong>
                ${emi.card || "-"}
            </strong>
        </p>


        <p>
            Status:
            <strong>
                ${status}
            </strong>
        </p>


        <hr>


        <!-- =========================
             EMI SUMMARY
        ========================== -->

        <h4>
            EMI Summary
        </h4>


        <div class="table-container">

            <table class="table">

                <thead>

                    <tr>

                        <th>
                            EMI Amount
                        </th>

                        <th>
                            Total Amount
                        </th>

                        <th>
                            Remaining
                        </th>

                    </tr>

                </thead>


                <tbody>

                    <tr>

                        <td>
                            ${App.formatCurrency(
                                emiAmount
                            )}
                        </td>


                        <td>
                            ${App.formatCurrency(
                                totalAmount
                            )}
                        </td>


                        <td>
                            ${App.formatCurrency(
                                remainingAmount
                            )}
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>


        <hr>


        <!-- =========================
             EMI INFORMATION
        ========================== -->

        <h4>
            EMI Information
        </h4>


        <div class="table-container">

            <table class="table">

                <thead>

                    <tr>

                        <th>
                            Card
                        </th>

                        <th>
                            Start Date
                        </th>

                        <th>
                            Total EMI
                        </th>

                        <th>
                            Paid EMI
                        </th>

                        <th>
                            Remaining
                        </th>

                    </tr>

                </thead>


                <tbody>

                    <tr>

                        <td>
                            ${emi.card || "-"}
                        </td>


                        <td>
                            ${
                                emi.startDate
                                    ? formatDate(
                                        emi.startDate
                                    )
                                    : "-"
                            }
                        </td>


                        <td>
                            ${totalMonths}
                        </td>


                        <td>
                            ${paidMonths}
                        </td>


                        <td>
                            ${remainingMonths}
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>


        <hr>


        <!-- =========================
             PAYMENT HISTORY
        ========================== -->

        <div
            class="emi-history-header"
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:10px;
            "
        >

            <h4>
                Payment History
            </h4>


            <span
                id="emiPaymentCount"
                class="emi-payment-count"
            >
                0 Payments
            </span>

        </div>


        <div id="emiPaymentHistory">

            Loading payment history...

        </div>

    `;


    /* =====================================================
       RENDER PAYMENT HISTORY
    ===================================================== */

    renderEmiPaymentHistory(emi);


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    const modal =
        document.getElementById(
            "emiDetailsModal"
        );

    if (modal) {

        modal.style.display =
            "block";

    }

}


/* =========================================================
   GET ACTUAL EMI PAYMENT INFORMATION
   ---------------------------------------------------------
   IMPORTANT:
   - credit_card_payment = full statement payment
   - EMI gets payment priority
   - Normal CC expense is NOT counted as EMI payment
   - Partial payment first pays EMI
========================================================= */

function getActualEmiPaymentInfo(emi) {

    const payments =
        Storage.getCardPayments() || [];

    const statements =
        Storage.getCardStatements() || [];


    const emiPayments = [];

    let totalPaidAmount = 0;


    /* =====================================================
       FIND ALL STATEMENTS CONTAINING THIS EMI
    ===================================================== */

    const emiStatements =
        statements.filter(statement => {

            return (
                Array.isArray(
                    statement.emiDetails
                )
                &&
                statement.emiDetails.some(
                    item =>
                        Number(item.id) ===
                        Number(emi.id)
                )
            );

        });


    /* =====================================================
       PROCESS EACH STATEMENT
    ===================================================== */

    emiStatements.forEach(statement => {

        const statementEmiDetails =
            Array.isArray(
                statement.emiDetails
            )
                ? statement.emiDetails
                : [];


        /*
           EMI IDs in this statement
        */

        const emiItems =
            statementEmiDetails
            .filter(item =>
                Number(item.id) ===
                Number(emi.id)
            );


        if (!emiItems.length)
            return;


        /*
           Total EMI amount of THIS statement
        */

        const totalStatementEMI =
            statementEmiDetails.reduce(
                (sum, item) => {

                    return (
                        sum +
                        Number(
                            item.amount || 0
                        )
                    );

                },
                0
            );


        if (totalStatementEMI <= 0)
            return;


        /* =================================================
           PAYMENTS FOR THIS STATEMENT
        ================================================= */

        const statementPayments =
            payments
            .filter(payment => {

                return (

                    Number(
                        payment.statementId
                    ) ===
                    Number(
                        statement.id
                    )

                );

            })
            .sort(
                (a, b) => {

                    return (
                        new Date(
                            a.paymentDate
                        ) -
                        new Date(
                            b.paymentDate
                        )
                    );

                }
            );


        /*
           How much EMI has already been
           allocated before each payment
        */

        let emiAlreadyPaid = 0;


        /* =================================================
           PROCESS PAYMENTS
        ================================================= */

        statementPayments.forEach(payment => {

            const paymentAmount =
                Number(
                    payment.amount || 0
                );


            if (paymentAmount <= 0)
                return;


            /*
               EMI gets priority.

               Example:

               Statement = 4500
               EMI       = 3000
               Payment   = 2500

               EMI allocation = 2500
            */

            const remainingStatementEMI =
                Math.max(
                    0,
                    totalStatementEMI -
                    emiAlreadyPaid
                );


            const emiAllocation =
                Math.min(
                    paymentAmount,
                    remainingStatementEMI
                );


            if (emiAllocation <= 0)
                return;


            /*
               Now allocate this EMI payment
               to the specific EMI.

               If multiple EMI items exist,
               they are paid in order.
            */

            let amountBeforeThisEmi = 0;

            for (
                const item
                of statementEmiDetails
            ) {

                const itemAmount =
                    Number(
                        item.amount || 0
                    );


                if (
                    Number(item.id) ===
                    Number(emi.id)
                ) {

                    const itemAlreadyPaid =
                        Math.max(
                            0,
                            emiAlreadyPaid -
                            amountBeforeThisEmi
                        );


                    const itemRemaining =
                        Math.max(
                            0,
                            itemAmount -
                            itemAlreadyPaid
                        );


                    const currentPayment =
                        Math.min(
                            emiAllocation,
                            itemRemaining
                        );


                    if (
                        currentPayment > 0
                    ) {

                        emiPayments.push({

                            payment:
                                payment,

                            amount:
                                Number(
                                    currentPayment
                                    .toFixed(2)
                                ),

                            emiItem:
                                item

                        });

                        totalPaidAmount +=
                            currentPayment;

                    }


                    break;

                }


                amountBeforeThisEmi +=
                    itemAmount;

            }


            emiAlreadyPaid +=
                emiAllocation;

        });

    });


    return {

        emiPayments:
            emiPayments,

        totalPaidAmount:
            Number(
                totalPaidAmount.toFixed(2)
            )

    };

}


function renderEmiPaymentHistory(emi) {

    const container =
        document.getElementById(
            "emiPaymentHistory"
        );


    if (!container)
        return;


    const paymentInfo =
        getActualEmiPaymentInfo(emi);


    const emiPayments =
        paymentInfo.emiPayments;


    /* =====================================================
       PAYMENT COUNT
    ===================================================== */

    const countElement =
        document.getElementById(
            "emiPaymentCount"
        );


    if (countElement) {

        countElement.textContent =
            `${emiPayments.length} ${
                emiPayments.length === 1
                    ? "Payment"
                    : "Payments"
            }`;

    }


    /* =====================================================
       NO PAYMENT
    ===================================================== */

    if (
        emiPayments.length === 0
    ) {

        container.innerHTML = `

            <div
                style="
                    padding:20px;
                    text-align:center;
                    color:#64748b;
                "
            >

                No payment history found.

            </div>

        `;

        return;

    }


    /* =====================================================
       SORT LATEST FIRST
    ===================================================== */

    emiPayments.sort(
        (a, b) => {

            return (

                new Date(
                    b.payment.paymentDate
                ) -

                new Date(
                    a.payment.paymentDate
                )

            );

        }
    );


    /* =====================================================
       TOTAL PAYMENT AMOUNT
    ===================================================== */

    const totalAmount =
        emiPayments.reduce(
            (total, record) => {

                return (
                    total +
                    Number(
                        record.amount || 0
                    )
                );

            },
            0
        );


    /* =====================================================
       TABLE
    ===================================================== */

    container.innerHTML = `

        <div class="table-container">

            <table class="table">

                <thead>

                    <tr>

                        <th>
                            #
                        </th>

                        <th>
                            Month
                        </th>

                        <th>
                            Date
                        </th>

                        <th>
                            Amount
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        emiPayments
                        .map(
                            (
                                record,
                                index
                            ) => {

                                const payment =
                                    record.payment;


                                return `

                                    <tr>

                                        <td>
                                            ${
                                                emiPayments.length -
                                                index
                                            }
                                        </td>


                                        <td>

                                            ${
                                                payment.statementMonth
                                                    ? formatStatementMonth(
                                                        payment.statementMonth
                                                    )
                                                    : "-"
                                            }

                                        </td>


                                        <td>

                                            ${
                                                payment.paymentDate
                                                    ? formatDate(
                                                        payment.paymentDate
                                                    )
                                                    : "-"
                                            }

                                        </td>


                                        <td>

                                            <strong>

                                                ${
                                                    App.formatCurrency(
                                                        record.amount
                                                    )
                                                }

                                            </strong>

                                        </td>


                                        <td>

                                            <span
                                                class="badge badge-success"
                                            >

                                                Paid

                                            </span>

                                        </td>

                                    </tr>

                                `;

                            }
                        )
                        .join("")
                    }

                </tbody>


                <!-- =====================================
                     TOTAL
                ====================================== -->

                <tfoot>

                    <tr>

                        <th
                            colspan="3"
                            style="
                                text-align:right;
                                font-weight:700;
                            "
                        >

                            Total

                        </th>


                        <th
                            style="
                                font-weight:700;
                            "
                        >

                            ${App.formatCurrency(totalAmount)}

                        </th>
						
						<th>
						</th>

                    </tr>

                </tfoot>

            </table>

        </div>

    `;

}


/* =========================================================
   CLOSE EMI DETAILS
========================================================= */

function closeEmiDetails() {

    const modal =
        document.getElementById(
            "emiDetailsModal"
        );

    if (!modal) return;


    modal.style.display =
        "none";

}


/* =========================================================
   GLOBAL
========================================================= */

window.viewEmiDetails =
    viewEmiDetails;

window.closeEmiDetails =
    closeEmiDetails;



	
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




function printEMIModal() {

    const modal =
        document.getElementById(
            "emiDetailsModal"
        );

    if (!modal) {

        alert("EMI Details modal not found.");

        return;

    }


    /* =========================================
       CREATE PRINT WINDOW
    ========================================= */

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print."
        );

        return;

    }


    /* =========================================
       CLONE COMPLETE MODAL
    ========================================= */

    const modalClone =
        modal.cloneNode(true);


    /* =========================================
       REMOVE BUTTON AREA
    ========================================= */

    const actionButton =
        modalClone.querySelector(
            ".statement-modal-header .action-button"
        );


    if (actionButton) {

        actionButton.remove();

    }


    /* =========================================
       PRINT DOCUMENT
    ========================================= */

    printWindow.document.open();

    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>EMI Details</title>


            <link
                rel="stylesheet"
                href="css/main.css"
            >


            <style>

                @page {

                    size: A4;

                    margin: 12mm;

                }


                html,
                body {

                    margin: 0 !important;

                    padding: 0 !important;

                    background: #fff !important;

                    font-family:
                        "Segoe UI",
                        Arial,
                        sans-serif;

                }


                .statement-modal {

                    display: block !important;

                    position: static !important;

                    width: 100% !important;

                    height: auto !important;

                    padding: 0 !important;

                    margin: 0 !important;

                    background: transparent !important;

                    overflow: visible !important;

                    backdrop-filter: none !important;

                }


                .statement-modal-content {

                    width: 100% !important;

                    max-width: 900px !important;

                    margin: 0 auto !important;

                    background: #fff !important;

                    border-radius: 20px !important;

                    box-shadow:
                        0 15px 50px
                        rgba(0,0,0,.25) !important;

                    overflow: hidden !important;

                }


                .statement-modal-header {

                    display: flex !important;

                    justify-content:
                        space-between !important;

                    align-items: center !important;

                    padding: 20px 25px !important;

                    background: #2196f3 !important;

                    color: #fff !important;

                }


                .statement-modal-header h2 {

                    margin: 0 !important;

                    font-size: 20px !important;

                    font-weight: 700 !important;

                    color: #fff !important;

                }


                #emiDetails {

                    padding: 25px !important;

                    background: #fff !important;

                }


                #emiDetails h3 {

                    margin-bottom: 10px !important;

                }


                #emiDetails h4 {

                    margin-top: 20px !important;

                    margin-bottom: 10px !important;

                }


                #emiDetails p {

                    margin-bottom: 6px !important;

                }


                #emiDetails .table-container {

                    width: 100% !important;

                    overflow: visible !important;

                }


                #emiDetails table {

                    width: 100% !important;

                    border-collapse: collapse !important;

                    margin-top: 10px !important;

                }


                #emiDetails th {

                    background: #f3f6fa !important;

                    padding: 12px !important;

                    text-align: left !important;

                    border: 1px solid #e5e5e5 !important;

                }


                #emiDetails td {

                    padding: 12px !important;

                    border: 1px solid #e5e5e5 !important;

                }


                #emiDetails tfoot tr {

                    background: #f5f7fa !important;

                }


                #emiDetails tfoot th {

                    font-weight: 700 !important;

                    border-top:
                        2px solid #ddd !important;

                    background: #f5f7fa !important;

                }


                #emiDetails .badge-success {

                    background:
                        rgba(22,163,74,.15) !important;

                    color: #16a34a !important;

                }


                #emiDetails .emi-payment-count {

                    display: inline-block !important;

                    padding: 4px 10px !important;

                    border-radius: 999px !important;

                    background:
                        rgba(37,99,235,.12) !important;

                    color: #2563eb !important;

                    font-size: 12px !important;

                    font-weight: 600 !important;

                }


                #emiDetails hr {

                    border: 0 !important;

                    border-top:
                        1px solid #e5e7eb !important;

                    margin: 18px 0 !important;

                }


                * {

                    -webkit-print-color-adjust:
                        exact !important;

                    print-color-adjust:
                        exact !important;

                }


                tr {

                    page-break-inside:
                        avoid !important;

                }

            </style>

        </head>


        <body>

            ${modalClone.outerHTML}

        </body>

        </html>

    `);

    printWindow.document.close();


    /* =========================================
       PRINT
    ========================================= */

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