var express = require('express')
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var flash = require('connect-flash');
var bunyan = require('bunyan');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

require('./config/passport')(passport);

var log = bunyan.createLogger({
    name: 'Microsoft OIDC Example Web Application'
});

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser());

app.set('view engine', 'ejs');

//app.use(session({ secret:'sdlfksdlfksldfksdlkfsdlfkslkf'}));
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);

app.listen(port);
console.log(`listening at port: ${port}`);
