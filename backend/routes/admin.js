const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware admin uniquement
const verifierAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non autorisé' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé à l\'administrateur' });
    }

    req.admin = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// ===== VOIR TOUS LES PROFS EN ATTENTE =====
router.get('/profs-en-attente', verifierAdmin, async (req, res) => {
  try {
    const profs = await User.find({ 
      role: 'professeur', 
      statut: 'en_attente' 
    }).select('-motDePasse');

    res.json({ 
      total: profs.length, 
      profs 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ===== VALIDER UN PROFESSEUR =====
router.put('/valider-prof/:id', verifierAdmin, async (req, res) => {
  try {
    const prof = await User.findById(req.params.id);
    
    if (!prof) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    if (prof.role !== 'professeur') {
      return res.status(400).json({ message: 'Cet utilisateur n\'est pas un professeur' });
    }

    prof.statut = 'actif';
    await prof.save();

    res.json({ 
      message: `✅ Le compte de ${prof.prenom} ${prof.nom} a été validé !`,
      prof: { id: prof._id, nom: prof.nom, prenom: prof.prenom, email: prof.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ===== REFUSER UN PROFESSEUR =====
router.put('/refuser-prof/:id', verifierAdmin, async (req, res) => {
  try {
    const prof = await User.findById(req.params.id);
    if (!prof) return res.status(404).json({ message: 'Introuvable' });

    prof.statut = 'refuse';
    await prof.save();

    res.json({ message: `❌ Le compte de ${prof.prenom} ${prof.nom} a été refusé.` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ===== TRANSFÉRER LE RÔLE ADMIN =====
router.put('/transferer-admin/:id', verifierAdmin, async (req, res) => {
  try {
    const nouvelAdmin = await User.findById(req.params.id);
    if (!nouvelAdmin) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Retirer le rôle admin à l'admin actuel
    req.admin.role = 'professeur';
    await req.admin.save();

    // Donner le rôle admin au nouvel admin
    nouvelAdmin.role = 'admin';
    nouvelAdmin.statut = 'actif';
    await nouvelAdmin.save();

    res.json({ 
      message: `✅ Le rôle admin a été transféré à ${nouvelAdmin.prenom} ${nouvelAdmin.nom}.`,
      nouvelAdmin: { id: nouvelAdmin._id, nom: nouvelAdmin.nom, email: nouvelAdmin.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ===== VOIR TOUS LES UTILISATEURS =====
router.get('/tous-les-utilisateurs', verifierAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-motDePasse');
    res.json({ total: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;