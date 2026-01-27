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
  const [modifiedRowIds, setModifiedRowIds] = useState<Set<string | number>>(new Set());
  const [modifiedJuntaRowIds, setModifiedJuntaRowIds] = useState<Set<string | number>>(new Set());
  const columnsToHide = ["ID", "Cambios", "Colors", "Tipo", "ID_CONS", "Tipo Viper", "Prioridad"];
  const editableMainEndpoints = ["/api/MActualizado", "/api/ViperActualizado", "/api/BoaActualizado"];

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
    setShowJunta(false);
    setShowEnviosViper(false);
    setShowEnviosBoa(false);

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
        ([key, value]) => {
          if (value === "") return true;
          if (!row[key]) return false;
          
          // Para Entrega, comparar contra el valor formateado visible
          if (key === "Entrega") {
            const formattedDate = formatEntregaDate(row[key] as string);
            return formattedDate.toLowerCase().includes(value.toLowerCase());
          }
          
          // Para otras columnas, comparar normalmente
          return row[key].toString().toLowerCase().includes(value.toLowerCase());
        }
      )
    );
  };

  const handleMainCellChange = (
    rowKey: { id?: string | number; index: number },
    key: string,
    value: string
  ) => {
    setDisparoData((prev) =>
      prev.map((r, idx) => {
        const match = rowKey.id !== undefined ? r.ID === rowKey.id : idx === rowKey.index;
        if (match) {
          const rowId = r.ID || idx;
          setModifiedRowIds((prevIds) => new Set(prevIds).add(rowId));
        }
        return match ? { ...r, [key]: value } : r;
      })
    );
  };

  const filteredData = applyFilters(disparoData);

  const reorderColumns = (keys: string[], hidden: string[] = columnsToHide): string[] => {
    const priorityOrder = [
      "Linea",
      "Entrega", 
      "Secuencia",
      "Qty",
      "Orden Produccion",
      "Paneles",
      "Metalicas", 
      "ETA",
      "Status Viper",
      "Status BOA",
      "Estatus",
      "Comentarios",
      "Fecha CMX",
      "WK",
      "Numero de caja enviada",
      "Hora de envio"
    ];

    const visibleKeys = keys.filter((k) => !hidden.includes(k));
    
    const ordered: string[] = [];
    const remaining: string[] = [];
    
    priorityOrder.forEach(col => {
      if (visibleKeys.includes(col)) {
        ordered.push(col);
      }
    });
    
    visibleKeys.forEach(col => {
      if (!priorityOrder.includes(col)) {
        remaining.push(col);
      }
    });
    
    return [...ordered, ...remaining];
  };

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

  const handleSaveChanges = async () => {
    try {
      const modifiedRows = disparoData.filter((row) => 
        modifiedRowIds.has(row.ID || disparoData.indexOf(row))
      );

      if (modifiedRows.length === 0) {
        alert('No hay cambios para guardar');
        return;
      }

      const response = await fetch('/api/DisparoUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modifiedRows),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Save result:', result);
      alert(`Guardado exitoso: ${result.successCount} registros actualizados`);
      
      setModifiedRowIds(new Set());
    } catch (error) {
      console.error('Failed to save changes', error);
      alert('Error al guardar los datos');
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
        ([key, value]) => {
          if (value === "") return true;
          if (!row[key]) return false;
          
          // Para Fecha Entrega, comparar contra el valor formateado visible
          if (key === "Fecha Entrega") {
            const formattedDate = formatEntregaDate(row[key] as string);
            return formattedDate.toLowerCase().includes(value.toLowerCase());
          }
          
          // Para otras columnas, comparar normalmente
          return row[key].toString().toLowerCase().includes(value.toLowerCase());
        }
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
        ([key, value]) => {
          if (value === "") return true;
          if (!row[key]) return false;
          
          // Para Fecha Entrega, comparar contra el valor formateado visible
          if (key === "Fecha Entrega") {
            const formattedDate = formatEntregaDate(row[key] as string);
            return formattedDate.toLowerCase().includes(value.toLowerCase());
          }
          
          // Para otras columnas, comparar normalmente
          return row[key].toString().toLowerCase().includes(value.toLowerCase());
        }
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
    
    const rowId = updatedData[rowIndex].ID || rowIndex;
    setModifiedJuntaRowIds((prevIds) => new Set(prevIds).add(rowId));
  };

  const handleSaveJunta = async () => {
    try {
      const modifiedRows = editedJuntaData.filter((row, index) => 
        modifiedJuntaRowIds.has(row.ID || index)
      );

      if (modifiedRows.length === 0) {
        alert('No hay cambios para guardar');
        return;
      }

      const response = await fetch('/api/JuntaUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modifiedRows),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('Datos guardados exitosamente');
      setJuntaData(editedJuntaData);
      
      setModifiedJuntaRowIds(new Set());
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
        <h1 className={styles.title}>Actualización de Disparo</h1>

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
              onClick={handleDownload}>Descargar</button>
            {(apiEndpoint === "/api/MActualizado" || 
              apiEndpoint === "/api/ViperActualizado" || 
              apiEndpoint === "/api/BoaActualizado") && (
              <button className={`${styles.button} ${styles.Guardar}`}
              onClick={handleSaveChanges}>Guardar</button>
            )}
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
        {showSubButtons && disparoData.length > 0 && (() => {
          let hiddenMainCols = [...columnsToHide];
          
          if (apiEndpoint === "/api/MActualizado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Status BOA"];
          }
          
          if (apiEndpoint === "/api/MEnviado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Status BOA", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/ViperActualizado") {
            hiddenMainCols = [...hiddenMainCols, "Status BOA", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/ViperEnviado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Status BOA", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/BoaActualizado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/BoaEnviado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Status BOA", "Paneles", "Metalicas", "ETA"];
          }

          return (
          <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {reorderColumns(Object.keys(disparoData[0]), hiddenMainCols).map((key) => {
                  const noFilterColumns = ["Qty", "Paneles", "Metalicas", "ETA", "Comentarios", "Numero de caja enviada", "Status Viper", "Status BOA"];
                  const showFilter = !noFilterColumns.includes(key);
                  const isNarrowMColumn = apiEndpoint === "/api/MActualizado" && (key === "Linea" || key === "Secuencia" || key === "Fecha CMX");
                  const isMediumColumn = key === "Paneles" || key === "Metalicas" || key === "ETA";
                  const isWideColumn = key === "Status Viper" || key === "Status BOA";
                  const isComentariosColumn = key === "Comentarios" && (apiEndpoint === "/api/MEnviado" || apiEndpoint === "/api/BoaEnviado");
                  const isSecuenciaMEnviado = (apiEndpoint === "/api/MEnviado" || apiEndpoint === "/api/ViperEnviado" || apiEndpoint === "/api/BoaEnviado") && key === "Secuencia";
                  const isCajaMEnviado = (apiEndpoint === "/api/MEnviado" || apiEndpoint === "/api/ViperEnviado" || apiEndpoint === "/api/BoaEnviado") && key === "Numero de caja enviada";
                  
                  return (
                    <th key={key} className={isSecuenciaMEnviado ? styles.secuenciaMEnviadoColumn : isCajaMEnviado ? styles.cajaMEnviadoColumn : isNarrowMColumn ? styles.narrowMColumn : isMediumColumn ? styles.mediumColumn : isWideColumn ? styles.wideColumn : isComentariosColumn ? styles.comentariosColumn : ""}>
                      {key === "Numero de caja enviada" ? "Caja" : key === "Orden Produccion" ? "PO" : key === "Hora de envio" ? "Envio" : key}
                      {showFilter && (
                        <input
                          type="text"
                          placeholder={`Filtrar ${key === "Numero de caja enviada" ? "Caja" : key === "Orden Produccion" ? "PO" : key === "Hora de envio" ? "Envio" : key}`}
                          value={filters[key] || ""}
                          onChange={(e) => handleFilterChange(key, e.target.value)}
                          className={styles.filterInput}
                        />
                      )}
                    </th>
                  );
                }
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index}>
                  {reorderColumns(Object.keys(row), hiddenMainCols).map((key) => {
                    const isEditableContext = editableMainEndpoints.includes(apiEndpoint ?? "");
                    const isStatusViperEditable = apiEndpoint === "/api/ViperActualizado" && key === "Status Viper";
                    const isStatusBoaEditable = apiEndpoint === "/api/BoaActualizado" && key === "Status BOA";
                    const isEditableCell = isEditableContext && (key === "Paneles" || key === "Metalicas" || key === "ETA") || isStatusViperEditable || isStatusBoaEditable;

                    const renderValue = () => {
                      if (isEditableCell) {
                        if (key === "Paneles") {
                          const lineaVal = String(row["Linea"] ?? "");
                          const allowed = ["39M", "39M+", "39M++"].includes(lineaVal);
                          if (!allowed) {
                            return "N/A";
                          }
                        }
                        return (
                          <textarea
                            value={(row[key] ?? "") as string}
                            onChange={(e) =>
                              handleMainCellChange({ id: row.ID as string | number | undefined, index }, key, e.target.value)
                            }
                            style={{ width: '101%', padding: '1px', minHeight: '65px', resize: 'vertical', fontFamily: 'Poppins, sans-serif' }}
                          />
                        );
                      }

                      if (key === "Entrega") {
                        return formatEntregaDate(row[key] as string);
                      }

                      if (key === "Fecha CMX") {
                        return row[key] === null ? "Revision con planeacion" : formatFechaCMXDate(row[key] as string);
                      }

                      if (row[key] === null) {
                        return "";
                      }

                      if (key === "Hora de envio") {
                        return formatEntregaDate(row[key] as string);
                      }

                      if (key === "Orden Produccion") {
                        return (
                          <a
                            href={`/sequences?id=${row.ID}`}
                            style={{ color: 'blue', textDecoration: 'underline' }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {row[key] as string}
                          </a>
                        );
                      }

                      return row[key] as string;
                    };

                    const isNarrowMColumn = apiEndpoint === "/api/MActualizado" && (key === "Linea" || key === "Secuencia");
                    const isMediumColumn = key === "Paneles" || key === "Metalicas" || key === "ETA";
                    const isWideColumn = key === "Status Viper" || key === "Status BOA";
                    const isComentariosColumn = key === "Comentarios" && (apiEndpoint === "/api/MEnviado" || apiEndpoint === "/api/BoaEnviado");
                    const isSecuenciaMEnviado = (apiEndpoint === "/api/MEnviado" || apiEndpoint === "/api/ViperEnviado" || apiEndpoint === "/api/BoaEnviado") && key === "Secuencia";
                    const isCajaMEnviado = (apiEndpoint === "/api/MEnviado" || apiEndpoint === "/api/ViperEnviado" || apiEndpoint === "/api/BoaEnviado") && key === "Numero de caja enviada";

                    return (
                      <td
                        key={key}
                        style={getRowStyle(row.Estatus, key)}
                        className={isSecuenciaMEnviado ? styles.secuenciaMEnviadoColumn : isCajaMEnviado ? styles.cajaMEnviadoColumn : isNarrowMColumn ? styles.narrowMColumn : isMediumColumn ? styles.mediumColumn : isWideColumn ? styles.wideColumn : isComentariosColumn ? styles.comentariosColumn : ""}
                      >
                        {renderValue()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          );
        })()}

        {showEnviosViper && enviosViperData.length > 0 && (() => {
          const hiddenEnviosViperCols = [...columnsToHide, "Paneles", "Metalicas", "ETA", "Status Viper", "Status BOA"];
          return (
          <>
            <h2 className={styles.tableTitle}>Envios Viper</h2>
            <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {reorderColumns(Object.keys(enviosViperData[0]), hiddenEnviosViperCols).map((key) =>
                    !hiddenEnviosViperCols.includes(key) ? (
                      <th key={key}>
                        {key === "Numero de caja enviada" ? "Caja" : key}
                        {key === "Fecha Entrega" && (
                          <input
                            type="text"
                            placeholder="Filtrar Fecha Entrega"
                            value={enviosViperFilters[key] || ""}
                            onChange={(e) => handleEnviosViperFilterChange(key, e.target.value)}
                            className={styles.filterInput}
                          />
                        )}
                        {key === "Estacion" && (
                          <input
                            type="text"
                            placeholder="Filtrar Estacion"
                            value={enviosViperFilters[key] || ""}
                            onChange={(e) => handleEnviosViperFilterChange(key, e.target.value)}
                            className={styles.filterInput}
                          />
                        )}
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEnviosViperData.map((row, index) => (
                  <tr key={index}>
                    {reorderColumns(Object.keys(row), hiddenEnviosViperCols).map((key) =>
                      !hiddenEnviosViperCols.includes(key) ? (
                        <td
                          key={key}
                          style={getRowStyle(row.Estatus, key)}
                        >
                          {key === "Fecha Entrega"
                            ? formatEntregaDate(row[key] as string)
                            : key === "Entrega"
                            ? formatEntregaDate(row[key] as string)
                            : key === "Fecha CMX"
                              ? row[key] === null
                                ? "Revision con planeacion"
                                : formatFechaCMXDate(row[key] as string)
                              : row[key] === null
                                ? ""
                                : key === "Hora de envio"
                                  ? formatEntregaDate(row[key] as string)
                                  : key === "Orden Produccion" ? (
                                    <a
                                      href={`/sequences?id=${row.ID}`}
                                      style={{ color: 'blue', textDecoration: 'underline' }}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {row[key] as string}
                                    </a>
                                  ) : (
                                    row[key] as string
                                  )
                          }
                        </td>
                      ) : null
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
          );
        })()}

        {showEnviosBoa && enviosBoaData.length > 0 && (() => {
          const hiddenEnviosBoaCols = [...columnsToHide, "Paneles", "Metalicas", "ETA", "Status Viper", "Status BOA"];
          return (
          <>
            <h2 className={styles.tableTitle}>Envios BOA</h2>
            <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {reorderColumns(Object.keys(enviosBoaData[0]), hiddenEnviosBoaCols).map((key) =>
                    !hiddenEnviosBoaCols.includes(key) ? (
                      <th key={key}>
                        {key === "Numero de caja enviada" ? "Caja" : key}
                        {key === "Fecha Entrega" && (
                          <input
                            type="text"
                            placeholder="Filtrar Fecha Entrega"
                            value={enviosBoaFilters[key] || ""}
                            onChange={(e) => handleEnviosBoaFilterChange(key, e.target.value)}
                            className={styles.filterInput}
                          />
                        )}
                      </th>
                    ) : null
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEnviosBoaData.map((row, index) => (
                  <tr key={index}>
                    {reorderColumns(Object.keys(row), hiddenEnviosBoaCols).map((key) =>
                      !hiddenEnviosBoaCols.includes(key) ? (
                        <td
                          key={key}
                          style={getRowStyle(row.Estatus, key)}
                        >
                          {key === "Fecha Entrega"
                            ? formatEntregaDate(row[key] as string)
                            : key === "Entrega"
                            ? formatEntregaDate(row[key] as string)
                            : key === "Fecha CMX"
                              ? row[key] === null
                                ? "Revision con planeacion"
                                : formatFechaCMXDate(row[key] as string)
                              : row[key] === null
                                ? ""
                                : key === "Hora de envio"
                                  ? formatEntregaDate(row[key] as string)
                                  : key === "Orden Produccion" ? (
                                    <a
                                      href={`/sequences?id=${row.ID}`}
                                      style={{ color: 'blue', textDecoration: 'underline' }}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {row[key] as string}
                                    </a>
                                  ) : (
                                    row[key] as string
                                  )
                          }
                        </td>
                      ) : null
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
          );
        })()}

        {showJunta && juntaData.length > 0 && (
          <>
            <h2 className={styles.tableTitle}>Junta 7 AM</h2>
            <div className={styles.tableContainer}>
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
            </div>
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
