    /* Menu Button Stuff */
    $(function() {

        if (window.parent) {
            window.parent.postMessage({
                scpsapi: true,
                method: "documentReady"
            });
        }

        var buttons = $("[name~='scpsapimenubutton'], [alt~='scpsapimenubutton']");

        function toggleMenuButtons(menuShowing) {
            console.log("menu buttons toggling on sub");
            buttons.toggleClass("selected", menuShowing);
            /*update the inside of the menu button with */
        }

        buttons.on("click", function(ev) {
            if (window.parent) {
                window.parent.postMessage({
                    scpsapi: true,
                    method: "toggleMenu"
                });
            }
            console.log("menu button clicked");
        });

        window.addEventListener("message", function(ev) {
            if (!!ev.data && !!ev.data.scpsapi && !!ev.data.method) {
                switch (ev.data.method) {
                    case "windowResize":
                        if (!!ev.data.width) {
                            $("html").toggleClass("scpsapi-mobile-width", ev.data.width < 450);
                        }
                        break;
                    case "menuToggled":
                        toggleMenuButtons(ev.data.menuShowing === true);
                        break;
                }
            }
        });
    });
