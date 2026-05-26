const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Classe = require('../models/Classe');

// ===== INSCRIPTION =====
router.post('/inscription', async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, codeProfesseur, codeClasse } = req.body;

    // Vérification code professeur
    if (role === 'professeur') {
      if (codeProfesseur !== process.env.CODE_PROFESSEUR) {
        return res.status(403).json({ 
          message: '❌ Code professeur invalide !' 
        });
      }
    }

    // Vérification code classe pour les élèves
    if (role === 'eleve' && !codeClasse) {
      return res.status(400).json({ 
        message: '❌ Un code de classe est requis pour les élèves' 
      });
    }

    let classe = null;
    if (role === 'eleve') {
      classe = await Classe.findOne({ code: codeClasse.toUpperCase() });
      if (!classe) {
        return res.status(404).json({ 
          message: '❌ Code de classe invalide. Vérifie auprès de ton professeur.' 
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
    const statut = role === 'professeur' ? 'en_attente' : 'actif';

    const user = new User({ 
      nom, prenom, email, motDePasse, role, statut 
    });

    await user.hacherMotDePasse();
    await user.save();

    // Ajouter l'élève à la classe
    if (role === 'eleve' && classe) {
      classe.eleves.push(user._id);
      await classe.save();
    }

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
        badges: user.badges || [],
        classe: classe ? { nom: classe.nom, code: classe.code } : null
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

    // Récupérer la classe de l'élève
    let classe = null;
    if (user.role === 'eleve') {
      const foundClasse = await Classe.findOne({ eleves: user._id });
      if (foundClasse) {
        classe = { nom: foundClasse.nom, code: foundClasse.code };
      }
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
        badges: user.badges || [],
        classe
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

    // Récupérer la classe de l'élève
    let classe = null;
    if (user.role === 'eleve') {
      const foundClasse = await Classe.findOne({ eleves: user._id });
      if (foundClasse) {
        classe = { nom: foundClasse.nom, code: foundClasse.code };
      }
    }

    res.json({
      ...user.toObject(),
      badges: user.badges || [],
      classe
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;