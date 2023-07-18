const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'ghazlani@hotmail.com',
    pass: process.env.USER_KEY
  }
});

let sendMail = (mailOptions)=>{
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
    });
  };
  
  module.exports = sendMail;