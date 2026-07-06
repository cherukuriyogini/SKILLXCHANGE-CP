import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SupportTicketModal from './SupportTicketModal';

export default function Layout() {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fe] relative">
      <Navbar />
      <div className="flex flex-1 z-10">
        <Sidebar onSupportClick={() => setShowSupport(true)} />
        <main className="flex-1 p-4 md:p-8 md:ml-64 scroll-smooth min-h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <SupportTicketModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
