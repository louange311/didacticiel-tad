const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const classeRoutes = require('./routes/classes');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware CORS
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/classes', classeRoutes);
app.use('/api/admin', adminRoutes);

// Route test
app.get('/', (req, res) => {
  res.json({ message: '✅ Serveur Didacticiel TAD opérationnel !' });
});

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connecté !');
    app.listen(process.env.PORT, () => {
      console.log(`✅ Serveur lancé sur le port ${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB :', err.message);
  });