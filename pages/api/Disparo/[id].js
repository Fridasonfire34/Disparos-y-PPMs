import { Connection, Request, TYPES } from "tedious"; // Importa correctamente desde 'tedious'

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
    const { id } = req.query; // Obtiene el ID de la URL

    const connection = new Connection(config);

    connection.on("connect", (err) => {
        if (err) {
            console.error("Connection Failed", err);
            res.status(500).json({ error: "Connection Failed", details: err.message });
            return;
        }

        // Consulta SQL ajustada para traer todos los campos
        const query = `
            SELECT 
                Tipo, 
                [Orden de Produccion], 
                Secuencia, 
                [Numero de Parte], 
                [Cantidad Requerida]
            FROM SOL_CONSOLIDADO
            WHERE ID = @id
        `;

        const request = new Request(query, (err, rowCount, rows) => {
            if (err) {
                console.error("Request Failed", err);
                res.status(500).json({ error: "Request Failed", details: err.message });
                connection.close();
                return;
            }

            if (rowCount === 0) {
                res.status(404).json({ error: "No data found" });
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

            res.status(200).json(results); // Devuelve los datos encontrados
            connection.close();
        });

        // Parametrización para evitar inyecciones SQL
        request.addParameter("id", TYPES.NVarChar, id);

        connection.execSql(request);
    });

    connection.connect();
}
