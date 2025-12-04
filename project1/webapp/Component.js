sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "project1/model/models",
    "sap/f/library",
    "sap/ui/model/json/JSONModel",
  ],
  (UIComponent, models, fioriLibrary, JSONModel) => {
    "use strict";

    return UIComponent.extend("project1.Component", {
      metadata: {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
      },

      init() {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // set the device model
        this.setModel(models.createDeviceModel(), "device");

        const oLayoutModel = new JSONModel({
          layout: fioriLibrary.LayoutType.OneColumn,
        });
        this.setModel(oLayoutModel);
        this.getRouter().attachBeforeRouteMatched(
          this._onBeforeRouteMatched,
          this
        );

        // enable routing
        this.getRouter().initialize();
      },

      _onBeforeRouteMatched: function (oEvent) {
        let sLayout = oEvent.getParameters().arguments.layout;

        if (!sLayout) {
          sLayout = fioriLibrary.LayoutType.OneColumn;
        }

        this.getModel().setProperty("/layout", sLayout);
      },
    });
  }
);
