const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['eleve', 'professeur', 'admin'], 
    default: 'eleve' 
  },
  statut: { 
    type: String, 
    enum: ['actif', 'en_attente', 'refuse'], 
    default: 'actif' 
  },
  badges: { type: [String], default: [] },
  pts: { type: Number, default: 0 },
  dateInscription: { type: Date, default: Date.now }
}, { timestamps: true });
UserSchema.methods.hacherMotDePasse = async function() {
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
};

UserSchema.methods.comparerMotDePasse = async function(motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};

module.exports = mongoose.model('User', UserSchema);