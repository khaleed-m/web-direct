const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize SQLite database
const db = new sqlite3.Database('leads.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    industry TEXT,
    employees TEXT,
    useCase TEXT,
    message TEXT,
    newsletter BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Leads table ready');
    }
  });
});

// API Routes
// API endpoint for voice assistant to submit demo requests
app.post('/api/voice-demo', (req, res) => {
  console.log('Voice assistant demo request:', req.body);
  
  const {
    firstName,
    lastName,
    email,
    company,
    phone,
    industry,
    employees,
    useCase,
    message
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !company) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'I need your first name, last name, email, and company name to book your demo.' 
    });
  }

  const stmt = db.prepare(`INSERT INTO leads 
    (firstName, lastName, email, company, phone, industry, employees, useCase, message, newsletter) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);;

  stmt.run([
    firstName,
    lastName,
    email,
    company,
    phone || null,
    industry || null,
    employees || null,
    useCase || 'Voice Assistant Request',
    message || 'Demo requested via voice assistant',
    0
  ], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ 
        error: 'Failed to save data',
        message: 'Sorry, there was an error saving your information. Please try again.' 
      });
    } else {
      console.log('Voice demo request saved, ID:', this.lastID);
      res.json({ 
        success: true, 
        message: 'Perfect! Your demo has been scheduled. Our team will contact you within 24 hours to confirm the details.',
        id: this.lastID 
      });
    }
  });

  stmt.finalize();
});

// Submit form data
app.post('/api/submit-demo', (req, res) => {
  console.log('Received form submission:', req.body);
  
  const {
    firstName,
    lastName,
    email,
    company,
    phone,
    industry,
    employees,
    useCase,
    message,
    newsletter
  } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !company) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stmt = db.prepare(`INSERT INTO leads 
    (firstName, lastName, email, company, phone, industry, employees, useCase, message, newsletter) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  stmt.run([
    firstName,
    lastName,
    email,
    company,
    phone || null,
    industry || null,
    employees || null,
    useCase || null,
    message || null,
    newsletter ? 1 : 0
  ], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Failed to save data' });
    } else {
      console.log('Data saved successfully, ID:', this.lastID);
      res.json({ 
        success: true, 
        message: 'Demo request submitted successfully!',
        id: this.lastID 
      });
    }
  });

  stmt.finalize();
});

// Test database connection
app.get('/api/test', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM leads', (err, row) => {
    if (err) {
      console.error('Database test error:', err);
      res.status(500).json({ error: 'Database connection failed', details: err.message });
    } else {
      res.json({ 
        success: true, 
        message: 'Database connected successfully',
        totalLeads: row.count 
      });
    }
  });
});

// Get all leads
app.get('/api/leads', (req, res) => {
  db.all('SELECT * FROM leads ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch data' });
    } else {
      res.json(rows);
    }
  });
});

// Get lead by ID
app.get('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM leads WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch data' });
    } else if (!row) {
      res.status(404).json({ error: 'Lead not found' });
    } else {
      res.json(row);
    }
  });
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM leads WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete data' });
    } else {
      res.json({ success: true, message: 'Lead deleted successfully' });
    }
  });
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});