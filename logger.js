LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR']
LOG_LEVEL = (process.env.LOG_LEVEL || 'INFO')
LOGGABLE_LEVELS = LEVELS.slice(LEVELS.indexOf(LOG_LEVEL))
VALID_CONFIG = LEVELS.includes(LOG_LEVEL)

class Logger {
  static _shouldLog(level) {
    return LOGGABLE_LEVELS.includes(level)
  }
  static _logIfLevelEligible(level, message) {
    if (this._shouldLog(level)) {
      const timestamp = new Date()
      console.log(`[${timestamp.toJSON()}] [${level}] - ${message}`);
    }
  }

  static debug(message) {
    this._logIfLevelEligible('DEBUG', message)
  }
  static info(message) {
    this._logIfLevelEligible('INFO', message)
  }
  static warn(message) {
    this._logIfLevelEligible('WARN', message)
  }
  static error(message, err) {
    this._logIfLevelEligible('ERROR', `${message} -- ${err}`)
  }
}

if (!VALID_CONFIG) { throw `[ERROR] LOGGING LEVEL SET INCORRECTLY` };

module.exports = Logger
