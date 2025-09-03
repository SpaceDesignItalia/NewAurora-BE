function authenticateMiddleware(req, res, next) {
  if (req.session && req.session.account) {
    // L'utente è autenticato, procedi
    next();
  } else {
    res.status(401).json({ message: "Accesso non autorizzato" });
  }
}

module.exports = authenticateMiddleware;
