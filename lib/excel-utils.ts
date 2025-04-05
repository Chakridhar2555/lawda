import * as XLSX from 'xlsx';
import { Lead } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export const parseExcelLeads = (file: File): Promise<Partial<Lead>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const leads: Partial<Lead>[] = jsonData.map((row: any) => ({
          _id: uuidv4(),
          name: row.name || '',
          email: row.email || '',
          phone: row.phone || '',
          status: row.status || 'new',
          property: row.property || '',
          date: new Date().toISOString(),
          notes: row.notes || '',
          callHistory: [],
          strategy: {
            lastUpdated: new Date().toISOString(),
            tasks: [],
            notes: ''
          }
        }));

        resolve(leads);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}; 