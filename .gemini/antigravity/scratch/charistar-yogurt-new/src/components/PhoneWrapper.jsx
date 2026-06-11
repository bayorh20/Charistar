export default function PhoneWrapper({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col">
      {/* Centered Mobile Container on Desktop (max-w-[480px]), Full Width on Mobile */}
      <div id="phone-wrapper" className="w-full max-w-[480px] mx-auto min-h-screen bg-charistar-dark relative text-gray-900 font-sans flex flex-col border-x border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.85)] flex-1">
        {children}
      </div>
    </div>
  );
}
