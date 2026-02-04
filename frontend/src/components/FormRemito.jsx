import { useEffect, useState } from "react";
import { fetchViajesSinRemito } from "../services/authApi";

export default function FormRemito({ onSubmit, isSubmitting = false }) {
    const [viajes, setViajes] = useState([]);
    const [viajeId, setViajeId] = useState("");
    const [remito, setRemito] = useState("");
    const [loadingViajes, setLoadingViajes] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const loadViajes = async () => {
            setLoadingViajes(true);
            setErrorMessage("");
            try {
                const data = await fetchViajesSinRemito();
                setViajes(data.viajes || []);
            } catch (error) {
                setErrorMessage(error.message || "No se pudieron cargar los viajes");
            } finally {
                setLoadingViajes(false);
            }
        };

        loadViajes();
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.({ nViaje: viajeId, remito });
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <h2 className='text-black dark:text-white text-xl text-center'>Registrar Nuevo Remito de Viaje</h2>
            <form className="flex w-100 flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-row gap-4">
                    <div className="flex flex-col w-full">
                        <label htmlFor="viaje" className="text-black dark:text-white">Viaje</label>
                        <select
                            required
                            className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                            name="viaje"
                            id="viaje"
                            value={viajeId}
                            onChange={(event) => setViajeId(event.target.value)}
                            disabled={loadingViajes}
                        >
                            <option value="" disabled>
                                {loadingViajes ? "Cargando viajes..." : "Seleccione viaje"}
                            </option>
                            {viajes.map((item) => (
                                <option key={item.id} value={item.id}>{item.descripcion}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-row w-full">
                    <label htmlFor="remito-viaje" className="text-black dark:text-white">Numero de Remito</label>
                    <input
                        required
                        className="rounded-xl w-full p-2 text-center bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                        type="text"
                        name="remito-viaje"
                        id="remito-viaje"
                        value={remito}
                        onChange={(event) => setRemito(event.target.value)}
                    />
                </div>
                {errorMessage ? <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
                <button
                    type="submit"
                    disabled={isSubmitting || loadingViajes}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Guardando..." : "Registrar Remito"}
                </button>
            </form>
        </div>
    );
}
