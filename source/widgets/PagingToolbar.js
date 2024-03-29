/**
 * @class Ext.nd.PagingToolbar
 * @extends Ext.PagingToolbar
 * A specialized toolbar that is bound to a {@link Ext.nd.data.ViewStore} and provides automatic paging controls geared towards Domino
 * @constructor Create a new PagingToolbar that works with Domino views
 */
Ext.nd.PagingToolbar = function(config){
    Ext.nd.PagingToolbar.superclass.constructor.call(this, config);
};

Ext.extend(Ext.nd.PagingToolbar, Ext.PagingToolbar, {

	// change the displayed text
	beforePageText : 'Showing entries ',
	afterPageText : ' - {0}',
	middlePageText: ' of ',
	paramNames: {
        start: 'start',
        limit: 'count'
    },

	initComponent : function() {

		Ext.nd.PagingToolbar.superclass.initComponent.call(this);
    
		/* 	starting with Ext 3rc3 the inputItem was changed from a text field
		 *	to a number field so we need to change it back so that it will work
		 *	with Domino's hierarchical start params (i.e. 2.3.2.1, etc.) 
		 */
		Ext.each(this.items.items, function(item, index, allItems){
			if (item.getXType && item.isXType('numberfield',true)){
				allItems[index] = this.inputItem = new Ext.form.TextField({
					cls: 'x-tbar-page-number',
					enableKeyEvents: true,
					selectOnFocus: true,
					grow: true,
					listeners: {
		            	scope: this,
		            	keydown: this.onPagingKeyDown,
		            	blur: this.onPagingBlur
		        	}
				});
			}
		}, this)

		this.previousCursor = 1;
		this.previousStart = [];
		this.previousStartMC = new Ext.util.MixedCollection();
    
	},

	// private override since pageNum could represent a deeply nested domino heirarchy (ie 3.22.1.2)
	// and the normal Ext pageNum expects a number
	readPage : function(d){
		var pageNum = this.inputItem.getValue();    
		if (!pageNum) {
			this.inputItem.setValue(d.activePage);
			return false;
		}
		return pageNum;
	},

	// private override since pageNum could represent a deeply nested domino heirarchy (ie 3.22.1.2)
	// and the normal Ext pageNum expects a number
	onPagingKeyDown : function(field, e){
		var k = e.getKey(), d = this.getPageData(), pageNum;
		if (k == e.RETURN) {
			e.stopEvent();
			pageNum = this.readPage(d);
			this.doLoad(pageNum);
		}else if (k == e.HOME || k == e.END){
			e.stopEvent();
			pageNum = k == e.HOME ? 1 : d.pages;
			field.setValue(pageNum);
		}else if (k == e.UP || k == e.PAGEUP || k == e.DOWN || k == e.PAGEDOWN){
			e.stopEvent();
			if(pageNum == this.readPage(d)){
				var increment = e.shiftKey ? 10 : 1;
				if(k == e.DOWN || k == e.PAGEDOWN){
					increment *= -1;
				}
				pageNum += increment;
				if(pageNum >= 1 & pageNum <= d.pages){
					field.setValue(pageNum);
				}
			}
		}
	},

	// private
	moveFirst : function(){
		this.prevButton = 'first';
		//this.store.load({params: Ext.apply(this.store.lastOptions.params, {start: 1,count: this.pageSize})});
		this.doLoad(1);
	},


	movePrevious : function(){
		this.prevButton = 'previous';
		var start;
        var first = this.store.data.first();
        var firstPosition = first.node.attributes.getNamedItem('position').value;
        // if the previous page exists in cache, use it
        var indexFirst = this.previousStartMC.indexOfKey(firstPosition)
        if (indexFirst != -1) {
        	if (indexFirst == 0) {
        		start = 1;
        	} else {
        		start = this.previousStartMC.get(indexFirst-1);
        	}
        } else {
        	if (this.prevButton == 'last') {
        		start = this.previousStartMC.last();
        	} else {
        		start = 1;
        		this.previousStartMC.clear(); // clear everything and start over
        	}
        }
        //this.store.load({params: Ext.apply(this.store.lastOptions.params, {start: start,count: this.pageSize})});
        this.doLoad(start);
	},

	moveNext : function(){
    	this.prevButton = 'next';
		var start;
		var last = this.store.data.last();
		var lastIndex = this.store.data.indexOf(last);
		if (this.store.data.length > 0) {
			if (last.isCategoryTotal) {
				var previous = this.store.getAt(lastIndex-1);
				start = previous.node.attributes.getNamedItem('position').value;
			} else {
				start = last.node.attributes.getNamedItem('position').value;
			}
			this.previousStartMC.add(start,start);
		} else {
			start = 1;
		}
		//this.store.load({params: Ext.apply(this.store.lastOptions.params, {start: start,count: this.pageSize})});
		this.doLoad(start);
	},

	moveLast : function(){
      	this.prevButton = 'last';
      	var start;
        var total = this.store.getTotalCount();
        var extra = total % this.pageSize;
        start = this.isCategorized ? total : extra ? (total - extra) : total-this.pageSize;
        //this.store.load({params: Ext.apply(this.store.lastOptions.params, {start: start, count: this.pageSize})});
        this.doLoad(start);
	},

	refresh : function(){
      	this.prevButton = 'refresh';
        //this.store.load({params: Ext.apply(this.store.lastOptions.params, {start: this.cursor, count: this.pageSize})});
      	this.doLoad(this.cursor);
	},

  // private override to deal with domino's categories and views with reader/author fields
	onLoad : function(store, r, o){
		this.cursor = o.params ? (o.params.start ? o.params.start : 1) : 1;
		var d = this.getPageData(), ap = d.activePage, ps = d.pages;

		// reset activePage if no start param
		// start param is removed when user clicks on a column to resort
		// this is so that the paging will start over since we are taking the user back to the top of the view (sorted by the column they clicked)
		if (o.params) {
			if (!o.params.start) {
				d.activePage = 1;
				ap = 1;
			}
		} else {
			d.activePage = 1;
			ap = 1;        
		}

		// resize the text field to hold the starting entry value
		//var tm = Ext.util.TextMetrics.createInstance(this.inputItem.el.dom,100);
		//this.inputItem.el.applyStyles({'width':Math.max(tm.getWidth(ap)+10,20), 'textAlign' : 'right'});

		this.afterTextItem.setText(String.format(this.afterPageText, d.pages));
		this.inputItem.setValue(ap);

		// 	the Ext.nd way that works for categorized views and views with reader fields
		this.first.setDisabled(store.baseParams.start == 1);
		this.prev.setDisabled(store.baseParams.start == 1);
		this.next.setDisabled(store.data.length < store.baseParams.count); 
		this.last.setDisabled(store.data.length < store.baseParams.count);

		this.refresh.enable();

		this.fireEvent('change', this, d);
	},

    
	// private
	getPageData : function(){
		var total = this.store.getTotalCount();
		var activePage, first, firstText, last, lastText, previous;

		// reset this.button
		this.button = '';

		// for the new way of showing where within a view you are
		if (this.store.data.length > 0) {
			first = this.store.data.first();
			firstText = first.node.attributes.getNamedItem('position').value;
			last = this.store.data.last();
			if (last.isCategoryTotal) {
				var lastIndex = this.store.data.indexOf(last);
				if (lastIndex == 0) {
					lastText = firstText;
				} else {
					previous = this.store.getAt(lastIndex-1);
					lastText = previous.node.attributes.getNamedItem('position').value;    
				}
			} else {
				lastText = last.node.attributes.getNamedItem('position').value;
			}
		} else {
			firstText = '1';
			lastText = '1';
		}

		return {
			total : total,
			activePage : firstText,
			pages : lastText + this.middlePageText + total
		};
		
	} // eo getPageData

});
Ext.reg('xnd-paging', Ext.nd.PagingToolbar);