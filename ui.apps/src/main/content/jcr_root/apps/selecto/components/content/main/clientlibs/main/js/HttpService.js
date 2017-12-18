/* jshint undef: true, unused: true */
/* globals window, $, console */
(function(){
    var SERVICE_NAME = "http";
    var SERVLET_URL =  "/bin/selecto.servlet";

    // A multi purpose http service
    var HttpService = function(url){
        this._defaultAjaxSettings = {
            url : url,
            contentType: 'application/json',
            processData: 'false'
        };
        this._url = url;
        this._progress = function(){console.log('in progress...');};
    };

    /**
     * Replaces first instance of "." with '.${selector}.' effectively adding a sling selector
     * @param {*} url The url to change
     * @param {*} selector  the Selector to add
     * @returns the newly modified url, if selector is not truthy, returns original url
     */
    HttpService.prototype._addSelector = function(url, selector){
        return (selector) ? url.replace('.', '.'+selector+'.'): url;
    };

    /**
     * Sends a jQuery ajax request
     * @param {*} method The HTTP method
     * @param {*} id the id to add to selectors
     * @param {*} data  the data
     * @param {*} additionalSettings any additional jQuery.Ajax settings
     * @returns {jQuery.Ajax}
     */
    HttpService.prototype._send = function(method, id, data, additionalSettings){
        var settings = {
            method: method,
            url: this._addSelector(this._url, id), // add id as a selector, will be handeled by servlet
            data: JSON.stringify(data), // stringify objects
            progress: this._progress,
            complete: this._complete
        };
        // merge all settings
        var ajaxSettings = $.extend({},this._defaultAjaxSettings, settings, additionalSettings);
        // send request
        return $.ajax(ajaxSettings);
    };

    /**
     * Sets a function to be executed while request is in progress
     * @param {*} inprogressFunction the function to be called in progress
     */
    HttpService.prototype.progress = function(inprogressFunction){
        this._progress = inprogressFunction;
    };

       /**
     * Sets a function to be executed on request complete
     * @param {*} completeFunction the function to be called in progress
     */
    HttpService.prototype.complete = function(completeFunction){
        this._complete = completeFunction;
    };

    /**
     * Sends a PUT request with first selector set to the id 
     * @param {*} id The item id to be created
     * @param {*} data The data for the item
     * @param {*} additionalSettings additional settings for jQuery ajax request
     */
    HttpService.prototype.get = function(id, data, additionalSettings){
        return this._send("GET", id, data, additionalSettings);
    };

    /**
     * Sends a PUT request with first selector set to the id 
     * @param {*} id The item id to be created
     * @param {*} data The data for the item
     * @param {*} additionalSettings additional settings for jQuery ajax request
     */
    HttpService.prototype.create = function(id, data, additionalSettings){
        return this._send("PUT", id, data, additionalSettings);
    };

    /**
     * Sends a PUT request with first selector set to the id 
     * @param {*} id The item id to be updated
     * @param {*} data The data for the item
     * @param {*} additionalSettings additional settings for jQuery ajax request
     */
    HttpService.prototype.update = function(id, data, additionalSettings){
        return this._send("POST", id, data, additionalSettings);
    };

    /**
     * Sends a PUT request with first selector set to the id 
     * @param {*} id The item id to be deleted
     * @param {*} data The data for the item
     * @param {*} additionalSettings additional settings for jQuery ajax request
     */
    HttpService.prototype.delete = function(id, additionalSettings){
        return this._send("DELETE", id, null, additionalSettings);
    };

    // register the http service
    window.selecto.registry.register(SERVICE_NAME, new HttpService(SERVLET_URL));

})();