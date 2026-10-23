import Driver from "./driver.model.js";
import Staff from "../staff/staff.model.js";
import ApiError from "../../shared/ApiError.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertLicenseFree = async (licenseNumber, ignoreId) => {
  const existing = await Driver.findOne({
    licenseNumber,
    isDeleted: false,
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
  });
  if (existing) throw ApiError.conflict(`License number "${licenseNumber}" is already registered to another driver.`);
};

export const createDriver = async (payload, userId) => {
  await assertLicenseFree(payload.licenseNumber);
  if (payload.staffId) {
    const staff = await Staff.findOne({ _id: payload.staffId, isDeleted: false });
    if (!staff) throw ApiError.badRequest("Staff record not found.");
  }
  return Driver.create({ ...payload, createdBy: userId });
};

export const listDrivers = async ({ page, limit, search, status }) => {
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { phone: rx }, { licenseNumber: rx }];
  }
  const [data, total] = await Promise.all([
    Driver.find(filter).sort("name").skip((page - 1) * limit).limit(limit),
    Driver.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getDriverById = async (id) => {
  const driver = await Driver.findOne({ _id: id, isDeleted: false });
  if (!driver) throw ApiError.notFound("Driver not found.");
  return driver;
};

export const updateDriver = async (id, updates) => {
  const driver = await Driver.findOne({ _id: id, isDeleted: false });
  if (!driver) throw ApiError.notFound("Driver not found.");
  if (updates.licenseNumber && updates.licenseNumber !== driver.licenseNumber) {
    await assertLicenseFree(updates.licenseNumber, id);
  }
  Object.assign(driver, updates);
  await driver.save();
  return driver;
};

export const deleteDriver = async (id) => {
  const driver = await Driver.findOne({ _id: id, isDeleted: false });
  if (!driver) throw ApiError.notFound("Driver not found.");

  const Vehicle = (await import("../vehicle/vehicle.model.js")).default;
  const inUse = await Vehicle.countDocuments({ driverId: id, isDeleted: false, status: { $ne: "INACTIVE" } });
  if (inUse > 0) throw ApiError.conflict("This driver is assigned to an active vehicle. Reassign the vehicle first.");

  driver.isDeleted = true;
  driver.status = "INACTIVE";
  await driver.save();
};
