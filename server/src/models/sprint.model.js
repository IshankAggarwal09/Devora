import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    goal: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'planning',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Sprint = mongoose.model('Sprint', sprintSchema);

export default Sprint;
