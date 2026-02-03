import { useState } from "react"
import { useNavigate } from "react-router-dom"
import LoginForm from '../components/LoginForm.jsx'
import { loginWithPin } from "../services/authApi.js"

export default function Login({ onAuthSuccess }) {
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const navigate = useNavigate()
    const logoSrc = `${import.meta.env.BASE_URL}logo_transvaal.png`

    const handleLogin = async ({ username, pin }) => {
        setIsLoading(true)
        setErrorMessage("")

        try {
            const result = await loginWithPin({ username, pin })
            sessionStorage.setItem("auth_user", JSON.stringify(result.user))
            onAuthSuccess?.()
            navigate("/home", { replace: true })
        } catch (error) {
            setErrorMessage(error.message || "No se pudo iniciar sesion")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='flex h-full w-full flex-col items-center justify-start gap-6 pt-10 bg-gray-100 dark:bg-gray-900'>
            <img src={logoSrc} className='h-30 w-30 rounded-full' alt="Logo" />
            <h2 className='dark-black text-xl dark:text-white'>Inicia Sesion</h2>
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} errorMessage={errorMessage} />
        </div>
    )
}
