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
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ message: 'Data array is required' });
  }

  let pool;
  try {
    pool = await sql.connect(config);

    // Actualizar cada registro
    for (const row of data) {
      const escapes = row.Escapes ? parseInt(row.Escapes) : null;
      const embarcado = row.Embarcado ? parseInt(row.Embarcado) : null;

      // Calcular PPMs si ambos valores existen
      let ppms = null;
      if (escapes !== null && embarcado !== null && embarcado > 0) {
        ppms = Math.round((escapes / embarcado) * 1000000);
      }

      await pool.request()
        .input('mes', sql.VarChar, row.Mes)
        .input('año', sql.Int, parseInt(row.Año))
        .input('escapes', sql.Int, escapes)
        .input('embarcado', sql.Int, embarcado)
        .input('ppms', sql.Int, ppms)
        .query`
          UPDATE [Anual] 
          SET [Escapes] = @escapes, [Embarcado] = @embarcado, [PPMs] = @ppms
          WHERE [Mes] = @mes AND [Año] = @año
        `;
    }

    // Obtener los datos actualizados
    const año = data[0]?.Año;
    const dataResult = await pool.request()
      .input('año', sql.Int, parseInt(año))
      .query`SELECT * FROM [Anual] WHERE [Año] = @año ORDER BY 
        CASE [Mes]
          WHEN 'Enero' THEN 1
          WHEN 'Febrero' THEN 2
          WHEN 'Marzo' THEN 3
          WHEN 'Abril' THEN 4
          WHEN 'Mayo' THEN 5
          WHEN 'Junio' THEN 6
          WHEN 'Julio' THEN 7
          WHEN 'Agosto' THEN 8
          WHEN 'Septiembre' THEN 9
          WHEN 'Octubre' THEN 10
          WHEN 'Noviembre' THEN 11
          WHEN 'Diciembre' THEN 12
        END`;

    res.status(200).json({
      message: 'Datos actualizados exitosamente',
      data: dataResult.recordset,
    });
  } catch (error) {
    console.error('Error updating anual data:', error);
    res.status(500).json({ message: 'Error updating data', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
