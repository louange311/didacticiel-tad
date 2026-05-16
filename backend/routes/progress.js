const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Progression = require('../models/Progression');
const User = require('../models/User');

const BADGES = {
  'module0': '🥇 Maître des Fondements',
  'enregistrements': '🥇 Maître des Enregistrements',
  'listes': '🥇 Maître des Listes',
  'piles': '🥇 Maître des Piles',
  'files': '🥇 Maître des Files',
  'tableaux': '🥇 Maître des Tableaux',
  'arbres': '🥇 Maître des Arbres',
  'graphes': '🥇 Maître des Graphes',
};

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

router.post('/', verifierToken, async (req, res) => {
  try {
    const { moduleId, coursLu, exercicesScore, quizScore } = req.body;

    let progression = await Progression.findOne({ userId: req.user.id, moduleId });

    if (progression) {
      // ✅ On ne met à jour que les valeurs envoyées, on garde les autres
      if (coursLu !== undefined) progression.coursLu = coursLu;
      if (exercicesScore !== undefined) progression.exercicesScore = Math.max(exercicesScore, progression.exercicesScore || 0);
      if (quizScore !== undefined) progression.quizScore = Math.max(quizScore, progression.quizScore || 0);
    } else {
      progression = new Progression({
        userId: req.user.id,
        moduleId,
        coursLu: coursLu || false,
        exercicesScore: exercicesScore || 0,
        quizScore: quizScore || 0,
        pourcentage: 0
      });
    }

    // ✅ Calcul avec les valeurs finales combinées
    const pourcentage = Math.round(
  ((progression.coursLu ? 20 : 0) +
  (progression.exercicesScore || 0) * 0.2 +
  (progression.quizScore || 0) * 0.6)
);

    progression.pourcentage = pourcentage;
    if (pourcentage >= 100) progression.dateCompletion = new Date();
    await progression.save();

    // ✅ Badge si quizScore >= 80
    let nouveauBadge = null;
    if (quizScore >= 80 && BADGES[moduleId]) {
      const user = await User.findById(req.user.id);
      if (!user.badges.includes(BADGES[moduleId])) {
        user.badges.push(BADGES[moduleId]);
        await user.save();
        nouveauBadge = BADGES[moduleId];
      }
    }

    res.json({
      message: '✅ Progression sauvegardée !',
      progression,
      nouveauBadge
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/moi', verifierToken, async (req, res) => {
  try {
    const progressions = await Progression.find({ userId: req.user.id });
    res.json(progressions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/classe/:classeId', verifierToken, async (req, res) => {
  try {
    const Classe = require('../models/Classe');
    const classe = await Classe.findById(req.params.classeId);
    if (!classe) return res.status(404).json({ message: 'Classe introuvable' });

    const progressions = await Progression.find({
      userId: { $in: classe.eleves }
    }).populate('userId', 'nom prenom email');

    res.json(progressions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;