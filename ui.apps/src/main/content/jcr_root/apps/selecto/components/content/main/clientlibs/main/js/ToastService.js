/* jshint undef: true, unused: true */
/* globals $, Coral, document, setTimeout, DeferredQueue*/
(function () {
    var SERVICE_NAME = "toast";

    var Toast = function (alertElSelector, defaultTimeout) {
        this._defaultTimeout = 2000 || defaultTimeout;
        this._toast = undefined;
        var _self = this;
        $(function(){
            _self._toast = $('#cui-toast');
        });
    };

    /**
     * Show the notification
     * @param {*} variant the notification variant
     * @param {*} header notification header HTML
     * @param {*} content notification content HTML
     * @param {*} timeout hide after timeout, default 400ms
     */
    Toast.prototype._show = function (variant, header, content, timeout) {
        var _self = this;
        var toast = new Coral.Alert().set({
            variant: variant,
            hidden: false,
            header: { innerHTML: header || ""},
            content: { innerHTML: content || ""}
        });
        toast.classList.add('toast');
        this._toast.append(toast);
        Coral.commons.ready(toast, function(){
            var $t = $(toast);
            $t.addClass('toast__slide-in');
            

            $t.attr('hidden', null);
            setTimeout(function () {
              _self.hide(toast);
            }, timeout ? timeout : _self._defaultTimeout);
        });
    };

    /**
     * hide toast
     */
    Toast.prototype.hide = function (toastEl) {
        var $t = $(toastEl);
        $t.removeClass('toast__slide-in');
        $t.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',   
        function(e) {
            toastEl.remove();
        });
    };
    /**
     * Show info notification
     * @param {*} header notification header HTML
     * @param {*} content notification content HTML
     * @param {*} timeout hide after timeout, default 400ms
     */
    Toast.prototype.info = function (header, content, timeout) {
        return this._show(Coral.Alert.variant.INFO, header, content, timeout);
    };

    /**
     * Show info success
     * @param {*} header notification header HTML
     * @param {*} content notification content HTML
     * @param {*} timeout hide after timeout, default 400ms
     */
    Toast.prototype.success = function (header, content, timeout) {
        return this._show(Coral.Alert.variant.SUCCESS, header, content, timeout);
    };
    /**
     * Show info warning 
     * @param {*} header notification header HTML
     * @param {*} content notification content HTML
     * @param {*} timeout hide after timeout, default 400ms
     */
    Toast.prototype.warn = function (header, content, timeout) {
        return this._show(Coral.Alert.variant.WARNING, header, content, timeout);
    };
    /**
     * Show error notification
     * @param {*} header notification header HTML
     * @param {*} content notification content HTML
     * @param {*} timeout hide after timeout, default 400ms
     */
    Toast.prototype.error = function (header, content, timeout) {
        return this._show(Coral.Alert.variant.ERROR, header, content, timeout);
    };

    // register the notification service
    window.selecto.registry.register(SERVICE_NAME, new Toast());

})();