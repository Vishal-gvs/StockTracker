import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: 'admin' | 'user';
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
