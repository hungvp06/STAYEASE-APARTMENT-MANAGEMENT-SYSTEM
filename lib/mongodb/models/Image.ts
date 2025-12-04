import mongoose, { Schema, Document, Types } from "mongoose";

export interface IImage extends Document {
  _id: Types.ObjectId;
  url: string;
  altText?: string;
  apartmentId?: Types.ObjectId;
  amenityId?: Types.ObjectId;
  userId?: Types.ObjectId;
  createdAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    altText: {
      type: String,
      trim: true,
    },
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
    },
    amenityId: {
      type: Schema.Types.ObjectId,
      ref: "Amenity",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
ImageSchema.index({ apartmentId: 1 });
ImageSchema.index({ amenityId: 1 });
ImageSchema.index({ userId: 1 });

export const Image =
  (mongoose.models?.Image as mongoose.Model<IImage>) ||
  mongoose.model<IImage>("Image", ImageSchema);
