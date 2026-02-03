
import { useState } from "react";

function LoginForm({ onSubmit, isLoading = false, errorMessage = "" }) {
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit?.({ username, pin });
    };

    return (
        <div className='mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10'>
            <form className="login-form flex flex-1 flex-col justify-center gap-y-4" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username" className='me-2 text-black dark:text-white'>Nombre:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        required
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className='bg-gray-100 text-black dark:bg-gray-700 dark:text-white'
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className='text-black dark:text-white me-2'>PIN:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        maxLength={4}
                        pattern="[0-9]{4}"
                        required
                        value={pin}
                        onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                        className='bg-gray-100 text-black dark:bg-gray-700 dark:text-white'
                    />
                </div>
                {errorMessage ? <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
                <button type="submit" disabled={isLoading} className="rounded bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60">
                    {isLoading ? "Validando..." : "Entrar"}
                </button>
            </form>
        </div>
    )
}

export default LoginForm
