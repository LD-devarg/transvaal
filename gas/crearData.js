// Manejo de Creación de Datos en el Sistema

function crearNuevoProveedor(datosProveedor) {
    console.log("Creando nuevo Proveedor: " + datosProveedor);
    ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetProveedores = ss.getSheetByName("Proveedores");
    sheetProveedores.appendRow(datosProveedor);
    console.log("Nuevo Proveedor creado: " + datosProveedor[0]);
}

function crearNuevoCliente(datosCliente) {
    console.log("Creando nuevo Cliente: " + datosCliente);
    ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetClientes = ss.getSheetByName("Clientes");
    sheetClientes.appendRow(datosCliente);
    console.log("Nuevo Cliente creado: " + datosCliente[0]);
}

function crearNuevoDestino(datosDestino) {
    console.log("Creando nuevo Viaje: " + datosDestino);
    ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetSalidas = ss.getSheetByName("Salidas");
    sheetSalidas.appendRow(datosDestino);
    console.log("Nuevo Viaje creado: " + datosDestino[0]);
}

function crearNuevaTarifa(datosTarifa) {
  console.log("Creando nueva Tarifa:", datosTarifa);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Tarifas");

  // Mapeo correcto según tu estructura:
  const salidaNueva  = datosTarifa[1];
  const clienteNuevo = datosTarifa[2];
  const desdeFecha   = new Date(datosTarifa[0]);
  const tarifaNueva  = datosTarifa[3];

  // Obtener última fila REAL solo en columnas A–E
  const lastReal = getLastRealRow_AE(sheet);

  // Leer solo A–G para buscar tarifa vigente existente
  const datos = sheet.getRange(2, 1, lastReal - 1, 7).getValues();

  // 1) Cerrar tarifa vigente anterior (si existe)
  for (let i = 0; i < datos.length; i++) {
    const salidaExist = datos[i][0];
    const clienteExist = datos [i][1];
    const activo = datos[i][6];

    const vigente = activo === true;

    if (salidaExist === salidaNueva &&
        clienteExist === clienteNuevo &&
        vigente) {

      const fechaCierre = new Date(desdeFecha);
      fechaCierre.setDate(fechaCierre.getDate() - 1);

      sheet.getRange(i + 2, 4).setValue(fechaCierre); // Columna D (Hasta)

      console.log("Tarifa vigente anterior cerrada:", salidaExist, clienteExist);
      break;
    }
  }

  // 2) Insertar nueva tarifa SOLO usando A–E
  const nuevaFila = [
    salidaNueva,   // A
    clienteNuevo,  // B
    desdeFecha,      // C
    "",            // D (Hasta)
    tarifaNueva    // E
  ];

  sheet.getRange(lastReal + 1, 1, 1, 5).setValues([nuevaFila]);

  console.log("Nueva Tarifa creada:", nuevaFila);
}

function getLastRealRow_AE(sheet) {
  const data = sheet.getRange(1, 1, sheet.getLastRow(), 5).getValues(); // Solo A–E
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i].some(v => v !== "" && v !== null)) {
      return i + 1;
    }
  }
  return 1;
}
