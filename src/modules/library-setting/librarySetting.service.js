import LibrarySetting from "./librarySetting.model.js";

/** Returns the singleton, creating it with defaults on first use. */
export const getLibrarySettings = async () => {
  return LibrarySetting.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const updateLibrarySettings = async (updates, userId) => {
  const settings = await getLibrarySettings();

  const { borrowLimits, ...rest } = updates;
  Object.assign(settings, rest);
  if (borrowLimits) {
    for (const [type, limit] of Object.entries(borrowLimits)) {
      settings.borrowLimits[type] = { ...settings.borrowLimits[type].toObject(), ...limit };
    }
    settings.markModified("borrowLimits");
  }
  settings.updatedBy = userId;
  await settings.save();
  return settings;
};
