import mongoose from 'mongoose';

const ListsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],                                                       //Embedded ref for tasks, as they are closely related to the list and often accessed together
    position: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

const Lists = mongoose.model('List', ListsSchema);

export default Lists;
