const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ================= AUTHENTICATION =================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT email, name, role FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length > 0) {
      res.json({ success: true, user: rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= DASHBOARD STATISTICS =================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Total & Status counts for metrics
    const [[{ total: totalV }] ] = await pool.query("SELECT COUNT(*) as total FROM vehicles WHERE status != 'Retired'");
    const [[{ active: activeV }]] = await pool.query("SELECT COUNT(*) as active FROM vehicles WHERE status = 'On Trip'");
    const [[{ avail: availV }]] = await pool.query("SELECT COUNT(*) as avail FROM vehicles WHERE status = 'Available'");
    const [[{ shop: shopV }]] = await pool.query("SELECT COUNT(*) as shop FROM vehicles WHERE status = 'In Shop'");
    
    const [[{ activeTrips }]] = await pool.query("SELECT COUNT(*) as activeTrips FROM trips WHERE status = 'Dispatched'");
    const [[{ pendingTrips }]] = await pool.query("SELECT COUNT(*) as pendingTrips FROM trips WHERE status = 'Draft'");
    const [[{ activeDrivers }]] = await pool.query("SELECT COUNT(*) as activeDrivers FROM drivers WHERE status IN ('Available', 'On Trip')");

    const utilization = totalV > 0 ? Math.round((activeV / totalV) * 100) : 0;

    // Charts: Status Breakdown
    const [statusData] = await pool.query("SELECT status, COUNT(*) as count FROM vehicles WHERE status != 'Retired' GROUP BY status");
    
    // Charts: Operational Expenses per vehicle
    const [expenseData] = await pool.query(`
      SELECT vehicleReg, 
             SUM(CASE WHEN type = 'Fuel' THEN amount ELSE 0 END) as fuel,
             SUM(CASE WHEN type = 'Maintenance' THEN amount ELSE 0 END) as maintenance,
             SUM(CASE WHEN type = 'Tolls' THEN amount ELSE 0 END) as tolls
      FROM expenses GROUP BY vehicleReg
    `);

    // Charts: Vehicle Fuel Efficiency (avg of completed trips: distance / fuelConsumed)
    const [efficiencyData] = await pool.query(`
      SELECT vehicleReg, ROUND(SUM(distance) / SUM(fuelConsumed), 2) as efficiency 
      FROM trips 
      WHERE status = 'Completed' AND fuelConsumed > 0 
      GROUP BY vehicleReg
    `);

    res.json({
      stats: {
        activeVehicles: activeV,
        availableVehicles: availV,
        maintenanceVehicles: shopV,
        utilization: `${utilization}%`,
        activeTrips,
        pendingTrips,
        driversOnDuty: activeDrivers
      },
      charts: {
        statusBreakdown: statusData,
        expenses: expenseData,
        efficiency: efficiencyData
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= VEHICLE REGISTRY =================
app.get('/api/vehicles', async (req, res) => {
  const { search, status } = req.query;
  let sql = "SELECT * FROM vehicles WHERE status != 'Retired'";
  const params = [];
  if (status && status !== 'all') {
    sql += " AND status = ?";
    params.push(status);
  }
  if (search) {
    sql += " AND (regNumber LIKE ? OR name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
  const { regNumber, name, type, maxCapacity, odometer, acquisitionCost, status, region } = req.body;
  try {
    await pool.query(
      'INSERT INTO vehicles (regNumber, name, type, maxCapacity, odometer, acquisitionCost, status, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [regNumber, name, type, maxCapacity, odometer, acquisitionCost, status || 'Available', region]
    );
    res.json({ success: true, message: 'Vehicle registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vehicles/:reg', async (req, res) => {
  const { name, type, maxCapacity, odometer, acquisitionCost, status, region } = req.body;
  try {
    await pool.query(
      'UPDATE vehicles SET name=?, type=?, maxCapacity=?, odometer=?, acquisitionCost=?, status=?, region=? WHERE regNumber=?',
      [name, type, maxCapacity, odometer, acquisitionCost, status, region, req.params.reg]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:reg', async (req, res) => {
  try {
    await pool.query('UPDATE vehicles SET status = "Retired" WHERE regNumber = ?', [req.params.reg]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock Documents for vehicles
app.get('/api/vehicles/:reg/documents', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documents WHERE vehicleReg = ?', [req.params.reg]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles/:reg/documents', async (req, res) => {
  const { name, type } = req.body;
  const docId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toISOString().split('T')[0];
  try {
    await pool.query(
      'INSERT INTO documents (id, vehicleReg, name, type, uploadDate, size) VALUES (?, ?, ?, ?, ?, ?)',
      [docId, req.params.reg, name, type, dateStr, '1.5 MB']
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= DRIVER DATABASE =================
app.get('/api/drivers', async (req, res) => {
  const { search, status } = req.query;
  let sql = "SELECT * FROM drivers";
  const params = [];
  const clauses = [];
  if (status && status !== 'all') {
    clauses.push("status = ?");
    params.push(status);
  }
  if (search) {
    clauses.push("(name LIKE ? OR licenseNumber LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (clauses.length > 0) {
    sql += " WHERE " + clauses.join(" AND ");
  }
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drivers', async (req, res) => {
  const { licenseNumber, name, category, expiryDate, contact, safetyScore, status } = req.body;
  try {
    await pool.query(
      'INSERT INTO drivers (licenseNumber, name, category, expiryDate, contact, safetyScore, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [licenseNumber, name, category, expiryDate, contact, safetyScore || 100, status || 'Available']
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/drivers/:license', async (req, res) => {
  const { name, category, expiryDate, contact, safetyScore, status } = req.body;
  try {
    await pool.query(
      'UPDATE drivers SET name=?, category=?, expiryDate=?, contact=?, safetyScore=?, status=? WHERE licenseNumber=?',
      [name, category, expiryDate, contact, safetyScore, status, req.params.license]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/drivers/:license', async (req, res) => {
  try {
    await pool.query('DELETE FROM drivers WHERE licenseNumber = ?', [req.params.license]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= TRIP OPERATIONS =================
app.get('/api/trips', async (req, res) => {
  const { search, status } = req.query;
  let sql = `
    SELECT t.*, v.name as vehicleName, d.name as driverName 
    FROM trips t
    JOIN vehicles v ON t.vehicleReg = v.regNumber
    JOIN drivers d ON t.driverLicense = d.licenseNumber
  `;
  const params = [];
  const clauses = [];
  if (status && status !== 'all') {
    clauses.push("t.status = ?");
    params.push(status);
  }
  if (search) {
    clauses.push("(t.id LIKE ? OR t.source LIKE ? OR t.destination LIKE ? OR t.vehicleReg LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (clauses.length > 0) {
    sql += " WHERE " + clauses.join(" AND ");
  }
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trips', async (req, res) => {
  const { source, destination, vehicleReg, driverLicense, cargoWeight, distance, revenue, recipientName, recipientPhone, deliveryAddress, packageCategory } = req.body;
  try {
    // 1. Mandatory Business Validations
    const [[vehicle]] = await pool.query('SELECT status, maxCapacity FROM vehicles WHERE regNumber = ?', [vehicleReg]);
    const [[driver]] = await pool.query('SELECT status, expiryDate FROM drivers WHERE licenseNumber = ?', [driverLicense]);

    if (!vehicle || vehicle.status !== 'Available') {
      return res.status(400).json({ success: false, message: 'Vehicle is retired, in maintenance, or already on trip.' });
    }
    if (!driver || driver.status !== 'Available') {
      return res.status(400).json({ success: false, message: 'Driver is off duty, suspended, or already on trip.' });
    }
    if (new Date(driver.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Driver has an expired license.' });
    }
    if (cargoWeight > vehicle.maxCapacity) {
      return res.status(400).json({ success: false, message: `Cargo weight exceeds vehicle capacity of ${vehicle.maxCapacity} kg.` });
    }

    const tripId = `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    await pool.query(
      'INSERT INTO trips (id, source, destination, vehicleReg, driverLicense, cargoWeight, distance, status, revenue, date, recipientName, recipientPhone, deliveryAddress, packageCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tripId, source, destination, vehicleReg, driverLicense, cargoWeight, distance, 'Draft', revenue, dateStr, recipientName, recipientPhone, deliveryAddress, packageCategory]
    );

    res.json({ success: true, tripId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Trip status (Handles automatic state transitions)
app.put('/api/trips/:id/status', async (req, res) => {
  const { status, finalOdometer, fuelConsumed } = req.body;
  const tripId = req.params.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[trip]] = await conn.query('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (!trip) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const currentStatus = trip.status;

    if (status === 'Dispatched' && currentStatus === 'Draft') {
      // Transition Vehicle & Driver status to "On Trip"
      await conn.query('UPDATE vehicles SET status = "On Trip" WHERE regNumber = ?', [trip.vehicleReg]);
      await conn.query('UPDATE drivers SET status = "On Trip" WHERE licenseNumber = ?', [trip.driverLicense]);
      await conn.query('UPDATE trips SET status = "Dispatched" WHERE id = ?', [tripId]);
      
    } else if (status === 'Completed' && currentStatus === 'Dispatched') {
      if (!finalOdometer || !fuelConsumed) {
        conn.release();
        return res.status(400).json({ success: false, message: 'Odometer and Fuel logs are required to complete a trip.' });
      }
      
      // Update Odometer and stats, release Vehicle & Driver status to "Available"
      await conn.query('UPDATE vehicles SET status = "Available", odometer = ? WHERE regNumber = ?', [finalOdometer, trip.vehicleReg]);
      await conn.query('UPDATE drivers SET status = "Available" WHERE licenseNumber = ?', [trip.driverLicense]);
      await conn.query('UPDATE trips SET status = "Completed", endOdometer = ?, fuelConsumed = ? WHERE id = ?', [finalOdometer, fuelConsumed, tripId]);

      // Record automatically generated Expenses
      const fuelCost = fuelConsumed * 1.75; // Average static mock rate
      const expId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
      const fuelId = `FUEL-${Math.floor(1000 + Math.random() * 9000)}`;
      const dateStr = new Date().toISOString().split('T')[0];

      await conn.query('INSERT INTO fuel_logs (id, vehicleReg, liters, cost, date) VALUES (?, ?, ?, ?, ?)', [fuelId, trip.vehicleReg, fuelConsumed, fuelCost, dateStr]);
      await conn.query('INSERT INTO expenses (id, vehicleReg, type, amount, date, notes) VALUES (?, ?, "Fuel", ?, ?, ?)', [expId, trip.vehicleReg, fuelCost, dateStr, `Automated log for trip completion: ${tripId}`]);

    } else if (status === 'Cancelled') {
      // Revert Vehicle & Driver status to "Available"
      if (currentStatus === 'Dispatched') {
        await conn.query('UPDATE vehicles SET status = "Available" WHERE regNumber = ?', [trip.vehicleReg]);
        await conn.query('UPDATE drivers SET status = "Available" WHERE licenseNumber = ?', [trip.driverLicense]);
      }
      await conn.query('UPDATE trips SET status = "Cancelled" WHERE id = ?', [tripId]);
    }

    await conn.commit();
    conn.release();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: error.message });
  }
});

// ================= VEHICLE MAINTENANCE =================
app.get('/api/maintenance', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM maintenance_logs');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  const { vehicleReg, serviceType, cost, startDate, notes } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const serviceId = `MNT-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Create Log
    await conn.query(
      'INSERT INTO maintenance_logs (id, vehicleReg, serviceType, cost, startDate, status, notes) VALUES (?, ?, ?, ?, ?, "Active", ?)',
      [serviceId, vehicleReg, serviceType, cost, startDate, notes]
    );
    
    // Auto shift status of vehicle to "In Shop"
    await conn.query('UPDATE vehicles SET status = "In Shop" WHERE regNumber = ?', [vehicleReg]);
    
    // Add transaction to expenses
    const expId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    await conn.query(
      'INSERT INTO expenses (id, vehicleReg, type, amount, date, notes) VALUES (?, ?, "Maintenance", ?, ?, ?)',
      [expId, vehicleReg, cost, startDate, `Service job ${serviceId}`]
    );

    await conn.commit();
    conn.release();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/maintenance/:id/close', async (req, res) => {
  const { endDate } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[log]] = await conn.query('SELECT vehicleReg FROM maintenance_logs WHERE id = ?', [req.params.id]);
    if (log) {
      await conn.query('UPDATE maintenance_logs SET status = "Completed", endDate = ? WHERE id = ?', [endDate, req.params.id]);
      
      // Auto restore vehicle status back to "Available"
      await conn.query('UPDATE vehicles SET status = "Available" WHERE regNumber = ?', [log.vehicleReg]);
    }

    await conn.commit();
    conn.release();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: error.message });
  }
});

// ================= FUEL & EXPENSE REGISTRY =================
app.get('/api/expenses', async (req, res) => {
  const { vehicle } = req.query;
  let sql = 'SELECT * FROM expenses';
  const params = [];
  if (vehicle && vehicle !== 'all') {
    sql += ' WHERE vehicleReg = ?';
    params.push(vehicle);
  }
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { vehicleReg, type, amount, date, notes } = req.body;
  const expId = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    await pool.query(
      'INSERT INTO expenses (id, vehicleReg, type, amount, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [expId, vehicleReg, type, amount, date, notes]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= SYSTEM NOTIFICATIONS =================
app.get('/api/notifications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run Server
app.listen(PORT, () => {
  console.log(`TransitOps server listening on http://localhost:${PORT}`);
});