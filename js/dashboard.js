/* ==========================================
   Expense Manager Pro
   File: js/dashboard.js
   ========================================== */

	const Dashboard = (() => {
		
		 // Chart instances
		 
		let incomeExpenseChart = null;
		let expenseCategoryChart = null;
		let expenseChartSelected = "";
		let topExpenseSelected = "month";
		let expenseCustomFrom = null;
		let expenseCustomTo = null;
		let topExpenseCustomFrom = null;
		let topExpenseCustomTo = null;
		let dailyTrendChart = null;
		let dailyTrendType = "expense";
		let dailyTrendSelected = "7days";
		let dailyTrendCustomFrom = null;
		let dailyTrendCustomTo = null;
		
		let currentTrendTransactions = [];
		let currentTrendDate = "";
		let currentTrendType = "";

		// =========================
		// INIT
		// =========================

function init() {

    loadKPIs();

    loadOutstandingLoan();

    loadRecentTransactions();

    renderIncomeExpenseChart();

    renderGoalWidget();

    loadFinancialHealth();

    renderExpenseCategoryChart();

    initializeExpenseFilter();

    initializeTopExpenseFilter();

    loadTopExpenses();

    initializeExpenseCustomRange();

    initializeTopExpenseCustomRange();

    loadSpendingInsights();

    loadSmartInsights();

    initializeDailyTrendFilter();
	
	initializeDailyTrendTypeFilter();

    renderDailyTrendChart();
	
		

    document
    .getElementById(
        "dailyTrendType"
    )
    ?.addEventListener(
        "change",
        function(){

            dailyTrendType =
                this.value;

            renderDailyTrendChart();

        }
    );

}

    // =========================
    // KPI CARDS
    // =========================

function loadKPIs() {

    const accounts =
        Storage.getAccounts();
		

    /* =========================
       CURRENT BALANCE
    ========================= */

    const currentBalance =

        accounts

        .filter(
            acc =>
                acc.type !==
                "creditcard"
        )

        .reduce(

            (sum, acc) =>

                sum +
                Number(
                    acc.balance || 0
                ),

            0

        );
		
		
	/* =========================
       Goals Savings
    ========================= */	
	const goals =
		Storage.getGoals();		
       const goalSavings =
            goals.reduce(
                (sum, goal) =>
                    sum +
                    Number(
                        goal.saved || 0
                    ),
                0
            );

    /* =========================
       CREDIT CARD DUE
    ========================= */

    const statementDue =

        Storage

        .getCardStatements()

        .filter(

            s =>

                s.status !==
                "Paid"

        )

        .reduce(

            (sum, s) =>

                sum +

                Number(
                    s.remaining || 0
                ),

            0

        );

    const pendingCardExpense =

        Storage

        .getTransactions()

        .filter(

            t =>

                t.type ===
                "expense" &&

                !t.statementGenerated &&

                accounts.some(

                    a =>

                        a.name ===
                        t.account &&

                        a.type ===
                        "creditcard"

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

    const creditCardDue =

        statementDue +
        pendingCardExpense;

    /* =========================
       EMI OUTSTANDING
    ========================= */

    const emis =
        Storage.getEmiPurchases();

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

    /* =========================
       CREDIT AVAILABLE
    ========================= */

    const creditCards =

        accounts.filter(

            a =>
                a.type ===
                "creditcard"

        );

    const totalLimit =

        creditCards.reduce(

            (sum, card) =>

                sum +

                Number(
                    card.limit || 0
                ),

            0

        );

    const creditAvailable =

        totalLimit -

        (
            creditCardDue +
            emiOutstanding
        );

    /* =========================
       LOAN
    ========================= */

    const loans =

        Storage.getLoans
        ? Storage.getLoans()
        : [];

const outstandingLoan =

    loans.reduce(

        (sum, loan) =>

            sum +

            Number(
                loan.remainingAmount || 0
            ),

        0

    );

    /* =========================
       NET WORTH
    ========================= */

	const netWorth =

		currentBalance

		+

		goalSavings

		-

		creditCardDue

		-

		emiOutstanding

		-

		outstandingLoan;
			
		


    /* =========================
       MONTHLY DATA
    ========================= */

    const monthlyIncome =
        Storage.getMonthlyIncome();

    const monthlyExpense =
        Storage.getMonthlyExpense();

    const monthlySavings =
        Storage.getMonthlySavings();

    /* =========================
       KPI UPDATE
    ========================= */

    document.getElementById(
        "todayExpense"
    ).textContent =

        App.formatCurrency(
            Storage.getTodayExpense()
        );

    document.getElementById(
        "currentBalance"
    ).textContent =

        App.formatCurrency(
            currentBalance
        );

    document.getElementById(
        "creditCardDue"
    ).textContent =

        App.formatCurrency(
            creditCardDue
        );

    document.getElementById(
        "creditAvailable"
    ).textContent =

        App.formatCurrency(
            creditAvailable
        );

    document.getElementById(
        "monthlyIncome"
    ).textContent =

        App.formatCurrency(
            monthlyIncome
        );

    document.getElementById(
        "monthlyExpense"
    ).textContent =

        App.formatCurrency(
            monthlyExpense
        );

    document.getElementById(
        "monthlySavings"
    ).textContent =

        App.formatCurrency(
            monthlySavings
        );

    document.getElementById(
        "netWorth"
    ).textContent =

        App.formatCurrency(
            netWorth
        );

    /* =========================
       SAVINGS RATE
    ========================= */

    const savingsRate =

        monthlyIncome > 0

            ? (
                monthlySavings /
                monthlyIncome
            ) * 100

            : 0;

    const savingsRateEl =

        document.getElementById(
            "savingsRate"
        );

    if (savingsRateEl) {

        savingsRateEl.textContent =

            savingsRate.toFixed(1) +
            "%";

    }

    /* =========================
       OTHER WIDGETS
    ========================= */

    loadBudgetStatus();
    loadBudgetAlerts();
    loadTopExpenses();
    loadForecastAnalytics();
    loadGoalForecast();
    loadCashFlow();
    renderSpendingTrend();
	applyDashboardWidgets();

}

function applyDashboardWidgets() {

    const settings =
        JSON.parse(
            localStorage.getItem(
                "dashboardWidgets"
            )
        ) || {};


    const widgets = {

        todayExpense:
            "todayExpenseCard",

        currentBalance:
            "currentBalanceCard",

        creditCardDue:
            "creditCardDueCard",

        creditAvailable:
            "creditAvailableCard",

        monthlyIncome:
            "monthlyIncomeCard",

        monthlyExpense:
            "monthlyExpenseCard",

        netWorth:
            "netWorthCard",

        outstandingLoan:
            "outstandingLoanCard",

        monthlySavings:
            "monthlySavingsCard",

        savingsRate:
            "savingsRateCard",

        goalProgress:
            "goalProgressCard",

        goalForecast:
            "goalForecastCard",

        forecastSavings:
            "forecastSavingsCard",

        healthScore:
            "healthScoreCard",

        cashFlow:
            "cashFlowCard",

        spendingInsights:
            "spendingInsightsCard",

        smartInsights:
            "smartInsightsCard",

        budgetAlerts:
            "budgetAlertsCard"

    };


    Object.keys(widgets).forEach(
        key => {

            const card =
                document.getElementById(
                    widgets[key]
                );


            if (!card) return;


            card.style.display =
                settings[key] === false
                    ? "none"
                    : "";

        }
    );

}




//Date format

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





	 
function loadBudgetStatus() {

    const tbody =

        document.getElementById(
            "dashboardBudgetBody"
        );

    if (!tbody)
        return;

    const budgets =
        Storage.getBudgets();

    const transactions =
        Storage.getTransactions();

    const currentMonth =

        new Date()
        .toISOString()
        .slice(0,7);

    tbody.innerHTML = "";

    budgets

    .filter(

        b =>

        b.month ===
        currentMonth

    )

    .forEach(budget => {

        const spent =

            transactions

            .filter(t => {

                return (

                    t.type ===
                    "expense"

                    &&

                    t.category ===
                    budget.category

                    &&

                    t.date.slice(0,7) ===
                    currentMonth

                );

            })

            .reduce(

                (sum, t) =>

                    sum + t.amount,

                0

            );

        const usage =

            budget.amount > 0

            ?

            (

                spent /
                budget.amount

            ) * 100

            :

            0;

        let status =

            "🟢";

        if (

            usage >= 100

        ) {

            status =
                "🔴";

        }

        else if (

            usage >= 80

        ) {

            status =
                "🟡";

        }

        tbody.innerHTML += `

            <tr>

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
				<td
					style="
						display:flex;
						justify-content:flex-end;
						align-items:center;
						gap:8px;
					">

					<span>
						${usage.toFixed(0)}%
					</span>

					<span>
						${status}
					</span>

				</td>

            </tr>

        `;

    });

}


function loadSpendingInsights(){

    const container =
        document.getElementById(
            "spendingInsights"
        );

    if(!container) return;

    const currentMonth =
        new Date()
        .toISOString()
        .slice(0,7);

    const transactions =

        Storage.getTransactions()

        .filter(t =>

            t.type === "expense"

            &&

            t.date.startsWith(
                currentMonth
            )

        );

    if(transactions.length === 0){

        container.innerHTML =
            "<p>No data available</p>";

        return;

    }

    // =========================
    // Category Totals
    // =========================

    const categoryTotals = {};

    transactions.forEach(t => {

        categoryTotals[t.category] =

            (categoryTotals[t.category] || 0)

            + Number(t.amount);

    });

    const highest =

        Object.entries(categoryTotals)

        .sort(
            (a,b)=>b[1]-a[1]
        )[0];

    const totalExpense =

        transactions.reduce(
            (sum,t)=>
            sum + Number(t.amount),
            0
        );

    const percentage =

        (
            highest[1] /
            totalExpense
        ) * 100;

    // =========================
    // Budget Status
    // =========================

const totalBudget =

    Storage.getBudgets()

    .filter(
        b => b.month === currentMonth
    )

    .reduce(
        (sum,b)=>
        sum + Number(b.amount),
        0
    );

let budgetMessage =

    "No Budget Found";

if(totalBudget > 0){

    const remaining =

        totalBudget -
        totalExpense;

    if(remaining >= 0){

        budgetMessage =

            `${App.formatCurrency(
                remaining
            )} Remaining`;

    }else{

        budgetMessage =

            `Exceeded by ${App.formatCurrency(
                Math.abs(remaining)
            )}`;

    }

}

    // =========================
    // Largest Expense
    // =========================

    const largestExpense =

        transactions
        .sort(
            (a,b)=>
            b.amount - a.amount
        )[0];



    // =========================
    // Daily Average
    // =========================

    const currentDay =
        new Date().getDate();

    const dailyAverage =

        totalExpense /
        currentDay;

    // =========================
    // Render
    // =========================

    container.innerHTML = `

        <div class="insight-item">
            🔥 Highest spending category: ${highest[0]},
                ${App.formatCurrency(highest[1])}
        </div>

        <div class="insight-item">
            📊 ${highest[0]} consumes ${percentage.toFixed(1)}% of total spending.
        </div>

        <div class="insight-item">
            ⚠ Budget status: ${budgetMessage}
        </div>

        <div class="insight-item">
            🛒 Largest single expense: ${App.formatCurrency(
                    largestExpense.amount
                )}
        </div>

        <div class="insight-item">
            📈 Daily avg. Spending: ${App.formatCurrency(
                    dailyAverage
                )}
        </div>



    `;

}

function loadSmartInsights(){

    const container =
        document.getElementById(
            "smartInsights"
        );

    if(!container) return;

    const currentMonth =
        new Date()
        .toISOString()
        .slice(0,7);

    const previousDate =
        new Date();

    previousDate.setMonth(
        previousDate.getMonth()-1
    );

    const previousMonth =
        previousDate
        .toISOString()
        .slice(0,7);

    const currentTx =

        Storage.getTransactions()

        .filter(t =>

            t.date.startsWith(
                currentMonth
            )

        );

    const previousTx =

        Storage.getTransactions()

        .filter(t =>

            t.date.startsWith(
                previousMonth
            )

        );

    const currentIncome =

        currentTx

        .filter(
            t => t.type === "income"
        )

        .reduce(
            (sum,t)=>
            sum + Number(t.amount),
            0
        );

    const previousIncome =

        previousTx

        .filter(
            t => t.type === "income"
        )

        .reduce(
            (sum,t)=>
            sum + Number(t.amount),
            0
        );

    const currentExpense =

        currentTx

        .filter(
            t => t.type === "expense"
        )

        .reduce(
            (sum,t)=>
            sum + Number(t.amount),
            0
        );

    const previousExpense =

        previousTx

        .filter(
            t => t.type === "expense"
        )

        .reduce(
            (sum,t)=>
            sum + Number(t.amount),
            0
        );

    const currentSavings =
        currentIncome -
        currentExpense;

    const previousSavings =
        previousIncome -
        previousExpense;

    let html = "";

    // Income

    if(currentIncome > previousIncome){

        html += `

        <p>
            📈 Income increased by: ${App.formatCurrency(
                    currentIncome -
                    previousIncome
                )}
        </p>

        `;

    }else if(currentIncome < previousIncome){

        html += `

        <p>
            📉 Income decreased by: ${App.formatCurrency(
                    previousIncome -
                    currentIncome
                )}
        </p>

        `;

    }

    // Expense

    if(currentExpense > previousExpense){

        html += `

        <p>
            ⚠ Expense increased by: ${App.formatCurrency(
                    currentExpense -
                    previousExpense
                )}
            
        </p>

        `;

    }else if(currentExpense < previousExpense){

        html += `

        <p>
            ✅ Expense reduced by: ${App.formatCurrency(
                    previousExpense -
                    currentExpense
                )}
        </p>

        `;

    }

    // Savings

    if(currentSavings > previousSavings){

        html += `

        <p>
            💰 Savings improved by: ${App.formatCurrency(
                    currentSavings -
                    previousSavings
                )}
            
        </p>

        `;

    }else if(currentSavings < previousSavings){

        html += `

        <p>
            📉 Savings decreased by: ${App.formatCurrency(
                    previousSavings -
                    currentSavings
                )}
            
        </p>

        `;

    }

    // Budget Utilization

    const budgets =

        Storage.getBudgets()

        .filter(
            b =>
            b.month === currentMonth
        );

    const totalBudget =

        budgets.reduce(
            (sum,b)=>
            sum + Number(b.amount),
            0
        );

    if(totalBudget > 0){

        const utilization =

            (
                currentExpense /
                totalBudget
            ) * 100;

        html += `

        <p>
            🎯 Budget utilization: ${utilization.toFixed(0)}%
            
        </p>

        `;

    }

    // Net Savings

    html += `

    <p>
        🏦 Net savings this month: ${App.formatCurrency(
                currentSavings
            )}
       
    </p>

    `;

    container.innerHTML =

        html ||

        "<p>No insights available</p>";

}



function loadBudgetAlerts() {

    const container =

        document.getElementById(
            "budgetAlerts"
        );

    if (!container)
        return;

    const budgets =
        Storage.getBudgets();

    const transactions =
        Storage.getTransactions();

    const currentMonth =

        new Date()
        .toISOString()
        .slice(0,7);

    let html = "";

    budgets

    .filter(
        b =>
        b.month === currentMonth
    )

    .forEach(budget => {

        const spent =

            transactions

            .filter(t =>

                t.type === "expense"

                &&

                t.category === budget.category

                &&

                t.date.slice(0,7) === currentMonth

            )

            .reduce(
                (sum,t)=>
                sum+t.amount,
                0
            );

        const usage =

            (spent / budget.amount) * 100;

        if (usage >= 100) {

            html += `

                <p>

                    🔴
                    ${budget.category}

                    Over Budget

                </p>

            `;

        }

        else if (

            usage >= 80

        ) {

            html += `

                <p>

                    🟡
                    ${budget.category}

                    Near Limit

                </p>

            `;

        }

    });

    if (!html) {

        html =

        `<p>
            No Budget Alerts
        </p>`;

    }

    container.innerHTML = html;

}

function loadTopExpenses() {
	
	const label =
    document.getElementById(
        "topExpenseFilterLabel"
    );

    const container =
        document.getElementById(
            "topExpenseList"
        );

    if (!container)
        return;

    const transactions =
        Storage.getTransactions();

    const expenses = {};

    const today =
        new Date();

    transactions.forEach(t => {

        if(t.type !== "expense")
            return;

        const d =
            new Date(t.date);

        const monthKey =
            `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

        let include = false;

        switch(topExpenseSelected){

            case "month":
			
			label.textContent =
                today.toLocaleString(
                    "en-US",
                    {
                        month:"short",
                        year:"numeric"
                    }
                );

                include =
                    monthKey ===
                    `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

                break;
				
				
			case "previousMonth":

				const previous =
					new Date();

				previous.setMonth(
					previous.getMonth()-1
				);


				include =
					monthKey ===
					`${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,"0")}`;

			break;

            case "3months":

                const last3 =
                    new Date();

                last3.setMonth(
                    last3.getMonth()-3
                );

                include =
                    d >= last3;

                break;

            case "6months":

                const last6 =
                    new Date();

                last6.setMonth(
                    last6.getMonth()-6
                );

                include =
                    d >= last6;

                break;

            case "year":

                include =
                    d.getFullYear() ===
                    today.getFullYear();

                break;

            case "all":

                include = true;

                break;

			case "custom":

				if(
					topExpenseCustomFrom &&
					topExpenseCustomTo
				){

					include =

						t.date >= topExpenseCustomFrom

						&&

						t.date <= topExpenseCustomTo;

				}

				break;

            default:

                include = true;

        }

        if(!include)
            return;

        expenses[t.category] =

            (expenses[t.category] || 0)

            + Number(t.amount);

    });

    const top7 =

        Object.entries(expenses)

        .sort(
            (a,b)=>
            b[1]-a[1]
        )

     //   .slice(0,20);

    if(top7.length === 0){

        container.innerHTML =

            "<p>No Expense Found</p>";

        return;

    }

    let html = "";

    top7.forEach(item => {

        const maxAmount =
            top7[0][1];

        const percentage =

            (
                item[1] /
                maxAmount
            ) * 100;

        html += `

        <div
            style="
            margin-bottom:15px;
			
            ">

            <div
                style="
                display:flex;
                justify-content:space-between;
                margin-bottom:5px;
                ">

			<strong>

				${item[0]}

			</strong>

			<span

				style="
					cursor:pointer;
					color:#0d6efd;
					font-weight:bold;
				"

				onclick="showExpenseCategoryDetails(
					'${item[0]}'
				)"

			>

				${App.formatCurrency(
					item[1]
				)}

			</span>

            </div>

            <div
                style="
                background:#eee;
                height:10px;
                border-radius:10px;
                overflow:hidden;
                ">

                <div
                    style="
                    width:${percentage}%;
                    height:100%;
                    background:#4caf50;
                    ">
                </div>

            </div>

        </div>

        `;

    });

    container.innerHTML = html;

}


function showExpenseCategoryDetails(

    category

){

    document.getElementById(

        "expenseModalTitle"

    ).textContent =

        category +
        " Transactions";

    const tbody =

        document.getElementById(

            "expenseModalBody"

        );

    const transactions =

        getFilteredCategoryTransactions(
            category
        );
		
window.expenseModalTransactions =
    transactions;

    if(

        transactions.length === 0

    ){

        tbody.innerHTML =

            `<tr>

                <td colspan="3">

                    No Data Found

                </td>

            </tr>`;

    }

    else{

const totalAmount =

    transactions.reduce(

        (sum, t) =>

            sum +

            Number(
                t.amount || 0
            ),

        0

    );

tbody.innerHTML =

    transactions.map(
        t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.note || "-"}</td>
            <td>${App.formatCurrency(t.amount)}</td>
        </tr>
    `
    ).join("")

    +

    `

    <tr
        style="
            font-weight:bold;
            background:#f8f9fa;
        ">

        <td colspan="2">
            Total
        </td>

        <td>
            ${App.formatCurrency(
                totalAmount
            )}
        </td>

    </tr>

    `;

    }

    document.getElementById(

        "expenseDetailsModal"

    ).style.display =

        "flex";

}

window.showExpenseCategoryDetails =
    showExpenseCategoryDetails;





function getFilteredCategoryTransactions(

    category

){

    const transactions =

        Storage.getTransactions();

    const today =

        new Date();

    return transactions.filter(

        t => {

            if(

                t.type !== "expense" ||

                t.category !== category

            ){

                return false;

            }

            const d =

                new Date(
                    t.date
                );

            const monthKey =

                `${d.getFullYear()}-${String(
                    d.getMonth()+1
                ).padStart(2,"0")}`;

            switch(

                topExpenseSelected

            ){

                case "month":

                    return (

                        monthKey ===

                        `${today.getFullYear()}-${String(
                            today.getMonth()+1
                        ).padStart(2,"0")}`

                    );

                case "previousMonth":

                    const previous =

                        new Date();

                    previous.setMonth(

                        previous.getMonth()-1

                    );

                    return (

                        monthKey ===

                        `${previous.getFullYear()}-${String(
                            previous.getMonth()+1
                        ).padStart(2,"0")}`

                    );

                case "3months":

                    const last3 =

                        new Date();

                    last3.setMonth(

                        last3.getMonth()-3

                    );

                    return d >= last3;

                case "6months":

                    const last6 =

                        new Date();

                    last6.setMonth(

                        last6.getMonth()-6

                    );

                    return d >= last6;

                case "year":

                    return (

                        d.getFullYear() ===

                        today.getFullYear()

                    );

                case "custom":

                    return (

                        t.date >=
                        topExpenseCustomFrom &&

                        t.date <=
                        topExpenseCustomTo

                    );

                default:

                    return true;

            }

        }

    );

}



function buildTopExpenseFilterMenu(){

    const menu =
        document.getElementById(
            "topExpenseFilterMenu"
        );

    if(!menu) return;

    menu.innerHTML = `

    <div
        class="expense-filter-item"
        data-value="month"
        data-label="This Month">

        This Month

    </div>
	
	<div
		 class="expense-filter-item"
		 data-value="previousMonth"
		 data-label="Previous Month">

		 Previous Month

		</div>

    <div
        class="expense-filter-item"
        data-value="3months"
        data-label="Last 3 Months">

        Last 3 Months

    </div>

    <div
        class="expense-filter-item"
        data-value="6months"
        data-label="Last 6 Months">

        Last 6 Months

    </div>

    <div
        class="expense-filter-item"
        data-value="year"
        data-label="This Year">

        This Year

    </div>

    <div
        class="expense-filter-item"
        data-value="all"
        data-label="All Time">

        All Time

    </div>

    <div class="expense-divider"></div>

    <div
        class="expense-filter-item"
        data-value="custom"
        data-label="Custom Range">

        📅 Custom Range

    </div>

    `;

}

function initializeTopExpenseFilter(){

    const btn =
        document.getElementById(
            "topExpenseFilterBtn"
        );

    const menu =
        document.getElementById(
            "topExpenseFilterMenu"
        );

    const label =
        document.getElementById(
            "topExpenseFilterLabel"
        );

    if(!btn || !menu)
        return;

    buildTopExpenseFilterMenu();
	
	    const today = new Date();

		label.textContent =
			today.toLocaleString(
				"en-US",
				{
					month:"short",
					year:"numeric"
				}
			);

    btn.onclick = function(e){

        e.stopPropagation();

        menu.classList.toggle(
            "show"
        );

    };

    menu.onclick = function(e){

        const item =
            e.target.closest(
                ".expense-filter-item"
            );

        if(!item)
            return;

        if(
            item.dataset.value ===
            "custom"
        ){

			document
			.getElementById(
				"topExpenseDateModal"
			)
			.style.display =
				"flex";
            return;

        }

        topExpenseSelected =
            item.dataset.value;

		if(item.dataset.value === "month"){

			const today = new Date();

			label.textContent =
			today.toLocaleString("en-US",{
				month:"short",
				year:"numeric"
			});

		}
		else{

			label.textContent =
			item.dataset.label;

		}

        menu.classList.remove(
            "show"
        );

        loadTopExpenses();

    };

    document.addEventListener(
        "click",
        function(){

            menu.classList.remove(
                "show"
            );

        }
    );

}

function loadForecastAnalytics() {

    const income =
        Storage.getMonthlyIncome();

    const expense =
        Storage.getMonthlyExpense();

    const forecastSavings =

        income - expense;

    const savingsEl =

        document.getElementById(
            "forecastSavings"
        );

    if (savingsEl) {

        savingsEl.textContent =

            App.formatCurrency(
                forecastSavings
            );

    }

}
function loadGoalForecast() {

    const container =

        document.getElementById(
            "goalForecast"
        );

    if (!container)
        return;

    const goals =
        Storage.getGoals();

    let html = "";

    goals.forEach(goal => {

        const monthlySaving =

            Storage.getMonthlySavings();

        if (
            monthlySaving <= 0
        ) {

            html += `

                <p>

                    ${goal.name}

                    :
                    Forecast Unavailable

                </p>

            `;

            return;

        }

        const remaining =

            goal.target -
            goal.saved;

        const monthsNeeded =

            Math.ceil(
                remaining /
                monthlySaving
            );

        html += `

            <p>

                ${goal.name}

                :

                ${monthsNeeded}

                month(s) remaining

            </p>

        `;

    });

    container.innerHTML =

        html ||

        "No Goals";

}

function loadCashFlow() {

    const income =
        Storage.getMonthlyIncome();

    const expense =
        Storage.getMonthlyExpense();

    const cashFlow =

        income - expense;

    const el =

        document.getElementById(
            "cashFlow"
        );

    if (el) {

        el.textContent =

            App.formatCurrency(
                cashFlow
            );

    }

}



		// =========================
		// RECENT TRANSACTIONS
		// =========================

		function loadRecentTransactions() {

			const tbody =
				document.getElementById(
					"recentTransactions"
				);

			if (!tbody) return;

			const transactions =
				Storage.getRecentTransactions(10);

			if (transactions.length === 0) {

				tbody.innerHTML = `
					<tr>
						<td colspan="4" class="text-center">
							No transactions found
						</td>
					</tr>
				`;

				return;
			}

			tbody.innerHTML = "";

			transactions.forEach(item => {

				const row =
					document.createElement("tr");

				row.innerHTML = `
					<td>
						${App.formatDate(item.date)}
					</td>

					<td>
						<span class="badge ${
							item.type === "income"
							? "badge-success"
							: "badge-danger"
						}">

							${item.type}

						</span>
					</td>

					<td>
						${item.category}
					</td>

					<td>
						${App.formatCurrency(item.amount)}
					</td>
				`;

				tbody.appendChild(row);

			});

}
	function loadFinancialHealth() {

    const income =
        Storage.getMonthlyIncome();

    const expense =
        Storage.getMonthlyExpense();

    const savings =
        income - expense;

    let score = 0;

    if (income > 0) {

        const savingsRate =

            (
                savings /
                income
            ) * 100;

        if (savingsRate >= 30)
            score = 100;

        else if (
            savingsRate >= 20
        )
            score = 80;

        else if (
            savingsRate >= 10
        )
            score = 60;

        else
            score = 40;

    }

    let status =

        "🔴 Needs Attention";

    if (score >= 80)
        status = "🟢 Excellent";

    else if (
        score >= 60
    )
        status = "🟡 Good";

    document.getElementById(
        "healthScore"
    ).textContent =
        score + "/100";

    document.getElementById(
        "healthStatus"
    ).textContent =
        status;

}


function loadOutstandingLoan() {

const loans =
    Storage.getLoans();

let totalBorrow = 0;

let totalRepay = 0;

loans.forEach(loan => {

    if (
        loan.type === "borrow"
    ) {

        totalBorrow +=
            Number(
                loan.amount
            );

    }

    if (
        loan.type === "repay"
    ) {

        totalRepay +=
            Number(
                loan.amount
            );

    }

});

const outstandingLoan =
    totalBorrow -
    totalRepay;

document.getElementById(
    "outstandingLoan"
).innerHTML = `

    Outstanding:
    ${App.formatCurrency(
        outstandingLoan
    )}

    <br>

    Repaid:
    ${App.formatCurrency(
        totalRepay
    )}

    <br>

    Net Liability:
    ${App.formatCurrency(
        outstandingLoan
    )}

`;
}

		// =========================
		// REFRESH
		// =========================

		function refresh() {

			loadKPIs();

			loadRecentTransactions();

			renderIncomeExpenseChart();

			renderExpenseCategoryChart();

			renderGoalWidget();

		}


function renderIncomeExpenseChart() {

const sixMonthsAgo =
    new Date();

sixMonthsAgo.setMonth(
    sixMonthsAgo.getMonth() - 5
);

sixMonthsAgo.setDate(1);

    const transactions =
        Storage.getTransactions()
        .filter(item => {

            const d =
                new Date(item.date);

            return d >= sixMonthsAgo;

        });

    const monthlyData = {};

    transactions.forEach(item => {

        const date =
            new Date(item.date);

        const monthKey =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2,"0")}`;

        if (!monthlyData[monthKey]) {

            monthlyData[monthKey] = {
                income: 0,
                expense: 0
            };

        }

        if (item.type === "income") {

            monthlyData[monthKey].income +=
                Number(item.amount);

        } else {

            monthlyData[monthKey].expense +=
                Number(item.amount);

        }

    });

    // Proper month sorting
	const labels =
    Object.keys(monthlyData)
    .sort((a,b) => new Date(b) - new Date(a));

    // Display label
const displayLabels =
    labels.map(m => {

        const d = new Date(m + "-01");

        return d.toLocaleString(
            "en-US",
            {
                month: "short",
                year: "2-digit"
            }
        );

    });

    const income =
        labels.map(
            m => monthlyData[m].income
        );

    const expense =
        labels.map(
            m => monthlyData[m].expense
        );

    const ctx =
        document.getElementById(
            "incomeExpenseChart"
        );

    if (!ctx) return;

    if (
        incomeExpenseChart &&
        typeof incomeExpenseChart.destroy ===
        "function"
    ) {

        incomeExpenseChart.destroy();

    }

    incomeExpenseChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: displayLabels,

                datasets: [

                    {
                        label: "Income",

                        data: income,

                        backgroundColor:
                            "#10B981",

                        borderRadius: 6,

                        borderSkipped: false,

                        maxBarThickness: 35,

                        categoryPercentage: 0.7,

                        barPercentage: 0.9
                    },

                    {
                        label: "Expense",

                        data: expense,

                        backgroundColor:
                            "#EF4444",

                        borderRadius: 6,

                        borderSkipped: false,

                        maxBarThickness: 35,

                        categoryPercentage: 0.7,

                        barPercentage: 0.9
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {

                    mode: "nearest",

                    intersect: true

                },

                plugins: {

                    tooltip: {

                        backgroundColor:
                            "#111827",

                        titleColor:
                            "#ffffff",

                        bodyColor:
                            "#ffffff",

                        borderColor:
                            "#374151",

                        borderWidth: 1,

                        padding: 10,

                        cornerRadius: 8,

                        displayColors: true,

                        callbacks: {

                            label: function(context){

                                return (
                                    context.dataset.label +
                                    ": " +
                                    App.formatCurrency(
                                        context.raw
                                    )
                                );

                            }

                        }

                    },

                    legend: {

                        position: "bottom",

                        labels: {

                            usePointStyle: true,

                            pointStyle: "circle",

                            padding: 15,

                            color: "#374151",

                            font: {

                                size: 12,

                                weight: "600"

                            }

                        }

                    }

                },

                scales: {

                    x: {

                        grid: {

                            display: false

                        },

                        ticks: {

                            color: "#6B7280"

                        }

                    },

                    y: {

                        beginAtZero: true,

                        grid: {

                            color: "#E5E7EB"

                        },

                        ticks: {

                            color: "#6B7280",

                            callback: function(value){

                                return (
                                    "৳" +
                                    value.toLocaleString()
                                );

                            }

                        }

                    }

                }

            }

        });

}


function renderDailyTrendChart() {

    const transactions =
        Storage.getTransactions();

    const today =
        new Date();

    const dailyTotals = {};

    let startDate =
        new Date();

    switch(dailyTrendSelected){

        case "7days":

            startDate.setDate(
                today.getDate() - 7
            );

            break;

        case "15days":

            startDate.setDate(
                today.getDate() - 14
            );

            break;

        case "30days":

            startDate.setDate(
                today.getDate() - 29
            );

            break;

    }

    transactions.forEach(item => {

        if(
            item.type !==
            dailyTrendType
        ){
            return;
        }

        const d =
            new Date(item.date);

        let include = false;

        if(
            dailyTrendSelected ===
            "custom"
        ){

            include =

                item.date >=
                dailyTrendCustomFrom

                &&

                item.date <=
                dailyTrendCustomTo;

        }

        else{

            include =
                d >= startDate;
        }

        if(!include)
            return;

        const dateKey =
            item.date;

        dailyTotals[dateKey] =

            (dailyTotals[dateKey] || 0)

            + Number(item.amount);

    });

    const labels =
        Object.keys(dailyTotals)
        .sort();

    const values =
        labels.map(
            d => dailyTotals[d]
        );

    const displayLabels =
        labels.map(d => {

            const date =
                new Date(d);

            return date.toLocaleDateString(
                "en-US",
                {
                    day:"2-digit",
                    month:"short"
                }
            );

        });

    const ctx =
        document.getElementById(
            "dailyTrendChart"
        );

    if(!ctx)
        return;

    if(dailyTrendChart){

        dailyTrendChart.destroy();

    }

    dailyTrendChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels:
                    displayLabels,

                fullDates:
                    labels,

                datasets: [{

                    label:
                        dailyTrendType
                        === "income"

                        ?

                        "Income"

                        :

                        "Expense",

                    data:
                        values,

                    backgroundColor:

                        dailyTrendType
                        === "income"

                        ?

                        "#10B981"

                        :

                        "#EF4444",

                    borderRadius: 6,

                    borderSkipped: false,

                    maxBarThickness: 45

                }]

            },

            plugins: [

                ChartDataLabels

            ],

            options: {

                responsive: true,

                maintainAspectRatio: false,

                onClick:
                    function(
                        event,
                        elements
                    ){

                    if(
                        !elements.length
                    )
                        return;

                    const index =
                        elements[0].index;

                    const date =
                        this.data.fullDates[index];

                    showDailyTransactions(
                        date
                    );

                },

                plugins: {

                    datalabels: {

                        anchor: "end",

                        align: "top",

                        color: "#111827",

                        font: {

                            size: 10,

                            weight: "bold"

                        },

                        formatter:
                            value =>

                            value > 0

                            ?

                            value.toLocaleString()

                            :

                            ""

                    },

                    tooltip: {

                        backgroundColor:
                            "#111827",

                        titleColor:
                            "#fff",

                        bodyColor:
                            "#fff",

                        displayColors:
                            false,

                        callbacks: {

                            label:
                                function(
                                    context
                                ){

                                return App.formatCurrency(
                                    context.raw
                                );

                            }

                        }

                    },

                    legend: {

                        display: false

                    }

                },

                scales: {

                    x: {

                        grid: {

                            display:false

                        }

                    },

                    y: {

                        beginAtZero:true,

                        grid: {

                            color:"#E5E7EB"

                        },

                        ticks: {

                            callback:
                                value =>

                                "৳" +
                                value.toLocaleString()

                        }

                    }

                }

            }

        });

}

function showDailyTransactions(date){

    const modal =
        document.getElementById(
            "dailyTrenddetails"
        );

    const body =
        document.getElementById(
            "trendModalBody"
        );

    const title =
        document.getElementById(
            "trendModalTitle"
        );

    const transactions =

        Storage.getTransactions()

        .filter(t =>

            t.type ===
            dailyTrendType

            &&

            t.date === date

        );
		
	window.trendTransactions = transactions;

    title.textContent =

        `${dailyTrendType
            .charAt(0)
            .toUpperCase()
         }${dailyTrendType
            .slice(1)
         } Transactions - ${App.formatDate(date)}`;

    const totalAmount =

        transactions.reduce(

            (sum,t)=>

                sum +
                Number(t.amount),

            0

        );

    body.innerHTML = "";

    if(transactions.length === 0){

        body.innerHTML = `

        <tr>

            <td
                colspan="4"
                style="
                    text-align:center;
                    padding:20px;
                ">

                No Transactions Found

            </td>

        </tr>

        `;

    }

    else{

        transactions.forEach(t => {

			body.innerHTML += `

			<tr>

				<td>
					${App.formatDate(t.date)}
				</td>

				<td>
					${t.category || "-"}
				</td>

				<td>
					${t.note || "-"}
				</td>

				<td>
					${t.account || "-"}
				</td>

				<td>
					${App.formatCurrency(t.amount)}
				</td>

			</tr>

			`;

        });

		body.innerHTML += `

		<tr>

			<td colspan="4"
				style="
					font-weight:bold;
					text-align:right;
					background:#f3f4f6;
					padding:12px;
				">

				Total

			</td>

			<td
				style="
					font-weight:bold;
					background:#f3f4f6;
					padding:12px;
				">

				${App.formatCurrency(totalAmount)}

			</td>

		</tr>

		`;

    }

    modal.style.display =
        "flex";

}

function initializeDailyTrendFilter(){

    const menu =
        document.getElementById(
            "dailyTrendFilterMenu"
        );

    const btn =
        document.getElementById(
            "dailyTrendFilterBtn"
        );

    const label =
        document.getElementById(
            "dailyTrendFilterLabel"
        );

    const arrow =
        document.getElementById(
            "dailyTrendFilterArrow"
        );

    if(
        !menu ||
        !btn
    ){
        return;
    }

    const filters = [

        {
            value:"7days",
            label:"7 Days"
        },

        {
            value:"15days",
            label:"15 Days"
        },

        {
            value:"30days",
            label:"30 Days"
        },

    ];

    menu.innerHTML =

        filters.map(item => `

            <div
                class="expense-filter-item"
                data-value="${item.value}">

                ${item.label}

            </div>

        `).join("");

    btn.addEventListener(
        "click",
        function(){

            menu.classList.toggle(
                "show"
            );

            arrow.textContent =

                menu.classList.contains(
                    "show"
                )

                ?

                "▲"

                :

                "▼";

        }
    );

    menu.addEventListener(
        "click",
        function(e){

            const item =
                e.target.closest(
                    ".expense-filter-item"
                );

            if(!item)
                return;

            dailyTrendSelected =
                item.dataset.value;

            label.textContent =
                item.textContent.trim();

            menu.classList.remove(
                "show"
            );

            arrow.textContent =
                "▼";

            if(
                dailyTrendSelected ===
                "custom"
            ){

                document
                .getElementById(
                    "dailyTrendDateModal"
                )
                .style.display =
                "flex";

            }

            else{

                renderDailyTrendChart();

            }

        }
    );

    document.addEventListener(
        "click",
        function(e){

            if(
                !btn.contains(e.target)

                &&

                !menu.contains(e.target)
            ){

                menu.classList.remove(
                    "show"
                );

                arrow.textContent =
                    "▼";

            }

        }
    );
	

}


	
	
function initializeExpenseFilter(){

    const btn =
        document.getElementById("expenseFilterBtn");

    const menu =
        document.getElementById("expenseFilterMenu");

    const label =
        document.getElementById("expenseFilterLabel");

    if(!btn || !menu) return;

    const today = new Date();

	expenseChartSelected = "month";

    buildExpenseFilterMenu();

    label.textContent =
        today.toLocaleString("en-US",{
            month:"short",
            year:"numeric"
        });
	renderExpenseCategoryChart(expenseChartSelected);

    btn.onclick = function(e){

        e.stopPropagation();

        btn.classList.toggle("active");

        menu.classList.toggle("show");

    };

    menu.onclick = function(e){

        const item =
            e.target.closest(".expense-filter-item");

        if(!item) return;
		
		
		if(
			item.dataset.value ===
			"custom"
		){

			document
			.getElementById(
				"expenseDateModal"
			)
			.style.display =
				"flex";

			return;

		}
        expenseChartSelected =
            item.dataset.value;

        buildExpenseFilterMenu();

		if(
			item.dataset.value ===
			"custom"
		){

			label.textContent =

				`${expenseCustomFrom}

				→

				${expenseCustomTo}`;

		}
		else{

			if(item.dataset.value === "month"){

				const today = new Date();

				label.textContent =
				today.toLocaleString("en-US",{
					month:"short",
					year:"numeric"
				});

			}
			else{

				label.textContent =
				item.dataset.label;

			}

		}

        btn.classList.remove("active");

        menu.classList.remove("show");

        renderExpenseCategoryChart(
            expenseChartSelected
        );
 loadTopExpenses();
    };

    document.addEventListener("click",function(){

        btn.classList.remove("active");

        menu.classList.remove("show");

    });

}



function initializeDailyTrendTypeFilter(){

    const btn =
        document.getElementById(
            "dailyTrendTypeBtn"
        );

    const menu =
        document.getElementById(
            "dailyTrendTypeMenu"
        );

    const label =
        document.getElementById(
            "dailyTrendTypeLabel"
        );

    const arrow =
        document.getElementById(
            "dailyTrendTypeArrow"
        );

    btn.addEventListener(
        "click",
        function(){

            menu.classList.toggle(
                "show"
            );

            arrow.textContent =

                menu.classList.contains(
                    "show"
                )

                ? "▲"

                : "▼";

        }
    );

    menu.addEventListener(
        "click",
        function(e){

            const item =
                e.target.closest(
                    ".expense-filter-item"
                );

            if(!item)
                return;

            dailyTrendType =
                item.dataset.type;

            label.textContent =
                item.textContent.trim();

            menu.classList.remove(
                "show"
            );

            arrow.textContent =
                "▼";

            renderDailyTrendChart();

        }
    );
	
	document.addEventListener(
    "click",
    function(e){

        if(

            !btn.contains(e.target)

            &&

            !menu.contains(e.target)

        ){

            menu.classList.remove(
                "show"
            );

            arrow.textContent =
                "▼";

        }

    }
);

}


function initializeExpenseCustomRange(){

    document
    .getElementById(
        "expenseApplyBtn"
    )
    ?.addEventListener(
        "click",
        function(){

            expenseCustomFrom =
                document
                .getElementById(
                    "expenseFromDate"
                )
                .value;

            expenseCustomTo =
                document
                .getElementById(
                    "expenseToDate"
                )
                .value;

            if(
                !expenseCustomFrom ||
                !expenseCustomTo
            ){
                return;
            }

            
			
		expenseChartSelected =
			"custom";

		document
		.getElementById(
			"expenseFilterLabel"
		)
		.textContent =

			`${expenseCustomFrom}
			→
			${expenseCustomTo}`;

		renderExpenseCategoryChart(
			"custom"
		);

            document
            .getElementById(
                "expenseDateModal"
            )
            .style.display =
                "none";

        }
    );

    document
    .getElementById(
        "expenseCancelBtn"
    )
    ?.addEventListener(
        "click",
        function(){

            document
            .getElementById(
                "expenseDateModal"
            )
            .style.display =
                "none";

        }
    );

}

function initializeTopExpenseCustomRange(){

    document
    .getElementById(
        "topExpenseApplyBtn"
    )
    ?.addEventListener(
        "click",
        function(){
			
			document
			.getElementById(
				"topExpenseCancelBtn"
			)
			?.addEventListener(
				"click",
				function(){

					document
					.getElementById(
						"topExpenseDateModal"
					)
					.style.display =
					"none";

				}
			);

            topExpenseCustomFrom =
            document.getElementById(
                "topExpenseFromDate"
            ).value;


            topExpenseCustomTo =
            document.getElementById(
                "topExpenseToDate"
            ).value;


            topExpenseSelected =
            "custom";


            document.getElementById(
                "topExpenseFilterLabel"
            ).textContent =

            `${topExpenseCustomFrom}
            →
            ${topExpenseCustomTo}`;


            loadTopExpenses();


            document.getElementById(
                "topExpenseDateModal"
            ).style.display="none";

        }
    );
	
	   document
    .getElementById(
        "topExpenseCancelBtn"
    )
    ?.addEventListener(
        "click",
        function(){

            document
            .getElementById(
                "topExpenseDateModal"
            )
            .style.display =
                "none";

        }
    );
	
	
	
	

}


function buildExpenseFilterMenu(){

    const menu =
        document.getElementById("expenseFilterMenu");

    menu.innerHTML="";

    const today = new Date();

	menu.innerHTML = `

	<div
		class="expense-filter-item"
		data-value="month"
		data-label="This Month">

		This Month

	</div>
	
	<div
		 class="expense-filter-item"
		 data-value="previousMonth"
		 data-label="Previous Month">

		 Previous Month

		</div>

	<div
		class="expense-filter-item"
		data-value="3months"
		data-label="Last 3 Months">

		Last 3 Months

	</div>

	<div
		class="expense-filter-item"
		data-value="6months"
		data-label="Last 6 Months">

		Last 6 Months

	</div>

	<div
		class="expense-filter-item"
		data-value="year"
		data-label="This Year">

		This Year

	</div>

	<div
		class="expense-filter-item"
		data-value="all"
		data-label="All Time">

		All Time

	</div>

	<div class="expense-divider"></div>

	<div
		class="expense-filter-item"
		data-value="custom"
		data-label="Custom Range">

		📅 Custom Range

	</div>

	`;
}
	
	
function renderExpenseCategoryChart(range = expenseChartSelected){

    const transactions =
        Storage.getTransactions();

    const today =
        new Date();

    if(!range){

        range =
        `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

    }

    const categoryTotals = {};

    transactions.forEach(item=>{

        if(item.type!=="expense")
            return;

        const d =
            new Date(item.date);

        const monthKey =
            `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

        let include=false;

        switch(range){
			
			case "month":

			include =
				monthKey ===
				`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

			break;
			
			case "previousMonth":

				const previous =
					new Date();

				previous.setMonth(
					previous.getMonth()-1
				);


				include =
					monthKey ===
					`${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,"0")}`;

			break;
			
			case "3months":

			const last3 =
				new Date();

			last3.setMonth(
				last3.getMonth()-3
			);

			include =
				d >= last3;

			break;
			case "6months":

				const last6 =
					new Date();

				last6.setMonth(
					last6.getMonth()-6
				);

				include =
					d >= last6;

				break;
            case "year":

                include =
                    d.getFullYear() ===
                    today.getFullYear();

                break;

            case "all":

                include = true;

                break;

			case "custom":

				if(
					expenseCustomFrom &&
					expenseCustomTo
				){

					include =

						item.date >= expenseCustomFrom

						&&

						item.date <= expenseCustomTo;

				}

				break;
            default:

                include =
                    monthKey === range;

        }

        if(!include)
            return;

        categoryTotals[item.category] =
            (categoryTotals[item.category]||0)
            + Number(item.amount);

    });

    const labels =
        Object.keys(categoryTotals);

    const values =
        Object.values(categoryTotals);

    const ctx =
        document.getElementById("expenseCategoryChart");

    if(!ctx)
        return;

    if(expenseCategoryChart){

        expenseCategoryChart.destroy();

    }


	
	const centerTextPlugin = {

    id: "centerText",

    afterDraw(chart) {

        const {
            ctx,
            chartArea
        } = chart;

        const total =
            chart.data.datasets[0].data
            .reduce(
                (a,b)=>a+b,
                0
            );

        ctx.save();

        ctx.textAlign = "center";

        ctx.fillStyle = "#111827";

        ctx.font =
            "bold 20px Arial";

        ctx.fillText(

            `৳${total.toLocaleString()}`,

            (chartArea.left + chartArea.right) / 2,

            (chartArea.top + chartArea.bottom) / 2 - 5

        );

        ctx.fillStyle = "#6B7280";

        ctx.font =
            "12px Arial";

        ctx.fillText(

            "Total Expense",

            (chartArea.left + chartArea.right) / 2,

            (chartArea.top + chartArea.bottom) / 2 + 18

        );

        ctx.restore();

    }

};

expenseCategoryChart = new Chart(ctx, {

    type: "doughnut",

    data: {

        labels,

        datasets: [{

            data: values,

            cutout: "65%",

            spacing: 3,

            backgroundColor: [
                "#2196F3",
                "#FF4D6D",
                "#FFA726",
                "#4CAF50",
                "#9C27B0",
                "#00BCD4",
                "#795548",
                "#607D8B"
            ],

            borderColor: "#ffffff",

            borderWidth: 3,

            hoverOffset: 8

        }]

    },


plugins: [centerTextPlugin, ChartDataLabels],

options: {

    responsive:true,

    maintainAspectRatio:false,

    onClick: function(event, elements) {

        if (!elements.length) return;

        const index =
            elements[0].index;

        const category =
            this.data.labels[index];

        showCategoryTransactions(
            category
        );

    },

    plugins:{

        tooltip: {

            position: "nearest",

            intersect: true,

            backgroundColor: "#111827",

            titleColor: "#fff",

            bodyColor: "#fff",

            displayColors: false,

            borderWidth: 0,

            padding: 8,

            cornerRadius: 6,

            caretSize: 0,

            titleFont: {
                size: 12,
                weight: "bold"
            },

            bodyFont: {
                size: 11
            },

            callbacks: {

                label: function(context) {

                    const total =
                        context.dataset.data.reduce(
                            (a,b) => a + b,
                            0
                        );

                    const value =
                        context.raw;

                    const percentage =
                        (value / total) * 100;

                    return `${App.formatCurrency(value)} (${percentage.toFixed(1)}%)`;

                }

            }

        },

        datalabels: {

            color: "#111827",

            font: {

                weight: "bold",

                size: 11

            },

            formatter: function(value, context) {

                const total =
                    context.dataset.data.reduce(
                        (a,b) => a + b,
                        0
                    );

                const percentage =
                    (value / total) * 100;

                return percentage.toFixed(0) + "%";

            },

            anchor: "center",

            align: "center"

        },

        legend: {

            position: "bottom",

            labels: {

                usePointStyle: true,

                pointStyle: "circle",

                color: "#374151",

                padding: 12,

                font: {
                    size: 13
                }

            }

        }

    }

}


});

}


function showCategoryTransactions(category){

    const modal =
        document.getElementById(
            "expenseDetailsModal"
        );

    const body =
        document.getElementById(
            "expenseModalBody"
        );

    const title =
        document.getElementById(
            "expenseModalTitle"
        );

    title.textContent =
        category + " Transactions";

    const transactions =
        Storage.getTransactions()
        .filter(t => {

            if(
                t.type !== "expense" ||
                t.category !== category
            ){
                return false;
            }

            const d =
                new Date(t.date);

            const today =
                new Date();

            const monthKey =
                `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

            switch(expenseChartSelected){

                case "month":

                    return (
                        monthKey ===
                        `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`
                    );

                case "previousMonth":

                    const previous =
                        new Date();

                    previous.setMonth(
                        previous.getMonth()-1
                    );

                    return (
                        monthKey ===
                        `${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,"0")}`
                    );

                case "3months":

                    const last3 =
                        new Date();

                    last3.setMonth(
                        last3.getMonth()-3
                    );

                    return d >= last3;

                case "6months":

                    const last6 =
                        new Date();

                    last6.setMonth(
                        last6.getMonth()-6
                    );

                    return d >= last6;

                case "year":

                    return (
                        d.getFullYear() ===
                        today.getFullYear()
                    );

                case "all":

                    return true;

                case "custom":

                    return (
                        expenseCustomFrom &&
                        expenseCustomTo &&
                        t.date >= expenseCustomFrom &&
                        t.date <= expenseCustomTo
                    );

                default:

                    return true;
            }

        });
		
		window.expenseModalTransactions = transactions;

    const totalAmount =
        transactions.reduce(
            (sum, t) =>
                sum + Number(t.amount),
            0
        );

    body.innerHTML = "";

    if(transactions.length === 0){

        body.innerHTML = `

        <tr>
            <td
                colspan="3"
                style="
                    text-align:center;
                    padding:20px;
                ">
                No Transactions Found
            </td>
        </tr>

        <tr>
            <td
                colspan="3"
                style="
                    background:#f3f4f6;
                    font-weight:bold;
                    text-align:right;
                    padding:12px;
                ">
                Total Expense :
                ${App.formatCurrency(0)}
            </td>
        </tr>

        `;

    }else{

        transactions.forEach(t => {

            body.innerHTML += `

            <tr>

                <td>
                    ${App.formatDate(t.date)}
                </td>

                <td>
                    ${t.note || "-"}
                </td>

                <td>
                    ${App.formatCurrency(t.amount)}
                </td>

            </tr>

            `;

        });

        body.innerHTML += `

        <tr>

            <td
                colspan="2"
                style="
                    font-weight:bold;
                    text-align:right;
                    background:#f3f4f6;
                    padding:12px;
                ">
                Total Expense
            </td>

            <td
                style="
                    font-weight:bold;
                    background:#f3f4f6;
                    padding:12px;
                ">
                ${App.formatCurrency(totalAmount)}
            </td>

        </tr>

        `;
    }

    modal.style.display =
        "flex";
}

function renderGoalWidget() {

    const goals =
        Storage.getGoals
        ? Storage.getGoals()
        : [];

    const container =
        document.getElementById(
            "goalProgressWidget"
        );

    if (!container)
        return;

    if (goals.length === 0) {

        container.innerHTML =
            "<p>No Goals Found</p>";

        return;
    }

    container.innerHTML = "";

    goals.forEach(goal => {

        const progress =

            Math.min(
                (
                    goal.saved /
                    goal.target
                ) * 100,
                100
            );

        container.innerHTML += `

            <div
                style="
                margin-bottom:15px;
                ">

                <strong>
                    ${goal.name}
                </strong>

                <div
                    style="
                    background:#eee;
                    height:10px;
                    border-radius:5px;
                    overflow:hidden;
                    margin-top:5px;
                    ">

                    <div
                        style="
                        width:${progress}%;
                        height:100%;
                        background:#4caf50;
                        ">
                    </div>

                </div>

                <small>
                    ${App.formatCurrency(goal.saved)}
                    /
                    ${App.formatCurrency(goal.target)}
                </small>

            </div>

        `;

    });
}
let spendingTrendChart;

function renderSpendingTrend() {

    const canvas =

        document.getElementById(
            "spendingTrend"
        );

    if (!canvas)
        return;

const sixMonthsAgo =

    new Date();

sixMonthsAgo.setMonth(
    sixMonthsAgo.getMonth() - 5
);

const transactions =

    Storage.getTransactions()

    .filter(
        t =>
        t.type === "expense"
    )

    .filter(t => {

        const date =

            new Date(
                t.date
            );

        return (
            date >=
            sixMonthsAgo
        );

    });

    const categories = [

        ...new Set(

            transactions.map(
                t => t.category
            )

        )

    ];

const months = [

    ...new Set(

        transactions.map(
            t => t.date.slice(0,7)
        )

    )

]
.sort()
.reverse();
	

    const datasets =

        categories.map(category => {

            const data =

                months.map(month => {

                    return transactions

                    .filter(t =>

                        t.category === category

                        &&

                        t.date.slice(0,7) === month

                    )

                    .reduce(
                        (sum,t)=>
                        sum+t.amount,
                        0
                    );

                });

            return {

                label:
                    category,

                data,

                tension:
                    0.3

            };

        });

    if (
        spendingTrendChart
    ) {

        spendingTrendChart
        .destroy();

    }

    spendingTrendChart =

        new Chart(

            canvas,

            {

                type: "line",

                data: {

					labels: months.map(month => {

						const [year, m] = month.split("-");

						return new Date(
							year,
							m - 1
						)
						.toLocaleString(
							"en-US",
							{
								month:"short",
								year:"2-digit"
							}
						);

					}),

                    datasets

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }

        );

}

function getMonthTransactions(month) {

    return Storage
    .getTransactions()

    .filter(t =>

        t.date.slice(0,7)
        === month

    );

}



		// =========================
		// PUBLIC API
		// =========================

return {

    init,
    refresh

};

})();


	// ===============================
	// AUTO LOAD
	// ===============================

	document.addEventListener(
		"DOMContentLoaded",
		Dashboard.init
	);
document.addEventListener(
    "click",
    function(e){

        if(
            e.target.id ===
            "expenseModalClose"
        ){

            document
            .getElementById(
                "expenseDetailsModal"
            )
            .style.display =
                "none";

        }

    }
);

document.addEventListener(
    "click",
    function(e){

        if(
            e.target.id ===
            "trendModalClose"
        ){

            document
            .getElementById(
                "dailyTrenddetails"
            )
            .style.display =
                "none";

        }

    }
);

document
.getElementById("exportExcelBtn")
.addEventListener("click", () => {

    const data =
        (window.trendTransactions || [])
        .map(t => ({
            Date: App.formatDate(t.date),
            Category: t.category || "-",
            Note: t.note || "-",
            Account: t.account || "-",
            Amount: t.amount
        }));

    const ws =
        XLSX.utils.json_to_sheet(data);

    const wb =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Transactions"
    );

    XLSX.writeFile(
        wb,
        "Daily_Transactions.xlsx"
    );

});

document
.getElementById("printTransactionBtn")
.addEventListener("click", () => {

    const printArea =
        document.querySelector(
            "#dailyTrenddetails table"
        ).outerHTML;

    const win =
        window.open(
            "",
            "",
            "width=900,height=700"
        );

    win.document.write(`
        <html>
        <head>
            <title>Transactions</title>
            <style>
                table{
                    width:100%;
                    border-collapse:collapse;
                }

                th,td{
                    border:1px solid #ddd;
                    padding:8px;
                }
            </style>
        </head>

        <body>

            <h3>
                ${
                    document.getElementById(
                        "trendModalTitle"
                    ).textContent
                }
            </h3>

            ${printArea}

        </body>
        </html>
    `);

    win.document.close();
    win.print();

});

document
.getElementById("exportPdfBtn")
.addEventListener("click", () => {

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF();

    doc.text(
        document.getElementById(
            "trendModalTitle"
        ).textContent,
        14,
        15
    );

    doc.autoTable({

        startY: 25,

        head: [[
            "Date",
            "Category",
            "Note",
            "Account",
            "Amount"
        ]],

        body:
            (window.trendTransactions || [])
            .map(t => [

                App.formatDate(
                    t.date
                ),

                t.category || "-",

                t.note || "-",

                t.account || "-",

                t.amount

            ])

    });

    doc.save(
        "Daily_Transactions.pdf"
    );

});
document
.getElementById("expenseExcelBtn")
.addEventListener("click", () => {

    const data =
        (window.expenseModalTransactions || [])
        .map(t => ({
            Date: App.formatDate(t.date),
            Note: t.note || "-",
            Amount: t.amount
        }));

    const ws =
        XLSX.utils.json_to_sheet(data);

    const wb =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Category Transactions"
    );

    XLSX.writeFile(
        wb,
        "Category_Transactions.xlsx"
    );

});


document
.getElementById("expensePdfBtn")
.addEventListener("click", () => {

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF();

    const transactions =
        window.expenseModalTransactions || [];

    const totalAmount =

        transactions.reduce(

            (sum, t) =>

                sum +

                Number(
                    t.amount || 0
                ),

            0

        );

    const body =

        transactions.map(
            t => [

                App.formatDate(
                    t.date
                ),

                t.note || "-",

                App.formatCurrency(
                    t.amount
                )

            ]
        );

    /* Total Row */

    body.push([

        "",

        "TOTAL",

        App.formatCurrency(
            totalAmount
        )

    ]);

    doc.text(

        document.getElementById(
            "expenseModalTitle"
        ).textContent,

        14,

        15

    );

    doc.autoTable({

        startY: 25,

        head: [[
            "Date",
            "Note",
            "Amount"
        ]],

        body: body

    });

    doc.save(
        "Category_Transactions.pdf"
    );

});



document
.getElementById("expensePrintBtn")
.addEventListener("click", () => {

    const table =
        document.querySelector(
            "#expenseDetailsModal table"
        ).outerHTML;

    const title =
        document.getElementById(
            "expenseModalTitle"
        ).textContent;

    const win =
        window.open(
            "",
            "",
            "width=900,height=700"
        );

    win.document.write(`

        <html>

        <head>

            <title>${title}</title>

            <style>

                body{
                    font-family:Arial;
                    padding:20px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                th,td{
                    border:1px solid #ddd;
                    padding:8px;
                    text-align:left;
                }

            </style>

        </head>

        <body>

            <h3>${title}</h3>

            ${table}

        </body>

        </html>

    `);

    win.document.close();
    win.print();

});

