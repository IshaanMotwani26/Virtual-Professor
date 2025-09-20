export default function Header() {
  return (
    <div className="flex justify-between items-center py-2 px-8 h-16 w-full shadow">
      <a href="/" className="flex w-fit cursor-pointer">
        <div className="h-12 w-12 aspect-square flex items-center rounded-xl bg-blue-400">
          <img src="/logo.png" alt="logo" className="p-1" />
        </div>
        <div className="pl-4 flex items-center text-2xl font-bold">
          VirtualProfessor
        </div>
      </a>
      <a className="flex cursor-pointer bg-green-400 hover:bg-green-500 transition duration-300 rounded-lg h-full items-center p-2">
        Login
      </a>
    </div>
  )
}
