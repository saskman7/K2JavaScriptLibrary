if (typeof (BOOST) == "undefined") BOOST = (function () {

    var resourceURL;
    var apiURL;
    var cssName;
    var isSubviewSubform;
    var enableLog;
    this.panelWidth;
    var headerViewName;
    var taskViewName;
    var gridMinWidth;
    var formJSURL;
    var formCSSURL;

    $.loadScript = function (url, callback) {
        jQuery.ajax({
            url: url,
            dataType: 'script',
            success: callback,
            async: true
        });
    }

    function LoadResources(resourceLocation, stylesheetName, hasSubviewSubform, flyOutWidth, enableLogging, headerViewPanelName, taskViewPanelName, listViewMinWidth, formJS, formCSS) {
        enableLog = enableLogging.toString().toLowerCase();
        WriteLog("LoadResources() - START");

        WriteLog("Resource Location: " + resourceLocation.toString());
        WriteLog("Stylesheet Name: " + stylesheetName.toString());
        WriteLog("Has Subview or Subfrom: " + hasSubviewSubform.toString());
        WriteLog("Fly Out Width: " + flyOutWidth.toString());
        WriteLog("Header View Panel Name: " + headerViewPanelName.toString());
        WriteLog("Task View Panel Name: " + taskViewPanelName.toString());
        WriteLog("List View Minimum Width: " + listViewMinWidth.toString());

        if (formJS.toString().length > 0) {
            WriteLog("Form JS URL: " + resourceLocation.toString() + formJS.toString());
        }
        else {
            WriteLog("Form JS URL: ");
        }

        if (formCSS.toString().length > 0) {
            WriteLog("form CSS URL: " + resourceLocation.toString() + formCSS.toString());
        }
        else {
            WriteLog("form CSS URL: ");
        }

        resourceURL = resourceLocation.toString();
        cssName = stylesheetName.toString();
        isSubviewSubform = hasSubviewSubform.toString().toLowerCase();
        this.panelWidth = flyOutWidth.toString().toLowerCase();
        headerViewName = headerViewPanelName.toString();
        taskViewName = taskViewPanelName.toString();
        gridMinWidth = listViewMinWidth.toString().toLowerCase();

        apiURL = resourceLocation.toString() + "scpsapi.js";
        WriteLog("API URL: " + apiURL);

        $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'scpsapi.css\"/>');
        WriteLog("Loaded SCPSAPI styling");

        $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'SlideInPanel.css\"/>');
        WriteLog("Loaded Slide-In Panel styling");

        // Load CSS
        if (cssName.length > 0) {

            if (
                (cssName.toUpperCase() == "Basil".toUpperCase()) ||
                (cssName.toUpperCase() == "Nouveau".toUpperCase()) ||
                (cssName.toUpperCase() == "Original".toUpperCase())
            ) {
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/fontawesome/css/all.min.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/colors/Colors.Variables.css\"/>');

                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/colors/Colors.' + cssName + '.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/Immersion.' + cssName + '.Core.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Variables.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Buttons.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Controls.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Fonts.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Grids.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Popup.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Tabs.css\"/>');
                $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.TreeView.css\"/>');

                if (cssName.toUpperCase() == "Basil".toUpperCase()) {
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.MessageBox.css\"/>');
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Multichoice.css\"/>');
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.OptionCheckbox.css\"/>');
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Subviews.css\"/>');
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.ToolbarButtons.css\"/>');
                }
                else if ((cssName.toUpperCase() == "Nouveau".toUpperCase()) || (cssName.toUpperCase() == "Original".toUpperCase())) {
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.CheckBoxToToggle.css\"/>');
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.Choice.css\"/>');
                    $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.FilterBar.css\"/>');

                    if (cssName.toUpperCase() == "Nouveau".toUpperCase()) {
                        $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.MultiSelectBox.css\"/>');
                    }
                    else if (cssName.toUpperCase() == "Original".toUpperCase()) {
                        $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Core.TabsNumbered.css\"/>');
                        $('head').append('<link rel="stylesheet" href=\"' + resourceURL + 'themes/controls/' + cssName + '/Immersion.' + cssName + '.Overrides.css\"/>');
                    }
                }

                //Add Springboard classes so that springboard themes work.
                $('body, form, .runtime-content, .runtime-form').addClass('sbm4k2');

                WriteLog("Loaded stylesheet");
            }
            else {
                WriteLog("Stylesheet [" + cssName + "] is not implemented");
            }
        }

        if (formCSS.toString().length > 0) {
            formCSSURL = resourceLocation.toString() + formCSS.toString();
            $('head').append('<link rel="stylesheet" href=\"' + formCSSURL + '\"/>');
            WriteLog("Form CSS loaded");
        }

        // Load JS libraries
        if (formJS.toString().length > 0) {
            formJSURL = resourceLocation.toString() + formJS.toString();

            $.loadScript(apiURL, function () {
                $.loadScript(resourceURL + "SlideInPanel.js", function () {
                    $.loadScript(formJSURL, OnFormLoad);
                });
            });
        }
        else {
            $.loadScript(apiURL, function () {
                $.loadScript(resourceURL + "SlideInPanel.js", OnFormLoad);
            });
        }    
        WriteLog("LoadResources() - END");
    }

    function OnFormLoad() {
        WriteLog("OnFormLoad() - START");

        SCPSAPI$DockControls();
        WriteLog("Docked controls");

        if (isSubviewSubform.toUpperCase() === "true".toUpperCase()) {
            SCPSAPI$OverridePopupShow();
            SCPSAPI$OverridePopupClose();
            $.widget("ui.popupwindow", SourceCode.Forms.Widget.PopupWindow);

            WriteLog("Loaded fly-out panel");
        }

        if (headerViewName.length > 0) {
            $headerView = $("div[name='" + headerViewName + "']").closest("div[class='view']");

            if ($("div[name='vwFormProgressBar']").length > 0) {
                $progressBarView = $("div[name='vwFormProgressBar']").closest("div[class='view']");
                $progressBarView.css("margin-top", "0px");
                $progressBarView.css("margin-bottom", "5px");
                $headerView.css("margin-bottom", "0px");
                $("div[class='tab-box tabs-top']").prepend($progressBarView);
                WriteLog("Moved Progress Bar view");
            }
            else {
                $headerView.css("margin-bottom", "20px");
            }

            $("div[class='tab-box tabs-top']").prepend($headerView);
            WriteLog("Moved header view");
        }

        if (taskViewName.length > 0) {
            $taskDiv = $("div [name='" + taskViewName + "']");
            $taskDiv.find("div.panel-header-wrapper").css("background-color", "#0066A0");
            $taskDiv.find("div.panel-header-text").children().css("color", "#FFFFFF");
            $taskDiv.find("div.panel-body-wrapper").css("background-color", "#D0E3EE");

            WriteLog("Styled task view");
        }

        if (gridMinWidth.length > 0) {
            $(".grid-header").parent().parent().css("overflow-x", "scroll");
            $(".grid-header").parent().css("min-width", gridMinWidth);

            WriteLog("List view scrollbars added");
        }

        WriteLog("OnFormLoad() - END");
    }

    function ResizeFlyOutPanel(flyOutWidth) {
        this.panelWidth = flyOutWidth.toString().toLowerCase();
        WriteLog("Fly-out panel resized to: " + panelWidth);
    }

    function RefreshWorkspaceTaskList() {
        if (window.parent !== null) {
            if (window.parent.parent !== null) {
                $btn = $(window.parent.parent.document).find("input.RefreshInput.worklist-btn.OptionSelectBorderOff")[0];
                if (($btn !== null) && (typeof ($btn) !== "undefined")) {
                    $btn.click();

                    WriteLog("K2 Workspace tasklist refreshed");
                }
            }
        }
    }

    function WriteLog(messageText) {
        if (enableLog === "true") {
            console.log(messageText);
        }
    }

    function SetControlValue(controlName, value) {
        var controlDef = window.$sn(window.viewControllerDefinition, "Controllers/Controller/Controls/Control[@Name='" + controlName.toString()  + "']");
        var controlInfoObj = new window.PopulateObject(null, value.toString() , controlDef.getAttribute("ID"));

        window.executeControlFunction(controlDef, "SetValue", controlInfoObj);
        WriteLog("Set value of [" + controlName.toString()  + "] to [" + value.toString() + "]");
    }

    function CheckFileExists(fileURL) {
        var isExist = Boolean(true);

        $.ajax({
            url: fileURL,
            type: "HEAD",
            error: function () { isExist = false; },
            success: function () { isExist = true; }
        });

        return isExist;
    }

    return {
        LoadResources: LoadResources,
        ResizeFlyOutPanel: ResizeFlyOutPanel,
        RefreshWorkspaceTaskList: RefreshWorkspaceTaskList,
        SetControlValue: SetControlValue
    }
})();