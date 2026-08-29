import React, { createContext, useContext, useState } from 'react';

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

  const setRoleById = (roleId) => {
    const found = Object.values(ROLES).find(r => r.id === roleId);
    if (found) setCurrentRole(found);
  };

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, setRoleById, ROLES }}>
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
