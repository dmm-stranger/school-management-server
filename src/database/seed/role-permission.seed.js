import mongoose from "mongoose";
import dotenv from "dotenv";
import "../models.registry.js";
import Permission from "../../modules/permission/permission.model.js";
import Role from "../../modules/role/role.model.js";
import databaseConfig from "../../config/database.js";
import logger from "../../config/logger.js";

dotenv.config();

// Resources per 05-rbac.md §Resource Examples
const RESOURCES = [
  "student",
  "teacher",
  "staff",
  "guardian",
  "user",
  "role",
  "permission",
  "building",
  "room",
  "academic",
  "subject",
  "assignment",
  "enrollment",
  "routine",
  "attendance",
  "exam",
  "result",
  "finance",
  "library",
  "transport",
  "hostel",
  "notification",
  "settings",
  "report",
];

const ACTIONS = ["create", "read", "update", "delete", "list", "export", "import", "approve", "publish", "assign"];

// Role → permission key patterns, derived from 05-rbac.md §Role Responsibilities
const ROLE_PERMISSION_KEYS = {
  SUPER_ADMIN: "ALL", // handled specially — authorize() always passes SUPER_ADMIN
  ADMIN: RESOURCES.filter((r) => r !== "settings").flatMap((r) =>
    ACTIONS.map((a) => `${r}:${a}`)
  ),
  PRINCIPAL: [
    "student",
    "teacher",
    "academic",
    "subject",
    "assignment",
    "enrollment",
    "routine",
    "attendance",
    "exam",
    "result",
    "report",
  ].flatMap((r) => ACTIONS.map((a) => `${r}:${a}`)),
  VICE_PRINCIPAL: [
    "student",
    "teacher",
    "academic",
    "subject",
    "assignment",
    "enrollment",
    "routine",
    "attendance",
    "exam",
    "result",
    "report",
  ].flatMap((r) => ["read", "list", "update"].map((a) => `${r}:${a}`)),
  ACCOUNTANT: ["finance", "report"].flatMap((r) => ACTIONS.map((a) => `${r}:${a}`)),
  TEACHER: [
    "student:read",
    "student:list",
    "academic:read",
    "academic:list",
    "subject:read",
    "subject:list",
    "assignment:read",
    "assignment:list",
    "enrollment:read",
    "enrollment:list",
    "routine:read",
    "attendance:create",
    "attendance:read",
    "attendance:update",
    "exam:read",
    "result:create",
    "result:update",
    "result:read",
    // Library members: browse the catalog + see their OWN loans/fines (scoped in the service layer).
    "library:read",
    "library:list",
  ],
  STAFF: ["routine:read", "notification:read", "library:read", "library:list"],
  LIBRARIAN: ["library:create", "library:read", "library:update", "library:list"],
  STUDENT: [
    "routine:read",
    "attendance:read",
    "result:read",
    "finance:read",
    "academic:read",
    "enrollment:read",
    "user:update", // limited profile self-update, enforced at service layer
    "library:read",
    "library:list",
  ],
  GUARDIAN: [
    "student:read",
    "attendance:read",
    "result:read",
    "finance:read",
    "notification:read",
    "academic:read",
    "enrollment:read",
  ],
  RECEPTIONIST: ["student:read", "student:list", "guardian:read", "notification:create"],
  SPORT_OFFICER: ["student:read", "student:list", "report:read"],
};

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice Principal",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  STAFF: "Staff",
  LIBRARIAN: "Librarian",
  STUDENT: "Student",
  GUARDIAN: "Guardian",
  RECEPTIONIST: "Receptionist",
  SPORT_OFFICER: "Sport Officer",
};

const run = async () => {
  await mongoose.connect(databaseConfig.uri);
  logger.info("Connected to MongoDB for seeding.");

  // 1. Seed all resource:action permissions
  const permissionDocs = [];
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      permissionDocs.push({ resource, action, key: `${resource}:${action}` });
    }
  }

  const permissionMap = new Map();
  for (const doc of permissionDocs) {
    const permission = await Permission.findOneAndUpdate(
      { key: doc.key },
      { $setOnInsert: doc },
      { upsert: true, new: true }
    );
    permissionMap.set(permission.key, permission._id);
  }
  logger.info(`Seeded ${permissionMap.size} permissions.`);

  // 2. Seed roles with their permission sets
  for (const [roleName, keys] of Object.entries(ROLE_PERMISSION_KEYS)) {
    const permissionIds =
      keys === "ALL"
        ? Array.from(permissionMap.values())
        : keys.map((key) => permissionMap.get(key)).filter(Boolean);

    await Role.findOneAndUpdate(
      { name: roleName },
      {
        name: roleName,
        label: ROLE_LABELS[roleName],
        permissions: permissionIds,
        isSystemRole: true,
      },
      { upsert: true, new: true }
    );
  }
  logger.info(`Seeded ${Object.keys(ROLE_PERMISSION_KEYS).length} roles.`);

  await mongoose.disconnect();
  logger.info("Seeding completed.");
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
