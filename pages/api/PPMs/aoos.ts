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

  const { tipo } = req.query;

  let pool: sql.ConnectionPool | undefined;
  type AoosRow = { Año: string | number };
  try {
    pool = await sql.connect(config);
    
    let result;
    if (tipo) {
      result = await pool.query`SELECT DISTINCT [Año] FROM [Reordenes Anteriores] WHERE [Tipo] = ${tipo} ORDER BY [Año]`;
    } else {
      result = await pool.query`SELECT DISTINCT [Año] FROM [Reordenes Anteriores] ORDER BY [Año]`;
    }
    
    const recordset = result.recordset as AoosRow[];
    const años = recordset.map((row) => row.Año);
    
    res.status(200).json(años);
  } catch (error) {
    console.error('Error fetching años:', error);
    res.status(500).json({ message: 'Error fetching data' });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
