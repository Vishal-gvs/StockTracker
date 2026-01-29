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

    const gfs = getGFS();
    const dateStr = date.toISOString().split('T')[0];
    
    // Check for existing file for this date
    // We search across all users since admin finalizes for everyone?
    // Requirement "only one excel sheet per day should be stored"
    // We can filter by "fileName" pattern or by "createdAt" range, or "reportDate" metadata?
    // Let's use metadata query on files collection if possible, or search ExcelHistory
    
    // Search ExcelHistory for this date range
    // NOTE: ExcelHistory 'createdAt' is when it was generated.
    // The previous implementation didn't store 'reportDate' in ExcelHistory, only in Metadata.
    // However, we can use the date part of the fileName as a proxy or just search ExcelHistory by regex if fileName follows pattern.
    // Better: Search ExcelHistory where fileName contains the date string.
    
    // Search ExcelHistory for this date range
    // Using Regex to find all files with the date pattern
    const existingFileRecords = await ExcelHistory.find({
        fileName: { $regex: `Expenditure_Report_${dateStr}` }
    });

    if (existingFileRecords.length > 0) {
        // Delete all matches from GridFS and History
        for (const record of existingFileRecords) {
            try {
                await gfs.delete(record.fileId);
                console.log(`Deleted existing file: ${record.fileName}`);
            } catch (err) {
                console.warn(`Failed to delete GridFS file: ${record.fileId}`, err);
            }
            await ExcelHistory.findByIdAndDelete(record._id);
        }
    }

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

export const createAndStoreMonthlyExcel = async (userId: string, month: number, year: number) => {
    // Determine start and end of the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch all expenditures for the month
    const expenditures = await Expenditure.find({
        date: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('itemId');

    // Aggregate Data by Item
    const itemMap = new Map<string, { 
        name: string, 
        totalQuantity: number, 
        costPerUnit: number, 
        totalCost: number 
    }>();

    expenditures.forEach(exp => {
        const item = exp.itemId as any;
        if (!item) return;

        const itemId = item._id.toString();
        if (!itemMap.has(itemId)) {
            itemMap.set(itemId, {
                name: item.name,
                totalQuantity: 0,
                costPerUnit: item.costPerUnit,
                totalCost: 0
            });
        }

        const current = itemMap.get(itemId)!;
        current.totalQuantity += exp.quantityUsed;
        current.totalCost += exp.quantityUsed * item.costPerUnit;
    });

    // Generate Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Monthly Report');

    sheet.columns = [
        { header: 'Item Name', key: 'name', width: 30 },
        { header: 'Total Quantity Used', key: 'quantity', width: 20 },
        { header: 'Cost Per Unit', key: 'costPerUnit', width: 15 },
        { header: 'Total Cost', key: 'totalCost', width: 15 }
    ];

    let overallTotalCost = 0;
    let overallTotalQuantity = 0;
    let overallCostPerUnit = 0;

    itemMap.forEach(data => {
        sheet.addRow({
            name: data.name,
            quantity: data.totalQuantity,
            costPerUnit: data.costPerUnit,
            totalCost: data.totalCost
        });
        overallTotalCost += data.totalCost;
        overallTotalQuantity += data.totalQuantity;
        overallCostPerUnit += data.costPerUnit;
    });

    sheet.addRow({});
    sheet.addRow({ 
        name: 'Grand Total', 
        quantity: overallTotalQuantity,
        costPerUnit: overallCostPerUnit,
        totalCost: overallTotalCost 
    });

    // Write buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const gfs = getGFS();
    // Use year and month with 0 padding for month
    const monthStr = month.toString().padStart(2, '0');
    
    // Duplicate Check: Delete existing "Monthly_Aggregated_Report_YYYY_MM..."
    const existingReports = await ExcelHistory.find({
        fileName: { $regex: `Monthly_Aggregated_Report_${year}_${monthStr}` }
    });

    if (existingReports.length > 0) {
        for (const record of existingReports) {
            try {
                await gfs.delete(record.fileId);
            } catch (err) {
                console.warn(`Failed to delete old monthly report: ${record.fileName}`);
            }
            await ExcelHistory.findByIdAndDelete(record._id);
        }
    }

    const fileName = `Monthly_Aggregated_Report_${year}_${monthStr}_${Date.now()}.xlsx`;

    return new Promise((resolve, reject) => {
        const uploadStream = gfs.openUploadStream(fileName, {
            metadata: {
                userId: userId,
                createdAt: new Date(),
                reportType: 'monthly',
                month,
                year
            }
        });

        uploadStream.end(buffer);

        uploadStream.on('finish', async () => {
            try {
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

        uploadStream.on('error', reject);
    });
};
