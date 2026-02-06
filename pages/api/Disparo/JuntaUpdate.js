// pages/api/JuntaUpdate.js
import { Connection, Request } from "tedious";

const config = {
    authentication: {
        options: {
            userName: "sa",
            password: "TMPdb1124",
        },
        type: "default",
    },
    server: "TMPMX-DEV",
    options: {
        database: "TMP",
        encrypt: true,
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true,
    },
};

export default function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
        res.status(400).json({ error: 'Invalid data format' });
        return;
    }

    const connection = new Connection(config);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const executedQueries = [];
    const responseData = [];

    connection.on("connect", (err) => {
        if (err) {
            console.error("Connection Failed", err);
            res.status(500).json({ error: "Connection Failed", details: err.message });
            return;
        }

        // Process rows sequentially to avoid connection state errors
        processRowsSequentially(0);

        function processRowsSequentially(rowIndex) {
            if (rowIndex >= data.length) {
                finishResponse();
                return;
            }

            const row = data[rowIndex];
            const { ID, ...columns } = row;

            console.log(`\n--- Processing Row ${rowIndex} with ID: ${ID} ---`);
            console.log("Columns to update:", columns);

            if (!ID) {
                console.log(`No ID for Row ${rowIndex}`);
                errorCount++;
                const errorMsg = "Row must have ID";
                errors.push(errorMsg);
                responseData.push({ rowIndex, ID, status: 'error', message: errorMsg });
                processRowsSequentially(rowIndex + 1);
                return;
            }

            const setClauses = Object.entries(columns)
                .filter(([key]) => key !== 'ID' && key !== 'Secuencia')
                .map(([key, value]) => {
                    const safeValue = value === null || value === '' ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`;
                    return `[${key}] = ${safeValue}`;
                })
                .join(', ');

            if (!setClauses) {
                console.log(`No changes for Row ${rowIndex} (ID: ${ID})`);
                responseData.push({ rowIndex, ID, status: 'skipped', message: 'No changes detected' });
                processRowsSequentially(rowIndex + 1);
                return;
            }

            const query = `UPDATE [Junta 7AM] SET ${setClauses} WHERE ID = '${ID}'`;
            executedQueries.push(query);
            console.log("Query to execute:", query);

            const request = new Request(query, (err, rowCount) => {
                if (err) {
                    console.error(`Update Failed for Row ${rowIndex}:`, err);
                    errorCount++;
                    const errorMsg = `Row ID ${ID}: ${err.message}`;
                    errors.push(errorMsg);
                    responseData.push({ rowIndex, ID, status: 'error', message: err.message });
                } else {
                    console.log(`Update successful for ID ${ID}, rows affected: ${rowCount}`);
                    successCount++;
                    responseData.push({ rowIndex, ID, status: 'success', rowsAffected: rowCount });
                }

                // Move to next row after this one completes
                processRowsSequentially(rowIndex + 1);
            });

            connection.execSql(request);
        }

        function finishResponse() {
            connection.close();
            console.log("\n=== Update Summary ===");
            console.log("Success:", successCount);
            console.log("Errors:", errorCount);
            console.log("Total processed:", successCount + errorCount + responseData.filter(r => r.status === 'skipped').length);

            res.status(200).json({
                message: "Update completed",
                successCount,
                errorCount,
                totalProcessed: successCount + errorCount + responseData.filter(r => r.status === 'skipped').length,
                errors: errors.length > 0 ? errors : undefined,
                queriesExecuted: executedQueries,
                details: responseData,
            });
        }
    });

    connection.on("error", (err) => {
        console.error("Connection Error", err);
        res.status(500).json({ error: "Connection Error", details: err.message });
    });

    connection.connect();
}
