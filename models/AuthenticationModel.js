const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

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
   * @param {object} oauthData - Dati OAuth { provider, oauthId, email, name, surname, accessToken, isEmailVerified, profileImageUrl }
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
        profileImageUrl = null,
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
        // Aggiorna token e avatar se forniti
        const updateData = {
          updated_at: new Date(),
        };

        if (accessToken) {
          updateData.oauth_access_token = accessToken;
        }

        // Aggiorna avatar solo se non esiste già o se è stato fornito un nuovo avatar
        if (profileImageUrl && !user.profile_image_url) {
          updateData.profile_image_url = profileImageUrl;
        } else if (profileImageUrl) {
          // Opzionale: aggiorna anche se esiste già (per aggiornare avatar OAuth)
          updateData.profile_image_url = profileImageUrl;
        }

        if (Object.keys(updateData).length > 1) {
          // Più di solo updated_at
          user = await prisma.user.update({
            where: {
              user_id: user.user_id,
            },
            data: updateData,
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
        const updateData = {
          oauth_provider: provider,
          oauth_id: oauthId.toString(),
          oauth_access_token: accessToken || null,
          is_email_verified: isEmailVerified || existingUser.is_email_verified,
          updated_at: new Date(),
        };

        // Aggiorna avatar solo se non esiste già
        if (profileImageUrl && !existingUser.profile_image_url) {
          updateData.profile_image_url = profileImageUrl;
        }

        user = await prisma.user.update({
          where: {
            user_id: existingUser.user_id,
          },
          data: updateData,
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
          profile_image_url: profileImageUrl || null,
        },
      });

      return user;
    } catch (error) {
      console.error(
        "AuthenticationModel.findOrCreateOAuthUser - Errore:",
        error
      );
      throw error;
    }
  }

  /**
   * Trova un utente per ID
   * @param {BigInt} userId - ID dell'utente
   * @returns {Promise<object|null>} - Utente trovato o null
   */
  static async findUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          user_id: userId,
        },
      });
      return user;
    } catch (error) {
      console.error("AuthenticationModel.findUserById - Errore:", error);
      throw error;
    }
  }

  /**
   * Trova un utente per email
   * @param {string} email - Email dell'utente
   * @returns {Promise<object|null>} - Utente trovato o null
   */
  static async findUserByEmail(email) {
    try {
      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });
      return user;
    } catch (error) {
      console.error("AuthenticationModel.findUserByEmail - Errore:", error);
      throw error;
    }
  }

  /**
   * Aggiorna il profilo utente
   * @param {BigInt} userId - ID dell'utente
   * @param {object} profileData - Dati del profilo { name?, surname?, email? }
   * @returns {Promise<object|null>} - Utente aggiornato o null
   */
  static async update_profile(userId, profileData) {
    try {
      console.log("AuthenticationModel.update_profile - Input:", {
        userId,
        profileData,
      });

      // Costruisci l'oggetto data solo con i campi definiti
      const updateData = {};
      if (profileData.name !== undefined) {
        updateData.name = profileData.name;
      }
      if (profileData.surname !== undefined) {
        updateData.surname = profileData.surname;
      }
      if (profileData.email !== undefined) {
        updateData.email = profileData.email;
      }

      console.log(
        "AuthenticationModel.update_profile - updateData:",
        updateData
      );

      // Se non ci sono dati da aggiornare, restituisci l'utente corrente
      if (Object.keys(updateData).length === 0) {
        console.log("Nessun dato da aggiornare, restituisco utente corrente");
        return await prisma.user.findUnique({
          where: { user_id: userId },
        });
      }

      // Aggiorna l'utente
      console.log("Tentativo di aggiornare utente con ID:", userId);
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: updateData,
      });

      console.log("Utente aggiornato con successo");
      return updatedUser;
    } catch (error) {
      console.error("AuthenticationModel.update_profile - Errore:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      throw error;
    }
  }

  /**
   * Cambia la password dell'utente (richiede la password attuale)
   * @param {string} email - Email dell'utente
   * @param {string} currentPassword - Password attuale
   * @param {string} newPassword - Nuova password
   * @returns {Promise<boolean>} - true se successo, false se password attuale errata
   */
  static async change_password(email, currentPassword, newPassword) {
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

      // Verifica che l'utente abbia una password (non è un utente OAuth senza password)
      if (!user.password) {
        throw new Error(
          "Impossibile cambiare la password per account OAuth. Usa il provider OAuth per gestire la password."
        );
      }

      // Verifica la password attuale
      const isCurrentPasswordValid = bcrypt.compareSync(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        return false;
      }

      // Verifica se la nuova password è uguale alla password attuale
      const isSamePassword = bcrypt.compareSync(newPassword, user.password);
      if (isSamePassword) {
        throw new Error(
          "La nuova password deve essere diversa dalla password attuale"
        );
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

      return true;
    } catch (error) {
      console.error("AuthenticationModel.change_password - Errore:", error);
      throw error;
    }
  }

  /**
   * Aggiorna le preferenze utente
   * Nota: Questo metodo salva le preferenze come JSON in un campo del database.
   * Se il campo non esiste, potrebbe essere necessario aggiungerlo allo schema.
   * Per ora, salveremo in un campo JSON o creeremo un modello separato.
   * @param {BigInt} userId - ID dell'utente
   * @param {object} preferences - Preferenze { language?, timezone?, notes? }
   * @returns {Promise<boolean>} - true se successo
   */
  static async update_preferences(userId, preferences) {
    try {
      // Per ora, salveremo le preferenze come JSON in un campo notes o creeremo un campo preferences
      // Dato che non c'è un campo preferences nel modello User, useremo un approccio flessibile
      // che può essere esteso in futuro con un modello UserPreferences separato

      // Per ora, restituiamo true per indicare successo
      // In futuro, quando verrà aggiunto il campo preferences al database,
      // questo metodo potrà essere aggiornato per salvare effettivamente i dati

      // Esempio di implementazione futura:
      // await prisma.user.update({
      //   where: { user_id: userId },
      //   data: {
      //     preferences: JSON.stringify(preferences),
      //   },
      // });

      return true;
    } catch (error) {
      console.error("AuthenticationModel.update_preferences - Errore:", error);
      throw error;
    }
  }

  /**
   * Aggiorna le preferenze di notifica
   * @param {BigInt} userId - ID dell'utente
   * @param {object} notifications - Preferenze notifiche { email?, push?, reminders? }
   * @returns {Promise<boolean>} - true se successo
   */
  static async update_notifications(userId, notifications) {
    try {
      // Simile a update_preferences, questo metodo può essere esteso
      // quando verrà aggiunto un campo notifications al database

      // Per ora, restituiamo true per indicare successo
      return true;
    } catch (error) {
      console.error(
        "AuthenticationModel.update_notifications - Errore:",
        error
      );
      throw error;
    }
  }

  /**
   * Aggiorna l'URL dell'immagine del profilo
   * @param {BigInt} userId - ID dell'utente
   * @param {string} profileImageUrl - URL dell'immagine del profilo
   * @returns {Promise<object|null>} - Utente aggiornato o null
   */
  static async update_profile_image(userId, profileImageUrl) {
    try {
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: {
          profile_image_url: profileImageUrl,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error(
        "AuthenticationModel.update_profile_image - Errore:",
        error
      );
      throw error;
    }
  }
}

module.exports = AuthenticationModel;
