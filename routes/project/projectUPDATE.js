// projectUPDATE.js
const express = require("express");
const router = express.Router();
const ProjectController = require("../../controllers/ProjectController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");

const projectUPDATE = () => {
  // Definisci le route UPDATE qui

  router.put("/move-task", authenticateMiddleware, (req, res) => {
    ProjectController.move_task(req, res);
  });

  router.put("/start-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.start_sprint(req, res);
  });

  router.put("/complete-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.complete_sprint(req, res);
  });

  router.put("/update-sprint", authenticateMiddleware, (req, res) => {
    ProjectController.update_sprint(req, res);
  });

  router.put("/update-task-status", authenticateMiddleware, (req, res) => {
    ProjectController.update_task_status(req, res);
  });

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = projectUPDATE;
