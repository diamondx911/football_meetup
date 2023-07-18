const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs')
const passport = require('passport');
const jwt = require('jsonwebtoken');
const sendMail = require('./mailer');

const User = require('../models/User')
const Apartment = require('../models/Apartment')
const JWT_SECRET = 'shit happens when you are in party naked'
  
  

router.get('/login', (req, res) => res.render('login'))

router.get('/register', (req, res) => res.render('register'))

router.get('/reset-password/:id/:token', (req, res) => {
    const {id,token} = req.params;
    User.findOne({_id:id})
    .then( user => {
        if(user){
            try {
                console.log('found user')
                const secret = JWT_SECRET + user.password;
                const payload = jwt.verify(token, secret);
                res.render('reset-password')

            } catch (error) {
                console.log(error.message);
                res.send(error.message);
            }
            
        }
    })
    .catch(err=> res.send('user not found'))

} )

router.post('/reset-password/:id/:token', (req, res) => {
    const {id,token} = req.params;
    const {password,password2} = req.body;

    User.findOne({_id:id})
    .then( user => {
        if(user){
            try {
                console.log('found user')
                let errors = [];
                const secret = JWT_SECRET + user.password;
                const payload = jwt.verify(token, secret);
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(password, salt, (err, hash) => {
                    if(err) throw err;
                    //set password to has
                    user.password = hash;
                    //save the user
                    user.save()
                    .then(user=>{
                        req.flash('success_msg', 'password changed');
                        res.redirect('/users/login')
                    })
                    .catch(err=> console.log(err))
                }))

            } catch (error) {
                console.log(error.message);
                res.send(error.message);
            }
            
        }
    })
    .catch(err=> res.send('user not found'))

} )

router.get('/forgot-password', (req, res) => res.render('forgot-password'))

router.post('/forgot-password', (req, res) => {
    const {email} = req.body;
    User.findOne({email:email})
    .then( user => {
        if(user){
            id = user._id
            console.log(id)
            
            const secret = JWT_SECRET + user.password;
            const payload = {
                email: user.email,
                id: user.id
            }
            const token = jwt.sign(payload, secret, {expiresIn:'15m'})
            const link = 'http://107.152.42.133:5000/users/reset-password/'
            const mailOptions = {
            from: 'soccer_meetup@outlook.com',
            to: email,
            subject: 'Hello from Nodemailer',
            text: link + id + '/' + token
      };
    sendMail(mailOptions);
    req.flash('logged_out', 'you are out');
    res.redirect('/users/login');
        }
    })
    .catch(err=> console.log(err))
 
})

router.post('/register', (req, res) => {
    const { name, email, password, password2} = req.body;
    const score = 0 ;
    let errors = [];
    //check required field
    if(!name || !email || !password || !password2) {
        errors.push({mesg: 'please check all field'})}
    if(password !== password2) {
        errors.push({msg:'password do not match'})
    }
    if(errors.length > 0){
        res.render('register',{
            errors,
            name,
            email,
            password,
            password2
        })
    } else {
        //validation passed
        User.findOne({email:email})
        .then(user => {
            if(user){
                //user exists
                errors.push({msg:'Email is already registered'})
                res.render('register',{
                    errors,
                    name,
                    email,
                    password,
                    password2
                });
            } else {
                const newUser = new User({
                    name,
                    email,
                    score,
                    password
                });
                bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;
                    //set password to has
                    newUser.password = hash;
                    //save the user
                    newUser.save()
                    .then(user=>{
                        req.flash('success_msg', 'you are now registered and can log in');
                        res.redirect('/users/login')
                    })
                    .catch(err=> console.log(err))
                }))
            }
        });

    }
});

//Login handle

router.post('/login', (req, res, next) => {
    passport.authenticate('local',{
        successRedirect: '/map',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
})

//logout handle

router.get('/logout', (req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success_msg', 'Logged out successfully');
    res.redirect('/users/login');
    });

});


router.get('/generate-fake-data', (req, res) => {
    console.log("starting");
    for (var i = 0; i < 10; i++) {
        function getRandom(min, max) {
            return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
        }
        function getRandomLatitude(min, max, decimalPlaces) {
            const random = Math.random() * (max - min) + min;
            return Number(random.toFixed(decimalPlaces));
        }
        const newApartment = new Apartment();
        newApartment.numberOfRooms = 2;
        newApartment.numberOfBathrooms = 2;
        newApartment.isForRent = true;
        newApartment.price = getRandom(3000, 9000) ;
        const decimalPlaces = 14;
        newApartment.coordinates = {
            latitude: getRandomLatitude(33.58803875113305, 33.58642998348364, decimalPlaces),
            longitude: getRandomLatitude(-7.617489695549012, -7.643340826034547, decimalPlaces)
        };
        newApartment.save()
            .then(savedApartment => {
                console.log('Apartment saved successfully:', savedApartment);
            })
            .catch(error => {
                console.error('Error saving apartment:', error);
            });
}});

module.exports = router;