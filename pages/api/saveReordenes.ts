import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

type UploadRow = {
  folioReorden: string;
  fecha: string;
  empleado: string;
  area: string;
  subArea: string;
  turno: string;
  linea: string;
  defecto: string;
  causa: string;
  numeroParte: string;
  secuencia: string;
  cantidad: number;
  comentarios: string;
  producto: string;
  tipo: string;
};

const updateMesQuery = `
UPDATE [Reordenes]
SET [Mes] = CASE MONTH([Fecha])
  WHEN 1 THEN 'Enero'
  WHEN 2 THEN 'Febrero'
  WHEN 3 THEN 'Marzo'
  WHEN 4 THEN 'Abril'
  WHEN 5 THEN 'Mayo'
  WHEN 6 THEN 'Junio'
  WHEN 7 THEN 'Julio'
  WHEN 8 THEN 'Agosto'
  WHEN 9 THEN 'Septiembre'
  WHEN 10 THEN 'Octubre'
  WHEN 11 THEN 'Noviembre'
  WHEN 12 THEN 'Diciembre'
END
`;

const insertReordenQuery = `
INSERT INTO [Reordenes]
  ([ID], [Folio Reorden], [Empleado], [Area], [SubArea], [Turno], [Linea],
   [Defecto], [Causa], [Numero de Parte], [Secuencia], [Cantidad], [Producto],
   [Comentarios], [Tipo], [Fecha], [Semana], [Año])
VALUES
  (NEWID(), @FolioReorden, @Empleado, @Area, @SubArea, @Turno, @Linea,
   @Defecto, @Causa, @NumParte, @Secuencia, @Cantidad, @Producto,
   @Comentarios, @Tipo, @Fecha, @Semana, @Año)
`;

const buildAggregateQueries = (tableName: string, tipo: string) => {
  const copyQuery = `INSERT INTO [${tableName} - Semanas Anteriores] SELECT * FROM [${tableName}]`;
  const deleteQuery = `DELETE FROM [${tableName}]`;
  const insertQuery = `
    INSERT INTO [${tableName}] ([Fecha], [Mes], [Semana], [Año], [Descripcion Defecto], [Cantidad Defecto])
    SELECT
      MAX([Fecha]) AS [Fecha],
      MAX([Mes]) AS [Mes],
      Semana,
      Año,
      Defecto AS [Descripcion Defecto],
      SUM(ISNULL(TRY_CAST(Cantidad AS FLOAT), 0)) AS [Cantidad Defecto]
    FROM [Reordenes]
    WHERE Tipo = @Tipo
    GROUP BY Semana, Año, Defecto
  `;
  const updatePorcentajeQuery = `
    UPDATE [${tableName}]
    SET Porcentaje = ISNULL(TRY_CAST([Cantidad Defecto] AS FLOAT), 0) / NULLIF((
      SELECT SUM(ISNULL(TRY_CAST([Cantidad Defecto] AS FLOAT), 0))
      FROM [${tableName}]
      WHERE Semana = [${tableName}].Semana
        AND Año = [${tableName}].Año
    ), 0)
  `;
  const updateAcumQuery = `
    WITH RankedData AS (
      SELECT
        [Descripcion Defecto],
        Semana,
        Año,
        ISNULL(TRY_CAST(Porcentaje AS FLOAT), 0) AS Porcentaje,
        ROW_NUMBER() OVER (PARTITION BY Semana, Año ORDER BY Porcentaje DESC) AS RowNum
      FROM [${tableName}]
    ),
    CumulativeCalc AS (
      SELECT
        [Descripcion Defecto],
        Semana,
        Año,
        Porcentaje,
        RowNum,
        CASE
          WHEN RowNum = 1 THEN Porcentaje * 100
          ELSE Porcentaje * 100 + (
            SELECT SUM(Porcentaje * 100)
            FROM RankedData r2
            WHERE r2.Semana = RankedData.Semana
              AND r2.Año = RankedData.Año
              AND r2.RowNum < RankedData.RowNum
          )
        END AS AcumValue
      FROM RankedData
    )
    UPDATE [${tableName}]
    SET Acum = c.AcumValue
    FROM [${tableName}] a
    INNER JOIN CumulativeCalc c
      ON a.[Descripcion Defecto] = c.[Descripcion Defecto]
      AND a.Semana = c.Semana
      AND a.Año = c.Año
  `;

  return { copyQuery, deleteQuery, insertQuery, updatePorcentajeQuery, updateAcumQuery, tipo };
};

const buildCausaRaizQueries = (tableName: string, tipo: string) => {
  const copyQuery = `INSERT INTO [Causa Raiz - ${tableName} - Semanas Anteriores] SELECT * FROM [Causa Raiz - ${tableName}]`;
  const deleteQuery = `DELETE FROM [Causa Raiz - ${tableName}]`;
  const insertQuery = `
    INSERT INTO [Causa Raiz - ${tableName}] ([ID], [Item], [Fecha], [Mes], [Semana], [Año], [Issue], [Root Cause], [Qty])
    SELECT
      NEWID() AS [ID],
      ROW_NUMBER() OVER (ORDER BY [TotalQty] DESC, [Defecto] ASC) AS [Item],
      [Fecha],
      [Mes],
      [Semana],
      [Año],
      [Defecto] AS [Issue],
      STRING_AGG([Causa], ' / ') WITHIN GROUP (ORDER BY [Causa] ASC) AS [Root Cause],
      [TotalQty] AS [Qty]
    FROM (
      SELECT DISTINCT
        [Defecto],
        [Causa],
        [Semana],
        [Año],
        SUM(ISNULL(TRY_CAST([Cantidad] AS FLOAT), 0)) OVER (PARTITION BY [Defecto], [Semana], [Año]) AS [TotalQty],
        MAX([Fecha]) OVER (PARTITION BY [Defecto], [Semana], [Año]) AS [Fecha],
        MAX([Mes]) OVER (PARTITION BY [Defecto], [Semana], [Año]) AS [Mes]
      FROM [Reordenes]
      WHERE [Tipo] = @Tipo
    ) AS DistinctData
    GROUP BY [Defecto], [Semana], [Año], [TotalQty], [Fecha], [Mes]
    ORDER BY [TotalQty] DESC, [Defecto] ASC;
  `;

  return { copyQuery, deleteQuery, insertQuery, tipo };
};

const AGGREGATES = [
  { name: 'Rooftop', tipo: 'Rooftop', historicalName: 'RoofTop' },
  { name: 'AHUS', tipo: 'AHUS', historicalName: 'AHUS' },
  { name: 'CDEF', tipo: 'CDEF', historicalName: 'CDEF' },
  { name: 'Control Box', tipo: 'Control Box', historicalName: 'Control Box' },
  { name: 'CDU', tipo: 'CDU', historicalName: 'CDU' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { rows, semanaNumero } = req.body as { rows?: UploadRow[]; semanaNumero?: string };

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'No hay datos para guardar' });
  }

  if (!semanaNumero || !String(semanaNumero).trim()) {
    return res.status(400).json({ message: 'Semana es requerida' });
  }

  const semana = `Semana ${String(semanaNumero).trim()}`;
  const añoActual = new Date().getFullYear();

  let pool: sql.ConnectionPool | undefined;
  let transaction: sql.Transaction | undefined;

  try {
    pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const txRequest = new sql.Request(transaction);

    await txRequest.query('INSERT INTO [Reordenes Anteriores] SELECT * FROM [Reordenes]');
    await txRequest.query('DELETE FROM [Reordenes]');

    for (const row of rows) {
      const defecto = row.defecto?.toLowerCase() === 'doblado' ? 'Mal Doblado' : row.defecto;
      const fecha = row.fecha ? new Date(row.fecha) : new Date();
      const cantidad = Number.isFinite(Number(row.cantidad)) ? Number(row.cantidad) : 0;
      const empleadoNumero = Number(row.empleado);
      const empleado = Number.isFinite(empleadoNumero) ? empleadoNumero : null;

      const insertRequest = new sql.Request(transaction);
      await insertRequest
        .input('FolioReorden', sql.VarChar, row.folioReorden ?? '')
        .input('Empleado', sql.Float, empleado)
        .input('Area', sql.VarChar, row.area ?? '')
        .input('SubArea', sql.VarChar, row.subArea ?? '')
        .input('Turno', sql.VarChar, row.turno ?? '')
        .input('Linea', sql.VarChar, row.linea ?? '')
        .input('Defecto', sql.VarChar, defecto ?? '')
        .input('Causa', sql.VarChar, row.causa ?? '')
        .input('NumParte', sql.VarChar, row.numeroParte ?? '')
        .input('Secuencia', sql.VarChar, row.secuencia ?? '')
        .input('Cantidad', sql.Float, cantidad)
        .input('Producto', sql.VarChar, row.producto ?? '')
        .input('Comentarios', sql.VarChar, row.comentarios ?? '')
        .input('Tipo', sql.VarChar, row.tipo ?? '')
        .input('Fecha', sql.DateTime, fecha)
        .input('Semana', sql.VarChar, semana)
        .input('Año', sql.Int, añoActual)
        .query(insertReordenQuery);
    }

    await new sql.Request(transaction).query(updateMesQuery);

    for (const item of AGGREGATES) {
      const aggregateQueries = buildAggregateQueries(item.name, item.tipo);
      const causaQueries = buildCausaRaizQueries(item.name, item.tipo);
      const historicalTable = item.historicalName;

      await new sql.Request(transaction).query(
        `INSERT INTO [${historicalTable} - Semanas Anteriores] SELECT * FROM [${item.name}]`
      );
      await new sql.Request(transaction).query(`DELETE FROM [${item.name}]`);

      await new sql.Request(transaction)
        .input('Tipo', sql.VarChar, aggregateQueries.tipo)
        .query(aggregateQueries.insertQuery);
      await new sql.Request(transaction).query(aggregateQueries.updatePorcentajeQuery);
      await new sql.Request(transaction).query(aggregateQueries.updateAcumQuery);

      await new sql.Request(transaction).query(causaQueries.copyQuery);
      await new sql.Request(transaction).query(causaQueries.deleteQuery);
      await new sql.Request(transaction)
        .input('Tipo', sql.VarChar, causaQueries.tipo)
        .query(causaQueries.insertQuery);
    }

    await transaction.commit();

    res.status(200).json({ message: 'Datos guardados correctamente', count: rows.length, semana, año: añoActual });
  } catch (error) {
    console.error('Error al guardar reordenes:', error);
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback:', rollbackError);
      }
    }
    res.status(500).json({ message: 'Error al guardar', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
