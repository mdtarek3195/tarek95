/* ==========================================
   Expense Manager Pro
   File: js/budget.js
   ========================================== */

const Budget = (() => {

    let budgets = [];
	let budgetVsActualChart = null;
	let budgetVsActualCategoryState = {};

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
		
		renderBudgetVsActualChart();

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

    const dropdown =
        document.getElementById(
            "budgetFilterYear"
        );

    if (!dropdown) return;


    const currentDate =
        new Date();


    const currentYear =
        currentDate.getFullYear();


    const currentMonth =
        currentDate.getMonth();


    // =========================
    // BUDGET YEARS
    // =========================

    const budgetYears = [

        ...new Set(

            budgets
                .map(budget =>
                    budget.month
                        ?.slice(0, 4)
                )
                .filter(Boolean)

        )

    ]
    .sort(
        (a, b) =>
            Number(b) -
            Number(a)
    );


    // =========================
    // YEAR OPTIONS
    // =========================

    dropdown.innerHTML = `

        <option value="">
            All Years
        </option>

        <option value="previousMonth">
            Previous Month
        </option>

        <option value="last3Months">
            Last 3 Months
        </option>

        <option value="last6Months">
            Last 6 Months
        </option>

    `;


    // =========================
    // BUDGET YEARS
    // =========================

    budgetYears.forEach(
        year => {

            dropdown.innerHTML += `

                <option value="${year}">
                    ${year}
                </option>

            `;

        }
    );

}


function getFilteredBudgets() {

    const selectedMonth =
        document.getElementById(
            "budgetFilterMonth"
        )?.value || "";

    const selectedYear =
        document.getElementById(
            "budgetFilterYear"
        )?.value || "";


    // =========================
    // MONTH FILTER ACTIVE
    // =========================

    if (
        activeBudgetFilter ===
        "month"
    ) {

        if (!selectedMonth) {

            return budgets;

        }

        return budgets.filter(
            budget =>
                budget.month ===
                selectedMonth
        );

    }


    // =========================
    // YEAR FILTER ACTIVE
    // =========================

    if (
        activeBudgetFilter ===
        "year"
    ) {

        // All Years

        if (!selectedYear) {

            return budgets;

        }


        // Previous Month

        if (
            selectedYear ===
            "previousMonth"
        ) {

            const date =
                new Date();

            date.setMonth(
                date.getMonth() - 1
            );

            const year =
                date.getFullYear();

            const month =
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");

            const targetMonth =
                `${year}-${month}`;

            return budgets.filter(
                budget =>
                    budget.month ===
                    targetMonth
            );

        }


        // Last 3 Months

        if (
            selectedYear ===
            "last3Months"
        ) {

            return getBudgetsForLastMonths(
                3
            );

        }


        // Last 6 Months

        if (
            selectedYear ===
            "last6Months"
        ) {

            return getBudgetsForLastMonths(
                6
            );

        }


        // Specific Year

        if (
            /^\d{4}$/.test(
                selectedYear
            )
        ) {

            return budgets.filter(
                budget =>
                    budget.month
                        .slice(0, 4) ===
                    selectedYear
            );

        }

    }


    return budgets;

}
    // =========================
    // LOAD BUDGETS
    // =========================

function loadBudgets() {

    budgets =
        Storage.getBudgets();

    renderTable();

    updateSummary();
	
	renderBudgetVsActualChart();


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


function getBudgetsForLastMonths(monthCount) {

    const today =
        new Date();

    const months = [];

    for (
        let i = monthCount - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                today.getFullYear(),
                today.getMonth() - i,
                1
            );

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        months.push(
            `${year}-${month}`
        );

    }

    return budgets.filter(
        budget =>
            months.includes(
                budget.month
            )
    );

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



function renderBudgetVsActualChart() {

    const canvas =
        document.getElementById(
            "budgetVsActualChart"
        );

    if (!canvas) return;


    // =========================
    // FILTERED BUDGETS
    // =========================

    const filteredBudgets =
        getFilteredBudgets();


    // =========================
    // CATEGORY DATA
    // =========================

    const categoryData = {};


    filteredBudgets.forEach(
        budget => {

            const category =
                budget.category;

            const spent =
                getSpentAmount(
                    category,
                    budget.month
                );


            if (
                !categoryData[
                    category
                ]
            ) {

                categoryData[
                    category
                ] = {

                    budget: 0,

                    actual: 0

                };

            }


            categoryData[
                category
            ].budget +=
                Number(
                    budget.amount || 0
                );


            categoryData[
                category
            ].actual +=
                Number(
                    spent || 0
                );

        }
    );


    // =========================
    // ALL CATEGORIES
    // =========================

    const categories =
        Object.keys(
            categoryData
        );


    // =========================
    // CATEGORY STATE
    // =========================

    if (
        typeof
        budgetVsActualCategoryState !==
        "object"
    ) {

        budgetVsActualCategoryState =
            {};

    }


    categories.forEach(
        category => {

            if (
                typeof
                budgetVsActualCategoryState[
                    category
                ] !== "boolean"
            ) {

                budgetVsActualCategoryState[
                    category
                ] = true;

            }

        }
    );


    // =========================
    // REMOVE OLD CATEGORIES
    // =========================

    Object.keys(
        budgetVsActualCategoryState
    ).forEach(
        category => {

            if (
                !categories.includes(
                    category
                )
            ) {

                delete
                    budgetVsActualCategoryState[
                        category
                    ];

            }

        }
    );


    // =========================
    // CATEGORY BUTTONS
    // =========================

    renderBudgetVsActualCategoryButtons(
        categories
    );


    // =========================
    // VISIBLE CATEGORIES
    // =========================

    const visibleCategories =
        categories.filter(
            category =>
                budgetVsActualCategoryState[
                    category
                ] !== false
        );


    // =========================
    // DESTROY OLD CHART
    // =========================

    if (
        budgetVsActualChart
    ) {

        budgetVsActualChart.destroy();

        budgetVsActualChart =
            null;

    }


    // =========================
    // NO DATA
    // =========================

    if (
        visibleCategories.length === 0
    ) {

        return;

    }


    // =========================
    // CHART VALUES
    // =========================

    const budgetValues =
        visibleCategories.map(
            category =>
                categoryData[
                    category
                ].budget
        );


    const actualValues =
        visibleCategories.map(
            category =>
                categoryData[
                    category
                ].actual
        );


    // =========================
    // CREATE CHART
    // =========================

    budgetVsActualChart =
        new Chart(
            canvas,
            {

                type: "bar",


                data: {

                    labels:
                        visibleCategories,


                    datasets: [

                        {

                            label:
                                "Budget",

                            data:
                                budgetValues

                        },


                        {

                            label:
                                "Actual",

                            data:
                                actualValues

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {

                            display: true,

                            position:
                                "top"

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        return (

                                            context.dataset.label +

                                            ": " +

                                            App.formatCurrency(
                                                context.raw || 0
                                            )

                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Category"

                            }

                        },


                        y: {

                            beginAtZero:
                                true,


                            title: {

                                display:
                                    true,

                                text:
                                    "Amount"

                            },


                            ticks: {

                                callback:
                                    function(
                                        value
                                    ) {

                                        return App
                                            .formatCurrency(
                                                value
                                            );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


function renderBudgetVsActualCategoryButtons(
    categories
) {

    const container =
        document.getElementById(
            "budgetVsActualCategoryFilters"
        );

    if (!container) return;


    container.innerHTML = "";


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "btn btn-secondary";


            const visible =
                budgetVsActualCategoryState[
                    category
                ];


            button.textContent =
                category;


            button.style.opacity =
                visible
                    ? "1"
                    : "0.45";


            button.style.textDecoration =
                visible
                    ? "none"
                    : "line-through";


            button.addEventListener(
                "click",
                function() {

                    budgetVsActualCategoryState[
                        category
                    ] =
                        !budgetVsActualCategoryState[
                            category
                        ];


                    renderBudgetVsActualChart();

                }
            );


            container.appendChild(
                button
            );

        }
    );

}



    // =========================
    // SUMMARY KPI
    // =========================

  function updateSummary() {

    const filteredBudgets =
        getFilteredBudgets();


    let totalBudget = 0;

    let totalSpent = 0;


    // =========================
    // CALCULATE SUMMARY
    // =========================

    filteredBudgets.forEach(
        budget => {

            totalBudget +=
                Number(
                    budget.amount
                );


            totalSpent +=
                Number(
                    getSpentAmount(
                        budget.category,
                        budget.month
                    )
                );

        }
    );


    // =========================
    // REMAINING
    // =========================

    const remaining =
        totalBudget -
        totalSpent;


    // =========================
    // USAGE
    // =========================

    const usage =
        totalBudget > 0

            ?

            (
                (
                    totalSpent /
                    totalBudget
                ) * 100
            ).toFixed(1)

            :

            "0";


    // =========================
    // UPDATE KPI
    // =========================

    const totalBudgetElement =
        document.getElementById(
            "totalBudget"
        );

    const totalSpentElement =
        document.getElementById(
            "totalSpent"
        );

    const remainingBudgetElement =
        document.getElementById(
            "remainingBudget"
        );

    const budgetUsageElement =
        document.getElementById(
            "budgetUsage"
        );


    if (totalBudgetElement) {

        totalBudgetElement.textContent =
            App.formatCurrency(
                totalBudget
            );

    }


    if (totalSpentElement) {

        totalSpentElement.textContent =
            App.formatCurrency(
                totalSpent
            );

    }


    if (remainingBudgetElement) {

        remainingBudgetElement.textContent =
            App.formatCurrency(
                remaining
            );

    }


    if (budgetUsageElement) {

        budgetUsageElement.textContent =
            usage + "%";

    }

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


    const filteredBudgets =
        getFilteredBudgets();


    // =========================
    // NO BUDGET
    // =========================

    if (
        filteredBudgets.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="text-center"
                >

                    No Budget Found

                </td>

            </tr>

        `;

        return;

    }


    // =========================
    // CLEAR TABLE
    // =========================

    tbody.innerHTML = "";


    // =========================
    // RENDER BUDGETS
    // =========================

    filteredBudgets.forEach(
        budget => {

            const spent =
                getSpentAmount(
                    budget.category,
                    budget.month
                );


            const remaining =
                Number(
                    budget.amount
                ) -
                Number(
                    spent
                );


            const progress =
                Number(
                    budget.amount
                ) > 0

                    ?

                    (
                        (
                            Number(spent) /
                            Number(budget.amount)
                        ) * 100
                    )

                    :

                    0;


            const displayProgress =
                Math.min(
                    progress,
                    100
                );


            // =========================
            // STATUS
            // =========================

            let status =
                "Within Budget";


            let statusClass =
                "badge-success";


            if (
                spent >
                budget.amount
            ) {

                status =
                    "🔴 Over Budget";

                statusClass =
                    "badge-danger";

            }
            else if (
                progress >= 80
            ) {

                status =
                    "🟡 Near Limit";

                statusClass =
                    "badge-warning";

            }


            // =========================
            // TABLE ROW
            // =========================

            tbody.innerHTML += `

                <tr>

                    <td>

                        ${formatStatementMonth(
                            budget.month
                        )}

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
                            "
                        >

                            <div
                                style="
                                    width:${displayProgress}%;
                                    height:12px;
                                    background:#4caf50;
                                "
                            >
                            </div>

                        </div>


                        ${progress.toFixed(0)}%

                    </td>


                    <td>

                        <span
                            class="badge ${statusClass}"
                        >

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
                            "
                        >

                            Edit

                        </button>


                        <button
                            class="btn btn-danger"
                            onclick="
                                Budget.deleteBudget(
                                    ${budget.id}
                                )
                            "
                        >

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        }
    );

}
    // =========================
    // EVENTS
    // =========================


let activeBudgetFilter = "month";


function bindEvents() {

    document
        .getElementById("saveBudgetBtn")
        ?.addEventListener(
            "click",
            saveBudget
        );


    document
        .getElementById("budgetFilterMonth")
        ?.addEventListener(
            "change",
            function () {

                activeBudgetFilter =
                    "month";

                loadBudgets();

            }
        );


    document
        .getElementById("budgetFilterYear")
        ?.addEventListener(
            "change",
            function () {

                activeBudgetFilter =
                    "year";

                loadBudgets();

            }
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