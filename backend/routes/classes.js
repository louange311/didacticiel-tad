const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Classe = require('../models/Classe');
const User = require('../models/User');

// Middleware vérification token
const verifierToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Non autorisé' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Vérifier rôle professeur
const estProfesseur = (req, res, next) => {
  if (req.user.role !== 'professeur') {
    return res.status(403).json({ message: 'Accès réservé aux professeurs' });
  }
  next();
};

// Générer code classe unique
const genererCode = () => {
  const lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const chiffres = '0123456789';
  let code = '';
  for (let i = 0; i < 3; i++) code += lettres[Math.floor(Math.random() * lettres.length)];
  for (let i = 0; i < 3; i++) code += chiffres[Math.floor(Math.random() * chiffres.length)];
  return code;
};

// Créer une classe
router.post('/', verifierToken, estProfesseur, async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ message: 'Nom de classe requis' });

    let code = genererCode();
    while (await Classe.findOne({ code })) {
      code = genererCode();
    }

    const classe = new Classe({
      nom,
      code,
      professeurId: req.user.id
    });
    await classe.save();

    res.status(201).json({
      message: '✅ Classe créée !',
      classe: { id: classe._id, nom: classe.nom, code: classe.code }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Lister mes classes (professeur)
router.get('/mes-classes', verifierToken, estProfesseur, async (req, res) => {
  try {
    const classes = await Classe.find({ professeurId: req.user.id })
      .populate('eleves', 'nom prenom email');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Rejoindre une classe (élève)
router.post('/rejoindre', verifierToken, async (req, res) => {
  try {
    const { code } = req.body;
    const classe = await Classe.findOne({ code: code.toUpperCase() });
    if (!classe) return res.status(404).json({ message: 'Code classe invalide' });

    if (classe.eleves.includes(req.user.id)) {
      return res.status(400).json({ message: 'Vous êtes déjà dans cette classe' });
    }

    classe.eleves.push(req.user.id);
    await classe.save();

    res.json({ message: '✅ Classe rejointe !', classe: { nom: classe.nom, code: classe.code } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Voir les élèves d'une classe
router.get('/:code', verifierToken, estProfesseur, async (req, res) => {
  try {
    const classe = await Classe.findOne({ code: req.params.code })
      .populate('eleves', 'nom prenom email badges');

    if (!classe) return res.status(404).json({ message: 'Classe introuvable' });

    if (classe.professeurId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.json(classe);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer une classe
router.delete('/:code', verifierToken, estProfesseur, async (req, res) => {
  try {
    const classe = await Classe.findOne({ code: req.params.code });
    if (!classe) return res.status(404).json({ message: 'Classe introuvable' });

    if (classe.professeurId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    await Classe.deleteOne({ code: req.params.code });
    res.json({ message: '✅ Classe supprimée !' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;