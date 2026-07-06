import mongoose from 'mongoose';

const participantProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  score: {
    type: Number,
    default: 0,
  },
  penalties: {
    type: Number,
    default: 0,
  },
  lastAcceptedAt: {
    type: Date,
    default: null,
  },
  solvedProblems: [
    {
      problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
      verdict: {
        type: String,
      },
      solvedAt: {
        type: Date,
      },
      timeTaken: {
        type: Number, // Seconds elapsed since battle started
      },
    },
  ],
});

const battleSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [participantProgressSchema],
    settings: {
      mode: {
        type: String,
        enum: ['topic', 'random', 'mixed'],
        default: 'random',
      },
      topics: [
        {
          type: String,
        },
      ],
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'mixed'],
        default: 'mixed',
      },
      questionCount: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed'],
      default: 'waiting',
    },
    maxParticipants: {
      type: Number,
      default: 10,
      max: 10,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Battle = mongoose.model('Battle', battleSchema);

export default Battle;
