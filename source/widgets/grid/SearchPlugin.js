Ext.nd.SearchPlugin = Ext.extend(Ext.util.Observable, {
    align: null,
    iconCls: 'icon-magnifier',
    searchText: 'Search',
    searchCount: 40,
    blankText: 'Search view...',
    searchTipText: 'Type a text to search and press Enter',
    minCharsTipText: 'Type at least {0} characters',
    width: 120,
    shortcutKey: 'r',
    shortcutModifier: 'alt',
    
    init: function(toolbar){
        
        this.toolbar = toolbar;

        // if the parent toolbar is an Ext.nd.Actionbar
        // then we need to wait to add the actions 
        // until the parent is done with adding its actions
        
        if (this.toolbar.isXType('xnd-actionbar',true)) {
            this.toolbar.on('actionsloaded', this.addSearchField, this);
        } else {
            this.toolbar.on('render',this.addSearchField, this);
        }
        
    },
    
    addSearchField: function(){

        this.uiView = this.toolbar.getUIView();
        
        // handle alignment
        if ('right' === this.align) {
            this.toolbar.addFill();
        } else {
            if (0 < this.toolbar.items.getCount()) {
                this.toolbar.addSeparator();
            }
        }
        
        this.field = new Ext.form.TwinTriggerField({
            width: this.width,
            hideTrigger1: true,
            selectOnFocus: undefined === this.selectOnFocus ? true : this.selectOnFocus,
            trigger1Class: 'x-form-clear-trigger',
            trigger2Class: this.minChars ? 'x-hidden' : 'x-form-search-trigger',
            onTrigger1Click: this.minChars ? Ext.emptyFn : this.onTriggerClear.createDelegate(this),
            onTrigger2Click: this.onTriggerSearch.createDelegate(this),
            minLength: this.minLength
        });
        
        // install event handlers on input field
        this.field.on('render', function(){
            this.field.el.dom.qtip = this.minChars ? String.format(this.minCharsTipText, this.minChars) : this.searchTipText;
            
            if (this.minChars) {
                this.field.el.on({
                    scope: this,
                    buffer: 300,
                    keyup: this.onKeyUp
                });
            }
            
            // install key map
            var map = new Ext.KeyMap(this.field.el, [{
                key: Ext.EventObject.ENTER,
                scope: this,
                fn: this.onTriggerSearch
            }, {
                key: Ext.EventObject.ESC,
                scope: this,
                fn: this.onTriggerClear
            }]);
            map.stopEvent = true;
        }, this, {
            single: true
        });
        
        this.toolbar.add(this.searchText);
        this.toolbar.add(this.field);
        
        
        // keyMap
        if (this.shortcutKey && this.shortcutModifier) {
            var shortcutEl = this.uiView.getEl();
            var shortcutCfg = [{
                key: this.shortcutKey,
                scope: this,
                stopEvent: true,
                fn: function(){
                    this.field.focus();
                }
            }];
            shortcutCfg[0][this.shortcutModifier] = true;
            this.keymap = new Ext.KeyMap(shortcutEl, shortcutCfg);
        }
        
        if (true === this.autoFocus) {
            this.uiView.getStore().on({
                scope: this,
                load: function(){
                    this.field.focus();
                }
            });
        }
    },
    onKeyUp: function(){
        var length = this.field.getValue().toString().length;
        if (0 === length || this.minChars <= length) {
            this.onTriggerSearch();
        }
    },
    onTriggerClear: function(){
        if (this.isSearching) {
            var paging = this.uiView.getBottomToolbar();
            if (paging) {
                paging.unbind(this.uiView.getStore());
                paging.bind(this.oldDataSource);
            }
            this.uiView.reconfigure(this.oldDataSource, this.uiView.getColumnModel());
            this.uiView.getStore().load({
                params: {
                    start: 1
                }
            });
            this.isSearching = false;
            
            
        }
        if (this.field.getValue()) {
            this.field.setValue('');
            this.field.focus();
            
        }
        this.field.triggers[0].hide();
    },
    onTriggerSearch: function(){
        if (!this.field.isValid()) {
            return;
        }
        var val = this.field.getValue();
        var store = this.uiView.getStore();
        
        var vni = this.uiView.viewUrl.lastIndexOf('/') + 1;
        var dbPath = this.uiView.viewUrl.substring(0, vni);
        var viewName = this.uiView.viewUrl.substring(vni);
        
        
        var baseParams = {
            db: dbPath.substring(0, dbPath.length - 1),
            vw: viewName
        };
        
        if (!this.isSearching) {
            this.oldDataSource = this.uiView.getStore(); // Save the current DS so we can restore it when search is cleared
            if (this.oldDataSource.baseParams.RestrictToCategory) {
                baseParams = Ext.apply(baseParams, {
                    RestrictToCategory: this.oldDataSource.baseParams.RestrictToCategory
                });
            }

            var ds = new Ext.nd.data.ViewStore({
                proxy: new Ext.data.HttpProxy({
                    url: Ext.nd.extndUrl + 'SearchView?OpenAgent',
                    method: "GET"
                }),
                baseParams: baseParams,
                reader: this.uiView.viewEntryReader,
                remoteSort: false
            });
            
            
            this.uiView.reconfigure(ds, this.uiView.getColumnModel());
            var paging = this.uiView.getBottomToolbar();
            
            if (paging) {
                paging.unbind(this.oldDataSource);
                paging.bind(ds);
            }
            this.isSearching = true; // Set this so we don't create the search datastore multiple times
        }
        this.uiView.getStore().load({
            params: {
                query: val,
                count: this.searchCount,
                start: 1
            }
        });
        this.field.triggers[0].show();
    },
    setDisabled: function(){
        this.field.setDisabled.apply(this.field, arguments);
    },
    enable: function(){
        this.setDisabled(false);
    },
    disable: function(){
        this.setDisabled(true);
    }
});
Ext.reg('xnd-view-search', Ext.nd.SearchPlugin);
