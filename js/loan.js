const Loan = (() => {

    function init() {

        loadAccounts();

        loadLoans();
		
		loadLoanSummary();
		
		loadPersonDropdown();
		
		updateLoanDashboard();

        document.getElementById(
            "loanDate"
        ).value =
            new Date()
            .toISOString()
            .split("T")[0];
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

                    <td>

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
		
		generateStatement

    };

})();

document.addEventListener(
    "DOMContentLoaded",
    Loan.init
);