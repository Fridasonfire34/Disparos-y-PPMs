'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import Image from 'next/image';

interface Secuencia {
  Tipo: string;
  "Orden de Produccion": string;
  Secuencia: string;
  "Numero de Parte": string;
  "Cantidad Requerida": number;
}

export default function SequencesClient() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Secuencia[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = searchParams?.get("id");

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);

      fetch(`/api/Disparo/${id}`)
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              setError("No hay resultados para ese ID.");
            } else {
              setError(`Error al obtener los datos: ${response.statusText}`);
            }
            setLoading(false);
            return null;
          }
          return response.json();
        })
        .then((data) => {
          if (data && data.length === 0) {
            setError("No hay resultados para ese ID.");
          } else {
            setData(data);
            setError(null);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setError(`Error al obtener los datos: ${error.message}`);
          setLoading(false);
        });
    } else {
      setError("ID no proporcionado.");
      setLoading(false);
    }
  }, [id]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image
            className={styles.logo}
            src="/images/tmplogo2.png"
            alt="TM Logo"
            width={200}
            height={100}
            priority
          />
        </div>
      </header>

      <h1 className={styles.title}>
        {data ? `Detalles de secuencia: ${data[0]?.["Orden de Produccion"]}` : "Cargando detalles de secuencia..."}
      </h1>

      <div>
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {data && !loading && !error && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Linea</th>
                  <th>Orden de Producción</th>
                  <th>Secuencia</th>
                  <th>Numero de Parte</th>
                  <th>Cantidad Requerida</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{item.Tipo}</td>
                    <td>{item["Orden de Produccion"]}</td>
                    <td>{item.Secuencia}</td>
                    <td>{item["Numero de Parte"]}</td>
                    <td>{item["Cantidad Requerida"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
