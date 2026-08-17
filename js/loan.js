const Loan = (() => {
let editingLoanId = null;
    function init() {

        loadAccounts();

        loadLoans();
		
		loadLoanSummary();
		
		loadPersonDropdown();
		
		updateLoanDashboard();
		
		loadLoanPersonFilter();

        document.getElementById(
            "loanDate"
        ).value =
            new Date()
            .toISOString()
            .split("T")[0];
   
		 /* =====================
			   DEFAULT CURRENT MONTH
			===================== */

			const today =
				new Date();

			const fromDate =

				`${today.getFullYear()}-${String(
					today.getMonth() + 1
				).padStart(2,"0")}-01`;

			const toDate =

				`${today.getFullYear()}-${String(
					today.getMonth() + 1
				).padStart(2,"0")}-${String(
					today.getDate()
				).padStart(2,"0")}`;

			document.getElementById(
				"loanFromDate"
			).value = fromDate;

			document.getElementById(
				"loanToDate"
			).value = toDate;



filterLoans();

   }

    function loadAccounts() {

        const accounts =
            Storage.getAccounts();

        const dropdown =
            document.getElementById(
                "loanAccount"
            );

        dropdown.innerHTML = "";

        accounts.forEach(account => {

            dropdown.innerHTML += `

                <option value="${account.name}">
                    ${account.name}
                </option>

            `;

        });

    }

    function saveLoan() {

        const type =
            document.getElementById(
                "loanType"
            ).value;

        const person =
            document.getElementById(
                "loanPerson"
            ).value;

        const account =
            document.getElementById(
                "loanAccount"
            ).value;

        const amount =
            Number(
                document.getElementById(
                    "loanAmount"
                ).value
            );

        const date =
            document.getElementById(
                "loanDate"
            ).value;

        const note =
            document.getElementById(
                "loanNote"
            )?.value || "";

        if (
            !person ||
            !amount
        ) {

            alert(
                "Please enter person and amount."
            );

            return;
        }

if (editingLoanId) {

    const loans =
        Storage.getLoans();

    const loan =
        loans.find(
            l => l.id === editingLoanId
        );

    if (!loan)
        return;

    /* Reverse old balance */

    if (loan.type === "borrow") {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "expense"
        );

    }

    else if (loan.type === "repay") {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "income"
        );

    }

    else if (loan.type === "loan_given") {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "income"
        );

    }

    else if (loan.type === "loan_received") {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "expense"
        );

    }

    /* Update loan */

    loan.type = type;
    loan.person = person;
    loan.account = account;
    loan.amount = amount;
    loan.date = date;
    loan.note = note;

    Storage.saveLoans(
        loans
    );

    /* Apply new balance */

    if (type === "borrow") {

        Storage.updateAccountBalance(
            account,
            amount,
            "income"
        );

    }

    else if (type === "repay") {

        Storage.updateAccountBalance(
            account,
            amount,
            "expense"
        );

    }

    else if (type === "loan_given") {

        Storage.updateAccountBalance(
            account,
            amount,
            "expense"
        );

    }

    else if (type === "loan_received") {

        Storage.updateAccountBalance(
            account,
            amount,
            "income"
        );

    }

    editingLoanId = null;

    loadLoans();

    loadLoanSummary();

    updateLoanDashboard();

    loadPersonDropdown();

    clearForm();

    App.showToast(
        "Loan Updated"
    );

    return;

}

        Storage.addLoan({

            type,

            person,

            account,

            amount,

            date,

            note

        });

        // Account Balance Update

        if (
            type === "borrow"
        ) {

            Storage.updateAccountBalance(
                account,
                amount,
                "income"
            );

        }

        if (
            type === "repay"
        ) {

            Storage.updateAccountBalance(
                account,
                amount,
                "expense"
            );

        }

        if (
            type === "loan_given"
        ) {

            Storage.updateAccountBalance(
                account,
                amount,
                "expense"
            );

        }

        if (
            type === "loan_received"
        ) {

            Storage.updateAccountBalance(
                account,
                amount,
                "income"
            );

        }

        loadLoans();

        clearForm();
		
		loadLoanSummary();
		
		updateLoanDashboard();
		
		loadPersonDropdown();
    }

    function loadLoans() {
		

        const loans =
            Storage.getLoans();

        const tbody =
            document.getElementById(
                "loanTableBody"
            );

        if (!tbody)
            return;

        tbody.innerHTML = "";

		const typeLabels = {

			borrow: "Borrow",

			repay: "Repay",

			loan_given: "Loan Given",

			loan_received: "Loan Received"

		};

        loans.forEach(loan => {
			

            tbody.innerHTML += `

                <tr>

                    <td>
                        ${App.formatDate(
                            loan.date
                        )}
                    </td>

					<td>
						${typeLabels[loan.type] || loan.type}
					</td>

                    <td>
                        ${loan.person}
                    </td>

                    <td>
                        ${loan.account}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            loan.amount
                        )}
                    </td>

                    <td>
                        ${loan.note || ""}
                    </td>

                    <td style="text-align: center">

					<button class="btn btn-primary"
						onclick="Loan.editLoan(${loan.id})">

						Edit

					</button>

                        <button class="btn btn-danger"
                            onclick="Loan.deleteLoan(${loan.id})">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        });

    }
	
function loadLoanSummary() {

    const loans =
        Storage.getLoans();

    const tbody =
        document.getElementById(
            "loanSummaryBody"
        );

    if (!tbody) return;

    const summary = {};

    loans.forEach(loan => {

        if (!summary[loan.person]) {

            summary[loan.person] = {

                borrowed: 0,

                repaid: 0

            };

        }

        if (
            loan.type === "borrow"
        ) {

            summary[
                loan.person
            ].borrowed +=
                Number(
                    loan.amount
                );
        }

        if (
            loan.type === "repay"
        ) {

            summary[
                loan.person
            ].repaid +=
                Number(
                    loan.amount
                );
        }

    });

    tbody.innerHTML = "";

    Object.keys(summary)
        .forEach(person => {

        const balance =

            summary[person]
            .borrowed

            -

            summary[person]
            .repaid;

        tbody.innerHTML += `

            <tr>

                <td>
                    ${person}
                </td>

                <td>
                    ${App.formatCurrency(
                        summary[person]
                        .borrowed
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        summary[person]
                        .repaid
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        balance
                    )}
                </td>

            </tr>

        `;

    });

}	



function editLoan(id) {

    const loan =

        Storage.getLoans()

        .find(
            l => l.id === id
        );

    if (!loan)
        return;

    document.getElementById(
        "loanType"
    ).value =
        loan.type;

    document.getElementById(
        "loanPerson"
    ).value =
        loan.person;

    document.getElementById(
        "loanAccount"
    ).value =
        loan.account;

    document.getElementById(
        "loanAmount"
    ).value =
        loan.amount;

    document.getElementById(
        "loanDate"
    ).value =
        loan.date;

    document.getElementById(
        "loanNote"
    ).value =
        loan.note || "";

    editingLoanId = id;

}




function updateLoanDashboard() {

    const loans =
        Storage.getLoans();

    let borrowed = 0;
    let repaid = 0;
    let loanGiven = 0;

    loans.forEach(loan => {

        if (loan.type === "borrow")
            borrowed += Number(loan.amount);

        if (loan.type === "repay")
            repaid += Number(loan.amount);

        if (loan.type === "loan_given")
            loanGiven += Number(loan.amount);

    });

    document.getElementById(
        "totalBorrowed"
    ).textContent =
        App.formatCurrency(
            borrowed
        );

    document.getElementById(
        "totalRepaid"
    ).textContent =
        App.formatCurrency(
            repaid
        );

    document.getElementById(
        "loanGiven"
    ).textContent =
        App.formatCurrency(
            loanGiven
        );

    document.getElementById(
        "outstandingLoan"
    ).textContent =
        App.formatCurrency(
            borrowed - repaid
        );
}


function loadPersonDropdown() {

    const loans =
        Storage.getLoans();

    const dropdown =
        document.getElementById(
            "statementPerson"
        );

    if (!dropdown) return;

    const persons =

        [...new Set(
            loans.map(
                l => l.person
            )
        )];

    dropdown.innerHTML = "";

    persons.forEach(person => {

        dropdown.innerHTML += `

            <option value="${person}">
                ${person}
            </option>

        `;

    });

}



function filterLoanSummary() {

    const keyword =

        document
        .getElementById(
            "loanSummarySearch"
        )
        .value
        .toLowerCase();

    const rows =

        document.querySelectorAll(
            "#loanSummaryBody tr"
        );

    rows.forEach(row => {

        const person =

            row.children[0]
            .textContent
            .toLowerCase();

        row.style.display =

            person.includes(
                keyword
            )

            ? ""

            : "none";

    });

}



function filterLoans() {

    const person =

        document.getElementById(
            "loanPersonFilter"
        ).value;

    const fromDate =

        document.getElementById(
            "loanFromDate"
        ).value;

    const toDate =

        document.getElementById(
            "loanToDate"
        ).value;

    let loans =

        Storage.getLoans();

    if (person) {

        loans = loans.filter(

            loan =>

                loan.person ===
                person

        );

    }

    if (fromDate) {

        loans = loans.filter(

            loan =>

                loan.date >=
                fromDate

        );

    }

    if (toDate) {

        loans = loans.filter(

            loan =>

                loan.date <=
                toDate

        );

    }

    renderFilteredLoans(
        loans
    );

}




function renderFilteredLoans(
    loans
) {

    const tbody =

        document.getElementById(
            "loanTableBody"
        );

    if (!tbody)
        return;

    tbody.innerHTML = "";

    loans.forEach(loan => {

        tbody.innerHTML += `

            <tr>

                <td>
                    ${App.formatDate(
                        loan.date
                    )}
                </td>

                <td>
                    ${loan.type}
                </td>

                <td>
                    ${loan.person}
                </td>

                <td>
                    ${loan.account}
                </td>

                <td>
                    ${App.formatCurrency(
                        loan.amount
                    )}
                </td>

                <td>
                    ${loan.note || ""}
                </td>

                <td>

                    <button
                        class="btn btn-primary"
                        onclick="Loan.editLoan(${loan.id})"
                    >

                        Edit

                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="Loan.deleteLoan(${loan.id})"
                    >

                        Delete

                    </button>

                </td>

            </tr>

        `;

    });

}



function resetLoanFilter() {

    document.getElementById(
        "loanPersonFilter"
    ).value = "";

    document.getElementById(
        "loanFromDate"
    ).value = "";

    document.getElementById(
        "loanToDate"
    ).value = "";

    loadLoans();

}





function loadLoanPersonFilter() {

    const select =
        document.getElementById(
            "loanPersonFilter"
        );

    if (!select)
        return;

    const loans =
        Storage.getLoans();

    const persons = [

        ...new Set(

            loans.map(
                loan =>
                loan.person
            )

        )

    ];

    select.innerHTML = `

        <option value="">

            All Persons

        </option>

    `;

    persons.forEach(person => {

        select.innerHTML += `

            <option
                value="${person}"
            >

                ${person}

            </option>

        `;

    });

}



function generateStatement() {

    const person =

        document.getElementById(
            "statementPerson"
        ).value;

    const loans =

        Storage.getLoans()

        .filter(
            l =>
            l.person === person
        )

        .sort(
            (a, b) =>
            new Date(a.date) -
            new Date(b.date)
        );

    const tbody =

        document.getElementById(
            "loanStatementBody"
        );

    tbody.innerHTML = "";

    let balance = 0;

    loans.forEach(loan => {

        if (
            loan.type === "borrow"
        ) {

            balance += loan.amount;

        }

        if (
            loan.type === "repay"
        ) {

            balance -= loan.amount;

        }

        tbody.innerHTML += `

            <tr>

                <td>
                    ${App.formatDate(
                        loan.date
                    )}
                </td>

                <td>
                    ${loan.type}
                </td>

                <td>
                    ${App.formatCurrency(
                        loan.amount
                    )}
                </td>

                <td>
                    ${App.formatCurrency(
                        balance
                    )}
                </td>

            </tr>

        `;

    });

}
	

function deleteLoan(id) {

    const loan =

        Storage.getLoans()

        .find(

            l => l.id === id

        );

    if (!loan) return;

    // Reverse Account Balance

    if (
        loan.type === "borrow"
    ) {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "expense"
        );

    }

    else if (
        loan.type === "repay"
    ) {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "income"
        );

    }

    else if (
        loan.type === "loan_given"
    ) {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "income"
        );

    }

    else if (
        loan.type === "loan_received"
    ) {

        Storage.updateAccountBalance(
            loan.account,
            loan.amount,
            "expense"
        );

    }

    Storage.deleteLoan(id);

    loadLoans();
	
	loadLoanSummary();
	
	updateLoanDashboard();
	
	loadPersonDropdown();

}

    function clearForm() {

        document.getElementById(
            "loanPerson"
        ).value = "";

        document.getElementById(
            "loanAmount"
        ).value = "";

        if (
            document.getElementById(
                "loanNote"
            )
        ) {

            document.getElementById(
                "loanNote"
            ).value = "";

        }

    }

    return {

        init,

        saveLoan,

        deleteLoan,
		
		editLoan,
		
		generateStatement,
		
		filterLoans,
	
        filterLoanSummary,	

		resetLoanFilter

    };

})();

document.addEventListener(
    "DOMContentLoaded",
    Loan.init
);