import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const ROLES = {
  ADMIN: { id: 'admin', label: 'System Admin', badgeColor: 'bg-purple-900/60 text-purple-300 border-purple-700/50' },
  BEEKEEPER: { id: 'beekeeper', label: 'Beekeeper', badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700/50' },
  INSPECTOR: { id: 'inspector', label: 'Quality Inspector', badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/50' },
  TRANSPORTER: { id: 'transporter', label: 'Transporter', badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50' },
  CUSTOMER: { id: 'customer', label: 'Public Customer', badgeColor: 'bg-stone-800 text-stone-300 border-stone-700' },
};

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(ROLES.ADMIN);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('hc_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('hc_token') || null);

  const setRoleById = (roleId) => {
    // Lock role to user's real authenticated role if logged in
    if (user && user.role) {
      const userRoleObj = Object.values(ROLES).find(r => r.id === user.role);
      if (userRoleObj) setCurrentRole(userRoleObj);
      return;
    }
    const found = Object.values(ROLES).find(r => r.id === roleId);
    if (found) setCurrentRole(found);
  };

  useEffect(() => {
    if (user && user.role) {
      const userRoleObj = Object.values(ROLES).find(r => r.id === user.role);
      if (userRoleObj) setCurrentRole(userRoleObj);
    }
  }, [user]);

  const loginAuth = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    if (authToken) localStorage.setItem('hc_token', authToken);
    if (userData) {
      localStorage.setItem('hc_user', JSON.stringify(userData));
      const userRoleObj = Object.values(ROLES).find(r => r.id === userData.role);
      if (userRoleObj) setCurrentRole(userRoleObj);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_user');
    setCurrentRole(ROLES.ADMIN);
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        setRoleById,
        ROLES,
        user,
        token,
        isAuthenticated: !!user,
        loginAuth,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
