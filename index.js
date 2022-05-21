"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./dist/nwjs-window-manager.cjs.min.js");
} else {
  module.exports = require("./dist/nwjs-window-manager.cjs.js");
}
