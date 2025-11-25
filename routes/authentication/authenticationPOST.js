// authenticationPOST.js
const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../controllers/AuthenticationController");
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

  router.post("/forgot-password", (req, res) => {
    AuthenticationController.forgot_password(req, res);
  });

  router.post("/resend-otp", (req, res) => {
    AuthenticationController.resend_otp(req, res);
  });

  router.post("/verify-otp", (req, res) => {
    AuthenticationController.verify_otp(req, res);
  });

  router.post("/reset-password", (req, res) => {
    AuthenticationController.reset_password(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = authenticationPOST;
