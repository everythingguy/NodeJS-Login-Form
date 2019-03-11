//imports
const express = require("express");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const validator = require("express-validator");
const path = require("path");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const fs = require("fs");
var flash = require("connect-flash");

const app = express();
//local imports
const loginRoutes = require("./routers/login");
const mainRoutes = require("./routers/main");

//whitelist for ip firewall
//const whitelist = [];
//middleware
//body parser for json
app.use(express.json());
app.use(require('body-parser').urlencoded({
    extended: true
}));
//flash messaging for failed login error messages
app.use(flash());
//cookie parser
app.use(cookieParser());
//session
app.use(session({
    //TODO: enter a secret*****************************************************************************
    secret: '',
    saveUninitialized: true,
    resave: true
}));
//Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(validator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.'),
        root = namespace.shift(),
        formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }

        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));
//Set static folder for express to search for files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/users', express.static(path.join(__dirname, 'private')));

//set html view engine
app.set('views', path.join(__dirname, "views"));
app.engine('hbs', exphbs({ extname:'hbs', defaultLayout:'layout', layoutsDir: __dirname + "/views/layouts/", partialsDir: __dirname + "/views/partials/" }));
app.set('view engine', 'hbs');

//ip firewall
/* app.use((req, res, next) => {
    var ip = req.connection.remoteAddress;

    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7)
    }

    if (whitelist.includes(ip)) {
        console.log("Connected: " + ip);
        next();
    } else {
        console.log("Blocked Connection: " + ip);
        res.status(403);
    }
}); */

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
        
    return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue
    }[operator];
});

//routes
app.use('/users', loginRoutes);

app.use('/', mainRoutes);

//set port for easier refrence
const port = process.env.PORT || 80;
app.set('port', port);
//start listening
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});