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
  static generate_otp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Crea un record di reset password con OTP
  static async create_password_reset(email) {
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
      await prisma.Password_Reset.updateMany({
        where: {
          email: normalizedEmail,
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });

      // Genera nuovo OTP
      const otp = this.generate_otp();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valido per 15 minuti

      // Crea il record di reset password
      const password_reset = await prisma.Password_Reset.create({
        data: {
          email: normalizedEmail,
          otp: otp,
          expires_at: expiresAt,
          user_id: user.user_id,
        },
      });

      return password_reset;
    } catch (error) {
      console.error(
        "AuthenticationModel.create_password_reset - Errore:",
        error
      );
      throw error;
    }
  }

  // Verifica l'OTP
  static async verify_otp(email, otp) {
    try {
      // Normalizza l'OTP come stringa e verifica la lunghezza
      const otpString = String(otp).trim();

      if (!otpString || otpString.length !== 6) {
        return { valid: false, message: "OTP non valido" };
      }

      // Trova l'OTP più recente e non utilizzato per questa email
      const password_reset = await prisma.Password_Reset.findFirst({
        where: {
          email: email,
          otp: otpString,
          is_used: false,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!password_reset) {
        return { valid: false, message: "OTP non valido" };
      }

      // Verifica se l'OTP è scaduto
      const now = new Date();
      const expiresAt = new Date(password_reset.expires_at);

      if (now > expiresAt) {
        return { valid: false, message: "OTP scaduto" };
      }

      return { valid: true, password_reset: password_reset };
    } catch (error) {
      console.error("AuthenticationModel.verify_otp - Errore:", error);
      // Se c'è un errore del database (es. tabella non esiste), restituisci errore
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        throw new Error(
          "Errore del database: tabella password_reset non trovata"
        );
      }
      throw error;
    }
  }

  // Resetta la password dell'utente
  static async reset_password(email, newPassword) {
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
      if (user.password) {
        const isSamePassword = bcrypt.compareSync(newPassword, user.password);
        if (isSamePassword) {
          throw new Error(
            "La nuova password deve essere diversa dalla password attuale"
          );
        }
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
      await prisma.Password_Reset.updateMany({
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

  /**
   * Trova o crea utente OAuth
   * @param {object} oauthData - Dati OAuth { provider, oauthId, email, name, surname, accessToken, isEmailVerified }
   * @returns {Promise<object>} - Utente trovato o creato
   */
  static async findOrCreateOAuthUser(oauthData) {
    try {
      const {
        provider,
        oauthId,
        email,
        name,
        surname,
        accessToken,
        isEmailVerified = false,
      } = oauthData;

      // Normalizza email
      const normalizedEmail = String(email).trim().toLowerCase();

      // Cerca utente esistente per oauth_provider + oauth_id
      let user = await prisma.user.findFirst({
        where: {
          oauth_provider: provider,
          oauth_id: oauthId.toString(),
        },
      });

      if (user) {
        // Aggiorna token se fornito
        if (accessToken) {
          user = await prisma.user.update({
            where: {
              user_id: user.user_id,
            },
            data: {
              oauth_access_token: accessToken,
              updated_at: new Date(),
            },
          });
        }
        return user;
      }

      // Cerca utente esistente per email (potrebbe essere registrato con email/password)
      const existingUser = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (existingUser) {
        // Collega account OAuth all'utente esistente
        user = await prisma.user.update({
          where: {
            user_id: existingUser.user_id,
          },
          data: {
            oauth_provider: provider,
            oauth_id: oauthId.toString(),
            oauth_access_token: accessToken || null,
            is_email_verified: isEmailVerified || existingUser.is_email_verified,
            updated_at: new Date(),
          },
        });
        return user;
      }

      // Crea nuovo utente OAuth
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || "",
          surname: surname || "",
          password: null, // Utenti OAuth non hanno password
          oauth_provider: provider,
          oauth_id: oauthId.toString(),
          oauth_access_token: accessToken || null,
          is_email_verified: isEmailVerified,
        },
      });

      return user;
    } catch (error) {
      console.error("AuthenticationModel.findOrCreateOAuthUser - Errore:", error);
      throw error;
    }
  }
}

module.exports = AuthenticationModel;
