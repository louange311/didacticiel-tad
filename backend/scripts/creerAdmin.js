require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function creerAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');

    // Vérifier si un admin existe déjà
    const adminExistant = await User.findOne({ role: 'admin' });
    if (adminExistant) {
      console.log('⚠️  Un admin existe déjà :', adminExistant.email);
      process.exit(0);
    }

    // Créer l'admin
    const admin = new User({
      nom: 'MEBAMSI',
      prenom: 'Lois',
      email: 'louangemebamsi@gmail.com',
      motDePasse: 'Admin2026!',
      role: 'admin',
      statut: 'actif'
    });

    await admin.hacherMotDePasse();
    await admin.save();

    console.log('✅ Admin créé avec succès !');
    console.log('   Email    :', admin.email);
    console.log('   Mot de passe : Admin2026!');
    console.log('   ⚠️  Change le mot de passe après la première connexion !');

  } catch (err) {
    console.error('❌ Erreur :', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

creerAdmin();