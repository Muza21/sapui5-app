sap.ui.define(
  [
    "project1/controller/BaseController",
    "sap/f/library",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (BaseController, fioriLibrary, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("project1.controller.Detail", {
      onInit: function () {
        const oViewModel = new JSONModel({
          editMode: false,
          createMode: false,
        });
        this.setModel(oViewModel, "view");
        this.oRouter = this.getOwnerComponent().getRouter();
        this.oRouter
          .getRoute("detail")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched: function (oEvent) {
        const sProductId = oEvent.getParameter("arguments").product;
        const bCreateMode = sProductId === "new";
        const oViewModel = this.getModel("view");
        const oModel = this.getModel("odataV2Model");
        const oView = this.getView();

        oViewModel.setProperty("/createMode", bCreateMode);
        oViewModel.setProperty("/editMode", false);
        if (!this._oEditModel) {
          this._oEditModel = new JSONModel();
          this.setModel(this._oEditModel, "edit");
        }
        if (bCreateMode) {
          this._oEditModel.setData({
            ID: Date.now(),
            Name: "",
            Description: "",
            ReleaseDate: "",
            Rating: null,
            Price: null,
            DiscontinuedDate: null,
          });
          this._setEditMode(true);
          this._toggleFooter();
        } else {
          this._toggleFooter();
          const oContext = oModel.getContext(`/Products(${sProductId})`);
          oView.setBindingContext(oContext, "odataV2Model");
          oModel.read(`/Products(${sProductId})`, {
            success: (oData) => {
              this._oEditModel.setData(oData);
              this._setEditMode(false);
            },
            error: () => {},
          });
        }

        this.getOwnerComponent()
          .getModel()
          .setProperty(
            "/layout",
            fioriLibrary.LayoutType.TwoColumnsMidExpanded
          );
      },

      _setEditMode: function (bEdit) {
        const oViewModel = this.getModel("view");
        oViewModel.setProperty("/editMode", bEdit);
      },

      onEdit: function () {
        const oViewModel = this.getModel("view");
        const bCurrent = oViewModel.getProperty("/editMode");
        this._setEditMode(!bCurrent);
        this._toggleFooter();
        if (bCurrent) {
          this.onCancel();
        }
      },

      onSave: function () {
        const oResourceBundle = this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle();
        const oODataModel = this.getModel("odataV2Model");
        const oFormData = this.getModel("edit");
        const oData = oFormData.getData();
        const oViewModel = this.getModel("view");

        const sError = this._validateProductData(oData);
        if (sError) {
          MessageToast.show(sError);
          return;
        }
        const bCreateMode = oViewModel.getProperty("/createMode");

        if (bCreateMode) {
          oODataModel.create("/Products", oData, {
            success: () => {
              MessageToast.show(oResourceBundle.getText("saveSuccess"));
              this._setEditMode(false);
              oViewModel.setProperty("/createMode", false);
              this._toggleFooter();
              this.oRouter.navTo(
                "list",
                { layout: fioriLibrary.LayoutType.OneColumn },
                true
              );
            },
            error: () =>
              MessageToast.show(oResourceBundle.getText("saveError")),
          });
        } else {
          const oContext = this.getView().getBindingContext("odataV2Model");
          oODataModel.update(oContext.getPath(), oFormData.getData(), {
            success: () => {
              MessageToast.show(oResourceBundle.getText("saveSuccess"));
              this._setEditMode(false);
              this._toggleFooter();
            },
            error: () =>
              MessageToast.show(oResourceBundle.getText("saveError")),
          });
        }
      },

      onCancel: function () {
        const oViewModel = this.getModel("view");
        const oODataModel = this.getModel("odataV2Model");
        const bCreateMode = oViewModel.getProperty("/createMode");

        if (bCreateMode) {
          this._setEditMode(false);
          this.oRouter.navTo(
            "list",
            { layout: fioriLibrary.LayoutType.OneColumn },
            true
          );
        } else {
          const sPath = this.getView()
            .getBindingContext("odataV2Model")
            .getPath();
          oODataModel.read(sPath, {
            success: (oData) => {
              this.getModel("edit").setData(oData);
              const oDP = this.byId("productDatePicker");
              if (oDP) {
                const oDateType = new sap.ui.model.type.Date({
                  pattern: "dd/MM/yyyy",
                  strictParsing: true,
                });
                oDP.setValue(
                  oDateType.formatValue(oData.ReleaseDate, "string")
                );
              }
            },
          });
          this._setEditMode(false);
        }
        this._toggleFooter();
      },

      onDelete: function () {
        const oContext = this.getView().getBindingContext("odataV2Model");
        const oODataModel = this.getModel("odataV2Model");
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
                  this.oRouter.navTo(
                    "list",
                    {
                      layout: fioriLibrary.LayoutType.OneColumn,
                    },
                    true
                  );
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

      _toggleFooter: function () {
        const oObjectPage = this.getView().byId("ObjectPageLayout");
        const oViewModel = this.getModel("view");
        const bEditableMode =
          oViewModel.getProperty("/editMode") ||
          oViewModel.getProperty("/createMode");
        oObjectPage.setShowFooter(bEditableMode);
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
        if (!this._validateDatePicker()) {
          return oResourceBundle.getText("releaseDateInvalid");
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
        if (isNaN(oData.Price)) {
          return oResourceBundle.getText("priceInvalid");
        }
        if (parseFloat(oData.Price) < 0) {
          return oResourceBundle.getText("pricePositive");
        }

        return null;
      },

      _validateDatePicker: function () {
        const oDP = this.byId("productDatePicker");

        if (!oDP) {
          return false;
        }

        if (!oDP.isValidValue()) {
          return false;
        }

        return true;
      },
      isDirty: function () {
        return this.getModel("view").getProperty("/editMode") === true;
      },
    });
  }
);
