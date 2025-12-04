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
        oViewModel.setProperty("/editMode", bCreateMode);

        let oContext;
        if (bCreateMode) {
          oContext = oModel.createEntry("/Products", {
            properties: {
              ID: Date.now(),
              Name: "",
              Description: "",
              ReleaseDate: null,
              Rating: null,
              Price: null,
              DiscontinuedDate: null,
            },
          });
          this._toggleFooter();
        } else {
          this._toggleFooter();
          oContext = oModel.getContext(`/Products(${sProductId})`);
          oModel.read(`/Products(${sProductId})`, {
            success: () => this._setEditMode(false),
            error: () => {},
          });
        }

        oView.setBindingContext(oContext, "odataV2Model");

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
            this._setEditMode(false);
            this._toggleFooter();
            if (oViewModel.getProperty("/createMode")) {
              oViewModel.setProperty("/createMode", false);
            }
          },
          error: () => MessageToast.show(oResourceBundle.getText("saveError")),
        });
      },

      onCancel: function () {
        const oViewModel = this.getModel("view");
        const oODataModel = this.getModel("odataV2Model");
        const bCreateMode = oViewModel.getProperty("/createMode");
        const oContext = this.getView().getBindingContext("odataV2Model");

        if (oContext) {
          oODataModel.resetChanges([oContext.getPath()]);
        }

        if (bCreateMode) {
          this.oRouter.navTo(
            "list",
            { layout: fioriLibrary.LayoutType.OneColumn },
            true
          );
        } else {
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
