const express = require('express');
const router = express.Router();
const idpClient = require('../idps');
const config = require('../config');
const {logout} = require('../controllers/auth-api')
const {NIH} = require("../constants/idp-constants");

/* Login */
router.post('/login', async function (req, res) {
    try {
        const reqIDP = config.getIdpOrDefault(req.body['IDP']);
        const { name, lastName, tokens, email, idp } = await idpClient.login(req.body['code'], reqIDP, config.getUrlOrDefault(reqIDP, req.body['redirectUri']));
        req.session.userInfo = {
            email: email,
            IDP: idp,
            firstName: name,
            lastName: lastName
        };
        req.session.tokens = tokens;
        res.json({name, email, "timeout": config.session_timeout / 1000});
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
        let userInfo = req.session.userInfo;
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
        version: config.version, date: config.date, variables: {
            version: !!process.env.VERSION,
            date: !!process.env.DATE,
            idp: !!process.env.IDP,
            session_secret: !!process.env.SESSION_SECRET,
            session_timeout: !!process.env.SESSION_TIMEOUT,  // 30 minutes
            noAutoLogin: !!process.env.NO_AUTO_LOGIN,
            nih: {
                CLIENT_ID: !!process.env.NIH_CLIENT_ID,
                CLIENT_SECRET: !!process.env.NIH_CLIENT_SECRET,
                BASE_URL: !!process.env.NIH_BASE_URL,
                REDIRECT_URL: !!process.env.NIH_REDIRECT_URL,
                USERINFO_URL: !!process.env.NIH_USERINFO_URL,
                AUTHORIZE_URL: !!process.env.NIH_AUTHORIZE_URL,
                TOKEN_URL: !!process.env.NIH_TOKEN_URL,
                LOGOUT_URL: !!process.env.NIH_LOGOUT_URL,
                SCOPE: !!process.env.NIH_SCOPE,
                PROMPT: !!process.env.NIH_PROMPT
            },
        }
    });
});

module.exports = router;
