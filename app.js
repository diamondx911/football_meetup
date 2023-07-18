const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
var bodyParser = require('body-parser')

const app = express();
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

require('./config/passport')(passport);

//DB connect

const db = require('./config/key').mongoURI;

mongoose
  .connect(
    db,
    { useNewUrlParser: true ,useUnifiedTopology: true}
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
app.set("views", './views')
app.use(expressLayouts);
app.use(express.static(__dirname+'/static'));
app.set('view engine', 'ejs');

app.use(expressLayouts);


//Bodyparser

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//express session

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  }));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//global vars

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.logged_out = req.flash('logged_out');
    res.locals.error = req.flash('error');
    next();

});


app.use('/', require('./routes/index.js'));

app.use('/users', require('./routes/users.js'));

const PORT = process.env.PORT || 5000 ;

const latitude = 33.57737116792887; // Example latitude
const longitude = -7.63227939605713; // Example longitude
const language = 'fr';

// Build the API request URL
const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;


fetch(apiUrl, {
  headers: {
    'accept-language': language
  }
})
  .then(response => response.json())
  .then(data => {
    const address = data.address;
    //console.log(address);
    // Process the address as needed
  })
  .catch(error => {
    console.error('Error:', error);
  });

app.listen(PORT, console.log('server started on port 5000'));
