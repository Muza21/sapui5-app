sap.ui.define(
  [
    "project1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  (BaseController, Filter, FilterOperator) => {
    "use strict";

    return BaseController.extend("project1.controller.Main", {
      onInit: function () {
        this.oRouter = this.getOwnerComponent().getRouter();
      },

      onSearch: function (oEvent) {
        const sQuery = oEvent.getParameter("query");
        const oList = this.byId("list");
        const oBinding = oList.getBinding("items");
        const aFilters = [];
        if (sQuery && sQuery.length > 0) {
          aFilters.push(
            new Filter({
              path: "Description",
              operator: FilterOperator.Contains,
              value1: sQuery,
            })
          );
        }
        oBinding.filter(aFilters);
      },

      onAdd: function () {
        this.oRouter.navTo("detail", {
          productId: "new",
        });
      },

      onListItemPress: function (oEvent) {
        const oContext = oEvent.getSource().getBindingContext("odataV2Model");
        const sProductId = oContext.getProperty("ID");

        this.oRouter.navTo("detail", {
          productId: sProductId,
        });
      },
    });
  }
);
