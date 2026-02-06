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

const tableMapping: { [key: string]: string } = {
  'AHUS': 'AHUS',
  'Rooftop': 'Rooftop',
  'CDEF': 'CDEF',
  'Control Box': 'Control Box',
  'CDU': 'CDU',
};

const tableMappingHistorical: { [key: string]: string } = {
  'AHUS': 'AHUS - Semanas Anteriores',
  'Rooftop': 'RoofTop - Semanas Anteriores',
  'CDEF': 'CDEF - Semanas Anteriores',
  'Control Box': 'Control Box - Semanas Anteriores',
  'CDU': 'CDU - Semanas Anteriores',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { module, semana, año, useHistorical } = req.query;

  if (!module || !semana || !año) {
    return res.status(400).json({ message: 'Module, semana and año are required' });
  }

  const isHistorical = useHistorical === 'true';
  const mapping = isHistorical ? tableMappingHistorical : tableMapping;
  const tableName = mapping[module as string];

  if (!tableName) {
    return res.status(400).json({ message: 'Invalid module' });
  }

  let pool: sql.ConnectionPool | undefined;
  type ParetoRow = { Defecto: string; Frecuencia: number; Acumulado: number };
  try {
    pool = await sql.connect(config);

    const query = `
      SELECT 
        [Descripcion Defecto] as Defecto,
        [Cantidad Defecto] as Frecuencia,
        [Acum] as Acumulado
      FROM [${tableName}]
      WHERE Semana = @semana AND [Año] = @año
      ORDER BY [Acum] ASC
    `;

    const result = await pool.request()
      .input('semana', sql.VarChar, semana)
      .input('año', sql.VarChar, año)
      .query(query);

    const recordset = result.recordset as ParetoRow[];
    const paretoData = recordset.map((row) => ({
      defecto: row.Defecto,
      frecuencia: row.Frecuencia,
      acumulado: row.Acumulado.toFixed(2),
    }));

    const total = recordset.reduce((sum, row) => sum + row.Frecuencia, 0);

    res.status(200).json({
      data: paretoData,
      total: total,
      module: module,
      semana: semana,
    });
  } catch (error) {
    console.error('Error fetching pareto data:', error);
    res.status(500).json({ message: 'Error fetching data', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
