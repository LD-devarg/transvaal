

function FormViajes() {
    return (
        <div className="flex flex-col gap-4 w-100">
            <h2 className='text-black dark:text-white text-xl text-center'>Registrar Nuevo Viaje</h2>
            <div className="flex flex-row gap-4">
                <input required className="rounded-xl w-30 text-sm p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="date" name="fechaGasto" id="fechaGasto" placeholder="Fecha de Gasto"/>
                <select required className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="text" name="cliente" id="cliente" placeholder="Seleccione un cliente" >
                    <option value="1">Fernando Iglesias</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                </select>
            </div>                
            <select className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="text" name="salida" id="salida" placeholder="Salida" />
            <div className="flex flex-row gap-4">
                <select className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="text" name="chofer" id="chofer" placeholder="Chofer"/>
                <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="text" name="remito-viaje" id="remito-viaje" placeholder="Remito de Viaje" />
            </div>
        </div>
    )
}

export default FormViajes