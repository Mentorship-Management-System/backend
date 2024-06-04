const nodemailer = require("nodemailer");

const sendPasswordEmail = async (payload) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true, // true for 465, false for other ports
        logger: true,
        debug: true,
        secureConnection: false,
        auth: {
            user: "sanjay.sdas.20@gmail.com",
            pass: "vxtlgirmkjjdadtn",
        },
        tls: {
            rejectUnauthorized: true,
        },
    });

    let mailOptions = null;
    const { type, to, password, updated_meeting } = payload;

    if (type === "new_meeting") {
        mailOptions = {
            from: `Mentorship Management <sanjay.sdas.20@gmail.com>`,
            to,
            subject: "New Meeting", // Subject line
            text: "A new meeting has been scheduled with your mentor, check your meetings in the portal.", // plain text body
            // html: `<p>Hello Mentee,</p><br><b>Your new password is: ${password}</b>`
        };
    } else if (type === "update_meeting") {
        mailOptions = {
            from: `Mentorship Management <sanjay.sdas.20@gmail.com>`,
            to,
            subject: "Updated Meeting", // Subject line
            text: `Your meeting "${updated_meeting}" has been updated, check meeting details in the portal.`,
            // html: `<p>Hello Mentee,</p><br><b>Your new password is: ${password}</b>`,
        };
    } else if (type === "forgot_password") {
        mailOptions = {
            from: `Mentorship Management <sanjay.sdas.20@gmail.com>`,
            to,
            subject: "Password Updated", // Subject line
            text: `Your request has been received. Your new password is: ${password}.`,
            // html: `<p>Hello Mentee,</p><br><b>Your new password is: ${password}</b>`,
        };
    } else if (type === "new_message") {
        mailOptions = {
            from: `Mentorship Management <sanjay.sdas.20@gmail.com>`,
            to,
            subject: "Message Arrived", // Subject line
            text: "Your mentee has sent you a new message, check messages in the portal.", // plain text body
            // html: `<p>Hello Mentee,</p><br><b>Your new password is: ${password}</b>`
        };
    } else if (type === "mentor_reply") {
        mailOptions = {
            from: `Mentorship Management <sanjay.sdas.20@gmail.com>`,
            to,
            subject: "Message Arrived", // Subject line
            text: "Your mentor replied to your message, check details in the portal.",
            // html: `<p>Hello Mentee,</p><br><b>Your new password is: ${password}</b>`
        };
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = sendPasswordEmail;
