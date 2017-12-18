/* jshint undef: true, unused: true */
/* globals window, console */

/**
 * adds the service registry to global scope at window.selecto.registry
 */
(function(){

    var serviceRegistry = function serviceRegistry(){
        this._services = {};
    };

    /**
     * Checks if service exists
     * @param {string} name the service name
     */
    serviceRegistry.prototype.has = function(serviceName){
        var registry = this;
        return !!registry._services[serviceName];
    };
    
    /**
     * Registers a new service
     * @param {string} name the service name
     */
    serviceRegistry.prototype.register = function(serviceName, serviceInstance){
        var registry = this;
        if(registry.has(serviceName)){ // cante register service that already registered
            console.error("Tried to register an already registered service "+ serviceName);
            return;
        }
        registry._services[serviceName] = serviceInstance;
        return registry._services[serviceName];
    };

    /**
     * Get a registered service
     * @param {string} name the service name
     * @param {Function} service an instantiable service with new (typically a no argument function)
     */
    serviceRegistry.prototype.get = function(serviceName){
        var registry = this;
        if(!registry.has(serviceName)){
            console.error("Cannot get Service '"+serviceName+"', it was not registered");
            return;
        }
        return registry._services[serviceName];
    };

    // Add registry to global namespace
    window.selecto = window.selecto || {};
    window.selecto.registry = new serviceRegistry();

})();