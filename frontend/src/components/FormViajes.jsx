import { useEffect, useState } from "react";
import { fetchSalidasByCliente } from "../services/authApi";
import { useCatalogos } from "../hooks/useCatalogos";

function FormViajes({ onSubmit, isSubmitting = false }) {
    const [fecha, setFecha] = useState("");
    const [cliente, setCliente] = useState("");
    const [chofer, setChofer] = useState("");
    const [salida, setSalida] = useState("");
    const [remito, setRemito] = useState("");
    const [salidas, setSalidas] = useState([]);
    const [loadingSalidas, setLoadingSalidas] = useState(false);
    const [salidasError, setSalidasError] = useState("");
    const { clientes, choferes, loadingOptions, optionsError } = useCatalogos();

    useEffect(() => {
        const loadSalidas = async () => {
            if (!cliente) {
                setSalidas([]);
                setSalida("");
                return;
            }

            setLoadingSalidas(true);
            setSalidasError("");
            try {
                const data = await fetchSalidasByCliente(cliente);
                setSalidas(data.salidas || []);
                setSalida("");
            } catch (error) {
                setSalidasError(error.message || "No se pudieron cargar salidas");
                setSalidas([]);
                setSalida("");
            } finally {
                setLoadingSalidas(false);
            }
        };

        loadSalidas();
    }, [cliente]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.({ fecha, salida, cliente, chofer, remito });
    };

    return (
        <form className="flex w-100 flex-col gap-4" onSubmit={handleSubmit}>
            <h2 className='text-black dark:text-white text-xl text-center'>Registrar Nuevo Viaje</h2>
            <div className="flex flex-row gap-4">
                <div className="flex flex-col w-30">
                    <label htmlFor="fechaViaje" className="text-black dark:text-white">Fecha</label>
                    <input
                        required
                        className="rounded-xl w-30 text-sm p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                        type="date"
                        name="fechaViaje"
                        id="fechaViaje"
                        value={fecha}
                        onChange={(event) => setFecha(event.target.value)}
                    />
                </div>
                <div className="flex flex-col w-full">
                    <label htmlFor="cliente" className="text-black dark:text-white">Cliente</label>
                    <select
                        required
                        className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                        name="cliente"
                        id="cliente"
                        value={cliente}
                        onChange={(event) => setCliente(event.target.value)}
                        disabled={loadingOptions}
                    >
                        <option value="">{loadingOptions ? "Cargando clientes..." : "Seleccione cliente"}</option>
                        {clientes.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex flex-row gap-4 items-center">
                <label htmlFor="salida" className="text-black dark:text-white">Salida</label>
                <select
                    required
                    className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                    name="salida"
                    id="salida"
                    value={salida}
                    onChange={(event) => setSalida(event.target.value)}
                    disabled={!cliente || loadingSalidas}
                >
                    <option value="">
                        {!cliente
                            ? "Primero seleccione cliente"
                            : loadingSalidas
                                ? "Cargando salidas..."
                                : "Seleccione salida"}
                    </option>
                    {salidas.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-row gap-4 items-center">
                <label htmlFor="chofer" className="text-black dark:text-white">Chofer</label>
                <select
                    required
                    className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                    name="chofer"
                    id="chofer"
                    value={chofer}
                    onChange={(event) => setChofer(event.target.value)}
                    disabled={loadingOptions}
                >
                    <option value="">{loadingOptions ? "Cargando choferes..." : "Seleccione chofer"}</option>
                    {choferes.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-row w-full">
                <label htmlFor="remito-viaje" className="text-black dark:text-white">Remito de Viaje</label>
                <input
                    className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                    type="text"
                    name="remito-viaje"
                    id="remito-viaje"
                    placeholder="Remito de Viaje"
                    value={remito}
                    onChange={(event) => setRemito(event.target.value)}
                />
            </div>
            {optionsError ? <p className="text-sm text-red-600 dark:text-red-400">{optionsError}</p> : null}
            {salidasError ? <p className="text-sm text-red-600 dark:text-red-400">{salidasError}</p> : null}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? "Guardando..." : "Enviar"}
            </button>
        </form>
    )
}

export default FormViajes
