/* jshint undef: true, unused: true */
/* globals $, Coral, document, _, window*/
(function(){

    /**
     * Add column item to column view element
     * @param {Coral.ColumnView.Column}
     * @param {HTML} title item title HTML
     * @param {string} id item id
     * @returns the newly added item
     */
    function addColumnItem(columnViewEl, title, id){
        // deactivate all items, new item should be active
        _.forEach(columnViewEl.items.getAll(), function(colItem) {
            colItem.active = false;
            colItem.selected = false;
        });

        // create new item and add it to list
        var newItem = new Coral.ColumnView.Item();
        newItem.set({
            active: true,
            selected: true,
            id: id,
            content: {innerHTML:title},
            thumbnail: {innerHTML:'<coral-columnview-item-thumbnail class="hover-white"><coral-icon icon="delete" size="S"></coral-icon><coral-columnview-item-thumbnail>'}
        });
        columnViewEl.items.add(newItem);
        return newItem;
    }

    /**
     * Get the item that has innerHtml
     * @param {*} columnViewEl 
     * @param {*} innerHtml 
     */
    function findItem(columnViewEl, innerHtml){
        return _.find(columnViewEl.items.getAll(), function(item) { return item.content.innerHTML ===  innerHtml;});
    }
    
    /**
     * Finds the first item with innerHTML===name in column then triggers a click on it.
     * @param {Coral.ColumnView.Column} column the column that contains the item to click
     * @param {string} name the item's name (innerHTML)
     * @returns {HTMLElement} the item content element that was clicked
     */
    function clickColumnItemContent(column, name){
        var current = name ? findItem(column, name) : name;
        var toClick;
        if(current) toClick = current.content;
        else {
            var first = column.items.first();
            if(first) toClick = first.content;
        }
        $(toClick).trigger('click');
        return toClick;
    }

    /**
     * Loads all datasources and adds them to the left sidebar column;
     * @param {Coral.ColumnView.Column} the column to load sources into
     * @param {Function} cb to be executed with current element name 
     */
    function loadDataSources($dsColumn, cb){
        var currentItem = $dsColumn.activeItem ? $dsColumn.activeItem : $dsColumn.selectedItem;
        var currentItemName = currentItem ? $dsColumn.activeItem.content.innerHTML : undefined;
        var selectoHttpSrv =  window.selecto.registry.get('http');
        var toastSrv = window.selecto.registry.get('toast');
        $dsColumn.items.clear();
        addColumnItem($dsColumn, '<coral-wait size="M" style="margin-left: 60px"></coral-wait>'); // add wait element
        return selectoHttpSrv
        .get()
        .done(function(data){
            $dsColumn.items.clear();
            _.forEach(data, function(ds, name){
                var item  = addColumnItem($dsColumn, name);
                $(item.content).on('click', function(){ 
                    $.publish('selecto-view-ds', [name, ds.options]); // publish event with options
                });
                $(item.thumbnail).on('click', function(){
                    $.publish('selecto-delete-ds', [name, ds.options]); // publish event with options
                });
            });
            toastSrv.success('Sucess', 'All DataSources loaded');
            var clickedContent = clickColumnItemContent($dsColumn, currentItemName);
            if(cb) cb(clickedContent ? clickedContent.innerHTML : undefined);
        })
        .fail(function(err){
            var parsedErr = parseJson(err);
            if(parsedErr) toastSrv.error(parsedErr.title, parsedErr.text);
            else toastSrv.error('Server error', err);
        });
    }

    /**
     * Adds a new item to the multifield
     * @param {*} multifield multifield to add item to
     * @param {*} itemInnerHtml  the html to be added to item
     */
    function addMultifieldItem(multifield, itemInnerHtml){
        var newItem = new Coral.Multifield.Item().set({
            content: {innerHTML: itemInnerHtml}
        });
        multifield.items.add(newItem);
    }

    /**
     * Checks if passed string is json string
     * @param {string} str 
     */
    function parseJson(str){
        var parsed;
        try { parsed = JSON.parse(str);}
        catch(e){ return false;}
        return parsed;
    }

    /**
     * Validates an input element
     * @param {HTMLElement} el 
     */
    function validate(el){
        var validation = $(el).adaptTo('foundation-validation');
        var valid = validation.checkValidity();
        validation.updateUI();
        return valid;
    }

    /**
     * Gets the outer html of a jquery element
     */
    $.fn.outerHtml = function(){ return this.clone().wrap('<div>').parent().html();};

    /**
     * Get's the innerHtml of element then createa a new element from that
     * sort of like a jQuery.clone but different impl
     */
    $.fn.cloneInnerHtml = function(){return $(this.html());};

    /**
     * Creates and adds a Coral.Multifield to the page
     * @param {*} templateSelector the selector for multifield template
     * @param {*} appendToSelector the selector under which to append the multifield 
     * @param {*} addBtnTxt the 'add' button text
     */
    function createMultifield(templateSelector, appendToSelector, addBtnTxt){
        /**
         * add the multifield to the selecto form
         */
        var multifield = new Coral.Multifield();
        // have to do it this way to support ie11
        multifield.template.content.appendChild($(document.querySelector(templateSelector).innerHTML).get(0));
        var add = new Coral.Button();
        add.label.textContent = addBtnTxt;
        add.setAttribute('coral-multifield-add', '');
        add.setAttribute('type', 'button'); // prevent form submit
        multifield.appendChild(add);
        document.querySelector(appendToSelector).appendChild(multifield);
        return multifield;
    }

    $(function(){
        // ========= SERVICES
        var selectoHttpSrv =  window.selecto.registry.get('http');
        var toastSrv = window.selecto.registry.get('toast');
        var progressSrv = window.selecto.registry.get('progress');

        // ========= REUSABLE SELECTORS
        var selector = {
            dialodAddBtn: '#addButton',
            multifieldTemplate: '#selecto-option-template',
            optionText: '.selecto-txt',
            optionVal: '.selecto-val'
        };

        // ========= PRE_SELECT ELEMENTS
        var $dsAddBtn = document.querySelector('#ds-add-new-btn');
        var $dsColumn = document.querySelector('#ds-column');
        var $dsAddDialog = document.querySelector('#ds-dialog');
        var $dsId = $dsAddDialog.querySelector('#ds-id');
        var $dsDialogAddBtn = $dsAddDialog.querySelector(selector.dialodAddBtn);
        var $optionsForm = document.querySelector('#selecto-option-form');
        var $saveOptionsBtn = document.querySelector('#save-options');
        var $title = document.querySelector('#selecto-selected-title');
        var $name = document.querySelector('#selcto-datasource-name');

        // ========= HELPERS
        
        // validates both id and title inputs
        function validateBoth(){
            var valid = validate($dsId);
            $($dsDialogAddBtn).attr('disabled', valid ? null : 'disabled');  
            return valid;          
        }

        // adds a new datasource option to multifield
        function addOptionToMultifield(multifield, text, value){
            var $template = $(selector.multifieldTemplate).cloneInnerHtml();
            $template.find(selector.optionText).attr('value', text);
            $template.find(selector.optionVal).attr('value', value);
            addMultifieldItem(multifield, $template.outerHtml());
        }

        // gets the options array from multifield
        function getOptions(multifield){
            return _.map(multifield.items.getAll(), function(item){
                return {
                    'text': item.querySelector(selector.optionText).value,
                    'value': item.querySelector(selector.optionVal).value
                };
            });
        }
        // loads all datasources then toggels form visibility
        function loadDataSourcesToggleForm(){
            return loadDataSources($dsColumn, function(activeItemName){
                // hide form if no current active element
                if(activeItemName) $optionsForm.style.display = '';
                else $optionsForm.style.display = 'none';
            });
        }

         // ========= MAIN
        // show/hide progress indicator when requests are inprogress/complete
        selectoHttpSrv.progress(function(){progressSrv.show();});
        selectoHttpSrv.complete(function(){progressSrv.hide();});

        // load all datasources, first time
        loadDataSourcesToggleForm();

        // Get the datasources path and set it on the page
        selectoHttpSrv.get('data-source-selector')
        .done(function(data){
            $(function(){$('#selcto-datasource-path').html(data.path);});
        })
        .fail(function(){
            toastSrv.error('Server Error', 'Could not get DataSources path');
        });

        // add events to validate inputs
        $dsId.on('input', validateBoth);

        // handle add new data source
        $dsAddBtn.on('click', function(){
            $dsAddDialog.show();
        });

        // handle adding a new datasource from dialog.
        $dsAddDialog.on('click', selector.dialodAddBtn, function() {
            var valid = validateBoth();
            if(!valid) return;
            // TODO
            selectoHttpSrv.create($dsId.value, []) // creates new empty datasource
            .done(function(){
                loadDataSourcesToggleForm()
                .done(function(){
                    var newlyAdded = findItem($dsColumn, $dsId.value);
                    $(newlyAdded.content).trigger('click');
                    toastSrv.success('Success', 'Added DataSource '+$dsId.value);
                    $dsAddDialog.hide();
                    $dsId.value='';
                });
            })
            .fail(function(){
                toastSrv.error('Server Error', 'Could not add datasource');
            });
        });
        
        // create the multifield and add it to form
        var multifield = createMultifield(selector.multifieldTemplate, '#selecto-option-fieldset', 'Add Option');
        
        $.subscribe("selecto-view-ds", function showOptions(e, dsName, dsOptions){
            $title.innerHTML = dsName;
            $name.innerHTML = dsName;
            multifield.items.clear(); // remove current items
            _.forEach(dsOptions, function(opt){
                addOptionToMultifield(multifield, opt.text, opt.value);
            });
        });
        $.subscribe("selecto-delete-ds", function(e, id){
            // delete wrapped in ['*'] because of an issue with YUI compressor (https://github.com/yui/yuicompressor/issues/189)
            selectoHttpSrv['delete'](id)
            .always(loadDataSourcesToggleForm)
            .done(function(){
                toastSrv.success('Success', 'Deleted DataSource '+$dsId.value);
            }).fail(function(data){
                toastSrv.error('Error', data && data.text ? data.text : 'Could not delete DataSource');
            });
        });

        $saveOptionsBtn.on('click', function(){
            selectoHttpSrv.update($dsColumn.activeItem.content.innerHTML, getOptions(multifield))
            .always(loadDataSourcesToggleForm)
            .done(function(){
                toastSrv.success('Success', 'Updated DataSource '+$dsId.value);
            })
            .fail(function(data){
                toastSrv.error('Error', data && data.text ? data.text : 'Could not update DataSource');
            });
        });
        

    });
})();