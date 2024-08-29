const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
	try {
		await db.query("DELETE FROM invoices");
		await db.query("DELETE FROM companies");

		await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Inc.', 'Maker of OSX.'),
           ('ibm', 'IBM', 'Big Blue')`);

		await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
    VALUES ('apple', 100, false, '2024-01-01', null),
           ('apple', 200, true, '2024-01-02', '2024-01-03'),
           ('ibm', 300, false, '2024-01-03', null)`);

		// Log data to verify setup
		const companies = await db.query(
			"SELECT * FROM companies"
		);
		console.log("Companies:", companies.rows);

		const invoices = await db.query(
			"SELECT * FROM invoices"
		);
		console.log("Invoices:", invoices.rows);
	} catch (err) {
		console.error("Error setting up test data", err);
	}
});

afterEach(async () => {
	await db.query("DELETE FROM invoices");
	await db.query("DELETE FROM companies");
});

afterAll(async () => {
	await db.end();
});

describe("GET /invoices", () => {
	test("Gets a list of invoices", async () => {
		const response = await request(app).get("/invoices");
		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({
			invoices: [
				{ id: expect.any(Number), comp_code: "apple" },
				{ id: expect.any(Number), comp_code: "apple" },
				{ id: expect.any(Number), comp_code: "ibm" },
			],
		});
	});
});

describe("GET /invoices/:id", () => {
	test("Gets a single invoice", async () => {
		const response = await request(app).get("/invoices/55");
		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({
			invoice: {
				id: 55,
				amt: 100,
				paid: false,
				add_date: "2024-01-01T00:00:00.000Z",
				paid_date: null,
				comp_code: "apple",
				company: {
					code: "apple",
					name: "Apple Inc.",
					description: "Maker of OSX.",
				},
			},
		});
	});

	test("Responds with 404 if can't find invoice", async () => {
		const response = await request(app).get(
			"/invoices/999"
		);
		expect(response.statusCode).toBe(404);
	});
});

describe("POST /invoices", () => {
	test("Creates a new invoice", async () => {
		const response = await request(app)
			.post("/invoices")
			.send({
				comp_code: "apple",
				amt: 400,
			});
		expect(response.statusCode).toBe(201);
		expect(response.body).toEqual({
			invoice: {
				id: expect.any(Number),
				comp_code: "apple",
				amt: 400,
				paid: false,
				add_date: expect.any(String),
				paid_date: null,
			},
		});
	});
});

describe("PUT /invoices/:id", () => {
	test("Updates an existing invoice", async () => {
		const response = await request(app)
			.put("/invoices/1")
			.send({
				amt: 500,
				paid: true,
			});
		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({
			invoice: {
				id: 1,
				comp_code: "apple",
				amt: 500,
				paid: true,
				add_date: expect.any(String),
				paid_date: expect.any(String),
			},
		});
	});

	test("Responds with 404 if can't find invoice", async () => {
		const response = await request(app)
			.put("/invoices/999")
			.send({
				amt: 500,
				paid: true,
			});
		expect(response.statusCode).toBe(404);
	});
});

describe("DELETE /invoices/:id", () => {
	test("Deletes an invoice", async () => {
		const response = await request(app).delete(
			"/invoices/52"
		);
		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({ status: "deleted" });
	});

	test("Responds with 404 if can't find invoice", async () => {
		const response = await request(app).delete(
			"/invoices/999"
		);
		expect(response.statusCode).toBe(404);
	});
});
