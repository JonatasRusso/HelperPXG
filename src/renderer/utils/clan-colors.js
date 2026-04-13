const CLAN_COLORS = {
  gardestrike: '#ad5b25',
  ironhard:    '#ffffff',
  malefic:     '#ae00ff',
  naturia:     '#0c450e',
  orebound:    '#453203',
  psycraft:    '#ff00bb',
  raibolt:     '#ffdd00',
  seavell:     '#001eff',
  volcanic:    '#ff0000',
  wingeon:     '#6678ff',
};

const CLAN_COLORS_2 = {
  gardestrike: '#d5b072',
  ironhard:    '#ffffff',
  malefic:     '#000000',
  naturia:     '#00ff0d',
  orebound:    '#c9af6e',
  psycraft:    '#ff00d0',
  raibolt:     '#ffdd00',
  seavell:     '#00ccff',
  volcanic:    '#ff0000',
  wingeon:     '#ffffff',
};

function clanColor(clan, fallback) {
  return CLAN_COLORS[clan] || fallback;
}

function clanColor2(clan, fallback) {
  return CLAN_COLORS_2[clan] || fallback;
}
