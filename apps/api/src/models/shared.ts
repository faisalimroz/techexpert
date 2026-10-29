import { Schema } from 'mongoose';

export const SeoSchema = new Schema(
  { title: String, description: String, ogImage: String, canonical: String },
  { _id: false },
);
export const MediaSchema = new Schema(
  { url: { type: String, required: true }, alt: { type: String, default: '' }, width: Number, height: Number },
  { _id: false },
);
export const STATUS = ['draft', 'published', 'archived'] as const;

/** Clean JSON for the API: id instead of _id, no __v. */
export const toJSON = {
  virtuals: true,
  versionKey: false,
  transform(_doc: unknown, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
};
