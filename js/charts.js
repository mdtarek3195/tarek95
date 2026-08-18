//FOR SHOWING BAR/LINE VALUE IN CHART. Chart.register(ChartDataLabels);
const Charts = (() => {

    let dynamicChart = null;
	
	let currentModalMonth = "";
	
	let currentModalType = "";
	
	let compareCustomFrom = null;
	
	let compareCustomTo = null;

    function init(){
		
		loadCompareCategories();
		
		toggleCompareCategories();
		
		initializeCompareCustomRange();

        document
        .getElementById(
            "generateChartBtn"
        )
        ?.addEventListener(
            "click",
            generateChart
        );
		document
			.getElementById(
				"chartType"
			)
			?.addEventListener(
				"change",
				toggleCompareCategories
			);
		document
			.getElementById("printTransactionBtn")
			?.addEventListener(
				"click",
				printTransactionTable
			);
		
		document
			.getElementById("exportPdfBtn")
			?.addEventListener(
				"click",
				exportTransactionPDF
			);
		document
			.getElementById(
				"exportExcelBtn"
			)
			?.addEventListener(
				"click",
				exportTransactionExcel
			);
			document
			.getElementById("printChartBtn")
			?.addEventListener(
				"click",
				printChart
			);

			document
			.getElementById("downloadChartBtn")
			?.addEventListener(
				"click",
				downloadChartPNG
			);

			document
			.getElementById("pdfChartBtn")
			?.addEventListener(
				"click",
				downloadChartPDF
			);
			
    }

    function generateChart(){

        const type =

            document.getElementById(
                "chartType"
            ).value;

			switch(type){

				case "clusteredColumnLine":

					renderClusteredColumnLineChart();

				break;

				case "category":

					renderCategoryChart();

				break;

				case "monthlyBar":

					renderMonthlyBarChart();

				break;
				
				case "monthlyLine":

					renderMonthlyLineChart();

				break;
				
				case "compare":

					renderMonthlyCompareChart();

				break;

			}

    }
	

//CATEGORIES LOAD IN MONTHLY COMPARE CHART	
function loadCompareCategories(){

    const container =

        document.getElementById(
            "compareCategoryList"
        );

    if(!container)
        return;

    const categories =

        Storage.getCategories()

        .filter(c =>

            c.type ===
            "expense"

        );

    container.innerHTML =

        categories.map(c => `

            <label
                style="
                    display:block;
                    margin-bottom:6px;
                ">

                <input
                    type="checkbox"
                    class="compare-category"
                    value="${c.name}">

                ${c.name}

            </label>

        `).join("");

}
	
// INITIALIZE COMPARE CUSTOM DATE RANGE	

function initializeCompareCustomRange(){

    const range =

        document.getElementById(
            "chartRange"
        );

    if(!range)
        return;
	


//ADD NEW
range.addEventListener(
    "change",
    function(){

        if(this.value==="custom"){

            document.getElementById(
                "chartDateModal"
            ).style.display="flex";

        }else{

            document.getElementById(
                "selectedChartRange"
            ).style.display="none";

        }

    }
);





    document
    .getElementById(
        "chartApplyBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            compareCustomFrom =

                document.getElementById(
                    "chartFromDate"
                ).value;

            compareCustomTo =

                document.getElementById(
                    "chartToDate"
                ).value;

            document.getElementById(
                "chartDateModal"
            ).style.display =
                "none";	
				
//NEW ADD				
const info =
    document.getElementById(
        "selectedChartRange"
    );

info.style.display = "block";

info.innerHTML =
    `📅 ${compareCustomFrom} → ${compareCustomTo}`;			
				
				
				

        }
    );

    document
    .getElementById(
        "chartCancelBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            document.getElementById(
                "chartDateModal"
            ).style.display =
                "none";

        }
    );

}
	
	
function renderCategoryChart(){

    const type =

        document.getElementById(
            "chartDataType"
        ).value;

    const range =

        document.getElementById(
            "chartRange"
        ).value;

    const transactions =
        Storage.getTransactions();

    const totals = {};

    const today =
        new Date();

    transactions.forEach(t => {

        if(
            t.type !== type
        ){
            return;
        }

        const d =
            new Date(t.date);

        const monthKey =
            `${d.getFullYear()}-${String(
                d.getMonth()+1
            ).padStart(2,"0")}`;

        let include = false;

        switch(range){

            case "month":

                include =
                    monthKey ===
                    `${today.getFullYear()}-${String(
                        today.getMonth()+1
                    ).padStart(2,"0")}`;

            break;

            case "previousMonth":

                const previous =
                    new Date();

                previous.setMonth(
                    previous.getMonth()-1
                );

                include =
                    monthKey ===
                    `${previous.getFullYear()}-${String(
                        previous.getMonth()+1
                    ).padStart(2,"0")}`;

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
			
			case "custom":

				const fromDate =

					document.getElementById(
						"chartFromDate"
					)?.value;

				const toDate =

					document.getElementById(
						"chartToDate"
					)?.value;

				include =

					fromDate &&

					toDate &&

					t.date >= fromDate &&

					t.date <= toDate;

			break;

            default:

                include = true;

        }

        if(!include)
            return;

        const key =
            t.category || "Uncategorized";

        totals[key] =

            (totals[key] || 0)

            + Number(t.amount);

    });

    const labels =
        Object.keys(totals);

    const values =
        Object.values(totals);

    const ctx =
        document.getElementById(
            "dynamicChart"
        );

    if(dynamicChart){

        dynamicChart.destroy();

    }

    dynamicChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels,

            datasets: [{

                label:
                    type === "expense"
                    ? "Expense"
                    : "Income",

                data: values

            }]

        },

        options: {

            indexAxis: "y",

            responsive: true,

            maintainAspectRatio: false,

            onClick: function(event,elements){

                if(!elements.length)
                    return;

                const index =
                    elements[0].index;

                const category =
                    labels[index];

                showChartTransactions(
                    category,
                    type,
                    range
                );

            }

        }

    });

}




//RENDER CLUSTERED COLUMN LINE CHART
function renderClusteredColumnLineChart(){

    const dataType =
        document.getElementById(
            "chartDataType"
        ).value;

    const range =
        document.getElementById(
            "chartRange"
        ).value;

    const today =
        new Date();

    const transactions =
        Storage.getTransactions()

        .filter(t => {

            const d =
                new Date(t.date);

            const monthKey =
                `${d.getFullYear()}-${String(
                    d.getMonth()+1
                ).padStart(2,"0")}`;

            switch(range){

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
                        last3.getMonth()-3);

                    return d >= last3;

                case "6months":

                    const last6 =
                        new Date();

                    last6.setMonth(
                        last6.getMonth()-6);

                    return d >= last6;

                case "year":

                    return (

                        d.getFullYear() ===
                        today.getFullYear()

                    );

                case "custom":

                    return (

                        compareCustomFrom &&

                        compareCustomTo &&

                        t.date >= compareCustomFrom &&

                        t.date <= compareCustomTo

                    );

                default:

                    return true;

            }

        });

    const monthMap = {};

transactions.forEach(t=>{

    const d = new Date(t.date);

    const month =

        d.toLocaleString(
            "default",
            {
                month:"short"
            }
        )

        + " " +

        d.getFullYear();

    if(!monthMap[month]){

        monthMap[month]={

            income:0,

            expense:0

        };

    }

    if(t.type==="income"){

        monthMap[month].income +=
            Number(t.amount);

    }

    if(t.type==="expense"){

        monthMap[month].expense +=
            Number(t.amount);

    }

});

const labels = Object.keys(monthMap);

const incomeData =
    labels.map(m => monthMap[m].income);

const expenseData =
    labels.map(m => monthMap[m].expense);
	

const savingsData =
    labels.map(
        m =>

        monthMap[m].income -

        monthMap[m].expense
    );
	
	const ctx =
    document.getElementById(
        "dynamicChart"
    );

if(dynamicChart){

    dynamicChart.destroy();

}

dynamicChart =
    new Chart(ctx,{
		type: "bar",
        data:{

            labels,

// NEW UPDATE
datasets: [

    {
        type: "bar",

        label: "Income",

        data: incomeData,

        backgroundColor: "#4F81BD",

        borderColor: "#4F81BD",

        borderWidth: 1
    },

    {
        type: "bar",

        label: "Expense",

        data: expenseData,

        backgroundColor: "#F28E8E",

        borderColor: "#F28E8E",

        borderWidth: 1
    },

    {
        type: "line",

        label: "Income Trend",

        data: incomeData,

        borderColor: "#0D47A1",

        backgroundColor: "#0D47A1",

        pointRadius: 5,

        pointHoverRadius: 7,

        tension: .35,

        fill: false
    },

    {
        type: "line",

        label: "Expense Trend",

        data: expenseData,

        borderColor: "#D32F2F",

        backgroundColor: "#D32F2F",

        pointRadius: 5,

        pointHoverRadius: 7,

        tension: .35,

        fill: false
    }

]


        },

//UPDATE NEW CODE
options:{

    responsive:true,

    maintainAspectRatio:false,

    interaction:{
        mode:"nearest",
        intersect:true
    },

    scales:{
        y:{
            beginAtZero:true
        }
    },
onClick:function(event,elements){

    if(!elements.length)
        return;

    const point = elements[0];

    const month = labels[point.index];

    const datasetLabel =
        this.data.datasets[
            point.datasetIndex
        ].label;

    let type = "all";

    if(datasetLabel.includes("Income")){

        type = "income";

    }
    else if(datasetLabel.includes("Expense")){

        type = "expense";

    }

    showMonthlyTransactions(
        month,
        type
    );

}

}




    });

}


//RENDER MONTHLY BAR CHART

function renderMonthlyBarChart(){

    const type =

        document.getElementById(
            "chartDataType"
        ).value;

    const range =

        document.getElementById(
            "chartRange"
        ).value;

    const transactions =

        Storage.getTransactions()

        .filter(t => {

            if(
                t.type !== type
            ){
                return false;
            }

            const d =
                new Date(t.date);

            const today =
                new Date();

            const monthKey =
                `${d.getFullYear()}-${String(
                    d.getMonth()+1
                ).padStart(2,"0")}`;

            switch(range){

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

					const fromDate =
						document.getElementById(
							"chartFromDate"
						)?.value;

					const toDate =
						document.getElementById(
							"chartToDate"
						)?.value;

					return (

						fromDate &&

						toDate &&

						t.date >= fromDate &&

						t.date <= toDate

					);

                default:

                    return true;

            }

        });

    const monthMap = {};

    transactions.forEach(t => {

        const d =
            new Date(t.date);

        const monthLabel =

            d.toLocaleString(
                "default",
                {
                    month:"short"
                }
            )

            + " " +

            d.getFullYear();

        monthMap[monthLabel] =

            (monthMap[monthLabel] || 0)

            + Number(t.amount);

    });

    const labels =
        Object.keys(monthMap);

    const values =
        Object.values(monthMap);

    const ctx =
        document.getElementById(
            "dynamicChart"
        );

    if(dynamicChart){

        dynamicChart.destroy();

    }

    dynamicChart =

        new Chart(ctx, {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:type,

                    data:values

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                onClick:
                function(
                    event,
                    elements
                ){

                    if(
                        !elements.length
                    ) return;

                    const index =

                        elements[0].index;

                    const month =

                        labels[index];

                    showMonthlyTransactions(

                        month,

                        type

                    );

                }

            }

        });

}



//RENDER MONTHLY LINE CHART
function renderMonthlyLineChart(){

    const type =

        document.getElementById(
            "chartDataType"
        ).value;

    const range =

        document.getElementById(
            "chartRange"
        ).value;

    const transactions =

        Storage.getTransactions()

        .filter(t => {

            if(
                t.type !== type
            ){
                return false;
            }

            const d =
                new Date(t.date);

            const today =
                new Date();

            const monthKey =
                `${d.getFullYear()}-${String(
                    d.getMonth()+1
                ).padStart(2,"0")}`;

            switch(range){

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

                    const fromDate =

                        document.getElementById(
                            "chartFromDate"
                        )?.value;

                    const toDate =

                        document.getElementById(
                            "chartToDate"
                        )?.value;

                    return (

                        fromDate &&

                        toDate &&

                        t.date >= fromDate &&

                        t.date <= toDate

                    );

                default:

                    return true;

            }

        });

    const monthMap = {};

    transactions.forEach(t => {

        const d =
            new Date(t.date);

        const key =

            `${d.getFullYear()}-${String(
                d.getMonth()+1
            ).padStart(2,"0")}`;

        monthMap[key] =

            (monthMap[key] || 0)

            + Number(t.amount);

    });

    const labels =
        Object.keys(monthMap);

    const values =
        Object.values(monthMap);

    const ctx =

        document.getElementById(
            "dynamicChart"
        );

    if(dynamicChart){

        dynamicChart.destroy();

    }

    dynamicChart =

        new Chart(ctx, {

            type:"line",

            data:{

                labels,

                datasets:[{

                    label:

                        type === "expense"

                        ? "Expense"

                        : "Income",

                    data:values,

                    tension:0.35,

                    fill:false,

                    pointRadius:6,

                    pointHoverRadius:8

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                interaction:{
                    intersect:true
                },

                plugins:{

                    tooltip:{

                        callbacks:{

                            label:function(context){

                                return App.formatCurrency(

                                    context.raw

                                );

                            }

                        }

                    }

                },

                onClick:

                function(event,elements){

                    if(
                        !elements.length
                    ) return;

                    const index =

                        elements[0].index;

                    const month =

                        labels[index];

                    showMonthlyLineTransactions(

                        month,

                        type

                    );

                }

            }

        });

}

// RENDER MONTHLY COMPARE CHART

function renderMonthlyCompareChart(){

    const type =

        document.getElementById(
            "chartDataType"
        ).value;

const range =

    document.getElementById(
        "chartRange"
    ).value;

const transactions =

    Storage.getTransactions()

    .filter(t => {

        if(
            t.type !== type
        ){
            return false;
        }

        const d =
            new Date(t.date);

        const today =
            new Date();

        const monthKey =
            `${d.getFullYear()}-${String(
                d.getMonth()+1
            ).padStart(2,"0")}`;

        switch(range){

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

                    compareCustomFrom &&

                    compareCustomTo &&

                    t.date >= compareCustomFrom &&

                    t.date <= compareCustomTo

                );

            default:

                return true;

        }

    });

    const selectedCategories =

        Array.from(

            document.querySelectorAll(
                ".compare-category:checked"
            )

        )

        .map(
            item => item.value
        );

    let categoriesToUse =

        [...selectedCategories];

    if(
        categoriesToUse.length === 0
    ){

        const totals = {};

        transactions.forEach(t => {

            totals[t.category] =

                (totals[t.category] || 0)

                + Number(t.amount);

        });

        categoriesToUse =

            Object.entries(totals)

            .sort(
                (a,b)=>
                    b[1]-a[1]
            )

            .slice(0,5)

            .map(
                item => item[0]
            );

    }

    const monthSet =
        new Set();

    transactions.forEach(t => {

        const d =
            new Date(t.date);

        monthSet.add(

            `${d.getFullYear()}-${String(
                d.getMonth()+1
            ).padStart(2,"0")}`

        );

    });

    const labels =

        [...monthSet]

        .sort();

    const datasets =

        categoriesToUse.map(
            category => {

                const values =

                    labels.map(month => {

                        return transactions

                        .filter(t => {

                            const d =
                                new Date(t.date);

                            const key =

                                `${d.getFullYear()}-${String(
                                    d.getMonth()+1
                                ).padStart(2,"0")}`;

                            return (

                                t.category === category

                                &&

                                key === month

                            );

                        })

                        .reduce(

                            (sum,t)=>

                                sum +
                                Number(t.amount),

                            0

                        );

                    });

                return {

                    label:
                        category,

                    data:
                        values,

                    tension:0.35,

                    fill:false,

                    pointRadius:5,

                    pointHoverRadius:8

                };

            }
        );

    const ctx =

        document.getElementById(
            "dynamicChart"
        );

    if(!ctx)
        return;

    if(dynamicChart){

        dynamicChart.destroy();

    }

    dynamicChart =

        new Chart(ctx, {

            type:"line",

            data:{

                labels,

                datasets

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                interaction:{
                    intersect:true
                },

                plugins:{

                    legend:{
                        position:"bottom"
                    }

                },

                onClick:
                function(
                    event,
                    elements
                ){

                    if(
                        !elements.length
                    ) return;

                    const point =

                        elements[0];

                    const month =

                        labels[
                            point.index
                        ];

                    const category =

                        datasets[
                            point.datasetIndex
                        ].label;

                    showCompareTransactions(

                        month,

                        category,

                        type

                    );

                }

            }

        });

}






function toggleCompareCategories(){

    const chartType =

        document.getElementById(
            "chartType"
        ).value;

    const wrapper =

        document.getElementById(
            "compareCategoryWrapper"
        );

    if(!wrapper)
        return;

    wrapper.style.display =

        chartType === "compare"

        ? "block"

        : "none";

}

function showChartTransactions(

    category,
    type,
    range

){

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

        `${category} - ${type}`;

    const today =
        new Date();

    const transactions =

        Storage.getTransactions()

        .filter(t => {

            if(
                t.type !== type
            ){
                return false;
            }

            if(
                (t.category || "Uncategorized")
                !== category
            ){
                return false;
            }

            const d =
                new Date(t.date);

            const monthKey =
                `${d.getFullYear()}-${String(
                    d.getMonth()+1
                ).padStart(2,"0")}`;

            switch(range){

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

                default:

                    return true;

            }

        });

    const totalAmount =

        transactions.reduce(

            (sum,t)=>

                sum +
                Number(t.amount),

            0

        );

    body.innerHTML = "";

    if(
        transactions.length === 0
    ){

        body.innerHTML = `

        <tr>

            <td
                colspan="5"
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

                ${App.formatCurrency(
                    totalAmount
                )}

            </td>

        </tr>

        `;

    }

    modal.style.display =
        "flex";

}


//Monthly Bar Chart-এর bar click করলে ওই মাসের সব transaction modal-এ দেখাবে।

// NEW UPDATE 4.50 PM
function showMonthlyTransactions(

    monthLabel,
	
    type

){

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

        `${monthLabel} - ${
            type === "all"

            ? "All"

            : type.charAt(0).toUpperCase() +
              type.slice(1)

        } Transactions`;

    const transactions =

        Storage.getTransactions()

        .filter(t => {

            if(

                type !== "all"

                &&

                t.type !== type

            ){

                return false;

            }

            const d =
                new Date(t.date);

            const currentLabel =

                d.toLocaleString(
                    "default",
                    {
                        month:"short"
                    }
                )

                + " " +

                d.getFullYear();

            return (

                currentLabel ===
                monthLabel

            );

        });

    const totalAmount =

        transactions.reduce(

            (sum,t)=>

                sum +
                Number(t.amount),

            0

        );

    body.innerHTML = "";

    if(

        transactions.length === 0

    ){

        body.innerHTML = `

        <tr>

            <td colspan="6"
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

                ${App.formatCurrency(
                    totalAmount
                )}

            </td>

        </tr>

        `;

    }

    modal.style.display =

        "flex";

}

//MODAL PRINT
function printTransactionTable(){

    const title =
        document.getElementById(
            "expenseModalTitle"
        ).textContent;

    const table =
        document.querySelector(
            "#expenseDetailsModal table"
        ).outerHTML;

    const now =
        new Date().toLocaleString();

    const win =
        window.open(
            "",
            "_blank"
        );

    win.document.write(`

<html>

<head>

<title>${title}</title>

<style>

body{
    font-family:Arial,sans-serif;
    padding:20px;
}

table{
    width:100%;
    border-collapse:collapse;
}

th,
td{
    border:1px solid #999;
    padding:8px;
    text-align:left;
}

h2{
    margin-bottom:5px;
}

p{
    color:#666;
    margin-bottom:20px;
}

</style>

</head>

<body>

<h2>${title}</h2>

<p>Generated: ${now}</p>

${table}

</body>

</html>

`);

    win.document.close();

    win.focus();

    win.print();

    win.onafterprint = function(){

        win.close();

    };

}

function exportTransactionPDF(){

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const title =
        document.getElementById(
            "expenseModalTitle"
        ).textContent;

    doc.setFontSize(16);

    doc.text(
        title,
        14,
        15
    );

    doc.autoTable({

        html:
        "#expenseDetailsModal table",

        startY:25,

        theme:"grid",

        headStyles:{
            fillColor:[41,128,185]
        }

    });

    doc.save(

        `${title}.pdf`

    );

}

function exportTransactionExcel(){

    const table = document.querySelector(
        "#expenseDetailsModal table"
    );

    const workbook =
        XLSX.utils.table_to_book(
            table,
            {
                sheet:"Transactions"
            }
        );

    const title =
        document.getElementById(
            "expenseModalTitle"
        ).textContent
        .replace(/[\\/:*?"<>|]/g,"_");

    XLSX.writeFile(
        workbook,
        `${title}.xlsx`
    );

}

 // CLUSTERED COLUMN LINE CHART START
 
 

// SHOW MONTHLY LINE CHART MODAL TRANSACTION

function showMonthlyLineTransactions(

    monthLabel,
    type

){

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

        `${monthLabel} - ${type
            .charAt(0)
            .toUpperCase()
        }${type.slice(1)} Transactions`;

    const transactions =

        Storage.getTransactions()

        .filter(t => {

            if(
                t.type !== type
            ){
                return false;
            }

            const d =
                new Date(t.date);

            const currentLabel =

                `${d.getFullYear()}-${String(
                    d.getMonth()+1
                ).padStart(2,"0")}`;

            return (
                currentLabel ===
                monthLabel
            );

        });

    const totalAmount =

        transactions.reduce(

            (sum,t)=>

                sum +
                Number(t.amount),

            0

        );

    body.innerHTML = "";

    if(
        transactions.length === 0
    ){

        body.innerHTML = `

        <tr>

            <td
                colspan="5"
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

            <td
                colspan="4"
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

                ${App.formatCurrency(
                    totalAmount
                )}

            </td>

        </tr>

        `;

    }

    modal.style.display =
        "flex";

}


// SHOW COMPARE CHART TRANSACTION IN MODAL

function showCompareTransactions(

    monthLabel,
    category,
    type

){

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

        `${category} - ${monthLabel}`;

    const transactions =

        Storage.getTransactions()

        .filter(t => {

            if(
                t.type !== type
            ){
                return false;
            }

            if(
                t.category !== category
            ){
                return false;
            }

            const d =
                new Date(t.date);

            const currentMonth =

                `${d.getFullYear()}-${String(
                    d.getMonth()+1
                ).padStart(2,"0")}`;

            return (
                currentMonth ===
                monthLabel
            );

        });

    const totalAmount =

        transactions.reduce(

            (sum,t)=>

                sum +
                Number(t.amount),

            0

        );

    body.innerHTML = "";

    if(
        transactions.length === 0
    ){

        body.innerHTML = `

        <tr>

            <td
                colspan="5"
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

            <td
                colspan="4"
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

                ${App.formatCurrency(
                    totalAmount
                )}

            </td>

        </tr>

        `;

    }

    modal.style.display =
        "flex";

}

function printChart(){

    window.print();

}


async function downloadChartPDF(){

    const { jsPDF } = window.jspdf;

    const chart = document.querySelector(".card canvas");

    const canvas = await html2canvas(chart, {
        scale: 2
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF(
        "landscape",
        "mm",
        "a4"
    );

    pdf.setFontSize(18);
    pdf.text(
        "Expense Manager Report",
        14,
        15
    );

    pdf.addImage(
        imgData,
        "PNG",
        10,
        25,
        270,
        140
    );

    pdf.save("Expense-Chart.pdf");

}



    return {

        init

    };

})();

document.addEventListener(

    "DOMContentLoaded",

    Charts.init

);
//Close Button
document
.getElementById(
    "expenseModalClose"
)
?.addEventListener(
    "click",
    function(){

        document
        .getElementById(
            "expenseDetailsModal"
        )
        .style.display =
            "none";

    }
);



//Outside click close
window.addEventListener(
    "click",
    function(e){

        const modal =

            document.getElementById(
                "expenseDetailsModal"
            );

        if(
            e.target === modal
        ){

            modal.style.display =
                "none";

        }

    }
);