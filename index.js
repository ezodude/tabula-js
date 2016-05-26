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

function TabulaCommand(pdfPath){
  EventEmitter.call(this);
  this.pdfPath = pdfPath;
}

util.inherits(TabulaCommand, EventEmitter)

TabulaCommand.prototype.build = function (commandArgs) {
  this.args = ['-jar', path.join(__dirname, 'lib', 'tabula-java.jar')];
  this.args = this.args.concat(_.toPairs(_.mapKeys(commandArgs, (value, key) => `--${_.kebabCase(key)}`)));
  this.args = this.args.concat([this.pdfPath]);
  this.args = _.flatten(this.args);
  return this;
};

TabulaCommand.prototype.run = function () {
  this.process = spawn('java', this.args);

  this.process.stdout.on('data', data => this.emit('data', data.toString()));
  this.process.stderr.on('data', data => {
    const msg = data.toString();
    if(/error/i.test(msg)){ return this.emit('error', new Error(`tabula-java ${msg}`)); }
  });

  this.process.on('close', (code) => this.emit('close', code));
  this.process.on('error', (err) => this.emit('error', err));
  return this;
};

module.exports = Tabula;

function Tabula(pdfPath, options) {
  if (!(this instanceof Tabula)) return new Tabula(pdfPath, options);
  this.pdfPath = pdfPath;
  this.options = options;
}

Tabula.prototype.streamCsv = function () {
  new TabulaCommand(this.pdfPath).build(this.options).run().on('data', data => console.log(`Event ----${data}----`));
};


