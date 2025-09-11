// projectPOST.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../Controllers/ProjectController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const projectPOST = () => {
  // Definisci le route POST qui

  router.post("/create-project", authenticateMiddleware, (req, res) => {
    ProjectController.create_project(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectPOST;
