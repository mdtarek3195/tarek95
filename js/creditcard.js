const CreditCards = (() => {

    function init() {

        loadSummary();

        renderCards();
		
		loadEMICards();

		loadEMITable();
		
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

    
.filter(a => {

    const type =

        String(
            a.type || ""
        )

        .toLowerCase()
        .replaceAll(" ", "");

    return (

        type === "creditcard" ||

        type === "card" ||

        type === "cc"

    );

})
    

        



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

        document
        .getElementById(
            "statementCard"
        )
        .value;

    const month =

        document
        .getElementById(
            "statementMonth"
        )
        .value;

    if (

        !card ||

        !month

    ) {

        alert(
            "Select card and month"
        );

        return;

    }

    const transactions =

        Storage
        .getTransactions()

        .filter(t => {

            return (

                t.account === card &&

                t.date.startsWith(
                    month
                )

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
                    t.amount
                ),

            0

        );

    const emis =

        Storage
        .getEmiPurchases()

        .filter(emi =>

            emi.card === card &&

            emi.remainingMonths > 0

        );

    const emiTotal =

        emis.reduce(

            (sum, emi) =>

                sum +

                Number(
                    emi.emiAmount
                ),

            0

        );

    const amount =

        normalAmount +

        emiTotal;

    if (amount === 0) {

        alert(
            "No transactions found"
        );

        return;

    }

    const statements =

        Storage
        .getCardStatements();

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

    const statementDate =

        month + "-28";

    const dueDate =

        new Date(
            statementDate
        );

    dueDate.setDate(
        dueDate.getDate() + 15
    );

    statements.push({

        id:
            Date.now(),

        card,

        month,

        statementDate,

        dueDate:

            dueDate
            .toISOString()
            .split("T")[0],

        amount,

        paid: 0,

        remaining:
            amount,

        status:
            "Unpaid",

        transactions:

            normalTransactions.map(
                t => ({

                    date:
                        t.date,

                    description:
                        t.note ||
                        t.category,

                    amount:
                        t.amount

                })
            ),

        emiDetails:

emiDetails:

    emis.map(
        emi => ({

            item:
                emi.item,

            type:
                emi.emiType,

            description:

                emi.emiType ===
                "loan"

                    ?

                    "Loan EMI"

                    :

                    `${emi.item} EMI`,

            amount:
                emi.emiAmount,

            remainingMonths:
                emi.remainingMonths

        })
    )

                
            

    });

    Storage
    .saveCardStatements(
        statements
    );

    loadStatementTable();

    App.showToast(
        "Statement Generated"
    );

}




function loadStatementTable() {

    const tbody =

        document.getElementById(
            "statementTableBody"
        );

    if (!tbody) return;

    const statements =

        Storage.getCardStatements
        ? Storage.getCardStatements()
        : [];

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

                    ${statement.statementDate}

                </td>

                <td>

                    ${statement.dueDate}

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
						class="btn btn-success"
						onclick="downloadStatement(${statement.id})">

						Download

					</button>

					<button
						class="btn btn-danger"
						onclick="deleteStatement(${statement.id})">

						Delete

					</button>

				</td>

            </tr>

        `)

        .join("");

}



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
        ).value;
	const emiType =

    document
    .getElementById(
        "emiType"
    )
    .value;

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

    if (
        !item ||
        !amount ||
        !months
    ) {

        alert(
            "Fill all fields"
        );

        return;

    }

    Storage.addEmiPurchase({

    item,

    emiType,

    card,

    totalAmount:
        amount,

        emiAmount:
            amount / months,

        months,

        remainingMonths:
            months,

        startDate,

        status:
            "active"

    });
	const transactions =
    Storage.getTransactions();

	const trx =
		transactions.find(

			t =>

				t.account === card &&

				Number(t.amount) === amount

		);

	if (trx) {

		trx.isEmi = true;

		Storage.saveTransactions(
			transactions
		);

	}

    loadEMITable();

    App.showToast(
        "EMI Created"
    );

}

function loadEMITable() {

    const tbody =
        document.getElementById(
            "emiTableBody"
        );

    if (!tbody)
        return;

    const emis =
        Storage.getEmiPurchases();

    if (
        !emis ||
        emis.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="6"
                    class="text-center">

                    No EMI Found

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

    ${emi.emiType === "loan"

        ? "Loan EMI"

        : "Purchase EMI"}

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
                    ${emi.remainingMonths}
                </td>

                <td>

                    <button
                        class="btn btn-danger"
                        onclick="deleteEmi(${emi.id})">

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

        Storage
        .getEmiPurchases()

        .filter(
            e => e.id !== id
        );

    Storage
    .saveEmiPurchases(
        emis
    );

    loadEMITable();

    App.showToast(
        "EMI Deleted"
    );

}
window.deleteEmi =
    deleteEmi;


function deleteStatement(id) {

    if (
        !confirm(
            "Delete Statement?"
        )
    ) return;

    const statements =

        Storage
        .getCardStatements()

        .filter(
            s => s.id !== id
        );

    Storage
    .saveCardStatements(
        statements
    );

    loadStatementTable();

    App.showToast(
        "Statement Deleted"
    );

}

window.deleteStatement =
    deleteStatement;


function downloadStatement(id) {

    const statement =

        Storage
        .getCardStatements()
        .find(
            s => s.id === id
        );

    if (!statement) return;

    const transactions =

        Storage
        .getTransactions()

        .filter(
            t =>
                t.account === statement.card &&
                t.date.startsWith(
                    statement.month
                )
        );

    let content = `

Credit Card Statement

Card:
${statement.card}

Month:
${statement.month}

Statement Date:
${statement.statementDate}

Due Date:
${statement.dueDate}

--------------------------------

`;

    transactions.forEach(t => {

        content +=

`${t.date}
${t.note || t.category}
${t.amount}

`;

    });

    content += `

--------------------------------

Total:
${statement.amount}

`;

    const blob =

        new Blob(
            [content],
            {
                type:
                "text/plain"
            }
        );

    const url =

        URL.createObjectURL(
            blob
        );

    const a =
        document.createElement(
            "a"
        );

    a.href = url;

    a.download =

        `${statement.card}-${statement.month}.txt`;

    a.click();

    URL.revokeObjectURL(
        url
    );

}

window.downloadStatement =
    downloadStatement;





            
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
            Statement:
            ${statement.month}
        </p>

        <p>
            Statement Date:
            ${statement.statementDate}
        </p>

        <p>
            Due Date:
            ${statement.dueDate}
        </p>

        <hr>

        <h4>
            Transactions
        </h4>

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
                            ${t.date}
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

        <hr>

        <h4>
            EMI Installments
        </h4>

        <table class="table">

            <thead>

                <tr>

                    <th>Description</th>

                    <th>Monthly EMI</th>

                    <th>Remaining</th>

                </tr>

            </thead>

            <tbody>

                ${(statement.emiDetails || [])

                .map(emi => `

                    <tr>

                        <td>

                            ${
                                emi.description ||

                                emi.item ||

                                "EMI"
                            }

                        </td>

                        <td>

                            ${App.formatCurrency(
                                emi.amount
                            )}

                        </td>

                        <td>

                            ${emi.remainingMonths}

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

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

        <button
            class="btn btn-warning"
            onclick="payStatement(${statement.id})">

            Pay Statement

        </button>

    `;

    document
    .getElementById(
        "statementModal"
    )
    .style.display =
        "block";

}



	


function payStatement(id) {

    const payment = Number(

        prompt(
            "Enter Payment Amount"
        )

    );

    if (

        !payment ||

        payment <= 0

    ) return;

    const statements =

        Storage
        .getCardStatements();

    const statement =

        statements.find(
            s => s.id === id
        );

    if (!statement)
        return;

    if (

        payment >

        Number(
            statement.remaining
        )

    ) {

        alert(
            "Payment exceeds outstanding amount"
        );

        return;

    }

    statement.paid =

        Number(
            statement.paid || 0
        ) + payment;

    statement.remaining =

        Number(
            statement.amount
        ) -

        Number(
            statement.paid
        );

    if (

        statement.remaining <= 0

    ) {

        statement.remaining = 0;

        statement.status =
            "Paid";

    } else {

        statement.status =
            "Partial";

    }

    const accounts =

        Storage
        .getAccounts();

    const card =

        accounts.find(

            a =>

                a.name ===
                statement.card

        );

    if (card) {

        card.balance =

            Math.max(

                0,

                Number(
                    card.balance || 0
                ) - payment

            );

        Storage.saveAccounts(
            accounts
        );

    }

    const emis =

        Storage
        .getEmiPurchases();

    emis.forEach(emi => {

        if (

            emi.card ===
            statement.card &&

            emi.remainingMonths > 0

        ) {

            emi.remainingMonths--;

            if (

                emi.remainingMonths <= 0

            ) {

                emi.remainingMonths = 0;

                emi.status =
                    "completed";

            }

        }

    });

    Storage.saveEmiPurchases(
        emis
    );

    Storage.saveCardStatements(
        statements
    );

    loadSummary();

    renderCards();

    loadEMITable();

    loadStatementTable();

    viewStatement(id);

    App.showToast(
        "Payment Added Successfully"
    );

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

        const cards =

            Storage
            .getAccounts()

            .filter(

                a =>
                a.type ===
                "creditcard"

            );

        const totalLimit =

            cards.reduce(

                (sum, card) =>

                    sum +
                    Number(
                        card.limit || 0
                    ),

                0

            );

			const outstanding =

				cards.reduce(

					(sum, card) =>

						sum +
						Math.abs(
							Number(
								card.balance || 0
							)
						),

					0

				);

        const available =

            totalLimit -
            outstanding;

        const utilization =

            totalLimit > 0

                ?

                (
                    outstanding /
                    totalLimit
                ) * 100

                :

                0;

        document
        .getElementById(
            "totalCardLimit"
        )
        .textContent =

            App.formatCurrency(
                totalLimit
            );

        document
        .getElementById(
            "totalOutstanding"
        )
        .textContent =

            App.formatCurrency(
                outstanding
            );

        document
        .getElementById(
            "availableCredit"
        )
        .textContent =

            App.formatCurrency(
                available
            );

        document
        .getElementById(
            "utilizationPercent"
        )
        .textContent =

            utilization
            .toFixed(1) + "%";

    }

    function renderCards() {

        const cards =

    Storage.getAccounts()

    .filter(a => {

        const type =

            String(
                a.type || ""
            )

            .toLowerCase()
            .replaceAll(" ", "");

        return (

            type === "creditcard" ||

            type === "card" ||

            type === "cc"

        );

    });

        const container =

            document.getElementById(
                "creditCardList"
            );

        if (

            cards.length === 0

        ) {

            container.innerHTML =

                "<p>No Credit Cards Found</p>";

            return;

        }

        container.innerHTML =

            cards.map(card => {

                const used =

                    Number(
                        card.balance || 0
                    );

                const limit =

                    Number(
                        card.limit || 0
                    );

                const available =

                    limit -
                    used;

                const utilization =

                    limit > 0

                        ?

                        (
                            used /
                            limit
                        ) * 100

                        :

                        0;

                return `

                    <div class="card mb-15">

                        <h4>

                            ${card.name}

                        </h4>

                        <p>

                            Limit:
                            ${App.formatCurrency(limit)}

                        </p>

                        <p>

                            Used:
                            ${App.formatCurrency(used)}

                        </p>

                        <p>

                            Available:
                            ${App.formatCurrency(available)}

                        </p>

                        <p>

                            Utilization:
                            ${utilization.toFixed(1)}%

                        </p>

                    </div>

                `;

            }).join("");

    }

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
