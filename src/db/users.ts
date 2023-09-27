import mongoose, { Schema, Document } from "mongoose";

export interface userDoc extends Document {
    username: String,
    password: String,
};

const userSchema: Schema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<userDoc>('users', userSchema);