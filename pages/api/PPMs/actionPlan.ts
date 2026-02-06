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
  'AHUS': 'Causa Raiz - AHUS',
  'Rooftop': 'Causa Raiz - Rooftop',
  'CDEF': 'Causa Raiz - CDEF',
  'Control Box': 'Causa Raiz - Control Box',
  'CDU': 'Causa Raiz - CDU',
};

const tableMappingHistorical: { [key: string]: string } = {
  'AHUS': 'Causa Raiz - AHUS - Semanas Anteriores',
  'Rooftop': 'Causa Raiz - RoofTop - Semanas Anteriores',
  'CDEF': 'Causa Raiz - CDEF - Semanas Anteriores',
  'Control Box': 'Causa Raiz - Control Box - Semanas Anteriores',
  'CDU': 'Causa Raiz - CDU - Semanas Anteriores',
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

  let pool;
  try {
    pool = await sql.connect(config);

    const query = `
      SELECT 
        [ID],
        [Item],
        [Issue],
        [Root Cause],
        [Actions],
        [Responsible],
        [Due Date],
        [Status]
      FROM [${tableName}]
      WHERE Semana = @semana AND [Año] = @año
      ORDER BY [Item]
    `;

    const result = await pool.request()
      .input('semana', sql.VarChar, semana)
      .input('año', sql.Int, parseInt(año as string))
      .query(query);

    res.status(200).json({ data: result.recordset });
  } catch (error) {
    console.error('Error fetching action plan data:', error);
    res.status(500).json({ message: 'Error fetching data', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
