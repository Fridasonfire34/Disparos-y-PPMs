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

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { año } = req.body;

  if (!año) {
    return res.status(400).json({ message: 'Año is required' });
  }

  let pool;
  try {
    pool = await sql.connect(config);

    // Verificar si el año ya existe en la tabla [Anual]
    const checkResult = await pool.request()
      .input('año', sql.Int, parseInt(año))
      .query`SELECT COUNT(*) as count FROM [Anual] WHERE [Año] = @año`;

    const exists = checkResult.recordset[0].count > 0;

    if (!exists) {
      // Insertar 12 registros (uno por cada mes) para el año seleccionado con Target = 400
      for (const mes of meses) {
        await pool.request()
          .input('mes', sql.VarChar, mes)
          .input('año', sql.Int, parseInt(año))
          .input('target', sql.Int, 400)
          .query`INSERT INTO [Anual] ([Mes], [Año], [Target]) VALUES (@mes, @año, @target)`;
      }
    }

    // Obtener todos los datos del año seleccionado
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
      message: exists ? 'Año already exists' : 'Año created successfully',
      data: dataResult.recordset,
      año: año,
    });
  } catch (error) {
    console.error('Error processing anual data:', error);
    res.status(500).json({ message: 'Error processing data', error: String(error) });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
