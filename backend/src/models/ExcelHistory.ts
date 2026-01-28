import mongoose, { Schema, Document } from 'mongoose';

export interface IExcelHistory extends Document {
  userId: mongoose.Types.ObjectId;
  fileId: mongoose.Types.ObjectId;
  fileName: string;
  createdAt: Date;
}

const ExcelHistorySchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fileName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IExcelHistory>('ExcelHistory', ExcelHistorySchema);
