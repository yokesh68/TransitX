import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Truck,
  Users,
  Map,
  Wrench,
  DollarSign,
  BarChart2,
  Bell,
  Moon,
  Sun,
  LogOut,
  Plus
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, DoughnutController, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, DoughnutController, ArcElement, Title, Tooltip, Legend);

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // App states
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  // Filter states
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatus, setDriverStatus] = useState('all');
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('all');
  const [expenseFilter, setExpenseFilter] = useState('all');

  // Modals state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingTripId, setCompletingTripId] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab permissions mapping
  const roleTabs = {
    'Fleet Manager': ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'expenses', 'reports'],
    'Driver': ['dashboard', 'trips'],
    'Safety Officer': ['dashboard', 'drivers'],
    'Financial Analyst': ['dashboard', 'expenses', 'reports']
  };

  useEffect(() => {
    const savedUser = sessionStorage.getItem('current_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      fetchVehicles();
      fetchDrivers();
      fetchTrips();
      fetchMaintenance();
      fetchExpenses();
      fetchNotifications();
    }
  }, [currentUser]);

  // General theme toggler
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  // API Fetches
  const fetchDashboardData = async () => {
    const res = await fetch(`${API_URL}/dashboard/stats`);
    const data = await res.json();
    setStats(data.stats);
    setCharts(data.charts);
  };

  const fetchVehicles = async () => {
    const res = await fetch(`${API_URL}/vehicles?search=${vehicleSearch}&status=${vehicleStatus}`);
    const data = await res.json();
    setVehicles(data);
  };

  const fetchDrivers = async () => {
    const res = await fetch(`${API_URL}/drivers?search=${driverSearch}&status=${driverStatus}`);
    const data = await res.json();
    setDrivers(data);
  };

  const fetchTrips = async () => {
    const res = await fetch(`${API_URL}/trips?search=${tripSearch}&status=${tripStatusFilter}`);
    const data = await res.json();
    setTrips(data);
  };

  const fetchMaintenance = async () => {
    const res = await fetch(`${API_URL}/maintenance`);
    const data = await res.json();
    setMaintenance(data);
  };

  const fetchExpenses = async () => {
    const res = await fetch(`${API_URL}/expenses?vehicle=${expenseFilter}`);
    const data = await res.json();
    setExpenses(data);
  };

  const fetchNotifications = async () => {
    const res = await fetch(`${API_URL}/notifications`);
    const data = await res.json();
    setNotifications(data);
  };

  useEffect(() => {
    if (currentUser) fetchVehicles();
  }, [vehicleSearch, vehicleStatus]);

  useEffect(() => {
    if (currentUser) fetchDrivers();
  }, [driverSearch, driverStatus]);

  useEffect(() => {
    if (currentUser) fetchTrips();
  }, [tripSearch, tripStatusFilter]);

  useEffect(() => {
    if (currentUser) fetchExpenses();
  }, [expenseFilter]);

  // Auth Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        sessionStorage.setItem('current_user', JSON.stringify(data.user));
      } else {
        setLoginError('Invalid login details.');
      }
    } catch (err) {
      setLoginError('Server connectivity issue.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('current_user');
    setActiveTab('dashboard');
  };

  const hasPermission = (action) => {
    const roles = {
      'Fleet Manager': ['vehicle_crud', 'driver_crud', 'trip_manage', 'maintenance_manage', 'expense_manage'],
      'Driver': ['trip_manage'],
      'Safety Officer': ['driver_crud'],
      'Financial Analyst': ['expense_manage']
    };
    return roles[currentUser?.role]?.includes(action) || false;
  };

  const triggerTripStatus = async (tripId, status, extra = {}) => {
    const res = await fetch(`${API_URL}/trips/${tripId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra })
    });
    const data = await res.json();
    if (data.success) {
      fetchTrips();
      fetchDashboardData();
    } else {
      alert(data.message);
    }
  };

  // Render Logic
  if (!currentUser) {
    return (
      <div className="login-overlay">
        <form className="login-card" onSubmit={handleLoginSubmit}>
          <div className="login-header">
            <h2>TransitOps React Login</h2>
            <p>Smart Operations Portal</p>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="form-control" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="form-control" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Secure Login</button>
          {loginError && <div style={{ color: 'red', marginTop: '12px', textAlign: 'center' }}>{loginError}</div>}
          {/* <div className="login-credentials-box">
            <h4>Quick Demo Access Profiles</h4>
            <p><strong>Fleet Manager:</strong> manager@transitops.com / admin123</p>
            <p><strong>Driver:</strong> driver@transitops.com / driver123</p>
          </div> */}
        </form>
      </div>
    );
  }

  const allowedTabs = roleTabs[currentUser.role] || [];

  return (
    <div className="app-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <span>TransitOps React</span>
        </div>
        <ul className="menu-list">
          {allowedTabs.includes('dashboard') && (
            <li className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={18} /> Dashboard
            </li>
          )}
          {allowedTabs.includes('vehicles') && (
            <li className={`menu-item ${activeTab === 'vehicles' ? 'active' : ''}`} onClick={() => setActiveTab('vehicles')}>
              <Truck size={18} /> Vehicle Registry
            </li>
          )}
          {allowedTabs.includes('drivers') && (
            <li className={`menu-item ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}>
              <Users size={18} /> Driver Management
            </li>
          )}
          {allowedTabs.includes('trips') && (
            <li className={`menu-item ${activeTab === 'trips' ? 'active' : ''}`} onClick={() => setActiveTab('trips')}>
              <Map size={18} /> Trip Management
            </li>
          )}
          {allowedTabs.includes('maintenance') && (
            <li className={`menu-item ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
              <Wrench size={18} /> Maintenance
            </li>
          )}
          {allowedTabs.includes('expenses') && (
            <li className={`menu-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
              <DollarSign size={18} /> Fuel & Expenses
            </li>
          )}
          {allowedTabs.includes('reports') && (
            <li className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              <BarChart2 size={18} /> Reports
            </li>
          )}
        </ul>
      </aside>

      {/* Main Container */}
      <div className="app-container">
        <header className="header">
          <div className="header-left">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h2>
          </div>
          <div className="header-right">
            {/* Quick Switch Role Dropdown */}
            <select
              value={currentUser.role}
              onChange={(e) => {
                const nextUser = { ...currentUser, role: e.target.value };
                setCurrentUser(nextUser);
                sessionStorage.setItem('current_user', JSON.stringify(nextUser));
              }}
              className="role-select"
            >
              <option value="Fleet Manager">Fleet Manager</option>
              <option value="Driver">Driver</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Financial Analyst">Financial Analyst</option>
            </select>
            <span className="role-badge">{currentUser.role}</span>
            <button className="btn-icon" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="user-profile">
              <div className="user-avatar">{currentUser.name[0]}</div>
              <span>{currentUser.name}</span>
            </div>
            <button className="btn-icon" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="main-viewport">
          {activeTab === 'dashboard' && stats && charts && (
            <div>
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">Active Vehicles</div>
                  <div className="kpi-value">{stats.activeVehicles}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header">Available Vehicles</div>
                  <div className="kpi-value">{stats.availableVehicles}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header">In Maintenance</div>
                  <div className="kpi-value">{stats.maintenanceVehicles}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header">Fleet Utilization</div>
                  <div className="kpi-value">{stats.utilization}</div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <div className="chart-title">Status Breakdown</div>
                  <div style={{ height: '240px', position: 'relative' }}>
                    <Doughnut
                      data={{
                        labels: charts.statusBreakdown.map(x => x.status),
                        datasets: [{
                          data: charts.statusBreakdown.map(x => x.count),
                          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-title">Expenses Per Vehicle ($)</div>
                  <div style={{ height: '240px', position: 'relative' }}>
                    <Bar
                      data={{
                        labels: charts.expenses.map(x => x.vehicleReg),
                        datasets: [
                          { label: 'Fuel', data: charts.expenses.map(x => parseFloat(x.fuel)), backgroundColor: '#3b82f6' },
                          { label: 'Maint', data: charts.expenses.map(x => parseFloat(x.maintenance)), backgroundColor: '#f59e0b' }
                        ]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div>
              <div className="section-header">
                <h3>Fleet Registry</h3>
                {hasPermission('vehicle_crud') && (
                  <button className="btn btn-primary" onClick={() => { setEditingVehicle(null); setShowVehicleModal(true); }}>
                    <Plus size={16} /> Register Vehicle
                  </button>
                )}
              </div>
              <div className="filter-bar">
                <input type="text" placeholder="Search vehicle..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} className="form-control" />
                <select value={vehicleStatus} onChange={(e) => setVehicleStatus(e.target.value)} className="form-control">
                  <option value="all">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="In Shop">In Shop</option>
                </select>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reg Number</th>
                      <th>Model Name</th>
                      <th>Type</th>
                      <th>Odometer</th>
                      <th>Region</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.regNumber}>
                        <td><strong>{v.regNumber}</strong></td>
                        <td>{v.name}</td>
                        <td>{v.type}</td>
                        <td>{v.odometer} km</td>
                        <td>{v.region}</td>
                        <td><span className={`badge ${v.status.toLowerCase().replace(' ', '')}`}>{v.status}</span></td>
                        <td>
                          {hasPermission('vehicle_crud') && (
                            <>
                              <button className="btn-sm btn-secondary" onClick={() => { setEditingVehicle(v); setShowVehicleModal(true); }}>Edit</button>
                              <button className="btn-sm btn-danger" onClick={async () => {
                                if (confirm(`Retire ${v.regNumber}?`)) {
                                  await fetch(`${API_URL}/vehicles/${v.regNumber}`, { method: 'DELETE' });
                                  fetchVehicles();
                                }
                              }}>Retire</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div>
              <div className="section-header">
                <h3>Driver Registry</h3>
                {hasPermission('driver_crud') && (
                  <button className="btn btn-primary" onClick={() => { setEditingDriver(null); setShowDriverModal(true); }}>
                    <Plus size={16} /> Register Driver
                  </button>
                )}
              </div>
              <div className="filter-bar">
                <input type="text" placeholder="Search driver..." value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} className="form-control" />
                <select value={driverStatus} onChange={(e) => setDriverStatus(e.target.value)} className="form-control">
                  <option value="all">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>License Number</th>
                      <th>Expiry</th>
                      <th>Contact</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map(d => (
                      <tr key={d.licenseNumber}>
                        <td><strong>{d.name}</strong></td>
                        <td>{d.licenseNumber}</td>
                        <td>{d.expiryDate}</td>
                        <td>{d.contact}</td>
                        <td>{d.safetyScore}/100</td>
                        <td><span className={`badge ${d.status.toLowerCase().replace(' ', '')}`}>{d.status}</span></td>
                        <td>
                          {hasPermission('driver_crud') && (
                            <button className="btn-sm btn-secondary" onClick={() => { setEditingDriver(d); setShowDriverModal(true); }}>Edit</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'trips' && (
            <div>
              <div className="section-header">
                <h3>Trips & Dispatch</h3>
                {hasPermission('trip_manage') && (
                  <button className="btn btn-primary" onClick={() => setShowTripModal(true)}>
                    <Plus size={16} /> Create Trip Draft
                  </button>
                )}
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Route</th>
                      <th>Vehicle</th>
                      <th>Driver</th>
                      <th>Cargo Weight</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.id}</strong></td>
                        <td>{t.source} ➔ {t.destination}</td>
                        <td>{t.vehicleReg}</td>
                        <td>{t.driverName}</td>
                        <td>{t.cargoWeight} kg</td>
                        <td><span className={`badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                        <td>
                          {t.status === 'Draft' && hasPermission('trip_manage') && (
                            <button className="btn-sm btn-success" onClick={() => triggerTripStatus(t.id, 'Dispatched')}>Dispatch</button>
                          )}
                          {t.status === 'Dispatched' && hasPermission('trip_manage') && (
                            <>
                              <button className="btn-sm btn-primary" onClick={() => { setCompletingTripId(t.id); setShowCompleteModal(true); }}>Complete</button>
                              <button className="btn-sm btn-danger" onClick={() => triggerTripStatus(t.id, 'Cancelled')}>Cancel</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div>
              <div className="section-header">
                <h3>Maintenance Records</h3>
                {hasPermission('maintenance_manage') && (
                  <button className="btn btn-primary" onClick={() => setShowMaintenanceModal(true)}>
                    <Plus size={16} /> Book Service
                  </button>
                )}
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service ID</th>
                      <th>Vehicle</th>
                      <th>Type</th>
                      <th>Cost</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.id}</strong></td>
                        <td>{m.vehicleReg}</td>
                        <td>{m.serviceType}</td>
                        <td>${m.cost}</td>
                        <td>{m.startDate}</td>
                        <td>{m.endDate || '-'}</td>
                        <td><span className={`badge ${m.status.toLowerCase()}`}>{m.status}</span></td>
                        <td>
                          {m.status === 'Active' && hasPermission('maintenance_manage') && (
                            <button className="btn-sm btn-success" onClick={async () => {
                              const endDate = new Date().toISOString().split('T')[0];
                              await fetch(`${API_URL}/maintenance/${m.id}/close`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ endDate })
                              });
                              fetchMaintenance();
                            }}>Complete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className="section-header">
                <h3>Fuel & Expense Logs</h3>
                {hasPermission('expense_manage') && (
                  <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                    <Plus size={16} /> Log Expense
                  </button>
                )}
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Vehicle</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id}>
                        <td><strong>{e.id}</strong></td>
                        <td>{e.vehicleReg}</td>
                        <td>{e.type}</td>
                        <td>${e.amount}</td>
                        <td>{e.date}</td>
                        <td>{e.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div className="section-header">
                <h3>ROI Reports</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vehicle Reg</th>
                      <th>Trips Completed</th>
                      <th>Acquisition Cost</th>
                      <th>Revenue</th>
                      <th>Total Expense</th>
                      <th>Vehicle ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => {
                      const completed = trips.filter(t => t.vehicleReg === v.regNumber && t.status === 'Completed');
                      const rev = completed.reduce((acc, x) => acc + parseFloat(x.revenue), 0);
                      const exp = expenses.filter(e => e.vehicleReg === v.regNumber).reduce((acc, x) => acc + parseFloat(x.amount), 0);
                      const roi = v.acquisitionCost > 0 ? (((rev - exp) / v.acquisitionCost) * 100).toFixed(2) : 0;
                      return (
                        <tr key={v.regNumber}>
                          <td><strong>{v.regNumber}</strong></td>
                          <td>{completed.length}</td>
                          <td>${v.acquisitionCost}</td>
                          <td>${rev}</td>
                          <td>${exp}</td>
                          <td style={{ color: roi >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>{roi}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 1. Register/Edit Vehicle Modal */}
      {showVehicleModal && (
        <VehicleModal
          editingVehicle={editingVehicle}
          onClose={() => setShowVehicleModal(false)}
          onSave={async (payload) => {
            const method = editingVehicle ? 'PUT' : 'POST';
            const url = editingVehicle ? `${API_URL}/vehicles/${editingVehicle.regNumber}` : `${API_URL}/vehicles`;
            await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            setShowVehicleModal(false);
            fetchVehicles();
          }}
        />
      )}

      {/* 2. Complete Trip Modal */}
      {showCompleteModal && (
        <CompleteTripModal
          onClose={() => setShowCompleteModal(false)}
          onComplete={async (finalOdom, fuel) => {
            await triggerTripStatus(completingTripId, 'Completed', { finalOdometer: finalOdom, fuelConsumed: fuel });
            setShowCompleteModal(false);
          }}
        />
      )}

      {/* 3. Create Trip Modal */}
      {showTripModal && (
        <CreateTripModal
          vehicles={vehicles.filter(v => v.status === 'Available')}
          drivers={drivers.filter(d => d.status === 'Available')}
          onClose={() => setShowTripModal(false)}
          onSave={async (payload) => {
            const res = await fetch(`${API_URL}/trips`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
              setShowTripModal(false);
              fetchTrips();
            } else {
              alert(data.message);
            }
          }}
        />
      )}

      {/* 4. Book Service Modal */}
      {showMaintenanceModal && (
        <MaintenanceModal
          vehicles={vehicles.filter(v => v.status === 'Available')}
          onClose={() => setShowMaintenanceModal(false)}
          onSave={async (payload) => {
            await fetch(`${API_URL}/maintenance`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            setShowMaintenanceModal(false);
            fetchMaintenance();
          }}
        />
      )}

      {/* 5. Log Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          vehicles={vehicles}
          onClose={() => setShowExpenseModal(false)}
          onSave={async (payload) => {
            await fetch(`${API_URL}/expenses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            setShowExpenseModal(false);
            fetchExpenses();
          }}
        />
      )}
    </div>
  );
}

// Modal Components definitions
function VehicleModal({ editingVehicle, onClose, onSave }) {
  const [regNumber, setRegNumber] = useState(editingVehicle?.regNumber || '');
  const [name, setName] = useState(editingVehicle?.name || '');
  const [type, setType] = useState(editingVehicle?.type || 'Van');
  const [maxCapacity, setMaxCapacity] = useState(editingVehicle?.maxCapacity || 500);
  const [odometer, setOdometer] = useState(editingVehicle?.odometer || 12000);
  const [acquisitionCost, setAcquisitionCost] = useState(editingVehicle?.acquisitionCost || 25000);
  const [region, setRegion] = useState(editingVehicle?.region || 'North');
  const [status, setStatus] = useState(editingVehicle?.status || 'Available');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ regNumber, name, type, maxCapacity, odometer, acquisitionCost, region, status });
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3>{editingVehicle ? 'Edit Vehicle' : 'Register Vehicle'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="form-group">
          <label>Registration Number</label>
          <input type="text" value={regNumber} onChange={e => setRegNumber(e.target.value)} disabled={!!editingVehicle} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Model Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="form-control">
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
          </select>
        </div>
        <div className="form-group">
          <label>Max Load Capacity (kg)</label>
          <input type="number" value={maxCapacity} onChange={e => setMaxCapacity(parseInt(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Odometer (km)</label>
          <input type="number" value={odometer} onChange={e => setOdometer(parseInt(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Acquisition Cost ($)</label>
          <input type="number" value={acquisitionCost} onChange={e => setAcquisitionCost(parseFloat(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Region</label>
          <select value={region} onChange={e => setRegion(e.target.value)} className="form-control">
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="form-control">
            <option value="Available">Available</option>
            <option value="In Shop">In Shop</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Vehicle</button>
      </form>
    </div>
  );
}

function CreateTripModal({ vehicles, drivers, onClose, onSave }) {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleReg, setVehicleReg] = useState(vehicles[0]?.regNumber || '');
  const [driverLicense, setDriverLicense] = useState(drivers[0]?.licenseNumber || '');
  const [cargoWeight, setCargoWeight] = useState(100);
  const [distance, setDistance] = useState(150);
  const [revenue, setRevenue] = useState(500);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ source, destination, vehicleReg, driverLicense, cargoWeight, distance, revenue, recipientName, recipientPhone, deliveryAddress });
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content" onSubmit={handleSubmit} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>Create Trip Draft</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="form-group">
          <label>Origin</label>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Destination</label>
          <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Vehicle</label>
          <select value={vehicleReg} onChange={e => setVehicleReg(e.target.value)} className="form-control">
            {vehicles.map(v => <option key={v.regNumber} value={v.regNumber}>{v.name} ({v.regNumber}) - Max {v.maxCapacity}kg</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Driver</label>
          <select value={driverLicense} onChange={e => setDriverLicense(e.target.value)} className="form-control">
            {drivers.map(d => <option key={d.licenseNumber} value={d.licenseNumber}>{d.name} ({d.licenseNumber})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Cargo Weight (kg)</label>
          <input type="number" value={cargoWeight} onChange={e => setCargoWeight(parseInt(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Planned Distance (km)</label>
          <input type="number" value={distance} onChange={e => setDistance(parseInt(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Earmarked Revenue ($)</label>
          <input type="number" value={revenue} onChange={e => setRevenue(parseFloat(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Recipient Name</label>
          <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Recipient Contact</label>
          <input type="text" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Delivery Address</label>
          <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="form-control" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Draft</button>
      </form>
    </div>
  );
}

function CompleteTripModal({ onClose, onComplete }) {
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(parseInt(finalOdometer), parseFloat(fuelConsumed));
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3>Complete Dispatched Trip</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="form-group">
          <label>Final Odometer Reading (km)</label>
          <input type="number" value={finalOdometer} onChange={e => setFinalOdometer(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Total Fuel Consumed (Liters)</label>
          <input type="number" step="0.1" value={fuelConsumed} onChange={e => setFuelConsumed(e.target.value)} className="form-control" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Complete Trip</button>
      </form>
    </div>
  );
}

function MaintenanceModal({ vehicles, onClose, onSave }) {
  const [vehicleReg, setVehicleReg] = useState(vehicles[0]?.regNumber || '');
  const [serviceType, setServiceType] = useState('Engine Oil Change');
  const [cost, setCost] = useState(150);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ vehicleReg, serviceType, cost, startDate, notes });
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3>Book Service</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="form-group">
          <label>Vehicle</label>
          <select value={vehicleReg} onChange={e => setVehicleReg(e.target.value)} className="form-control">
            {vehicles.map(v => <option key={v.regNumber} value={v.regNumber}>{v.name} ({v.regNumber})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Service Type</label>
          <input type="text" value={serviceType} onChange={e => setServiceType(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Estimated Cost ($)</label>
          <input type="number" value={cost} onChange={e => setCost(parseFloat(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-control" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send to Shop</button>
      </form>
    </div>
  );
}

function ExpenseModal({ vehicles, onClose, onSave }) {
  const [vehicleReg, setVehicleReg] = useState(vehicles[0]?.regNumber || '');
  const [type, setType] = useState('Fuel');
  const [amount, setAmount] = useState(50);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ vehicleReg, type, amount, date, notes });
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3>Record Expense</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="form-group">
          <label>Vehicle</label>
          <select value={vehicleReg} onChange={e => setVehicleReg(e.target.value)} className="form-control">
            {vehicles.map(v => <option key={v.regNumber} value={v.regNumber}>{v.name} ({v.regNumber})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Expense Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="form-control">
            <option value="Fuel">Fuel</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Tolls">Tolls</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Amount ($)</label>
          <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-control" required />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="form-control" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log Expense</button>
      </form>
    </div>
  );
}