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

interface ActionEntry {
  action: string;
  responsible: string;
  dueDate: string;
  status: string;
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
  const [editEntries, setEditEntries] = useState<ActionEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const normalizeActions = (row: ActionRow): ActionEntry[] => {
    const raw = row.Actions?.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const entries = parsed.map((item) => ({
            action: String((item as ActionEntry)?.action ?? ''),
            responsible: String((item as ActionEntry)?.responsible ?? ''),
            dueDate: String((item as ActionEntry)?.dueDate ?? ''),
            status: String((item as ActionEntry)?.status ?? ''),
          }));
          const filtered = entries.filter((entry) =>
            entry.action || entry.responsible || entry.dueDate || entry.status
          );
          if (filtered.length > 0) {
            return filtered;
          }
        }
      } catch (error) {
        console.error('Error parsing actions JSON:', error);
      }
    }

    const legacy = {
      action: row.Actions ?? '',
      responsible: row.Responsible ?? '',
      dueDate: row['Due Date'] ?? '',
      status: row.Status ?? '',
    };

    if (legacy.action || legacy.responsible || legacy.dueDate || legacy.status) {
      return [legacy];
    }

    return [];
  };

  const handleAddClick = (index: number, row: ActionRow) => {
    const existing = normalizeActions(row);
    setEditingRow(index);
    setEditEntries(existing.length > 0 ? existing : [{
      action: '',
      responsible: '',
      dueDate: '',
      status: 'En proceso',
    }]);
  };

  const handleEntryChange = (index: number, patch: Partial<ActionEntry>) => {
    setEditEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry
      )
    );
  };

  const handleAddEntry = () => {
    setEditEntries((current) => ([
      ...current,
      { action: '', responsible: '', dueDate: '', status: 'En proceso' },
    ]));
  };

  const handleRemoveEntry = (index: number) => {
    setEditEntries((current) => current.filter((_, entryIndex) => entryIndex !== index));
  };

  const handleSave = async (index: number) => {
    if (editEntries.length === 0) {
      setError('Agrega al menos una accion');
      return;
    }

    const trimmedEntries = editEntries.map((entry) => ({
      action: entry.action.trim(),
      responsible: entry.responsible.trim(),
      dueDate: entry.dueDate.trim(),
      status: entry.status.trim(),
    }));

    const hasInvalid = trimmedEntries.some((entry) =>
      !entry.action || !entry.responsible || !entry.dueDate || !entry.status
    );

    if (hasInvalid) {
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
          actions: trimmedEntries,
        }),
      });

      if (response.ok) {
        const updatedData = [...data];
        const serialized = JSON.stringify(trimmedEntries);
        updatedData[index].Actions = serialized;
        updatedData[index].Responsible = trimmedEntries[0].responsible;
        updatedData[index]['Due Date'] = trimmedEntries[0].dueDate;
        updatedData[index].Status = trimmedEntries[0].status;
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
    setEditEntries([]);
    setError('');
  };

  const getStatusClass = (status: string) => {
    const normalized = status.trim();
    if (normalized === 'Completado') return styles.statusCompleted;
    if (normalized === 'Cancelado') return styles.statusCanceled;
    if (normalized === 'En proceso') return styles.statusInProgress;
    return styles.statusDefault;
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
              data.map((row, index) => {
                const entries = normalizeActions(row);
                const isEditing = editingRow === index;
                const hasEntries = entries.length > 0;

                return (
                <React.Fragment key={row.ID || index}>
                  <tr>
                  <td>{row.Item}</td>
                  <td>{row.Issue}</td>
                  <td>{row['Root Cause']}</td>
                  <td>
                    {isEditing ? (
                      <div className={styles.multiInputGroup}>
                        {editEntries.map((entry, entryIndex) => (
                          <div key={`action-${entryIndex}`} className={styles.multiInputRow}>
                            <textarea
                              className={styles.textInput}
                              value={entry.action}
                              onChange={(e) => handleEntryChange(entryIndex, { action: e.target.value })}
                              rows={2}
                            />
                            <button
                              type="button"
                              className={styles.removeActionButton}
                              onClick={() => handleRemoveEntry(entryIndex)}
                              title="Eliminar accion"
                              aria-label="Eliminar accion"
                              disabled={editEntries.length === 1}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={styles.addActionButton}
                          onClick={handleAddEntry}
                        >
                          + Agregar accion
                        </button>
                      </div>
                    ) : (
                      <div className={styles.multiLine}>
                        {hasEntries ? entries.map((entry, entryIndex) => (
                          <div key={`action-view-${entryIndex}`} className={styles.multiLineItem}>
                            {entry.action}
                          </div>
                        )) : null}
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className={styles.multiInputGroup}>
                        {editEntries.map((entry, entryIndex) => (
                          <input
                            key={`responsible-${entryIndex}`}
                            type="text"
                            className={styles.textInput}
                            value={entry.responsible}
                            onChange={(e) => handleEntryChange(entryIndex, { responsible: e.target.value })}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={styles.multiLine}>
                        {hasEntries ? entries.map((entry, entryIndex) => (
                          <div key={`responsible-view-${entryIndex}`} className={styles.multiLineItem}>
                            {entry.responsible}
                          </div>
                        )) : null}
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className={styles.multiInputGroup}>
                        {editEntries.map((entry, entryIndex) => (
                          <input
                            key={`duedate-${entryIndex}`}
                            type="date"
                            className={styles.textInput}
                            value={entry.dueDate}
                            onChange={(e) => handleEntryChange(entryIndex, { dueDate: e.target.value })}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={styles.multiLine}>
                        {hasEntries ? entries.map((entry, entryIndex) => (
                          <div key={`duedate-view-${entryIndex}`} className={styles.multiLineItem}>
                            {formatDate(entry.dueDate)}
                          </div>
                        )) : null}
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className={styles.multiInputGroup}>
                        {editEntries.map((entry, entryIndex) => (
                          <select
                            key={`status-${entryIndex}`}
                            className={styles.textInput}
                            value={entry.status}
                            onChange={(e) => handleEntryChange(entryIndex, { status: e.target.value })}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="En proceso">En proceso</option>
                            <option value="Completado">Completado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.multiLine}>
                        {hasEntries ? entries.map((entry, entryIndex) => (
                          <span
                            key={`status-view-${entryIndex}`}
                            className={`${styles.statusPill} ${getStatusClass(entry.status)}`}
                          >
                            {entry.status}
                          </span>
                        )) : null}
                      </div>
                    )}
                  </td>
                  <td>
                    {!isEditing && (
                      hasEntries ? (
                        <button 
                          className={styles.editButton}
                          onClick={() => handleAddClick(index, row)}
                          title="Editar fila"
                        >
                          ✎
                        </button>
                      ) : (
                        <button 
                          className={styles.addButton}
                          onClick={() => handleAddClick(index, row)}
                          title="Agregar datos"
                        >
                          +
                        </button>
                      )
                    )}
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
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
