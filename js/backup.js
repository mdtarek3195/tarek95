/* ==========================================
   Expense Manager Pro
   File: js/backup.js
   ========================================== */

const Backup = (() => {
	
const GOOGLE_CLIENT_ID =
"995192416193-716fg9udsgd8kvf9r0j9sg3uni3t74ag.apps.googleusercontent.com";

const DRIVE_SCOPE =
"https://www.googleapis.com/auth/drive.file";

let accessToken = null;


	
    // =========================
    // INIT
    // =========================

function init() {

    window.driveToken =
        localStorage.getItem(
            "driveToken"
        );

    updateStatistics();

    bindEvents();

    if(window.driveToken){

        loadDriveBackups();

    }

    console.log(
        "Backup Module Loaded"
    );

//AUTO BACKUP
const autoBackupEnabled =

    localStorage.getItem(
        "autoBackupEnabled"
    ) === "true";

const checkbox =

    document.getElementById(
        "autoBackupEnabled"
    );

if(checkbox){

    checkbox.checked =
        autoBackupEnabled;

	}
if(window.driveToken){

    autoBackupDaily();

}

	
}

    // =========================
    // STATISTICS
    // =========================

function updateStatistics() {

    const transactions =
        JSON.parse(localStorage.getItem("em_transactions") || "[]");

    const accounts =
        JSON.parse(localStorage.getItem("em_accounts") || "[]");

    const categories =
        JSON.parse(localStorage.getItem("em_categories") || "[]");

    const budgets =
        JSON.parse(localStorage.getItem("em_budgets") || "[]");

    const t =
        document.getElementById("backupTransactions");

    const a =
        document.getElementById("backupAccounts");

    const c =
        document.getElementById("backupCategories");

    const b =
        document.getElementById("backupBudgets");

    if (t) t.textContent = transactions.length;

    if (a) a.textContent = accounts.length;

    if (c) c.textContent = categories.length;

    if (b) b.textContent = budgets.length;

}


	// =========================
    // Google Login Function
    // =========================
function googleLogin(){

    const tokenClient =

        google.accounts.oauth2.initTokenClient({

            client_id:
                GOOGLE_CLIENT_ID,

            scope:
                DRIVE_SCOPE,

            callback: (tokenResponse) => {

                accessToken =
                    tokenResponse.access_token;

                window.driveToken =
                    tokenResponse.access_token;

                localStorage.setItem(
                    "driveToken",
                    tokenResponse.access_token
                );

                console.log(
                    "LOGIN SUCCESS"
                );

                console.log(
                    tokenResponse
                );

                App.showToast(
                    "Google Drive Connected"
                );

                loadDriveBackups();

            }

        });

    tokenClient.requestAccessToken();

}


	
    // =========================
    // EXPORT BACKUP
    // =========================

    function exportBackup() {

        const backupData = {

            exportedAt:
                new Date()
                .toISOString(),

            version: "1.0",

            transactions:
                Storage.getTransactions(),

            accounts:
                Storage.getAccounts(),

            categories:
                Storage.getCategories(),

            budgets:
                Storage.getBudgets(),
				
			cardStatements:
				Storage.getCardStatements(),

			emiPurchases:
				Storage.getEmiPurchases(),			
					
			cardPayments:
				Storage.getCardPayments(),

			statementHistory:
				Storage.getStatementHistory(),

			emiHistory:
				Storage.getEmiHistory(),				
								
			loans: Storage.getLoans
				? Storage.getLoans()
				: [],
           
           transfers:
                Storage.getTransfers
              ? Storage.getTransfers()
              : [],

            goals:
                Storage.getGoals
                    ? Storage.getGoals()
                    : [],

            settings:
                localStorage.getItem(
                    "em_settings"
                )
                ? JSON.parse(
                    localStorage.getItem(
                        "em_settings"
                    )
                )
                : {}

        };

        const json =
            JSON.stringify(
                backupData,
                null,
                2
            );

        const blob =
            new Blob(
                [json],
                {
                    type:
                    "application/json"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        const date =
            new Date()
            .toISOString()
            .split("T")[0];

        a.href = url;

        a.download =
            `expense-manager-backup-${date}.json`;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        App.showToast(
            "Backup Downloaded"
        );
    }

    // =========================
    // GOOGLE EXPORT BACKUP
    // =========================

async function loadDriveBackups() {

    const body =
        document.getElementById(
            "driveBackupBody"
        );

    if(!body)
        return;

    const files =
        await getDriveBackups();

    body.innerHTML = "";

    files.forEach(file => {

        body.innerHTML += `

        <tr>

            <td>
                ${file.name}
            </td>

            <td>
                ${new Date(
                    file.createdTime
                ).toLocaleString()}
            </td>

            <td>
                ${file.size || "-"}
            </td>

			<td>
			
			    <button
			        class="btn btn-success"
			        onclick="restoreFromDrive('${file.id}')">
			
			        Restore
			
			    </button>
			
			    <button
			        class="btn btn-danger"
			        onclick="deleteDriveBackup('${file.id}')">
			
			        Delete
			
			    </button>
			
			</td>

        </tr>

        `;

    });

}
	
async function getBackupFolderId() {

    const folderName =
        "ExpenseManagerBackups";

    const searchUrl =
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const searchResponse =
        await fetch(
            searchUrl,
            {
                headers: {
                    Authorization:
                        "Bearer " +
                        window.driveToken
                }
            }
        );

    const searchData =
        await searchResponse.json();

    if (
        searchData.files &&
        searchData.files.length > 0
    ) {

        return searchData.files[0].id;

    }

    const createResponse =
        await fetch(
            "https://www.googleapis.com/drive/v3/files",
            {
                method: "POST",
                headers: {
                    Authorization:
                        "Bearer " +
                        window.driveToken,
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({

                    name:
                        folderName,

                    mimeType:
                        "application/vnd.google-apps.folder"

                })
            }
        );

    const folder =
        await createResponse.json();

    return folder.id;

}

	//RESTORE FROM GOOGLE DRIVE
	
async function restoreFromDrive(fileId) {

    const response =
        await fetch(

            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,

            {
                headers: {
                    Authorization:
                        "Bearer " +
                        window.driveToken
                }
            }

        );

    const data =
        await response.json();

    localStorage.setItem(
        "em_transactions",
        JSON.stringify(
            data.transactions || []
        )
    );

    localStorage.setItem(
        "em_accounts",
        JSON.stringify(
            data.accounts || []
        )
    );

    localStorage.setItem(
        "em_categories",
        JSON.stringify(
            data.categories || []
        )
    );

    localStorage.setItem(
        "em_budgets",
        JSON.stringify(
            data.budgets || []
        )
    );
	
    localStorage.setItem(
        "em_card_statements",
        JSON.stringify(
            data.cardStatements || []
        )
    );

    localStorage.setItem(
        "em_emi_purchases",
        JSON.stringify(
            data.emiPurchases || []
        )
    );	
		
	localStorage.setItem(
		"em_card_payments",
		JSON.stringify(
			data.cardPayments || []
		)
	);



	localStorage.setItem(
		"em_statement_history",
		JSON.stringify(
			data.statementHistory || []
		)
	);

	localStorage.setItem(
		"em_emi_history",
		JSON.stringify(
			data.emiHistory || []
		)
	);

    localStorage.setItem(
        "em_goals",
        JSON.stringify(
            data.goals || []
        )
    );

    localStorage.setItem(
        "em_loans",
        JSON.stringify(
            data.loans || []
        )
    );

    localStorage.setItem(
        "em_transfers",
        JSON.stringify(
            data.transfers || []
        )
    );

    App.showToast(
        "Backup Restored Successfully"
    );

    setTimeout(() => {

        location.reload();

    }, 1000);

}
	

    // =========================
    // BACKUP FROM GOOGLE DRIVE
    // =========================
	
async function backupToDrive() {

    if (!window.driveToken) {

        alert(
            "Please connect Google Drive first."
        );

        return;

    }

    const backupData = {

        exportedAt:
            new Date()
            .toISOString(),

        version: "1.0",

        transactions:
            Storage.getTransactions(),

        accounts:
            Storage.getAccounts(),

        categories:
            Storage.getCategories(),

        budgets:
            Storage.getBudgets(),
		
		cardStatements:
            Storage.getCardStatements(),
			
		emiPurchases:
            Storage.getEmiPurchases(),
			
		cardPayments:
			Storage.getCardPayments(),

		statementHistory:
			Storage.getStatementHistory(),

		emiHistory:
			Storage.getEmiHistory(),

        loans:
            Storage.getLoans
                ? Storage.getLoans()
                : [],

        transfers:
            Storage.getTransfers
                ? Storage.getTransfers()
                : [],

        goals:
            Storage.getGoals
                ? Storage.getGoals()
                : [],

        settings:
            localStorage.getItem(
                "em_settings"
            )
                ? JSON.parse(
                    localStorage.getItem(
                        "em_settings"
                    )
                )
                : {}

    };

    const fileContent =

        JSON.stringify(
            backupData,
            null,
            2
        );

    const fileName =

        `expense-manager-backup-${
            new Date()
            .toISOString()
            .split("T")[0]
        }.json`;

    const folderId =

        await getBackupFolderId();

    const metadata = {

        name:
            fileName,

        parents:
            [folderId],

        mimeType:
            "application/json"

    };

    const form =

        new FormData();

    form.append(

        "metadata",

        new Blob(

            [JSON.stringify(metadata)],

            {
                type:
                    "application/json"
            }

        )

    );

    form.append(

        "file",

        new Blob(

            [fileContent],

            {
                type:
                    "application/json"
            }

        )

    );

    const response =

        await fetch(

            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",

            {

                method: "POST",

                headers: {

                    Authorization:
                        "Bearer " +
                        window.driveToken

                },

                body: form

            }

        );

    const result =

        await response.json();

    console.log(
        result
    );

    if (response.ok) {

        App.showToast(
            "Backup Uploaded To Drive"
        );

        await cleanupOldBackups();

        loadDriveBackups();

    }

    else {

        console.error(
            result
        );

        App.showToast(
            "Backup Upload Failed"
        );

    }

}


async function getDriveBackups() {

    const folderId =
        await getBackupFolderId();

    const response =
        await fetch(

            `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,createdTime,size)`,

            {
                headers: {
                    Authorization:
                        "Bearer " +
                        window.driveToken
                }
            }

        );

    const data =
        await response.json();

    return data.files || [];

}

//AUTO BACKUP

async function autoBackupDaily() {

    const enabled =

        localStorage.getItem(
            "autoBackupEnabled"
        ) === "true";

    if (!enabled)
        return;

    if (!window.driveToken)
        return;

    const today =

        new Date()
        .toISOString()
        .split("T")[0];

    const lastBackup =

        localStorage.getItem(
            "lastAutoBackup"
        );

    if (lastBackup === today)
        return;

    try {

        await backupToDrive();

        localStorage.setItem(

            "lastAutoBackup",

            today

        );

        console.log(
            "Daily Auto Backup Completed"
        );

    }

    catch (error) {

        console.error(
            "Auto Backup Failed:",
            error
        );

    }

}

//KEEP ONLY 30 BACKUPS

async function cleanupOldBackups(){

    const files =
        await getDriveBackups();

    files.sort(

        (a,b) =>

            new Date(
                b.createdTime
            )

            -

            new Date(
                a.createdTime
            )

    );

    const oldFiles =
        files.slice(30);

    for(const file of oldFiles){

        await fetch(

            `https://www.googleapis.com/drive/v3/files/${file.id}`,

            {
                method: "DELETE",

                headers: {

                    Authorization:
                        "Bearer " +
                        window.driveToken

                }

            }

        );

    }

}

	
    // =========================
    // IMPORT BACKUP
    // =========================

    function importBackup() {

        const file =
            document.getElementById(
                "backupFile"
            ).files[0];

        if (!file) {

            alert(
                "Please select a backup file."
            );

            return;
        }

        const reader =
            new FileReader();

        reader.onload =
            function(event) {

            try {

                const data =
                    JSON.parse(
                        event.target.result
                    );

                if (
                    !data.transactions &&
                    !data.accounts
                ) {

                    throw new Error(
                        "Invalid Backup File"
                    );
                }

                const confirmRestore =
                    confirm(
                        "Restore backup and overwrite current data?"
                    );

                if (
                    !confirmRestore
                ) return;

                localStorage.setItem(
                    "em_transactions",
                    JSON.stringify(
                        data.transactions || []
                    )
                );

                localStorage.setItem(
                    "em_accounts",
                    JSON.stringify(
                        data.accounts || []
                    )
                );

                localStorage.setItem(
                    "em_categories",
                    JSON.stringify(
                        data.categories || []
                    )
                );

                localStorage.setItem(
                    "em_budgets",
                    JSON.stringify(
                        data.budgets || []
                    )
                );

                localStorage.setItem(
                    "em_card_statements",
                    JSON.stringify(
                        data.cardStatements || []
                    )
                );

                localStorage.setItem(
                    "em_emi_purchases",
                    JSON.stringify(
                        data.emiPurchases || []
                    )
                );
				
				localStorage.setItem(
					"em_card_payments",
					JSON.stringify(
						data.cardPayments || []
					)
				);


				localStorage.setItem(
					"em_statement_history",
					JSON.stringify(
						data.statementHistory || []
					)
				);

				localStorage.setItem(
					"em_emi_history",
					JSON.stringify(
						data.emiHistory || []
					)
				);
				
				localStorage.setItem(
					"em_loans",
					JSON.stringify(
						data.loans || []
					)
				);

               localStorage.setItem(

               "em_transfers",

               JSON.stringify(

               data.transfers || []

              )

             );

                localStorage.setItem(
                    "em_goals",
                    JSON.stringify(
                        data.goals || []
                    )
                );

                localStorage.setItem(
                    "em_settings",
                    JSON.stringify(
                        data.settings || {}
                    )
                );

                App.showToast(
                    "Backup Restored Successfully"
                );

                setTimeout(() => {

                    location.reload();

                }, 1000);

            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "Invalid backup file."
                );
            }
        };

        reader.readAsText(
            file
        );
    }

    // =========================
    // RESET ALL DATA
    // =========================

    function resetData() {

        const confirmed =
            confirm(
                "WARNING!\n\nAll data will be permanently deleted.\n\nContinue?"
            );

        if (!confirmed)
            return;

        localStorage.removeItem(
            "em_transactions"
        );

        localStorage.removeItem(
            "em_accounts"
        );

        localStorage.removeItem(
            "em_categories"
        );
		
		localStorage.removeItem("em_loans");

        localStorage.removeItem(
            "em_budgets"
        );
		
		localStorage.removeItem(
            "em_card_statements"
        );
		
		localStorage.removeItem(
            "em_emi_purchases"
        );
		
		localStorage.removeItem(
			"em_card_payments"
		);

		localStorage.removeItem(
			"em_statement_history"
		);

		localStorage.removeItem(
			"em_emi_history"
		);
		
		localStorage.removeItem(
			"em_loans"
		);

       localStorage.removeItem(
			"em_transfers"
		);

        localStorage.removeItem(
            "em_goals"
        );

        localStorage.removeItem(
            "em_settings"
        );

        App.showToast(
            "All Data Deleted"
        );

        setTimeout(() => {

            location.reload();

        }, 1000);
    }

async function deleteDriveBackup(fileId){

    const confirmed =

        confirm(
            "Delete this backup from Google Drive?"
        );

    if(!confirmed)
        return;

    const response =

        await fetch(

            `https://www.googleapis.com/drive/v3/files/${fileId}`,

            {
                method: "DELETE",

                headers: {

                    Authorization:
                        "Bearer " +
                        window.driveToken

                }

            }

        );

    if(response.ok){

        App.showToast(
            "Backup Deleted"
        );

        loadDriveBackups();

    }

    else{

        App.showToast(
            "Delete Failed"
        );

    }

}

	
    // =========================
    // EVENTS
    // =========================

function bindEvents() {

    document
    .getElementById(
        "exportBackupBtn"
    )
    ?.addEventListener(
        "click",
        exportBackup
    );

    document
    .getElementById(
        "importBackupBtn"
    )
    ?.addEventListener(
        "click",
        importBackup
    );

    document
    .getElementById(
        "resetDataBtn"
    )
    ?.addEventListener(
        "click",
        resetData
    );

    document
    .getElementById(
        "googleLoginBtn"
    )
    ?.addEventListener(
        "click",
        googleLogin
    );
document
.getElementById(
    "backupDriveBtn"
)
?.addEventListener(
    "click",
    backupToDrive
);

//AUTO BACKUP
document
.getElementById(
    "autoBackupEnabled"
)
?.addEventListener(
    "change",
    function(){

        localStorage.setItem(

            "autoBackupEnabled",

            this.checked

        );

        App.showToast(

            this.checked
                ? "Daily Auto Backup Enabled"
                : "Daily Auto Backup Disabled"

        );

    }
);

	
}

    // =========================
    // PUBLIC API
    // =========================

return {

    init,
    exportBackup,
    importBackup,
    resetData,
    restoreFromDrive,
    deleteDriveBackup

};

	
})();


// =============================
// AUTO LOAD
// =============================

document.addEventListener(
    "DOMContentLoaded",
    Backup.init
);

window.restoreFromDrive =
    Backup.restoreFromDrive;

window.deleteDriveBackup =
    Backup.deleteDriveBackup;
