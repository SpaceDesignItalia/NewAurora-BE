// authenticationPOST.js
const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../Controllers/AuthenticationController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const authenticationPOST = () => {
  // Definisci le route POST qui

  router.post("/register", (req, res) => {
    AuthenticationController.register(req, res);
  });

  router.post("/login", (req, res) => {
    AuthenticationController.login(req, res);
  });

  router.post("/logout", authenticateMiddleware, (req, res) => {
    AuthenticationController.logout(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = authenticationPOST;
