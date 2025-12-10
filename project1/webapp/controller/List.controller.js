sap.ui.define(
  [
    "project1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/f/library",
    "sap/m/MessageBox",
  ],
  function (
    BaseController,
    Filter,
    FilterOperator,
    Sorter,
    fioriLibrary,
    MessageBox
  ) {
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
              filters: [
                new Filter({
                  path: "Name",
                  operator: FilterOperator.Contains,
                  value1: sQuery,
                  caseSensitive: false,
                }),
                new Filter({
                  path: "Description",
                  operator: FilterOperator.Contains,
                  value1: sQuery,
                  caseSensitive: false,
                }),
              ],
              and: false,
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
        const oComponent = this.getOwnerComponent();
        const oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
        const oFCL = oComponent
          .getAggregation("rootControl")
          .byId("flexibleColumnLayout");
        const oMidPage = oFCL.getCurrentMidColumnPage();
        let bIsDirty = false;
        if (oMidPage && oMidPage.getController && oMidPage.getController()) {
          const oDetailsController = oMidPage.getController();
          if (oDetailsController.isDirty) {
            bIsDirty = oDetailsController.isDirty();
          }
        }
        if (bIsDirty) {
          MessageBox.warning(oResourceBundle.getText("confirm"), {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: (oAction) => {
              if (oAction === MessageBox.Action.YES) {
                this._continueNavigation(oEvent);
              }
            },
          });
        } else {
          this._continueNavigation(oEvent);
        }
      },

      _continueNavigation: function (oEvent) {
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
