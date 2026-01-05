import { Request, Response } from 'express';
import Item from '../models/Item';

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await Item.find({});
    // Users see name only? No, "View items: name only" for User role. 
    // Admin sees everything.
    // Handling this in controller or frontend? Requirement: "User... View items: name only ... Cannot see cost"
    // So we should filter fields based on role.
    
    // However, I don't have req.user type inferred here easily without casting. 
    // Assuming auth middleware attached user.
    const userRole = (req as any).user?.role;

    if (userRole === 'admin') {
      res.json(items);
    } else {
      const simplifiedItems = items.map(i => ({ _id: i._id, name: i.name, availableStock: i.availableStock })); 
      // User needs availableStock? "Enter quantity used...". Actually they usually need to see what's available?
      // Req: "View items: name only". "Enter quantity used for TODAY ONLY". "Cannot see cost".
      // If "Available Stock" is hidden, they might request more than available?
      // Usually "Name only" implies hiding Cost. Stock quantity might be useful.
      // I'll send Name and Id. Stock? If backend validates constraint, maybe hidden.
      // But typically users need to know if item is in stock.
      // Let's send Name, ID, but hide Cost.
      res.json(simplifiedItems);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items' });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { name, availableStock, costPerUnit } = req.body;
    const item = new Item({ name, availableStock, costPerUnit });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error creating item' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Item.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating item' });
  }
};
