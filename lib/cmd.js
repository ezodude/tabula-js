'use strict';

const path          = require('path')
    , spawn         = require('child_process').spawn
    , _             = require('lodash');

module.exports = TabulaCommand;

function TabulaCommand(pdfPath, commandArgs){
  if (!(this instanceof TabulaCommand)) return new TabulaCommand(pdfPath, commandArgs);
  this._build(pdfPath, commandArgs);
}

TabulaCommand.prototype.run = function () {
  return spawn('java', this.args);
};

TabulaCommand.prototype._build = function (pdfPath, commandArgs) {
  this.args = ['-jar', path.join(__dirname, 'tabula-java.jar')];
  _.forEach(commandArgs, (value, key) => {
    key = '--' + _.kebabCase(key);
    if (Array.isArray(value)) {
      _.forEach(value, (v) => {
        this.args.push(key, v);
      });
    }
    else if (typeof value === 'boolean') {
      if (value) {
        this.args.push(key);
      }
    }
    else {
      this.args.push(key,value);
    }
  });
  this.args = this.args.concat([pdfPath]);
  this.args = _.flatten(this.args);
  return this;
};
