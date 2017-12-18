/* jshint undef: true, unused: true */
/* globals $, Coral, document, window*/
(function () {
    var SERVICE_NAME = "progress";

    var Progress = function (selector) {
        var _self = this;
        $(function(){
            _self._progress = document.querySelector(selector);
            if(!_self._progress){
                _self._progress = new Coral.Wait().set({size: "M"});
                document.body.append(_self._progress);
            } 
            _self._progress.style.position = 'absolute';
            _self._progress.style.bottom = '1em';
            _self._progress.style.left = '1em';
        });
    };

    Progress.prototype.show = function(){this._progress.show();};
    Progress.prototype.hide = function(){this._progress.hide();};

    // register the notification service
    window.selecto.registry.register(SERVICE_NAME, new Progress('#selecto-wait'));

})();