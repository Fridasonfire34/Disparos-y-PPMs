'use client';

import React, { useEffect, useState } from 'react';
import styles from './ActionTable.module.css';

interface ActionRow {
  ID: string;
  Item: string;
  Issue: string;
  'Root Cause': string;
  Actions: string;
  Responsible: string;
  'Due Date': string;
  Status: string;
}

interface ActionTableProps {
  module: string;
  semana: string;
  año: string;
  useHistorical?: boolean;
}

export default function ActionTable({ module, semana, año, useHistorical = false }: ActionTableProps) {
  const [data, setData] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editActions, setEditActions] = useState('');
  const [editResponsible, setEditResponsible] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingStatusRow, setEditingStatusRow] = useState<number | null>(null);
  const [tempStatus, setTempStatus] = useState('');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const historicalParam = useHistorical ? '&useHistorical=true' : '';
        const response = await fetch(`/api/PPMs/actionPlan?module=${module}&semana=${semana}&año=${año}${historicalParam}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching action plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [module, semana, año, useHistorical]);

  const handleAddClick = (index: number, currentActions: string, currentResponsible: string, currentDueDate: string, currentStatus: string) => {
    setEditingRow(index);
    setEditActions(currentActions || '');
    setEditResponsible(currentResponsible || '');
    setEditDueDate(currentDueDate || '');
    setEditStatus(currentStatus || 'En proceso');
  };

  const handleSave = async (index: number) => {
    if (!editActions.trim() || !editResponsible.trim() || !editDueDate.trim() || !editStatus.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const row = data[index];
      const response = await fetch('/api/PPMs/updateActionPlan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: module,
          id: row.ID,
          actions: editActions,
          responsible: editResponsible,
          dueDate: editDueDate,
          status: editStatus,
        }),
      });

      if (response.ok) {
        const updatedData = [...data];
        updatedData[index].Actions = editActions;
        updatedData[index].Responsible = editResponsible;
        updatedData[index]['Due Date'] = editDueDate;
        updatedData[index].Status = editStatus;
        setData(updatedData);
        setEditingRow(null);
      } else {
        setError('Error al guardar los cambios');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditActions('');
    setEditResponsible('');
    setEditDueDate('');
    setEditStatus('');
    setError('');
  };

  const handleStatusChange = async (index: number, newStatus: string) => {
    try {
      const row = data[index];
      const response = await fetch('/api/PPMs/updateStatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: module,
          id: row.ID,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedData = [...data];
        updatedData[index].Status = newStatus;
        setData(updatedData);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className={styles.tableContainer}>
      <h3 className={styles.tableTitle}>Plan de Accion - {module} - {semana} - {año}</h3>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ITEM</th>
              <th>ISSUE</th>
              <th>ROOT CAUSE</th>
              <th>ACTIONS</th>
              <th>RESPONSIBLE</th>
              <th>DUE DATE</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.noData}>Cargando...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>No hay datos disponibles</td>
              </tr>
            ) : (
              data.map((row, index) => (
                <React.Fragment key={row.ID || index}>
                  <tr className={
                    row.Status === 'Completado' ? styles.completedRow : 
                    row.Status === 'Cancelado' ? styles.canceledRow : 
                    row.Status === 'En proceso' ? styles.inProgressRow : ''
                  }>
                  <td>{row.Item}</td>
                  <td>{row.Issue}</td>
                  <td>{row['Root Cause']}</td>
                  <td>
                    {editingRow === index ? (
                      <textarea
                        className={styles.textInput}
                        value={editActions}
                        onChange={(e) => setEditActions(e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <div className={styles.actionsText}>{row.Actions}</div>
                    )}
                  </td>
                  <td>
                    {editingRow === index ? (
                      <input
                        type="text"
                        className={styles.textInput}
                        value={editResponsible}
                        onChange={(e) => setEditResponsible(e.target.value)}
                      />
                    ) : (
                      row.Responsible
                    )}
                  </td>
                  <td>
                    {editingRow === index ? (
                      <input
                        type="date"
                        className={styles.textInput}
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                    ) : (
                      formatDate(row['Due Date'])
                    )}
                  </td>
                  <td>
                    {editingRow === index ? (
                      <select
                        className={styles.textInput}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Completado">Completado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    ) : row.Actions && row.Actions.trim() && (!row.Status || !row.Status.trim()) ? (
                      <div>
                        <select
                          className={styles.statusSelect}
                          value={editingStatusRow === index ? tempStatus : ''}
                          onChange={(e) => {
                            setEditingStatusRow(index);
                            setTempStatus(e.target.value);
                          }}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="En proceso">En proceso</option>
                          <option value="Completado">Completado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                        {editingStatusRow === index && (
                          <button
                            className={styles.saveStatusButton}
                            onClick={() => {
                              handleStatusChange(index, tempStatus);
                              setEditingStatusRow(null);
                              setTempStatus('');
                            }}
                            disabled={!tempStatus}
                          >
                            Guardar
                          </button>
                        )}
                      </div>
                    ) : (
                      row.Status
                    )}
                  </td>
                  <td>
                    {editingRow !== index && (() => {
                      const hasActions = row.Actions && row.Actions.trim();
                      const hasResponsible = row.Responsible && row.Responsible.trim();
                      const hasDueDate = row['Due Date'] && row['Due Date'].trim();
                      const hasStatus = row.Status && row.Status.trim();
                      
                      if (!hasActions && !hasResponsible && !hasDueDate) {
                        return (
                          <button 
                            className={styles.addButton}
                            onClick={() => handleAddClick(index, row.Actions, row.Responsible, row['Due Date'], row.Status)}
                            title="Agregar datos"
                          >
                            +
                          </button>
                        );
                      }
                      
                      if (hasActions && hasResponsible && hasDueDate && !hasStatus) {
                        return null;
                      }
                      
                      if (hasActions && hasResponsible && hasDueDate && hasStatus) {
                        return (
                          <button 
                            className={styles.editButton}
                            onClick={() => handleAddClick(index, row.Actions, row.Responsible, row['Due Date'], row.Status)}
                            title="Editar fila"
                          >
                            ✎
                          </button>
                        );
                      }
                      
                      return null;
                    })()}
                  </td>
                </tr>
                {editingRow === index && (
                  <tr>
                    <td colSpan={8} className={styles.buttonRowCell}>
                      <div className={styles.buttonGroup}>
                        <button 
                          className={styles.saveButton} 
                          onClick={() => handleSave(index)}
                          disabled={saving}
                        >
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button 
                          className={styles.cancelButton} 
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
