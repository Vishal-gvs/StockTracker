import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  name: string;
  availableStock: number;
  costPerUnit: number;
}

const ItemSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  availableStock: { type: Number, required: true, default: 0 },
  costPerUnit: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export default mongoose.model<IItem>('Item', ItemSchema);
