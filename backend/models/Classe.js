const mongoose = require('mongoose');

const ClasseSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  professeurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eleves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  modulesAssignes: [{
    type: String
  }],
  dateCreation: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Classe', ClasseSchema);