const CardPayment = (() => {

    function init() {

        loadAccounts();

        bindEvents();

        document
        .getElementById(
            "paymentDate"
        )
        .value =

            new Date()
            .toISOString()
            .split("T")[0];

    }

    function loadAccounts() {

        const accounts =

            Storage.getAccounts();

        const fromSelect =

            document.getElementById(
                "paymentFromAccount"
            );

        const cardSelect =

            document.getElementById(
                "paymentCard"
            );

        fromSelect.innerHTML = "";

        cardSelect.innerHTML = "";

        accounts.forEach(account => {

            if (

                account.type !==
                "creditcard"

            ) {

                fromSelect.innerHTML += `

                    <option value="${account.name}">

                        ${account.name}

                    </option>

                `;

            }

            else {

                cardSelect.innerHTML += `

                    <option value="${account.name}">

                        ${account.name}

                    </option>

                `;

            }

        });

        updateOutstanding();

    }

    function updateOutstanding() {

        const cardName =

            document.getElementById(
                "paymentCard"
            )
            .value;

        const card =

            Storage
            .getAccounts()

            .find(

                a =>
                a.name === cardName

            );

        document
        .getElementById(
            "cardOutstanding"
        )
        .value =

            App.formatCurrency(

                card?.balance || 0

            );

    }

    function savePayment() {

        const fromAccount =

            document.getElementById(
                "paymentFromAccount"
            )
            .value;

        const cardAccount =

            document.getElementById(
                "paymentCard"
            )
            .value;

        const amount =

            Number(

                document
                .getElementById(
                    "paymentAmount"
                )
                .value

            );

        const date =

            document
            .getElementById(
                "paymentDate"
            )
            .value;

        const note =

            document
            .getElementById(
                "paymentNote"
            )
            .value;

        if (

            !amount ||

            amount <= 0

        ) {

            alert(
                "Enter valid amount"
            );

            return;

        }

        // Bank Balance Reduce

        Storage.updateAccountBalance(

            fromAccount,

            amount,

            "expense"

        );

        // Card Outstanding Reduce

        Storage.updateAccountBalance(

            cardAccount,

            amount,

            "expense"

        );

        Storage.addTransaction({

            type:
                "cardpayment",

            date,

            category:
                "Credit Card Payment",

            account:
                cardAccount,

            amount,

            note

        });

        App.showToast(
            "Card Payment Saved"
        );

    }

    function bindEvents() {

        document
        .getElementById(
            "paymentCard"
        )
        ?.addEventListener(
            "change",
            updateOutstanding
        );

        document
        .getElementById(
            "saveCardPaymentBtn"
        )
        ?.addEventListener(
            "click",
            savePayment
        );

    }

    return {

        init

    };

})();

document.addEventListener(
    "DOMContentLoaded",
    CardPayment.init
);