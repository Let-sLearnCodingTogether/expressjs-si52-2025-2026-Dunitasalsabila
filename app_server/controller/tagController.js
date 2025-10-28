const Tag = require('../model/tagModel');

exports.getTags = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const tags = await Tag.find({ user: userId }).sort({ name: 1 });
    res.json(tags.map(t => ({ id: t._id, name: t.name, description: t.description })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createTag = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Nama tag wajib diisi' });
    }

    const tag = new Tag({ user: userId, name: name.trim(), description });
    await tag.save();
    res.status(201).json({ id: tag._id, name: tag.name, description: tag.description });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Tag dengan nama yang sama sudah ada' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getTag = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const tag = await Tag.findOne({ _id: req.params.id, user: userId });
    if (!tag) return res.status(404).json({ message: 'Tag tidak ditemukan atau bukan milik Anda' });
    res.json({ id: tag._id, name: tag.name, description: tag.description });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name && req.body.name.trim();
    if (req.body.description !== undefined) updates.description = req.body.description;

    if (updates.name && updates.name.length === 0) return res.status(400).json({ message: 'Nama tag tidak boleh kosong' });

    const tag = await Tag.findOneAndUpdate({ _id: req.params.id, user: userId }, { $set: updates }, { new: true });
    if (!tag) return res.status(404).json({ message: 'Tag tidak ditemukan atau bukan milik Anda' });
    res.json({ id: tag._id, name: tag.name, description: tag.description });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Tag dengan nama yang sama sudah ada' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'User tidak terautentikasi' });

    const tag = await Tag.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!tag) return res.status(404).json({ message: 'Tag tidak ditemukan atau bukan milik Anda' });
    res.json({ message: 'Tag dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
