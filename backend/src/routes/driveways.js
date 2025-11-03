const express = require("express");
const router = express.Router();
const { Driveway } = require("../models");

// GET /api/driveways?location=New York
router.get("/", async (req, res) => {
  try {
    const { location } = req.query;

    let driveways;
    if (location) {
      // Simple substring match for now
      driveways = await Driveway.findAll({
        where: {
          address: {
            [require("sequelize").Op.like]: `%${location}%`,
          },
        },
      });
    } else {
      driveways = await Driveway.findAll();
    }

    res.json(driveways);
  } catch (err) {
    console.error("Error fetching driveways:", err);
    res.status(500).json({ error: "Failed to fetch driveways" });
  }
});

module.exports = router;
