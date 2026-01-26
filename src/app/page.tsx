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
  const [showDetalles, setShowDetalles] = useState(false);
  const [showEnviosViper, setShowEnviosViper] = useState(false);
  const [showEnviosBoa, setShowEnviosBoa] = useState(false);
  const [showJunta, setShowJunta] = useState(false);
  const [disparoData, setDisparoData] = useState<DisparoData[]>([]);
  const [enviosViperData, setEnviosViperData] = useState<DisparoData[]>([]);
  const [enviosBoaData, setEnviosBoaData] = useState<DisparoData[]>([]);
  const [juntaData, setJuntaData] = useState<DisparoData[]>([]);
  const [editedJuntaData, setEditedJuntaData] = useState<DisparoData[]>([]);
  const [apiEndpoint, setApiEndpoint] = useState<string | null>(null);
  const [isDetallesActive, setIsDetallesActive] = useState(false);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [enviosViperFilters, setEnviosViperFilters] = useState<{ [key: string]: string }>({});
  const [enviosBoaFilters, setEnviosBoaFilters] = useState<{ [key: string]: string }>({});
  const [juntaFilters, setJuntaFilters] = useState<{ [key: string]: string }>({});
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
    setShowDetalles(false);
    setIsDetallesActive(false);

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
  
  const handleDetalles = () => {
    setShowDetalles(!showDetalles);
    setShowSubButtons(false);
    setApiEndpoint(null);
    setIsDetallesActive(!isDetallesActive);
  };

  const handleDetalleButton = async (buttonName: string) => {
    if (buttonName === "Junta 7 am") {
      try {
        const response = await fetch('/api/Junta');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DisparoData[] = await response.json();
        setJuntaData(data);
        setEditedJuntaData(data);
        setShowJunta(true);
        setShowEnviosViper(false);
        setShowEnviosBoa(false);
        setShowSubButtons(false);
      } catch (error) {
        console.error('Failed to fetch Junta', error);
      }
    } else if (buttonName === "Tabla de Envios Viper") {
      try {
        const response = await fetch('/api/EnviosViper');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DisparoData[] = await response.json();
        setEnviosViperData(data);
        setShowEnviosViper(true);
        setShowEnviosBoa(false);
        setShowJunta(false);
        setShowSubButtons(false);
      } catch (error) {
        console.error('Failed to fetch Envios Viper', error);
      }
    } else if (buttonName === "Tabla de Envios BOA") {
      try {
        const response = await fetch('/api/EnviosBoa');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DisparoData[] = await response.json();
        setEnviosBoaData(data);
        setShowEnviosBoa(true);
        setShowEnviosViper(false);
        setShowJunta(false);
        setShowSubButtons(false);
      } catch (error) {
        console.error('Failed to fetch Envios BOA', error);
      }
    } else {
      console.log(`${buttonName} clicked`);
    }
  };

  const handleEnviosViperFilterChange = (key: string, value: string) => {
    setEnviosViperFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const applyEnviosViperFilters = (data: DisparoData[]) => {
    return data.filter((row) =>
      Object.entries(enviosViperFilters).every(
        ([key, value]) => value === "" || (row[key] && row[key].toString().toLowerCase().includes(value.toLowerCase()))
      )
    );
  };

  const filteredEnviosViperData = applyEnviosViperFilters(enviosViperData);

  const handleEnviosBoaFilterChange = (key: string, value: string) => {
    setEnviosBoaFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const applyEnviosBoaFilters = (data: DisparoData[]) => {
    return data.filter((row) =>
      Object.entries(enviosBoaFilters).every(
        ([key, value]) => value === "" || (row[key] && row[key].toString().toLowerCase().includes(value.toLowerCase()))
      )
    );
  };

  const filteredEnviosBoaData = applyEnviosBoaFilters(enviosBoaData);

  const handleJuntaFilterChange = (key: string, value: string) => {
    setJuntaFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const applyJuntaFilters = (data: DisparoData[]) => {
    return data.filter((row) =>
      Object.entries(juntaFilters).every(
        ([key, value]) => value === "" || (row[key] && row[key].toString().toLowerCase().includes(value.toLowerCase()))
      )
    );
  };

  const filteredJuntaData = applyJuntaFilters(juntaData);

  const handleJuntaCellChange = (rowIndex: number, key: string, value: string) => {
    const updatedData = [...editedJuntaData];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [key]: value,
    };
    setEditedJuntaData(updatedData);
  };

  const handleSaveJunta = async () => {
    try {
      const response = await fetch('/api/JuntaUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedJuntaData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('Datos guardados exitosamente');
      setJuntaData(editedJuntaData);
    } catch (error) {
      console.error('Failed to save Junta data', error);
      alert('Error al guardar los datos');
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
            <button className={`${styles.button} ${styles.Detalles}`}
              onClick={handleDetalles}
              style={{
                backgroundColor: isDetallesActive ? "lightgreen" : "",
              }}
            >Detalles Disparo</button>
            <button className={`${styles.button} ${styles.Descargar}`}
              onClick={(handleDownload)}>Descargar</button>
          </div>

          {showDetalles && (
            <>
              <h2 className={styles.detallesTitle}>Detalles de Disparo</h2>
              <div className={styles.detallesButtonContainer}>
                <button 
                  onClick={() => handleDetalleButton("Junta 7 am")}
                  style={{
                    backgroundColor: showJunta ? "#0d6e12" : "#60be57"
                  }}
                >
                  Junta 7 am
                </button>
                <button 
                  onClick={() => handleDetalleButton("Tabla de Envios Viper")}
                  style={{
                    backgroundColor: showEnviosViper ? "#0d6e12" : "#60be57"
                  }}
                >
                  Tabla de Envios Viper
                </button>
                <button onClick={() => handleDetalleButton("Tabla de Envios BOA")}
                  style={{
                    backgroundColor: showEnviosBoa ? "#0d6e12" : "#60be57"
                  }}
                >
                  Tabla de Envios BOA
                </button>
              </div>
            </>
          )}
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

        {showEnviosViper && enviosViperData.length > 0 && (
          <>
            <h2 className={styles.tableTitle}>Envios Viper</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  {Object.keys(enviosViperData[0]).map((key) =>
                    !columnsToHide.includes(key) ? (
                      <th key={key}>
                        {key}
                        <input
                          type="text"
                          placeholder={`Filtrar ${key}`}
                          value={enviosViperFilters[key] || ""}
                          onChange={(e) => handleEnviosViperFilterChange(key, e.target.value)}
                          className={styles.filterInput}
                        />
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEnviosViperData.map((row, index) => (
                  <tr key={index}>
                    {Object.entries(row).map(([key, value], idx) =>
                      !columnsToHide.includes(key) ? (
                        <td
                          key={idx}
                          style={getRowStyle(row.Estatus, key)}
                        >
                          {key === "Fecha Entrega"
                            ? formatEntregaDate(value as string)
                            : key === "Entrega"
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
          </>
        )}

        {showEnviosBoa && enviosBoaData.length > 0 && (
          <>
            <h2 className={styles.tableTitle}>Envios BOA</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  {Object.keys(enviosBoaData[0]).map((key) =>
                    !columnsToHide.includes(key) ? (
                      <th key={key}>
                        {key}
                        <input
                          type="text"
                          placeholder={`Filtrar ${key}`}
                          value={enviosBoaFilters[key] || ""}
                          onChange={(e) => handleEnviosBoaFilterChange(key, e.target.value)}
                          className={styles.filterInput}
                        />
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEnviosBoaData.map((row, index) => (
                  <tr key={index}>
                    {Object.entries(row).map(([key, value], idx) =>
                      !columnsToHide.includes(key) ? (
                        <td
                          key={idx}
                          style={getRowStyle(row.Estatus, key)}
                        >
                          {key === "Fecha Entrega"
                            ? formatEntregaDate(value as string)
                            : key === "Entrega"
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
          </>
        )}

        {showJunta && juntaData.length > 0 && (
          <>
            <h2 className={styles.tableTitle}>Junta 7 AM</h2>
            <table className={styles.table}>
              <thead>
                {/* First header row with Traveler groups */}
                <tr>
                  {Object.keys(juntaData[0]).map((key) => {
                    if (key === "Secuencia") {
                      return (
                        <th key={key} rowSpan={2}>
                          {key}
                          <input
                            type="text"
                            placeholder={`Filtrar ${key}`}
                            value={juntaFilters[key] || ""}
                            onChange={(e) => handleJuntaFilterChange(key, e.target.value)}
                            className={styles.filterInput}
                          />
                        </th>
                      );
                    }
                    if (key === "ETA Coil") {
                      return (
                        <th key="traveler-coil" colSpan={3} style={{ textAlign: 'center', backgroundColor: 'pink' }}>
                          TRAVELER COIL
                        </th>
                      );
                    }
                    if (key === "ETA Linea") {
                      return (
                        <th key="traveler-linea" colSpan={3} style={{ textAlign: 'center', backgroundColor: 'yellow' }}>
                          TRAVELER LINEA
                        </th>
                      );
                    }
                    if (key === "ETA SUBA-ESTACION 01") {
                      return (
                        <th key="traveler-suba" colSpan={3} style={{ textAlign: 'center', backgroundColor: 'lightblue' }}>
                          TRAVELER SUBA-ESTACION 01
                        </th>
                      );
                    }
                    return null;
                  })}
                </tr>
                {/* Second header row with individual columns */}
                <tr>
                  {Object.keys(juntaData[0]).map((key) => {
                    if (!columnsToHide.includes(key) && key !== "Secuencia") {
                      let displayName = key;
                      if (key === "ETA Coil") {
                        displayName = "ETA";
                      } else if (key === "Status Coil") {
                        displayName = "Status";
                      } else if (key === "Fecha Embarque Coil") {
                        displayName = "Fecha Embarque";
                      } else if (key === "ETA Linea") {
                        displayName = "ETA";
                      } else if (key === "Status Linea") {
                        displayName = "Status";
                      } else if (key === "Fecha Embarque Linea") {
                        displayName = "Fecha Embarque";
                      } else if (key === "ETA SUBA-ESTACION 01") {
                        displayName = "ETA";
                      } else if (key === "Status SUBA-ESTACION 01") {
                        displayName = "Status";
                      } else if (key === "Fecha Embarque SUBA-ESTACION 01") {
                        displayName = "Fecha Embarque";
                      }

                      const isFechaEmbarque = key === "Fecha Embarque Coil" || 
                                               key === "Fecha Embarque Linea" || 
                                               key === "Fecha Embarque SUBA-ESTACION 01";

                      return (
                        <th key={key}>
                          {displayName}
                          {!isFechaEmbarque && (
                            <input
                              type="text"
                              placeholder={`Filtrar ${displayName}`}
                              value={juntaFilters[key] || ""}
                              onChange={(e) => handleJuntaFilterChange(key, e.target.value)}
                              className={styles.filterInput}
                            />
                          )}
                        </th>
                      );
                    }
                    return null;
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredJuntaData.map((row, index) => {
                  const originalIndex = juntaData.findIndex(r => r.ID === row.ID);
                  
                  const isCoilEnviado = row["Fecha Embarque Coil"] === "ENVIADO";
                  const isLineaEnviado = row["Fecha Embarque Linea"] === "ENVIADO";
                  const isSubaEnviado = row["Fecha Embarque SUBA-ESTACION 01"] === "ENVIADO";
                  
                  const allFechasEnviado = isCoilEnviado && isLineaEnviado && isSubaEnviado;
                  
                  return (
                    <tr key={index}>
                      {Object.entries(row).map(([key, value], idx) => {
                        if (columnsToHide.includes(key)) return null;
                        
                        const isNonEditable = 
                          key === "Secuencia" || 
                          key === "Fecha Embarque Coil" || 
                          key === "Fecha Embarque Linea" || 
                          key === "Fecha Embarque SUBA-ESTACION 01" ||
                          (isCoilEnviado && (key === "ETA Coil" || key === "Status Coil")) ||
                          (isLineaEnviado && (key === "ETA Linea" || key === "Status Linea")) ||
                          (isSubaEnviado && (key === "ETA SUBA-ESTACION 01" || key === "Status SUBA-ESTACION 01"));
                        
                        const isFechaEmbarqueEnviado = 
                          (key === "Fecha Embarque Coil" || 
                           key === "Fecha Embarque Linea" || 
                           key === "Fecha Embarque SUBA-ESTACION 01") && 
                          value === "ENVIADO";
                        
                        const isETAorStatusWithEnviado = 
                          (isCoilEnviado && (key === "ETA Coil" || key === "Status Coil")) ||
                          (isLineaEnviado && (key === "ETA Linea" || key === "Status Linea")) ||
                          (isSubaEnviado && (key === "ETA SUBA-ESTACION 01" || key === "Status SUBA-ESTACION 01"));
                        
                        let cellStyle = getRowStyle(row.Estatus, key);
                        
                        if (allFechasEnviado) {
                          cellStyle = { backgroundColor: "green" };
                        } else if (isFechaEmbarqueEnviado) {
                          cellStyle = { backgroundColor: "green" };
                        } else if (isETAorStatusWithEnviado) {
                          cellStyle = { backgroundColor: "green" };
                        }
                        
                        return (
                          <td
                            key={idx}
                            style={cellStyle}
                          >
                            {isNonEditable ? (
                              <span style={key === "Secuencia" ? { fontSize: '18px', fontWeight: 'bold' } : {}}>
                                {value}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={editedJuntaData[originalIndex]?.[key] || ""}
                                onChange={(e) => handleJuntaCellChange(originalIndex, key, e.target.value)}
                                style={{ width: '100%', padding: '4px' }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                onClick={handleSaveJunta}
                style={{
                  padding: '10px 30px',
                  fontSize: '16px',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Guardar
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
