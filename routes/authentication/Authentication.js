// authenticationRoutes.js
const express = require("express");
const router = express.Router();
const authenticationGET = require("./authenticationGET");
const authenticationPOST = require("./authenticationPOST");

const Authentication = () => {
  router.use("/GET", authenticationGET()); // Non serve più passare il database
  router.use("/POST", authenticationPOST()); // Non serve più passare il database
  return router;
};

module.exports = Authentication;
