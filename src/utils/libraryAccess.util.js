/**
 * Students, teachers and staff hold library:read/list (to browse the catalog
 * and see their OWN loans). Librarian/Admin hold library:create. So
 * "library:create" is the marker for a library manager, who may see everyone's
 * records; anyone else is forced to their own userId in the controller.
 * Backend is the real authority here — the UI only mirrors it.
 */
export const isLibraryManager = (user) => {
  const roles = user.roleIds || [];
  if (roles.some((r) => r.name === "SUPER_ADMIN")) return true;
  return roles.some((r) => (r.permissions || []).some((p) => p.key === "library:create"));
};
