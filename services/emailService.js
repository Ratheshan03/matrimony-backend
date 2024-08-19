const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or another email service
  auth: {
    user: process.env.EMAIL, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your email password
  },
});

const sendApprovalEmail = async (user, tempPassword) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: "Matrimony Service - Your Profile Has Been Approved - Welcome!",
    text: `
      Dear ${user.username},

      Congratulations! Your profile has been approved.

      Here are your temporary login credentials:
      Username: ${user.username}
      Password: ${tempPassword}

      Please log in to your account and change your credentials to something more secure.

      Thank you for joining us.

      Best Regards,
      The Team H&M
    `,
    html: `
      <p>Dear <strong>${user.username}</strong>,</p>
      <p>Congratulations! Your profile has been approved.</p>
      <p>Here are your temporary login credentials:</p>
      <p><strong>Username:</strong> ${user.username}</p>
      <p><strong>Password:</strong> ${tempPassword}</p>
      <p>Please log in to your account and change your credentials to something more secure.</p>
      <p>Thank you for joining us.</p>
      <p>Best Regards,<br>The Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendApprovalEmail };
