import React from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";

const Logout = () => {
  const { user, logout } = useAuth();
  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="hidden md:inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
          <UserOutlined className="mr-1" />{user.email}
        </span>
      )}
      <Button
        type="primary"
        icon={<LogoutOutlined />}
        onClick={logout}
        className="!rounded-full !px-5 !py-2 !font-semibold !shadow-sm hover:!bg-primary-600 transition-all duration-150"
      >
        Logout
      </Button>
    </div>
  );
};

export default Logout; 