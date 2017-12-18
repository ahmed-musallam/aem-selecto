/* jshint undef: true, unused: true */
/* globals $, window */
(function(){

    /**
     * Validator for required fields
     */
    $(window).adaptTo("foundation-registry").register("foundation.validation.validator", {
        selector: "[data-selecto-required]",
        validate: function (el) {
            if(!el.value) return "This field is required";
        }
    });

    /**
     * validator for input field to require alphanumeric and dashes only 
     */
    $(window).adaptTo("foundation-registry").register("foundation.validation.validator", {
        selector: "[data-selecto-alphanumeric-dashes-only]",
        validate: function (el) {
            var value = el.value;
            var regexp = /^[a-zA-Z0-9-_]+$/;
            if (value.search(regexp) == -1) return "Can only contain alphanumric charachters and dashes '-'";
            else return; // valid
        }
    });

})();