/* ==========================================
   Expense Manager Pro
   File: js/budget.js
   ========================================== */

const Budget = (() => {

    let budgets = [];

    // =========================
    // INIT
    // =========================

	function init() {

		loadCategories();

		setDefaultMonth();

		setDefaultFilterMonth();

		budgets =
			Storage.getBudgets();

		loadYearFilter();

		renderTable();

		updateSummary();

		bindEvents();

	}

    // =========================
    // LOAD EXPENSE CATEGORIES
    // =========================

    function loadCategories() {

        const select =
            document.getElementById(
                "budgetCategory"
            );

        if (!select) return;

        const categories =
            Storage.getCategories()
            .filter(
                c => c.type === "expense"
            );

        select.innerHTML = "";

        categories.forEach(category => {

            select.innerHTML += `
                <option value="${category.name}">
                    ${category.name}
                </option>
            `;

        });
    }
	
	
	function setDefaultMonth() {

    const today =
        new Date();

    document.getElementById(
        "budgetMonth"
    ).value =

        today
        .toISOString()
        .slice(0, 7);

}

function setDefaultFilterMonth() {

    const today =
        new Date();

    document.getElementById(
        "budgetFilterMonth"
    ).value =

        today
        .toISOString()
        .slice(0, 7);

}

function loadYearFilter() {
	
	console.log("Year Filter Budgets:", budgets);

    const years = [

        ...new Set(

            budgets.map(

                b =>
                b.month.slice(0, 4)

            )

        )

    ];
	console.log(
    "Years:",
    years
);

    const dropdown =

        document.getElementById(
            "budgetFilterYear"
        );

    if (!dropdown)
        return;

    dropdown.innerHTML = `

        <option value="">
            All Years
        </option>

    `;

    years.forEach(year => {

        dropdown.innerHTML += `

            <option value="${year}">
                ${year}
            </option>

        `;

    });

}

    // =========================
    // LOAD BUDGETS
    // =========================

function loadBudgets() {

    budgets =
        Storage.getBudgets();

    renderTable();

    updateSummary();

}




// Month format

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

    // =========================
    // ADD BUDGET
    // =========================

    function saveBudget() {

			const month =
			document.getElementById(
				"budgetMonth"
			).value;
			
        const category =
            document.getElementById(
                "budgetCategory"
            ).value;

        const amount =
            Number(
                document.getElementById(
                    "budgetAmount"
                ).value
            );
if (!month || !category) {

    alert(
        "Please select month and category."
    );

    return;
}
        if (!amount || amount <= 0) {

            alert(
                "Please enter valid budget amount."
            );

            return;
        }

const exists =
    budgets.find(

        b =>

            b.category ===
            category

            &&

            b.month ===
            month

    );

        if (exists) {

            alert(
                "Budget already exists."
            );

            return;
        }

        budgets.push({

            id: Date.now(),
			
			month,

            category,

            amount,

            createdAt:
                new Date()
                .toISOString()

        });

        localStorage.setItem(
            "em_budgets",
            JSON.stringify(
                budgets
            )
        );

        document.getElementById(
            "budgetAmount"
        ).value = "";

        budgets =
    Storage.getBudgets();

	loadYearFilter();

	renderTable();

	updateSummary();

        App.showToast(
            "Budget Saved Successfully"
        );
    }


function editBudget(id) {

    const budget =
        budgets.find(
            b => b.id === id
        );

    if (!budget)
        return;

    const newAmount =
        prompt(
            "Enter New Budget Amount",
            budget.amount
        );

    if (
        !newAmount ||
        Number(newAmount) <= 0
    ) {
        return;
    }

    budget.amount =
        Number(newAmount);

    localStorage.setItem(
        "em_budgets",
        JSON.stringify(
            budgets
        )
    );

    renderTable();

    updateSummary();

    App.showToast(
        "Budget Updated"
    );

}


    // =========================
    // DELETE BUDGET
    // =========================

    function deleteBudget(id) {

        if (
            !confirm(
                "Delete this budget?"
            )
        ) return;

        budgets =
            budgets.filter(
                b => b.id !== id
            );

        localStorage.setItem(
            "em_budgets",
            JSON.stringify(
                budgets
            )
        );

        budgets =
    Storage.getBudgets();

	loadYearFilter();

	renderTable();

	updateSummary();

        App.showToast(
            "Budget Deleted"
        );
    }

    // =========================
    // SPENT AMOUNT
    // =========================

function getSpentAmount(
    category,
    budgetMonth
) {

    return Storage
        .getTransactions()

        .filter(t => {

            const transactionMonth =
                t.date.slice(0, 7);

            return (

                t.type ===
                "expense"

                &&

                t.category ===
                category

                &&

                transactionMonth ===
                budgetMonth

            );

        })

        .reduce(

            (sum, t) =>

                sum + t.amount,

            0

        );

}

    // =========================
    // SUMMARY KPI
    // =========================

    function updateSummary() {
		
		const selectedMonth =

			document.getElementById(
				"budgetFilterMonth"
			)?.value ||

			"";

		const selectedYear =

			document.getElementById(
				"budgetFilterYear"
			)?.value ||

			"";

		let totalBudget = 0;
		let totalSpent = 0;

		budgets

		.filter(b => {

			const year =

				b.month.slice(
					0,
					4
				);

			const monthMatch =

				!selectedMonth ||

				b.month ===
				selectedMonth;

			const yearMatch =

				!selectedYear ||

				year ===
				selectedYear;

			return (

				monthMatch &&
				yearMatch

			);

		})

		.forEach(b => {

			totalBudget +=
				b.amount;

			totalSpent +=
				getSpentAmount(
					b.category,
					b.month
				);

		});

        const remaining =
            totalBudget -
            totalSpent;

        const usage =
            totalBudget > 0
                ? (
                    (
                        totalSpent /
                        totalBudget
                    ) * 100
                ).toFixed(1)
                : 0;

        document.getElementById(
            "totalBudget"
        ).textContent =
            App.formatCurrency(
                totalBudget
            );

        document.getElementById(
            "totalSpent"
        ).textContent =
            App.formatCurrency(
                totalSpent
            );

        document.getElementById(
            "remainingBudget"
        ).textContent =
            App.formatCurrency(
                remaining
            );

        document.getElementById(
            "budgetUsage"
        ).textContent =
            usage + "%";
 
const overBudgets =

    budgets.filter(b => {

        const spent =
            getSpentAmount(
                b.category,
                b.month
            );

        return (
            spent > b.amount
        );

    });

console.log(
    "Over Budget Categories:",
    overBudgets.length
);


 }
	
	

    // =========================
    // TABLE
    // =========================

    function renderTable() {

        const tbody =
            document.getElementById(
                "budgetTableBody"
            );

        if (!tbody) return;

        if (
            budgets.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7"
                        class="text-center">
                        No Budget Found
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = "";
		
		const selectedMonth =

			document.getElementById(
				"budgetFilterMonth"
			)?.value ||

			"";

		const selectedYear =

			document.getElementById(
				"budgetFilterYear"
			)?.value ||

			"";

        budgets

		.filter(budget => {

			const year =

				budget.month.slice(
					0,
					4
				);

			const monthMatch =

				!selectedMonth ||

				budget.month ===
				selectedMonth;

			const yearMatch =

				!selectedYear ||

				year ===
				selectedYear;

			return (

				monthMatch &&
				yearMatch

			);

		})

		.forEach(budget => {

            const spent =
                getSpentAmount(
				budget.category,
				budget.month
				);

            const remaining =
                budget.amount -
                spent;

            const progress =
                Math.min(
                    (
                        spent /
                        budget.amount
                    ) * 100,
                    100
                );

			let status =
				"Within Budget";

			if (
				spent >
				budget.amount
			) {

				status =
					"🔴 Over Budget";

			}
			else if (

				progress >= 80

			) {

				status =
					"🟡 Near Limit";

			}

            tbody.innerHTML += `

                <tr>
				
					<td>
						${formatStatementMonth(budget.month)}
					</td>

                    <td>
                        ${budget.category}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            budget.amount
                        )}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            spent
                        )}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            remaining
                        )}
                    </td>

                    <td>

                        <div
                            style="
                            width:100%;
                            background:#eee;
                            border-radius:6px;
                            overflow:hidden;
                            ">

                            <div
                                style="
                                width:${progress}%;
                                height:12px;
                                background:#4caf50;
                                ">
                            </div>

                        </div>

                        ${progress.toFixed(0)}%

                    </td>

					<td>

						<span class="badge ${

							spent > budget.amount

							? "badge-danger"

							: progress >= 80

							? "badge-warning"

							: "badge-success"

						}">

							${status}

						</span>

					</td>

                    <td>
						<button
						class="btn btn-primary"
						onclick="
						Budget.editBudget(
							${budget.id}
						)
						">

						Edit

						</button>

                        <button
                            class="btn btn-danger"
                            onclick="
                            Budget.deleteBudget(
                                ${budget.id}
                            )
                            ">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        });
    }

    // =========================
    // EVENTS
    // =========================

function bindEvents() {

    document
    .getElementById(
        "saveBudgetBtn"
    )
    ?.addEventListener(
        "click",
        saveBudget
    );

    document
    .getElementById(
        "budgetFilterMonth"
    )
    ?.addEventListener(
        "change",
        loadBudgets
    );

    document
    .getElementById(
        "budgetFilterYear"
    )
    ?.addEventListener(
        "change",
        loadBudgets
    );

}

    // =========================
    // PUBLIC API
    // =========================

return {

    init,

    deleteBudget,

    editBudget

};

})();


// =============================
// AUTO LOAD
// =============================

document.addEventListener(
    "DOMContentLoaded",
    Budget.init
);