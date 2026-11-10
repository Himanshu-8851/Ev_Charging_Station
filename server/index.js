const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Open SQLite database connection
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database successfully!');
  }
});

// Setup tables and seed sample data
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      name TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS connectors (
      id TEXT PRIMARY KEY,
      station_id TEXT,
      bay_number TEXT,
      plug_type TEXT,
      max_power_kw REAL,
      price_per_kwh REAL,
      status TEXT,
      FOREIGN KEY(station_id) REFERENCES stations(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      connectorId TEXT,
      startTime TEXT,
      endTime TEXT,
      totalPrice REAL,
      status TEXT DEFAULT 'CONFIRMED',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed sample data if empty
  db.get('SELECT COUNT(*) as count FROM stations', (err, row) => {
    if (row && row.count === 0) {
      console.log('Seeding initial station and connector data...');

      const stmtStation = db.prepare(`INSERT INTO stations (id, name, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)`);
      stmtStation.run('st-1', 'VoltHub Supercharger - Connaught Place', 'Inner Circle, CP, New Delhi', 28.6280, 77.2090);
      stmtStation.run('st-2', 'GreenCharge Hub - Rohini', 'Sector 14, Rohini, New Delhi', 28.7041, 77.1025);
      stmtStation.finalize();

      const stmtConnector = db.prepare(`INSERT INTO connectors (id, station_id, bay_number, plug_type, max_power_kw, price_per_kwh, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      stmtConnector.run('c-1', 'st-1', 'BAY-01', 'CCS2', 150, 0.35, 'AVAILABLE');
      stmtConnector.run('c-2', 'st-1', 'BAY-02', 'Type 2', 22, 0.22, 'AVAILABLE');
      stmtConnector.run('c-3', 'st-2', 'BAY-01', 'CCS2', 240, 0.40, 'AVAILABLE');
      stmtConnector.run('c-4', 'st-2', 'BAY-02', 'CHAdeMO', 50, 0.28, 'OCCUPIED');
      stmtConnector.finalize();
    }
  });
});

// API Routes
app.get('/api/stations', (req, res) => {
  db.all('SELECT * FROM stations', [], (err, stations) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all('SELECT * FROM connectors', [], (err, connectors) => {
      if (err) return res.status(500).json({ error: err.message });

      const result = stations.map(station => ({
        ...station,
        connectors: connectors.filter(c => c.station_id === station.id)
      }));

      res.json(result);
    });
  });
});

app.post('/api/book', (req, res) => {
  const { userId, connectorId, startTime, endTime, totalPrice } = req.body;

  if (!userId || !connectorId) {
    return res.status(400).json({ error: 'Missing required booking details.' });
  }

  db.run(
    `INSERT INTO bookings (userId, connectorId, startTime, endTime, totalPrice, status) VALUES (?, ?, ?, ?, ?, 'CONFIRMED')`,
    [userId, connectorId, startTime, endTime, totalPrice],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run(`UPDATE connectors SET status = 'OCCUPIED' WHERE id = ?`, [connectorId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, bookingId: this.lastID });
      });
    }
  );
});

// Serve frontend static files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Dynamic PORT for cloud hosting or local fallback
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server active on port ${PORT}`);
});