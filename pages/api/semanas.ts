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

  const { año, tipo } = req.query;

  if (!año) {
    return res.status(400).json({ message: 'Año is required' });
  }

  let pool;
  try {
    pool = await sql.connect(config);
    
    let result;
    if (tipo) {
      result = await pool.query`
        SELECT DISTINCT 
          Semana,
          CAST(REPLACE(Semana, 'Semana ', '') AS INT) as NumeroSemana
        FROM [Reordenes Anteriores] 
        WHERE [Año] = ${año} AND [Tipo] = ${tipo}
        ORDER BY NumeroSemana
      `;
    } else {
      result = await pool.query`
        SELECT DISTINCT 
          Semana,
          CAST(REPLACE(Semana, 'Semana ', '') AS INT) as NumeroSemana
        FROM [Reordenes Anteriores] 
        WHERE [Año] = ${año}
        ORDER BY NumeroSemana
      `;
    }
    
    const semanas = result.recordset.map((row: any) => row.Semana);
    
    res.status(200).json(semanas);
  } catch (error) {
    console.error('Error fetching semanas:', error);
    res.status(500).json({ message: 'Error fetching data' });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
