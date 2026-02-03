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


function onFormSubmit(e) {
    // Al recibir una nueva respuesta del formulario, leer las respuestas obtenidas desde la hoja Formulario (ultima fila con datos)
    const sheetFormulario = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Formulario");
    const lastRow = sheetFormulario.getLastRow();
    const respuestas = sheetFormulario.getRange(lastRow, 1, 1, sheetFormulario.getLastColumn()).getValues()[0];
    console.log(`onFormSubmit disparado en fila ${lastRow}: ${JSON.stringify(respuestas)}`);
    
    // Procesar las respuestas segun la logica del negocio
    procesarRespuestaFormulario(respuestas);
}

function procesarRespuestaFormulario(respuestas) {
    // En primera instancia se evalua la respuesta de la columna B, si es "Gestion Viajes" se evalua la columna C, si la columna C es Alta Viaje, evaluo Columna H si es "Si", tomo el rango D-G y I-N para crear un nuevo viaje en la hoja Viajes. Si la columna H es "No", solo tomo el rango D-G para crear un nuevo viaje en la hoja Viajes.
    let accion = respuestas[1]
    if (accion === "Gestión Viajes") { 
        console.log(`Gestión Viajes detectada: ${accion}`);
    
        const tipoGestion = respuestas[2]; // Columna C
        console.log("Tipo de Gestión: " + tipoGestion);
        
        if (tipoGestion === "Alta Viaje") {
            const incluyeGastos = respuestas[7]; // Columna H
            console.log("Incluye Gastos: " + incluyeGastos);

            if (incluyeGastos === "Si") {
                const datosViajeConGastos = respuestas.slice(3, 7).concat(respuestas.slice(8, 14)); // Columnas D-G e I-N
                console.log("Datos Viaje con Gastos: " + datosViajeConGastos);
                crearNuevoViaje(datosViajeConGastos, true);

            } else if (incluyeGastos === "No") {
                const datosViajeSinGastos = respuestas.slice(3, 7); // Columnas D-G
                console.log("Datos Viaje sin Gastos: " + datosViajeSinGastos);
                crearNuevoViaje(datosViajeSinGastos, false);
            }
          cargarViajesDinamicamente();
        }
        if (tipoGestion === "Gastos de Viaje") {
            const gastosViaje = respuestas.slice(14, 21); // Columnas O-U
            registrarGastosViaje(gastosViaje);
        }
        if (tipoGestion === "Cargar Documentación") {
            if (respuestas[21] === "Remito de Viaje") {
                const documentacionRemitos = respuestas.slice(22, 25); // Columnas W-Y
                cargarDocumentacionRemito(documentacionRemitos);
            }
            if (respuestas[21] === "Factura de Liquidación") {
                const documentacionFacturas = respuestas.slice(25, 27); // Columnas Z-AA
                cargarDocumentacionFactura(documentacionFacturas);
            }
        }
    }
    if (accion === "Gestión Datos") {
        const tipoCRUD = respuestas[27]; // Columna AB
        // Si crear, evaluo AC
        if (tipoCRUD === "Crear") {
            const entidad = respuestas[28]; // Columna AC
            if (entidad === "Proveedor") {
                const datosProveedor = respuestas.slice(29, 33); // Columnas AD-AG
                crearNuevoProveedor(datosProveedor);
            }
            if (entidad === "Cliente") {
                const datosCliente = respuestas.slice(33, 36); // Columnas AH-AJ
                crearNuevoCliente(datosCliente);
            }
            if (entidad === "Destino") {
                const datosDestino = respuestas.slice(36, 38); // Columnas AK-AL
                crearNuevoDestino(datosDestino);
            }
            if (entidad === "Tarifa") {
                const datosTarifa = respuestas.slice(38, 42); // Columnas AM-AP
                crearNuevaTarifa(datosTarifa);
            }
        }
        if (tipoCRUD === "Modificar") {
            const entidad = respuestas[42]; // Columna AQ
            if (entidad === "Proveedor") {
                const datosProveedor = respuestas.slice(43, 48); // Columnas AR-AV
                modificarProveedor(datosProveedor);
            }
            if (entidad === "Cliente") {
                const datosCliente = respuestas.slice(48, 52); // Columnas AW-AZ
                modificarCliente(datosCliente);
            }
        }
    }
}
