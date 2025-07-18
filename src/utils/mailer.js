const nodemailer = require('nodemailer');
const config = require('../config/index');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: config.emailSender.email,
        pass: config.emailSender.app_pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendMail = async (to, subject, body, attachmentPath) => {
    const attachment = attachmentPath
        ? {
              filename: path.basename(attachmentPath),
              content: fs.readFileSync(attachmentPath),
              encoding: 'base64'
          }
        : undefined;

    const mailOptions = {
        from: `"LET'Z GEAR" <letzgear@gmail.com>`,
        to,
        subject,
        html: body,
        attachments: attachment ? [attachment] : []
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
