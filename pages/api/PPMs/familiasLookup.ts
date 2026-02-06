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

type LookupResult = {
  producto: string;
  tipo: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { parts } = req.body as { parts?: string[] };

  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ message: 'Parts are required' });
  }

  let pool: sql.ConnectionPool | undefined;
  try {
    pool = await sql.connect(config);

    const results: Record<string, LookupResult> = {};

    for (const numParte of parts) {
      let producto = '';
      let tipo = '';

      const exactQuery = `
        SELECT [Producto], [Tipo]
        FROM [Familias]
        WHERE [Familia] = @Familia
      `;

      const exact = await pool.request()
        .input('Familia', sql.VarChar, numParte)
        .query(exactQuery);

      if (exact.recordset.length > 0) {
        producto = exact.recordset[0]?.Producto ?? '';
        tipo = exact.recordset[0]?.Tipo ?? '';
      } else {
        const prefixQuery = `
          SELECT TOP 1 [Producto], [Tipo], [Familia]
          FROM [Familias]
          WHERE @NumParte LIKE [Familia] + '%'
          ORDER BY LEN([Familia]) DESC
        `;

        const prefix = await pool.request()
          .input('NumParte', sql.VarChar, numParte)
          .query(prefixQuery);

        if (prefix.recordset.length > 0) {
          producto = prefix.recordset[0]?.Producto ?? '';
          tipo = prefix.recordset[0]?.Tipo ?? '';
        }
      }

      results[numParte] = { producto, tipo };
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error('Error fetching familias:', error);
    res.status(500).json({ message: 'Error fetching familias', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
