import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';

type IncidentData = {
    date: string;
    area: string;
    count: number;
    link: Array<string>;
};

export const processExcelData = () => {
    const [data, setData] = useState<IncidentData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/data/incidents.xlsx');
                const arrayBuffer = await response.arrayBuffer();

                const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(worksheet);

                const mappedData = rawData.map((row: any) => {
                    const dateValue = XLSX.SSF.parse_date_code(row['Date']);
                    const jsDate = new Date(dateValue.y, dateValue.m - 1, dateValue.d);
                    const cellDate = jsDate.toISOString().split('T')[0];

                    return {
                        date: cellDate,
                        area: row['Area'] || "",
                        count: Number(row['Number']) || 0,
                        link: Object.keys(row)
                            .filter(key => key.startsWith("Link"))
                            .map(key => row[key])
                            .filter(link => link)
                    };
                });
                setData(mappedData);
            } catch (error) {
                console.error('Error loading Excel data:', error);
            }
        };
        fetchData();
    }, []);

    return data;
};
