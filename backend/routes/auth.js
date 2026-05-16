const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ===== INSCRIPTION =====
router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, codeProfesseur } = req.body;

    // Vérification code professeur
    if (role === 'professeur') {
      if (codeProfesseur !== process.env.CODE_PROFESSEUR) {
        return res.status(403).json({ 
          message: 'Code professeur invalide !' 
        });
      }
    }

    // Vérifier email existant
    const existant = await User.findOne({ email });
    if (existant) {
      return res.status(400).json({ 
        message: 'Cet email est déjà utilisé.' 
      });
    }

    // Statut selon le rôle
    // Professeur → en_attente (doit être validé par admin)
    // Élève → actif directement
    const statut = role === 'professeur' ? 'en_attente' : 'actif';

    const user = new User({ 
      nom, prenom, email, motDePasse, role, statut 
    });

    await user.hacherMotDePasse();
    await user.save();

    // Si professeur → pas de token, attendre validation
    if (role === 'professeur') {
      return res.status(201).json({
        message: '✅ Demande envoyée ! Un administrateur va valider votre compte sous 24h.',
        enAttente: true
      });
    }

    // Si élève → connexion directe
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '✅ Inscription réussie !',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        badges: user.badges
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ===== CONNEXION =====
router.post('/connexion', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Email ou mot de passe incorrect.' 
      });
    }

    // Vérifier si compte en attente
    if (user.statut === 'en_attente') {
      return res.status(403).json({ 
        message: '⏳ Votre compte est en attente de validation par un administrateur.' 
      });
    }

    // Vérifier si compte refusé
    if (user.statut === 'refuse') {
      return res.status(403).json({ 
        message: '❌ Votre demande a été refusée. Contactez l\'administrateur.' 
      });
    }

    const ok = await user.comparerMotDePasse(motDePasse);
    if (!ok) {
      return res.status(400).json({ 
        message: 'Email ou mot de passe incorrect.' 
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '✅ Connexion réussie !',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        badges: user.badges
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ===== PROFIL =====
router.get('/profil', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non autorisé' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;