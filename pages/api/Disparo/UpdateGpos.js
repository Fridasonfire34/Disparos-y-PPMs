// pages/api/Disparo/UpdateGpos.js

import { Connection, Request, TYPES } from "tedious";

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
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { po, column, value } = req.body;

    if (!po || !column || value === null || value === undefined) {
        res.status(400).json({ error: 'PO, column, and value are required' });
        return;
    }

    // Validar que el column sea uno de los permitidos
    const allowedColumns = ['Orden', 'Fecha CMX', 'Qty'];
    if (!allowedColumns.includes(column)) {
        res.status(400).json({ error: 'Invalid column' });
        return;
    }

    const connection = new Connection(config);

    connection.on("connect", (err) => {
        if (err) {
            console.error("Connection Failed", err);
            res.status(500).json({ error: "Connection Failed", details: err.message });
            return;
        }

        // Construir el query de UPDATE
        const updateQuery = `UPDATE [Envios Gpos Logs] SET [${column}] = @Value WHERE [PO] = @PO`;

        const request = new Request(updateQuery, (err) => {
            if (err) {
                console.error("Update Failed", err);
                res.status(500).json({ error: "Update Failed", details: err.message });
                connection.close();
                return;
            }

            res.status(200).json({ success: true, message: 'Data updated successfully' });
            connection.close();
        });

        if (column === 'Fecha CMX') {
            request.addParameter('Value', TYPES.DateTime, new Date(value));
        } else {
            request.addParameter('Value', TYPES.Float, parseFloat(value));
        }
        request.addParameter('PO', TYPES.Float, parseFloat(po));

        connection.execSql(request);
    });

    connection.connect();
}
