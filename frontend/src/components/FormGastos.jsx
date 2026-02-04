import { useState } from "react";
import { useCatalogos } from "../hooks/useCatalogos";

function FormGastos({ onSubmit, isSubmitting = false }) {
    const [fecha, setFecha] = useState("");
    const [proveedor, setProveedor] = useState("");
    const [cubiertas, setCubiertas] = useState("");
    const [adelantoOtros, setAdelantoOtros] = useState("");
    const [ltsComb, setLtsComb] = useState("");
    const [montoComb, setMontoComb] = useState("");
    const [remitoComb, setRemitoComb] = useState("");
    const { choferes, loadingOptions, optionsError } = useCatalogos();

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.({
            fecha,
            proveedor,
            cubiertas,
            adelantoOtros,
            ltsComb,
            montoComb,
            remitoComb,
        });
    };

    return (
        <form className="flex w-100 flex-col gap-4" onSubmit={handleSubmit}>
            <h2 className='text-black dark:text-white text-xl text-center'>Registrar Nuevo Gasto</h2>
            <div className="flex flex-row gap-2 w-full">
                <div className="flex flex-col">
                    <label htmlFor="fechaGasto" className="text-black dark:text-white">Fecha</label>
                    <input
                        required
                        className="rounded-xl w-30 text-sm p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                        type="date"
                        name="fechaGasto"
                        id="fechaGasto"
                        value={fecha}
                        onChange={(event) => setFecha(event.target.value)}
                    />
                </div>
                <div className="flex flex-col w-full">
                    <label htmlFor="proveedor" className="text-black dark:text-white">Proveedor</label>
                    <select
                        required
                        className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                        name="proveedor"
                        id="proveedor"
                        value={proveedor}
                        onChange={(event) => setProveedor(event.target.value)}
                        disabled={loadingOptions}
                    >
                        <option value="">{loadingOptions ? "Cargando proveedores..." : "Seleccione un proveedor"}</option>
                        {choferes.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
            </div>
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" step="0.01" name="cubiertas" id="cubiertas" placeholder="Cubiertas" value={cubiertas} onChange={(event) => setCubiertas(event.target.value)} />
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" step="0.01" name="adelantoOtros" id="adelantoOtros" placeholder="Adelanto/Otros" value={adelantoOtros} onChange={(event) => setAdelantoOtros(event.target.value)} />
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" step="0.01" name="lts-combustible" id="lts-combustible" placeholder="Lts de Combustible" value={ltsComb} onChange={(event) => setLtsComb(event.target.value)} />
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="number" step="0.01" name="monto" id="monto" placeholder="$ Combustible" value={montoComb} onChange={(event) => setMontoComb(event.target.value)} />
            <input className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white" type="text" name="remito-comb" id="remito-comb" placeholder="Remito de Combustible" value={remitoComb} onChange={(event) => setRemitoComb(event.target.value)} />
            {optionsError ? <p className="text-sm text-red-600 dark:text-red-400">{optionsError}</p> : null}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? "Guardando..." : "Enviar"}
            </button>
        </form>
    )
}

export default FormGastos
