import LoginForm from '../components/LoginForm.jsx'

export default function Login() {
    return (
        <div className='flex h-full vw-100 flex-col items-center justify-start gap-6 pt-10 bg-gray-100 dark:bg-gray-900'>
            <img src="/logo_transvaal.png" className='h-30 w-30 rounded-full' alt="Logo" />
            <h2 className='dark-black text-xl dark:text-white'>Inicia Sesion</h2>
            <LoginForm />
        </div>
    )
}
