const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeAll(async () => {
	// Drop the tables if they exist (to avoid duplication errors)
	await db.query("DROP TABLE IF EXISTS invoices");
	await db.query("DROP TABLE IF EXISTS companies");

	// Create the companies table
	await db.query(`
	  CREATE TABLE companies (
		code text PRIMARY KEY,
		name text NOT NULL UNIQUE,
		description text
	  )
	`);

	await db.query(`
	  CREATE TABLE invoices (
		id serial PRIMARY KEY,
		comp_code text NOT NULL REFERENCES companies(code) ON DELETE CASCADE,
		amt float NOT NULL,
		paid boolean DEFAULT false NOT NULL,
		add_date date DEFAULT CURRENT_DATE NOT NULL,
		paid_date date,
		CONSTRAINT invoices_amt_check CHECK (amt > 0)
	  )
	`);
});

beforeEach(async () => {
	await db.query(`
    INSERT INTO companies
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
           ('ibm', 'IBM', 'Big blue.');

    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null),
           ('apple', 200, false, null),
           ('apple', 300, true, '2018-01-01'),
           ('ibm', 400, false, null);`);
});

afterEach(async () => {
	await db.query("DELETE FROM invoices");
	await db.query("DELETE FROM companies");
});

afterAll(async () => {
	await db.end();
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

describe("GET /companies", () => {
	test("Gets a list of companies", async () => {
		const res = await request(app).get("/companies");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			companies: [
				{ code: "apple", name: "Apple Computer" },
				{ code: "ibm", name: "IBM" },
			],
		});
	});
});

describe("GET /companies/:code", () => {
	test("Gets a single company", async () => {
		const res = await request(app).get("/companies/apple");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company: {
				code: "apple",
				name: "Apple Computer",
				description: "Maker of OSX.",
				invoices: [5, 6, 7],
			},
		});
	});

	test("Responds with a 404 if company not found", async () => {
		const res = await request(app).get(
			"/companies/nonexistent"
		);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /companies", () => {
	test("Creates a new company", async () => {
		const res = await request(app).post("/companies").send({
			code: "msft",
			name: "Microsoft",
			description: "Maker of Windows.",
		});
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			company: {
				code: "msft",
				name: "Microsoft",
				description: "Maker of Windows.",
			},
		});
	});
});

describe("PUT /companies/:code", () => {
	test("Updates a single company", async () => {
		const res = await request(app)
			.put("/companies/apple")
			.send({
				name: "Apple",
				description: "Maker of iPhones.",
			});
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company: {
				code: "apple",
				name: "Apple",
				description: "Maker of iPhones.",
			},
		});
	});

	test("Responds with 404 if company not found", async () => {
		const res = await request(app)
			.put("/companies/nonexistent")
			.send({
				name: "Nonexistest",
				description: "Doesn't exist.",
			});
		expect(res.statusCode).toBe(404);
	});
});

describe("DELETE /companies/:code", () => {
	test("Deletes a single company", async () => {
		const res = await request(app).delete(
			"/companies/apple"
		);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ status: "deleted" });
	});

	test("Responds with 404 if company not found", async () => {
		const res = await request(app).delete(
			"/companies/nonexistent"
		);
		expect(res.statusCode).toBe(404);
	});
});
