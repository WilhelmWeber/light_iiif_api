import mongoose, { Schema, Document } from "mongoose";

export interface manifestDoc extends Document {
    label: String,
    license: String,
    attribution: String,
    viewingDirection: String,
    discription: String,
    viewingHint: String,
    logo: String,
    seeAlso: String,
    userId: String,
};

const manifestSchema: Schema = new Schema(
    {
        label: {
            type: String,
            required: true,
        },
        license: {
            type: String,
            required: true,
        },
        attribution: {
            type: String,
            required: true,
        },
        viewingDirection: {
            type: String,
            required: true,
        },
        discription: {
            type: String,
            required: true,
        },
        viewingHint: {
            type: String,
        },
        logo: {
            type: String,
        },
        seeAlso: {
            type: String,
        },
        userId: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<manifestDoc>('manifests', manifestSchema);