"use strict";

const path = require("path");
const projectRoot = __dirname;

const sentenceCase = require(path.join(projectRoot, "rules", "sentence-case.js"));
const backtickCodeElements = require(path.join(projectRoot, "rules", "backtick-code-elements.js"));

module.exports = {
  "default": true,
  "MD204": false,
  "MD013": false,
  "customRules": [
    sentenceCase,
    backtickCodeElements
  ],
  "sentence-case-headings-bold": {
    "enabled": true
  },
  "backtick-code-elements": {
    "enabled": true
  }
};
