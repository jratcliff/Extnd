
/**
 * @class-not-ready Ext.nd.Document
 * @constructor
 * Makes an AJAX call to retrieve a Domino Document
 * @param {Object} config Configuration options
 */
Ext.nd.Document = function(config) {
  var sForm = 'Ext.nd.Document.json';
  
  // Set any config params passed in to override defaults
  Ext.apply(this,config);

  // TODO - this entire class needs to be rewritten to call the DXLExporter
  var sHREF, locNSF, urlStart;
  sHREF = location.href;
  locNSF = sHREF.toLowerCase().indexOf('.nsf/');
  urlStart = sHREF.substring(0,locNSF+5);
  this.url = urlStart + '($Ext.nd.SwitchForm)/' + this.unid + '?OpenDocument&form=' + sForm;

  Ext.Ajax.request({
    method: 'GET',
    disableCaching: true,
    success: this.assignValue,
    failure: this.processException,
    scope: this,
    url: this.url
  });
};

Ext.nd.Document.prototype = {
  onComplete: function() {},
  
  assignValue: function(req) {
   var sTmp, oTmp;
    sTmp = req.responseText;
    oTmp = eval('(' + sTmp + ')');
  
    // Set any config params passed in to override defaults
    Ext.apply(this,oTmp);
  
    // now call the user's onComplete function
    this.onComplete();
  },
  
  processException: function(req) {
   Ext.MessageBox.alert("Error","There was an error in the instantiation of the Document class");
  }  
};
