import { Request, Response } from 'express';
import Expenditure from '../models/Expenditure';
import Item from '../models/Item';
import { isToday, getStartOfDay, getEndOfDay } from '../utils/date.util';

export const addExpenditure = async (req: Request, res: Response) => {
  try {
    const { itemId, quantityUsed } = req.body;
    const userId = (req as any).user.id;

    // Date enforcement: Always use server time
    const today = new Date();
    
    // Check if item exists and has stock
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    if (item.availableStock < quantityUsed) {
        return res.status(400).json({ message: `Insufficient stock. Available: ${item.availableStock}` });
    }

    const expenditure = new Expenditure({
      date: today,
      itemId,
      quantityUsed,
      userId
    });

    item.availableStock -= quantityUsed;
    await item.save();
    await expenditure.save();

    res.status(201).json(expenditure);
  } catch (error) {
    res.status(500).json({ message: 'Error adding expenditure' });
  }
};

export const getDailyExpenditure = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    const start = getStartOfDay(targetDate);
    const end = getEndOfDay(targetDate);

    const expenditures = await Expenditure.find({
      date: { $gte: start, $lte: end }
    }).populate('itemId', 'name costPerUnit').populate('userId', 'name');

    res.json(expenditures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenditures' });
  }
};

export const finalizeDay = async (req: Request, res: Response) => {
  try {
    // Admin finalizes the day
    // 1. Find all non-finalized expenditures for the date (or all expenditures for today?)
    // Requirement: "Finalize a day -> subtract stock -> lock date"
    // Does this mean we can finalize past days? "Prevent updates once admin finalizes a day"
    // Usually finalize happens at end of day.
    
    // Let's assume we finalize "Today" or specific date provided.
    // Ideally Admin selects a date to finalize.
    
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const start = getStartOfDay(targetDate);
    const end = getEndOfDay(targetDate);

    const expenditures = await Expenditure.find({
      date: { $gte: start, $lte: end },
      finalized: false
    }).populate('itemId');

    if (expenditures.length === 0) {
      return res.status(400).json({ message: 'No pending expenditures to finalize for this date' });
    }

    // Process stock deduction in bulk or loop
    // Lock the entries
    for (const exp of expenditures) {
      exp.finalized = true;
      await exp.save();
    }

    res.json({ message: `Finalized ${expenditures.length} entries for ${targetDate.toDateString()}` });

  } catch (error) {
    res.status(500).json({ message: 'Error finalizing day' });
  }
};

export const exportExpenditures = async (req: Request, res: Response) => {
    // This might just return JSON, and frontend handles SheetJS export?
    // Requirement: "Excel export (Admin Only)"
    // "Backend... GET /expenditure/export (admin)"
    // "Excel columns: Date | Item Name | Quantity Used..."
    // Usually easier to generate JSON here and let frontend SheetJS convert to file, 
    // OR generate CSV/XLSX buffer here. 
    // Given "SheetJS (xlsx)" is listed in Frontend Tech Stack but not explicitly Backend (except if I added it?),
    // I will return the rich JSON data needed for export.
    try {
        const { date } = req.query; // Optional filter
        let query = {};
        if (date) {
            const targetDate = new Date(date as string);
            query = { date: { $gte: getStartOfDay(targetDate), $lte: getEndOfDay(targetDate) } };
        }
        
        const data = await Expenditure.find(query).populate('itemId').populate('userId');
        
        // Transform for Export if needed, or send raw
        const exportData = data.map(exp => ({
            Date: new Date(exp.date).toLocaleDateString(),
            ItemName: (exp.itemId as any).name,
            QuantityUsed: exp.quantityUsed,
            CostPerUnit: (exp.itemId as any).costPerUnit,
            TotalCost: exp.quantityUsed * (exp.itemId as any).costPerUnit,
            User: (exp.userId as any).name
        }));
        
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting data' });
    }
}
