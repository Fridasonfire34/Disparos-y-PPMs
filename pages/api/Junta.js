// pages/api/Junta.js

import { Connection, Request } from "tedious";

const config = {
    authentication: {
        options: {
            userName: "sa", // Reemplaza con tu usuario
            password: "TMPdb1124", // Reemplaza con tu contraseña
        },
        type: "default",
    },
    server: "TMPMX-DEV", // Reemplaza con tu servidor
    options: {
        database: "TMP", // Reemplaza con tu base de datos
        encrypt: true,
        trustServerCertificate: true, // Aceptar certificados autofirmados
        rowCollectionOnRequestCompletion: true, // Asegura que las filas se recojan correctamente
    },
};

export default function handler(req, res) {
    const connection = new Connection(config);

    connection.on("connect", (err) => {
        if (err) {
            console.error("Connection Failed", err);
            res.status(500).json({ error: "Connection Failed", details: err.message });
            return;
        }

        const query = `
            SELECT * FROM [Junta 7AM]
        `;

        const request = new Request(query, (err, rowCount, rows) => {
            if (err) {
                console.error("Request Failed", err);
                res.status(500).json({ error: "Request Failed", details: err.message });
                connection.close();
                return;
            }

            if (rowCount === 0) {
                res.status(200).json([]);
                connection.close();
                return;
            }

            const results = rows.map((columns) => {
                const row = {};
                columns.forEach((column) => {
                    row[column.metadata.colName] = column.value;
                });
                return row;
            });

            res.status(200).json(results);
            connection.close();
        });

        connection.execSql(request);
    });

    connection.on("error", (err) => {
        console.error("Connection Error", err);
        res.status(500).json({ error: "Connection Error", details: err.message });
    });

    connection.connect();
}
