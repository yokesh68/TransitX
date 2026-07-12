# 🚍 TransitOps - Smart Transport Operations Platform

A comprehensive full-stack fleet management and transport operations platform designed to digitize and optimize vehicle management, driver operations, trip scheduling, maintenance tracking, and financial monitoring.

TransitOps provides a centralized dashboard for transport organizations to manage their complete fleet lifecycle with role-based access control, operational insights, and efficient workflow automation.

---

# ✨ Features

## 🔐 Secure Authentication & Role-Based Access Control

- JWT-based authentication
- Secure login and registration
- Protected API routes
- Role-based dashboard access

Supported roles:

- Admin
- Fleet Manager
- Driver
- Safety Officer
- Financial Analyst


---

# 🚚 Fleet Management

Complete vehicle lifecycle management:

- Register new vehicles
- Update vehicle information
- Monitor vehicle availability
- Track vehicle operational status
- Maintain fleet records


Vehicle information includes:

- Registration Number
- Vehicle Type
- Vehicle Model
- Maximum Load Capacity
- Odometer Reading
- Acquisition Cost
- Current Status


Vehicle Status Workflow:

```
Available
    |
    ↓
Assigned
    |
    ↓
On Trip
    |
    ↓
In Maintenance
    |
    ↓
Available
```

---

# 👨‍✈️ Driver Management

Manage complete driver profiles and performance records.

Features:

- Add and update driver details
- Maintain license information
- Track driver availability
- Monitor safety performance


Driver information:

- Name
- License Number
- License Category
- License Expiry Date
- Contact Details
- Safety Score


---

# 🛣 Trip Management

Efficient trip planning and tracking system.

Features:

- Create trips
- Assign vehicles
- Assign drivers
- Track trip progress
- Complete or cancel trips
- Monitor transportation activities


Trip Lifecycle:

```
Created
   ↓
Assigned
   ↓
Started
   ↓
Completed
```

---

# 🔧 Maintenance Management

Track vehicle servicing and repair activities.

Features:

- Create maintenance requests
- Monitor repair status
- Track maintenance expenses
- Maintain vehicle service history


Maintenance Workflow:

```
Vehicle Issue Reported

        ↓

Maintenance Created

        ↓

Vehicle In Shop

        ↓

Repair Completed

        ↓

Vehicle Available
```

---

# 💰 Expense Management

Manage operational expenses and cost tracking.

Features:

- Add vehicle expenses
- Track fuel costs
- Record maintenance costs
- Calculate vehicle operational expenses
- Generate financial insights


Expense Types:

- Fuel
- Maintenance
- Toll
- Insurance
- Other Operational Costs


---

# 📊 Dashboard Analytics

Real-time operational overview:

Dashboard provides:

- Total vehicles
- Active trips
- Available drivers
- Maintenance vehicles
- Operational expenses
- Fleet performance overview


---

# 🛠 Technology Stack

## Frontend

- React.js
- Vite
- React Router DOM
- Axios
- JavaScript ES6+
- CSS3
- Responsive UI Design


## Backend

- Node.js
- Express.js
- REST API Architecture


## Database

- MySQL
- mysql2 Driver


## Authentication

- JSON Web Token (JWT)


## Development Tools

- Git
- GitHub
- VS Code
- Postman / Thunder Client
- Nodemon


---

# 📂 Project Structure

```
TransitOps

│
├── frontend
│
│   ├── src
│   │
│   │   ├── api
│   │   ├── components
│   │   ├── context
│   │   ├── layouts
│   │   ├── pages
│   │   ├── routes
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
│
├── backend
│
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── utils
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation & Setup

## Prerequisites

Install:

- Node.js v18+
- MySQL Server
- npm


---

# Backend Setup

Navigate to backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```


Create `.env` file:

```
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=transitops

JWT_SECRET=your_secret_key
```


Start backend server:

Development:

```bash
npm run dev
```


Production:

```bash
npm start
```


Backend runs:

```
http://localhost:5000
```

---

# Frontend Setup

Navigate to frontend:

```bash
cd frontend
```


Install dependencies:

```bash
npm install
```


Start React application:

```bash
npm run dev
```


Frontend runs:

```
http://localhost:5173
```

---

# 🗄 Database Design

## Users Table

Stores authentication and user roles.

```
id
name
email
password
role
created_at
```


---

## Vehicles Table

Stores fleet information.

```
id
registration_number
vehicle_name
vehicle_type
capacity
odometer
acquisition_cost
status
created_at
```


---

## Drivers Table

Stores driver details.

```
id
name
license_number
license_category
license_expiry
contact_number
safety_score
status
```


---

## Trips Table

Stores transportation activities.

```
id
source
destination
vehicle_id
driver_id
cargo_weight
distance
status
created_at
```


---

## Maintenance Table

Stores repair and service records.

```
id
vehicle_id
maintenance_type
description
cost
status
created_at
```


---

## Expenses Table

Stores operational expenses.

```
id
vehicle_id
expense_type
amount
description
created_at
```


---

# 🔗 API Endpoints

## Authentication API

### Register User

```
POST /api/auth/register
```


### Login User

```
POST /api/auth/login
```


---

# Vehicle API

```
GET    /api/vehicles

POST   /api/vehicles

PUT    /api/vehicles/:id

DELETE /api/vehicles/:id
```


---

# Driver API

```
GET    /api/drivers

POST   /api/drivers

PUT    /api/drivers/:id

DELETE /api/drivers/:id
```


---

# Trip API

```
GET    /api/trips

POST   /api/trips

PUT    /api/trips/:id

DELETE /api/trips/:id
```


---

# Maintenance API

```
GET    /api/maintenance

POST   /api/maintenance

PUT    /api/maintenance/:id
```


---

# Expense API

```
GET    /api/expenses

POST   /api/expenses

DELETE /api/expenses/:id
```


---

# 👥 Roles & Permissions


## Admin

Full system access:

- Manage users
- Manage fleet
- View analytics
- Manage operations


---

## Fleet Manager

Responsible for:

- Vehicle management
- Driver assignment
- Trip creation
- Maintenance tracking


---

## Driver

Can:

- View assigned trips
- Update trip status
- Report vehicle issues


---

## Safety Officer

Can:

- Monitor driver performance
- Review safety records


---

## Financial Analyst

Can:

- Manage expenses
- View operational costs
- Generate financial reports


---

# 🔒 Security Features

Implemented security measures:

- JWT authentication
- Protected routes
- Role-based authorization
- Environment variable configuration
- API validation
- Secure password handling


---

# 🚀 Deployment

## Backend Deployment

Recommended platforms:

- Render
- Railway
- AWS


Environment variables required:

```
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
PORT
```


---

## Frontend Deployment

Recommended platforms:

- Vercel
- Netlify


Build command:

```
npm run build
```


---

# 🔄 Application Architecture

```
React Frontend

       |

     Axios

       |

Express REST API

       |

 MySQL Database
```


---

# 🎨 UI Design

TransitOps follows a modern dashboard interface:

- Minimal professional design
- Red and black theme
- Responsive layouts
- Role-based navigation
- Data management tables
- Analytics dashboard cards


---

# 📌 Future Enhancements

- Live GPS vehicle tracking
- Route optimization using AI
- Real-time notifications
- Advanced fleet analytics
- Mobile application
- Predictive maintenance


---

# 🤝 Contributing

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push changes

```bash
git push origin feature/new-feature
```

5. Create a Pull Request


---

# 📄 License

This project is developed for educational and hackathon purposes.


---

# 👩‍💻 Project

**TransitOps - Smart Transport Operations Platform**

Built using:

React.js | Node.js | Express.js | MySQL
