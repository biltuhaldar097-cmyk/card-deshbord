const UserModel = require('./models/User');

function normalize(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    id: String(u._id || u.id),
    username: u.username,
    email: u.email || '',
    login: u.login,
    password_hash: u.passwordHash || null,
    provider: u.provider,
    google_sub: u.googleSub || null,
    created_at: u.createdAt
  };
}

const User = {
  async findById(id) {
    if (!id) return null;
    const user = await UserModel.findById(id).lean();
    return normalize(user);
  },

  async findByLogin(login) {
    const value = String(login || '').trim().toLowerCase();
    if (!value) return null;
    const user = await UserModel.findOne({
      $or: [
        { login: value },
        { email: value },
        { username: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      ]
    }).lean();
    return normalize(user);
  },

  async findByGoogleSub(sub) {
    if (!sub) return null;
    const user = await UserModel.findOne({ googleSub: String(sub) }).lean();
    return normalize(user);
  },

  async createLocal({ username, email, login, passwordHash }) {
    const created = await UserModel.create({
      username,
      email: email || '',
      login: String(login).toLowerCase(),
      passwordHash,
      provider: 'local'
    });
    return normalize(created);
  },

  async createGoogle({ username, email, sub }) {
    const created = await UserModel.create({
      username,
      email: String(email).toLowerCase(),
      login: String(email).toLowerCase(),
      passwordHash: null,
      provider: 'google',
      googleSub: String(sub)
    });
    return normalize(created);
  }
};

module.exports = User;
