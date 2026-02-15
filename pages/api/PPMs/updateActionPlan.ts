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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { module, id, actions } = req.body as {
    module?: string;
    id?: string;
    actions?: Array<{ action?: string; responsible?: string; dueDate?: string; status?: string }>;
  };

  if (!module || !id || !actions || !Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const cleaned = actions.map((entry) => ({
    action: String(entry?.action ?? '').trim(),
    responsible: String(entry?.responsible ?? '').trim(),
    dueDate: String(entry?.dueDate ?? '').trim(),
    status: String(entry?.status ?? '').trim(),
  }));

  const hasInvalid = cleaned.some((entry) =>
    !entry.action || !entry.responsible || !entry.dueDate || !entry.status
  );

  if (hasInvalid) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const tableName = tableMapping[module];

  if (!tableName) {
    return res.status(400).json({ message: 'Invalid module' });
  }

  let pool;
  try {
    pool = await sql.connect(config);

    const serialized = JSON.stringify(cleaned);
    const first = cleaned[0];

    const query = `
      UPDATE [${tableName}]
      SET 
        [Actions] = @actions,
        [Responsible] = @responsible,
        [Due Date] = @dueDate,
        [Status] = @status
      WHERE [ID] = @id
    `;

    await pool.request()
      .input('actions', sql.NVarChar, serialized)
      .input('responsible', sql.NVarChar, first.responsible)
      .input('dueDate', sql.NVarChar, first.dueDate)
      .input('status', sql.NVarChar, first.status)
      .input('id', sql.UniqueIdentifier, id)
      .query(query);

    res.status(200).json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('Error updating action plan:', error);
    res.status(500).json({ message: 'Error updating data', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
