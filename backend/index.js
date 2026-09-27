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
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        !allowedOrigin ||
        cleanOrigin === allowedOrigin.replace(/\/$/, '') ||
        cleanOrigin === 'https://fusion-electronics-frontend01.vercel.app' ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB connection ────────────────────────────────────────────────────────
// Promise is created eagerly at module load so Vercel serverless
// cold-starts don't race against the first request.
let mongoConnectionPromise = null;

async function connectToMongoDB() {
  if (mongoose.connection.readyState === 1) {
    return; // already connected
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

// Kick off the connection immediately so it is ready before requests arrive.
// On Vercel serverless this runs at cold-start, removing the race condition.
if (process.env.MONGO_URI) {
  connectToMongoDB().catch(err =>
    console.error('Eager MongoDB connect failed:', err)
  );
}

// ─── IMPORTANT: DB middleware MUST come before routes ─────────────────────────
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

// ─── Static / Swagger routes ──────────────────────────────────────────────────
// Redirect root to /api-docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

setupSwaggerJson(app);
setupSwaggerUi(app);

// ─── API Routes ────────────────────────────────────────────────────────────────
// Health/Status endpoint for GET /api
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    status: 'online',
    message: 'Fusion Electronics API is running',
    version: '1.1.1',
    endpoints: {
      products: '/api/products',
      search: '/api/search?q={query}',
      checkout: '/api/checkout',
      orders: '/api/orders',
      auth: '/api/auth',
      docs: '/api-docs',
    },
  });
});

app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', require('./routes/search'));
app.use('/api/auth', authRoutes);

// Fallback mounts: if any client accidentally calls /api-docs/products etc., serve them gracefully
app.use('/api-docs/products', productRoutes);
app.use('/api-docs/checkout', checkoutRoutes);
app.use('/api-docs/orders', orderRoutes);
app.use('/api-docs/search', require('./routes/search'));
app.use('/api-docs/auth', authRoutes);

// ─── Local development server ─────────────────────────────────────────────────
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
