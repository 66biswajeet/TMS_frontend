"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/modules/auth/actions";

export type AccountDrawerProps = {
  data: any;
};

export function AccountDrawer({ data }: AccountDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const dispatch = useDispatch();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // const handleLogout = () => {
  //   localStorage.removeItem("currentUser")
  //   router.push("/login")
  // }

  const handleLogout = () => {
    dispatch(logout() as any);
  };

  const menuItems = [
    { icon: "🏠", label: "Home", path: "/" },
    { icon: "👤", label: "Profile", path: "/profile" },
    { icon: "📁", label: "Projects", path: "/projects", badge: "3" },
    { icon: "💳", label: "Subscription", path: "/subscription" },
    { icon: "🛡️", label: "Security", path: "/security" },
    { icon: "⚙️", label: "Account settings", path: "/settings" },
  ];

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
      >
        {data?.name?.charAt(0) || "U"}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {/* Profile Section */}
            <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-semibold border-4 border-blue-500">
                {data?.name?.charAt(0) || "U"}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {data?.name || "Marina Pharmacy User"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {data?.email || "user@marinapharmacy.com"}
              </p>

              <div className="flex justify-center items-center space-x-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm"
                  >
                    {i}
                  </div>
                ))}
                <button className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  +
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    router.push(item.path);
                    handleClose();
                  }}
                  className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="mr-3 text-gray-500 dark:text-gray-400">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
