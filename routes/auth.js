const express = require('express');
const router = express.Router();
const idpClient = require('../idps');
const config = require('../config');
const {logout} = require('../controllers/auth-api')
const fetch = require("node-fetch");

/* Login */
router.post('/login', async function (req, res) {
    try {
        const idp = config.getIdpOrDefault(req.body['IDP']);
        const { name, tokens, email } = await idpClient.login(req.body['code'], idp, config.getUrlOrDefault(idp, req.body['redirectUri']));
        req.session.userInfo = {
            email: email,
            idp: idp
        };
        req.session.tokens = tokens;
        if (config.authorization_enabled) {
            let headers = {
                'Content-Type': 'application/json',
                'email': email,
                'idp': idp,
            };
            if (req.headers.cookie){
                headers.cookie = req.headers.cookie;
            }
            try {
                let response = await fetch(config.authorization_url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({query: '{getMyUser{role}}'})
                });
                let result = await response.json();
                if (result && result.data && result.data.getMyUser && result.data.getMyUser.role) {
                    let role = result.data.getMyUser.role;
                    res.json({name, email, role});
                } else if (result && result.errors && result.errors[0] && result.errors[0].error) {
                    let error = result.errors[0].error;
                    res.json({name, email, error});
                } else {
                    throw new Error("No response");
                }
            } catch (err) {
                let error = 'Unable to query role: '+err.message;
                res.json({name, email, error});
            }
        } else {
            res.json({name, email});
        }
    } catch (e) {
        if (e.code && parseInt(e.code)) {
            res.status(e.code);
        } else if (e.statusCode && parseInt(e.statusCode)) {
            res.status(e.statusCode);
        } else {
            res.status(500);
        }
        res.json({error: e.message});
    }
});

/* Logout */
router.post('/logout', async function (req, res, next) {
    try {

        const idp = config.getIdpOrDefault(req.body['IDP']);
        await idpClient.logout(idp, req.session.tokens);
        // Remove User Session
        return logout(req, res);
    } catch (e) {
        console.log(e);
        res.status(500).json({errors: e});
    }
});

/* Authenticated */
// Return {status: true} or {status: false}
// Calling this API will refresh the session
router.post('/authenticated', async function (req, res, next) {
    try {
        if (req.session.tokens) {
            return res.status(200).send({status: true});
        } else {
            return res.status(200).send({status: false});
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({errors: e});
    }
});


/* GET ping-ping for health checking. */
router.get('/ping', function (req, res, next) {
    res.send(`pong`);
});

/* GET version for health checking and version checking. */
router.get('/version', function (req, res, next) {
    res.json({
        version: config.version, date: config.date
    });
});

module.exports = router;
