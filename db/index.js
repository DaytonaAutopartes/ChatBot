const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'Miller',
  password: 'Miller2001*',
  database: 'bot'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

const createClientesTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefono VARCHAR(20)
    )
  `;
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    console.log('Clientes table created or already exists');
  });
};

createClientesTable();

module.exports = connection;