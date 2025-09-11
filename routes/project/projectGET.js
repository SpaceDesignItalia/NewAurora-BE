// projectGET.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../Controllers/ProjectController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const projectGET = () => {
  // Definisci le route GET qui

  router.get("/get-projects", authenticateMiddleware, (req, res) => {
    ProjectController.get_projects(req, res);
  });

  router.get("/get-project-by-id", authenticateMiddleware, (req, res) => {
    ProjectController.get_project_by_id(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectGET;
