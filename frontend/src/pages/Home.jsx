import { useState } from "react";
import FormViajes from "../components/FormViajes";
import FormGastos from "../components/FormGastos";
import Button from "../components/Button";

export default function Home() {
    const [activeForm, setActiveForm] = useState("viajes");
    const logoSrc = `${import.meta.env.BASE_URL}logo_transvaal.png`;

    return (
        <div className='flex h-full w-full flex-col items-center justify-start gap-6 pt-10 bg-gray-100 dark:bg-gray-900'>
            <img src={logoSrc} className='h-30 w-30 rounded-full' alt="Logo" />
            <div className="flex w-full gap-4 justify-center flex-row">
                <Button
                    onClick={() => setActiveForm("viajes")}
                    className={`btn ${activeForm === "viajes" ? "btn-active" : "btn-inactive"}`}
                >
                    Nuevo Viaje
                </Button>
                <Button
                    onClick={() => setActiveForm("gastos")}
                    className={`btn ${activeForm === "gastos" ? "btn-active" : "btn-inactive"}`}
                >
                    Cargar Gastos
                </Button>
            </div>

            {activeForm === "viajes" ? <FormViajes /> : <FormGastos />}
            <Button onClick={() => alert('Button clicked!')} className="btn">Enviar</Button>
        </div>
    )
}
