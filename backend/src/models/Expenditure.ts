import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenditure extends Document {
  date: Date;
  itemId: mongoose.Schema.Types.ObjectId;
  quantityUsed: number;
  userId: mongoose.Schema.Types.ObjectId;
  finalized: boolean;
}

const ExpenditureSchema: Schema = new Schema({
  date: { type: Date, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantityUsed: { type: Number, required: true, min: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finalized: { type: Boolean, default: false },
}, { timestamps: true });

// Index for efficient querying by date
ExpenditureSchema.index({ date: 1 });

export default mongoose.model<IExpenditure>('Expenditure', ExpenditureSchema);
