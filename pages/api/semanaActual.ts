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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let pool;
  try {
    pool = await sql.connect(config);
    
    const result = await pool.query`
      SELECT TOP 1 Semana, [Año]
      FROM [Reordenes]
      ORDER BY [Año] DESC, CAST(REPLACE([Semana], 'Semana ', '') AS INT) DESC
    `;

    const semana = result.recordset[0]?.Semana;
    const año = result.recordset[0]?.Año;
    
    res.status(200).json({ semana, año });
  } catch (error) {
    console.error('Error fetching semana actual:', error);
    res.status(500).json({ message: 'Error fetching data' });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
