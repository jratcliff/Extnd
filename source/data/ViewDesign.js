Ext.nd.data.ViewDesign = function(config){
    this.sess = Ext.nd.Session;
    this.dbPath = this.sess.currentDatabase.webFilePath;
    this.noteType = 'view';
    this.viewName = '';
    this.multiExpand = false;
    this.storeConfig = {};
    this.isCategorized = false,
    this.callback = Ext.emptyFn;
    this.renderers = [];
    
    Ext.apply(this,config);
    
    // make sure we have a viewUrl
    if (!this.viewUrl) {
        this.viewUrl = this.dbPath + this.viewName;
    }
    
    //this.addEvents();
    Ext.nd.data.ViewDesign.superclass.constructor.call(this);
    
    // now call our getViewDesign method
    this.getViewDesign();
}

Ext.extend(Ext.nd.data.ViewDesign, Ext.util.Observable, {

    getViewDesign: function(){
        Ext.Ajax.request({
            method: 'GET',
            disableCaching: true,
            success: this.getViewDesignSuccess,
            failure: this.getViewDesignFailure,
            scope: this,
            //url: this.viewUrl + '?ReadDesign'
            url: Ext.nd.extndUrl + 'DXLExporter?OpenAgent&db=' + this.dbPath + '&type=' + this.noteType + '&name=' + this.viewName
        });
    },
    
    getViewDesignSuccess: function(res, req){

        var dxml = res.responseXML;
        
        var q = Ext.DomQuery;
        var arColumns = q.select('column', dxml);

        this.cols = [];
        var arRecordConfig = [];
        var colCount = 0;
        
        for (var i = 0; i < arColumns.length; i++) {

            var col = arColumns[i];
            
            /* must check sortcategorize (category column) first
             * because if the user wants to 'restrict' to just a single category
             * then the only way it can work in domino is if the FIRST column
             * is categorized
             */
            var sortcategorize = q.selectValue('@categorized', col, false);
            var sortcategorizeValue = (sortcategorize) ? true : false;
            this.isCategorized = this.isCategorized || sortcategorizeValue;


            // don't process first column if category is set AND
            // this is an actual categorized column
            if (i == 0 && this.isCategorized && (typeof this.category === 'string')) {
                continue;
            }
            
            // must check for hidden columns since we now use DXLExporter
            // instead of ReadDesign
            var hidden = q.selectValue('@hidden', col, false);
            hidden = (hidden === false) ? false : true;
            if (hidden) {
                continue; // skip to next column if this is set to hidden
            }
            
            
            // old way when we used view?ReadDesign
            //var columnnumber = q.selectNumber('@columnnumber', col);
            
            // no longer using ReadDesign but instead use DXLExporter
            // and DXLExporter does not include columnnumber so just use
            // whatever the value of colCount is and hopefully all will 
            // still be good :)
            var columnnumber = colCount;
            colCount++; // not hidden so increment our column count

            // adjust columnnumber if only showing a single category (to fix a
            // bug with domino not matching column numbers in readviewentries to
            // readdesign)
            // NOTE: this is no longer needed since we no longer use ?ReadDesign
            // but instead use DXLExporter
            //columnnumber = (this.category) ? columnnumber - 1 : columnnumber;
            
            
            // if name is blank, give it a new unique name
            var name = q.selectValue('@itemname', col, 'columnnumber_' + columnnumber);
            name = name.replace('$', '_'); // Ext doesn't like '$'
            
            var title = q.selectValue('columnheader/@title', col, "&nbsp;");
            
            // multiplying by 11.28 converts the inch width to pixels
            var width = Math.max(q.selectNumber('@width', col) * 11.28, 22);
            
            // response
            var response = q.selectValue('@responsesonly', col, false);
            var responseValue = (response) ? true : false;
            
            // twistie
            var twistie = q.selectValue('@twisties', col, false);
            var twistieValue = (twistie) ? true : false;
            
            // listseparator
            var listseparatorValue = q.selectValue('@listseparator', col, 'none');
            
            // resize
            var resize = q.selectValue('@resizable', col, false);
            var resizeValue = (resize) ? true : false;
                        
            // resort asc
            var resort = q.selectValue('@resort', col, false);
            var resortascendingValue = (resort == 'ascending' || resort == 'both') ? true : false;
            
            // resort desc
            var resortdescendingValue = (resort == 'descending' || resort == 'both') ? true : false;
            
            // jump to view
            var resorttoviewValue = (resort == 'toview') ? true : false;
            var resortviewunidValue = (resorttoviewValue) ? q.selectValue('@resorttoview', col, "") : "";
            
            // check the storeConfig.remoteSort property to see if the user wants to do sorting from cache
            // if so then it will be set to false (true will do the sorting 'remotely' on the server)
            // this is useful if you know you will load all data into the grid like in perhaps
            // a restricttocategory view with a small and known number of docs
            var isSortable = (this.storeConfig.remoteSort === false) ? true : (resortascendingValue || resortdescendingValue) ? true : false;
            
            // icon
            var icon = q.selectValue('@showasicons', col, false);
            var iconValue = (icon) ? true : false;
            
            // align
            var align = q.selectValue('@align', col, false);
            var alignValue = (align) ? align : 'left';
            
            // headerAlign
            var headerAlign = q.selectValue('columnheader/@align', col, false);
            var headerAlignValue = (headerAlign) ? headerAlign : 'left';
            
            // date formatting
            var tmpDateTimeFormat = q.select('datetimeformat', col)[0];
            var datetimeformat = {};
            if (tmpDateTimeFormat) {
                datetimeformat.show = q.selectValue('@show', tmpDateTimeFormat);
                datetimeformat.date = q.selectValue('@date', tmpDateTimeFormat);
                datetimeformat.time = q.selectValue('@time', tmpDateTimeFormat);
                datetimeformat.zone = q.selectValue('@zone', tmpDateTimeFormat);
            }
            
            var columnConfig = {
                id : columnnumber,
                header: (resorttoviewValue) ? title + "<img src='/icons/viewsort.gif' />" : title,
                align: alignValue,
                dataIndex: name,
                width: width,
                sortable: isSortable,
                resortascending: resortascendingValue,
                resortdescending: resortdescendingValue,
                resortviewunid: resortviewunidValue,
                sortcategorize: sortcategorizeValue,
                resize: resizeValue,
                listseparator: listseparatorValue,
                response: responseValue,
                twistie: twistieValue,
                icon: iconValue,
                datetimeformat: datetimeformat
            };
            
            var recordConfig = {
                name: name,
                mapping: columnnumber
            };
            arRecordConfig.push(recordConfig);
            
            // add to this.cols since it might have a custom selection model
            this.cols.push(columnConfig);
            
        } // end for loop that processed each column

        // is this a view or a folder?
        var isView = q.select('view', dxml);
        this.isView = (isView.length > 0) ? true : false;
        this.isFolder = !this.isView;
        var root = (this.isView) ? 'view' : 'folder';
        
        // does this view need to have it's last column extended? or did the developer specify an autoExpandColumn?        
        if (!this.autoExpandColumn) {
            if (this.extendLastColumn === false) {
                this.autoExpandColumn = false;
            } else {
                if (this.extendLastColumn === true) {
                    this.autoExpandColumn = colCount-1;
                } else {
                    var extendlastcolumn = q.selectValue(root+'/@extendlastcolumn', dxml, false);
                    this.extendLastColumn = (extendlastcolumn == 'true') ? true : false;
                    this.autoExpandColumn = (this.extendLastColumn) ? colCount-1 : false;       
               }
            }
        }
        
        // on web access property to allow docs to be selected with a checkbox
        var allowdocselection = q.selectValue(root+'/@allowdocselection', dxml, false);
        this.allowDocSelection = (allowdocselection == 'true') ? true : false;
        
        // the dominoView object holds all of the design information for the
        // view
        this.dominoView = {
            meta: {
                root: 'viewentries',
                record: 'viewentry',
                totalRecords: '@toplevelentries',
                id: '@position',
                columnConfig: this.cols,
                isCategorized: this.isCategorized
            },
            recordConfig: arRecordConfig
        };
        
        // go ahead and setup our Record and our Reader
        this.ViewEntryRecord = Ext.data.Record.create(this.dominoView.recordConfig);
        this.viewEntryReader = new Ext.nd.data.ViewXmlReader(this.dominoView.meta, this.ViewEntryRecord);
        this.setStore();
        
        if (this.scope) {
            this.callback.createDelegate(this.scope)();
        } else {
            this.callback();
        }
    },
    
    setStore : function() {
    
        // create the Data Store
        this.store = new Ext.nd.data[(this.isCategorized && this.multiExpand) ? 'CategorizedStore' : 'ViewStore'](Ext.apply({
            // this.store = new Ext.nd.data.ViewStore({
            proxy: new Ext.data.HttpProxy({
                url: this.viewUrl + '?ReadViewEntries',
                method: "GET"
            }),
            baseParams: this.baseParams,
            reader: this.viewEntryReader,
            remoteSort: true
        }, this.storeConfig));

    },
    
    // private
    getViewDesignFailure: function(res, req){
        this.fireEvent('getdesignfailure', this, res, req);
    }
    
}); // eo Ext.nd.data.ViewDesign