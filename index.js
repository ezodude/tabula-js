'use strict';

// Options:
//
// area <AREA>           Portion of the page to analyze (top,left,bottom,right).
//                       Example: "269.875,12.75,790.5,561". Default is entire page.
//
// columns <COLUMNS>     X coordinates of column boundaries. Example "10.1,20.2,30.3"
//
// debug                 Print detected table areas instead ofprocessing.
//
// guess                 Guess the portion of the page to analyze per page.
//
// silent                Suppress all stderr output.
//
// noSpreadsheet        Force PDF not to be extracted using spreadsheet-style extraction
//                      (if there are ruling lines separating each cell, as in a PDF of an Excel spreadsheet)
//
// pages <PAGES>        Comma separated list of ranges, or all.
//                      Examples: pages: "1-3,5-7", pages: "3" or pages: "all". Default is pages: "1"
//
// spreadsheet          Force PDF to be extracted using spreadsheet-style extraction
//                      (if there are ruling lines separating each cell, as in a PDF
//                        of an Excel spreadsheet)
//
// password <PASSWORD>  Password to decrypt document. Default is empty
//
// useLineReturns       Use embedded line returns in cells. (Only in spreadsheet mode.)


// const tabula = require('tabula-js');

// tabula.streamCsv('pathToPDF');
// tabula.extractCsv('pathToPDF', cb);

const path          = require('path')
    , spawn         = require('child_process').spawn
    , EventEmitter  = require('events').EventEmitter
    , _             = require('lodash')
    , h             = require('highland');

function TabulaCommand(pdfPath, commandArgs){
  EventEmitter.call(this);
  this._build(pdfPath, commandArgs);
}

util.inherits(TabulaCommand, EventEmitter)

TabulaCommand.prototype.run = function () {
  this.process = spawn('java', this.args);

  this.process.stdout.on('data', data => this.emit('data', data.toString()));
  this.process.stderr.on('data', data => {
    const msg = data.toString();
    if(/error/i.test(msg)){ return this.emit('error', new Error(`tabula-java ${msg}`)); }
  });

  this.process.on('close', (code) => {
    this.emit('data', h.nil);
    this.emit('close', code);
  });
  this.process.on('error', (err) => this.emit('error', err));
  return this;
};

TabulaCommand.prototype._build = function (pdfPath, commandArgs) {
  this.args = ['-jar', path.join(__dirname, 'lib', 'tabula-java.jar')];
  this.args = this.args.concat(_.toPairs(_.mapKeys(commandArgs, (value, key) => `--${_.kebabCase(key)}`)));
  this.args = this.args.concat([pdfPath]);
  this.args = _.flatten(this.args);
  return this;
};

module.exports = Tabula;

function Tabula(pdfPath, options) {
  if (!(this instanceof Tabula)) return new Tabula(pdfPath, options);
  this.pdfPath = pdfPath;
  this.options = options;
}

Tabula.prototype.streamCsv = function () {
  const cmd = new TabulaCommand(this.pdfPath, this.options).run();
  const dataStream = h('data', cmd);
  const errorStream = h('error', cmd);

  this.stream = h.concat(errorStream, dataStream);
  return this.stream
  .doto(data => console.log('INCOMING -> ', data))
  .stopOnError(e => console.error(e));
};
