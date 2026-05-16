const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifierToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé — token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    req.user = user;
    next();

  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

const estProfesseur = (req, res, next) => {
  if (req.user.role !== 'professeur') {
    return res.status(403).json({ 
      message: 'Accès réservé aux professeurs' 
    });
  }
  next();
};

const estEleve = (req, res, next) => {
  if (req.user.role !== 'eleve') {
    return res.status(403).json({ 
      message: 'Accès réservé aux élèves' 
    });
  }
  next();
};

module.exports = { verifierToken, estProfesseur, estEleve };