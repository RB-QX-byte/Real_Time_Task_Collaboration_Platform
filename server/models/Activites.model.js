import mongoose from "mongoose";

const activitesSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
    },
    details: {
        type: String,
    },
    timestamps: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

const Activites = mongoose.model('Activites', activitesSchema);

export default Activites;