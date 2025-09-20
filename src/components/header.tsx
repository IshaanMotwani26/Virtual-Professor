export default function Header() {
    return (
        <div className="flex py-4 px-8 h-20 w-full bg-slate-100 shadow">
            <div className="h-full aspect-square flex items-center rounded-xl bg-blue-400">
                <img src="/logo.png" alt="logo" className="p-1"/>
            </div>
            <div className="pl-4 items-center flex text-2xl font-bold">
                VirtualProfessor
            </div>
        </div>
    )
}