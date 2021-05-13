//imports
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

//db
const db = require("monk")('username:password@domain:port/dbName'); //TODO: set this*********************************************
const users = db.get('users');

db.on('open', () => {
    console.log('Connected to DB');
});

//auth strat
passport.use(new LocalStrategy(function(username, password, done) {
    var userData = null;

    //get user by username
    users.find()
    .then(userDB => {
            userDB.forEach(element => {
            if(element["username"] == username) {
                userData = element;
            }
        })
    })
    .then(() => {
        //didn't find a user so the username is incorrect
        if(userData == null) {
            console.log("Failed Login Attempt: Incorrect Username or Password");
            return done(null, false, { message: 'Incorrect Username or Password.' });
        }
        
        //found a user, are the passwords the same?
        bcrypt.compare(password, userData['password'], (err, res) => {
            if(err) throw err;
            //yes
            if(res) {
                console.log(userData['username'] + " Logged in");
                return done(null, userData)
            } 
            //No
            else {
                console.log("Failed Login Attempt: Incorrect Incorrect Username or Password");
                return done(null, false, {message: 'Incorrect Username or Password.'})
            }
        });
    });
}));

passport.serializeUser((user, done) => {
    done(null, user['_id']);
});

passport.deserializeUser((id, done) => {
    //find user by id and return the userData
    var userProfile = null;
    
    users.find().then(userDB => {
        userDB.forEach(profile => {
            if(profile['_id'] == id) { 
                userProfile = profile;
            }
        });
    }).then(profile => {
        if(userProfile != null) {
        done(null, userProfile)
        }
    });
});

router.get('/', function(req, res) {
    res.redirect('login');
});

router.get('/login', function(req, res) {
    res.render('login', {
        title: 'Login',
        script: '/js/partial/login.js',
        flash: req.flash('error'),
        success: req.flash('success'),
        user: req.user
    });
});

router.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }));

router.get('/logout', function(req,res) {
    req.logout();
    req.flash('success', 'Successfully Logged Out');
    res.redirect('login');
});

router.get('/register', function(req, res) {
    res.render('register', {
        title: 'Register',
        script: '/js/partial/register.js',
        user: req.user
    });
});

router.post('/register', function(req, res) {
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password', 'Password must be at least 5 digits long').isLength({min: 5});
    req.checkBody('password', 'Passwords do not match').equals(req.body.passVerify.toString());

    var errors = req.validationErrors();

    if(errors) {
        console.log(errors);
        
        res.render('register', {
            title: 'Register',
            script: '/js/partial/register.js',
            err: errors,
            user: req.user
        });
    }
    else {
        var data = {
            name: req.body.name.toString(),
            email: req.body.email.toString(),
            username: req.body.username.toString(),
            password: req.body.password.toString()
        }

        var verify = true;
        var verifyErrors = [];

        users.find()
            .then(userData => {
                userData.forEach(element => {
                    if(verify) {
                        if(data['email'] == element['email']) {
                            verify = false;
                            verifyErrors.push({param: 'email', msg: 'The email already has an account', value: ''});
                        }
                        else if(data['username'] == element['username']) {
                            verify = false;
                            verifyErrors.push({param: 'username', msg: 'That username is already in use', value: ''});
                        }
                    }
                });
            })
            .then(() =>{
                if(verify) {
                    bcrypt.genSalt(10, function(err, salt) {
                        if(err) throw err;
                        bcrypt.hash(data['password'], salt, function(err, hash) {
                            if(err) throw err;
                            data['password'] = hash;
                            console.log("New User: " + data['username']);
                            users.insert(data);
                        });
                    });

                    res.render('login', {
                        title: "Login",
                        script: '/js/partial/login.js',
                        success: 'You are now registered, please login',
                        user: req.user
                    });
                }
                else {
                    res.render('register', {
                        title: "Register",
                        script: '/js/partial/register.js',
                        err: verifyErrors,
                        user: req.user
                    });
                }
            });
    }
});

module.exports = router;