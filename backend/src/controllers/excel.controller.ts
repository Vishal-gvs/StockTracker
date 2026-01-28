import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { getGFS } from '../config/gridfs';
import { createAndStoreExcel } from '../services/excel.service';
import ExcelHistory from '../models/ExcelHistory';

// Extend Request to include user (added by auth middleware)
interface AuthRequest extends Request {
  user?: any;
}

export const generateExcel = async (req: AuthRequest, res: Response) => {
  try {
    const fileRecord: any = await createAndStoreExcel(req.user.id, new Date());
    res.status(201).json({ message: 'Excel file generated', fileId: fileRecord.fileId });
  } catch (error) {
    console.error('Generate Excel Error:', error);
    res.status(500).json({ message: 'Server error generating excel' });
  }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const history = await ExcelHistory.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
};

export const downloadExcel = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ message: 'Invalid file ID' });
    }

    const gfs = getGFS();
    const _id = new mongoose.Types.ObjectId(fileId);

    // Check if file exists first to avoid crashing on stream error
    const files = await gfs.find({ _id }).toArray();
    if (!files || files.length === 0) {
        return res.status(404).json({ message: 'File not found' });
    }

    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename="${files[0].filename}"`);

    const downloadStream = gfs.openDownloadStream(_id);
    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
        console.error('Download Stream Error:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error downloading file' });
        }
    });

  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
