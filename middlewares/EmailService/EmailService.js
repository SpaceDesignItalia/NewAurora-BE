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

class EmailService {
  // Invia email con codice OTP per il recupero password
  static async send_password_reset_otp(email, otp) {
    try {
      const mailOptions = {
        from: `"NewAurora" <${mailData.mail}>`,
        to: email,
        subject: "Codice OTP per il recupero password - NewAurora",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recupero Password - NewAurora</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
              <h1 style="color: #2563eb; text-align: center;">Recupero Password</h1>
              <p>Ciao,</p>
              <p>Hai richiesto il recupero della password per il tuo account NewAurora.</p>
              <p>Utilizza il seguente codice OTP per verificare la tua identità:</p>
              <div style="background-color: #ffffff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h2>
              </div>
              <p><strong>Questo codice è valido per 15 minuti.</strong></p>
              <p>Se non hai richiesto il recupero password, ignora questa email.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                Questa è un'email automatica, non rispondere a questo messaggio.<br>
                © ${new Date().getFullYear()} Space Design Italia - NewAurora
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
          Recupero Password - NewAurora
          
          Ciao,
          
          Hai richiesto il recupero della password per il tuo account NewAurora.
          
          Utilizza il seguente codice OTP per verificare la tua identità:
          
          ${otp}
          
          Questo codice è valido per 15 minuti.
          
          Se non hai richiesto il recupero password, ignora questa email.
          
          © ${new Date().getFullYear()} Space Design Italia - NewAurora
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Errore nell'invio dell'email:", error);
      throw error;
    }
  }
}

module.exports = EmailService;
