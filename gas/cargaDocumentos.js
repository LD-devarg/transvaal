// Cargar Documentos correspondientes a un viaje

// Recibe los datos de la documentación del remito, se busca el viaje correspondiente y se adjuntan los documentos
// El viaje relacionado esta en la columna U de la hoja Viajes.

function cargarDocumentacionRemito(documentacionRemitos) {
    console.log("Cargando Documentación de Remito: " + documentacionRemitos);
    ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetViajes = ss.getSheetByName("Viajes");
    const viajesData = sheetViajes.getDataRange().getValues();
    const numeroViaje = documentacionRemitos[0]; // Columna W
    console.log("Número de Viaje para Remito: " + numeroViaje);
    for (let i = 1; i < viajesData.length; i++) {
        if (viajesData[i][20] == numeroViaje) { // Columna U
            console.log("Viaje encontrado en fila " + (i + 1));
            sheetViajes.getRange(i + 1, 17).setValue(documentacionRemitos[1]); // Columna Q
            sheetViajes.getRange(i + 1, 18).setValue(documentacionRemitos[2]); // Columna R
            console.log("Documentación de Remito cargada para el viaje " + numeroViaje);
            return;
        }
    }
    console.log("Número de viaje no encontrado para el remito: " + numeroViaje);
}

// Recibe los datos de la documentación de la factura, se busca la liquidación correspondiente y se adjuntan los documentos
// La liquidación relacionada esta en la columna B de la hoja Liquidaciones.

function cargarDocumentacionFactura(documentacionFacturas) {
    console.log("Cargando Documentación de Factura: " + documentacionFacturas);
    ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetLiquidaciones = ss.getSheetByName("Liquidaciones");
    const liquidacionesData = sheetLiquidaciones.getDataRange().getValues();
    const numeroLiquidacion = documentacionFacturas[0];
    const url = documentacionFacturas[1];
    

    console.log("Número de Liquidación para Factura: " + numeroLiquidacion);
    for (let i = 1; i < liquidacionesData.length; i++) {
        if (liquidacionesData[i][1] == numeroLiquidacion) { // Columna B
            console.log("Liquidación encontrada en fila " + (i + 1));

            sheetLiquidaciones.getRange(i + 1, 11).setValue("Facturado"); // Columna K
            
            const rich = SpreadsheetApp.newRichTextValue().setText("Ver Factura").setLinkUrl(url).build();
            sheetLiquidaciones.getRange(i + 1, 12).setRichTextValue(rich); // Columna L
            
            console.log("Documentación de Factura cargada para la liquidación " + numeroLiquidacion);
            
            cargarLiquidacionesDinamicamente();
            return;
        }
    }
    console.log("Número de liquidación no encontrado para la factura: " + numeroLiquidacion);
}