module powerbi.extensibility.visual {
    "use strict";

  export class VisualViewModel {
      dataPoints: VisualDataPoint[];
  };

  export class VisualDataPoint {
    stringValue: string;
    numberValue: number;
    selectionId: ISelectionId;
    noOfPoints: number;
  };

}
