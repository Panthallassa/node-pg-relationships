const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// GET, list all industries with respective company codes
router.get("/", async (req, res, next) => {
	try {
		const result = await db.query(
			`SELECT i.code, i.industry, ARRAY_AGG(ci.company_code) AS companies
            FROM industries i
            LEFT JOIN companies_industries ci ON i.code = ci.industry_code
            GROUP BY i.code, i.industry`
		);

		return res.json({ industries: result.rows });
	} catch (err) {
		return next(err);
	}
});

// POST, add a new industry
router.post("/", async (req, res, next) => {
	try {
		const { code, industry } = req.body;
		const result = await db.query(
			"INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry",
			[code, industry]
		);

		return res
			.status(201)
			.json({ industry: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
