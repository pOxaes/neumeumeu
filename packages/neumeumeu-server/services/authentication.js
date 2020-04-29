const crypto = require("crypto");
const { google } = require("googleapis");
const Errors = require("neumeumeu-common/constants/errors");
const { r } = require("../database");

function getPlayerFromToken(token) {
  if (!token) {
    return Promise.reject(Errors.INVALID_TOKEN);
  }

  return r
    .table("player")
    .filter(player => player("tokens").contains(token))
    .limit(1)
    .run()
    .then(players => {
      if (players.length !== 1) {
        return Promise.reject(Errors.INVALID_TOKEN);
      }

      return players[0];
    });
}

function simplePlayer(player) {
  return {
    id: player.id,
    name: player.name,
  };
}

async function loginFromGoogle(authorizationCode) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  const { tokens } = await oauth2Client.getToken(authorizationCode);
  oauth2Client.setCredentials({ access_token: tokens.access_token });

  try {
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    const { data } = await oauth2.userinfo.get();
    return login(simpleProfile(data));
  } catch (e) {
    return Promise.reject("Error while loading with google");
  }
}

function simpleProfile(data) {
  return {
    name: data.given_name,
    avatarURL: data.picture || "",
    email: data.email,
  };
}

async function login(profile) {
  if (!profile.email) {
    return new Promise.reject("An email is needed");
  }

  const playersByEmail = await r
    .table("player")
    .filter({ email: profile.email })
    .limit(1)
    .run();

  let player = playersByEmail[0];

  if (!player) {
    player = await createPlayer(profile);
  }

  const token = await createToken(player);

  return {
    player: simplePlayer(player),
    token,
  };
}

async function createPlayer(profile) {
  const newPlayer = {
    name: profile.name,
    email: profile.email,
    avatarURL: profile.avatarURL,
    tokens: [],
  };

  const result = await r
    .table("player")
    .insert(newPlayer)
    .run();

  const newPlayerWithId = Object.assign(
    { id: result.generated_keys[0] },
    newPlayer
  );

  return newPlayerWithId;
}

async function createToken(player) {
  const token = generateToken();

  await r
    .table("player")
    .get(player.id)
    .update({
      tokens: r.row("tokens").append(token),
    })
    .run();

  return token;
}

function logout(token) {
  return r
    .table("player")
    .update({ tokens: r.row("tokens").difference([token]) })
    .run();
}

function generateToken() {
  return crypto.randomBytes(48).toString("hex");
}

module.exports = {
  loginFromGoogle,
  logout,
  getPlayerFromToken,
};
