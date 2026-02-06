'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type XAxisTickContentProps,
} from 'recharts';
import styles from './ParetoChart.module.css';

interface ParetoData {
  defecto: string;
  frecuencia: number;
  acumulado: string;
}

interface ParetoChartProps {
  data: ParetoData[];
  module: string;
  semana: string;
  total: number;
  año: string;
  useHistorical?: boolean;
}

const CustomizedAxisTick = ({ x, y, payload }: XAxisTickContentProps) => {
  const xPos = typeof x === 'number' ? x : Number(x ?? 0);
  const yPos = typeof y === 'number' ? y : Number(y ?? 0);
  const words = String(payload?.value ?? '').split(' ');
  
  return (
    <g transform={`translate(${xPos},${yPos})`}>
      <text
        x={0}
        y={0}
        dy={20}
        textAnchor="end"
        fill="#000000"
        fontFamily="Poppins"
        fontSize={14}
        transform="rotate(-45)"
      >
        {words.map((word: string, index: number) => (
          <tspan x={0} dy={index === 0 ? 0 : 12} key={index}>
            {word}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export default function ParetoChart({ data, module, semana, total, año, useHistorical }: ParetoChartProps) {
  const maxAcum = Math.max(...data.map(d => parseFloat(d.acumulado)));
  
  const maxY = Math.ceil(maxAcum / 2) * 2;
  
  const ticks = [];
  for (let i = 0; i <= maxY; i += 2) {
    ticks.push(i);
  }

  const handleDownload = async () => {
    const params = new URLSearchParams({
      semana,
      año,
      tipo: module,
      useHistorical: useHistorical ? 'true' : 'false',
    });

    const response = await fetch(`/api/PPMs/paretoDownload?${params.toString()}`);
    if (!response.ok) {
      alert('No se pudo generar el Excel');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reordenes - ${semana} - ${año} - ${module}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.paretoContainer}>
      <button
        type="button"
        className={styles.downloadButton}
        onClick={handleDownload}
        title="Descargar esta semana"
        aria-label="Descargar esta semana"
      >
        ↓
      </button>
      <h2 className={styles.paretoTitle}>
         {module} - {semana} - {año}
      </h2>
      <p className={styles.paretoInfo}>
        Total de defectos: <strong>{total}</strong>
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 1,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="defecto" 
            height={80}
            interval={0}
            tick={CustomizedAxisTick}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#000000', fontFamily: 'Poppins', fontSize: 16 }}
            interval={0}
            tickCount={10}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, maxY]}
            ticks={ticks}
            tick={{ fill: '#000000', fontFamily: 'Poppins', fontSize: 16 }}
          />
          <Tooltip />
          <Bar 
            yAxisId="left"
            dataKey="frecuencia" 
            fill="#006999" 
            name="Frecuencia"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="acumulado"
            stroke="#ff7300"
            strokeWidth={3}
            name="% Acumulado"
            dot={{ fill: '#ff7300', r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
