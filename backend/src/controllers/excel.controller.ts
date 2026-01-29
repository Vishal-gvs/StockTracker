import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { getGFS } from '../config/gridfs';
import { createAndStoreExcel, createAndStoreMonthlyExcel } from '../services/excel.service';
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

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params.id; // This is the fileId (GridFS ID) or History ID? 
    // Let's assume params.id is the GridFS fileId as used in download, OR the history _id?
    // In download it was fileId (GridFS). Let's stick to fileId (GridFS _id) for consistency, 
    // OR prefer History ID since we list History items.
    // The frontend lists history items which have `_id` (history ID) and `fileId` (GridFS ID).
    // Let's use fileId (GridFS ID) to match other routes, but searching by History ID is safer for ownership check.
    // Let's use the fileId passed from frontend. Frontend usually has access to both.
    // Let's assume param is `id` which corresponds to `fileId` in GridFS (consistent with download).
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ message: 'Invalid file ID' });
    }

    const gfs = getGFS();
    const _id = new mongoose.Types.ObjectId(fileId);

    // Find in History to verify ownership
    const historyRecord = await ExcelHistory.findOne({ fileId: _id, userId: req.user.id });
    if (!historyRecord) {
         // Try finding by history ID directly just in case? No, inconsistent. stick to fileId.
         return res.status(404).json({ message: 'Report not found or access denied' });
    }

    // Delete from GridFS
    try {
        await gfs.delete(_id);
    } catch (err) {
        console.warn(`GridFS delete failed (might be missing): ${_id}`, err);
    }

    // Delete from History
    await ExcelHistory.findByIdAndDelete(historyRecord._id);

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete Report Error:', error);
    res.status(500).json({ message: 'Server error deleting report' });
  }
};

export const generateMonthlyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
        return res.status(400).json({ message: 'Month and Year are required' });
    }

    const fileRecord: any = await createAndStoreMonthlyExcel(req.user.id, parseInt(month), parseInt(year));
    res.status(201).json({ message: 'Monthly report generated', fileId: fileRecord.fileId });
  } catch (error) {
    console.error('Generate Monthly Error:', error);
    res.status(500).json({ message: 'Server error generating monthly report' });
  }
};
