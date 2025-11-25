// authenticationGET.js
const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../controllers/AuthenticationController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const authenticationGET = () => {
  // Definisci le route GET qui

  router.get("/check-session", (req, res) => {
    AuthenticationController.check_session(req, res);
  });

  router.get("/get-session-data", (req, res) => {
    AuthenticationController.get_session_data(req, res);
  });

  router.get("/profile-image/:userId", (req, res) => {
    AuthenticationController.get_profile_image(req, res);
  });

  /**
   * GET /authentication/GET/google-oauth
   * Inizia OAuth flow Google
   */
  router.get("/google-oauth", AuthenticationController.startGoogleOAuth);

  /**
   * GET /authentication/GET/github-oauth
   * Inizia OAuth flow GitHub (per autenticazione utente)
   */
  router.get("/github-oauth", AuthenticationController.startGitHubOAuth);

  /**
   * GET /authentication/GET/google/callback
   * Callback OAuth Google
   */
  router.get("/google/callback", AuthenticationController.googleCallback);

  /**
   * GET /authentication/GET/github/auth-callback
   * Callback OAuth GitHub (per autenticazione utente)
   */
  router.get("/github/auth-callback", AuthenticationController.githubCallback);

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = authenticationGET;
