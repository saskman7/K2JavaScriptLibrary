/* EXECUTED BY PSJSLIB
$(function () {
    SCPSAPI$OverridePopupShow();
    SCPSAPI$OverridePopupClose();

    $.widget("ui.popupwindow", SourceCode.Forms.Widget.PopupWindow);
});
*/

/*Animated Panel Intro*/
function SCPSAPI$OverridePopupShow() {

    var _oldshow = SourceCode.Forms.Widget.PopupWindow.show;
    SourceCode.Forms.Widget.PopupWindow.show = function () {
        var result = null;

        if (SCPSAPI$ShouldAnimatePanel(this)) {
            this.controls.main.addClass("animatedintro scpsapi-slidepanel");
            var css = {
                top: "0px",
                right: "0px",
                left: "auto",
                bottom: "0px",
                height: "auto!important",
                position: "fixed"
            };
            this.controls.main.css(css);
            result = _oldshow.call(this);
            this.controls.main.css("height", "auto");

            if (typeof BOOST.panelWidth !== 'undefined') {
                this.controls.main.css("width", BOOST.panelWidth.toLowerCase());
            }

            var _this = this;
            window.setTimeout(function () {
                _this.controls.main.removeClass("animatedintro");
            }, 10);

        }
        else {
            result = _oldshow.call(this);
        }

        $("a.maximize").css("display", "none");
        return result;
    };
}

/*Animated Panel Exit*/
function SCPSAPI$OverridePopupClose() {

    var _oldclose = SourceCode.Forms.Widget.PopupWindow.close;
    SourceCode.Forms.Widget.PopupWindow.close = function (options) {

        if (SCPSAPI$ShouldAnimatePanel(this)) {
            var _this = this;

            function transitionEnd() {
                console.log("transitionend");

                _this.controls.main.off("transitionend", transitionEnd);

                window.setTimeout(function () {
                    _oldclose.call(_this, options);
                    _this.controls.main.removeClass("animatedexit animatedintro");
                }, 300); /*annoyingly, this is a magic number, the same as the transition length in our custom css*/
            }
            this.controls.main.on("transitionend", transitionEnd);
            this.controls.main.addClass("animatedexit");
        }
        else {
            result = _oldclose.call(this, options);
        }

    };
}

function SCPSAPI$ShouldAnimatePanel(jqPopup) {
    return jqPopup.controls.main.hasClass("sub-form") || jqPopup.controls.main.hasClass("sub-view")
}
