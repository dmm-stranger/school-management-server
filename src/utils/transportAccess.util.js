/** Same convention as utils/libraryAccess.util.js: transport:create marks a manager (Transport Admin/Admin). */
export const isTransportManager = (user) => {
  const roles = user.roleIds || [];
  if (roles.some((r) => r.name === "SUPER_ADMIN")) return true;
  return roles.some((r) => (r.permissions || []).some((p) => p.key === "transport:create"));
};
