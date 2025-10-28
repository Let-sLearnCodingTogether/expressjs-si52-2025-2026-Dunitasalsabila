const Idea = require('../model/ideaModel');
const Tag = require('../model/tagModel');
const statusConfig = require('../config/statusConfig');

function sanitizeIdea(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id,
    ideaName: o.ideaName,
    description: o.description,
    status: o.status,
    statusInfo: statusConfig[o.status] || { key: o.status, label: o.status, emoji: '' },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    tags: Array.isArray(o.tags)
      ? o.tags.map(t => (t && t.name ? { id: t._id, name: t.name } : { id: t, name: null }))
      : [],
    assignedTo: o.assignedTo && o.assignedTo._id ? { id: o.assignedTo._id, username: o.assignedTo.username } : (o.assignedTo ? { id: o.assignedTo } : null),
  };
}

exports.getIdeas = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

  const ideas = await Idea.find({ user: userId }).sort({ createdAt: -1 }).populate('tags', 'name').populate('assignedTo', 'username');
    res.json(ideas.map(sanitizeIdea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getCompletedForCurrentUser = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const ideas = await Idea.find({ user: userId, status: 'done' }).sort({ updatedAt: -1 }).populate('tags', 'name').populate('assignedTo', 'username');
    res.json(ideas.map(sanitizeIdea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getCompletedForUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (!targetUserId) return res.status(400).json({ message: 'User id diperlukan' });

    const ideas = await Idea.find({ user: targetUserId, status: 'done' }).sort({ updatedAt: -1 }).populate('tags', 'name').populate('assignedTo', 'username').populate('user', 'username');
    res.json(ideas.map(sanitizeIdea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createIdea = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

  const { ideaName, description, status, tags } = req.body;
    if (!ideaName || ideaName.trim().length === 0) {
      return res.status(400).json({ message: 'Nama ide wajib diisi' });
    }


    if (ideaName.trim().length > 100) {
      return res.status(400).json({ message: 'Nama ide maksimal 100 karakter' });
    }
    if (description && description.length > 1000) {
      return res.status(400).json({ message: 'Deskripsi maksimal 1000 karakter' });
    }

    if (status && !['idea', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }


    let tagIds = [];
    if (tags) {
      if (!Array.isArray(tags)) return res.status(400).json({ message: 'Tags harus berupa array id' });
      tagIds = tags;
      const found = await Tag.find({ _id: { $in: tagIds }, user: userId }).select('_id');
      if (found.length !== tagIds.length) return res.status(400).json({ message: 'Salah satu tag tidak ditemukan atau bukan milik Anda' });
    }

    const newIdea = new Idea({ user: userId, ideaName: ideaName.trim(), description, status, tags: tagIds });
    await newIdea.save();
    await newIdea.populate('tags', 'name');
    res.status(201).json(sanitizeIdea(newIdea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIdea = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

  const idea = await Idea.findOne({ _id: req.params.id, user: userId }).populate('tags', 'name').populate('assignedTo', 'username');
    if (!idea) return res.status(404).json({ message: 'Idea tidak ditemukan atau bukan milik Anda' });
    res.json(sanitizeIdea(idea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateIdea = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const updates = {};
    const allowed = ['ideaName', 'description', 'status', 'tags'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.status && !['idea', 'in-progress', 'done'].includes(updates.status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    if (updates.ideaName && updates.ideaName.trim().length === 0) {
      return res.status(400).json({ message: 'Nama ide tidak boleh kosong' });
    }

    if (updates.ideaName && updates.ideaName.trim().length > 100) {
      return res.status(400).json({ message: 'Nama ide maksimal 100 karakter' });
    }
    if (updates.description && updates.description.length > 1000) {
      return res.status(400).json({ message: 'Deskripsi maksimal 1000 karakter' });
    }

    if (updates.tags !== undefined) {
      if (!Array.isArray(updates.tags)) return res.status(400).json({ message: 'Tags harus berupa array id' });
      const found = await Tag.find({ _id: { $in: updates.tags }, user: userId }).select('_id');
      if (found.length !== updates.tags.length) return res.status(400).json({ message: 'Salah satu tag tidak ditemukan atau bukan milik Anda' });
    }

    const idea = await Idea.findOneAndUpdate({ _id: req.params.id, user: userId }, { $set: updates }, { new: true }).populate('tags', 'name').populate('assignedTo', 'username');
    if (!idea) return res.status(404).json({ message: 'Idea tidak ditemukan atau bukan milik Anda' });
    res.json(sanitizeIdea(idea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteIdea = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const idea = await Idea.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!idea) return res.status(404).json({ message: 'Idea tidak ditemukan atau bukan milik Anda' });
    res.json({ message: 'Idea dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.takeIdea = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });
    const updated = await Idea.findOneAndUpdate(
      { _id: req.params.id, $or: [{ assignedTo: null }, { assignedTo: userId }] },
      { $set: { assignedTo: userId, status: 'in-progress' } },
      { new: true }
    ).populate('tags', 'name').populate('assignedTo', 'username');

    if (!updated) {
      const exists = await Idea.findById(req.params.id).select('assignedTo');
      if (!exists) return res.status(404).json({ message: 'Idea tidak ditemukan' });
      return res.status(400).json({ message: 'Idea sudah diambil oleh orang lain' });
    }

    res.json(sanitizeIdea(updated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.releaseIdea = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea tidak ditemukan' });

    const isOwner = idea.user && idea.user.toString() === userId;
    const isAssigned = idea.assignedTo && idea.assignedTo.toString() === userId;
    if (!isOwner && !isAssigned) return res.status(403).json({ message: 'Tidak diizinkan melepaskan idea ini' });

    idea.assignedTo = null;
    idea.status = 'idea';
    await idea.save();
    await idea.populate('tags', 'name');
    res.json(sanitizeIdea(idea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeIdea = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea tidak ditemukan' });

    const isOwner = idea.user && idea.user.toString() === userId;
    const isAssigned = idea.assignedTo && idea.assignedTo.toString() === userId;
    if (!isOwner && !isAssigned) return res.status(403).json({ message: 'Tidak diizinkan menyelesaikan idea ini' });

    idea.status = 'done';
    idea.assignedTo = null;
    await idea.save();
    await idea.populate('tags', 'name');
    res.json(sanitizeIdea(idea));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
