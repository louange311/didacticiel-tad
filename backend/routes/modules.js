const express = require('express');
const router = express.Router();
const Module = require('../models/Module');
const auth = require('../middleware/auth');

// Lecture — tout le monde (élève, visiteur)
router.get('/', async (req, res) => {
  const modules = await Module.find({ estPublie: true });
  res.json(modules);
});

// Modification — prof et admin seulement
router.put('/:id', auth(['professeur', 'admin']), async (req, res) => {
  const module = await Module.findByIdAndUpdate(
    req.params.id,
    { ...req.body, modifiePar: req.user.id },
    { new: true }
  );
  res.json(module);
});

// Création — admin seulement
router.post('/', auth(['admin']), async (req, res) => {
  const module = new Module({ ...req.body, modifiePar: req.user.id });
  await module.save();
  res.status(201).json(module);
});

module.exports = router;