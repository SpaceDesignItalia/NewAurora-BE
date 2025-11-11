// routes/github/githubAuth.js
const express = require("express");
const router = express.Router();
const GitHubController = require("../../controllers/GitHubController");
const TokenValidator = require("../../services/github/TokenValidator");

const githubAuth = () => {
  /**
   * GET /github/auth/oauth
   * Inizia OAuth flow GitHub
   * Query: redirectUri (opzionale)
   */
  router.get("/oauth", GitHubController.startOAuth);

  /**
   * GET /github/auth/callback
   * Callback OAuth GitHub
   * Query: code, state
   */
  router.get("/callback", GitHubController.oAuthCallback);

  /**
   * GET /github/auth/token
   * Ottieni token dalla sessione (dopo OAuth login)
   */
  router.get("/token", GitHubController.getToken);

  /**
   * GET /github/auth/status
   * Verifica stato autenticazione GitHub
   */
  router.get("/status", GitHubController.getAuthStatus);

  /**
   * POST /github/auth/validate-token
   * Valida token PAT inserito manualmente
   * Body: { token: string }
   */
  router.post("/validate-token", GitHubController.validateToken);

  /**
   * POST /github/auth/logout
   * Logout GitHub - Rimuove token e dati utente dalla sessione
   */
  router.post("/logout", GitHubController.logout);

  return router;
};

module.exports = githubAuth;
