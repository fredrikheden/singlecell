// TODO: Use column formatting by default.


import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;

module powerbi.extensibility.visual {
    "use strict";

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost, thisRef: Visual): VisualViewModel {            
        let dataViews = options.dataViews;
        let viewModel: VisualViewModel = {
            dataPoints: []
        };

        var numberValue = null;
        var stringValue = "";
        var noOfValues = 0;
        if ( dataViews && dataViews[0] && dataViews[0].categorical && dataViews[0].categorical.values && dataViews[0].categorical.values[0] && dataViews[0].categorical.values[0].values && dataViews[0].categorical.values[0].values[0] ) {           
            numberValue = dataViews[0].categorical.values[0].values[0];
            noOfValues = 1;
        }
        if ( dataViews && dataViews[0] && dataViews[0].categorical && dataViews[0].categorical.categories && dataViews[0].categorical.categories[0] && dataViews[0].categorical.categories[0].values && dataViews[0].categorical.categories[0].values[0]) {
            stringValue = dataViews[0].categorical.categories[0].values[0].toString();
            noOfValues = dataViews[0].categorical.categories[0].values.length;
        }

        if ( stringValue === "" && numberValue === null) {
            return viewModel;
        }

        viewModel.dataPoints.push({
            numberValue: numberValue,
            stringValue: stringValue,
            selectionId: null,
            noOfPoints: noOfValues
        });

        return viewModel;

    }     


    export class Visual implements IVisual {
        private settings: VisualSettings;
        private model: VisualViewModel;
        private host: IVisualHost;
        private div: HTMLDivElement;
        private selectionManager: ISelectionManager;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            let div = this.div = document.createElement("div");
            var v = this;
            this.div.addEventListener("click", () => {
                if ( v.model.dataPoints !== undefined && v.model.dataPoints.length > 0) {
                    if ( this.settings.dataPoint.treatAsLinkUrl ) {
                        this.host.launchUrl(v.model.dataPoints[0].stringValue);
                    }
                }
            });
            options.element.appendChild(div);
        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            this.model = visualTransform(options, this.host, this);
            let width = options.viewport.width;
            let height = options.viewport.height;
            this.div.style.width = width + "px";
            this.div.style.height = height + "px";
            
            this.div.style.fontSize = this.settings.dataPoint.fontSize + "pt";
            this.div.style.color = this.settings.dataPoint.defaultColor;
            this.div.style.textAlign = this.settings.dataPoint.alignment;
            let value = "";
            
            if ( this.model.dataPoints.length === 0) {
                value = "-";
            } 
            else   {
                if ( this.model.dataPoints[0].numberValue !== null ) {
                    // Number value
                    let iValueFormatter = valueFormatter.create({ format: this.settings.dataPoint.formatString, cultureSelector: this.settings.dataPoint.formatCulture  });
                    if ( this.settings.dataPoint.formatString === "" ) {
                        // Use standard formatting if nothing is specified
                        iValueFormatter = valueFormatter.create({ format: options.dataViews[0].metadata.columns[0].format });
                    }
                    let v1 = this.model.dataPoints[0].numberValue;
                    value = iValueFormatter.format(v1);
                    if ( this.settings.dataPoint.forceThousandSeparatorCharacter.length > 0 ) {
                        value = value.replace(/,/g, this.settings.dataPoint.forceThousandSeparatorCharacter);                        
                    }

                } else {
                    // String value
                    if ( this.settings.dataPoint.forceFormatting ) {
                        let iValueFormatter = valueFormatter.create({ format: this.settings.dataPoint.formatString, cultureSelector: this.settings.dataPoint.formatCulture  });
                        if ( this.settings.dataPoint.forceFormattingSourceType === "DATE" ) {
                            value = iValueFormatter.format( new Date(this.model.dataPoints[0].stringValue));
                        } else if ( this.settings.dataPoint.forceFormattingSourceType === "NUMBER" ) {
                            let  numValue = parseFloat( this.model.dataPoints[0].stringValue );
                            value = iValueFormatter.format( numValue );
                        } else {
                            value = iValueFormatter.format(this.model.dataPoints[0].stringValue);
                        }
                    } else {
                        value = this.model.dataPoints[0].stringValue;
                    }
                }
            }

            this.div.innerHTML = this.settings.dataPoint.htmlTemplate.replace( "%VALUE%", value );

            if ( this.settings.dataPoint.hideIfMoreThanOne ) {
                if ( this.model.dataPoints.length > 0 && this.model.dataPoints[0].noOfPoints === 1) {
                    this.div.style.display = "";
                } else {
                    this.div.style.display = "none";
                }
            } else {
                this.div.style.display = "";            
            }
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        /** 
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the 
         * objects and properties you want to expose to the users in the property pane.
         * 
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}