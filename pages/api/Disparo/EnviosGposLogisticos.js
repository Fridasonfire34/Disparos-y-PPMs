// pages/api/Disparo/EnviosGposLogisticos.js

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

        // Ejecutar el SQL de sincronizacion (insertar nuevos PO y actualizar estatus/linea)
        const sqlQuery = `SET NOCOUNT ON;

DECLARE @LineaActual NVARCHAR(50), @PO_Float FLOAT, @EstatusDisparo NVARCHAR(50);
DECLARE @FechaLimite DATETIME = DATEADD(DAY, -5, CAST(GETDATE() AS DATE));

DECLARE cursor_disparos CURSOR FOR 
SELECT 
    [Orden Produccion], 
    LTRIM(RTRIM([Linea])),
    LTRIM(RTRIM([Estatus]))
FROM [DISPARO]
WHERE [Tipo] = 'Viper' 
  AND [Orden Produccion] IN (
      SELECT DISTINCT [Orden Produccion] 
      FROM [DISPARO] 
      WHERE [Entrega] >= @FechaLimite 
        AND [Tipo] = 'Viper'
  )
  AND [Orden Produccion] IS NOT NULL
GROUP BY [Orden Produccion], [Linea], [Estatus], [Entrega]
ORDER BY [Entrega] ASC;

OPEN cursor_disparos;
FETCH NEXT FROM cursor_disparos INTO @PO_Float, @LineaActual, @EstatusDisparo;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [Envios Gpos Logs] WHERE [PO] = @PO_Float)
    BEGIN
        INSERT INTO [Envios Gpos Logs] ([PO]) VALUES (@PO_Float);
    END

    DECLARE @ValorAMarcar NVARCHAR(20) = CASE WHEN @EstatusDisparo = 'ENVIADO' THEN 'OK' ELSE 'PENDIENTE' END;

    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'UPDATE [Envios Gpos Logs] SET ' + QUOTENAME(@LineaActual) + ' = @Valor ' +
               'WHERE [PO] = @PO_param';

    BEGIN TRY
        EXEC sp_executesql @sql, 
             N'@Valor NVARCHAR(20), @PO_param FLOAT', 
             @Valor = @ValorAMarcar, @PO_param = @PO_Float;
    END TRY
    BEGIN CATCH
    END CATCH

    FETCH NEXT FROM cursor_disparos INTO @PO_Float, @LineaActual, @EstatusDisparo;
END

CLOSE cursor_disparos;
DEALLOCATE cursor_disparos;

DECLARE @SqlNA NVARCHAR(MAX) = '';
SELECT @SqlNA = @SqlNA + 'UPDATE [Envios Gpos Logs] SET ' + QUOTENAME(c.name) + ' = ''NA'' WHERE ' + QUOTENAME(c.name) + ' IS NULL;'
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('[Envios Gpos Logs]') 
  AND t.name IN ('nvarchar', 'varchar') 
  AND c.name NOT IN ('Orden', 'PO', 'Qty'); 

IF @SqlNA <> '' EXEC sp_executesql @SqlNA;`;

        const sqlRequest = new Request(sqlQuery, (err) => {
            if (err) {
                console.error("SQL Execution Failed", err);
                res.status(500).json({ error: "SQL Execution Failed", details: err.message });
                connection.close();
                return;
            }

            // Despues de ejecutar el SQL, hacer SELECT para obtener los datos
            const selectQuery = `
                SELECT [Orden], [Fecha CMX], [PO], [Qty], [JBCB1], [JBRC8], [JPAG6], [JPAG8], [JPAM5], [JPIM2], [JCHC1], [JBRC2], [JPEG2], [JCRC1], [JPAG7], [JCRG5], [JCRM3], [JBRM6], [JBRM7], [JCRC3], [JSEM2], [JSUM1], [JSUM2], [JBRG1], [JBTC1], [JDPC1], [JPAM6], [JSMM8], [JTFM1], [JRTM2], [JBRM2], [JBRM4], [JBRM8], [JBRM9]
                FROM [Envios Gpos Logs]
            `;

            const selectRequest = new Request(selectQuery, (err, rowCount, rows) => {
                if (err) {
                    console.error("Select Request Failed", err);
                    res.status(500).json({ error: "Select Request Failed", details: err.message });
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

            connection.execSql(selectRequest);
        });

        connection.execSql(sqlRequest);
    });

    connection.connect();
}
