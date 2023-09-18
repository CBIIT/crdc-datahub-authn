const express = require('express');
const router = express.Router();
const config = require('../config');

/* GET ping-ping for health checking. */
router.get('/ping', function (req, res, next) {
    res.send(`pong`);
});

// /* GET version for health checking and version checking. */
router.get('/version', function (req, res, next) {
    res.json({
        version: config.version, date: config.date
    });
});

module.exports = router;
