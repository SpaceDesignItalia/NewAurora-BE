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
          company_id: 1, // Default company_id
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
}

module.exports = AuthenticationModel;
