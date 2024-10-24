// dataProcessor.ts
import * as XLSX from 'xlsx';

export const processExcelData = (file: File): Promise<Array<{ date: string; area: string; count: number }>> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(worksheet);

                // Transform the data into the required format
                const transformedData = rawData.map((row: any) => ({
                    date: row['Date of Incident'],
                    area: row['Area'],
                    count: Number(row['# of WP Shells Fired per Footage']) || 0
                })).filter(row => row.area && row.date); // Filter out empty rows

                resolve(transformedData);
            } catch (error) {
                reject(error);
            }
        };

        reader.readAsArrayBuffer(file);
    });
};