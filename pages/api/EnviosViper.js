// pages/api/EnviosViper.js

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
    const connection = new Connection(config);

    connection.on("connect", (err) => {
        if (err) {
            console.error("Connection Failed", err);
            res.status(500).json({ error: "Connection Failed", details: err.message });
            return;
        }

        const query = `
            SELECT * FROM [Envios Viper] ORDER BY [Fecha Entrega] ASC, [Estacion] ASC
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

    connection.connect();
}
