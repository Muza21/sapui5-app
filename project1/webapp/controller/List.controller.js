sap.ui.define(
  [
    "project1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/f/library",
  ],
  function (BaseController, Filter, FilterOperator, Sorter, fioriLibrary) {
    "use strict";

    return BaseController.extend("project1.controller.List", {
      onInit: function () {
        this._bDescendingSort = false;
        this.oProductsTable = this.getView().byId("productsTable");
        this.oRouter = this.getOwnerComponent().getRouter();
      },

      onSearch: function (oEvent) {
        const sQuery = oEvent.getParameter("query");
        const oBinding = this.oProductsTable.getBinding("items");
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
        const oModel = this.getOwnerComponent().getModel();
        oModel.setProperty(
          "/layout",
          fioriLibrary.LayoutType.TwoColumnsMidExpanded
        );

        this.oRouter.navTo("detail", {
          layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded,
          product: "new",
        });
      },

      onSort: function () {
        this._bDescendingSort = !this._bDescendingSort;
        const oBinding = this.oProductsTable.getBinding("items");
        const oSorter = new Sorter("Price", this._bDescendingSort);
        oBinding.sort(oSorter);
      },

      onListItemPress: function (oEvent) {
        const oItem = oEvent.getSource();
        const oObject = oItem.getBindingContext("odataV2Model").getObject();
        this.oRouter.navTo("detail", {
          layout: fioriLibrary.LayoutType.TwoColumnsMidExpanded,
          product: oObject.ID,
        });
      },
    });
  }
);
