require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const seedDB = require('./seed/productSeeds');
const syncPinecone = require('./sync/syncPinecone');

const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

const {
  setupSwaggerUi,
  setupSwaggerJson,
} = require('./docs/swagger');

// Create Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect root to /api-docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Setup Swagger
setupSwaggerJson(app);
setupSwaggerUi(app);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', require('./routes/search'));
app.use('/api/auth', authRoutes);

// MongoDB connection
let mongoConnectionPromise = null;

async function connectToMongoDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not configured.');
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log('MongoDB Connected');
      })
      .catch((err) => {
        mongoConnectionPromise = null;
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  await mongoConnectionPromise;
}

// Ensure database connection before API requests
app.use(async (req, res, next) => {
  try {
    await connectToMongoDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).json({
      success: false,
      message: 'Database connection failed.',
    });
  }
});

// Local development server
if (require.main === module) {
  const PORT = process.env.BACKEND_PORT || process.env.PORT || 8000;

  connectToMongoDB()
    .then(async () => {
      console.log(`MongoDB connected. Starting local server on port ${PORT}.`);

      // Optional local database seeding
      const skipSeed = process.env.SKIP_SEED_ON_START === 'true';

      if (!skipSeed) {
        try {
          const forceSeed = process.env.FORCE_SEED_ON_START === 'true';

          const result = await seedDB({
            force: forceSeed,
            skipIfExists: !forceSeed,
          });

          if (result?.seeded) {
            console.log('🪴 Database seeded');
          } else if (result?.skipped) {
            console.log('🌱 Seed skipped (existing products retained)');
          }
        } catch (err) {
          console.error('❌ Seeding error:', err);
        }
      } else {
        console.log(
          '🌱 SKIP_SEED_ON_START enabled. Existing products preserved.'
        );
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server ready on port ${PORT}.`);
      });
    })
    .catch((err) => {
      console.error('❌ Failed to start local server:', err);
    });
  }

// Export Express app for Vercel
module.exports = app;
