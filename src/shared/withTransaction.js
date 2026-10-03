import mongoose from "mongoose";

/** Runs callback inside a MongoDB transaction — required for Book Issue/Return per 02-database-design.md §3.4. */
export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } finally {
    session.endSession();
  }
};
