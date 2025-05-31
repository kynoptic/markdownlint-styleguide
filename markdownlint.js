"use strict";

const sentenceCase = require("./rules/sentence-case.js");
const backtickCodeElements = require("./rules/backtick-code-elements.js");

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
