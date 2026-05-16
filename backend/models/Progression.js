const mongoose = require('mongoose');

const ProgressionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleId: {
    type: String,
    required: true
  },
  coursLu: {
    type: Boolean,
    default: false
  },
  exercicesScore: {
    type: Number,
    default: 0
  },
  quizScore: {
    type: Number,
    default: 0
  },
  quizTentatives: {
    type: Number,
    default: 0
  },
  pourcentage: {
    type: Number,
    default: 0
  },
  dateCompletion: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Progression', ProgressionSchema);