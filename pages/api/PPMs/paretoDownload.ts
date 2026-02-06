import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import * as XLSX from 'xlsx';

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

const columns = [
  'Folio Reorden',
  'Empleado',
  'Area',
  'SubArea',
  'Turno',
  'Linea',
  'Defecto',
  'Causa',
  'Numero de Parte',
  'Secuencia',
  'Cantidad',
  'Producto',
  'Comentarios',
  'Tipo',
  'Fecha',
  'Semana',
  'Mes',
  'Año',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { semana, año, useHistorical, tipo } = req.query;

  if (!semana || !año || !tipo) {
    return res.status(400).json({ message: 'Semana, Año y Tipo son requeridos' });
  }

  const isHistorical = useHistorical === 'true';
  const tableName = isHistorical ? 'Reordenes Anteriores' : 'Reordenes';

  let pool: sql.ConnectionPool | undefined;
  type ReordenRow = Record<string, string | number | null | Date>;
  try {
    pool = await sql.connect(config);

    const query = `
      SELECT
        [Folio Reorden],
        [Empleado],
        [Area],
        [SubArea],
        [Turno],
        [Linea],
        [Defecto],
        [Causa],
        [Numero de Parte],
        [Secuencia],
        [Cantidad],
        [Producto],
        [Comentarios],
        [Tipo],
        [Fecha],
        [Semana],
        [Mes],
        [Año]
      FROM [${tableName}]
      WHERE Semana = @semana AND [Año] = @año AND [Tipo] = @tipo
      ORDER BY [Folio Reorden]
    `;

    const result = await pool.request()
      .input('semana', sql.VarChar, semana)
      .input('año', sql.VarChar, año)
      .input('tipo', sql.VarChar, tipo)
      .query(query);

    const recordset = result.recordset as ReordenRow[];
    const data = recordset.map((row) => ({
      'Folio Reorden': row['Folio Reorden'],
      'Empleado': row['Empleado'],
      'Area': row['Area'],
      'SubArea': row['SubArea'],
      'Turno': row['Turno'],
      'Linea': row['Linea'],
      'Defecto': row['Defecto'],
      'Causa': row['Causa'],
      'Numero de Parte': row['Numero de Parte'],
      'Secuencia': row['Secuencia'],
      'Cantidad': row['Cantidad'],
      'Producto': row['Producto'],
      'Comentarios': row['Comentarios'],
      'Tipo': row['Tipo'],
      'Fecha': row['Fecha'],
      'Semana': row['Semana'],
      'Mes': row['Mes'],
      'Año': row['Año'],
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: columns });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `${tableName} - ${semana} - ${año} - ${tipo}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ message: 'Error generating Excel', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
