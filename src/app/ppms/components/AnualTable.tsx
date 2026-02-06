'use client';

import React, { useState } from 'react';
import styles from './AnualTable.module.css';

interface AnualRow {
  Mes: string;
  Año: number;
  [key: string]: any;
}

interface AnualTableProps {
  data: AnualRow[];
  año: string;
  onViewClick: (data: AnualRow[]) => void;
}

export default function AnualTable({ data, año, onViewClick }: AnualTableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<AnualRow[]>(data);
  const [tableData, setTableData] = useState<AnualRow[]>(data);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedData([...tableData]);
    }
  };

  const handleSaveClick = async () => {
    try {
      const response = await fetch('/api/PPMs/updateAnual', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: editedData
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Datos guardados exitosamente');
        setTableData(result.data);
        setEditedData(result.data);
        setIsEditing(false);
      } else {
        console.error('Error al guardar datos');
      }
    } catch (error) {
      console.error('Error al guardar datos:', error);
    }
  };

  const handleCancelClick = () => {
    setEditedData([...tableData]);
    setIsEditing(false);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const newData = [...editedData];
    newData[index] = { ...newData[index], [field]: value };
    setEditedData(newData);
  };

  const isVerDisabled = () => {
    const hasCompleteRow = tableData.some(row => 
      row.Escapes && row.Escapes !== '' && 
      row.Embarcado && row.Embarcado !== '' && 
      row.PPMs && row.PPMs !== ''
    );
    
    return !hasCompleteRow;
  };

  const handleVerClick = () => {
    onViewClick(tableData);
  };

  if (!data || data.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <h3 className={styles.tableTitle}>Datos Anuales - {año}</h3>
        <p className={styles.noData}>No hay datos disponibles para este año.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        {isEditing ? (
          <div className={styles.editActions}>
            <button className={styles.saveButton} onClick={handleSaveClick}>
              Guardar
            </button>
            <button className={styles.cancelButton} onClick={handleCancelClick}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className={styles.editButton} onClick={handleEditClick}>
            ✎
          </button>
        )}
        <h3 className={styles.tableTitle}>Datos Anuales - {año}</h3>
        <button 
          className={`${styles.verButton} ${isVerDisabled() ? styles.verButtonDisabled : ''}`}
          disabled={isVerDisabled()}
          onClick={handleVerClick}
        >
          Ver
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mes</th>
              <th>Año</th>
              <th>Escapes</th>
              <th>Embarcado</th>
              <th>PPMs</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {(isEditing ? editedData : tableData).map((row, index) => (
              <tr key={index}>
                <td>{row.Mes}</td>
                <td>{row.Año}</td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      className={styles.editInput}
                      value={row.Escapes ?? ''}
                      onChange={(e) => handleInputChange(index, 'Escapes', e.target.value)}
                    />
                  ) : (
                    row.Escapes ?? '-'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      className={styles.editInput}
                      value={row.Embarcado ?? ''}
                      onChange={(e) => handleInputChange(index, 'Embarcado', e.target.value)}
                    />
                  ) : (
                    row.Embarcado ?? '-'
                  )}
                </td>
                <td>{row.PPMs ?? '-'}</td>
                <td>{row.Target ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
