sap.ui.define(
  [
    "project1/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("project1.controller.Detail", {
      onInit: function () {
        const oViewModel = new JSONModel({
          editMode: false,
          createMode: false,
        });
        this.getView().setModel(oViewModel, "view");
        this.oRouter = this.getOwnerComponent().getRouter();
        this.oRouter
          .getRoute("detail")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched: function (oEvent) {
        const sProductId = oEvent.getParameter("arguments").productId;
        const bCreateMode = sProductId === "new";
        const oViewModel = this.getModel("view");
        const oModel = this.getModel("odataV2Model");
        const oView = this.getView();

        oViewModel.setProperty("/createMode", bCreateMode);
        oViewModel.setProperty("/editMode", false);

        let oContext;
        if (bCreateMode) {
          oContext = oModel.createEntry("/Products", {
            properties: {
              Name: "",
              Description: "",
              ReleaseDate: null,
              Rating: null,
              Price: null,
              DiscontinuedDate: null,
            },
          });
          this._setSmartFormEditable(true);
        } else {
          oContext = oModel.getContext(`/Products(${sProductId})`);
          oModel.read(`/Products(${sProductId})`, {
            success: () => {
              this._setSmartFormEditable(false);
            },
            error: () => {},
          });
        }
        oView.setBindingContext(oContext, "odataV2Model");
      },

      _setSmartFormEditable: function (bEditable) {
        const oSmartForm = this.byId("productForm");
        if (oSmartForm) {
          oSmartForm.setEditable(bEditable);
        }
      },

      onEdit: function () {
        const oViewModel = this.getModel("view");
        oViewModel.setProperty("/editMode", true);
        this._setSmartFormEditable(true);
      },
    });
  }
);
