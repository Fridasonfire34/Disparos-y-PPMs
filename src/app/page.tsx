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
  const [showEnviosGruposLogisticos, setShowEnviosGruposLogisticos] = useState(false);
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
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; key: string } | null>(null);
  const [editingGposCell, setEditingGposCell] = useState<{ rowIndex: number; key: string } | null>(null);
  const [gposEditValues, setGposEditValues] = useState<{ [key: string]: string | number }>({});
  const [modifiedGposRowIds, setModifiedGposRowIds] = useState<Set<string | number>>(new Set());
  const [gposModalOpen, setGposModalOpen] = useState(false);
  const [gposModalData, setGposModalData] = useState<{ key: string; value: string | number | null; po: string | number } | null>(null);
  const columnsToHide = ["ID", "Cambios", "Colors", "Tipo", "ID_CONS", "Tipo Viper", "Prioridad"];
  const editableMainEndpoints = ["/api/Disparo/MActualizado", "/api/Disparo/ViperActualizado", "/api/Disparo/BoaActualizado"];

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

  const getCellStyle = (cellValue: string | number | null | undefined) => {
    let backgroundColor = 'transparent';
    let color = 'inherit';
    if (cellValue) {
      const trimmed = String(cellValue).trim().toUpperCase();
      if (trimmed === 'NA') {
        backgroundColor = '#000000';
        color = '#000000';
      } else if (trimmed === 'OK') {
        backgroundColor = '#90EE90';
      } else if (trimmed === 'PENDIENTE') {
        backgroundColor = '#FFB6C1';
        color = '#FFB6C1';
      }
    }
    return {
      padding: '8px 4px',
      fontSize: '12px',
      height: '30px',
      backgroundColor,
      color
    };
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
    setShowEnviosGruposLogisticos(false);
    setShowEnviosBoa(false);

    if (endpoint !== apiEndpoint) {
      fetchData(endpoint);
    }
  };

  const getRowStyle = (status: string, columnName: string): React.CSSProperties => {
    if (status === "LISTO PARA ENVIAR" || status === "RTS") {
      return { backgroundColor: "#F5F5D1" };
    } else if (status === "ENVIADO") {
      return { backgroundColor: "#119c3b" };
    } else if (status === "Disparo Nuevo") {
      if (columnName === "Linea") {
        return { backgroundColor: "rgb(153,204,255)" };
      } else if (columnName === "Estatus") {
        return { backgroundColor: "rgb(255,204,255)" };
      }
    }
    return {};
  };

  const getEnviosViperRowStyle = (row: DisparoData): React.CSSProperties => {
    // Verificar si las columnas específicas están vacías o son null
    const isEmpty = (value: string | number | null | undefined) => 
      value === null || value === undefined || value === "" || value === "NULL";

    const enProcesoTraspaleo = isEmpty(row["En proceso de Traspaleo"]);
    const enviadoPendiente = isEmpty(row["Enviado Pendiente"]);
    const listoFaltaCarro = isEmpty(row["Listo para enviar - Falta de Carro adecuado"]);
    const listoPorSubir = isEmpty(row["Listo para enviar - Por subir a caja"]);
    const disparoNuevo = isEmpty(row["Disparo Nuevo"]);
    const enviado = !isEmpty(row["Enviado"]);

    // Si todas las columnas especificadas están vacías pero Enviado tiene valor, pintar de verde
    if (enProcesoTraspaleo && enviadoPendiente && listoFaltaCarro && listoPorSubir && disparoNuevo && enviado) {
      return { backgroundColor: "#29b824" };
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
          
          if (key === "Entrega") {
            const formattedDate = formatEntregaDate(row[key] as string);
            return formattedDate.toLowerCase().includes(value.toLowerCase());
          }
          
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
      const response = await fetch('/api/Disparo/Descarga');

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

      const response = await fetch('/api/Disparo/DisparoUpdate', {
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
    const newShowDetalles = !showDetalles;
    setShowDetalles(newShowDetalles);
    setShowSubButtons(false);
    setApiEndpoint(null);
    setIsDetallesActive(newShowDetalles);
    setShowEnviosGruposLogisticos(false);
    
    if (!newShowDetalles) {
      setShowJunta(false);
      setShowEnviosViper(false);
      setShowEnviosBoa(false);
    }
  };

  const handleDetalleButton = async (buttonName: string) => {
    if (buttonName === "Junta 7 am") {
      try {
        const response = await fetch('/api/Disparo/Junta');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DisparoData[] = await response.json();
        setJuntaData(data);
        setEditedJuntaData(data);
        setShowJunta(true);
        setShowEnviosViper(false);
        setShowEnviosGruposLogisticos(false);
        setShowEnviosBoa(false);
        setShowSubButtons(false);
      } catch (error) {
        console.error('Failed to fetch Junta', error);
      }
    } else if (buttonName === "Tabla de Envios Viper") {
      try {
        const response = await fetch('/api/Disparo/EnviosViper');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DisparoData[] = await response.json();
        setEnviosViperData(data);
        setShowEnviosViper(true);
        setShowEnviosGruposLogisticos(false);
        setShowEnviosBoa(false);
        setShowJunta(false);
        setShowSubButtons(false);
      } catch (error) {
        console.error('Failed to fetch Envios Viper', error);
      }
    } else if (buttonName === "Envios de Grupos Logisticos Viper") {
      try {
        const response = await fetch('/api/Disparo/EnviosGposLogisticos');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DisparoData[] = await response.json();
        setEnviosViperData(data);
        setShowEnviosGruposLogisticos(true);
        setShowEnviosViper(false);
        setShowEnviosBoa(false);
        setShowJunta(false);
        setShowSubButtons(false);
      } catch (error) {
        console.error('Failed to fetch Envios de Grupos Logisticos', error);
      }
    } else if (buttonName === "Tabla de Envios BOA") {
      try {
        const response = await fetch('/api/Disparo/EnviosBoa');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DisparoData[] = await response.json();
        setEnviosBoaData(data);
        setShowEnviosBoa(true);
        setShowEnviosViper(false);
        setShowEnviosGruposLogisticos(false);
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
          
          if (key === "Fecha Entrega") {
            const formattedDate = formatEntregaDate(row[key] as string);
            return formattedDate.toLowerCase().includes(value.toLowerCase());
          }
          
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
          
          if (key === "Fecha Entrega") {
            const formattedDate = formatEntregaDate(row[key] as string);
            return formattedDate.toLowerCase().includes(value.toLowerCase());
          }
          
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

      const response = await fetch('/api/Disparo/JuntaUpdate', {
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

  const handleGposCellDoubleClick = (po: string | number, key: string, value: string | number | null) => {
    if (["Orden", "Fecha CMX", "Qty"].includes(key)) {
      setGposModalData({
        key,
        value,
        po,
      });
      setGposEditValues({
        ...gposEditValues,
        [po + '_' + key]: value || '',
      });
      setGposModalOpen(true);
    }
  };

  const handleGposCellChange = (po: string | number, key: string, value: string | number) => {
    setGposEditValues({
      ...gposEditValues,
      [po + '_' + key]: value,
    });
  };

  const handleGposCellSave = async () => {
    if (!gposModalData) return;

    const { key, po } = gposModalData;
    const value = gposEditValues[po + '_' + key];

    if (value === null || value === undefined || value === '') {
      alert('El valor no puede estar vacío');
      return;
    }

    // Validación de tipo
    if (key === "Qty" || key === "Orden") {
      if (isNaN(Number(value))) {
        alert(`${key} debe ser un número`);
        return;
      }
    }

    try {
      // Si estamos editando Orden, verificar y reacomodar duplicados
      if (key === "Orden") {
        const newOrdenValue = Number(value);
        const updatedData = [...enviosViperData];
        const currentRowIndex = updatedData.findIndex((row) => row['PO'] === po);
        
        if (currentRowIndex >= 0) {
          // Encontrar todas las filas que tienen Orden >= al nuevo valor (excluyendo la fila actual)
          const rowsToUpdate: Array<{ po: string | number; newOrden: number }> = [];
          
          updatedData.forEach((row, idx) => {
            if (idx !== currentRowIndex && row['PO'] !== po) {
              const currentOrden = Number(row['Orden']) || 0;
              if (currentOrden >= newOrdenValue) {
                rowsToUpdate.push({
                  po: row['PO'] as string | number,
                  newOrden: currentOrden + 1
                });
              }
            }
          });

          // Actualizar la fila actual
          const response = await fetch('/api/Disparo/UpdateGpos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              po: po,
              column: key,
              value: newOrdenValue,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          updatedData[currentRowIndex] = {
            ...updatedData[currentRowIndex],
            [key]: newOrdenValue,
          };

          // Actualizar todas las filas desplazadas
          for (const item of rowsToUpdate) {
            const updateResponse = await fetch('/api/Disparo/UpdateGpos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                po: item.po,
                column: 'Orden',
                value: item.newOrden,
              }),
            });

            if (updateResponse.ok) {
              const rowIdx = updatedData.findIndex((row) => row['PO'] === item.po);
              if (rowIdx >= 0) {
                updatedData[rowIdx] = {
                  ...updatedData[rowIdx],
                  Orden: item.newOrden,
                };
              }
            }
          }

          setEnviosViperData(updatedData);
          setModifiedGposRowIds((prevIds) => new Set(prevIds).add(po));
        }
      } else {
        // Para otros campos (Qty, Fecha CMX), actualización normal
        const response = await fetch('/api/Disparo/UpdateGpos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            po: po,
            column: key,
            value: value,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Actualizar el estado local
        const updatedData = [...enviosViperData];
        const rowIndex = updatedData.findIndex((row) => row['PO'] === po);
        if (rowIndex >= 0) {
          updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            [key]: key === 'Qty' ? Number(value) : value,
          };
        }
        setEnviosViperData(updatedData);
        setModifiedGposRowIds((prevIds) => new Set(prevIds).add(po));
      }

      setGposModalOpen(false);
      setGposModalData(null);
      setGposEditValues({});
    } catch (error) {
      console.error('Failed to save Gpos data', error);
      alert('Error al guardar los datos');
    }
  };

  const handleGposCellCancel = () => {
    setGposModalOpen(false);
    setGposModalData(null);
    setGposEditValues({});
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
        <button
          className={styles.ppmButton}
          type="button"
          onClick={() => window.open("/ppms", "_blank", "noopener,noreferrer")}
        >
          PPMs Internos
        </button>
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
              onClick={() => handleButtonClick("/api/Disparo/MActualizado")}
              style={{
                backgroundColor: apiEndpoint === "/api/Disparo/MActualizado" ? "lightblue" : "",
              }}
            >
              M Actualizado
            </button>
            <button
              onClick={() => handleButtonClick("/api/Disparo/MEnviado")}
              style={{
                backgroundColor: apiEndpoint === "/api/Disparo/MEnviado" ? "lightblue" : "",
              }}
            >
              M Enviados
            </button>
            <button
              onClick={() => handleButtonClick("/api/Disparo/ViperActualizado")}
              style={{
                backgroundColor: apiEndpoint === "/api/Disparo/ViperActualizado" ? "lightblue" : "",
              }}
            >
              Viper Actualizado</button>
            <button
              onClick={() => handleButtonClick("/api/Disparo/ViperEnviado")}
              style={{
                backgroundColor: apiEndpoint === "/api/Disparo/ViperEnviado" ? "lightblue" : "",
              }}
            >
              Viper Enviado</button>
            <button
              onClick={() => handleButtonClick("/api/Disparo/BoaActualizado")}
              style={{
                backgroundColor: apiEndpoint === "/api/Disparo/BoaActualizado" ? "lightblue" : "",
              }}
            >
              Boa Actualizado</button>
            <button
              onClick={() => handleButtonClick("/api/Disparo/BoaEnviado")}
              style={{
                backgroundColor: apiEndpoint === "/api/Disparo/BoaEnviado" ? "lightblue" : "",
              }}>Boa Enviado</button>
            <button className={`${styles.button} ${styles.Detalles}`}
              onClick={handleDetalles}
              style={{
                backgroundColor: isDetallesActive ? "lightgreen" : "",
              }}
            >Detalles Disparo</button>
            <button className={`${styles.button} ${styles.Descargar}`}
              onClick={handleDownload}>Descargar</button>
            {(apiEndpoint === "/api/Disparo/MActualizado" || 
              apiEndpoint === "/api/Disparo/ViperActualizado" || 
              apiEndpoint === "/api/Disparo/BoaActualizado") && (
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
                  Envios Viper
                </button>
                <button 
                  onClick={() => handleDetalleButton("Envios de Grupos Logisticos Viper")}
                  style={{
                    backgroundColor: showEnviosGruposLogisticos ? "#0d6e12" : "#60be57"
                  }}
                >
                  Envios de Gpos Logisticos Viper
                </button>
                <button onClick={() => handleDetalleButton("Tabla de Envios BOA")}
                  style={{
                    backgroundColor: showEnviosBoa ? "#0d6e12" : "#60be57"
                  }}
                >
                  Envios BOA
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {showSubButtons && disparoData.length > 0 && (() => {
          let hiddenMainCols = [...columnsToHide];
          
          if (apiEndpoint === "/api/Disparo/MActualizado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Status BOA"];
          }
          
          if (apiEndpoint === "/api/Disparo/MEnviado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Status BOA", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/Disparo/ViperActualizado") {
            hiddenMainCols = [...hiddenMainCols, "Status BOA", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/Disparo/ViperEnviado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Status BOA", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/Disparo/BoaActualizado") {
            hiddenMainCols = [...hiddenMainCols, "Status Viper", "Paneles", "Metalicas", "ETA"];
          }
          
          if (apiEndpoint === "/api/Disparo/BoaEnviado") {
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
                  const isNarrowMColumn = apiEndpoint === "/api/Disparo/MActualizado" && (key === "Linea" || key === "Secuencia" || key === "Fecha CMX");
                  const isMediumColumn = key === "Paneles" || key === "Metalicas" || key === "ETA";
                  const isWideColumn = key === "Status Viper" || key === "Status BOA";
                  const isComentariosColumn = key === "Comentarios" && (apiEndpoint === "/api/Disparo/MEnviado" || apiEndpoint === "/api/Disparo/BoaEnviado");
                  const isSecuenciaMEnviado = (apiEndpoint === "/api/Disparo/MEnviado" || apiEndpoint === "/api/Disparo/ViperEnviado" || apiEndpoint === "/api/Disparo/BoaEnviado") && key === "Secuencia";
                  const isCajaMEnviado = (apiEndpoint === "/api/Disparo/MEnviado" || apiEndpoint === "/api/Disparo/ViperEnviado" || apiEndpoint === "/api/Disparo/BoaEnviado") && key === "Numero de caja enviada";
                  
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
                    const isStatusViperEditable = apiEndpoint === "/api/Disparo/ViperActualizado" && key === "Status Viper";
                    const isStatusBoaEditable = apiEndpoint === "/api/Disparo/BoaActualizado" && key === "Status BOA";
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

                    const isNarrowMColumn = apiEndpoint === "/api/Disparo/MActualizado" && (key === "Linea" || key === "Secuencia");
                    const isMediumColumn = key === "Paneles" || key === "Metalicas" || key === "ETA";
                    const isWideColumn = key === "Status Viper" || key === "Status BOA";
                    const isComentariosColumn = key === "Comentarios" && (apiEndpoint === "/api/Disparo/MEnviado" || apiEndpoint === "/api/Disparo/BoaEnviado");
                    const isSecuenciaMEnviado = (apiEndpoint === "/api/Disparo/MEnviado" || apiEndpoint === "/api/Disparo/ViperEnviado" || apiEndpoint === "/api/Disparo/BoaEnviado") && key === "Secuencia";
                    const isCajaMEnviado = (apiEndpoint === "/api/Disparo/MEnviado" || apiEndpoint === "/api/Disparo/ViperEnviado" || apiEndpoint === "/api/Disparo/BoaEnviado") && key === "Numero de caja enviada";

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
                {filteredEnviosViperData.map((row, index) => {
                  const currentFechaEntrega = formatEntregaDate(row["Fecha Entrega"] as string);
                  const previousFechaEntrega = index > 0 ? formatEntregaDate(filteredEnviosViperData[index - 1]["Fecha Entrega"] as string) : null;
                  const isFechaEntregaDuplicate = currentFechaEntrega === previousFechaEntrega;
                  
                  return (
                    <tr key={index}>
                      {reorderColumns(Object.keys(row), hiddenEnviosViperCols).map((key) =>
                        !hiddenEnviosViperCols.includes(key) ? (
                          <td
                            key={key}
                            style={getEnviosViperRowStyle(row)}
                          >
                            {key === "Fecha Entrega"
                              ? isFechaEntregaDuplicate ? "" : currentFechaEntrega
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
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
          );
        })()}

        {showEnviosGruposLogisticos && enviosViperData.length > 0 && (() => {
          return (
          <>
            <h2 className={styles.tableTitle}>Envios de Grupos Logisticos Viper</h2>
            <div className={`${styles.tableContainer} ${styles.gposTableContainer}`}>
            <table className={`${styles.table} ${styles.gposTable}`}>
              <thead>
                {/* Fila 1 de headers */}
                <tr style={{ height: '30px' }}>
                  <th rowSpan={3} style={{ padding: '4px 2px', width: '80px' }}>Orden</th>
                  <th rowSpan={3} style={{ padding: '4px 2px', width: '100px' }}>Fecha CMX</th>
                  <th rowSpan={3} style={{ padding: '4px 2px', width: '100px' }}>PO</th>
                  <th rowSpan={3} style={{ padding: '4px 2px', width: '40px' }}>Qty</th>
                  <th colSpan={2} rowSpan={2} style={{ textAlign: 'center', backgroundColor: '#ADD8E6', padding: '4px 2px' }}>Coil</th>
                  <th colSpan={4} rowSpan={2} style={{ textAlign: 'center', backgroundColor: '#D3D3D3', padding: '4px 2px' }}>PRESS SHOP</th>
                  <th colSpan={5} style={{ textAlign: 'center', backgroundColor: '#FFB6C1', padding: '6px 2px', height: '30px', verticalAlign: 'middle' }}>SUB-ASSY</th>
                  <th colSpan={2} rowSpan={2} style={{ textAlign: 'center', backgroundColor: '#FFFF99', padding: '4px 2px' }}>LRTN WS00</th>
                  <th colSpan={6} rowSpan={2} style={{ textAlign: 'center', backgroundColor: '#87CEEB', padding: '4px 2px' }}>LRTN WS01</th>
                  <th colSpan={6} rowSpan={2} style={{ textAlign: 'center', backgroundColor: '#FFE4B5', padding: '4px 2px' }}>LRTN WS03</th>
                  <th rowSpan={2} style={{ padding: '4px 2px', width: '70px', backgroundColor: '#7ddb99', textAlign: 'center' }}>LRTN WS04</th>
                  <th colSpan={4} rowSpan={2} style={{ textAlign: 'center', backgroundColor: '#fd88ea', padding: '4px 2px' }}>MULTILINEA</th>
                </tr>
                {/* Fila 2 de SUB-ASSY */}
                <tr style={{ height: '30px' }}>
                  <th style={{ backgroundColor: '#FFB6C1', padding: '6px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '12px' }}>WS02</th>
                  <th style={{ backgroundColor: '#FFB6C1', padding: '6px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '12px' }}>WS03</th>
                  <th style={{ backgroundColor: '#FFB6C1', padding: '6px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '12px' }}>WS06</th>
                  <th colSpan={2} style={{ backgroundColor: '#FFB6C1', padding: '6px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '12px' }}>WS07</th>
                </tr>
                {/* Fila 3 de headers */}
                <tr style={{ height: '30px' }}>
                  {/* Coil */}
                  <th style={{ backgroundColor: '#ADD8E6', padding: '4px 2px', width: '90px' }}>JBCB1</th>
                  <th style={{ backgroundColor: '#ADD8E6', padding: '4px 2px', width: '90px' }}>JBRC8</th>
                  {/* PRESS SHOP */}
                  <th style={{ backgroundColor: '#D3D3D3', padding: '4px 2px', width: '90px' }}>JPAC6</th>
                  <th style={{ backgroundColor: '#D3D3D3', padding: '4px 2px', width: '90px' }}>JPAG8</th>
                  <th style={{ backgroundColor: '#D3D3D3', padding: '4px 2px', width: '90px' }}>JPAM5</th>
                  <th style={{ backgroundColor: '#D3D3D3', padding: '4px 2px', width: '90px' }}>JPIM2</th>
                  {/* SUB-ASSY fila 3 */}
                  <th style={{ backgroundColor: '#FFB6C1', padding: '4px 2px', width: '90px' }}>JCHC1</th>
                  <th style={{ backgroundColor: '#FFB6C1', padding: '4px 2px', width: '90px' }}>JBRC2</th>
                  <th style={{ backgroundColor: '#FFB6C1', padding: '4px 2px', width: '90px' }}>JPEG2</th>
                  <th style={{ backgroundColor: '#FFB6C1', padding: '4px 2px', width: '90px' }}>JCRC1</th>
                  <th style={{ backgroundColor: '#FFB6C1', padding: '4px 2px', width: '90px' }}>JPAG7</th>
                  {/* LRTN WS00 */}
                  <th style={{ backgroundColor: '#FFFF99', padding: '4px 2px', width: '90px' }}>JCRG5</th>
                  <th style={{ backgroundColor: '#FFFF99', padding: '4px 2px', width: '90px' }}>JCRM3</th>
                  {/* LRTN WS01 */}
                  <th style={{ backgroundColor: '#87CEEB', padding: '4px 2px', width: '90px' }}>JBRM6</th>
                  <th style={{ backgroundColor: '#87CEEB', padding: '4px 2px', width: '90px' }}>JBRM7</th>
                  <th style={{ backgroundColor: '#87CEEB', padding: '4px 2px', width: '90px' }}>JCRC3</th>
                  <th style={{ backgroundColor: '#87CEEB', padding: '4px 2px', width: '90px' }}>JSEM2</th>
                  <th style={{ backgroundColor: '#87CEEB', padding: '4px 2px', width: '90px' }}>JSUM1</th>
                  <th style={{ backgroundColor: '#87CEEB', padding: '4px 2px', width: '90px' }}>JSUM2</th>
                  {/* LRTN WS03 */}
                  <th style={{ backgroundColor: '#FFE4B5', padding: '4px 2px', width: '90px' }}>JBRG1</th>
                  <th style={{ backgroundColor: '#FFE4B5', padding: '4px 2px', width: '90px' }}>JBTC1</th>
                  <th style={{ backgroundColor: '#FFE4B5', padding: '4px 2px', width: '90px' }}>JDPC1</th>
                  <th style={{ backgroundColor: '#FFE4B5', padding: '4px 2px', width: '90px' }}>JPAM6</th>
                  <th style={{ backgroundColor: '#FFE4B5', padding: '4px 2px', width: '90px' }}>JSMM8</th>
                  <th style={{ backgroundColor: '#FFE4B5', padding: '4px 2px', width: '90px' }}>JTFM1</th>
                  {/* LRTN WS04 */}
                  <th style={{ backgroundColor: '#7ddb99', padding: '4px 2px', width: '90px' }}>JRTM2</th>
                  {/* MULTILINEA */}
                  <th style={{ backgroundColor: '#fd88ea', padding: '4px 2px', width: '90px' }}>JBRM2</th>
                  <th style={{ backgroundColor: '#fd88ea', padding: '4px 2px', width: '90px' }}>JBRM4</th>
                  <th style={{ backgroundColor: '#fd88ea', padding: '4px 2px', width: '90px' }}>JBRM8</th>
                  <th style={{ backgroundColor: '#fd88ea', padding: '4px 2px', width: '90px' }}>JBRM9</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sortedGposData = [...enviosViperData].sort((a, b) => {
                    const ordenA = Number(a['Orden']) || 999999;
                    const ordenB = Number(b['Orden']) || 999999;
                    return ordenA - ordenB;
                  });
                  return sortedGposData.map((row, index) => (
                    <tr key={index} style={{ height: '30px' }}>
                      {/* Orden - editable */}
                      <td 
                        style={getCellStyle(row["Orden"])}
                        onDoubleClick={() => handleGposCellDoubleClick(row["PO"] as string | number, "Orden", row["Orden"])}
                        title="Doble clic para editar"
                      >
                        {row["Orden"] || ""}
                      </td>

                      {/* Fecha CMX - editable */}
                      <td 
                        style={getCellStyle(row["Fecha CMX"])}
                        onDoubleClick={() => handleGposCellDoubleClick(row["PO"] as string | number, "Fecha CMX", row["Fecha CMX"])}
                        title="Doble clic para editar"
                      >
                        {row["Fecha CMX"] ? formatFechaCMXDate(row["Fecha CMX"] as string) : ""}
                      </td>

                      {/* PO - read only */}
                      <td style={getCellStyle(row["PO"])}>{row["PO"] || ""}</td>

                      {/* Qty - editable */}
                      <td 
                        style={getCellStyle(row["Qty"])}
                        onDoubleClick={() => handleGposCellDoubleClick(row["PO"] as string | number, "Qty", row["Qty"])}
                        title="Doble clic para editar"
                      >
                        {row["Qty"] || ""}
                      </td>
                      {/* Coil columns */}
                      <td style={getCellStyle(row["JBCB1"])}>{row["JBCB1"] || ""}</td>
                      <td style={getCellStyle(row["JBRC8"])}>{row["JBRC8"] || ""}</td>
                      {/* PRESS SHOP columns */}
                      <td style={getCellStyle(row["JPAG6"])}>{row["JPAG6"] || ""}</td>
                      <td style={getCellStyle(row["JPAG8"])}>{row["JPAG8"] || ""}</td>
                      <td style={getCellStyle(row["JPAM5"])}>{row["JPAM5"] || ""}</td>
                      <td style={getCellStyle(row["JPIM2"])}>{row["JPIM2"] || ""}</td>
                      {/* SUB-ASSY columns */}
                      <td style={getCellStyle(row["JCHC1"])}>{row["JCHC1"] || ""}</td>
                      <td style={getCellStyle(row["JBRC2"])}>{row["JBRC2"] || ""}</td>
                      <td style={getCellStyle(row["JPEG2"])}>{row["JPEG2"] || ""}</td>
                      <td style={getCellStyle(row["JCRC1"])}>{row["JCRC1"] || ""}</td>
                      <td style={getCellStyle(row["JPAG7"])}>{row["JPAG7"] || ""}</td>
                      {/* LRTN WS00 columns */}
                      <td style={getCellStyle(row["JCRG5"])}>{row["JCRG5"] || ""}</td>
                      <td style={getCellStyle(row["JCRM3"])}>{row["JCRM3"] || ""}</td>
                      {/* LRTN WS01 columns */}
                      <td style={getCellStyle(row["JBRM6"])}>{row["JBRM6"] || ""}</td>
                      <td style={getCellStyle(row["JBRM7"])}>{row["JBRM7"] || ""}</td>
                      <td style={getCellStyle(row["JCRC3"])}>{row["JCRC3"] || ""}</td>
                      <td style={getCellStyle(row["JSEM2"])}>{row["JSEM2"] || ""}</td>
                      <td style={getCellStyle(row["JSUM1"])}>{row["JSUM1"] || ""}</td>
                      <td style={getCellStyle(row["JSUM2"])}>{row["JSUM2"] || ""}</td>
                      {/* LRTN WS03 columns */}
                      <td style={getCellStyle(row["JBRG1"])}>{row["JBRG1"] || ""}</td>
                      <td style={getCellStyle(row["JBTC1"])}>{row["JBTC1"] || ""}</td>
                      <td style={getCellStyle(row["JDPC1"])}>{row["JDPC1"] || ""}</td>
                      <td style={getCellStyle(row["JPAM6"])}>{row["JPAM6"] || ""}</td>
                      <td style={getCellStyle(row["JSMM8"])}>{row["JSMM8"] || ""}</td>
                      <td style={getCellStyle(row["JTFM1"])}>{row["JTFM1"] || ""}</td>
                      {/* LRTN WS04 */}
                      <td style={getCellStyle(row["JRTM2"])}>{row["JRTM2"] || ""}</td>
                      {/* MULTILINEA columns */}
                      <td style={getCellStyle(row["JBRM2"])}>{row["JBRM2"] || ""}</td>
                      <td style={getCellStyle(row["JBRM4"])}>{row["JBRM4"] || ""}</td>
                      <td style={getCellStyle(row["JBRM8"])}>{row["JBRM8"] || ""}</td>
                      <td style={getCellStyle(row["JBRM9"])}>{row["JBRM9"] || ""}</td>
                    </tr>
                  ));
                })()}
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
                {filteredEnviosBoaData.map((row, index) => {
                  const currentFechaEntrega = formatEntregaDate(row["Fecha Entrega"] as string);
                  const previousFechaEntrega = index > 0 ? formatEntregaDate(filteredEnviosBoaData[index - 1]["Fecha Entrega"] as string) : null;
                  const isFechaEntregaDuplicate = currentFechaEntrega === previousFechaEntrega;
                  
                  return (
                    <tr key={index}>
                      {reorderColumns(Object.keys(row), hiddenEnviosBoaCols).map((key) =>
                        !hiddenEnviosBoaCols.includes(key) ? (
                          <td
                            key={key}
                            style={getEnviosViperRowStyle(row)}
                          >
                            {key === "Fecha Entrega"
                              ? isFechaEntregaDuplicate ? "" : currentFechaEntrega
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
                  );
                })}
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
                <tr>
                  <th rowSpan={2} style={{ width: '120px', minWidth: '120px' }}>Entrega</th>
                  <th rowSpan={2}>
                    Secuencia
                    <input
                      type="text"
                      placeholder="Filtrar Secuencia"
                      value={juntaFilters["Secuencia"] || ""}
                      onChange={(e) => handleJuntaFilterChange("Secuencia", e.target.value)}
                      className={styles.filterInput}
                    />
                  </th>
                  <th colSpan={3} style={{ textAlign: 'center', backgroundColor: '#FFB6C1' }}>
                    TRAVELER COIL
                  </th>
                  <th colSpan={3} style={{ textAlign: 'center', backgroundColor: '#FFFF99' }}>
                    TRAVELER LINEA
                  </th>
                  <th colSpan={3} style={{ textAlign: 'center', backgroundColor: '#ADD8E6' }}>
                    TRAVELER SUBA-ESTACION 01
                  </th>
                </tr>
                <tr>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>ETA</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>Status</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>Fecha Embarque</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>ETA</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>Status</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>Fecha Embarque</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>ETA</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>Status</th>
                  <th style={{ backgroundColor: '#FFA500', width: '150px', minWidth: '150px' }}>Fecha Embarque</th>
                </tr>
              </thead>
              <tbody>
                {filteredJuntaData.map((row, index) => {
                  const originalIndex = juntaData.findIndex(r => r.ID === row.ID);
                  
                  const isCoilEnviado = row["Fecha Embarque Coil"] === "ENVIADO";
                  const isLineaEnviado = row["Fecha Embarque Linea"] === "ENVIADO";
                  const isSubaEnviado = row["Fecha Embarque SUBA-ESTACION 01"] === "ENVIADO";
                  
                  const allFechasEnviado = isCoilEnviado && isLineaEnviado && isSubaEnviado;
                  
                  const currentEntrega = formatEntregaDate(row["Entrega"] as string);
                  const previousEntrega = index > 0 ? formatEntregaDate(filteredJuntaData[index - 1]["Entrega"] as string) : null;
                  const isEntregaDuplicate = currentEntrega === previousEntrega;
                  
                  return (
                    <tr key={index}>
                      {/* Renderizar Entrega primero */}
                      <td style={allFechasEnviado ? { backgroundColor: "#29b824" } : getRowStyle(row.Estatus, "Entrega")}>
                        <span style={{ fontWeight: 600 }}>
                          {isEntregaDuplicate ? "" : currentEntrega}
                        </span>
                      </td>
                      
                      {Object.entries(row).map(([key, value], idx) => {
                        if (columnsToHide.includes(key) || key === "Entrega") return null;
                        
                        // Determinar si ETA/Status es editable basado en Fecha Embarque
                        const isETACoilEditable = key === "ETA Coil" && !isCoilEnviado;
                        const isStatusCoilEditable = key === "Status Coil" && !isCoilEnviado;
                        const isETALineaEditable = key === "ETA Linea" && !isLineaEnviado;
                        const isStatusLineaEditable = key === "Status Linea" && !isLineaEnviado;
                        const isETASubaEditable = key === "ETA SUBA-ESTACION 01" && !isSubaEnviado;
                        const isStatusSubaEditable = key === "Status SUBA-ESTACION 01" && !isSubaEnviado;
                        
                        // Solo editable si es uno de los campos que puede ser editado
                        const isEditable = isETACoilEditable || isStatusCoilEditable || isETALineaEditable || 
                                          isStatusLineaEditable || isETASubaEditable || isStatusSubaEditable;
                        
                        let cellStyle = getRowStyle(row.Estatus, key);
                        
                        if (allFechasEnviado) {
                          cellStyle = { backgroundColor: "#29b824" };
                        } else if ((key === "Fecha Embarque Coil" || key === "Fecha Embarque Linea" || key === "Fecha Embarque SUBA-ESTACION 01") && value === "ENVIADO") {
                          cellStyle = { backgroundColor: "#29b824" };
                        } else if ((isCoilEnviado && (key === "ETA Coil" || key === "Status Coil")) ||
                                   (isLineaEnviado && (key === "ETA Linea" || key === "Status Linea")) ||
                                   (isSubaEnviado && (key === "ETA SUBA-ESTACION 01" || key === "Status SUBA-ESTACION 01"))) {
                          cellStyle = { backgroundColor: "#29b824" };
                        }
                        
                        const isEditingThisCell = editingCell?.rowIndex === originalIndex && editingCell?.key === key;
                        
                        return (
                          <td
                            key={idx}
                            style={cellStyle}
                          >
                            {isEditable ? (
                              isEditingThisCell ? (
                                <textarea
                                  autoFocus
                                  value={editedJuntaData[originalIndex]?.[key] || ""}
                                  onChange={(e) => handleJuntaCellChange(originalIndex, key, e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                  style={{ width: '100%', minHeight: '80px', padding: '8px', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'Poppins, sans-serif', resize: 'vertical' }}
                                />
                              ) : (
                                <span 
                                  onDoubleClick={() => setEditingCell({ rowIndex: originalIndex, key })}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                  }}
                                >
                                  {editedJuntaData[originalIndex]?.[key] || ""}
                                </span>
                              )
                            ) : (
                              <span style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px',
                                ...(key === "Secuencia" ? { fontSize: '18px', fontWeight: 'bold' } : {})
                              }}>
                                {value}
                              </span>
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

        {/* Modal de edición para Gpos */}
        {gposModalOpen && gposModalData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              minWidth: '400px',
              maxWidth: '500px',
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                Editar {gposModalData.key}
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                  {gposModalData.key === 'Fecha CMX' ? 'Fecha' : gposModalData.key}:
                </label>

                {gposModalData.key === 'Fecha CMX' ? (
                  <input
                    type="date"
                    value={gposEditValues[gposModalData.po + '_' + gposModalData.key] 
                      ? new Date(gposEditValues[gposModalData.po + '_' + gposModalData.key] as string).toISOString().split('T')[0]
                      : (gposModalData.value ? new Date(gposModalData.value as string).toISOString().split('T')[0] : "")
                    }
                    onChange={(e) => handleGposCellChange(gposModalData.po, gposModalData.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                ) : gposModalData.key === 'Qty' ? (
                  <input
                    type="number"
                    value={gposEditValues[gposModalData.po + '_' + gposModalData.key] ?? gposModalData.value ?? ""}
                    onChange={(e) => handleGposCellChange(gposModalData.po, gposModalData.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                ) : gposModalData.key === 'Orden' ? (
                  <input
                    type="number"
                    value={gposEditValues[gposModalData.po + '_' + gposModalData.key] ?? gposModalData.value ?? ""}
                    onChange={(e) => handleGposCellChange(gposModalData.po, gposModalData.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={gposEditValues[gposModalData.po + '_' + gposModalData.key] ?? gposModalData.value ?? ""}
                    onChange={(e) => handleGposCellChange(gposModalData.po, gposModalData.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleGposCellCancel}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#ccc',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGposCellSave}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#0070f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
