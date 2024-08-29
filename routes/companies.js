const express = require("express");
const router = new express.Router();
const db = require("../db");
const slugify = require("slugify");
const ExpressError = require("../expressError");

// GET, return list of companies
router.get("/", async (req, res, next) => {
	try {
		const result = await db.query(
			"SELECT code, name FROM companies"
		);
		return res.json({ companies: result.rows });
	} catch (err) {
		return next(err);
	}
});

// GET, return an object of company
router.get("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const result = await db.query(
			"SELECT code, name, description FROM companies WHERE code = $1",
			[code]
		);

		if (result.rows.length === 0) {
			throw new ExpressError(
				`Company with code '${code}' not found`,
				404
			);
		}

		const invoicesResult = await db.query(
			"SELECT id FROM invoices WHERE comp_code = $1",
			[code]
		);

		const company = result.rows[0];
		company.invoices = invoicesResult.rows.map(
			(inv) => inv.id
		);

		const industriesResult = await db.query(
			`SELECT i.code, i.industry FROM industries i
			JOIN companies_industries ci ON i.code = ci.industry_code
			WHERE ci.company_code = $1
			`,
			[code]
		);

		company.industries = industriesResult.rows;

		return res.json({ company });
	} catch (err) {
		return next(err);
	}
});

// POST, adds a new company
router.post("/", async (req, res, next) => {
	try {
		const { code, name, description } = req.body;
		const slug = slugify(name, { lower: true });

		const result = await db.query(
			"INSERT INTO companies (code, name, description, slug) VALUES ($1, $2, $3) RETURNING code, name, description",
			[code, name, description, slug]
		);

		return res
			.status(201)
			.json({ company: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

// PUT, edit an existing company
router.put("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;

		const result = await db.query(
			"UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description",
			[name, description, code]
		);

		if (result.rows.length == 0) {
			throw new ExpressError(
				`Company with code '${code}' not found`,
				404
			);
		}
		return res.json({ company: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

// DELETE, delete a company
router.delete("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;

		const result = await db.query(
			"DELETE FROM companies WHERE code = $1 RETURNING code",
			[code]
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "Company not found" });
		}

		return res.json({ status: "deleted" });
	} catch (err) {
		return next(err);
	}
});

// POST, associate an industry with a company
router.post("/:code/industries", async (req, res, next) => {
	try {
		const { code } = req.params;
		const { industry_code } = req.body;

		const result = await db.query(
			"INSERT INTO companies_industries (company_code, industry_code) VALUES ($1, $2) RETURNING company_code, industry_code",
			[code, industry_code]
		);

		return res
			.status(201)
			.json({ association: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
