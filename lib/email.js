import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "arifmalik0800@gmail.com",
        pass: "ibcz hiiw gdtz iwem",
    },
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: "arifmalik0800@gmail.com",
      to,
      subject,
      text,
    };
    
    return transporter.sendMail(mailOptions);
  };

export default sendEmail;