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
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { module, id, status } = req.body;

  if (!module || !id || !status) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const tableName = tableMapping[module];

  if (!tableName) {
    return res.status(400).json({ message: 'Invalid module' });
  }

  let pool;
  try {
    pool = await sql.connect(config);

    const query = `
      UPDATE [${tableName}]
      SET [Status] = @status
      WHERE [ID] = @id
    `;

    await pool.request()
      .input('status', sql.NVarChar, status)
      .input('id', sql.UniqueIdentifier, id)
      .query(query);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status' });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
