const path = require("path");
const log = require('electron-log');

log.transports.file.resolvePath = () => path.join(__dirname, '/logsmain.log');
log.transports.file.level = "info";

exports.error = (entry) => log.error(entry);
exports.info = (entry) => log.info(entry);