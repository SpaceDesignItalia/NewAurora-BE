var nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const mailData = {
  mail: "noreply@spacedesign-italia.it",
  pass: "@Gemellini04",
};

const transporter = nodemailer.createTransport({
  host: "smtp.ionos.it",
  port: 587,
  secure: false,
  auth: {
    user: mailData.mail,
    pass: mailData.pass,
  },
});

class EmailService {}
module.exports = EmailService;
