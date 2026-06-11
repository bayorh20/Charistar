import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-[#0a0a0a] flex justify-center items-center md:p-8">
      {/* Mobile App Container Simulator */}
      <div className="w-full h-full min-h-screen md:min-h-0 md:w-[400px] md:h-[850px] md:max-h-[90vh] bg-charistar-cream dark:bg-[#121212] md:rounded-[45px] md:shadow-xl md:border-[12px] md:border-black overflow-hidden relative text-charistar-dark dark:text-charistar-cream font-sans flex flex-col">
        
        {/* Dynamic Island / Top Notch simulated (optional aesthetic) */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-3xl z-50"></div>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-20 pb-32">
          <Outlet />
        </main>

        <Navbar />
      </div>
    </div>
  );
}
