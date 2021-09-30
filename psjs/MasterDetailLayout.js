    /* Mobile Responsiveness stuff */
    $(function() {
        var buttons = $("[name~='scpsapimenubutton'],[alt~='scpsapimenubutton']");
        var menuElement = $(".runtime-form>.form>.row>*:nth-child(1)");

        /*testing*/
        /*menuElement.addClass("show");*/

        function toggleMenu() {
            menuElement.toggleClass("show");
            var menuShowing = menuElement.hasClass("show");
            buttons.toggleClass("selected", menuShowing);
            $("iframe").each(function(index, ele) {
                ele.contentWindow.postMessage({
                    scpsapi: true,
                    method: "menuToggled",
                    menuShowing: menuShowing
                });
            });
        }

        function tellChildIframesWindowSize() {
            $("iframe").each(function(index, ele) {
                ele.contentWindow.postMessage({
                    scpsapi: true,
                    method: "windowResize",
                    height: window.innerHeight,
                    width: window.innerWidth,
                });
            });
        }

        window.addEventListener("message", function(ev) {
            if (!!ev.data && !!ev.data.scpsapi && !!ev.data.method) {

                switch (ev.data.method) {
                    case "toggleMenu":
                        toggleMenu();
                        break;
                    case "documentReady":
                        tellChildIframesWindowSize();
                        break;
                }
            }
        });

        window.addEventListener("resize", function(ev) {
            tellChildIframesWindowSize();
        });

        buttons.on("click", function(ev) {
            toggleMenu();
        });
    });