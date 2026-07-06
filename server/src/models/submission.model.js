import mongoose from 'mongoose';

const testCaseResultSchema = new mongoose.Schema({
  passed: {
    type: Boolean,
    required: true,
  },
  executionTime: {
    type: Number,
    required: true,
  },
  error: {
    type: String,
    default: null,
  },
});

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['cpp', 'java'],
    },
    code: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      required: true,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Time Limit Exceeded',
        'Runtime Error',
        'Compile Error',
        'System Error',
      ],
    },
    executionTime: {
      type: Number,
      required: true,
    },
    testCaseResults: [testCaseResultSchema],
  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
