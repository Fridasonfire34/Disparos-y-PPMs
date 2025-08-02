'use client';

import Image from "next/image";
import { useState } from "react";
import styles from "../app/page.module.css";

interface DisparoData {
  Entrega: string;
  "Fecha CMX": string;
  Estatus: string;
  [key: string]: string | number | null;
}

export default function Home() {
  const [showSubButtons, setShowSubButtons] = useState(false);
  const [disparoData, setDisparoData] = useState<DisparoData[]>([]);
  const [apiEndpoint, setApiEndpoint] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string }>({})
  const columnsToHide = ["ID", "Cambios", "Colors", "Tipo", "ID_CONS"];

  const formatEntregaDate = (dateString: string): string => {
    if (!dateString) return 'Fecha no válida';
  
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha no válida';
  
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(date);
  };
  

  const formatFechaCMXDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  const fetchData = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("Response Text:", text);

      const data: DisparoData[] = JSON.parse(text);

      setDisparoData(data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleButtonClick = (endpoint: string) => {
    setShowSubButtons(endpoint === apiEndpoint ? !showSubButtons : true);
    setApiEndpoint(endpoint);

    if (endpoint !== apiEndpoint) {
      fetchData(endpoint);
    }
  };

  const getRowStyle = (status: string, columnName: string): React.CSSProperties => {
    if (status === "LISTO PARA ENVIAR" || status === "RTS") {
      return { backgroundColor: "yellow" };
    } else if (status === "ENVIADO") {
      return { backgroundColor: "green" };
    } else if (status === "Disparo Nuevo") {
      if (columnName === "Linea") {
        return { backgroundColor: "rgb(153,204,255)" };
      } else if (columnName === "Estatus") {
        return { backgroundColor: "rgb(255,204,255)" };
      }
    }
    return {};
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const applyFilters = (data: DisparoData[]) => {
    return data.filter((row) =>
      Object.entries(filters).every(
        ([key, value]) => value === "" || (row[key] && row[key].toString().toLowerCase().includes(value.toLowerCase()))
      )
    );
  };

  const filteredData = applyFilters(disparoData);

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/Descarga');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'disparo_data.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Failed to download file', error);
    }
  };

  return (
    <div
      className={styles.page}
      style={{
        backgroundImage: `url('/images/backgroung-init3.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
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
        <h1 className={styles.title}>Actualización de Disparos</h1>

        <div className={styles.fullWidthContainer}>
          <div className={styles.buttonGroup}>
            <button
              onClick={() => handleButtonClick("/api/MActualizado")}
              style={{
                backgroundColor: apiEndpoint === "/api/MActualizado" ? "lightblue" : "",
              }}
            >
              M Actualizado
            </button>
            <button
              onClick={() => handleButtonClick("/api/MEnviado")}
              style={{
                backgroundColor: apiEndpoint === "/api/MEnviado" ? "lightblue" : "",
              }}
            >
              M Enviados
            </button>
            <button
              onClick={() => handleButtonClick("/api/ViperActualizado")}
              style={{
                backgroundColor: apiEndpoint === "/api/ViperActualizado" ? "lightblue" : "",
              }}
            >
              Viper Actualizado</button>
            <button
              onClick={() => handleButtonClick("/api/ViperEnviado")}
              style={{
                backgroundColor: apiEndpoint === "/api/ViperEnviado" ? "lightblue" : "",
              }}
            >
              Viper Enviado</button>
            <button
              onClick={() => handleButtonClick("/api/BoaActualizado")}
              style={{
                backgroundColor: apiEndpoint === "/api/BoaActualizado" ? "lightblue" : "",
              }}
            >
              Boa Actualizado</button>
            <button
              onClick={() => handleButtonClick("/api/BoaEnviado")}
              style={{
                backgroundColor: apiEndpoint === "/api/BoaEnviado" ? "lightblue" : "",
              }}>Boa Enviado</button>
            <button className={`${styles.button} ${styles.Descargar}`}
              onClick={(handleDownload)}>Descargar</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {showSubButtons && disparoData.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                {Object.keys(disparoData[0]).map((key) =>
                  !columnsToHide.includes(key) ? (
                    <th key={key}>
                      {key}
                      <input
                        type="text"
                        placeholder={`Filtrar ${key}`}
                        value={filters[key] || ""}
                        onChange={(e) => handleFilterChange(key, e.target.value)}
                        className={styles.filterInput}
                      />
                    </th>
                  ) : null
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index}>
                  {Object.entries(row).map(([key, value], idx) =>
                    !columnsToHide.includes(key) ? (
                      <td
                        key={idx}
                        style={getRowStyle(row.Estatus, key)}
                      >
                        {key === "Entrega"
                          ? formatEntregaDate(value as string)
                          : key === "Fecha CMX"
                            ? value === null
                              ? "Revision con planeacion"
                              : formatFechaCMXDate(value as string)
                            : value === null
                              ? ""
                              : key === "Hora de envio"
                                ? formatEntregaDate(value as string)
                                : key === "Orden Produccion" ? (
                                  <a
                                    href={`/sequences?id=${row.ID}`}
                                    style={{ color: 'blue', textDecoration: 'underline' }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {value}
                                  </a>

                                ) : (
                                  value
                                )
                        }
                      </td>
                    ) : null
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
