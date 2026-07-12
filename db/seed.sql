USE transitops_db;

-- Clear previous mock data
DELETE FROM notifications;
DELETE FROM documents;
DELETE FROM expenses;
DELETE FROM fuel_logs;
DELETE FROM maintenance_logs;
DELETE FROM trips;
DELETE FROM drivers;
DELETE FROM vehicles;
DELETE FROM users;

-- 1. Initial Users
INSERT INTO users (email, password, name, role) VALUES
('manager@transitops.com', 'admin123', 'Sarah Connor', 'Fleet Manager'),
('driver@transitops.com', 'driver123', 'Alex Mercer', 'Driver'),
('safety@transitops.com', 'safety123', 'Marcus Wright', 'Safety Officer'),
('analyst@transitops.com', 'analyst123', 'Elena Fisher', 'Financial Analyst');

-- 2. Initial Vehicles
INSERT INTO vehicles (regNumber, name, type, maxCapacity, odometer, acquisitionCost, status, region) VALUES
('VAN-05', 'Ford Transit 2022', 'Van', 500, 12500, 32000.00, 'Available', 'North'),
('TRK-12', 'Volvo FH16 Heavy Duty', 'Truck', 5000, 85000, 115000.00, 'Available', 'South'),
('SED-01', 'Toyota Camry 2021', 'Sedan', 300, 45000, 24000.00, 'Available', 'East'),
('SUV-08', 'Chevrolet Suburban', 'SUV', 800, 62000, 55000.00, 'In Shop', 'West'),
('TRK-09', 'Scania R500', 'Truck', 4500, 112000, 98000.00, 'Retired', 'North');

-- 3. Initial Drivers
INSERT INTO drivers (licenseNumber, name, category, expiryDate, contact, safetyScore, status) VALUES
('DL-837482', 'Alex Mercer', 'Class A', '2027-10-15', '+1-555-0199', 92, 'Available'),
('DL-928472', 'Sarah Connor', 'Class B', '2026-03-20', '+1-555-0144', 95, 'Available'),
('DL-118273', 'Bob Miller', 'Class C', '2027-01-10', '+1-555-0182', 68, 'Suspended'),
('DL-554829', 'John Doe', 'Class A', '2025-06-01', '+1-555-0122', 88, 'Available'),
('DL-773829', 'Elena Fisher', 'Class C', '2028-12-05', '+1-555-0155', 99, 'Off Duty');

-- 4. Initial Trips
INSERT INTO trips (id, source, destination, vehicleReg, driverLicense, cargoWeight, distance, status, revenue, fuelConsumed, endOdometer, date, recipientName, recipientPhone, deliveryAddress, packageCategory) VALUES
('TRIP-1001', 'Warehouse A (Chicago)', 'Distribution Center B (Detroit)', 'VAN-05', 'DL-837482', 420, 450, 'Completed', 1200.00, 45.00, 12500, '2026-07-01', 'John Smith', '+1-555-0210', '789 Detroit St, Detroit, MI', 'Standard Cargo'),
('TRIP-1002', 'Port of Seattle', 'Logistics Hub (Spokane)', 'TRK-12', 'DL-928472', 4500, 350, 'Completed', 4500.00, 120.00, 85000, '2026-07-05', 'Alice Johnson', '+1-555-0211', '456 Spokane Way, Spokane, WA', 'Cold Chain'),
('TRIP-1003', 'Dallas Depot', 'Austin Retail Outlet', 'SED-01', 'DL-837482', 150, 300, 'Completed', 600.00, 21.00, 45000, '2026-07-09', 'Robert Brown', '+1-555-0212', '123 Austin Ave, Austin, TX', 'Fragile'),
('TRIP-1004', 'Boston Port', 'New York Warehouse', 'VAN-05', 'DL-837482', 300, 350, 'Draft', 950.00, 0.00, 0, '2026-07-11', 'Emily Davis', '+1-555-0213', '999 New York Blvd, New York, NY', 'Standard Cargo');

-- 5. Initial Maintenance Logs
INSERT INTO maintenance_logs (id, vehicleReg, serviceType, cost, startDate, endDate, status, notes) VALUES
('MNT-2001', 'SUV-08', 'Brake Pad Replacement & Engine Oil Change', 450.00, '2026-07-10', NULL, 'Active', 'Squeaking noises reported by driver Bob. Replaced front brake pads and flushed engine oil.'),
('MNT-2002', 'VAN-05', 'Routine 10k Oil Change & Filter Renewal', 150.00, '2026-06-15', '2026-06-16', 'Completed', 'Standard logbook maintenance.');

-- 6. Initial Fuel Logs
INSERT INTO fuel_logs (id, vehicleReg, liters, cost, date) VALUES
('FUEL-3001', 'VAN-05', 45.00, 72.00, '2026-07-02'),
('FUEL-3002', 'TRK-12', 120.00, 216.00, '2026-07-06'),
('FUEL-3003', 'SED-01', 21.00, 33.60, '2026-07-09');

-- 7. Initial General Expenses
INSERT INTO expenses (id, vehicleReg, type, amount, date, notes) VALUES
('EXP-4001', 'VAN-05', 'Fuel', 72.00, '2026-07-02', 'Fuel fillup for TRIP-1001'),
('EXP-4002', 'VAN-05', 'Maintenance', 150.00, '2026-06-16', 'Routine 10k service cost'),
('EXP-4003', 'TRK-12', 'Fuel', 216.00, '2026-07-06', 'Fuel fillup for TRIP-1002'),
('EXP-4004', 'TRK-12', 'Tolls', 45.00, '2026-07-05', 'Highway Toll charges'),
('EXP-4005', 'SED-01', 'Fuel', 33.60, '2026-07-09', 'Fuel fillup for TRIP-1003'),
('EXP-4006', 'SUV-08', 'Maintenance', 450.00, '2026-07-10', 'Active brake job charges');

-- 8. Initial Documents
INSERT INTO documents (id, vehicleReg, name, type, uploadDate, size) VALUES
('DOC-5001', 'VAN-05', 'Registration_Cert.pdf', 'Registration', '2026-01-10', '1.2 MB'),
('DOC-5002', 'VAN-05', 'Insurance_Policy_2026.pdf', 'Insurance', '2026-01-12', '2.4 MB'),
('DOC-5003', 'TRK-12', 'Annual_Inspection_Report.pdf', 'Inspection', '2026-03-05', '850 KB');

-- 9. Initial Notifications
INSERT INTO notifications (id, title, message, type, date, is_read) VALUES
('NOT-001', 'License Renewal Required', 'Driver John Doe (DL-554829) license expired on 2025-06-01.', 'danger', '2026-07-11', FALSE),
('NOT-002', 'License Expiring Soon', 'Driver Sarah Connor (DL-928472) license expires on 2026-03-20.', 'warning', '2026-07-11', FALSE),
('NOT-003', 'Scheduled Maintenance Lockout', 'Vehicle SUV-08 status changed to In Shop for active maintenance log.', 'info', '2026-07-10', TRUE);