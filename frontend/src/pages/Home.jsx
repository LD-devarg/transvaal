import { useEffect, useState } from "react";
import FormViajes from "../components/FormViajes";
import FormGastos from "../components/FormGastos";
import FormRemito from "../components/FormRemito";
import Button from "../components/Button";
import { saveGasto, saveRemito, saveViaje } from "../services/authApi";

export default function Home() {
    const [activeForm, setActiveForm] = useState("viajes");
    const [remitoFormKey, setRemitoFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("");
    const logoSrc = `${import.meta.env.BASE_URL}logo_transvaal.png`;

    useEffect(() => {
        if (!statusMessage) return undefined;

        const timeoutId = setTimeout(() => {
            setStatusMessage("");
            setStatusType("");
        }, 3000);

        return () => clearTimeout(timeoutId);
    }, [statusMessage]);

    const handleViajeSubmit = async (payload) => {
        setIsSubmitting(true);
        setStatusMessage("");
        setStatusType("");
        try {
            await saveViaje(payload);
            setStatusType("success");
            setStatusMessage("Viaje guardado correctamente.");
        } catch (error) {
            setStatusType("error");
            setStatusMessage(error.message || "No se pudo guardar el viaje.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGastoSubmit = async (payload) => {
        setIsSubmitting(true);
        setStatusMessage("");
        setStatusType("");
        try {
            await saveGasto(payload);
            setStatusType("success");
            setStatusMessage("Gasto guardado correctamente.");
        } catch (error) {
            setStatusType("error");
            setStatusMessage(error.message || "No se pudo guardar el gasto.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemitoSubmit = async (payload) => {
        setIsSubmitting(true);
        setStatusMessage("");
        setStatusType("");
        try {
            await saveRemito(payload);
            setStatusType("success");
            setStatusMessage("Remito guardado correctamente.");
            setRemitoFormKey((prev) => prev + 1);
        } catch (error) {
            setStatusType("error");
            setStatusMessage(error.message || "No se pudo guardar el remito.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='flex h-full w-full flex-col items-center justify-start gap-6 overflow-y-hidden pt-5 bg-gray-100 dark:bg-gray-900'>
            <img src={logoSrc} className='h-30 w-30 rounded-full' alt="Logo" />
            <div className="flex w-100 gap-4 justify-center flex-row">
                <Button
                    onClick={() => setActiveForm("viajes")}
                    className={`btn ${activeForm === "viajes" ? "btn-active" : "btn-inactive"}`}
                >
                    Viajes
                </Button>
                <Button
                    onClick={() => setActiveForm("gastos")}
                    className={`btn ${activeForm === "gastos" ? "btn-active" : "btn-inactive"}`}
                >
                    Gastos
                </Button>
                <Button
                    onClick={() => setActiveForm("remitos")}
                    className={`btn ${activeForm === "remitos" ? "btn-active" : "btn-inactive"}`}
                >
                    Remitos
                </Button>
            </div>

            {activeForm === "viajes"
                ? <FormViajes onSubmit={handleViajeSubmit} isSubmitting={isSubmitting} />
                : activeForm === "gastos"
                    ? <FormGastos onSubmit={handleGastoSubmit} isSubmitting={isSubmitting} />
                    : activeForm === "remitos"
                        ? <FormRemito key={remitoFormKey} onSubmit={handleRemitoSubmit} isSubmitting={isSubmitting} />
                        : null
            }
            {statusMessage ? (
                <p className={statusType === "success" ? "text-green-600" : "text-red-600"}>
                    {statusMessage}
                </p>
            ) : null}
        </div>
    )
}
