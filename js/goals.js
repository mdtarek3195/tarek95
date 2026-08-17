const Goals = (() => {

    let goals = [];
	let selectedGoalId = null;
	let editingGoalId = null;	
	let editingContributionId = null;

    // =====================
    // INIT
    // =====================

    function init() {

        loadGoals();

        bindEvents();

        console.log(
            "Goals Module Loaded"
        );
    }

    // =====================
    // LOAD GOALS
    // =====================

    function loadGoals() {

        goals =
            Storage.getGoals() || [];

        renderTable();

        updateSummary();
    }

    // =====================
    // SAVE GOAL
    // =====================

function saveGoal() {

    const name =
        document.getElementById(
            "goalName"
        ).value.trim();

    const target =
        Number(
            document.getElementById(
                "goalTarget"
            ).value
        );

    const saved =
        Number(
            document.getElementById(
                "goalSaved"
            ).value || 0
        );

    const targetDate =
        document.getElementById(
            "goalDate"
        ).value;

    if (!name) {

        alert(
            "Please enter goal name."
        );

        return;

    }

    if (
        !target ||
        target <= 0
    ) {

        alert(
            "Please enter valid target amount."
        );

        return;

    }

    /* =====================
       EDIT GOAL
    ===================== */

    if (editingGoalId) {

        const goal =
            goals.find(
                g => g.id === editingGoalId
            );

        if (!goal)
            return;

        goal.name =
            name;

        goal.target =
            target;

        goal.saved =
            saved;

        goal.targetDate =
            targetDate;

        editingGoalId =
            null;

        App.showToast(
            "Goal Updated"
        );

    }

    /* =====================
       ADD GOAL
    ===================== */

    else {

        goals.push({

            id: Date.now(),

            name,

            target,

            saved,

            targetDate,

            contributions: [],

            createdAt:
                new Date()
                .toISOString()

        });

        App.showToast(
            "Goal Added Successfully"
        );

    }

    Storage.saveGoals(
        goals
    );

    clearForm();

    loadGoals();

}




function editGoal(id) {

    const goal =
        goals.find(
            g => g.id === id
        );

    if (!goal)
        return;

    document.getElementById(
        "goalName"
    ).value =
        goal.name;

    document.getElementById(
        "goalTarget"
    ).value =
        goal.target;

    document.getElementById(
        "goalSaved"
    ).value =
        goal.saved || 0;

    document.getElementById(
        "goalDate"
    ).value =
        goal.targetDate || "";

    editingGoalId =
        id;

}


	
function deleteContribution(
    goalId,
    contributionId
){

    if(
        !confirm(
            "Delete Contribution?"
        )
    ){
        return;
    }

    const goal =
        goals.find(
            g => g.id === goalId
        );

    if(!goal)
        return;

    const contribution =
        goal.contributions.find(
            c => c.id === contributionId
        );

    if(!contribution)
        return;

	Storage.updateAccountBalance(

		contribution.account,

		contribution.amount,

		"income"

	);

    goal.saved -=
        contribution.amount;

    goal.contributions =
        goal.contributions.filter(
            c => c.id !== contributionId
        );

    Storage.saveGoals(
        goals
    );

    loadGoals();

    viewHistory(
        goalId
    );

    App.showToast(
        "Contribution Deleted"
    );

}



function editContribution(
    goalId,
    contributionId
) {

    const goal =
        goals.find(
            g => g.id === goalId
        );

    if (!goal)
        return;

    const contribution =
        goal.contributions.find(
            c => c.id === contributionId
        );

    if (!contribution)
        return;

    /* =====================
       CLOSE HISTORY MODAL
    ===================== */

    document
        .getElementById(
            "goalHistoryModal"
        )
        .classList.remove(
            "show"
        );

    /* =====================
       LOAD DATA TO FORM
    ===================== */

    document.getElementById(
        "contributionAmount"
    ).value =
        contribution.amount;

    document.getElementById(
        "contributionAccount"
    ).value =
        contribution.account;

    editingContributionId =
        contributionId;

    editingGoalId =
        goalId;

    selectedGoalId =
        goalId;

    /* =====================
       OPEN CONTRIBUTION MODAL
    ===================== */

    document
        .getElementById(
            "contributionModal"
        )
        .classList.add(
            "show"
        );

}

	
function saveContribution() {

    const amount =
        Number(
            document.getElementById(
                "contributionAmount"
            ).value
        );

    const account =
        document.getElementById(
            "contributionAccount"
        ).value;

    if (
        !amount ||
        amount <= 0
    ) {

        alert(
            "Enter valid amount"
        );

        return;

    }

    const goal =
        goals.find(
            g =>
                g.id ===
                selectedGoalId
        );

    if (!goal)
        return;

    if (
        !goal.contributions
    ) {

        goal.contributions = [];

    }

    /* =====================
       EDIT CONTRIBUTION
    ===================== */

 if (editingContributionId) {

    const contribution =

        goal.contributions.find(
            c =>
                c.id ===
                editingContributionId
        );

    if (!contribution)
        return;

    const oldAmount =
        Number(
            contribution.amount || 0
        );

    const oldAccount =
        contribution.account;

    /* Return old money */

    Storage.updateAccountBalance(

        oldAccount,

        oldAmount,

        "income"

    );

    /* Deduct new money */

    Storage.updateAccountBalance(

        account,

        amount,

        "expense"

    );

    /* Update goal saved */

    goal.saved =

        goal.saved

        - oldAmount

        + amount;

    contribution.amount =
        amount;

    contribution.account =
        account;

    editingContributionId =
        null;

    editingGoalId =
        null;

    Storage.saveGoals(
        goals
    );

    loadGoals();

    document
        .getElementById(
            "contributionModal"
        )
        .classList.remove(
            "show"
        );

    App.showToast(
        "Contribution Updated"
    );

    return;

}

    /* =====================
       ADD CONTRIBUTION
    ===================== */

    goal.saved += amount;

    goal.contributions.push({

        id: Date.now(),

        amount,

        account,

        date:
            new Date()
            .toISOString()
            .split("T")[0]

    });

    Storage.saveGoals(
        goals
    );

    Storage.updateAccountBalance(

        account,

        amount,

        "expense"

    );

    loadGoals();

    document
    .getElementById(
        "contributionModal"
    )
    .classList.remove(
        "show"
    );

    App.showToast(
        "Contribution Added"
    );

    if (
        goal.saved >=
        goal.target
    ) {

        App.showToast(
            "🎉 Goal Completed!"
        );

    }

}	
	

    // =====================
    // DELETE GOAL
    // =====================

    function deleteGoal(id) {

        if (
            !confirm(
                "Delete this goal?"
            )
        ) {
            return;
        }

        goals =
            goals.filter(
                goal =>
                    goal.id !== id
            );

        Storage.saveGoals(
            goals
        );

        loadGoals();

        App.showToast(
            "Goal Deleted"
        );
    }
	


/* =========================
   ADD CONTRIBUTION MODAL
========================= */


function addContribution(id) {

    selectedGoalId =
        id;

    editingContributionId =
        null;

    editingGoalId =
        null;

    const amountInput =
        document.getElementById(
            "contributionAmount"
        );

    const accountSelect =
        document.getElementById(
            "contributionAccount"
        );

    if (amountInput) {

        amountInput.value =
            "";

    }

    if (accountSelect) {

        accountSelect.innerHTML =
            "";

        Storage.getAccounts()
        .filter(
            account =>
                account.type !==
                "creditcard"
        )
        .forEach(account => {

            accountSelect.innerHTML += `

                <option
                    value="${account.name}">

                    ${account.name}

                </option>

            `;

        });

    }

    document
        .getElementById(
            "contributionModal"
        )
        .classList.add(
            "show"
        );

}


/* =========================
   EDIT CONTRIBUTION
========================= */

function editContribution(
    goalId,
    contributionId
) {

    const goal =
        goals.find(
            g => g.id === goalId
        );

    if (!goal)
        return;

    const contribution =
        goal.contributions.find(
            c => c.id === contributionId
        );

    if (!contribution)
        return;

    /* =====================
       CLOSE HISTORY MODAL
    ===================== */

    document
        .getElementById(
            "goalHistoryModal"
        )
        .classList.remove(
            "show"
        );

    /* =====================
       SET EDIT MODE
    ===================== */

    selectedGoalId =
        goalId;

    editingGoalId =
        goalId;

    editingContributionId =
        contributionId;

    /* =====================
       LOAD ACCOUNTS
    ===================== */

    const accountSelect =
        document.getElementById(
            "contributionAccount"
        );

    accountSelect.innerHTML =
        "";

    Storage.getAccounts()
    .filter(
        account =>
            account.type !==
            "creditcard"
    )
    .forEach(account => {

        accountSelect.innerHTML += `

            <option
                value="${account.name}">

                ${account.name}

            </option>

        `;

    });

    /* =====================
       LOAD CONTRIBUTION DATA
    ===================== */

    document.getElementById(
        "contributionAmount"
    ).value =
        contribution.amount;

    document.getElementById(
        "contributionAccount"
    ).value =
        contribution.account;

    /* =====================
       OPEN MODAL
    ===================== */

    document
        .getElementById(
            "contributionModal"
        )
        .classList.add(
            "show"
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


/* =========================
   VIEW HISTORY
========================= */

function viewHistory(id) {

    const goal =
        goals.find(
            g => g.id === id
        );

    if (!goal)
        return;

    document.getElementById(
        "historyGoalTitle"
    ).textContent =
        `${goal.name} History`;

    const container =
        document.getElementById(
            "historyContent"
        );

    if (
        !goal.contributions ||
        goal.contributions.length === 0
    ) {

        container.innerHTML = `

            <p>
                No contribution history found.
            </p>

        `;

    }

    else {

        let total = 0;

        let html = `

            <table class="history-table">

                <thead>

                    <tr>

                        <th>Date</th>

                        <th>Amount</th>

                        <th>Account</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

        `;

        goal.contributions.forEach(c => {

            total +=
                Number(
                    c.amount || 0
                );

            html += `

                <tr>

                    <td>
                       ${formatDate(c.date)}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            c.amount
                        )}
                    </td>

                    <td>
                        ${c.account || "-"}
                    </td>

                    <td>

                        <button
                            class="btn btn-primary btn-sm"
                            onclick="Goals.editContribution(
                                ${goal.id},
                                ${c.id}
                            )">

                            Edit

                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="Goals.deleteContribution(
                                ${goal.id},
                                ${c.id}
                            )">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        });

        html += `

                </tbody>

            </table>

            <div class="history-summary">

                Total Contributions:
                ${App.formatCurrency(
                    total
                )}

            </div>

        `;

        container.innerHTML =
            html;

    }

    document
    .getElementById(
        "goalHistoryModal"
    )
    .classList.add(
        "show"
    );

}
	
	
	
	
	
	
	
	



    // =====================
    // SUMMARY
    // =====================

    function updateSummary() {

        let totalTarget = 0;

        let totalSaved = 0;

        let completed = 0;

        goals.forEach(goal => {

            totalTarget +=
                goal.target;

            totalSaved +=
                goal.saved;

            if (
                goal.saved >=
                goal.target
            ) {

                completed++;

            }

        });

        document.getElementById(
            "totalGoals"
        ).textContent =
            goals.length;

        document.getElementById(
            "totalTarget"
        ).textContent =
            App.formatCurrency(
                totalTarget
            );

        document.getElementById(
            "totalSaved"
        ).textContent =
            App.formatCurrency(
                totalSaved
            );

        document.getElementById(
            "completedGoals"
        ).textContent =
            completed;
    }

    // =====================
    // TABLE
    // =====================

    function renderTable() {

        const tbody =
            document.getElementById(
                "goalTableBody"
            );

        if (!tbody) return;

        if (
            goals.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8"
                        class="text-center">
                        No Goals Found
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = "";

        goals.forEach(goal => {

            const remaining =
                Math.max(
                    0,
                    goal.target -
                    goal.saved
                );

            const progress =
                Math.min(
                    (
                        goal.saved /
                        goal.target
                    ) * 100,
                    100
                );

            const status =
                goal.saved >=
                goal.target
                ? "Completed"
                : "In Progress";

            tbody.innerHTML += `

                <tr>

                    <td>
                        ${goal.name}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            goal.target
                        )}
                    </td>

                    <td>
                        ${App.formatCurrency(
                            goal.saved
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
					${formatDate(
                            goal.targetDate ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${status}
                    </td>
					
					<td>
						<div class="action-buttons">
						<button
							class="btn btn-primary"
							onclick="
							Goals.addContribution(
								${goal.id}
							)
							">

							+ Add

						</button>


					</div>
					</td>
					
                    <td>
						<div class="action-buttons">	
						
						<button
						class="btn btn-secondary"
						onclick="
						Goals.viewHistory(
							${goal.id}
						)
						">

						View

						</button>
						
						<button
							class="btn btn-primary"
							onclick="Goals.editGoal(${goal.id})">

							Edit

						</button>

                        <button
                            class="btn btn-danger"
                            onclick="
                            Goals.deleteGoal(
                                ${goal.id}
                            )
                            ">

                            Delete

                        </button>
						</div>
                    </td>

                </tr>

            `;

        });
    }

    // =====================
    // FORM
    // =====================

    function clearForm() {

        document.getElementById(
            "goalName"
        ).value = "";

        document.getElementById(
            "goalTarget"
        ).value = "";

        document.getElementById(
            "goalSaved"
        ).value = "";

        document.getElementById(
            "goalDate"
        ).value = "";
    }

    // =====================
    // EVENTS
    // =====================

    function bindEvents() {

        document
        .getElementById(
            "saveGoalBtn"
        )
        ?.addEventListener(
            "click",
            saveGoal
        );
		document
		.getElementById(
			"closeHistoryModal"
		)
		?.addEventListener(
			"click",
			() => {

				document
				.getElementById(
					"goalHistoryModal"
				)
				.classList.remove(
					"show"
				);

			}
		);
		document
		.getElementById(
			"goalHistoryModal"
		)
		?.addEventListener(
			"click",
			e => {

				if (
					e.target.id ===
					"goalHistoryModal"
				) {

					document
					.getElementById(
						"goalHistoryModal"
					)
					.classList.remove(
						"show"
					);

				}

			}
		);
		
		document
		.getElementById(
			"saveContributionBtn"
		)
		?.addEventListener(
			"click",
			saveContribution
		);

		document
		.getElementById(
			"closeContributionModal"
		)
		?.addEventListener(
			"click",
			() => {

				document
				.getElementById(
					"contributionModal"
				)
				.classList.remove(
					"show"
				);

			}
		);
		
    }

    // =====================
    // PUBLIC API
    // =====================

    return {

        init,
		editGoal,
        deleteGoal,
		addContribution,
		viewHistory,
		editContribution,
		deleteContribution
		

    };

})();

document.addEventListener(
    "DOMContentLoaded",
    Goals.init
);