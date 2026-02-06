'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import styles from './page.module.css';
import ParetoChart from './components/ParetoChart';
import ActionTable from './components/ActionTable';
import AnualTable from './components/AnualTable';
import AnualChart from './components/AnualChart';

interface ParetoData {
  defecto: string;
  frecuencia: number;
  acumulado: string;
}

interface UploadedRow {
  folioReorden: string;
  fecha: string;
  empleado: string;
  area: string;
  subArea: string;
  turno: string;
  linea: string;
  defecto: string;
  causa: string;
  numeroParte: string;
  secuencia: string;
  cantidad: number;
  comentarios: string;
  producto: string;
  tipo: string;
}

interface AnualRow {
  Mes: string;
  Año: number;
  Escapes?: number | null;
  Embarcado?: number | null;
  PPMs?: number | null;
  Target?: number | null;
  [key: string]: string | number | null | undefined;
}

interface ParetoResponse {
  data: ParetoData[];
  total: number;
  module: string;
  semana: string;
}

export default function Home() {
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [semanas, setSemanas] = useState<string[]>([]);
  const [años, setAños] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [activeButton, setActiveButton] = useState<string>('');
  const [paretoData, setParetoData] = useState<ParetoData[] | null>(null);
  const [paretoInfo, setParetoInfo] = useState<{ module: string; semana: string; año: string; total: number; useHistorical?: boolean } | null>(null);
  const [anualData, setAnualData] = useState<AnualRow[] | null>(null);
  const [anualYear, setAnualYear] = useState<string>('');
  const [showAnualChart, setShowAnualChart] = useState(false);
  const [anualChartData, setAnualChartData] = useState<AnualRow[] | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadRows, setUploadRows] = useState<UploadedRow[]>([]);
  const hasUploadData = uploadRows.length > 0;
  const [semanaActualLabel, setSemanaActualLabel] = useState<string>('Cargando...');
  const [semanaGuardar, setSemanaGuardar] = useState<string>('');
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);

  const fetchSemanaActual = async () => {
    try {
      const response = await fetch('/api/PPMs/semanaActual');
      if (!response.ok) {
        setSemanaActualLabel('Error al cargar');
        return;
      }
      const data = (await response.json()) as { semana?: string; año?: string };
      const semana = data?.semana;
      if (semana) {
        const semanaTexto = String(semana);
        setSemanaActualLabel(semanaTexto);
        const match = semanaTexto.match(/Semana\s*(\d+)/i);
        if (match) {
          const numero = Number.parseInt(match[1], 10);
          if (!Number.isNaN(numero)) {
            setSemanaGuardar(String(numero + 1));
          }
        }
      } else {
        setSemanaActualLabel('Sin datos');
        setSemanaGuardar('1');
      }
    } catch (error) {
      console.error('Error fetching semana actual:', error);
      setSemanaActualLabel('Error al cargar');
    }
  };

  useEffect(() => {
    fetchSemanaActual();
  }, []);

  useEffect(() => {
    const fetchAños = async () => {
      if (!selectedModule) return;
      
      try {
        const url = selectedModule === 'Anual' 
          ? '/api/PPMs/aoos' 
          : `/api/PPMs/aoos?tipo=${selectedModule}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = (await response.json()) as string[];
          setAños(data);
        }
      } catch (error) {
        console.error('Error fetching años:', error);
      }
    };

    if (showForm && selectedModule) {
      fetchAños();
    }
  }, [showForm, selectedModule]);

  useEffect(() => {
    const fetchSemanas = async () => {
      if (!selectedYear) {
        setSemanas([]);
        return;
      }

      if (!selectedModule) return;

      try {
        const url = selectedModule === 'Anual' 
          ? `/api/PPMs/semanas?año=${selectedYear}` 
          : `/api/PPMs/semanas?año=${selectedYear}&tipo=${selectedModule}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = (await response.json()) as string[];
          setSemanas(data);
        }
      } catch (error) {
        console.error('Error fetching semanas:', error);
      }
    };

    fetchSemanas();
  }, [selectedYear, selectedModule]);

  const handleButtonClick = (module: string) => {
    setSelectedModule(module);
    setActiveButton(module);
    setShowForm(true);
    setParetoData(null);
    setParetoInfo(null);
    setAnualData(null);
    setShowAnualChart(false);
    setAnualChartData(null);
  };

  const handleVerClick = async () => {
    if (selectedModule === 'Anual') {
      if (!selectedYear) {
        alert('Por favor selecciona año');
        return;
      }

      try {
        const response = await fetch('/api/PPMs/anual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            año: selectedYear
          }),
        });

        if (response.ok) {
          const result = (await response.json()) as { data: AnualRow[] };
          setAnualData(result.data);
          setAnualYear(selectedYear);
          setShowForm(false);
          setParetoData(null);
          setParetoInfo(null);
        }
      } catch (error) {
        console.error('Error fetching anual data:', error);
      }
      return;
    }

    if (!selectedYear || !selectedWeek) {
      alert('Por favor selecciona año y semana');
      return;
    }

    try {
      const paretoResponse = await fetch(`/api/PPMs/pareto?module=${selectedModule}&semana=${selectedWeek}&año=${selectedYear}&useHistorical=true`);
      if (paretoResponse.ok) {
        const paretoResult = (await paretoResponse.json()) as ParetoResponse;
        setParetoData(paretoResult.data);
          setParetoInfo({
            module: paretoResult.module,
            semana: paretoResult.semana,
            año: selectedYear,
            total: paretoResult.total,
            useHistorical: true
          });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleVerSemanaActual = async () => {
    try {
      const semanaResponse = await fetch('/api/PPMs/semanaActual');
      if (semanaResponse.ok) {
        const semanaData = (await semanaResponse.json()) as { semana?: string; año?: string };
        const semanaActual = semanaData.semana;
        const añoActual = String(semanaData.año ?? '');
        if (!semanaActual || !añoActual) {
          return;
        }
        
        const paretoResponse = await fetch(`/api/PPMs/pareto?module=${selectedModule}&semana=${semanaActual}&año=${añoActual}`);
        if (paretoResponse.ok) {
          const paretoResult = (await paretoResponse.json()) as ParetoResponse;
          setParetoData(paretoResult.data);
          setParetoInfo({
            module: paretoResult.module,
            semana: paretoResult.semana,
            año: añoActual,
            total: paretoResult.total
          });
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Error fetching semana actual:', error);
    }
  };

  const handleExcelButtonClick = () => {
    excelInputRef.current?.click();
  };

  const getCellValue = (row: unknown[], index: number) => {
    const value = row[index];
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  const parseExcelDate = (value: unknown) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        const { y, m, d } = parsed;
        const date = new Date(y, m - 1, d);
        return date.toISOString().split('T')[0];
      }
    }
    return String(value ?? '').trim();
  };

  const handleExcelChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadProcessing(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

      const map = new Map<string, UploadedRow>();

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i] || [];

        const folioReorden = getCellValue(row, 1);
        const fechaRaw = row[2];
        const empleado = getCellValue(row, 3);
        const area = getCellValue(row, 4);
        const subArea = getCellValue(row, 5);
        const turno = getCellValue(row, 6);
        const linea = getCellValue(row, 7);
        const defecto = getCellValue(row, 9);
        const causa = getCellValue(row, 11);
        let numeroParte = getCellValue(row, 13);
        const secuencia = getCellValue(row, 14);
        const cantidadTexto = getCellValue(row, 26);
        const comentarios = getCellValue(row, 28);

        if (!numeroParte) {
          continue;
        }

        if (
          numeroParte.length >= 4 &&
          numeroParte.toUpperCase().startsWith('48V') &&
          /\d/.test(numeroParte.charAt(3))
        ) {
          numeroParte = `48VV${numeroParte.substring(3)}`;
        }

        const cantidad = Number.parseFloat(cantidadTexto || '0') || 0;
        const fecha = parseExcelDate(fechaRaw);

        const key = `${defecto}_${causa}_${numeroParte}`;
        const existing = map.get(key);

        if (existing) {
          map.set(key, { ...existing, cantidad: existing.cantidad + cantidad });
        } else {
          map.set(key, {
            folioReorden,
            fecha,
            empleado,
            area,
            subArea,
            turno,
            linea,
            defecto,
            causa,
            numeroParte,
            secuencia,
            cantidad,
            comentarios,
            producto: '',
            tipo: '',
          });
        }
      }

      const parsedRows = Array.from(map.values());
      setUploadFileName(file.name);
      setUploadRows(parsedRows);

      const uniqueParts = Array.from(new Set(parsedRows.map((row) => row.numeroParte)));
      if (uniqueParts.length > 0) {
        const response = await fetch('/api/PPMs/familiasLookup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parts: uniqueParts }),
        });

        if (response.ok) {
          const result = (await response.json()) as { results: Record<string, { producto: string; tipo: string }> };
          const lookup = result.results as Record<string, { producto: string; tipo: string }>;
          setUploadRows((current) => current.map((row) => ({
            ...row,
            producto: lookup[row.numeroParte]?.producto ?? '',
            tipo: lookup[row.numeroParte]?.tipo ?? '',
          })));
        }
      }
    } catch (error) {
      console.error('Error leyendo Excel:', error);
      alert('No se pudo leer el archivo Excel');
    } finally {
      setIsUploadProcessing(false);
      event.target.value = '';
    }
  };

  const handleUploadCancel = () => {
    setUploadFileName('');
    setUploadRows([]);
  };

  const handleUploadSave = () => {
    if (!semanaGuardar.trim()) {
      alert('Por favor ingresa la semana a guardar');
      return;
    }

    if (!uploadRows.length) {
      alert('No hay datos para guardar. Por favor carga un archivo Excel primero.');
      return;
    }

    const saveData = async () => {
      try {
        setIsSavingUpload(true);
        const response = await fetch('/api/PPMs/saveReordenes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            semanaNumero: semanaGuardar,
            rows: uploadRows,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData?.message || 'Error al guardar');
          return;
        }

        const result = (await response.json()) as { count: number; semana: string; año: string };
        alert(`Datos guardados correctamente: ${result.count} registros en ${result.semana} del año ${result.año}`);
        handleUploadCancel();
        await fetchSemanaActual();
      } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar');
      } finally {
        setIsSavingUpload(false);
      }
    };

    saveData();
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>
          PPMs Internos
        </h1>
        <div className={styles.headerActions}>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            className={styles.fileInput}
            onChange={handleExcelChange}
          />
          <button
            type="button"
            className={styles.headerButton}
            onClick={handleExcelButtonClick}
            title="Subir archivo Excel"
            aria-label="Subir archivo Excel"
          >
            ↑
          </button>
          <span className={styles.weekLabel}>Actual: {semanaActualLabel}</span>
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <button 
          className={`${styles.button} ${activeButton === 'AHUS' ? styles.buttonActive : ''} ${hasUploadData ? styles.buttonDisabled : ''}`} 
          onClick={() => handleButtonClick('AHUS')}
          disabled={hasUploadData}
        >
          AHUs
        </button>
        <button 
          className={`${styles.button} ${activeButton === 'Rooftop' ? styles.buttonActive : ''} ${hasUploadData ? styles.buttonDisabled : ''}`}
          onClick={() => handleButtonClick('Rooftop')}
          disabled={hasUploadData}
        >
          Rooftop
        </button>
        <button 
          className={`${styles.button} ${activeButton === 'CDEF' ? styles.buttonActive : ''} ${hasUploadData ? styles.buttonDisabled : ''}`}
          onClick={() => handleButtonClick('CDEF')}
          disabled={hasUploadData}
        >
          C-D-E-F
        </button>
        <button 
          className={`${styles.button} ${activeButton === 'Control Box' ? styles.buttonActive : ''} ${hasUploadData ? styles.buttonDisabled : ''}`}
          onClick={() => handleButtonClick('Control Box')}
          disabled={hasUploadData}
        >
          Control Box
        </button>
        <button 
          className={`${styles.button} ${activeButton === 'CDU' ? styles.buttonActive : ''} ${hasUploadData ? styles.buttonDisabled : ''}`}
          onClick={() => handleButtonClick('CDU')}
          disabled={hasUploadData}
        >
          CDU
        </button>
        <button 
          className={`${styles.buttonAnual} ${activeButton === 'Anual' ? styles.buttonActive : ''} ${hasUploadData ? styles.buttonDisabled : ''}`}
          onClick={() => handleButtonClick('Anual')}
          disabled={hasUploadData}
        >
          Anual
        </button>
      </div>

      {isUploadProcessing && (
        <div className={styles.uploadContainer}>
          <div className={styles.uploadLoader}>
            <div className={styles.spinner} aria-hidden="true" />
            <span className={styles.loaderText}>Procesando archivo...</span>
          </div>
        </div>
      )}

      {uploadRows.length > 0 && !isUploadProcessing && (
        <div className={styles.uploadContainer}>
          <div className={styles.uploadHeader}>
            <h3 className={styles.uploadTitle}>{uploadFileName}</h3>
            <label className={styles.weekInputLabel}>
              Semana a guardar
              <input
                type="number"
                min={1}
                className={styles.weekInput}
                value={semanaGuardar}
                onChange={(event) => setSemanaGuardar(event.target.value)}
              />
            </label>
            <div className={styles.uploadActions}>
              <button
                className={styles.uploadSaveButton}
                onClick={handleUploadSave}
                disabled={isSavingUpload}
              >
                Guardar
              </button>
              <button
                className={styles.uploadCancelButton}
                onClick={handleUploadCancel}
                disabled={isSavingUpload}
              >
                Cancelar
              </button>
            </div>
          </div>
          <div className={styles.uploadTableWrapper}>
            <table className={styles.uploadTable}>
              <thead>
                <tr>
                  <th>Folio Reorden</th>
                  <th>Fecha</th>
                  <th>Empleado</th>
                  <th>Area</th>
                  <th>SubArea</th>
                  <th>Turno</th>
                  <th>Linea</th>
                  <th>Defecto</th>
                  <th>Causa</th>
                  <th>Numero de Parte</th>
                  <th>Secuencia</th>
                  <th>Cantidad</th>
                  <th>Comentarios</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {uploadRows.map((row, index) => (
                  <tr key={`${row.numeroParte}-${row.defecto}-${index}`}>
                    <td>{row.folioReorden}</td>
                    <td>{row.fecha}</td>
                    <td>{row.empleado}</td>
                    <td>{row.area}</td>
                    <td>{row.subArea}</td>
                    <td>{row.turno}</td>
                    <td>{row.linea}</td>
                    <td>{row.defecto}</td>
                    <td>{row.causa}</td>
                    <td>{row.numeroParte}</td>
                    <td>{row.secuencia}</td>
                    <td>{row.cantidad}</td>
                    <td>{row.comentarios}</td>
                    <td>{row.producto}</td>
                    <td>{row.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && !hasUploadData && (
        <div className={selectedModule === 'Anual' ? styles.formContainerAnual : styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Seleccionar Año</label>
            <select 
              className={styles.combobox}
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedWeek('');
              }}
            >
              <option value="">-- Seleccionar --</option>
              {años.map((año) => (
                <option key={año} value={año}>
                  {año}
                </option>
              ))}
            </select>
          </div>

          {selectedModule !== 'Anual' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Seleccionar Semana</label>
              <select 
                className={styles.combobox}
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {semanas.map((semana) => (
                  <option key={semana} value={semana}>
                    {semana}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.buttonGroup}>
            {selectedModule !== 'Anual' && (
              <>
                <button className={styles.verButton} onClick={handleVerClick}>Buscar</button>
                <button className={styles.verSemanaActualButton} onClick={handleVerSemanaActual}>Ver ultima Semana</button>
              </>
            )}
            {selectedModule === 'Anual' && (
              <button className={styles.verButton} onClick={handleVerClick}>Ver</button>
            )}
          </div>
        </div>
      )}

      {paretoData && paretoInfo && !hasUploadData && (
        <>
          <ParetoChart 
            data={paretoData}
            module={paretoInfo.module}
            semana={paretoInfo.semana}
            total={paretoInfo.total}
            año={paretoInfo.año}
            useHistorical={paretoInfo.useHistorical}
          />
          <ActionTable 
            module={paretoInfo.module}
            semana={paretoInfo.semana}
            año={paretoInfo.año}
            useHistorical={paretoInfo.useHistorical}
          />
        </>
      )}

      {anualData && !showAnualChart && !hasUploadData && (
        <AnualTable 
          data={anualData}
          año={anualYear}
          onViewClick={(data) => {
            setAnualChartData(data);
            setShowAnualChart(true);
          }}
        />
      )}

      {showAnualChart && anualChartData && !hasUploadData && (
        <AnualChart
          data={anualChartData}
          año={anualYear}
          onBack={() => {
            setShowAnualChart(false);
            setAnualChartData(null);
          }}
        />
      )}

    </div>
  );
}
