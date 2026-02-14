import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    lists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
    }],                                                       //Embedded ref for lists, as they are closely related to the board and often accessed together
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

const Board = mongoose.model('Board', boardSchema);

export default Board;