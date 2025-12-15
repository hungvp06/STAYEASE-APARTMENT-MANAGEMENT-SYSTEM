import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  apartmentId: Types.ObjectId;
  invoiceNumber: string;
  type: "rent" | "utilities" | "maintenance" | "parking" | "other";
  amount: number;
  issueDate: Date;
  dueDate: Date;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paidDate?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["rent", "utilities", "maintenance", "parking", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    paidDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// invoiceNumber already has unique index from schema definition
// Other indexes
InvoiceSchema.index({ userId: 1 });
InvoiceSchema.index({ apartmentId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ paidDate: 1 });

export const Invoice =
  (mongoose.models?.Invoice as mongoose.Model<IInvoice>) ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);
