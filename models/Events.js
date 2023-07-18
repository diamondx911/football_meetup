const mongoose = require('mongoose');
const User = require('./User');

// Create the Event schema
const eventSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dates: {
    type: [{
      date: {
        type: String,
        required: true
      },
      time: {
        type: String,
        required: true
      }
    }],
    required: true
  },
  numberPlayer: {
    type: Number,
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  invitedNames: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Create the Event model
const Event = mongoose.model('Event', eventSchema);
 
module.exports = Event;