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

function cleanUsername(value) {
  let base = String(value || 'user')
    .trim()
    .replace(/\s+/g, '_');

  base = base.replace(/[^a-zA-Z0-9_.-]/g, '');

  if (base.length < 3) {
    base = 'user';
  }

  return base.slice(0, 40);
}

async function makeAvailableUsername(requested) {
  const base = cleanUsername(requested);

  let candidate = base;

  for (let i = 0; i < 30; i++) {
    const escaped = candidate.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const exists = await UserModel.findOne({
      username: new RegExp(`^${escaped}$`, 'i')
    })
      .select('_id')
      .lean();

    if (!exists) {
      return candidate;
    }

    const suffix = Math.random()
      .toString(36)
      .slice(2, 7);

    candidate =
      `${base.slice(0, 34)}_${suffix}`;
  }

  return `${base.slice(0, 30)}_${Date.now().toString(36)}`;
}

const User = {
  async findById(id) {
    if (!id) return null;

    const user = await UserModel
      .findById(id)
      .lean();

    return normalize(user);
  },

  async findByLogin(login) {
    const value = String(login || '')
      .trim()
      .toLowerCase();

    if (!value) return null;

    const escaped = value.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const user = await UserModel.findOne({
      $or: [
        { login: value },
        { email: value },
        {
          username: new RegExp(
            `^${escaped}$`,
            'i'
          )
        }
      ]
    }).lean();

    return normalize(user);
  },

  async findByGoogleSub(sub) {
    if (!sub) return null;

    const user = await UserModel.findOne({
      googleSub: String(sub)
    }).lean();

    return normalize(user);
  },

  async createLocal({
    username,
    email,
    login,
    passwordHash
  }) {
    const safeEmail = String(email || '')
      .trim()
      .toLowerCase();

    const safeLogin = String(
      login || safeEmail || username
    )
      .trim()
      .toLowerCase();

    const safeUsername =
      await makeAvailableUsername(username);

    const created = await UserModel.create({
      username: safeUsername,

      ...(safeEmail
        ? { email: safeEmail }
        : {}),

      login: safeLogin,
      passwordHash,
      provider: 'local'
    });

    return normalize(created);
  },

  async createGoogle({
    username,
    email,
    sub
  }) {
    const safeEmail = String(email || '')
      .trim()
      .toLowerCase();

    const safeUsername =
      await makeAvailableUsername(username);

    const created = await UserModel.create({
      username: safeUsername,
      email: safeEmail,
      login: safeEmail,
      passwordHash: null,
      provider: 'google',
      googleSub: String(sub)
    });

    return normalize(created);
  }
};

module.exports = User;
