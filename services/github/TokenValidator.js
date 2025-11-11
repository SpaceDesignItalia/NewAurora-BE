// services/github/TokenValidator.js
const GitHubOAuthService = require("./OAuthService");

/**
 * Service per validazione token GitHub
 * Verifica validità e permessi
 */

class TokenValidator {
  /**
   * Estrae token da header Authorization o body
   * @param {object} req - Express request
   * @returns {string|null} - Token estratto o null
   */
  static extractToken(req) {
    // Prova header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Prova body
    if (req.body && req.body.githubToken) {
      return req.body.githubToken;
    }

    // Prova query parameter (meno sicuro, ma supportato)
    if (req.query && req.query.token) {
      return req.query.token;
    }

    return null;
  }

  /**
   * Valida token e permessi
   * @param {string} token - Token da validare
   * @param {boolean} requireRepoPermissions - Richiedi permessi repo
   * @returns {Promise<{valid: boolean, user?: object, scopes?: string[], error?: string}>}
   */
  static async validateToken(token, requireRepoPermissions = true) {
    if (!token) {
      return {
        valid: false,
        error: "Token mancante",
      };
    }

    // Valida formato base
    if (typeof token !== "string" || token.trim().length === 0) {
      return {
        valid: false,
        error: "Token non valido",
      };
    }

    // Valida con GitHub API
    const validation = await GitHubOAuthService.validateToken(token);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.reason || "Token non valido",
      };
    }

    // Verifica permessi se richiesti
    if (requireRepoPermissions) {
      const permissions = await GitHubOAuthService.checkRepoPermissions(token);
      if (!permissions.hasPermissions) {
        return {
          valid: false,
          error: "Token mancante dei permessi repo/actions",
          missingScopes: permissions.missingScopes,
        };
      }
    }

    return {
      valid: true,
      user: validation.user,
      scopes: validation.scopes || [],
    };
  }

  /**
   * Middleware per validazione token
   * Aggiunge token validato a req.githubToken e req.githubUser
   */
  static middleware(requireRepoPermissions = true) {
    return async (req, res, next) => {
      const token = this.extractToken(req);

      if (!token) {
        return res.status(401).json({
          error: "Token mancante",
          message:
            "Fornire un token GitHub nell'header Authorization: Bearer <token> o nel body come githubToken",
        });
      }

      const validation = await this.validateToken(
        token,
        requireRepoPermissions
      );

      if (!validation.valid) {
        return res.status(401).json({
          error: "Token non valido",
          message: validation.error,
          missingScopes: validation.missingScopes,
        });
      }

      // Aggiungi token e user alla request
      req.githubToken = token;
      req.githubUser = validation.user;
      req.githubScopes = validation.scopes;

      next();
    };
  }
}

module.exports = TokenValidator;
