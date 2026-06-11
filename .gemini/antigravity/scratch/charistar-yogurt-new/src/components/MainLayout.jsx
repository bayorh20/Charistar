import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <>
      <main className="flex-1 overflow-y-auto overflow-x-hidden h-full pb-28 custom-scrollbar">
        <Outlet />
      </main>
      <Navbar />
    </>
  );
}
