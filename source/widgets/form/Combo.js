/**
 * @class Ext.nd.form.ComboBox
 * @extends Ext.form.ComboBox
 * A combobox control with support for loading data from Domino views.
 * <p><b>Example</b></p>
 * <pre><code>
var cb = new Ext.nd.form.ComboBox({
    viewName : 'yourView',
    category : 'someCategory',
    parentCombo 'parentId',
    count : 50
});
 * </code></pre>
 * @constructor
 * Create a new ComboBox
 * @param {Object} config
 * @cfg {String} viewName The name of the view used to load the values of the combobox
 * @cfg {String} viewUrl The url to the view used to load the values of the combobox.  
 * If a viewName is specified, this property is ignored.
 * @cfg {String} dbPath (optional) The path to the database that contains the view to load.
 * Defaults to Ext.nd.Session.currentDatabase.webFilePath.
 * @cfg (String) count The number of documents/rows from the view to load at a time. 
 * If pageSize is set then count is ignored and pageSize is used.  If you want ALL documents/rows
 * loaded then set pageSize or count to -1.
 * @cfg valueField {String/Number} The column position or programmatic name from the loaded Domino view
 * that is the stored value.
 * @cfg displayField {String/Number} The column position or programmatic name from the loaded Domino view
 * that is used for the displayed values.
 * @cfg {String} category (optional) The category you wish to restrict to for categorized views.
 * @cfg {String/Component} parentCombo (optional) The string id or component of the parent combo
 * associated with this combo.  If set, then when the parent combo changes, this combo will update 
 * with new values based off of the selected value of the parent combo.  This works well with
 * single category fields where a 'RestrictToCategory' can be done using the selected value of the
 * parent combo as the value of the category of this combo.
 */
Ext.nd.form.ComboBox = function(config) {
    
    config = Ext.nd.util.cleanUpConfig(config);
    Ext.nd.form.ComboBox.superclass.constructor.call(this, config);
    
};

Ext.extend(Ext.nd.form.ComboBox, Ext.form.ComboBox,  {
   
    triggerAction : 'all',
    parentCombo : undefined,
    queryParam : 'startkey',
    count : 40,
    
    initComponent : function(){
    
        // remap count to pageSize 
        if (this.pageSize) {
            this.count = this.pageSize;
        } else {
            this.pageSize = this.count;
        }
        // handle domino's -1 for count special case
        if (this.pageSize === -1){
            this.pageSize = 0;
        }
        
        // wait for the render event and then get our view design
        this.on('render', this.getViewDesign, this);
        
        Ext.nd.form.ComboBox.superclass.initComponent.call(this);
    },

    // private override
    initList : function() {
        // call the parent's initList
        Ext.nd.form.ComboBox.superclass.initList.call(this);
        
        // now change to use a domino paging toolbar
        if(this.pageSize){
            // get rid of the Ext one
            Ext.destroy(this.pageTb);
            // now create a domino one
            this.pageTb = new Ext.nd.PagingToolbar({
                beforePageText: '',
                store: this.store,
                count: this.count,
                renderTo:this.footer
            });        
            // and now we need to bind the store to this paging toolbar
            this.pageTb.bind(this.store);
        }
    },
    
    // private
    getParams : function(q){
        var p = {};
        p.start = 1;
        p.count = this.count;
        return p;
    },
    
    getViewDesign: function() {
        
        this.viewDesign = new Ext.nd.data.ViewDesign({
            dbPath : this.dbPath,
            viewName : this.viewName,
            viewUrl : this.viewUrl,
            category : this.category,
            baseParams : {},
            queryParam : "startkey",
            callback : this.getViewDesignCB,
            scope : this
        })
        
    },
    
    // private
    getViewDesignCB: function(o){
        
        // update to the new store
        this.store = this.viewDesign.store;
        
        // convert valueField and displayField to the correct key if they are numeric
        if (typeof this.valueField == 'number') {
            this.valueField = this.store.fields.keys[this.valueField];
        }
        if (typeof this.displayField == 'number') {
            this.displayField = this.store.fields.keys[this.displayField]; 
        }
        
        // change queryParam if a category was passed in
        if (typeof this.category == 'string') {
            this.queryParam = 'restricttocategory';
        }
        
        // if there is a parentCombo defined then bind to it
        // and disable this combo
        if (typeof this.parentCombo != 'undefined') {
            this.bindParent();
            this.disable();
        }
    },
    
    // private
    bindParent: function(){
        if (typeof this.parentCombo == 'string') {
            this.parentCombo = Ext.getCmp(this.parentCombo);
        }
        if (typeof this.parentCombo == 'undefined') {
            alert('parent combo not found');
        } else {
            this.parentCombo.on('select', this.onParentSelect, this);
            this.setEditable(false);
        }
    },
    
    onParentSelect : function(combo, rec, index) {

        /* get the value from the parent
         * change this allQuery to use the parent value
         * clear this combo's value
         * enable this combo
         */

        var pval = combo.getValue();
        this.allQuery = pval;
        this.clearValue();
        if (pval == '') {
            this.disable();
        } else {
            this.enable();
        }
        
        // simulate the fire event so any combo that references
        // this combo as it's parent will call it's o2n onSelect event
        this.fireEvent('select', this, null, null);
        
    }
    
});

Ext.reg('xnd-combo', Ext.nd.form.ComboBox);