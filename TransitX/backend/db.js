const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const net = require('net');
require('dotenv').config();

let realPool = null;
let isFallback = false;
let mockDbData = null;
const mockDbPath = path.join(__dirname, 'db.json');

// Initial seed data for fallback
const initialSeedData = {
  users: [
    { email: 'manager@transitops.com', password: 'admin123', name: 'Sarah Connor', role: 'Fleet Manager' },
    { email: 'driver@transitops.com', password: 'driver123', name: 'Alex Mercer', role: 'Driver' },
    { email: 'safety@transitops.com', password: 'safety123', name: 'Marcus Wright', role: 'Safety Officer' },
    { email: 'analyst@transitops.com', password: 'analyst123', name: 'Elena Fisher', role: 'Financial Analyst' }
  ],
  vehicles: [
    { regNumber: 'VAN-05', name: 'Ford Transit 2022', type: 'Van', maxCapacity: 500, odometer: 12500, acquisitionCost: 32000.00, status: 'Available', region: 'North' },
    { regNumber: 'TRK-12', name: 'Volvo FH16 Heavy Duty', type: 'Truck', maxCapacity: 5000, odometer: 85000, acquisitionCost: 115000.00, status: 'Available', region: 'South' },
    { regNumber: 'SED-01', name: 'Toyota Camry 2021', type: 'Sedan', maxCapacity: 300, odometer: 45000, acquisitionCost: 24000.00, status: 'Available', region: 'East' },
    { regNumber: 'SUV-08', name: 'Chevrolet Suburban', type: 'SUV', maxCapacity: 800, odometer: 62000, acquisitionCost: 55000.00, status: 'In Shop', region: 'West' },
    { regNumber: 'TRK-09', name: 'Scania R500', type: 'Truck', maxCapacity: 4500, odometer: 112000, acquisitionCost: 98000.00, status: 'Retired', region: 'North' }
  ],
  drivers: [
    { licenseNumber: 'DL-837482', name: 'Alex Mercer', category: 'Class A', expiryDate: '2027-10-15', contact: '+1-555-0199', safetyScore: 92, status: 'Available' },
    { licenseNumber: 'DL-928472', name: 'Sarah Connor', category: 'Class B', expiryDate: '2026-03-20', contact: '+1-555-0144', safetyScore: 95, status: 'Available' },
    { licenseNumber: 'DL-118273', name: 'Bob Miller', category: 'Class C', expiryDate: '2027-01-10', contact: '+1-555-0182', safetyScore: 68, status: 'Suspended' },
    { licenseNumber: 'DL-554829', name: 'John Doe', category: 'Class A', expiryDate: '2025-06-01', contact: '+1-555-0122', safetyScore: 88, status: 'Available' },
    { licenseNumber: 'DL-773829', name: 'Elena Fisher', category: 'Class C', expiryDate: '2028-12-05', contact: '+1-555-0155', safetyScore: 99, status: 'Off Duty' }
  ],
  trips: [
    { id: 'TRIP-1001', source: 'Warehouse A (Chicago)', destination: 'Distribution Center B (Detroit)', vehicleReg: 'VAN-05', driverLicense: 'DL-837482', driverName: 'Alex Mercer', cargoWeight: 420, distance: 450, status: 'Completed', revenue: 1200.00, fuelConsumed: 45.00, endOdometer: 12500, date: '2026-07-01', recipientName: 'John Smith', recipientPhone: '+1-555-0210', deliveryAddress: '789 Detroit St, Detroit, MI', packageCategory: 'Standard Cargo' },
    { id: 'TRIP-1002', source: 'Port of Seattle', destination: 'Logistics Hub (Spokane)', vehicleReg: 'TRK-12', driverLicense: 'DL-928472', driverName: 'Sarah Connor', cargoWeight: 4500, distance: 350, status: 'Completed', revenue: 4500.00, fuelConsumed: 120.00, endOdometer: 85000, date: '2026-07-05', recipientName: 'Alice Johnson', recipientPhone: '+1-555-0211', deliveryAddress: '456 Spokane Way, Spokane, WA', packageCategory: 'Cold Chain' },
    { id: 'TRIP-1003', source: 'Dallas Depot', destination: 'Austin Retail Outlet', vehicleReg: 'SED-01', driverLicense: 'DL-837482', driverName: 'Alex Mercer', cargoWeight: 150, distance: 300, status: 'Completed', revenue: 600.00, fuelConsumed: 21.00, endOdometer: 45000, date: '2026-07-09', recipientName: 'Robert Brown', recipientPhone: '+1-555-0212', deliveryAddress: '123 Austin Ave, Austin, TX', packageCategory: 'Fragile' },
    { id: 'TRIP-1004', source: 'Boston Port', destination: 'New York Warehouse', vehicleReg: 'VAN-05', driverLicense: 'DL-837482', driverName: 'Alex Mercer', cargoWeight: 300, distance: 350, status: 'Draft', revenue: 950.00, fuelConsumed: 0.00, endOdometer: 0, date: '2026-07-11', recipientName: 'Emily Davis', recipientPhone: '+1-555-0213', deliveryAddress: '999 New York Blvd, New York, NY', packageCategory: 'Standard Cargo' }
  ],
  maintenance_logs: [
    { id: 'MNT-2001', vehicleReg: 'SUV-08', serviceType: 'Brake Pad Replacement & Engine Oil Change', cost: 450.00, startDate: '2026-07-10', endDate: null, status: 'Active', notes: 'Squeaking noises reported by driver Bob. Replaced front brake pads and flushed engine oil.' },
    { id: 'MNT-2002', vehicleReg: 'VAN-05', serviceType: 'Routine 10k Oil Change & Filter Renewal', cost: 150.00, startDate: '2026-06-15', endDate: '2026-06-16', status: 'Completed', notes: 'Standard logbook maintenance.' }
  ],
  expenses: [
    { id: 'EXP-4001', vehicleReg: 'VAN-05', type: 'Fuel', amount: 72.00, date: '2026-07-02', notes: 'Fuel fillup for TRIP-1001' },
    { id: 'EXP-4002', vehicleReg: 'VAN-05', type: 'Maintenance', amount: 150.00, date: '2026-06-16', notes: 'Routine 10k service cost' },
    { id: 'EXP-4003', vehicleReg: 'TRK-12', type: 'Fuel', amount: 216.00, date: '2026-07-06', notes: 'Fuel fillup for TRIP-1002' },
    { id: 'EXP-4004', vehicleReg: 'TRK-12', type: 'Tolls', amount: 45.00, date: '2026-07-05', notes: 'Highway Toll charges' },
    { id: 'EXP-4005', vehicleReg: 'SED-01', type: 'Fuel', amount: 33.60, date: '2026-07-09', notes: 'Fuel fillup for TRIP-1003' },
    { id: 'EXP-4006', vehicleReg: 'SUV-08', type: 'Maintenance', amount: 450.00, date: '2026-07-10', notes: 'Active brake job charges' }
  ],
  documents: [
    { id: 'DOC-5001', vehicleReg: 'VAN-05', name: 'Registration_Cert.pdf', type: 'Registration', uploadDate: '2026-01-10', size: '1.2 MB' },
    { id: 'DOC-5002', vehicleReg: 'VAN-05', name: 'Insurance_Policy_2026.pdf', type: 'Insurance', uploadDate: '2026-01-12', size: '2.4 MB' },
    { id: 'DOC-5003', vehicleReg: 'TRK-12', name: 'Annual_Inspection_Report.pdf', type: 'Inspection', uploadDate: '2026-03-05', size: '850 KB' }
  ],
  notifications: [
    { id: 'NOT-001', title: 'License Renewal Required', message: 'Driver John Doe (DL-554829) license expired on 2025-06-01.', type: 'danger', date: '2026-07-11', is_read: false },
    { id: 'NOT-002', title: 'License Expiring Soon', message: 'Driver Sarah Connor (DL-928472) license expires on 2026-03-20.', type: 'warning', date: '2026-07-11', is_read: false },
    { id: 'NOT-003', title: 'Scheduled Maintenance Lockout', message: 'Vehicle SUV-08 status changed to In Shop for active maintenance log.', type: 'info', date: '2026-07-10', is_read: true }
  ]
};

// Function to load mock db
function getMockDb() {
  if (mockDbData) return mockDbData;
  if (fs.existsSync(mockDbPath)) {
    try {
      mockDbData = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      return mockDbData;
    } catch (e) {
      console.error('Error reading mock db, resetting:', e);
    }
  }
  mockDbData = JSON.parse(JSON.stringify(initialSeedData));
  fs.writeFileSync(mockDbPath, JSON.stringify(mockDbData, null, 2), 'utf8');
  return mockDbData;
}

function saveMockDb() {
  if (mockDbData) {
    fs.writeFileSync(mockDbPath, JSON.stringify(mockDbData, null, 2), 'utf8');
  }
}

// SQL query evaluation mapping logic
async function mockQuery(sql, params = []) {
  const data = getMockDb();
  sql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT users
  if (sql.includes('SELECT email, name, role FROM users')) {
    const user = data.users.find(u => u.email.toLowerCase() === params[0].toLowerCase() && u.password === params[1]);
    return [user ? [user] : []];
  }

  // 2. Dashboard statistics
  if (sql.includes("SELECT COUNT(*) as total FROM vehicles WHERE status != 'Retired'")) {
    const total = data.vehicles.filter(v => v.status !== 'Retired').length;
    return [[{ total }]];
  }
  if (sql.includes("SELECT COUNT(*) as active FROM vehicles WHERE status = 'On Trip'")) {
    const active = data.vehicles.filter(v => v.status === 'On Trip').length;
    return [[{ active }]];
  }
  if (sql.includes("SELECT COUNT(*) as avail FROM vehicles WHERE status = 'Available'")) {
    const avail = data.vehicles.filter(v => v.status === 'Available').length;
    return [[{ avail }]];
  }
  if (sql.includes("SELECT COUNT(*) as shop FROM vehicles WHERE status = 'In Shop'")) {
    const shop = data.vehicles.filter(v => v.status === 'In Shop').length;
    return [[{ shop }]];
  }
  if (sql.includes("SELECT COUNT(*) as activeTrips FROM trips WHERE status = 'Dispatched'")) {
    const activeTrips = data.trips.filter(t => t.status === 'Dispatched').length;
    return [[{ activeTrips }]];
  }
  if (sql.includes("SELECT COUNT(*) as pendingTrips FROM trips WHERE status = 'Draft'")) {
    const pendingTrips = data.trips.filter(t => t.status === 'Draft').length;
    return [[{ pendingTrips }]];
  }
  if (sql.includes("SELECT COUNT(*) as activeDrivers FROM drivers")) {
    const activeDrivers = data.drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;
    return [[{ activeDrivers }]];
  }
  if (sql.includes("SELECT status, COUNT(*) as count FROM vehicles WHERE status != 'Retired' GROUP BY status")) {
    const statuses = {};
    data.vehicles.filter(v => v.status !== 'Retired').forEach(v => {
      statuses[v.status] = (statuses[v.status] || 0) + 1;
    });
    return [Object.keys(statuses).map(status => ({ status, count: statuses[status] }))];
  }
  if (sql.includes("SUM(CASE WHEN type = 'Fuel' THEN amount")) {
    const groups = {};
    data.expenses.forEach(e => {
      if (!groups[e.vehicleReg]) groups[e.vehicleReg] = { vehicleReg: e.vehicleReg, fuel: 0, maintenance: 0, tolls: 0 };
      if (e.type === 'Fuel') groups[e.vehicleReg].fuel += parseFloat(e.amount);
      else if (e.type === 'Maintenance') groups[e.vehicleReg].maintenance += parseFloat(e.amount);
      else if (e.type === 'Tolls') groups[e.vehicleReg].tolls += parseFloat(e.amount);
    });
    return [Object.values(groups)];
  }
  if (sql.includes("SUM(distance) / SUM(fuelConsumed)")) {
    const groups = {};
    data.trips.filter(t => t.status === 'Completed' && parseFloat(t.fuelConsumed) > 0).forEach(t => {
      if (!groups[t.vehicleReg]) groups[t.vehicleReg] = { vehicleReg: t.vehicleReg, distance: 0, fuelConsumed: 0 };
      groups[t.vehicleReg].distance += parseFloat(t.distance);
      groups[t.vehicleReg].fuelConsumed += parseFloat(t.fuelConsumed);
    });
    const result = Object.values(groups).map(g => ({
      vehicleReg: g.vehicleReg,
      efficiency: Math.round((g.distance / g.fuelConsumed) * 100) / 100
    }));
    return [result];
  }

  // 3. Vehicles Registry
  if (sql.includes('SELECT * FROM vehicles WHERE status != \'Retired\'')) {
    let result = data.vehicles.filter(v => v.status !== 'Retired');
    if (sql.includes('status = ?')) {
      const statusIdx = sql.indexOf('status = ?');
      const searchIdx = sql.indexOf('(regNumber LIKE ? OR name LIKE ?)');
      let statusVal = params[0];
      let searchVal = params[1];
      if (statusIdx > searchIdx && searchIdx !== -1) {
        statusVal = params[2];
        searchVal = params[0];
      }
      if (statusVal && statusVal !== 'all') {
        result = result.filter(v => v.status === statusVal);
      }
      if (searchVal) {
        const queryStr = searchVal.replace(/%/g, '').toLowerCase();
        result = result.filter(v => v.regNumber.toLowerCase().includes(queryStr) || v.name.toLowerCase().includes(queryStr));
      }
    } else {
      if (params.length > 0) {
        if (params.length === 1 && !sql.includes('regNumber = ?')) {
          const statusVal = params[0];
          if (statusVal && statusVal !== 'all') result = result.filter(v => v.status === statusVal);
        } else if (params.length === 2) {
          const searchVal = params[0].replace(/%/g, '').toLowerCase();
          result = result.filter(v => v.regNumber.toLowerCase().includes(searchVal) || v.name.toLowerCase().includes(searchVal));
        }
      }
    }
    return [result];
  }
  if (sql.includes('SELECT * FROM vehicles WHERE regNumber = ?')) {
    const v = data.vehicles.find(x => x.regNumber === params[0]);
    return [v ? [v] : []];
  }
  if (sql.includes('INSERT INTO vehicles')) {
    const [regNumber, name, type, maxCapacity, odometer, acquisitionCost, status, region] = params;
    const exists = data.vehicles.findIndex(x => x.regNumber === regNumber);
    const newV = { regNumber, name, type, maxCapacity: parseInt(maxCapacity), odometer: parseInt(odometer), acquisitionCost: parseFloat(acquisitionCost), status, region };
    if (exists !== -1) {
      data.vehicles[exists] = newV;
    } else {
      data.vehicles.push(newV);
    }
    saveMockDb();
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('UPDATE vehicles SET name = ?, type = ?, maxCapacity = ?, odometer = ?, acquisitionCost = ?, region = ?, status = ? WHERE regNumber = ?')) {
    const [name, type, maxCapacity, odometer, acquisitionCost, region, status, regNumber] = params;
    const idx = data.vehicles.findIndex(x => x.regNumber === regNumber);
    if (idx !== -1) {
      data.vehicles[idx] = { ...data.vehicles[idx], name, type, maxCapacity: parseInt(maxCapacity), odometer: parseInt(odometer), acquisitionCost: parseFloat(acquisitionCost), region, status };
      saveMockDb();
    }
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('UPDATE vehicles SET status = "Retired" WHERE regNumber = ?') || (sql.includes('UPDATE vehicles SET status = ?') && sql.includes('regNumber = ?'))) {
    const statusVal = sql.includes('Retired') ? 'Retired' : params[0];
    const regNumber = sql.includes('Retired') ? params[0] : params[1];
    const idx = data.vehicles.findIndex(x => x.regNumber === regNumber);
    if (idx !== -1) {
      data.vehicles[idx].status = statusVal;
      saveMockDb();
    }
    return [{ affectedRows: 1 }];
  }

  // 4. Drivers Registry
  if (sql.includes('SELECT * FROM drivers')) {
    let result = data.drivers;
    if (params.length > 0) {
      const hasStatus = sql.includes('status = ?');
      const hasSearch = sql.includes('name LIKE ?');
      if (hasStatus && hasSearch) {
        const statusVal = params[0];
        const searchVal = params[1].replace(/%/g, '').toLowerCase();
        result = result.filter(d => d.status === statusVal && (d.name.toLowerCase().includes(searchVal) || d.licenseNumber.toLowerCase().includes(searchVal)));
      } else if (hasStatus) {
        result = result.filter(d => d.status === params[0]);
      } else if (hasSearch) {
        const searchVal = params[0].replace(/%/g, '').toLowerCase();
        result = result.filter(d => d.name.toLowerCase().includes(searchVal) || d.licenseNumber.toLowerCase().includes(searchVal));
      }
    }
    return [result];
  }
  if (sql.includes('SELECT * FROM drivers WHERE licenseNumber = ?')) {
    const d = data.drivers.find(x => x.licenseNumber === params[0]);
    return [d ? [d] : []];
  }
  if (sql.includes('INSERT INTO drivers')) {
    const [licenseNumber, name, category, expiryDate, contact, safetyScore, status] = params;
    const newD = { licenseNumber, name, category, expiryDate, contact, safetyScore: parseInt(safetyScore), status };
    const exists = data.drivers.findIndex(x => x.licenseNumber === licenseNumber);
    if (exists !== -1) data.drivers[exists] = newD;
    else data.drivers.push(newD);
    saveMockDb();
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('UPDATE drivers SET name = ?, category = ?, expiryDate = ?, contact = ?, safetyScore = ?, status = ? WHERE licenseNumber = ?')) {
    const [name, category, expiryDate, contact, safetyScore, status, licenseNumber] = params;
    const idx = data.drivers.findIndex(x => x.licenseNumber === licenseNumber);
    if (idx !== -1) {
      data.drivers[idx] = { ...data.drivers[idx], name, category, expiryDate, contact, safetyScore: parseInt(safetyScore), status };
      saveMockDb();
    }
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('DELETE FROM drivers WHERE licenseNumber = ?')) {
    data.drivers = data.drivers.filter(x => x.licenseNumber !== params[0]);
    saveMockDb();
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('UPDATE drivers SET status = ? WHERE licenseNumber = ?')) {
    const [status, licenseNumber] = params;
    const idx = data.drivers.findIndex(x => x.licenseNumber === licenseNumber);
    if (idx !== -1) {
      data.drivers[idx].status = status;
      saveMockDb();
    }
    return [{ affectedRows: 1 }];
  }

  // 5. Trips Registry
  if (sql.includes('SELECT * FROM trips')) {
    let result = data.trips;
    if (sql.includes('WHERE id = ?')) {
      const t = data.trips.find(x => x.id === params[0]);
      return [t ? [t] : []];
    }
    if (params.length > 0) {
      const hasStatus = sql.includes('status = ?');
      const hasSearch = sql.includes('source LIKE ?');
      if (hasStatus && hasSearch) {
        const statusVal = params[0];
        const searchVal = params[1].replace(/%/g, '').toLowerCase();
        result = result.filter(t => t.status === statusVal && 
          (t.id.toLowerCase().includes(searchVal) || 
           t.source.toLowerCase().includes(searchVal) || 
           t.destination.toLowerCase().includes(searchVal) || 
           t.vehicleReg.toLowerCase().includes(searchVal)));
      } else if (hasStatus) {
        result = result.filter(t => t.status === params[0]);
      } else if (hasSearch) {
        const searchVal = params[0].replace(/%/g, '').toLowerCase();
        result = result.filter(t => 
          t.id.toLowerCase().includes(searchVal) || 
          t.source.toLowerCase().includes(searchVal) || 
          t.destination.toLowerCase().includes(searchVal) || 
          t.vehicleReg.toLowerCase().includes(searchVal));
      }
    }
    result = result.map(t => {
      if (!t.driverName) {
        const driver = data.drivers.find(d => d.licenseNumber === t.driverLicense);
        t.driverName = driver ? driver.name : 'Unknown';
      }
      return t;
    });
    return [result];
  }
  if (sql.includes('INSERT INTO trips')) {
    const [id, source, destination, vehicleReg, driverLicense, cargoWeight, distance, status, revenue, fuelConsumed, date, recipientName, recipientPhone, deliveryAddress, packageCategory] = params;
    const driver = data.drivers.find(d => d.licenseNumber === driverLicense);
    const newT = {
      id, source, destination, vehicleReg, driverLicense, 
      driverName: driver ? driver.name : 'Unknown',
      cargoWeight: parseInt(cargoWeight), distance: parseFloat(distance), status, 
      revenue: parseFloat(revenue), fuelConsumed: parseFloat(fuelConsumed), endOdometer: 0, date, 
      recipientName, recipientPhone, deliveryAddress, packageCategory
    };
    data.trips.push(newT);
    saveMockDb();
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('UPDATE trips SET status = ?')) {
    if (sql.includes('fuelConsumed')) {
      const [status, fuelConsumed, endOdometer, id] = params;
      const idx = data.trips.findIndex(x => x.id === id);
      if (idx !== -1) {
        data.trips[idx].status = status;
        data.trips[idx].fuelConsumed = parseFloat(fuelConsumed);
        data.trips[idx].endOdometer = parseInt(endOdometer);
        saveMockDb();
      }
    } else {
      const [status, id] = params;
      const idx = data.trips.findIndex(x => x.id === id);
      if (idx !== -1) {
        data.trips[idx].status = status;
        saveMockDb();
      }
    }
    return [{ affectedRows: 1 }];
  }

  // 6. Maintenance Logs
  if (sql.includes('SELECT * FROM maintenance_logs')) {
    return [data.maintenance_logs];
  }
  if (sql.includes('INSERT INTO maintenance_logs')) {
    const [id, vehicleReg, serviceType, cost, startDate, endDate, status, notes] = params;
    const newM = { id, vehicleReg, serviceType, cost: parseFloat(cost), startDate, endDate, status, notes };
    data.maintenance_logs.push(newM);
    saveMockDb();
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('UPDATE maintenance_logs SET status = "Completed", endDate = ? WHERE id = ?')) {
    const [endDate, id] = params;
    const idx = data.maintenance_logs.findIndex(x => x.id === id);
    if (idx !== -1) {
      data.maintenance_logs[idx].status = 'Completed';
      data.maintenance_logs[idx].endDate = endDate;
      saveMockDb();
    }
    return [{ affectedRows: 1 }];
  }

  // 7. Expenses Logs
  if (sql.includes('SELECT * FROM expenses')) {
    let result = data.expenses;
    if (params.length > 0) {
      result = result.filter(e => e.vehicleReg === params[0]);
    }
    return [result];
  }
  if (sql.includes('INSERT INTO expenses')) {
    const [id, vehicleReg, type, amount, date, notes] = params;
    const newE = { id, vehicleReg, type, amount: parseFloat(amount), date, notes };
    data.expenses.push(newE);
    saveMockDb();
    return [{ affectedRows: 1 }];
  }

  // 8. Documents
  if (sql.includes('SELECT * FROM documents WHERE vehicleReg = ?')) {
    const result = data.documents.filter(d => d.vehicleReg === params[0]);
    return [result];
  }
  if (sql.includes('INSERT INTO documents')) {
    const [id, vehicleReg, name, type, uploadDate, size] = params;
    const newD = { id, vehicleReg, name, type, uploadDate, size };
    data.documents.push(newD);
    saveMockDb();
    return [{ affectedRows: 1 }];
  }

  // 9. Notifications
  if (sql.includes('SELECT * FROM notifications')) {
    const result = [...data.notifications].sort((a, b) => new Date(b.date) - new Date(a.date));
    return [result];
  }
  if (sql.includes('UPDATE notifications SET is_read = TRUE WHERE id = ?')) {
    const idx = data.notifications.findIndex(x => x.id === params[0]);
    if (idx !== -1) {
      data.notifications[idx].is_read = true;
      saveMockDb();
    }
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('INSERT INTO notifications')) {
    const [id, title, message, type, date, is_read] = params;
    const newN = { id, title, message, type, date, is_read: !!is_read };
    data.notifications.push(newN);
    saveMockDb();
    return [{ affectedRows: 1 }];
  }

  console.warn('Unhandled SQL query:', sql, params);
  return [[]];
}

// Check if MySQL is open using a fast TCP socket check (prevents hanging in mysql2 pool queues)
function checkMysqlPort() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800); // 800ms timeout
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(3306, '127.0.0.1');
  });
}

const mysqlEnabledPromise = checkMysqlPort().then(enabled => {
  if (enabled) {
    console.log("MySQL port 3306 is open. Initializing MySQL pool.");
    realPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'transitops_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    return true;
  } else {
    console.warn("MySQL port 3306 is closed. Falling back to Local JSON Database.");
    isFallback = true;
    return false;
  }
});

const pool = {
  async query(sql, params = []) {
    await mysqlEnabledPromise;
    if (isFallback) {
      return mockQuery(sql, params);
    }
    try {
      return await realPool.query(sql, params);
    } catch (err) {
      console.warn("MySQL Query Error, falling back to Local JSON DB:", err.message);
      isFallback = true;
      return mockQuery(sql, params);
    }
  },
  async getConnection() {
    await mysqlEnabledPromise;
    if (isFallback) {
      return {
        query: async (sql, params = []) => mockQuery(sql, params),
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {}
      };
    }
    try {
      return await realPool.getConnection();
    } catch (err) {
      console.warn("MySQL getConnection Error, falling back to Local JSON DB:", err.message);
      isFallback = true;
      return {
        query: async (sql, params = []) => mockQuery(sql, params),
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {}
      };
    }
  }
};

module.exports = pool;