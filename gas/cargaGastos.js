// Cargar datos en la fila correspondiente de la hoja Viajes, partiendo de la respuesta del formulario
// Partiendo de la respuesta buscar la coincidencia en la columna U de la hoja Viajes para actualizar los gastos asociados a ese viaje
// Los gastos vienen en el siguiente orden:
// Columna O = Viaje Relacionado
// Columna P = Cubiertas
// Columna Q = Adelanto / Otros
// Columna R = Lts. Combustible
// Columna S = $ Combustible
// Columna T = Remito Combustible
// Columna U = Demora

function registrarGastosViaje(gastos) {
  console.log(`Registrando gastos de viaje: ${JSON.stringify(gastos)}`);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetViajes = ss.getSheetByName("Viajes");

    const viajeRelacionado = gastos[0];
    const lastRow = sheetViajes.getLastRow();
    const data = sheetViajes.getRange(4, 1, lastRow - 3, sheetViajes.getLastColumn()).getValues();
    let filaEncontrada = -1;

    // Buscar la fila que coincide con el Viaje Relacionado en la columna U (índice 20)
    for (let i = 0; i < data.length; i++) {
        if (data[i][20] === viajeRelacionado) {
            filaEncontrada = i + 4; // Ajustar por el offset de filas (empezando en fila 4)
            break;
        }
    }
    if (filaEncontrada === -1) {
        console.log(`No se encontró el viaje relacionado: ${viajeRelacionado}`);
        return;
    }
    // Mapeo de gastos a columnas
    const mapeoGastos = {
        1: 10, // Cubiertas -> J
        2: 11, // Adelanto / Otros -> K
        3: 12, // Lts. Combustible -> L
        4: 13, // $ Combustible -> M
        5: 15, // Remito Combustible -> O
        6: 16  // Demora -> P
    };
    // Actualizar los gastos en la fila encontrada
    Object.keys(mapeoGastos).forEach(i => {
        const colDestino = mapeoGastos[i];
        const valor = gastos[i];
        sheetViajes.getRange(filaEncontrada, colDestino).setValue(valor);
    });
    console.log(`Gastos registrados en la fila ${filaEncontrada} para el viaje relacionado: ${viajeRelacionado}`);
}