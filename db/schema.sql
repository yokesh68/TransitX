CREATE DATABASE IF NOT EXISTS transitops_db;
USE transitops_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst') NOT NULL
);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    regNumber VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('Van', 'Truck', 'Sedan', 'SUV') NOT NULL,
    maxCapacity INT NOT NULL, -- in kg
    odometer INT NOT NULL, -- in km
    acquisitionCost DECIMAL(12,2) NOT NULL,
    status ENUM('Available', 'On Trip', 'In Shop', 'Retired') DEFAULT 'Available',
    region ENUM('North', 'South', 'East', 'West') NOT NULL
);

-- 3. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    licenseNumber VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('Class A', 'Class B', 'Class C') NOT NULL,
    expiryDate DATE NOT NULL,
    contact VARCHAR(30) NOT NULL,
    safetyScore INT DEFAULT 100,
    status ENUM('Available', 'On Trip', 'Off Duty', 'Suspended') DEFAULT 'Available'
);

-- 4. Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(20) PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicleReg VARCHAR(20) NOT NULL,
    driverLicense VARCHAR(30) NOT NULL,
    cargoWeight INT NOT NULL,
    distance INT NOT NULL, -- in km
    status ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled') DEFAULT 'Draft',
    revenue DECIMAL(12,2) NOT NULL,
    fuelConsumed DECIMAL(8,2) DEFAULT 0, -- in liters
    endOdometer INT DEFAULT 0,
    date DATE NOT NULL,
    recipientName VARCHAR(100) NOT NULL,
    recipientPhone VARCHAR(30) NOT NULL,
    deliveryAddress VARCHAR(255) NOT NULL,
    packageCategory ENUM('Standard Cargo', 'Fragile', 'Cold Chain', 'Hazardous') DEFAULT 'Standard Cargo',
    FOREIGN KEY (vehicleReg) REFERENCES vehicles(regNumber) ON UPDATE CASCADE,
    FOREIGN KEY (driverLicense) REFERENCES drivers(licenseNumber) ON UPDATE CASCADE
);

-- 5. Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id VARCHAR(20) PRIMARY KEY,
    vehicleReg VARCHAR(20) NOT NULL,
    serviceType VARCHAR(255) NOT NULL,
    cost DECIMAL(12,2) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE DEFAULT NULL,
    status ENUM('Active', 'Completed') DEFAULT 'Active',
    notes TEXT,
    FOREIGN KEY (vehicleReg) REFERENCES vehicles(regNumber) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 6. Fuel Logs Table
CREATE TABLE IF NOT EXISTS fuel_logs (
    id VARCHAR(20) PRIMARY KEY,
    vehicleReg VARCHAR(20) NOT NULL,
    liters DECIMAL(8,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (vehicleReg) REFERENCES vehicles(regNumber) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(20) PRIMARY KEY,
    vehicleReg VARCHAR(20) NOT NULL,
    type ENUM('Fuel', 'Maintenance', 'Tolls', 'Other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (vehicleReg) REFERENCES vehicles(regNumber) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 8. Vehicle Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(20) PRIMARY KEY,
    vehicleReg VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Registration', 'Insurance', 'Inspection') NOT NULL,
    uploadDate DATE NOT NULL,
    size VARCHAR(20) NOT NULL,
    FOREIGN KEY (vehicleReg) REFERENCES vehicles(regNumber) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'danger') DEFAULT 'info',
    date DATE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE
);