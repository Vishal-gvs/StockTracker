import ExcelJS from 'exceljs';
import { getGFS } from '../config/gridfs';
import ExcelHistory from '../models/ExcelHistory';
import Expenditure from '../models/Expenditure';
import { getStartOfDay, getEndOfDay } from '../utils/date.util';

export const createAndStoreExcel = async (userId: string, date: Date) => {
    const start = getStartOfDay(date);
    const end = getEndOfDay(date);

    // Fetch Data
    const expenditures = await Expenditure.find({
        date: { $gte: start, $lte: end }
    }).populate('itemId').populate('userId');

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Expenditure');

    sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Item Name', key: 'itemName', width: 25 },
        { header: 'Quantity Used', key: 'quantity', width: 15 },
        { header: 'Cost Per Unit', key: 'costPerUnit', width: 15 },
        { header: 'Total Cost', key: 'totalCost', width: 15 },
        { header: 'User', key: 'user', width: 20 },
        { header: 'Status', key: 'status', width: 15 }
    ];

    expenditures.forEach(exp => {
        sheet.addRow({
            date: new Date(exp.date).toLocaleDateString(),
            itemName: (exp.itemId as any)?.name || 'Unknown',
            quantity: exp.quantityUsed,
            costPerUnit: (exp.itemId as any)?.costPerUnit || 0,
            totalCost: exp.quantityUsed * ((exp.itemId as any)?.costPerUnit || 0),
            user: (exp.userId as any)?.name || 'Unknown',
            status: exp.finalized ? 'Finalized' : 'Pending'
        });
    });

    // Write to Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload to GridFS
    const gfs = getGFS();
    const dateStr = date.toISOString().split('T')[0];
    const fileName = `Expenditure_Report_${dateStr}_${Date.now()}.xlsx`;
    
    return new Promise((resolve, reject) => {
        const uploadStream = gfs.openUploadStream(fileName, {
            metadata: {
                userId: userId,
                createdAt: new Date(),
                reportDate: date
            }
        });

        uploadStream.end(buffer);

        uploadStream.on('finish', async () => {
            try {
                // Save to History Collection
                const history = new ExcelHistory({
                    userId: userId,
                    fileId: uploadStream.id,
                    fileName: fileName,
                    createdAt: new Date()
                });
                await history.save();
                resolve(history);
            } catch (err) {
                reject(err);
            }
        });

        uploadStream.on('error', (err) => {
            reject(err);
        });
    });
};
