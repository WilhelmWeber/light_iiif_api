import mongoose, { Schema, Document } from "mongoose";
import formatEnum from "sharp";

export interface imageDoc extends Document {
    name: String,
    manifest_id: String,
    format: typeof formatEnum;
    width: Number,
    height: Number,
    output_name: String,
};

const imageSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        manifest_id: {
            type: String,
            required: true,
        },
        format: {
            type: String,
            required: true,
        },
        width: {
            type: Number,
            required: true,
        },
        height: {
            type: Number,
            required: true,
        },
        output_name: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<imageDoc>('images', imageSchema);