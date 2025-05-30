import Header from "@/components/header";
import { Github } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div>
      <div className="grid-background"></div>
      <main className="min-h-screen container">
        <Header />
        <Outlet />
      </main>
      <div className="relative w-full mt-10">
  <div className="backdrop-blur-md bg-transparent border-t-4 border-white/10 shadow-lg rounded-t-xl px-6 py-8 ">
  <p className="text-sm sm:text-base text-white font-medium text-center">
    2025 © All rights reserved. 
  </p>
    <p className="text-sm sm:text-base text-white font-medium text-center">
      Made with ❤ by <span className="text-indigo-300 font-semibold">@Sjx</span>
    </p>
    {/* <div className="bg-gray-700 bg-opacity-50 w-36  rounded-2xl"> */}
    <Link className="flex -mb-4 p-0.5 mt-2 justify-center items-center text-gray-400" to="https://github.com/SjxSubham/JOB-SEEK">
  <Github color="#a4b5bc" strokeWidth={1} />Github
    </Link>
    {/* </div> */}
  </div>
</div>

    </div>
  );
};

export default AppLayout;
