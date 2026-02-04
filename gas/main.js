// ID FORM: 1g89qyuOr-SsB8XYEnes2XTS_hmoghaeYRe2hfy5ugXQ
// ID Sheet: 1-NfIkZS761jBgJpLRa4YmOdr9VR7oPh_eiVb3Z9d-O4
// Hojas de Sheet: "Formulario", "Viajes", "Liquidaciones", "Liquidaciones_Detalle", "Destinos", "Proveedores", "Clientes", "Tarifas"

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Gestión')
        .addItem('Generar Liquidación', 'mostrarModalLiquidacion')
        .addItem('Generar PDF - Liquidación', 'mostrarModalPDFLiquidacion')
        .addItem('Actualizar Formulario', 'cargarPreguntasDinamicamente')
        .addToUi();
}

function mostrarModalLiquidacion() {
  const html = HtmlService.createHtmlOutputFromFile('ui_liquidacion')
    .setWidth(900).setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, 'Armar liquidación');
}

function mostrarModalPDFLiquidacion() { 
  const html = HtmlService.createHtmlOutputFromFile("ui_pdf_liquidacion").setWidth(500).setHeight(300);

  SpreadsheetApp.getUi().showModalDialog(html, "Generar PDF de Liquidación");
}