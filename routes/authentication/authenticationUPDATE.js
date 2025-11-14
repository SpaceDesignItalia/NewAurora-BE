// authenticationUPDATE.js
const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../controllers/AuthenticationController");
const authenticateMiddleware = require("../../middlewares/Authentication/Authmiddleware");
const {
  upload,
  handleMulterError,
} = require("../../middlewares/Upload/ProfileImageUpload");

const authenticationUPDATE = () => {
  // Definisci le route UPDATE qui

  router.put("/update-profile", authenticateMiddleware, (req, res) => {
    AuthenticationController.update_profile(req, res);
  });

  router.put("/change-password", authenticateMiddleware, (req, res) => {
    AuthenticationController.change_password(req, res);
  });

  router.put("/preferences", authenticateMiddleware, (req, res) => {
    AuthenticationController.update_preferences(req, res);
  });

  router.put("/notifications", authenticateMiddleware, (req, res) => {
    AuthenticationController.update_notifications(req, res);
  });

  router.put(
    "/upload-profile-image",
    authenticateMiddleware,
    upload,
    handleMulterError,
    (req, res) => {
      AuthenticationController.upload_profile_image(req, res);
    }
  );

  return router; // Ritorna il router per consentire l'utilizzo da parte dell'app principale
};

module.exports = authenticationUPDATE;
