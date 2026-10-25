/** Same convention as libraryAccess/transportAccess utils: hostel:create marks a manager (Warden/Admin). */
export const isHostelManager = (user) => {
  const roles = user.roleIds || [];
  if (roles.some((r) => r.name === "SUPER_ADMIN")) return true;
  return roles.some((r) => (r.permissions || []).some((p) => p.key === "hostel:create"));
};
