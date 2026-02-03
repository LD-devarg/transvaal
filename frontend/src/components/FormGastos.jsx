function FormGastos() {
    return (
        <div className="flex flex-col gap-4 w-100">
            <h2 className='text-black dark:text-white text-xl text-center'>Registrar Nuevo Gasto</h2>
            <div className="flex flex-row gap-4">
                <input required className="rounded-xl w-30 text-sm p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="date" name="fechaGasto" id="fechaGasto" placeholder="Fecha de Gasto"/>
                <select required className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="text" name="proveedor" id="proveedor" placeholder="Seleccione un proveedor" >
                    <option value="1">Fernando Iglesias</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                </select>
            </div>
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" name="cubiertas" id="cubiertas" placeholder="Cubiertas"/>
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" name="adelantoOtros" id="adelantoOtros" placeholder="Adelanto/Otros"/>             
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" name="lts-combustible" id="lts-combustible" placeholder="Lts de Combustible"/>
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" name="monto" id="monto" placeholder="Monto"/>
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="text" name="remito-comb" id="remito-comb" placeholder="Remito de Combustible"/>
        </div>
    )
}

export default FormGastos