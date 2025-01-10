const mysql = require('mysql2/promise');

describe('Database Tests', () => {
	let connection;

	beforeAll(async () => {
		connection = await mysql.createConnection({
			host: 'localhost',
			user: 'Miller',
			password: 'Miller2001*',
			database: 'bot'
		});
		await connection.query(`CREATE TABLE IF NOT EXISTS clientes (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE
		)`);
	});

	afterAll(async () => {
		await connection.query('DROP TABLE IF EXISTS clientes');
		await connection.end();
	});

	test('Insert a new client', async () => {
		const [result] = await connection.query('INSERT INTO clientes (name, email) VALUES (?, ?)', ['John Doe', 'john@example.com']);
		expect(result.affectedRows).toBe(1);
	});

	test('Insert a client with duplicate email', async () => {
		await connection.query('INSERT INTO clientes (name, email) VALUES (?, ?)', ['Jane Doe', 'jane@example.com']);
		await expect(connection.query('INSERT INTO clientes (name, email) VALUES (?, ?)', ['Another Name', 'jane@example.com'])).rejects.toThrow();
	});
});