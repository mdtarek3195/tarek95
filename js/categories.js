/* ==========================================
   Expense Manager Pro
   File: js/categories.js
   ========================================== */

const Categories = (() => {

    let categories = [];

    // =========================
    // INIT
    // =========================

    function init() {

        initializeDefaultCategories();

        loadCategories();

        bindEvents();

        console.log(
            "Categories Module Loaded"
        );
    }

    // =========================
    // DEFAULT CATEGORIES
    // =========================

function initializeDefaultCategories() {

    const existing =
        Storage.getCategories();

    if (
        existing &&
        existing.length > 0
    ) {
        return;
    }
        const defaults = [

            {
                id: Date.now() + 1,
                name: "Salary",
                type: "income"
            },

          {
                id: Date.now() + 2,
                name: "Food",
                type: "expense"
            },

        ];

        localStorage.setItem(
            "em_categories",
            JSON.stringify(defaults)
        );
    }

    // =========================
    // LOAD
    // =========================

    function loadCategories() {

        categories =
            Storage.getCategories();

        renderTable();

        updateSummary();
    }

    // =========================
    // SUMMARY
    // =========================

    function updateSummary() {

        const incomeCount =
            categories.filter(
                c => c.type === "income"
            ).length;

        const expenseCount =
            categories.filter(
                c => c.type === "expense"
            ).length;

        document.getElementById(
            "totalCategories"
        ).textContent =
            categories.length;

        document.getElementById(
            "incomeCategories"
        ).textContent =
            incomeCount;

        document.getElementById(
            "expenseCategories"
        ).textContent =
            expenseCount;
    }

    // =========================
    // TABLE
    // =========================

    function renderTable() {

        const tbody =
            document.getElementById(
                "categoryTableBody"
            );

        if (!tbody) return;

        if (
            categories.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="3"
                        class="text-center">
                        No Categories Found
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = "";

		categories.sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		
        categories.forEach(category => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${category.name}
                </td>

                <td>
                    ${category.type}
                </td>

                <td>

                    <button
                        class="btn btn-danger"
                        onclick="Categories.deleteCategory(${category.id})">

                        Delete

                    </button>

                </td>

            `;

            tbody.appendChild(row);

        });
    }

    // =========================
    // ADD CATEGORY
    // =========================

    function addCategory() {

        const name =
            document
            .getElementById(
                "categoryName"
            )
            .value
            .trim();

        const type =
            document
            .getElementById(
                "categoryType"
            )
            .value;

        if (!name) {

            alert(
                "Please enter category name."
            );

            return;
        }

        const exists =
            categories.some(
                c =>
                    c.name.toLowerCase() ===
                    name.toLowerCase()
            );

        if (exists) {

            alert(
                "Category already exists."
            );

            return;
        }

        categories.push({

            id: Date.now(),

            name,

            type

        });

        localStorage.setItem(
            "em_categories",
            JSON.stringify(
                categories
            )
        );

        document.getElementById(
            "categoryName"
        ).value = "";

        loadCategories();

        App.showToast(
            "Category Added Successfully"
        );
    }

    // =========================
    // DELETE
    // =========================

    function deleteCategory(id) {

        const confirmed =
            confirm(
                "Delete this category?"
            );

        if (!confirmed) return;

        categories =
            categories.filter(
                c => c.id !== id
            );

        localStorage.setItem(
            "em_categories",
            JSON.stringify(
                categories
            )
        );

        loadCategories();

        App.showToast(
            "Category Deleted"
        );
    }

    // =========================
    // EVENTS
    // =========================

    function bindEvents() {

        document
        .getElementById(
            "saveCategoryBtn"
        )
        ?.addEventListener(
            "click",
            addCategory
        );
    }

    // =========================
    // PUBLIC API
    // =========================

    return {

        init,

        deleteCategory

    };

})();


// =============================
// AUTO LOAD
// =============================

document.addEventListener(
    "DOMContentLoaded",
    Categories.init
);
