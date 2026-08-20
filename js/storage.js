/* ==========================================
   Expense Manager Pro
   File: js/storage.js
   ========================================== */

const Storage = (() => {

    const KEYS = {
        TRANSACTIONS: "em_transactions",
        ACCOUNTS: "em_accounts",
        CATEGORIES: "em_categories",
        BUDGETS: "em_budgets",
        GOALS: "em_goals",
		LOANS: "em_loans",
		TRANSFERS: "em_transfers",
		RECURRING: "em_recurring",
        SETTINGS: "em_settings",
		CARD_PAYMENTS: "em_card_payments",
		EMI_PURCHASES: "em_emi_purchases",
		CARD_STATEMENTS: "em_card_statements",
		EMI_HISTORY: "em_emi_history",	
		STATEMENT_HISTORY: "em_statement_history"


    };

    // =====================================
    // GENERIC METHODS
    // =====================================

    function get(key, defaultValue = []) {

        try {

            const data = localStorage.getItem(key);

            return data
                ? JSON.parse(data)
                : defaultValue;

        } catch (error) {

            console.error(error);

            return defaultValue;
        }
    }

    function set(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }

    function generateId() {

        return Date.now() +
               Math.floor(Math.random() * 1000);
    }

function getTransfers() {

    return get(
        KEYS.TRANSFERS,
        []
    );
}

function getCardStatements() {

    return get(
        KEYS.CARD_STATEMENTS,
        []
    );

}

function saveCardStatements(data) {

    set(
        KEYS.CARD_STATEMENTS,
        data
    );

}

function addTransfer(data) {

    const transfers =
        getTransfers();

    transfers.push({

        id: generateId(),

        ...data

    });

    set(
        KEYS.TRANSFERS,
        transfers
    );
}


function setTransfers(data) {

    set(
        KEYS.TRANSFERS,
        data
    );

}


    // =====================================
    // INITIALIZE
    // =====================================

    function initialize() {

        if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
            set(KEYS.TRANSACTIONS, []);
        }

        if (!localStorage.getItem(KEYS.ACCOUNTS)) {

			set(
				KEYS.ACCOUNTS,
				[]
			);

		}

    

// =====================================
// INITIALIZE CATEGORIES
// =====================================

const existingCategories =
    get(KEYS.CATEGORIES, []);

if (
    existingCategories.length > 0 &&
    typeof existingCategories[0] === "string"
) {

    const migratedCategories =
        existingCategories.map(
            (name, index) => ({

                id:
                    Date.now() +
                    index,

                name,

                type: "expense"

            })
        );

    set(
        KEYS.CATEGORIES,
        migratedCategories
    );

}

if (
    !existingCategories ||
    existingCategories.length === 0
) {

    set(KEYS.CATEGORIES, [

        {
            id: generateId(),
            name: "Salary",
            type: "income"
        },

        {
            id: generateId(),
            name: "Food",
            type: "expense"
        }
    ]);

}

        if (!localStorage.getItem(KEYS.BUDGETS)) {
            set(KEYS.BUDGETS, []);
        }

        if (!localStorage.getItem(KEYS.GOALS)) {
            set(KEYS.GOALS, []);
        }

        if (!localStorage.getItem(KEYS.SETTINGS)) {

            set(KEYS.SETTINGS, {
                theme: "light",
                currency: "BDT"
            });

        }

    }

    // =====================================
    // TRANSACTIONS
    // =====================================

    function getTransactions() {
        return get(KEYS.TRANSACTIONS);
    }

    function addTransaction(data) {

        const transactions = getTransactions();

		const transaction = {

			id: generateId(),

			type: data.type,

			date: data.date,

			category: data.category,

			account: data.account,

			amount: Number(data.amount),

			note: data.note || "",

			paymentId:
				data.paymentId || null,

			statementId:
				data.statementId || null,

			createdAt:
				new Date().toISOString()

		};

        transactions.push(transaction);

        set(KEYS.TRANSACTIONS, transactions);

        return transaction;
    }

function getLoans() {

    return get(
        KEYS.LOANS,
        []
    );

}


function getEmiPurchases() {

    return get(
        KEYS.EMI_PURCHASES,
        []
    );

}

function saveEmiPurchases(data) {

    set(
        KEYS.EMI_PURCHASES,
        data
    );

}

function addEmiPurchase(data) {

    const emis =
        getEmiPurchases();

    emis.push({

        id: Date.now(),

        ...data

    });

    saveEmiPurchases(
        emis
    );

}

function deleteEmiPurchase(id) {

    const emis =
        getEmiPurchases()
        .filter(
            e => e.id !== id
        );

    saveEmiPurchases(
        emis
    );

}


function getCardPayments() {

    return get(
        KEYS.CARD_PAYMENTS,
        []
    );

}

function saveCardPayments(
    payments
) {

    set(
        KEYS.CARD_PAYMENTS,
        payments
    );

}

function addCardPayment(
    payment
) {

    const payments =
        getCardPayments();

    payments.push(payment);

    saveCardPayments(
        payments
    );

}


function saveLoans(loans) {

    set(
        KEYS.LOANS,
        loans
    );

}

function addLoan(loan) {

    const loans =
        getLoans();

    loan.id =
        Date.now();

    loans.push(
        loan
    );

    saveLoans(
        loans
    );

}

function deleteLoan(id) {

    const loans =
        getLoans();

    saveLoans(

        loans.filter(

            l =>
                l.id !== id

        )

    );

}


function getStatementHistory() {

    return get(
        KEYS.STATEMENT_HISTORY
    ) || [];

}

function saveStatementHistory(
    history
) {

    set(
        KEYS.STATEMENT_HISTORY,
        history
    );

}



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
        "Statement Archived"
    );

}

window.archiveStatement =
    archiveStatement;


function getEmiHistory() {

    return get(
        KEYS.EMI_HISTORY,
        []
    );

}

function saveEmiHistory(
    history
) {

    set(
        KEYS.EMI_HISTORY,
        history
    );

}


function getTodayExpense(){

    const today =
        new Date()
        .toISOString()
        .split("T")[0];

    return getTransactions()

        .filter(t =>

            t.type === "expense" &&

            t.date === today

        )

        .reduce(

            (sum,t)=>

                sum +
                Number(t.amount),

            0

        );

}


    function updateTransaction(id, updatedData) {

        const transactions = getTransactions();

        const updated = transactions.map(item =>
            item.id === id
                ? { ...item, ...updatedData }
                : item
        );

        set(KEYS.TRANSACTIONS, updated);
    }

    function deleteTransaction(id) {

        const transactions = getTransactions();

        const filtered = transactions.filter(
            item => item.id !== id
        );

        set(KEYS.TRANSACTIONS, filtered);
    }

    // =====================================
    // ACCOUNTS
    // =====================================

function getAccounts() {

    return get(
        KEYS.ACCOUNTS
    ) || [];

}
	
	function updateAccountBalance(
		accountName,
		amount,
		transactionType
	) {

		const accounts =
			getAccounts();

		const account =
			accounts.find(
				a => a.name === accountName
			);

		if (!account) return;

		if (transactionType === "income") {

			account.balance =
				(account.balance || 0) + amount;

		}

		if (transactionType === "expense") {

			account.balance =
				(account.balance || 0) - amount;

		}

		set(KEYS.ACCOUNTS, accounts);

	}
	
function addAccount(data) {

    const accounts =
        getAccounts();

	accounts.push({

		id: Date.now(),

		name:
			data.name,

		type:
			data.type || "bank",

		limit:
			Number(data.limit || 0),

		statementDay:
			Number(
				data.statementDay || 28
			),

		dueAfterDays:
			Number(
				data.dueAfterDays || 15
			),

		balance: 0,

		createdAt:
			new Date()
			.toISOString()

	});

    set(
        KEYS.ACCOUNTS,
        accounts
    );

}


function saveAccounts(accounts) {

    set(
        KEYS.ACCOUNTS,
        accounts
    );

}

function saveTransactions(
    transactions
) {

    set(
        KEYS.TRANSACTIONS,
        transactions
    );

}

    function deleteAccount(id) {

        const accounts = getAccounts();

        set(
            KEYS.ACCOUNTS,
            accounts.filter(a => a.id !== id)
        );
    }

    // =====================================
    // CATEGORIES
    // =====================================

		function getCategories() {

			return get(
				KEYS.CATEGORIES
			) || [];

		}

		function addCategory(category) {

			const categories = getCategories();

			categories.push(category);

			set(
				KEYS.CATEGORIES,
				categories
			);
		}

		function saveCategories(categories){

			set(
				KEYS.CATEGORIES,
				categories
			);

		}


		function deleteCategory(id) {

			const categories = getCategories();

			set(
				KEYS.CATEGORIES,
				categories.filter(
					c => c.id !== id
				)
			);
		}

    // =====================================
    // BUDGETS
    // =====================================

	function getBudgets() {

		return get(
			KEYS.BUDGETS,
			[]
		);
	}

    function saveBudgets(data) {
        set(KEYS.BUDGETS, data);
    }

    // =====================================
    // GOALS
    // =====================================

	function getGoals() {
		return get(KEYS.GOALS, []);
	}

	function saveGoals(goals) {
		set(KEYS.GOALS, goals);
	}

    // =====================================
    // SETTINGS
    // =====================================

    function getSettings() {

        return get(
            KEYS.SETTINGS,
            {}
        );
    }

    function saveSettings(settings) {

        set(
            KEYS.SETTINGS,
            settings
        );
    }

    // =====================================
    // DASHBOARD CALCULATIONS
    // =====================================

    function getTotalIncome() {

        return getTransactions()

            .filter(t => t.type === "income")

            .reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );
    }

    function getTotalExpense() {

        return getTransactions()

            .filter(t => t.type === "expense")

            .reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );
    }

    function getBalance() {

        return (
            getTotalIncome() -
            getTotalExpense()
        );
    }

    function getMonthlyIncome() {

        const month =
            new Date().getMonth();

        const year =
            new Date().getFullYear();

        return getTransactions()

            .filter(item => {

                const d =
                    new Date(item.date);

                return (
                    item.type === "income" &&
                    d.getMonth() === month &&
                    d.getFullYear() === year
                );

            })

            .reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );
    }

    function getMonthlyExpense() {

        const month =
            new Date().getMonth();

        const year =
            new Date().getFullYear();

        return getTransactions()

            .filter(item => {

                const d =
                    new Date(item.date);

                return (
                    item.type === "expense" &&
                    d.getMonth() === month &&
                    d.getFullYear() === year
                );

            })

            .reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );
    }

    function getMonthlySavings() {

        return (
            getMonthlyIncome() -
            getMonthlyExpense()
        );
    }




    // =====================================
    // RECENT TRANSACTIONS
    // =====================================

function getRecentTransactions(
    limit = 10
) {

    return getTransactions()

        .sort(
            (a,b) => {

                const dateSort =
                    new Date(b.date) -
                    new Date(a.date);

                if(dateSort !== 0){
                    return dateSort;
                }

                return b.id - a.id;

            }
        )

        .slice(0, limit);
}

    // =====================================
    // BACKUP
    // =====================================

    function exportBackup() {

        return {

            transactions:
                getTransactions(),

            accounts:
                getAccounts(),

            categories:
                getCategories(),

            budgets:
                getBudgets(),

            goals:
                getGoals(),

            settings:
                getSettings(),

            exportedAt:
                new Date().toISOString()

        };
    }

    function importBackup(data) {

        if (!data) return false;

        set(
            KEYS.TRANSACTIONS,
            data.transactions || []
        );

        set(
            KEYS.ACCOUNTS,
            data.accounts || []
        );

        set(
            KEYS.CATEGORIES,
            data.categories || []
        );

        set(
            KEYS.BUDGETS,
            data.budgets || []
        );

        set(
            KEYS.GOALS,
            data.goals || []
        );

        set(
            KEYS.SETTINGS,
            data.settings || {}
        );

        return true;
    }
	
function getRecurring() {

    return get(
        KEYS.RECURRING,
        []
    );

}

function saveRecurring(data) {

    set(
        KEYS.RECURRING,
        data
    );

}

function addRecurring(item) {

    const recurring =
        getRecurring();

    item.id =
        Date.now();

    recurring.push(item);

    saveRecurring(
        recurring
    );

}

function deleteRecurring(id) {

    const recurring =
        getRecurring()
        .filter(
            r => r.id !== id
        );

    saveRecurring(
        recurring
    );

}

    // =====================================
    // PUBLIC API
    // =====================================

    return {

        initialize,

        getTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,

        getAccounts,
		saveAccounts,
        addAccount,
        deleteAccount,
		updateAccountBalance,

        getCategories,
        addCategory,
		saveCategories,
        deleteCategory,

        getBudgets,
        saveBudgets,

        getGoals,
        saveGoals,
		
		getLoans,
		addLoan,
		saveLoans,
		deleteLoan,
		
		getTransfers,
		addTransfer,
		setTransfers,


        getSettings,
        saveSettings,

        getTotalIncome,
        getTotalExpense,
        getBalance,

        getMonthlyIncome,
        getMonthlyExpense,
        getMonthlySavings,

        getRecentTransactions,
		getTodayExpense,
		
		getRecurring,
		saveRecurring,
		addRecurring,
		deleteRecurring,
		
		getEmiPurchases,
		saveEmiPurchases,
		addEmiPurchase,
		deleteEmiPurchase,
		saveTransactions,
		
		getCardStatements,
		saveCardStatements,
		
		getCardPayments,
		saveCardPayments,
		addCardPayment,
		
		getEmiHistory,
		saveEmiHistory,
		getStatementHistory,
		saveStatementHistory,

        exportBackup,
        importBackup

    };

})();