const INDEX_PATH = "./data/raids.json";

export async function loadRaidsIndex() {
  const response = await fetch(INDEX_PATH);
  if (!response.ok) {
    throw new Error("无法读取 raids.json");
  }
  return response.json();
}

export function flattenBosses(indexData) {
  return indexData.raids.flatMap((raid) =>
    raid.bosses.map((boss) => ({
      ...boss,
      raidTitle: raid.title,
      raidSlug: raid.slug,
    }))
  );
}

export async function loadBossById(id) {
  const indexData = await loadRaidsIndex();
  const boss = flattenBosses(indexData).find((item) => item.id === id);

  if (!boss) {
    throw new Error(`未找到 Boss: ${id}`);
  }

  if (!boss.jsonPath) {
    return {
      boss,
      details: null
    };
  }

  const response = await fetch(boss.jsonPath);
  if (!response.ok) {
    throw new Error(`无法读取 Boss JSON: ${boss.jsonPath}`);
  }

  return {
    boss,
    details: await response.json()
  };
}
