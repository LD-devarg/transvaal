
function LoginForm() {
    return (
        <div className='mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10'>
            <form className="login-form flex flex-col gap-y-4 flex-1 justify-center">
                <div className="form-group">
                    <label htmlFor="password" className='text-black dark:text-white me-2'>PIN:</label>
                    <input type="password" id="password" name="password" required className='bg-gray-100 dark:bg-gray-700 text-black dark:text-white'/>
                </div>
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">Entrar</button>
            </form>
        </div>
    )
}

export default LoginForm
