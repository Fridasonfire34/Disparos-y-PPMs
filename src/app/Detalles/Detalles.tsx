'use client';

import { useRouter } from "next/navigation";
import styles from "../page.module.css";

export default function Detalles() {
  const router = useRouter();

  const handleButtonClick = (action: string) => {
    console.log(`${action} clicked`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Detalles de Disparos</h1>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <button onClick={() => handleButtonClick("Junta 7 am")}>
            Junta 7 am
          </button>
          <button onClick={() => handleButtonClick("Tabla de Envios Viper")}>
            Tabla de Envios Viper
          </button>
          <button onClick={() => handleButtonClick("Tabla de Envios BOA")}>
            Tabla de Envios BOA
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Contenido principal aquí */}
      </main>
    </div>
  );
}
