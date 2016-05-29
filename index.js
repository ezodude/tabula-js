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

const cmd           = require('./lib/cmd')
    , hp            = require('highland-process');

module.exports = Tabula;

function Tabula(pdfPath, options) {
  if (!(this instanceof Tabula)) return new Tabula(pdfPath, options);
  this.pdfPath = pdfPath;
  this.options = options;
}

Tabula.prototype.streamCsv = function () {
  return hp.from(cmd(this.pdfPath, this.options).run());
};

Tabula.prototype.extractCsv = function (cb) {
  this.streamCsv()
  .map(data => data.toString())
  .split()
  .collect()
  .stopOnError(err => cb(err, null))
  .each(data => cb(null, data));
};
