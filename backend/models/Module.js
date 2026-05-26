const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  numero: { type: Number, required: true },
  titre: { type: String, required: true },
  description: String,
  contenu: { type: String, required: true }, // texte du cours
  objetifs: [String],
  estPublie: { type: Boolean, default: false },
  modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Module', ModuleSchema);