/**
 * @class Ext.nd.util.DominoActionbar
 * Utility class for dealing with the auto generated Actionbar from Domino
 */
Ext.nd.util.DominoActionbar = function(){
    
    this.actionbar = false;
    this.actionbarHr = false;

    this.init();
}

Ext.nd.util.DominoActionbar.prototype = {

        // private
        init : function(){
       
           // bail if a view since we only use dxl for views
           // also bail if there isn't a noteType
           
           // domino's form is the first form
           var frm = document.forms[0];
           var q = Ext.DomQuery;
           
           var cn = frm.childNodes;
           var actionbar, actionbarHr;
           var bTest1 = false; // 1st (non-hidden) element has to be <table>
           var bTest2 = false; // only 1 row can be in the table;
           var bTest3 = false; // 2nd element has to be <hr>
           var bTest4 = false; // # of <td> tags must equal # <a> tags
           for (var i = 0; i < cn.length; i++) {
               var c = cn[i];
               if (c.nodeType == 1) {
                   if (!bTest1) {
                       if (c.tagName == 'TABLE') {
                           actionbar = c;
                           var arRows = q.select('tr', actionbar);
                           if (arRows.length != 1) {
                               break;
                           }
                           else {
                               bTest1 = true;
                               bTest2 = true;
                               continue;
                           }
                       }
                       else 
                           if ((c.tagName == 'INPUT' && q.selectValue('@type', c, '') == 'hidden') || c.tagName == 'LABEL') {
                               continue; // domino sometimes puts hidden input fields before the actionbar
                           // and we put in a hidden label field in certain cases
                           }
                           else {
                               break; // didn't pass test 1 so bail
                           }
                   }
                   else { // bTest1 == true
                       if (c.tagName == 'HR') {
                           actionbarHr = c;
                           bTest3 = true;
                       }
                       break; // done with both tests so exit loop
                   } // end: !bTest1
               } // end: c.nodeType == 1
               if (bTest1 && bTest2 && bTest3) {
                   // we passed test1, test2, and test3 so break out of the for loop
                   break;
               }
           }
           
           if (bTest1 && bTest2 && bTest3) {
               // get the first table
               var arTDs = q.select('td', actionbar);
               var arActions = q.select('a', actionbar);
               if (arTDs.length == arActions.length) {
                   bTest4 = true;
                   this.actionbar = actionbar;
                   this.actionbarHr = actionbarHr;
               }
           }


       }, // eo getDominoActionbar
       
       getActionbar : function() {
           return this.actionbar;
       },

       getActionbarHr : function() {
           return this.actionbarHr;
       },

       hide: function(){
           
           if (this.actionbar) {
               Ext.get(this.actionbar).setStyle('display', 'none');
               Ext.get(this.actionbarHr).setStyle('display', 'none');
           }
           
       }, // eo hideDominoActionbar
       
       
       remove: function(){
           if (this.actionbar) {
               Ext.get(this.actionbar).remove();
               Ext.get(this.actionbarHr).remove();
           }
       }
       
}; // eo Ext.nd.util.DominoActionbar.prototype   