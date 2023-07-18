const express = require('express');
const router = express.Router();
const moment = require('moment');
const Apartment = require('../models/Apartment');
const Event = require('../models/Events');
const sendMail = require('./mailer');
const {ensureAuthenticated} = require('../config/auth')
const multer = require("multer");


router.get('/', (req, res) => { res.redirect('/map') });

router.get('/my_profil', ensureAuthenticated, (req, res) => {
  const organizerEventsPromise = Event.find({ organizer: req.user._id })
  .populate('organizer invitedNames')
  .exec();
  const invitedEventsPromise = Event.find({ invitedNames: req.user._id })
  .populate('organizer invitedNames')
  .exec();
  Promise.all([organizerEventsPromise, invitedEventsPromise])
    .then(([organizerEvents, invitedEvents]) => {
      res.render('my_profil', { organizerEvents, invitedEvents });
    })
    .catch((err) => {
      console.error(err);
    });
});

router.get('/announce', ensureAuthenticated, (req, res) => res.render('announce', {user: req.user}));

router.get('/dashboard', ensureAuthenticated, (req, res) =>{
  console.log(req.user.name);
  Apartment.find({ price: { $gt: 2000 } })
    .then(apartment => {
      
      res.render('dashboard', {user: req.user, apartment })
    })
    .catch(error => {
      console.error(error);
    });
     });

router.get('/map', (req, res) =>{

Event.find({}).
  populate('organizer').
  populate('invitedNames')
  .then(event => {
    //console.log(event)
    console.log(req.isAuthenticated());
    const sanitizedEvents = event.map(event => {
      return {
        _id: event._id,
        dates: event.dates,
        coordinates: event.coordinates,
        invitedNames: event.invitedNames.map(invitedName => invitedName.name),
        numberPlayer: event.numberPlayer,
        organizer:event.organizer.name
      };
    });
    res.render('map', {logged:req.isAuthenticated(), event: sanitizedEvents, user:req?.user || 'not_logged' })
  })
  .catch(error => {
    console.error(error);
  });
    });

router.post("/cancel_join", (req, res) => {
  Event.findOneAndUpdate(
    { _id: req.body.event },
    { $pull: { invitedNames: req.user._id } },
    { new: true }
  ).populate('organizer')
    .then((event) => {
      if (!event) {
        console.log('Event not found.');
      } else {
        const mailOptions = {
          from: 'soccer_meetup@outlook.com',
          to: event.organizer.email,
          subject: 'Someone canceled !',
          text: 'Hi,\n' +
                 req.user.name + ' decided to cancel.\n' + 
                 'He is not coming anymore \n' +
                 'cheers,\n' + 'The soccer meetup team.'
        }
        sendMail(mailOptions);
        console.log('User removed from invitedNames successfully.');
        req.flash('logged_out', 'Event canceled successfully');
        res.redirect('/map')
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

router.post("/cancel_create", (req, res) => {
  console.log("cancelling create")
  Event.deleteOne({ _id: req.body.event })
  .then(() => {
    console.log('Event deleted successfully.');
    req.flash('logged_out', 'Event deleted successfully');
    res.redirect('/map')
  })
  .catch((err) => {
    console.error(err);
  });
});

router.post("/info_event", (req, res) => {
  console.log(req.body.test)
  Event.findOne(
    { _id: req.body.test }
  ).populate('organizer')
    .populate('invitedNames')
    .then(updatedEvent => {
      if (updatedEvent) {
        // Event found and updated
        //console.log('Event updated:', updatedEvent);
        const latitude = updatedEvent.coordinates.latitude; // Example latitude
        const longitude = updatedEvent.coordinates.longitude; // Example longitude
        const language = 'fr';
        const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        fetch(apiUrl, {
          headers: {
            'accept-language': language
          }
        })
          .then(response => response.json())
          .then(data => {
            const address = data.address;
            console.log(address);
            // Process the address as needed
            res.render('info_event', {user:req.user, event: updatedEvent, address})
          })
          .catch(error => {
            console.error('Error:', error);
          });
      } else {
        //Event not found
        console.log('Event not found');
      }
    })
    .catch(error => {
      // Error occurred
      console.error('Error updating event:', error);
    });
})


router.post("/join", (req, res) => {
  console.log(req.body.test)
  Event.findOneAndUpdate(
    { _id: req.body.test }, // Filter: Find the event by its ID
    { $push: { invitedNames: req.user.id } }, // Update: Specify the fields you want to update
    { new: true } // Options: Set { new: true } to return the updated event
  ).populate('organizer')
    .populate('invitedNames')
    .then(updatedEvent => {
      if (updatedEvent) {
        console.log(updatedEvent.organizer.name)
        const mailOptions = {
        from: 'soccer_meetup@outlook.com',
        to: updatedEvent.organizer.email,
        subject: 'Someone joined you soccer event !',
        text: 'Hi,\n' +
               req.user.name + ' decided to join your event.\n' + 
               'You can contact him in the following email: ' + req.user.email + '\n' +
               'cheers,\n' + 'The soccer meetup team.'
      };
        const latitude = updatedEvent.coordinates.latitude; // Example latitude
        const longitude = updatedEvent.coordinates.longitude; // Example longitude
        const language = 'fr';
        const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        fetch(apiUrl, {
          headers: {
            'accept-language': language
          }
        })
          .then(response => response.json())
          .then(data => {
            const address = data.address;
            console.log(address);
            // Process the address as needed
            sendMail(mailOptions);
            res.render('success_join', {user: updatedEvent, address})
          })
          .catch(error => {
            console.error('Error:', error);
          });


        
      } else {
        //Event not found
        console.log('Event not found');
      }
    })
    .catch(error => {
      // Error occurred
      console.error('Error updating event:', error);
    });
})

router.post("/create_event", (req, res) => {
  console.log(req.body)
  const newEvent = new Event();
  newEvent.numberPlayer = req.body.players;
  console.log(req.body.trip_date);
  newEvent.dates = [
    {
      date: moment(req.body.trip_date), // Current date
      time: req.body.Time, // Current time
    },
  ] ;
  newEvent.organizer = req.body.user ;
  newEvent.coordinates = {
    latitude: req.body.latitude,
    longitude: req.body.longitude
  };
  newEvent.save()
  .then(savedEvent => {
    //console.log('event saved successfully:', savedEvent);
    req.flash('logged_out', 'Event created successfully');
    res.redirect('/map')
  })
  .catch(error => {
    //console.error('Error saving apartment:', error);
  });
})


router.get('/search', (req, res) => {
    const { maxPrice } = req.query;
    const { city } = req.query;
    const { gogo } = req.query;
    const {balance} = req.query;
  
    console.log('Max Price:', maxPrice);
    Apartment.find({ price: { $gt: 2000 } })
    .then(apartment => {
      console.log(balance);
    })
    .catch(error => {
      console.error(error);
    });
});

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    // Add file extension to the original filename
    const originalname = file.originalname;
    const extension = originalname.substring(originalname.lastIndexOf('.'));
    const filename = Date.now() + extension;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

router.post("/upload_event", upload.array("files"), uploadFiles);

function uploadFiles(req, res) {

  const newEvent = new Event();
  newEvent.numberPlayer = req.body.players;
  console.log(req.body.date);
  newEvent.dates = [
    {
      date: moment(req.body.date), // Current date
      time: req.body.time, // Current time
    },
  ] ;
  newEvent.organizer = req.body.user ;
  newEvent.coordinates = {
    latitude: req.body.latitude,
    longitude: req.body.longitude
  };


  newEvent.save()
  .then(savedEvent => {
    //console.log('event saved successfully:', savedEvent);
  })
  .catch(error => {
    //console.error('Error saving apartment:', error);
  });
    //console.log(req.files[0].path);
    res.json({ message: "Successfully uploaded files" });
}

module.exports = router;
