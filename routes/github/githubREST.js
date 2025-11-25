// routes/github/githubREST.js
const express = require("express");
const router = express.Router();
const GitHubController = require("../../controllers/GitHubController");
const TokenValidator = require("../../services/github/TokenValidator");

const githubREST = () => {
  /**
   * GET /github/repos
   * Lista repository accessibili
   * Header: Authorization: Bearer <token>
   */
  router.get(
    "/repos",
    TokenValidator.middleware(true),
    GitHubController.listRepos
  );

  /**
   * GET /github/repos/:repoFullName/secrets
   * Lista secrets esistenti in un repository (formato owner/repo)
   * Header: Authorization: Bearer <token>
   * Route alternativa per compatibilità con frontend che passa owner/repo come unico parametro
   * DEVE essere prima della route con due parametri per evitare conflitti
   */
  router.get(
    "/repos/:repoFullName/secrets",
    TokenValidator.middleware(true),
    GitHubController.listSecretsFromFullName
  );

  /**
   * GET /github/repos/:owner/:repo/secrets
   * Lista secrets esistenti in un repository
   * Header: Authorization: Bearer <token>
   */
  router.get(
    "/repos/:owner/:repo/secrets",
    TokenValidator.middleware(true),
    GitHubController.listSecrets
  );

  /**
   * POST /github/repos/:owner/:repo/secrets
   * Pubblica un singolo secret
   * Header: Authorization: Bearer <token>
   * Body: { secretName: string, secretValue: string }
   */
  router.post(
    "/repos/:owner/:repo/secrets",
    TokenValidator.middleware(true),
    GitHubController.pushSecret
  );

  /**
   * POST /github/repos/:owner/:repo/secrets/bulk
   * Pubblica multipli secrets
   * Header: Authorization: Bearer <token>
   * Body: { secrets: [{ name: string, value: string }] }
   */
  router.post(
    "/repos/:owner/:repo/secrets/bulk",
    TokenValidator.middleware(true),
    GitHubController.pushSecretsBulk
  );

  return router;
};

module.exports = githubREST;
