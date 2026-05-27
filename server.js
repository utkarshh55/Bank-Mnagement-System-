/**
 * ============================================
 *   NeoBank — Mini Bank Management System
 *   Backend: Node.js + Express
 *   Author: NeoBank Demo
 *   Port: 5000
 * ============================================
 */

// ===== IMPORTS =====
const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ===== APP SETUP =====
const app  = express();
const PORT = 5000;

// Middleware: Parse JSON request bodies
app.use(express.json());

// Middleware: Allow requests from any origin (for development)
app.use(cors());

// Middleware: Serve frontend files from the same folder as server.js
// Place your index.html in the same directory as server.js
app.use(express.static(path.join(__dirname)));

// ===== IN-MEMORY DATABASE =====
// This array acts as our "database" — data resets when the server restarts
// Each user looks like:
// {
//   id:           "ACC-1234",
//   name:         "Arjun Sharma",
//   balance:      1500,
//   transactions: [
//     { type: "deposit", amount: 500, date: "2024-01-01T10:00:00.000Z" }
//   ]
// }
const users = [];

// ===== HELPER: Generate a unique Account ID =====
function generateId() {
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `ACC-${num}`;
}

// ===== HELPER: Find user by ID =====
function findUser(id) {
  return users.find(u => u.id === id);
}

// ============================================
//   ROUTES
// ============================================

/**
 * POST /create
 * Create a new bank account
 * Body: { name: "Arjun Sharma" }
 * Response: { id, name, balance, transactions }
 */
app.post('/create', (req, res) => {
  const { name } = req.body;

  // Validation: name is required
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required.' });
  }

  // Create a new user object
  const newUser = {
    id:           generateId(),
    name:         name.trim(),
    balance:      0,             // New account starts with ₹0
    transactions: []             // Empty transaction history
  };

  // Save to our in-memory array
  users.push(newUser);

  console.log(`✅ Account created: ${newUser.id} | Name: ${newUser.name}`);

  // Return the new user (excluding sensitive internals if any)
  res.status(201).json(newUser);
});


/**
 * POST /deposit
 * Add money to a user's account
 * Body: { id: "ACC-1234", amount: 500 }
 * Response: { id, name, balance, message }
 */
app.post('/deposit', (req, res) => {
  const { id, amount } = req.body;

  // Validation: ID is required
  const user = findUser(id);
  if (!user) {
    return res.status(404).json({ error: `Account not found: ${id}` });
  }

  // Validation: amount must be a positive number
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  // Perform deposit
  user.balance += parseFloat(amount);

  // Record transaction
  user.transactions.push({
    type:   'deposit',
    amount: parseFloat(amount),
    date:   new Date().toISOString()  // ISO format date-time
  });

  console.log(`💰 Deposit: ${id} | +₹${amount} | Balance: ₹${user.balance}`);

  res.json({
    id:      user.id,
    name:    user.name,
    balance: user.balance,
    message: `Deposited ₹${amount}. New balance: ₹${user.balance}`
  });
});


/**
 * POST /withdraw
 * Subtract money from a user's account
 * Body: { id: "ACC-1234", amount: 200 }
 * Response: { id, name, balance, message }
 */
app.post('/withdraw', (req, res) => {
  const { id, amount } = req.body;

  // Validation: ID is required
  const user = findUser(id);
  if (!user) {
    return res.status(404).json({ error: `Account not found: ${id}` });
  }

  // Validation: amount must be a positive number
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  // Validation: insufficient balance check
  if (parseFloat(amount) > user.balance) {
    return res.status(400).json({
      error: `Insufficient balance. Available: ₹${user.balance}`
    });
  }

  // Perform withdrawal
  user.balance -= parseFloat(amount);

  // Record transaction
  user.transactions.push({
    type:   'withdraw',
    amount: parseFloat(amount),
    date:   new Date().toISOString()
  });

  console.log(`🔴 Withdraw: ${id} | -₹${amount} | Balance: ₹${user.balance}`);

  res.json({
    id:      user.id,
    name:    user.name,
    balance: user.balance,
    message: `Withdrew ₹${amount}. Remaining balance: ₹${user.balance}`
  });
});


/**
 * GET /balance/:id
 * Get the current balance of a user
 * Params: id = "ACC-1234"
 * Response: { id, name, balance }
 */
app.get('/balance/:id', (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: `Account not found: ${req.params.id}` });
  }

  res.json({
    id:      user.id,
    name:    user.name,
    balance: user.balance
  });
});


/**
 * GET /history/:id
 * Get full transaction history of a user
 * Params: id = "ACC-1234"
 * Response: { id, name, transactions: [...] }
 */
app.get('/history/:id', (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: `Account not found: ${req.params.id}` });
  }

  res.json({
    id:           user.id,
    name:         user.name,
    transactions: user.transactions
  });
});


// ===== 404 Handler for unknown routes =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});


// ============================================
//   START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   🏦  NeoBank Server is Running!     ║');
  console.log(`  ║   🌐  http://localhost:${PORT}           ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  API Endpoints:');
  console.log('  POST  /create       → Create account');
  console.log('  POST  /deposit      → Deposit money');
  console.log('  POST  /withdraw     → Withdraw money');
  console.log('  GET   /balance/:id  → Get balance');
  console.log('  GET   /history/:id  → Get transactions');
  console.log('');
});