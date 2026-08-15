const Goals = (() => {

    let goals = [];
	let selectedGoalId = null;

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

        if (!target || target <= 0) {

            alert(
                "Please enter valid target amount."
            );

            return;
        }

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

        Storage.saveGoals(
            goals
        );

        clearForm();

        loadGoals();

        App.showToast(
            "Goal Added Successfully"
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

    goal.saved += amount;

    if (
        !goal.contributions
    ) {

        goal.contributions = [];

    }

    goal.contributions.push({

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
	
	
		
	function addContribution(id) {

		selectedGoalId = id;

		const select =
			document.getElementById(
				"contributionAccount"
			);

		select.innerHTML = "";

		Storage.getAccounts()
		.forEach(account => {

			select.innerHTML += `

				<option
					value="${account.name}">

					${account.name}

				</option>

			`;

		});

		document
		.getElementById(
			"contributionModal"
		)
		.classList.add(
			"show"
		);
	}


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

    } else {

        let total = 0;

        let html = `

            <table
                class="history-table">

                <thead>

                    <tr>

                        <th>Date</th>
						
						<th>Amount</th>

                        <th>Account</th>

                    </tr>

                </thead>

                <tbody>

        `;

		 goal.contributions.forEach(c => {

			total += c.amount;

			html += `

<tr>

    <td>${c.date}</td>

    <td>
        ${App.formatCurrency(c.amount)}
    </td>

    <td>
        ${c.account || "-"}
    </td>

</tr>

			`;
		});

        html += `

                </tbody>

            </table>

            <div
                class="history-summary">

                Total Contributions:
                ${App.formatCurrency(
                    total
                )}

            </div>

        `;

        container.innerHTML = html;
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
                        ${
                            goal.targetDate ||
                            "-"
                        }
                    </td>

                    <td>
                        ${status}
                    </td>
					<td>

						<button
							class="btn btn-primary"
							onclick="
							Goals.addContribution(
								${goal.id}
							)
							">

							+ Add

						</button>

					</td>
					<td>

					<button
						class="btn btn-secondary"
						onclick="
						Goals.viewHistory(
							${goal.id}
						)
						">

						History

					</button>

					</td>
					
                    <td>

                        <button
                            class="btn btn-danger"
                            onclick="
                            Goals.deleteGoal(
                                ${goal.id}
                            )
                            ">

                            Delete

                        </button>

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
        deleteGoal,
		addContribution,
		viewHistory

    };

})();

document.addEventListener(
    "DOMContentLoaded",
    Goals.init
);