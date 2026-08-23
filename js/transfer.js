const Transfer = (() => {

let editingId = null;

    function init() {

        loadAccounts();

        loadTransfers();
    }

    function loadAccounts() {

        const accounts =
            Storage.getAccounts();

        const from =
            document.getElementById(
                "fromAccount"
            );

        const to =
            document.getElementById(
                "toAccount"
            );

        from.innerHTML = "";
        to.innerHTML = "";

        accounts.forEach(a => {

            from.innerHTML += `

                <option>
                    ${a.name}
                </option>

            `;

            to.innerHTML += `

                <option>
                    ${a.name}
                </option>

            `;
        });
    }





//Date  Format

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



function saveTransfer() {

    if (editingId !== null) {

        updateTransfer();

        return;

    }

    const fromAccount =
        document.getElementById("fromAccount").value;

    const toAccount =
        document.getElementById("toAccount").value;

    const amount =
        Number(
            document.getElementById("transferAmount").value
        );

    const note =
        document.getElementById("transferNote").value;

    if (fromAccount === toAccount) {

        alert("Accounts cannot be same.");

        return;

    }

    if (amount <= 0) {

        alert("Invalid amount.");

        return;

    }

    Storage.updateAccountBalance(
        fromAccount,
        amount,
        "expense"
    );

    Storage.updateAccountBalance(
        toAccount,
        amount,
        "income"
    );

    Storage.addTransfer({

        id: Date.now(),

        date: new Date()
            .toISOString()
            .split("T")[0],

        fromAccount,

        toAccount,

        amount,

        note

    });

    clearForm();

    loadTransfers();

    alert("Transfer Completed");

}


    function loadTransfers() {

        const tbody =
            document.getElementById(
                "transferTableBody"
            );

        const transfers =
            Storage.getTransfers();

        tbody.innerHTML = "";

        transfers.forEach(t => {

tbody.innerHTML += `

<tr>

<td>${formatDate(t.date)}</td>

<td>${t.fromAccount}</td>

<td>${t.toAccount}</td>

<td>${App.formatCurrency(t.amount)}</td>

<td>${t.note || "-"}</td>

<td>

<button
class="btn btn-primary btn-sm"
onclick="Transfer.editTransfer(${t.id})">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="Transfer.deleteTransfer(${t.id})">

Delete

</button>

</td>

</tr>

`;


        });
    }



function editTransfer(id){

    const transfers =
        Storage.getTransfers();

    const transfer =
        transfers.find(t=>t.id===id);

    if(!transfer) return;

    editingId=id;

    document.getElementById("fromAccount").value =
        transfer.fromAccount;

    document.getElementById("toAccount").value =
        transfer.toAccount;

    document.getElementById("transferAmount").value =
        transfer.amount;

    document.getElementById("transferNote").value =
        transfer.note;

    document.querySelector(
        'button[onclick="Transfer.saveTransfer()"]'
    ).textContent="Update Transfer";

}

function editTransfer(id){

    const transfers =
        Storage.getTransfers();

    const transfer =
        transfers.find(t=>t.id===id);

    if(!transfer) return;

    editingId=id;

    document.getElementById("fromAccount").value =
        transfer.fromAccount;

    document.getElementById("toAccount").value =
        transfer.toAccount;

    document.getElementById("transferAmount").value =
        transfer.amount;

    document.getElementById("transferNote").value =
        transfer.note;

    document.querySelector(
        'button[onclick="Transfer.saveTransfer()"]'
    ).textContent="Update Transfer";

}


function updateTransfer(){

    const transfers =
        Storage.getTransfers();

    const old =
        transfers.find(
            t=>t.id===editingId
        );

    Storage.updateAccountBalance(
        old.fromAccount,
        old.amount,
        "income"
    );

    Storage.updateAccountBalance(
        old.toAccount,
        old.amount,
        "expense"
    );

    old.fromAccount =
        document.getElementById("fromAccount").value;

    old.toAccount =
        document.getElementById("toAccount").value;

    old.amount =
        Number(
            document.getElementById("transferAmount").value
        );

    old.note =
        document.getElementById("transferNote").value;

    Storage.updateAccountBalance(
        old.fromAccount,
        old.amount,
        "expense"
    );

    Storage.updateAccountBalance(
        old.toAccount,
        old.amount,
        "income"
    );

	Storage.setTransfers(transfers);

    editingId=null;

    clearForm();

    loadTransfers();

    alert("Transfer Updated");

}


function deleteTransfer(id){

    if(
        !confirm("Delete Transfer?")
    ) return;

    let transfers =
        Storage.getTransfers();

    const t =
        transfers.find(
            x=>x.id===id
        );

    Storage.updateAccountBalance(
        t.fromAccount,
        t.amount,
        "income"
    );

    Storage.updateAccountBalance(
        t.toAccount,
        t.amount,
        "expense"
    );

    transfers =
        transfers.filter(
            x=>x.id!==id
        );

Storage.setTransfers(transfers);

    loadTransfers();

    alert("Transfer Deleted");

}


function clearForm(){

    editingId=null;

    document.getElementById("transferAmount").value="";

    document.getElementById("transferNote").value="";

    document.querySelector(
        'button[onclick="Transfer.saveTransfer()"]'
    ).textContent="Transfer";

}

function clearForm(){

    editingId=null;

    document.getElementById("transferAmount").value="";

    document.getElementById("transferNote").value="";

    document.querySelector(
        'button[onclick="Transfer.saveTransfer()"]'
    ).textContent="Transfer";

}

return {

    init,

    saveTransfer,

    editTransfer,

    deleteTransfer

};

})();

document.addEventListener(

    "DOMContentLoaded",

    Transfer.init

);