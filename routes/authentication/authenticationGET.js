// authenticationGET.js
const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../controllers/AuthenticationController");
const authenticateMiddleware = require("../../middlewares/Authentication/authmiddleware");

const authenticationGET = () => {
  // Definisci le route GET qui

  router.get("/check-session", (req, res) => {
    AuthenticationController.check_session(req, res);
  });

  router.get("/get-session-data", (req, res) => {
    AuthenticationController.get_session_data(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = authenticationGET;
