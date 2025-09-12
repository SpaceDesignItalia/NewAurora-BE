const express = require("express");
const router = express.Router();
const projectGET = require("./projectGET");
const projectPOST = require("./projectPOST");
const projectDELETE = require("./projectDELETE");

const Project = () => {
  router.use("/GET", projectGET()); // Non serve più passare il database
  router.use("/POST", projectPOST()); // Non serve più passare il database
  router.use("/DELETE", projectDELETE()); // Non serve più passare il database
  return router;
};

module.exports = Project;
