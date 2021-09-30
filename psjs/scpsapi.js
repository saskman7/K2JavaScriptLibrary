/* #region RULES EXECUTION */
    if (typeof(SCPSAPI) == "undefined") SCPSAPI = {};

    if (typeof(SCPSAPI.rules) == "undefined") {
        SCPSAPI.rules = (function() {

            function executeRuleForForm(ruleName) {

                var rule = $("Event[RuleFriendlyName='" + ruleName + "']", __runtimeEventsDefinition);
                var ruleFound = false;

                $.each(rule, function(i, val) {

                    var item = $(val);

                    var sourceType = item.attr("SourceType");
                    if (sourceType == "Form" || sourceType == "Rule") {
                        console.info("SCPSAPI.rules: rule [" + ruleName + "] found on the form and executed!");

                        /*SF Private API - HandEvent*/
                        handleEvent(item.attr("SourceID"), item.attr("SourceType"), item.children("Name").text());
                        ruleFound = true;
                    }
                });

                if (ruleFound == false) {
                    console.warn("SCPSAPI.rules: rule [" + ruleName + "] not found on the form");
                }
            }

            function _getFirstRuleByName(ruleName) {
                var rules = $("Event[RuleFriendlyName='" + ruleName + "']", __runtimeEventsDefinition);
                var ruleFound = false;
                var foundRuleXML = null;

                $.each(rules, function(i, val) {
                    var item = $(val);
                    var sourceType = item.attr("SourceType");
                    if (sourceType == "Form" || sourceType == "Rule") {
                        foundRuleXML = item;
                        ruleFound = true;
                        return true;
                    }
                });

                return foundRuleXML;
            }

            function formRuleExists(ruleName) {
                return (_getFirstRuleByName(ruleName) != null);
            }

            return {
                executeRuleForForm: executeRuleForForm,
                formRuleExists: formRuleExists
            };
        })();
    }


/* #region FRAME COMMUNICATOR */
    if (typeof(SCPSAPI) == "undefined") SCPSAPI = {};

    if (typeof(SCPSAPI.framecommunicator) == "undefined") {
        SCPSAPI.framecommunicator = (function() {

            /*The name of the dataLabel which will store the message token*/
            var messageTokenControlName = "MessageToken";

            function initialize() {
                window.addEventListener("message", _receiveMessage, false);
            }

            function broadcastExecuteRule(strRuleName) {
                _sendExecuteRuleMessage(strRuleName, true, true);
            }

            function broadcastExecuteRuleWithDataLabelValues(strRuleName, dataLabelKeyValueHashtable) {
                _sendExecuteRuleMessage(strRuleName, true, true, dataLabelKeyValueHashtable);
            }

            function bubbleExecuteRule(strRuleName) {
                _sendExecuteRuleMessage(strRuleName, true, false);
            }

            function bubbleExecuteRuleWithDataLabelValues(strRuleName, dataLabelKeyValueHashtable) {
                _sendExecuteRuleMessage(strRuleName, true, false, dataLabelKeyValueHashtable);
            }

            /*Run a rull directly on the form i'm on*/
            function executeFormRuleWithDataLabelValues(strRuleName, dataLabelKeyValueHashtable) {
                var messageid = uuidv4();
                var namespace = "SCPSAPI";

                var messageDTO = {
                    namespace: namespace,
                    bubble: false,
                    tunnel: false,
                    messageid: messageid,
                    commandInfo: {
                        "type": "executeRule",
                        "ruleName": strRuleName,
                        "dataLabelValues": dataLabelKeyValueHashtable
                    }
                };

                _handleExecuteRuleCommand(messageDTO.commandInfo, messageDTO);

            }

            function _sendExecuteRuleMessage(strRuleName, bubble, tunnel, dataLabelKeyValueHashtable) {
                if (typeof(strRuleName) == "undefined" || strRuleName == '') {
                    /*when we set the control to empty, this will fire again*/
                    return;
                }

                var data = {
                    "type": "executeRule",
                    "ruleName": strRuleName,
                    "dataLabelValues": dataLabelKeyValueHashtable
                };
                console.log(data);
                _sendMessage(data, bubble, tunnel);
            }

            function uuidv4() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }

            function _setDataLabelValueById(id, strValue) {
                var control = SourceCode.Forms.Controls.Web.Label._getInstance(id);
                control.SFCLabel('option', "text", strValue);
            }

            function _setDataLabelValueByName(name, strValue) {
                var id = _getDataLabelIdByName(name);
                if (typeof(id) !== "undefined" && id != null) {
                    _setDataLabelValueById(id, strValue);
                }
            }

            function _getDataLabelIdByName(name) {
                var datalabel = $(".SourceCode-Forms-Controls-Web-DataLabel[name='" + name + "']");
                if (datalabel.length == 1) {
                    var id = datalabel.attr("id");
                    if (typeof(id) !== "undefined") {
                        return id;
                    }
                }
                return null;
            }

            /*bubble = go up through iframes*/
            /*tunnel = go down through iframes*/
            function _sendMessage(commandInfo, bubble, tunnel) {
                if (typeof(window.postMessage) != "function") {
                    throw "PostMessage is not supported in this browser";
                }

                bubble = (bubble === true); /*ensure its a bool*/
                tunnel = (tunnel === true); /*ensure its a bool*/

                var namespace = "SCPSAPI";
                var messageid = uuidv4();
                var messageDTO = {
                    namespace: namespace,
                    commandInfo: commandInfo,
                    bubble: bubble,
                    tunnel: tunnel,
                    messageid: messageid
                };

                /*bubble first*/
                if (bubble === true && window.parent != window) {
                    var targetWindow = window.parent;
                    console.log("bubbling");
                    console.log(messageDTO);
                    targetWindow.postMessage(messageDTO, "*");
                }

                /*tunnel after*/
                if (tunnel === true && typeof(window.frames) != "undefined") {
                    messageDTO.bubble = false; /*we can't bubble otherwise an infinite loop*/
                    for (var i = 0; i < window.frames.length; i++) {
                        var targetWindow = window.frames[i];
                        console.log("tunelling");
                        console.log(messageDTO);
                        targetWindow.postMessage(messageDTO, "*");
                    }
                }
            }

            function _setMessageIdDataLabel(messageDTO) {
                /*the messageid is put in a datalabel to make sure it can be used in rule actions*/
                if (typeof(messageDTO.messageid) != "undefined") {
                    console.log("postMessage Recieved - " + messageDTO.messageid);
                    _setDataLabelValueByName(messageTokenControlName, messageDTO.messageid);
                }

            }

            function _receiveMessage(event) {
                var initiatingWindow = event.source;
                if (typeof(event.data) == "object" && event.data.namespace == "SCPSAPI") {
                    var commandInfo = event.data.commandInfo;

                    var messageHandled = false;
                    var messageDTO = event.data;

                    switch (commandInfo.type) {
                        case "executeRule":
                            messageHandled = _handleExecuteRuleCommand(commandInfo, messageDTO);
                            break;
                    }

                    _sendMessage(commandInfo, event.data.bubble, event.data.tunnel);
                }
            }

            function _handleExecuteRuleCommand(commandInfo, messageDTO) {
                var handled = false;

                if (SCPSAPI.rules.formRuleExists(commandInfo.ruleName)) {
                    /*set the messageid datalabel if it exists*/
                    _setMessageIdDataLabel(messageDTO);

                    /*set the any datafield values in this iframe that have been sent with the message*/
                    if (typeof(commandInfo.dataLabelValues) == "object") _setDataLabelValuesFromHash(commandInfo.dataLabelValues);

                    /*execute the rule*/
                    SCPSAPI.rules.executeRuleForForm(commandInfo.ruleName);
                }

                return handled;
            }

            function _setDataLabelValuesFromHash(hash) {
                for (var i in hash) {
                    var key = i;
                    var val = hash[i];
                    _setDataLabelValueByName(key, val, true);
                    console.log(key + ":" + val);
                }
            }

            return {
                initialize: initialize,
                setDataLabelByName: _setDataLabelValueByName,
                executeFormRuleWithDataLabelValues: executeFormRuleWithDataLabelValues,
                bubbleExecuteRule: bubbleExecuteRule,
                bubbleExecuteRuleWithDataLabelValues,
                bubbleExecuteRuleWithDataLabelValues,
                broadcastExecuteRule: broadcastExecuteRule,
                broadcastExecuteRuleWithDataLabelValues: broadcastExecuteRuleWithDataLabelValues
            };
        })();

        SCPSAPI.framecommunicator.initialize();
    }
    

/* #region TOAST */
    /*NOTE: Relies on a control (table?) with the name 'tblInfoToast', tblWarningToast and 'tblErrorToast'*/
    /*NOTE: Same for datalabels, this code relies on a datalabels with the name 'dlInfoToastMessage' etc for the 3 levels*/

    if (typeof(SCPSAPI) == "undefined") SCPSAPI = {};
    SCPSAPI.toast = (function() {

        var _toastItems = {};

        function _ensureContainer() {
            var container = $("body > .scpsapi-toast-container");
            if (container.length == 0) {
                container = $("<div class='scpsapi-toast-container'><div class='scpsapi-toast-container-right'></div></div>");
                $("body").append(container);
            }

            return container;
        }

        function _ensureRightContainer() {
            var container = _ensureContainer();
            var rightContainer = container.find(".scpsapi-toast-container-right");
            return rightContainer;
        }

        function _hideToast(id) {
            console.log(id);

            var toastitem = _toastItems[id];
            var jqToastElement = toastitem.element;
            if (toastitem.timer) clearTimeout(toastitem.timer);

            _animateHide(jqToastElement, $.proxy(function() {
                _toastItems[id].element.remove();
                delete _toastItems[id];
            }, this));
        }

        function _showToast(jqToastElement, autohide) {
            console.log("_showToast");
            autohide = (typeof(autohide) == "undefined" || autohide == true);

            var container = _ensureRightContainer();
            var autoHideDuration = 3000;
            var id = uuidv4();
            var hideFunction = function() {
                _hideToast(id);
            };
            var timer = ((autohide === true) ? setTimeout(hideFunction, autoHideDuration) : null);
            jqToastElement.on("click", hideFunction);

            jqToastElement.attr("id", id);

            var toastitem = {
                id: id,
                element: jqToastElement,
                autohide: autohide,
                timer: timer
            };
            _toastItems[id] = toastitem;

            container.prepend(jqToastElement);

            var inner = jqToastElement.find(".scpsapi-toast-item-inner");
            var innerWidth = inner.outerWidth();
            jqToastElement.css("width", innerWidth);

            _animateShow(jqToastElement);
            console.log("_showToast_end");
        }

        function _animateShow(jqToastElement) {

            var inner = jqToastElement.find(".scpsapi-toast-item-inner");
            var innerHeight = inner.outerHeight();

            jqToastElement.css("transition-duration", "0");
            jqToastElement.css("height", "0px");
            jqToastElement.removeClass("hidden");
            jqToastElement.css("transition-duration", "");
            jqToastElement.css("height", innerHeight);
        }

        function _animateHide(jqToastElement, callback) {

            if (typeof(callback) == "function") {
                var transitionEnd = function() {
                    jqToastElement.off("transitionend", transitionEnd);
                    setTimeout(function() {
                        callback();
                    }, 250);
                };
                jqToastElement.on("transitionend", transitionEnd);
            }
            jqToastElement.addClass("autohide");
        }

        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        function ShowToastFromTemplate(templateControlName) {
            var item = _createToastElementFromNamedControl(templateControlName);
            _showToast(item);
        }

        function ShowPersistentToastFromTemplate(templateControlName) {
            var item = _createToastElementFromNamedControl(templateControlName);
            _showToast(item, false);
        }

        function _createToastElementFromNamedControl(templateControlName) {

            var clone = _createCloneFromName(templateControlName);
            var item = $("<div class='scpsapi-toast-item hidden'><div class='scpsapi-toast-item-inner'></div></div>");
            item.find(".scpsapi-toast-item-inner").append(clone);

            return item;
        }

        function _createCloneFromName(templateControlName) {
            var template = $("[name='" + templateControlName + "']");
            var clone = template.clone();

            /*nuke the name so we don't accidally pull from it*/
            clone.attr("name", clone.attr("name") + "_clone");
            return clone;
        }

        /*DATA LABEL FUNCTIONS*/
        function _setDataLabelValueById(id, strValue) {
            var control = SourceCode.Forms.Controls.Web.Label._getInstance(id);
            control.SFCLabel('option', "text", strValue);
        }

        function _setDataLabelValueByName(name, strValue) {
            var id = _getDataLabelIdByName(name);
            if (typeof(id) !== "undefined") {
                _setDataLabelValueById(id, strValue);
            }
        }

        function _resetDataLabelValueById(id) {
            var control = SourceCode.Forms.Controls.Web.Label._getInstance(id);
            control.SFCLabel('option', "text", "");
        }

        function _resetDataLabelValueByName(name) {
            var id = _getDataLabelIdByName(name);
            if (typeof(id) !== "undefined") {
                _resetDataLabelValueById(id);
            }
        }

        function _getDataLabelIdByName(name) {
            var datalabel = $(".SourceCode-Forms-Controls-Web-DataLabel[name='" + name + "']");
            if (datalabel.length == 1) {
                var id = datalabel.attr("id");
                if (typeof(id) !== "undefined") {
                    return id;
                }
            }
            return null;
        }

        return {
            showToastFromControlName: ShowToastFromTemplate,
            showPersistentToastFromControlName: ShowPersistentToastFromTemplate
        };
    })();


/* #region SELECT ITEM IN LIST */
    $(function() {
        if (typeof(SCPSAPI) == "undefined") SCPSAPI = {};

        SCPSAPI.listview = (function() {

            function selectListViewItemByColumnValue(viewName, columnDisplay, columnValue) {

                var view = $("[name='" + viewName + "']");
                var grid = view.filter(".grid");
                var data = grid.data();
                var columnsInfo = data["ui-grid"].columns;


                if (columnsInfo != null) {

                    var foundColumnInfo = null;
                    var foundColumnIndex = -1;
                    for (var i = 0; i < columnsInfo.length; i++) {

                        var columnInfo = columnsInfo[i];
                        if (columnInfo.display.toLowerCase() == columnDisplay.toLowerCase()) {
                            foundColumnInfo = columnInfo;
                            foundColumnIndex = i;
                            break;
                        }
                    }
                    console.log(foundColumnInfo);
                    if (foundColumnInfo != null) {
                        grid.find(".grid-body-content-wrapper tbody tr").each(function(index) {

                            var itemType;
                            itemType = JSON.parse($(this).find("td").eq(foundColumnIndex).attr("data-options"));

                            if (itemType.value == columnValue) {

                                $(this).addClass("highlighted selected");
                                $(this).click();
                                return false;
                            }
                        });

                    }
                }

            }

            return {
                selectListViewItemByColumnValue: selectListViewItemByColumnValue
            };
        })();
    });
    

/* #region VIEWS IN TABLE CELLS */
    if (typeof(SCPSAPI) == "undefined") SCPSAPI = {};
    if (typeof(SCPSAPI._private) == "undefined") SCPSAPI._private = {};

    SCPSAPI._private.moveControlsToContainer = function(jqControls, jqContainer) {

        jqControls.each(function(index, ele) {

            var jqele = $(ele);
            /*if its a view we don't want to leave its wrappers behind*/
            if (typeof(jqele.attr("data-areaitemid")) != "undefined") {
                jqele = jqele.parents(".view").eq(0);
                jqele.css("margin", "0px"); /*remove form imposed margins*/
            }
            jqContainer.eq(0).append(jqele);
        });
        /*data-areaitemid*/
    };

    function moveViewsAround() {
        var viewsToMove = $("[name*='cell:']");
        viewsToMove.each(function(index, view) {

            var jqview = $(view);
            var viewname = jqview.attr("name");
            var token = "cell:";
            var cellDefinitionPosition = viewname.indexOf(token);

            if (cellDefinitionPosition > -1) {
                var cellName = viewname.substring(cellDefinitionPosition + token.length);
                var nextSpace = cellName.indexOf(" ");
                if (nextSpace > -1) {
                    cellName = cellName.substring(0, nextSpace);
                }
                /*find the cell*/
                var cell = $(`.formcontrol > .innerpanel > .SourceCode-Forms-Controls-Web-Table > .editor-cell[name~='${cellName}']`);
                if (cell.html() == "&nbsp;") {
                    cell.empty();
                }
                SCPSAPI._private.moveControlsToContainer(jqview, cell);
            }
        });
    }

    $(function() {
        moveViewsAround();

    });


/* #region GENERIC ANIMATIONS */
    /*this is called by a dynamicExecute datalabel script on Shared.LeftNav.view*/
    function SCPSAPI$IntroControls() {

        SCPSAPI$IntroItemControls();
        SCPSAPI$IntroGenericControls();
    }

    function SCPSAPI$IntroGenericControls() {
        var animateincontrols = $("[name~='animatein']");

        function controlIntroComplete() {
            $(this).off("transitionend", controlIntroComplete);
            $(this).addClass("complete");
            $(this).css("transition-delay", ""); /*clear transition delay*/
        }

        /*Make groups based on location*/
        var locationGroups = SCPSAPI$_getVerticalControlGroups(animateincontrols);

        var delay = 500;
        setTimeout(function() {
            var increment = 250;
            locationGroups.forEach((group, index) => {
                var controls = group.elements;
                controls.css("transition-delay", (index * increment) + "ms");
                controls.on("transitionend", controlIntroComplete);
                controls.addClass("show");
            });
        }, delay);
    }

    function SCPSAPI$IntroItemControls() {
        var animateincontrols = $("[name~='animateinitems']");

        function optionIntroComplete() {
            $(this).off("transitionend", optionIntroComplete);
            $(this).addClass("complete");
        }

        setTimeout(function() {
            animateincontrols.find(".option").on("transitionend", optionIntroComplete);
            animateincontrols.addClass("show");
        }, 500);
    }

    function SCPSAPI$_getVerticalControlGroups(jqControls) {
        var locationGroups = [];
        jqControls.each(function() {
            var control = $(this);
            var position = control.offset();
            var group = SCPSAPI$_getVerticalLocationGroupForPosition(position, null, locationGroups);

            if (locationGroups.length == 0 || typeof(group) == "undefined") {
                console.log("addingGroup");
                group = {
                    positions: [],
                    elements: $()
                };
                locationGroups.push(group);
            }
            group.elements = group.elements.add(control);
            group.positions.push(position);
        });
        return locationGroups;
    }

    function SCPSAPI$_getVerticalLocationGroupForPosition(position, dimensions, locationGroups) {
        var group = locationGroups.find(group => {
            var lowestTop = 30000;
            var highestTop = 0;
            group.positions.forEach(position => {
                lowestTop = Math.min(position.top, lowestTop);
                highestTop = Math.max(position.top, highestTop);
            });
            console.log("highest:" + highestTop + ", lowest:" + lowestTop);
            var tolerance = 10; /*pixels*/
            tolerance = tolerance - (highestTop - lowestTop);
            return (position.top < highestTop + tolerance) && (position.top > lowestTop - tolerance);
        });

        return group; /*will be null if nothing found*/
    }

    /*Move the loading view into the main view.*/
    $(function() {
        $("body").on("scpsapi.formshowing", function() {
            SCPSAPI$IntroControls();
        });
    });
    

/* #region DOCKING */
    $(function() {
        /*get a named control from this window, and float it to the bottom*/
        SCPSAPI$DockControls();
    });

    function SCPSAPI$DockControls$_ensureFooter(formElement) {
        var jqElement = formElement.find("> .scpsapi-footer");
        if (jqElement.length == 0) {
            jqElement = $("<div class='scpsapi-footer'></div>");
            formElement.append(jqElement);
        }
        return jqElement;
    }

    function SCPSAPI$DockControls$_ensureHeader(formElement) {
        var jqElement = formElement.find("> .scpsapi-header");
        if (jqElement.length == 0) {
            jqElement = $("<div class='scpsapi-header'></div>");
            formElement.append(jqElement);
        }
        return jqElement;
    }

    function SCPSAPI$DockControls() {

        var footerControlsToMove = $("[name~='dockbottom']");
        var headerControlsToMove = $("[name~='docktop']");

        if (headerControlsToMove.length > 0 || footerControlsToMove.length > 0) {

            var root = $("html");
            root.addClass("scpsapi-full-height-form");


            /*Add class to outer element which will make the css kick in*/
            var formElement = $(".runtime-content");
            formElement.addClass("scpsapi-form-with-docked-controls");


            /*find the content element*/
            var innerContentView = $(".runtime-view");
            var innerContentForm = $(".runtime-form");
            var innerContentElement = innerContentView.length == 1 ? innerContentView : innerContentForm;

            if (headerControlsToMove.length > 0) {
                var headerElement = SCPSAPI$DockControls$_ensureHeader(formElement);
                SCPSAPI._private.moveControlsToContainer(headerControlsToMove, headerElement);
                innerContentElement.css("padding-top", headerElement.outerHeight());
            }

            if (footerControlsToMove.length > 0) {
                var footerElement = SCPSAPI$DockControls$_ensureFooter(formElement);
                SCPSAPI._private.moveControlsToContainer(footerControlsToMove, footerElement);
                innerContentElement.css("padding-bottom", footerElement.outerHeight());
            }
        }
    }


/* #region LOOP PERCENTAGE */
    function SCPSAPI$LoopPercentage$Initialize() {
        var jqDataLabels = $("[name~='animatedpie']:visible");
        SCPSAPI$LoopPercentage$_initialize(jqDataLabels);
        var jqDataLabelsInvisible = $("[name~='animatedpie']:not(:visible)");
        jqDataLabelsInvisible.addClass("scpsapi-looppercentage-delayed-show");
    }

    function SCPSAPI$LoopPercentage$_initialize(jqDataLabels) {
        var _TEMPLATE = "\
        <div class='scpsapi-looppercentage PART_container'> \
            <div class='middle-text PART_textcontainer'><span class='PART_amount'></span>%</div> \
            <div class='point'> \
                <svg class='round2 loop PART_loop' viewbox='0 0 100 100' width='100' height='100'>\
                    <circle cx='50' cy='50' r='40' />\
                </svg> \
            </div>\
            <div class='point'>\
                <svg class='round loop PART_loop' viewbox='0 0 100 100' width='100' height='100'>\
                    <circle cx='50' cy='50' r='40' />\
                </svg>\
            </div>\
        </div>\
        ";

        function refreshDOM(jqElement) {
            var width = jqElement.width();
        }

        function createScrollingItems(container, start, count, height) {

            var _TEMPLATE = "<div class='scpsapi-scrolling-text-container'></div>";
            var _ITEMTEMPLATE = "<div class='scpsapi-scrolling-text-item'><span class='PART_text'></span>%</div>";
            var scrollingItemsContainer = $(_TEMPLATE);

            var orginalText = container.text();
            container.empty();

            container.css({
                "height": height,
                "overflow-y": "hidden"
            });

            for (var i = start; i <= (start + count); i++) {

                var jqItem = $(_ITEMTEMPLATE);
                scrollingItemsContainer.append(jqItem);
                jqItem.find(".PART_text").text(i);
            }

            container.append(scrollingItemsContainer);
            return scrollingItemsContainer;
        }

        jqDataLabels.each(function() {
            var jqDataLabel = $(this);
            var amount = parseInt(jqDataLabel.text());

            /*measure the label*/
            var fakeLabel = jqDataLabel.clone();
            fakeLabel.css("display", jqDataLabel.css("display"));
            fakeLabel.css("opacity", 0);
            fakeLabel.addClass("scpsapi-measureitem");
            $("body").append(fakeLabel);
            fakeLabel.empty();
            var measureItem = $("<span style='font-size:inherit;'>Hello</span>");
            fakeLabel.append(measureItem);
            refreshDOM(fakeLabel);
            var width = fakeLabel.width();
            var height = fakeLabel.height();
            width = Math.max(width, 50);
            fakeLabel.remove();

            /*clear the inner structure of the control*/
            jqDataLabel.empty();

            /*Create the pie*/
            var pieThingy = $(_TEMPLATE);
            pieThingy.find('.PART_loop').attr("width", width).attr("height", width);
            var container = pieThingy.find('.PART_container').addBack('.PART_container');
            container.css({
                width: width,
                height: width
            });

            jqDataLabel.append(pieThingy);
            jqDataLabel.find(".PART_amount").text(amount);
            var textContainer = pieThingy.find(".PART_textcontainer");
            var $scrollingText = (amount > 3) ? createScrollingItems(textContainer, amount - 3, 3, height) : $();

            /*setup the percentage to 0 ready for animation*/
            var $round = jqDataLabel.find('.round');
            $round.css('stroke-dasharray', "0 999");

            refreshDOM($round);

            var roundRadius = $round.find('circle').attr('r');
            var roundPercent = amount;
            var roundCircum = 2 * roundRadius * Math.PI;
            var roundDraw = roundPercent * roundCircum / 100;

            /*start animations triggered by css*/
            jqDataLabel.addClass("show");
            $round.css('stroke-dasharray', roundDraw + ' 999');
            $scrollingText.addClass("show");
        });
    }

    function SCPSAPI$LoopPercentage$ShowDelayed() {
        setTimeout(function() {
            var jqDataLabels = $(".scpsapi-looppercentage-delayed-show");
            SCPSAPI$LoopPercentage$_initialize(jqDataLabels);
        }, 100);
    }

    $(function() {
        $("body").on("scpsapi.formshowing", function() {
            SCPSAPI$LoopPercentage$Initialize();
        });
    });


/* #region HEADER VIEW */
    $(function() {
        var views = $("[name~='headingview']");
        $(".runtime-content").prepend(views);
    });


/* #region SVG ICON */
    function SCPSAPI$_addIconToCheckBox(jqPicture, jqCheckbox) {
        var imageUrl = jqPicture.attr("src");

        if (!!imageUrl && imageUrl != '') {
            $.ajax({
                url: imageUrl,
                success: function(data) {
                    if (!!data.documentElement) {
                        var svgContent = $(data.documentElement);
                        SCPSAPI$_copyDimensions(jqPicture, svgContent);
                        jqCheckbox.prepend(svgContent);
                        jqCheckbox.addClass("scpsapi-checkbox icon-container");
                        jqCheckbox.parent().addClass("scpsapi-checkbox-outer")
                    }
                }
            });

        }
    }

    function SCPSAPI$_copyDimensions(jqSource, jqTarget) {
        var rawSource = jqSource.get(0);
        var height = rawSource.style.height;
        if (!height) height = jqSource.height();

        var width = rawSource.style.width;
        if (!width) width = jqSource.width();

        jqTarget.css("width", width);
        jqTarget.css("height", height);
    }

    function SCPSAPI$CheckBoxSVGIcons() {

        var token = "icon:";
        var checkboxes = $(".checkbox[title*='" + token + "']");
        console.log(checkboxes);

        checkboxes.each(function(index, ele) {
            var jqCheckboxLabel = $(ele);
            var title = jqCheckboxLabel.attr("title");

            /*get icon value.*/
            var pos = title.indexOf(token);
            var endpos = title.indexOf(" ", (pos + token.length));
            var iconName = title.substring(pos + token.length, (endpos == -1 ? title.length : endpos));

            console.log(iconName);

            if (!!iconName && iconName != '') {

                var iconElementsByName = $("[name~='" + iconName + "'], img[alt~='name:" + iconName + "']");

                if (iconElementsByName.length == 1) {
                    pictureElement = iconElementsByName.eq(0);

                    SCPSAPI$_addIconToCheckBox(pictureElement, jqCheckboxLabel);
                    jqCheckboxLabel.attr("title", title.replace(token + iconName, ""));
                }
            }
        });

    }

    function SCPSAPI$WrapSVGIcons() {
        var pictures = $("img[alt~='svgicon'], img[alt~='svgiconbutton']");
        var wrapwith = $("<div class='scpsapi-svg-icon'></div>");
        pictures.wrap(wrapwith);

        function transferLayoutProperties(jqSource, jqTarget) {
            var rawSource = jqSource.get(0);

            jqTarget.css("margin", jqSource.css("margin"));
            jqTarget.css("padding", jqSource.css("padding"));
            jqSource.css("padding", "");
            jqSource.css("margin", "");
        }

        pictures.each(function(index, ele) {
            var jqele = $(this);
            var imageUrl = jqele.attr("src");
            var parent = jqele.parent();

            if (jqele.is("[alt~='svgiconbutton']")) parent.addClass("icon-container");

            /*remove the alt text that was just there to instigate this behavior*/
            jqele.attr("alt", jqele.attr("alt").replace("svgicon", ""));
            jqele.attr("alt", jqele.attr("alt").replace("svgiconbutton", ""));

            /*move the Name to the wrapping element*/
            var name = "";
            var nameattr = jqele.attr("name");
            if (typeof(nameattr) != "undefined") name += nameattr;
            name += " " + jqele.attr("alt");

            parent.attr("name", name);
            jqele.attr("name", "");
            jqele.attr("alt", "");

            $.ajax({
                url: imageUrl,
                success: function(data) {
                    if (!!data.documentElement) {
                        var svgContent = $(data.documentElement);
                        parent.prepend(svgContent);

                        transferLayoutProperties(jqele, parent);
                        SCPSAPI$_copyDimensions(jqele, svgContent);
                        SCPSAPI$_copyDimensions(jqele, parent);
                    }
                }
            });

        });
    }

    $(function() {
        SCPSAPI$WrapSVGIcons();
        SCPSAPI$CheckBoxSVGIcons();
    });


/* #region POPOVERS */
    /*SCAPSAPI Hook for Popovers*/
    if (typeof(SCPSAPI) == "undefined") SCPSAPI = {};
    SCPSAPI.popovers = (function() {

        __scpsapi_popupcache = {};
        __STANDARD_WIDTH = 300;
        __STANDARD_HEIGHT = 350;
        __messageRecieverAdded = false;
        __currentPopup = null;

        function _showViewInstanceTargetedPopover(targetControlName, viewInstanceName, height, width, popupLocation) {
            _ensureMessageReciever();
            if (!width) width = __STANDARD_WIDTH;
            if (!height) height = __STANDARD_HEIGHT;
            if (!popupLocation) popupLocation = PopupPosition.BottomMiddle;

            var cacheId = targetControlName + "_viewInstance_" + viewInstanceName;
            var cachedPopup = __scpsapi_popupcache[cacheId];
            if (!!cachedPopup) {
                cachedPopup.ShowTargeted();
                __currentPopup = cachedPopup;
                return cachedPopup;
            }

            var jqTargetControl = $("[name='" + targetControlName + "']");
            var jqContentElement = $("[name='" + viewInstanceName + "']");

            if (jqTargetControl.length == 0) {
                console.warn("SCPSAPI Popover - couldn't find target with name '" + targetControlName + "'");
                return;
            }
            if (jqContentElement.length == 0) {
                console.warn("SCPSAPI Popover - couldn't find target with name '" + viewInstanceName + "'");
                return;
            }

            jqContentElement.css({
                width: width,
                height: height
            });

            /*show the popup.*/
            var _popup = PopupHelper.ShowTargetedPopup(jqContentElement, jqTargetControl, popupLocation, null, "scpsapi-popover", 10);
            __scpsapi_popupcache[cacheId] = _popup;
            __currentPopup = _popup;
        }

        /* Load View by URL {contactID: "asdkasksad", sadjasd: ""} */
        function _showViewTargetedPopover(targetControlName, viewname, parameters, height, width, popupLocation) {
            if (!parameters || typeof(parameters) != "object") parameters = {};

            var url = SourceCode.Forms.Settings.ApplicationRoot + "/Runtime/View/" + viewname + "/?";

            /*add Theme*/
            var currentTheme = $("#CurrentTheme").val();
            if (!!currentTheme) parameters["_theme"] = currentTheme;

            /*add Parameters*/
            url = url + $.param(parameters);

            var _popup = _showTargetedPopover(targetControlName, url, height, width, popupLocation);
            return _popup;

            /*note: iframes will reload when moved around the DOM (between popup loads)*/
        }

        /* Load URL Popover */
        function _showTargetedPopover(targetControlName, url, height, width, popupLocation) {
            _ensureMessageReciever();

            var cacheId = targetControlName + "_" + url;
            var cachedPopup = __scpsapi_popupcache[cacheId];
            if (!!cachedPopup) {
                cachedPopup.ShowTargeted();
                __currentPopup = cachedPopup;
                return cachedPopup;
            }

            if (!width) width = __STANDARD_WIDTH;
            if (!height) height = __STANDARD_HEIGHT;
            if (!popupLocation) popupLocation = PopupPosition.BottomMiddle;

            var jqTargetControl = $("[name='" + targetControlName + "']");


            if (jqTargetControl.length != 1) {
                console.log("SCPSAPI TARGETED POPOVER - found too many elements for name ''" + targetControlName + "'");
                return;
            }

            var TEMPLATE = "\
                <div class='scpsapi-popover-content'>\
                    <div class='PART_LoadingScreen scpsapi-popover--loading-screen'>\
                        <div class='scpsapi-popover--loadingicon ajaxLoader'></div>\
                        <div class='PART_LoadingMessage'>Loading</div>\
                    </div>\
                    <iframe class='PART_IFrame scpsapi-popover--iframe'></iframe>\
                </div>\
            ";

            var jqContentElement = $(TEMPLATE);
            var jqIframe = jqContentElement.find(".PART_IFrame");
            var jqLoadingScreen = jqContentElement.find(".PART_LoadingScreen");
            var jqLoadingText = jqContentElement.find(".PART_LoadingMessage");

            jqLoadingText.text(Resources.CommonPhrases.LoadingText.replace(" ...", ""));

            var onloadfn = function() {
                /* when the popup is cached, the iframe is hidden on the page at the bottom of the DOM whih causes a reload */
                if (!jqIframe.is(":visible")) return;
                var rawframe = jqIframe[0];

                var canAccessWindow = false;

                try {
                    /*test to see if we have cross site access to the page*/
                    var testdoc = rawframe.contentWindow.document;
                    canAccessWindow = true;
                } catch (ex) {
                    console.log("SCPSAPI TARGETTED POPOVER - could not remove background")
                }

                if (canAccessWindow) {
                    var doc = $(rawframe.contentWindow.document);
                    /* if we do then modify/read from the page */
                    var bgcolor = doc.find("body").css("background-color");
                    var popupelement = jqContentElement.parents(".popup");
                    popupelement[0].style.setProperty("--targeted-arrow-color", bgcolor);
                    _addSCPSAPIToIframe(rawframe.contentWindow);
                }

                jqIframe.addClass("show");
                jqLoadingScreen.addClass("hide");
            };

            jqIframe.on("load", onloadfn);
            jqIframe.attr("src", url);
            jqContentElement.css({
                width: width,
                height: height
            });

            /*show the popup.*/
            var _popup = PopupHelper.ShowTargetedPopup(jqContentElement, jqTargetControl, popupLocation, null, "scpsapi-popover", 10);
            __scpsapi_popupcache[cacheId] = _popup;
            __currentPopup = _popup;

            _popup.addEventListener("Closed", function() {
                jqIframe.removeClass("show");
                jqLoadingScreen.removeClass("hide");
            });

            return _popup;
        }

        function _ensureMessageReciever() {
            if (!__messageRecieverAdded) {
                window.addEventListener("message", _recieveMessage);
            }
        }

        function _recieveMessage(ev) {
            if (!!ev.data && !!ev.data.scpsapi && !!ev.data.method && ev.data.method == "closePopup") {
                if (!!__currentPopup) {
                    __currentPopup.Close();
                }
            }
        }

        function _closePopover() {
            window.parent.postMessage({
                scpsapi: true,
                method: "closePopup"
            }, "*");
        }

        function _addSCPSAPIToIframe(windowRef) {
            if (!windowRef.SCPSAPI) windowRef.SCPSAPI = {};
            if (!windowRef.SCPSAPI.popovers) {
                windowRef.SCPSAPI.popovers = {
                    closePopover: function() {
                        _closePopover();
                    }
                };
            }
        }

        return {
            showTargetedPopover: _showTargetedPopover,
            showViewTargetedPopover: _showViewTargetedPopover,
            showViewInstanceTargetedPopover: _showViewInstanceTargetedPopover,
            closePopover: _closePopover
        };
    })();



    /*#region PopupHelper*/
    class PopupHelper {
        /*Returns: jQuery Popupwindow (legacy widget)*/
        /*Param: element - the popup element*/
        /*Param: targetElement - the control that the popup should be positioned relative to.*/
        /*Param: desiredPopupPosition - a PopupPosition (enum), describing where the popup should be relative to the target.*/
        /*                              this will be honored if it can fit in the viewport, otherwise other locations will*/
        /*                              be intelligently chosen.*/
        /*Param: offsets - pixel offsets {top: 0, left:3, bottom: 0, right: 15}, these will be applied ontop of the desired position*/
        static ShowTargetedPopup(element, targetElement, desiredPopupPosition, offsets, cssClass, viewportEdgeDistance) {
            var popupInstance = new _Popup(element, targetElement, desiredPopupPosition, offsets, cssClass, viewportEdgeDistance);
            popupInstance.ShowTargeted();

            return popupInstance;
        }

        static ShowModalDialog(element) {
            throw "NotImplementedException";
        }

    }

    /*internal class*/
    class _Popup extends EventTarget {
        /*#region Properties*/
        get Element() {
            return this._element;
        }

        get Offsets() {
            return {
                horizontal: this._offsetHorizontal,
                vertical: this._offsetVertical
            }
        }
        /*#endregion Properties*/

        /*#region Fields*/
        _element;
        _anchorElement;
        _popup; /*a jquery popupwindow widget reference.*/
        popupId; /*unique id from popupmanager, used for uniquely identifying events on document.*/
        _targetedWrapper; /*a wrapper that adds the arrows pointing to the anchor control/element.*/
        _measuredDimensions; /*result of measuring is cached for speed of opening the popup the 2nd time.*/
        _cssClass;
        _currentDesiredPopupPosition = PopupPosition.LeftMiddle;
        _currentPopupPosition = PopupPosition.LeftMiddle;
        _offsetHorizontal = 0;
        _offsetVertical = 0;
        _viewportEdgeDistance = 0;
        _arrowDimensions = {
            width: 30,
            height: 15
        };
        _arrowRight;
        _arrowLeft;
        _arrowTop;
        _arrowBottom;
        /*#endregion Fields*/

        /*#region Constructor*/
        constructor(element, anchorElement, desiredPopupPosition, offsets, cssClass, viewportEdgeDistance) {
            super();
            this._element = element;
            this._anchorElement = anchorElement;
            this._cssClass = cssClass;
            this._currentDesiredPopupPosition = desiredPopupPosition;
            this._currentPopupPosition = desiredPopupPosition;
            if (!!viewportEdgeDistance) this._viewportEdgeDistance = viewportEdgeDistance;

            if (!!offsets) {
                if (!!offsets.horizontal) this._offsetHorizontal = offsets.horizontal;
                if (!!offsets.vertical) this._offsetVertical = offsets.vertical;
            }
            this._clickOnDocument = this._clickOnDocument.bind(this);
            this._clickOnPopup = function(ev) {
                ev.originalEvent._fromPopup = true;
            }.bind(this);

        }
        /*#endregion Constructor*/

        /*#region Methods*/
        ShowTargeted(anchorElement, desiredPopupPosition) {
            $(document).unbind('click.' + this._popupId, this._clickOnDocument);
            this._element.unbind('click.' + this._popupId, this._clickOnPopup);

            if (!!desiredPopupPosition) {
                this._currentDesiredPopupPosition = desiredPopupPosition;
                this._currentPopupPosition = desiredPopupPosition;
            }
            if (!!anchorElement) this._anchorElement = anchorElement;

            var hasPreservedContent = (!!this._popup && this._popup.parent().length == 0);

            if (hasPreservedContent) {
                this._showTargeted();
            } else {
                if (!this._popup) {
                    this._showTargeted();
                } else {
                    /*just reposition it, its already open*/
                    this._setTargetedPopupPosition();
                    if (!this._popup.popupwindow("isOpen")) {
                        this._popup.popupwindow("show");
                    }
                }
            }
            this._element.bind('click.' + this._popupId, this._clickOnPopup);

            setTimeout($.proxy(function() {
                $(document).bind('click.' + this._popupId, this._clickOnDocument);
            }, this), 200);
            /*make sure this document click is only registered after the click to open the targeted popup has completed.*/
        }

        Close() {
            this._closePopup();
        }
        /*#endregion Methods*/

        /*#region Private Methods*/
        _TARGETTED_TEMPLATE = "\
        <div class='lyt-popup-targeted'>\
            <div class='content'><div class='PART_Content popup-targeted-content'></div></div>\
            <div class='PART_Top top arrow-container'><div class='PART_Arrow popup-targeted-arrow'></div></div>\
            <div class='PART_Bottom bottom arrow-container'><div class='PART_Arrow popup-targeted-arrow'></div></div>\
            <div class='PART_Left left arrow-container'><div class='PART_Arrow popup-targeted-arrow'></div></div>\
            <div class='PART_Right right arrow-container'><div class='PART_Arrow popup-targeted-arrow'></div></div>\
        </div>\
        ";

        /*must be downward pointing arrow, as we use rotated for other sides.*/
        _TARGETTED_ARROW_TEMPLATE = "\
        <svg xmlns='http:/*www.w3.org/2000/svg' viewBox='0 0 30 15'>\
            <polygon points='0 0 15 15 30 0 0 0' style='fill:transparent'/>\
        </svg>\
        ";

        _ensureTargetedWrapper() {
            if (!!this._targetedWrapper) return this._targetedWrapper;

            this._targetedWrapper = $(this._TARGETTED_TEMPLATE);
            var element = this._targetedWrapper;
            var allarrows = element.find(".PART_Arrow");
            allarrows.append($(this._TARGETTED_ARROW_TEMPLATE));
            allarrows.find("polygon").css("fill", "#f8f8f8");

            /*Get arrows*/
            this._arrowRight = element.find(".PART_Right .PART_Arrow");
            this._arrowLeft = element.find(".PART_Left .PART_Arrow");
            this._arrowTop = element.find(".PART_Top .PART_Arrow");
            this._arrowBottom = element.find(".PART_Bottom .PART_Arrow");

            /*Apply content of popup*/
            var content = element.find(".PART_Content");
            content.append(this._element);
            content.addClass(this._cssClass);

            return this._targetedWrapper;
        }

        _getScrollPosition(element) {
            var top = 0;
            var left = 0;

            while (!!element) {
                if (element.scrollHeight > element.clientHeight) {
                    top += element.scrollTop;
                }

                if (element.scrollWidth > element.clientWidth) {

                    left += element.scrollLeft;
                }

                element = element.parentNode;
            }

            return {
                top: top,
                left: left,
            }
        }

        _showTargeted() {
            this._element.css("display", ""); /*when preservingContent, the element is given display:none and attached to the body.*/

            /*get target position info to be used by a few of the following calculations*/
            var targetDimensions = {
                width: this._anchorElement.outerWidth(),
                height: this._anchorElement.outerHeight()

            };

            var targetPosition = this._getAnchorPosition();
            /*creates #targetedWrapper by wrapping the content in html needed for arrows to show.*/
            this._ensureTargetedWrapper();

            /*get the dimensions of the element surrounded by the targetted popup*/
            this._getElementDimensionsAsPopup(this._targetedWrapper, "popup-targeted");
            var positionInfo = this._getPosition(this._measuredDimensions, targetDimensions, targetPosition, this._currentDesiredPopupPosition, this.Offsets, this._arrowDimensions);
            var position = {
                left: positionInfo.left,
                top: positionInfo.top
            };

            this._currentPopupPosition = positionInfo.popupPosition;
            var dimensions = this._measuredDimensions;
            this._setArrowPosition(position, dimensions, targetDimensions, targetPosition);
            var cssClass = "popup-targeted";
            cssClass += " " + this._getPopupClassForPopupPosition(this._currentPopupPosition);

            this._popup = popupManager.showPopup({
                centered: false,
                content: this._targetedWrapper,
                draggable: false,
                modal: false,
                removeContent: false,
                showContentOnly: true,
                removeContentOnClose: false,
                preserveContent: true,
                cssClass: cssClass,
                width: dimensions.width,
                height: dimensions.height
            });

            /* Remove dialog behaviour (Technical Debt to be addressed)*/
            this._popup.removeClass("dialog").css("box-sizing", "border-box");
            /*this._popup.popupwindow("resize", dimensions.width, dimensions.height);*/

            this._popup.css(position);

            this._popupId = this._popup.attr("id");
        }

        /*arrow should always point at the target*/
        _setArrowPosition(popupPosition, popupDimensions, targetDimensions, targetPosition) {
            var arrow = this._getArrowElement(this._currentPopupPosition);

            switch (this._currentPopupPosition) {
                case PopupPosition.LeftLeftTop:
                case PopupPosition.LeftMiddle:
                case PopupPosition.LeftLeftBottom:
                case PopupPosition.RightRightTop:
                case PopupPosition.RightMiddle:
                case PopupPosition.RightRightBottom:
                    var targetTop = targetPosition.top + (targetDimensions.height / 2);
                    var arrowTop = targetTop - popupPosition.top;
                    arrow.css("top", arrowTop);
                    break;
                case PopupPosition.TopTopLeft:
                case PopupPosition.TopMiddle:
                case PopupPosition.TopTopRight:
                case PopupPosition.BottomBottomLeft:
                case PopupPosition.BottomMiddle:
                case PopupPosition.BottomBottomRight:
                    var targetLeft = targetPosition.left + (targetDimensions.width / 2);
                    var arrowLeft = targetLeft - popupPosition.left;
                    arrow.css("left", arrowLeft);
                    break;

            }
        }

        /*applying this class to the popup-targeted element will show the arrow on the correct side of the popup.*/
        /*it will then need to be positioned within its container.*/
        _getPopupClassForPopupPosition(popupPosition) {
            var cssClass = '';

            switch (popupPosition) {
                case PopupPosition.LeftLeftTop:
                case PopupPosition.LeftMiddle:
                case PopupPosition.LeftLeftBottom:
                    cssClass = "targetright";
                    break;
                case PopupPosition.RightRightTop:
                case PopupPosition.RightMiddle:
                case PopupPosition.RightRightBottom:
                    cssClass = "targetleft";
                    break;
                case PopupPosition.TopTopLeft:
                case PopupPosition.TopMiddle:
                case PopupPosition.TopTopRight:
                    cssClass = "targetbottom";
                    break;
                case PopupPosition.BottomBottomLeft:
                case PopupPosition.BottomMiddle:
                case PopupPosition.BottomBottomRight:
                    cssClass = "targettop";
                    break;
            }

            return cssClass;
        }

        _getArrowElement(popupPosition) {
            var arrow = $();

            switch (popupPosition) {
                case PopupPosition.LeftLeftTop:
                case PopupPosition.LeftMiddle:
                case PopupPosition.LeftLeftBottom:
                    return this._arrowRight;
                    break;
                case PopupPosition.RightRightTop:
                case PopupPosition.RightMiddle:
                case PopupPosition.RightRightBottom:
                    return this._arrowLeft;
                    break;
                case PopupPosition.TopTopLeft:
                case PopupPosition.TopMiddle:
                case PopupPosition.TopTopRight:
                    return this._arrowBottom;
                    break;
                case PopupPosition.BottomBottomLeft:
                case PopupPosition.BottomMiddle:
                case PopupPosition.BottomBottomRight:
                    return this._arrowTop;
                    break;
            }

            return arrow;
        }

        _clickOnDocument(ev) {

            /*only close if the event hasn't come from the popup */
            if (!(!!ev.originalEvent && ev.originalEvent._fromPopup == true)) {
                this._closePopup(); /*always close the popup*/
            }
        }

        _closePopup() {
            this._popup.popupwindow("close");


            $(document).unbind('click.' + this._popupId, this._clickOnDocument);
            this._element.unbind('click.' + this._popupId, this._clickOnPopup);

            /*the popup is removed by the popupmanager, so isn't a valid popupwindow() widget anymore anyway.*/
            /*this._popup = null;*/
            this.dispatchEvent(new Event("Closed"));
        }

        _getAnchorPosition() {

            var targetPosition = this._anchorElement.offset();

            /*var additionScrollPosition = this._getScrollPosition(this._anchorElement.parent()[0]); */
            /*targetPosition.top += additionScrollPosition.top;*/
            /*targetPosition.left += additionScrollPosition.left;*/

            return targetPosition;
        }

        _setTargetedPopupPosition() {
            var targetDimensions = {
                width: this._anchorElement.outerWidth(),
                height: this._anchorElement.outerHeight()
            };
            var targetPosition = this._getAnchorPosition();

            var position = this._getPosition(this._measuredDimensions, targetDimensions, targetPosition, this._currentPopupPosition, this.Offsets, this._arrowDimensions);
            this._setArrowPosition(position, this._measuredDimensions, targetDimensions, targetPosition);
            this._popup.removeClass("targettop targetleft targetright targettop");
            this._popup.addClass(this._getPopupClassForPopupPosition(this._currentPopupPosition));

            this._popup.css(position);
        }

        /*this is an expensive operation (time) so we want to run it as few times as possible*/
        _getElementDimensionsAsPopup(element, cssClass) {
            if (!!this._measuredDimensions) return this._measuredDimensions;

            var measuringElements = this._getPopupMeasuringElement(element, cssClass);
            this._measuredDimensions = {
                width: measuringElements.element.outerWidth(),
                height: measuringElements.element.outerHeight()
            };

            measuringElements.wrapper.remove();

            return this._measuredDimensions;
        }

        /*this is an expensive operation (time) so we want to run it as few times as possible*/
        _getPopupMeasuringElement(element, cssClass) {
            var MEASURETEMPLATE = "\
            <div style='opacity: 0; pointer-events:none; position: absolute; top:0px; left:0px; width:1px; overflow:hidden;'>\
                <div style='position:absolute; left:0px; top:0px' class='PART_Inner " + cssClass + "'></div>\
            </div>\
            ";

            var measuringWrapper = $(MEASURETEMPLATE);
            var inner = measuringWrapper.find(".PART_Inner");
            var clone = element.clone(false);
            clone.find("iframe").attr("src", "");
            inner.append(clone);
            $("body").append(measuringWrapper);

            var bob = inner.width(); /*force DOM*/

            var measuringElements = {
                wrapper: measuringWrapper,
                element: inner
            };

            return measuringElements;
        }

        /*returns the position, does not apply it to the element.*/
        /*Param: Arrow Dimensions*/
        _getPosition(elementDimensions, targetDimensions, targetPosition, popupPosition, offsets, arrowDimensions) {

            /*basic clamping to viewport*/
            /*TODO: Make try other PopupPositions in an intelligent order.*/
            var $window = (document.documentElement.scrollTop > 0) ? $(document) : $(window);
            var viewportDimensions = {
                height: $window.height(),
                width: $window.width()
            };

            /*try the desired position.*/
            var result = this._tryPosition(elementDimensions, targetDimensions, targetPosition, popupPosition, offsets, arrowDimensions, viewportDimensions);

            if (result.fits == false) {

                var plan = [];

                switch (popupPosition) {
                    case PopupPosition.TopMiddle:
                        plan = [PopupPosition.BottomMiddle];
                        break;
                    case PopupPosition.BottomMiddle:
                        plan = [PopupPosition.TopMiddle];
                        break;

                    case PopupPosition.LeftMiddle:
                        plan = [PopupPosition.RightMiddle];
                        break;
                    case PopupPosition.RightMiddle:
                        plan = [PopupPosition.LeftMiddle];
                        break;
                }

                var planresult = result;
                for (var index = 0; index < plan.length; index++) {
                    var positionToTry = plan[index];
                    planresult = this._tryPosition(elementDimensions, targetDimensions, targetPosition, positionToTry, offsets, arrowDimensions, viewportDimensions);
                    if (planresult.fits == true) break;
                }

                if (planresult.fits == true) result = planresult;
            }


            if ((result.top + result.height) >= viewportDimensions.height) {
                result.top = viewportDimensions.height - result.height - this._viewportEdgeDistance;
            }

            if (result.top <= 0) result.top = this._viewportEdgeDistance;

            if ((result.left + result.width) >= viewportDimensions.width) {
                result.left = viewportDimensions.width - result.width - this._viewportEdgeDistance;
            }

            if (result.left <= 0) result.left = this._viewportEdgeDistance;

            return result;
        }

        _tryPosition(elementDimensions, targetDimensions, targetPosition, popupPosition, offsets, arrowDimensions, viewportDimensions) {

            if (!arrowDimensions) arrowDimensions = {
                width: 0,
                height: 0
            };
            var additionalSizeFromArrow = {
                width: 0,
                height: 0
            };

            var result = {
                fits: true,
                fitsHorizontal: true,
                fitsVertical: true,
            };

            var canMoveHorizontal = false;
            var canMoveVertical = false;

            switch (popupPosition) {
                case PopupPosition.TopLeft:
                    break;
                case PopupPosition.TopTopLeft:
                    break;
                case PopupPosition.TopMiddle:
                    result.top = targetPosition.top - elementDimensions.height - arrowDimensions.height;
                    result.left = (targetPosition.left + targetDimensions.width / 2) - (elementDimensions.width / 2);
                    additionalSizeFromArrow.height = arrowDimensions.height;
                    canMoveHorizontal = true;
                    break;
                case PopupPosition.TopTopRight:
                    break;
                case PopupPosition.TopRight:
                    break;
                case PopupPosition.BottomLeft:
                    break;
                case PopupPosition.BottomTopLeft:
                    break;
                case PopupPosition.BottomMiddle:
                    result.top = targetPosition.top + targetDimensions.height;
                    result.left = (targetPosition.left + targetDimensions.width / 2) - (elementDimensions.width / 2);
                    additionalSizeFromArrow.height = arrowDimensions.height;
                    canMoveHorizontal = true;
                    break;
                case PopupPosition.BottomBottomRight:
                    break;
                case PopupPosition.BottomRight:
                    break;
                case PopupPosition.LeftLeftTop:
                    break;
                case PopupPosition.LeftMiddle:
                    result.top = targetPosition.top + (targetDimensions.height / 2) - (elementDimensions.height / 2);
                    result.left = targetPosition.left - elementDimensions.width - arrowDimensions.height;
                    canMoveVertical = true;
                    additionalSizeFromArrow.width = arrowDimensions.height;
                    break;
                case PopupPosition.LeftLeftBottom:
                    break;
                case PopupPosition.RightRightTop:
                    break;
                case PopupPosition.RightMiddle:
                    break;
                case PopupPosition.RightRightBottom:
                    break;
            }

            var overallWidth = elementDimensions.width + additionalSizeFromArrow.width;
            var overallHeight = elementDimensions.height + additionalSizeFromArrow.height;

            if (((result.top + overallHeight) > viewportDimensions.height) || result.top < 0) {
                result.fitsVertical = false;
            }

            if (((result.left + overallWidth) > viewportDimensions.width) || result.left < 0) {
                result.fitsHorizontal = false;
            }

            if (canMoveHorizontal && result.fitsVertical && !result.fitsHorizontal) {
                if (overallWidth < viewportDimensions.width) {
                    result.fitsHorizontal = true;
                }
            }

            if (canMoveVertical && result.fitsHorizontal && !result.fitsVertical) {
                if (overallHeight < viewportDimensions.width) {
                    result.fitsHorizontal = true;
                }
            }

            result.fits = result.fitsHorizontal && result.fitsVertical;
            result.height = elementDimensions.height + additionalSizeFromArrow.height;
            result.width = elementDimensions.width + additionalSizeFromArrow.width;
            result.popupPosition = popupPosition;

            return result;
        }
        /*#endregion Private Methods*/
    }
    
    /*Enum*/
    class PopupPosition {
        static TopLeft = 1;
        static TopTopLeft = 2;
        static TopMiddle = 3;
        static TopTopRight = 4;
        static TopRight = 5;

        static BottomLeft = 6;
        static BottomTopLeft = 7;
        static BottomMiddle = 8;
        static BottomBottomRight = 9;
        static BottomRight = 10;

        static LeftLeftTop = 11;
        static LeftMiddle = 12;
        static LeftLeftBottom = 13;

        static RightRightTop = 14;
        static RightMiddle = 15;
        static RightRightBottom = 16;
    }
    /*#endregion PopupHelper*/


/* #region FANCY LISTS */
    SCPSAPI.fancylists = (function() {

        function _initialize() {
            var lists = $("[name~='fancylist']");
            createObserverForFancyLists(lists);
        }

        /*find any element in the row with template-background-imge-source and apply that image to template-background-image elements*/
        function loadfancyImages(jqFancyListRow) {
            var allimagesources = jqFancyListRow.find("[data-template-background-image-source]");
            allimagesources.each(function(index, element) {

                var jqimagesource = $(element);
                var imagetag = jqimagesource.find("img");
                var url = imagetag.attr("src");
                var rowParent = jqimagesource.parents(".grid-content-cell");
                if (!!url) {
                    rowParent.find("[data-template-background-image]").css("background-image", `url(${url})`);
                }
            });
        }

        function createObserverForFancyLists(jqfancyLists) {
            jqfancyLists.each(function(index, fancyList) {
                createObserverForFancyList($(fancyList));
            });
        }

        /*when a fancy list adds new rows, we process each new row.*/
        function mutationCallback(mutations, observer) {
            mutations.forEach(function(mutation) {
                switch (mutation.type) {
                    case "childList":
                        if (mutation.addedNodes.length > 0) {
                            mutation.addedNodes.forEach(function(addedNode) {
                                jqFancyListRow = $(addedNode);
                                loadfancyImages(jqFancyListRow);
                                /*other processing of new rows here*/
                            });
                        }
                        break;
                }
            });
        }

        /*we observe new rows being added to the listview so that we can process the images for data-template-background-image*/
        function createObserverForFancyList(fancyList) {

            var jqObserveElement = fancyList.find(".grid-content-table > tbody");
            var observeElement = jqObserveElement[0];
            var observer = new MutationObserver(mutationCallback);

            var config = {
                attributes: false,
                characterData: false,
                childList: true
            };

            observer.observe(observeElement, config);
        }
        return {
            initialize: _initialize
        }
    })();

    $(function() {
        SCPSAPI.fancylists.initialize();
    });
