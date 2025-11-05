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

  router.post("/create-task", authenticateMiddleware, (req, res) => {
    ProjectController.create_task(req, res);
  });

  router.post("/create-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.create_sprint(req, res);
  });
  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectPOST;
