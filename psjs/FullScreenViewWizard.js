if (typeof (SCPSAPI) == "undefined") SCPSAPI = {};

if (typeof (SCPSAPI.viewwizard) == "undefined")
{
    SCPSAPI.viewwizard = (function ()
    {
        var steps = [];
        var currentStepIndex = 0;

        function Initialise()
        {
            var potentialSteps = $(".runtime-form>.form>.row>.view>.innerpanel>.panel:not([name~='not-wizard-step'])");
            console.log("View Wizard Steps: " + potentialSteps.length);

            var totalSpacing = GetTotalPageFormPadding();
            var foundSelected = false;

            potentialSteps.each(function ()
            {
                var jqStep = $(this);
                var isSelected = jqStep.is("[name~='wizard-step-selected']");
                if (!foundSelected && isSelected){
                    foundSelected=true;
                }
                var jqRow = jqStep.parents(".row");

                setFourPartCSSUnit(jqRow, "padding", totalSpacing);
                setFourPartCSSUnit($(".runtime-content"), "margin", { top: 0, left: 0, right: 0, bottom: 0 });
                setFourPartCSSUnit($(".form"), "padding", { top: 0, left: 0, right: 0, bottom: 0 });

                steps.push({
                    element: jqRow,
                    innerElement: jqStep,
                    isSelected: isSelected
                });

                /*Hook up any navigation buttons*/
                jqStep.find("[name~='wizard-step-next']").click(NextStep);
                jqStep.find("[name~='wizard-step-previous']").click(PreviousStep);
            });

            if (!foundSelected && steps.length>0){
                steps[0].isSelected = true;
            }

            var pastSelected = false;
            steps.forEach((step, index) =>
            {
                if (step.isSelected)
                {
                    pastSelected = true;
                    currentStepIndex = index;
                }
                else
                {
                    step.element.toggleClass("right", pastSelected);
                    step.element.toggleClass("left", !pastSelected);
                }
            });

            var jqRuntimeForm = $(".runtime-form");
            jqRuntimeForm.on("transitionend", function ()
            {
                steps.forEach((step, index) =>
                {
                    step.element.addClass("wizard-step-initialized");
                });
            });
            jqRuntimeForm.addClass("wizard-initialized");


            console.log(steps);
        }

        function GetTotalPageFormPadding()
        {
            var pageMargin = GetFourPartCSSUnit($(".runtime-content"), "margin");
            var formPadding = GetFourPartCSSUnit($(".form"), "padding");

            return {
                top: pageMargin.top + formPadding.top,
                bottom: pageMargin.bottom + formPadding.bottom,
                left: pageMargin.left + formPadding.left,
                right: pageMargin.right + formPadding.right,
            };
        }

        function GetFourPartCSSUnit(jqElement, propertyName)
        {
            var top = parseInt(jqElement.css(propertyName + "-" + "top"));
            var bottom = parseInt(jqElement.css(propertyName + "-" + "bottom"));
            var left = parseInt(jqElement.css(propertyName + "-" + "left"));
            var right = parseInt(jqElement.css(propertyName + "-" + "right"));


            return {
                top: top,
                bottom: bottom,
                left: left,
                right: right,
            };
        }

        function setFourPartCSSUnit(jqElement, propertyName, values)
        {
            var config = {};
            config[propertyName + "-" + "top"] = values.top;
            config[propertyName + "-" + "bottom"] = values.bottom;
            config[propertyName + "-" + "left"] = values.left;
            config[propertyName + "-" + "right"] = values.right;
            jqElement.css(config);
        }

        function NextStep()
        {
            console.log("NextStep: " + currentStepIndex);

            if (currentStepIndex < (steps.length - 1))
            {

                var currentStep = steps[currentStepIndex].element;
                var nextStep = steps[currentStepIndex + 1].element;

                currentStep.addClass("left");
                nextStep.removeClass("right");
                currentStepIndex++;
            }
        }

        function PreviousStep()
        {
            console.log("PreviousStep: " + currentStepIndex);

            if (currentStepIndex > 0)
            {
                var currentStep = steps[currentStepIndex].element;
                var nextStep = steps[currentStepIndex - 1].element;

                currentStep.addClass("right");
                nextStep.removeClass("left");
                currentStepIndex--;
            }
        }

        return {
            initialise: Initialise,
            next: NextStep,
            previous: PreviousStep
        };
    })().initialise();
}
