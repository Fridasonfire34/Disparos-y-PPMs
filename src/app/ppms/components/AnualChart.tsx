'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './AnualChart.module.css';

interface AnualRow {
  Mes: string;
  Año: number;
  Escapes: number;
  Embarcado: number;
  PPMs: number;
  Target: number;
}

interface AnualChartProps {
  data: AnualRow[];
  año: string;
  onBack: () => void;
}

export default function AnualChart({ data, año, onBack }: AnualChartProps) {
  const chartData = data.map(row => ({
    mes: row.Mes,
    PPMs: row.PPMs || 0,
    Target: row.Target || 400,
  }));

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <button className={styles.backButton} onClick={onBack}>
          ←
        </button>
        <h3 className={styles.chartTitle}>Grafica Anual - {año}</h3>
        <div style={{ width: '80px' }}></div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="mes" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            label={{ value: 'PPMs', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="PPMs" 
            stroke="#1b7199" 
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
            name="PPMs"
          />
          <Line 
            type="monotone" 
            dataKey="Target" 
            stroke="#f8aa00" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="Target"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
