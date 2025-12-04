sap.ui.define(
  ["project1/controller/BaseController"],
  function (BaseController) {
    "use strict";

    return BaseController.extend("project1.controller.Main", {
      onInit: function () {
        this.oRouter = this.getOwnerComponent().getRouter();
        this.oRouter.attachRouteMatched(this.onRouteMatched, this);
      },

      onRouteMatched: function (oEvent) {
        this.currentRouteName = oEvent.getParameter("name");
        this.currentProduct = oEvent.getParameter("arguments").product;
      },

      onStateChanged: function (oEvent) {
        const bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
          sLayout = oEvent.getParameter("layout");

        if (bIsNavigationArrow) {
          this.oRouter.navTo(
            this.currentRouteName,
            {
              layout: sLayout,
              product: this.currentProduct,
            },
            true
          );
        }
      },

      onExit: function () {
        this.oRouter.detachRouteMatched(this.onRouteMatched, this);
      },
    });
  }
);
