// pages/api/Descarga.js
import * as XLSX from 'xlsx';
import axios from 'axios';

export default async function handler(req, res) {
    const columns = [
        'Linea',
        'Entrega',
        'Secuencia',
        'Qty',
        'Orden Produccion',
        'Estatus',
        'Comentarios',
        'Fecha CMX',
        'WK',
        'Numero de caja enviada',
        'Hora de envio',
    ];
    const endpoints = {
        "M Actualizado": "/api/Disparo/MActualizado",
        "M Enviados": "/api/Disparo/MEnviado",
        "Viper Actualizado": "/api/Disparo/ViperActualizado",
        "Viper Enviado": "/api/Disparo/ViperEnviado",
        "Boa Actualizado": "/api/Disparo/BoaActualizado",
        "Boa Enviado": "/api/Disparo/BoaEnviado",
    };

    const allData = {};
    
    // Construct base URL from the request
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseURL = `${protocol}://${host}`;

    for (const [key, endpoint] of Object.entries(endpoints)) {
        try {
            const response = await axios.get(`${baseURL}${endpoint}`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allData[key] = response.data;
        } catch (error) {
            console.error(`Failed to fetch data for ${key}`, error);
            return res.status(500).json({ error: `Failed to fetch data for ${key}` });
        }
    }

    const workbook = XLSX.utils.book_new();

    Object.entries(allData).forEach(([sheetName, data]) => {
        const filteredData = (Array.isArray(data) ? data : []).map((row) => {
            return columns.reduce((acc, column) => {
                acc[column] = row && Object.prototype.hasOwnProperty.call(row, column)
                    ? row[column]
                    : '';
                return acc;
            }, {});
        });

        const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: columns });

        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" }
                },
                font: {
                    bold: true,
                    color: { rgb: "FF0000" }
                }
            };
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', 'attachment; filename=disparo_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
}

function getColumnLetter(worksheet, colName) {
    const headers = Object.keys(worksheet)
        .filter(key => key.startsWith('!') === false)
        .reduce((acc, key) => {
            const col = key.replace(/\d+/, '');
            if (!acc[col]) acc[col] = worksheet[key].v;
            return acc;
        }, {});
    return Object.keys(headers).find(col => headers[col] === colName) || null;
}

function deleteColumn(worksheet, colLetter) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = colLetter + (R + 1);
        delete worksheet[cellAddress];
    }
    if (range.e.c > range.s.c) {
        range.e.c--;
        worksheet['!ref'] = XLSX.utils.encode_range(range);
    }
}
