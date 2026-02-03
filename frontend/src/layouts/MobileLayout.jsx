
function MobileLayout({ children }) {
    return (
        <div className="flex min-h-screen min-h-dvh w-screen flex-col items-stretch justify-start bg-gray-100 dark:bg-gray-900">
            {children}
        </div>
    )
}

export default MobileLayout
