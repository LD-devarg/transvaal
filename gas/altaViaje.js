function crearNuevoViaje(datos, incluyeGastos) {

  // Depende de si incluye gastos o no, el mapeo de columnas es diferente
  console.log(
    `Creando nuevo viaje | incluyeGastos=${incluyeGastos} | datos=${JSON.stringify(
      datos
    )}`
  );

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetViajes = ss.getSheetByName("Viajes");

  // Buscar última fila con datos en C, empezando desde fila 4
  const lastRowC = obtererUltimaFilaConDatos(sheetViajes);

  const nuevaFila = lastRowC + 1;

  // Mapeos
  const mapeoSinGastos = {
    0: 3, // Fecha salida -> C
    1: 5, // Salida -> E
    2: 6, // Cliente -> F
    3: 8, // Proveedor -> H
  };

  const mapeoConGastos = {
    0: 3, // Fecha salida -> C
    1: 5, // Salida -> E
    2: 6, // Cliente -> F
    3: 8, // Proveedor -> H
    4: 10, // Cubiertas -> J
    5: 11, // Adelanto/Otro -> K
    6: 12, // Lts Combustible -> L
    7: 13, // $ Combustible -> M
    8: 15, // Remito Combustible -> O
    9: 16, // Demora -> P
  };

  // Selección del mapeo según el tipo
  const mapeo = incluyeGastos ? mapeoConGastos : mapeoSinGastos;

  // Escritura en hoja
  Object.keys(mapeo).forEach((i) => {
    const colDestino = mapeo[i];
    const valor = datos[i];
    sheetViajes.getRange(nuevaFila, colDestino).setValue(valor);
  });

  console.log(`Viaje creado en fila ${nuevaFila} con éxito.`);
}

function obtererUltimaFilaConDatos(sheetViajes) {
  const colC = 3; // Columna C
  // Para asegurar partimos del titulo en fila 3 + 1
  const start = 3; // Empezando desde fila 4 (indice 3)
  // Obtener la última fila de la hoja, pero buscando SOLO en columna C, porque en el resto hay formulas que pueden dar falso positivo.
  const last = sheetViajes.getLastRow();

  // Recorrer desde la última fila hacia arriba hasta encontrar el primer valor no vacío en la columna C
  if (last < start) {
    return start; // No hay datos, retornar la fila inicial
  }

  // Leer todos los valores de la columna C desde 'start' hasta 'last'
  const valoresColC = sheetViajes.getRange(start, colC, last - start + 1).getValues();
  for (let i = valoresColC.length - 1; i >= 0; i--) {
    if (valoresColC[i][0] !== "") {
      return i + start; // Retornar la fila real en la hoja
    }
  }
  return start; // No hay datos, retornar la fila inicial
}
