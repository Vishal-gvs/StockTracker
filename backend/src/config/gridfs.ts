import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let gfs: GridFSBucket;

mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db as any, {
    bucketName: 'excelFiles'
  });
  console.log('GridFS Bucket Initialized');
});

export const getGFS = () => {
    if (!gfs) {
        // Fallback if accessed before connection event, though app usually connects first
        if (mongoose.connection.readyState === 1) { // Connected
             gfs = new GridFSBucket(mongoose.connection.db as any, {
                bucketName: 'excelFiles'
            });
            return gfs;
        }
        throw new Error('GridFS Bucket not initialized yet');
    }
    return gfs;
};
