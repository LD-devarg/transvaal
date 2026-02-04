import { useEffect, useState } from "react";
import { fetchViajesFormOptions } from "../services/authApi";

export function useCatalogos() {
  const [clientes, setClientes] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      setOptionsError("");
      try {
        const data = await fetchViajesFormOptions();
        setClientes(data.clientes || []);
        setChoferes(data.choferes || []);
      } catch (error) {
        setOptionsError(error.message || "No se pudieron cargar opciones");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  return { clientes, choferes, loadingOptions, optionsError };
}
