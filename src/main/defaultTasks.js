const TIER_NAMES = ['Rookie','Bronze','Silver','Gold','Platinum','Diamond','Ace','Ultra','Hyper','Master','Grand Master'];

// Sequential tiers starting from Rookie
function makeTiers(costs) {
  return costs.map((c, i) => ({ name: TIER_NAMES[i], energyCost: c }));
}

// Named tiers — specify exact names (must exist in TIER_NAMES)
function nt(pairs) {
  return pairs.map(([name, cost]) => ({ name, energyCost: cost }));
}

const DEFAULT_TASKS = [
  // ── Blue energy tasks ────────────────────────────────────────────────────
  { slug: 'rocket-hideout',           title: 'Rocket Hideout',                       energyType: 'blue', tiers: makeTiers([100]) },
  { slug: 'operation-radio',          title: 'Operation Radio',                      energyType: 'blue', tiers: makeTiers([92]) },
  { slug: 'mewtwo-strikes-back',      title: 'Mewtwo Strikes Back',                  energyType: 'blue', tiers: makeTiers([80]) },
  { slug: 'forest-of-illusions',      title: 'Forest of Illusions',                  energyType: 'blue', tiers: nt([['Rookie',20],['Bronze',20],['Silver',32],['Platinum',48]]) },
  { slug: 'battle-tree-house',        title: 'Battle Tree House',                    energyType: 'blue', tiers: nt([['Rookie',20],['Silver',24],['Platinum',20]]) },
  { slug: 'music-challenge',          title: 'Music Challenge',                      energyType: 'blue', tiers: nt([['Rookie',20],['Silver',12],['Platinum',12],['Diamond',12],['Ace',20]]) },
  { slug: 'sylvesters-farfetchd',     title: "Sylvester's Ferfetch'd",               energyType: 'blue', tiers: nt([['Bronze',4],['Silver',12],['Platinum',20],['Ace',20],['Ultra',20]]) },
  { slug: 'ecruteak-maze',            title: 'Ecruteak Maze',                        energyType: 'blue', tiers: makeTiers([10]) },
  { slug: 'fishing-competition',      title: 'Fishing Competition',                  energyType: 'blue', tiers: nt([['Bronze',20],['Silver',20],['Gold',20],['Platinum',40]]) },
  { slug: 'photography-challenge',    title: 'Photography Challenge',                energyType: 'blue', tiers: nt([['Bronze',36],['Silver',20],['Gold',20],['Platinum',20],['Diamond',20]]) },
  { slug: 'sewers-infestation',       title: 'Sewers Infestation',                   energyType: 'blue', tiers: nt([['Bronze',20],['Silver',24],['Gold',28],['Platinum',32]]) },
  { slug: 'slowpoke-well-showdown',   title: 'The Slowpoke Well Showdown',           energyType: 'blue', tiers: nt([['Bronze',76],['Silver',68],['Gold',70],['Diamond',70]]) },
  { slug: 'tour-de-alto-mare',        title: 'Tour de Alto Mare',                    energyType: 'blue', tiers: nt([['Bronze',20],['Silver',25],['Gold',60],['Platinum',65]]) },
  { slug: 'combat-art',               title: 'Combat Art',                           energyType: 'blue', tiers: makeTiers([20]) },
  { slug: 'call-of-the-megas',        title: 'The Call of the Megas',                energyType: 'blue', tiers: makeTiers([40]) },
  { slug: 'cyber-world',              title: 'Cyber World',                          energyType: 'blue', tiers: makeTiers([58]) },
  { slug: 'dreams-or-nightmares',     title: 'Dreams or Nightmares?',                energyType: 'blue', tiers: makeTiers([20]) },
  { slug: 'fishing-cruise',           title: 'Fishing Cruise',                       energyType: 'blue', tiers: nt([['Diamond',30],['Ace',42],['Ultra',50]]) },
  { slug: 'rocket-ambush',            title: 'Rocket Ambush',                        energyType: 'blue', tiers: makeTiers([32]) },
  { slug: 'ultimate-challenge',       title: 'The Ultimate Challenge',               energyType: 'blue', tiers: nt([['Diamond',12],['Ultra',16],['Hyper',20],['Master',24]]) },
  { slug: 'whirl-cup',                title: 'Whirl Cup',                            energyType: 'blue', tiers: makeTiers([44]) },
  { slug: 'iron-masked-marauder',     title: 'The Iron-Masked Marauder',             energyType: 'blue', tiers: makeTiers([46]) },
  // ── Red energy tasks ─────────────────────────────────────────────────────
  { slug: 'the-red-gyarados',         title: 'The Red Gyarados',                     energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-unknown',           title: 'Battle: ???',                          energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-alpha-ursaluna',    title: 'Battle: Alpha Ursaluna',               energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'muchmoney-precious',       title: 'Muchmoney and the runaway Precious',   energyType: 'red',  tiers: makeTiers([40]) },
  { slug: 'below-zero',               title: 'Below Zero',                           energyType: 'red',  tiers: makeTiers([40]) },
  { slug: 'dorabelles-wrath',         title: "Dorabelle's Wrath",                    energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'celestial-serpent',        title: 'The Celestial Serpent',                energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'the-darkness',             title: 'The Darkness',                         energyType: 'red',  tiers: makeTiers([40]) },
  { slug: 'magma-insurgency',         title: 'The Magma Insurgency',                 energyType: 'red',  tiers: makeTiers([40]) },
  { slug: 'defeat-the-darkness',      title: 'Defeat The Darkness',                  energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'johto-pokemon-league',     title: 'Johto Pokémon League',                 energyType: 'red',  tiers: makeTiers([100]) },
  { slug: 'battle-alpha-arcanine',    title: 'Battle: Alpha Hisuian Arcanine',       energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-alpha-electrode',   title: 'Battle: Alpha Hisuian Electrode',      energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-alpha-typhlosion',  title: 'Battle: Alpha Hisuian Typhlosion',     energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-alpha-kleavor',     title: 'Battle: Alpha Kleavor',                energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-alpha-overqwill',   title: 'Battle: Alpha Overqwill',              energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-dark-celebi',       title: 'Battle: Dark Celebi',                  energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-alpha-sneasler',    title: 'Battle: Alpha Sneasler',               energyType: 'red',  tiers: makeTiers([52]) },
  { slug: 'battle-mecha-iron-masked', title: 'Battle: Mecha Iron-Masked Marauder',   energyType: 'red',  tiers: makeTiers([52]) },
];

function seedDefaultTasks(store, calcNextResetAt) {
  const tasks = store.get('tasks');
  const existingBySlug = new Map(tasks.filter(t => t.slug).map(t => [t.slug, t]));
  let changed = false;

  // Add missing tasks
  const now = Date.now();
  const missing = DEFAULT_TASKS.filter(t => !existingBySlug.has(t.slug));
  const seeded = missing.map((t, i) => ({
    ...t,
    id: now + i,
    type: 'weekly',
    serverSave: true,
    disabled: false,
    done: false,
    image: null,
    nextResetAt: calcNextResetAt('weekly', true),
  }));
  if (seeded.length) changed = true;

  // Update tiers of existing tasks to fix names/structure
  const updated = tasks.map(t => {
    if (!t.slug) return t;
    const def = DEFAULT_TASKS.find(d => d.slug === t.slug);
    if (!def) return t;
    const tiersJson    = JSON.stringify(t.tiers);
    const defTiersJson = JSON.stringify(def.tiers);
    if (tiersJson === defTiersJson) return t;
    changed = true;
    return { ...t, tiers: def.tiers };
  });

  if (changed) store.set('tasks', [...updated, ...seeded]);
}

module.exports = { DEFAULT_TASKS, seedDefaultTasks };
