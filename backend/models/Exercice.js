const mongoose = require('mongoose');

const ExerciceSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  titre: { type: String, required: true },
  enonce: { type: String, required: true },
  solution: String, // visible seulement par prof/admin
  difficulte: { type: String, enum: ['facile', 'moyen', 'difficile'] },
  modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Exercice', ExerciceSchema);