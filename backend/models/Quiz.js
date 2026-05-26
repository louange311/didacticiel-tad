const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  enonce: { type: String, required: true },
  options: [String], // 4 choix
  reponseCorrecte: { type: Number, required: true }, // index 0-3
  explication: String,
});

const QuizSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  titre: String,
  questions: [QuestionSchema],
  modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);