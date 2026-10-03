import ApiError from "./ApiError.js";
import ApiResponse from "./ApiResponse.js";
import asyncHandler from "./asyncHandler.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds the service + controller for a simple "named reference record"
 * (BookCategory, Author, Publisher). All three share identical rules:
 * case-insensitive unique name, soft delete, delete blocked while in use.
 * A factory keeps them consistent instead of three copy-pasted modules.
 */
export const createLookupCrud = ({ Model, label, countInUse }) => {
  const notFound = () => ApiError.notFound(`${label} not found.`);

  const assertNameFree = async (name, ignoreId) => {
    const existing = await Model.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
      isDeleted: false,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    });
    if (existing) throw ApiError.conflict(`${label} "${name}" already exists.`);
  };

  const service = {
    async create(payload, userId) {
      await assertNameFree(payload.name);
      return Model.create({ ...payload, createdBy: userId });
    },

    async list({ page, limit, search, status, sort }) {
      const filter = { isDeleted: false };
      if (status) filter.status = status;
      if (search) filter.name = new RegExp(escapeRegex(search), "i");

      const [data, total] = await Promise.all([
        Model.find(filter)
          .sort(sort || "name")
          .skip((page - 1) * limit)
          .limit(limit),
        Model.countDocuments(filter),
      ]);
      return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    },

    async getById(id) {
      const doc = await Model.findOne({ _id: id, isDeleted: false });
      if (!doc) throw notFound();
      return doc;
    },

    async update(id, updates) {
      const doc = await Model.findOne({ _id: id, isDeleted: false });
      if (!doc) throw notFound();
      if (updates.name && updates.name.toLowerCase() !== doc.name.toLowerCase()) {
        await assertNameFree(updates.name, id);
      }
      Object.assign(doc, updates);
      await doc.save();
      return doc;
    },

    async remove(id) {
      const doc = await Model.findOne({ _id: id, isDeleted: false });
      if (!doc) throw notFound();
      const inUse = await countInUse(doc._id);
      if (inUse > 0) {
        throw ApiError.conflict(
          `${label} is used by ${inUse} book(s). Reassign or deactivate it instead of deleting.`
        );
      }
      doc.isDeleted = true;
      doc.status = "INACTIVE";
      await doc.save();
    },
  };

  const parsePaging = (query) => ({
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(100, Number(query.limit) || 20),
  });

  const controller = {
    create: asyncHandler(async (req, res) => {
      const doc = await service.create(req.body, req.user._id);
      res.status(201).json(new ApiResponse(201, doc, `${label} created.`));
    }),
    list: asyncHandler(async (req, res) => {
      const result = await service.list({
        ...parsePaging(req.query),
        search: req.query.search,
        status: req.query.status,
        sort: req.query.sort,
      });
      res.status(200).json(new ApiResponse(200, result, `${label} list fetched.`));
    }),
    getById: asyncHandler(async (req, res) => {
      res.status(200).json(new ApiResponse(200, await service.getById(req.params.id), `${label} fetched.`));
    }),
    update: asyncHandler(async (req, res) => {
      res.status(200).json(new ApiResponse(200, await service.update(req.params.id, req.body), `${label} updated.`));
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      res.status(200).json(new ApiResponse(200, null, `${label} deleted.`));
    }),
  };

  return { service, controller };
};
