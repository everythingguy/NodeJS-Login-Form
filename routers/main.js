const express = require("express");
const router = express.Router();

function loggedIn(req, res, next) {
    if(req.user) {
        next();
    } else {
        req.flash('error', 'Please login to gain access to that page');
        res.redirect('/users/login');
    }
}

router.get('/', (req, res) => {
    res.render('home', {
        title: 'Home',
        user: req.user
    });
});

module.exports = router;