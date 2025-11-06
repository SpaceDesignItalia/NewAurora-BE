const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

class AuthenticationModel {
  static async register(register_data) {
    try {
      // Verifica se l'utente esiste già
      const existingUser = await prisma.user.findUnique({
        where: {
          email: register_data.email,
        },
      });

      if (existingUser) {
        return false;
      }

      // Hash della password
      const hash = bcrypt.hashSync(register_data.password, 10);

      // Crea il nuovo utente
      const newUser = await prisma.user.create({
        data: {
          name: register_data.name,
          surname: register_data.surname,
          email: register_data.email,
          password: hash,
        },
      });

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  static async login(login_data) {
    try {
      // Trova l'utente per email
      const user = await prisma.user.findUnique({
        where: {
          email: login_data.email,
        },
      });

      if (!user) {
        return false;
      }

      // Verifica la password
      const isPasswordValid = bcrypt.compareSync(
        login_data.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Password non valida");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Genera un OTP a 6 cifre
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Crea un record di reset password con OTP
  static async createPasswordReset(email) {
    try {
      // Normalizza l'email
      const normalizedEmail = String(email).trim().toLowerCase();

      // Verifica se l'utente esiste
      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!user) {
        return false; // Utente non trovato
      }

      // Invalida i vecchi OTP per questo utente
      await prisma.passwordReset.updateMany({
        where: {
          email: normalizedEmail,
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });

      // Genera nuovo OTP
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valido per 15 minuti

      // Crea il record di reset password
      const passwordReset = await prisma.passwordReset.create({
        data: {
          email: normalizedEmail,
          otp: otp,
          expires_at: expiresAt,
          user_id: user.user_id,
        },
      });

      return passwordReset;
    } catch (error) {
      console.error("AuthenticationModel.createPasswordReset - Errore:", error);
      throw error;
    }
  }

  // Verifica l'OTP
  static async verifyOTP(email, otp) {
    try {
      // Normalizza l'OTP come stringa e verifica la lunghezza
      const otpString = String(otp).trim();
      
      if (!otpString || otpString.length !== 6) {
        return { valid: false, message: "OTP non valido" };
      }

      // Trova l'OTP più recente e non utilizzato per questa email
      const passwordReset = await prisma.passwordReset.findFirst({
        where: {
          email: email,
          otp: otpString,
          is_used: false,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!passwordReset) {
        return { valid: false, message: "OTP non valido" };
      }

      // Verifica se l'OTP è scaduto
      const now = new Date();
      const expiresAt = new Date(passwordReset.expires_at);
      
      if (now > expiresAt) {
        return { valid: false, message: "OTP scaduto" };
      }

      return { valid: true, passwordReset: passwordReset };
    } catch (error) {
      console.error("AuthenticationModel.verifyOTP - Errore:", error);
      // Se c'è un errore del database (es. tabella non esiste), restituisci errore
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        throw new Error("Errore del database: tabella PasswordReset non trovata");
      }
      throw error;
    }
  }

  // Resetta la password dell'utente
  static async resetPassword(email, newPassword) {
    try {
      // Normalizza l'email
      const normalizedEmail = String(email).trim().toLowerCase();

      // Trova l'utente
      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!user) {
        return false;
      }

      // Verifica se la nuova password è uguale alla password attuale
      const isSamePassword = bcrypt.compareSync(newPassword, user.password);
      if (isSamePassword) {
        throw new Error("La nuova password deve essere diversa dalla password attuale");
      }

      // Hash della nuova password
      const hash = bcrypt.hashSync(newPassword, 10);

      // Aggiorna la password
      await prisma.user.update({
        where: {
          email: normalizedEmail,
        },
        data: {
          password: hash,
        },
      });

      // Marca tutti gli OTP per questo utente come utilizzati
      await prisma.passwordReset.updateMany({
        where: {
          email: normalizedEmail,
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthenticationModel;
