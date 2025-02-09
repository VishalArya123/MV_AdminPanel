// SidebarItem.jsx
const SidebarItem = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive 
          ? 'bg-emerald-50 border-r-4 border-emerald-500 text-emerald-700' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};

export default SidebarItem;