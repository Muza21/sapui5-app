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

      onSave: function () {
        const oResourceBundle = this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle();
        const oODataModel = this.getModel("odataV2Model");
        const oContext = this.getView().getBindingContext("odataV2Model");
        const oData = oContext.getObject();
        const oViewModel = this.getModel("view");
        const sError = this._validateProductData(oData);
        if (sError) {
          MessageToast.show(sError);
          return;
        }

        oODataModel.submitChanges({
          success: () => {
            MessageToast.show(oResourceBundle.getText("saveSuccess"));
            oViewModel.setProperty("/editMode", false);
            this._setSmartFormEditable(false);
            if (oViewModel.getProperty("/createMode")) {
              oViewModel.setProperty("/createMode", false);
            }
          },
          error: () => MessageToast.show(oResourceBundle.getText("saveError")),
        });
      },

      onCancel: function () {
        const oViewModel = this.getView().getModel("view");
        const oODataModel = this.getView().getModel("odataV2Model");
        const bCreateMode = oViewModel.getProperty("/createMode");
        const oContext = this.getView().getBindingContext("odataV2Model");

        if (oContext) {
          oODataModel.resetChanges([oContext.getPath()]);
        }

        if (bCreateMode) {
          this.oRouter.navTo("RouteMain", {}, true);
        } else {
          oViewModel.setProperty("/editMode", false);
          this._setSmartFormEditable(false);
        }
      },

      onDelete: function () {
        const oContext = this.getView().getBindingContext("odataV2Model");
        const oODataModel = this.getView().getModel("odataV2Model");
        const oResourceBundle = this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle();

        const sPath = oContext.getPath();

        MessageBox.warning(oResourceBundle.getText("deleteConfirm"), {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: (oAction) => {
            if (oAction === MessageBox.Action.OK) {
              oODataModel.remove(sPath, {
                success: () => {
                  MessageToast.show(oResourceBundle.getText("deleteSuccess"));
                  this.oRouter.navTo("RouteMain", {}, true);
                },
                error: (oError) => {
                  MessageToast.show(
                    oError?.response?.body ||
                      oResourceBundle.getText("deleteError")
                  );
                },
              });
            }
          },
          dependentOn: this.getView(),
        });
      },

      _validateProductData: function (oData) {
        const oResourceBundle = this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle();

        if (!oData.Name || oData.Name.trim() === "") {
          return oResourceBundle.getText("nameRequired");
        }

        if (!oData.Description || oData.Description.trim() === "") {
          return oResourceBundle.getText("descriptionRequired");
        }

        if (!oData.ReleaseDate) {
          return oResourceBundle.getText("releaseDateRequired");
        }

        if (
          oData.Rating === null ||
          oData.Rating === undefined ||
          oData.Rating === ""
        ) {
          return oResourceBundle.getText("ratingRequired");
        }

        if (oData.Rating < 1 || oData.Rating > 5) {
          return oResourceBundle.getText("ratingRange");
        }

        if (
          oData.Price === null ||
          oData.Price === undefined ||
          oData.Price === ""
        ) {
          return oResourceBundle.getText("priceRequired");
        }

        if (parseFloat(oData.Price) < 0) {
          return oResourceBundle.getText("pricePositive");
        }

        return null;
      },
    });
  }
);
