/** Database setup for BizTime. */
const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
	DB_URI =
		process.env.DATABASE_TEST_URL ||
		"postgresql://localhost/biztime_test";
} else {
	DB_URI =
		process.env.DATABASE_URL ||
		"postgresql://localhost/biztime";
}

// Create a new instance of the Client object
const client = new Client({
	connectionString: DB_URI,
});

// Connect to PostgreSQL database
client.connect((err) => {
	if (err) {
		console.error("connection error", err.stack);
	} else {
		console.log("connected to the database");
	}
});

module.exports = client;
