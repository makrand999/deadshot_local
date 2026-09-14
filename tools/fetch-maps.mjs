// tools/fetch-maps.mjs — Download map geometry, lightmaps, textures, and skyboxes
// from deadshot.io for all lobby maps: tf, industry, winter, manor, neon.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TARGET_MAPS_DIR = path.join(ROOT, "gameplay", "client", "maps");
const CLIENT_MAPS_DIR = path.join(ROOT, "client", "maps");

const CDN_BASE = "https://deadshot.io/maps";

// 1x1 42-byte VP8 WebP fallback placeholder for missing textures
const PLACEHOLDER_WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x22, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x20, 0x16, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d,
  0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x0e, 0xc0, 0xfe, 0x25, 0xa4, 0x00,
  0x03, 0x70, 0x00, 0x00, 0x00, 0x00,
]);

const MAP_CONFIGS = {
  tf: {
    hasLightmap1: true,
    skybox: [],
    textures: [
      "Forklift", "BlueIndoorWall", "Ibeam", "RedMetal", "ConcreteFloor",
      "Metal", "CleanRedBrick", "RedBrickDirty", "MetalPlates", "StylizedWood",
      "CleanWood", "DirtyWood", "SheetMetal", "Concrete", "PlainConcrete",
      "ConcreteWall", "ConcreteTileCeiling", "Dirtground003", "Concretefloor2",
      "TextureAtlas", "DirtyGrayBrick",
    ],
  },
  industry: {
    hasLightmap1: true,
    skybox: [],
    textures: [
      "Concrete", "Concrete2", "Pavement", "Brick", "Paragon", "Blue", "Red",
      "Beams", "Atlas", "Wire", "Garage", "MetalLight", "BEAM", "PipeRed",
      "Grid", "DarkMetal", "PipeGrey", "Transformer", "Vent", "Galv",
      "PipeBlue", "WhitePaint", "Machines", "Barrel", "SheetMetal", "Paragon2",
      "LPG", "PipeNew", "LPG-Metal", "WalkwayMetal", "WalkwayPaint",
    ],
  },
  winter: {
    hasLightmap1: true,
    skybox: [
      "out/skybox/skybox.obj",
      "out/skybox/skybox.mtl",
      "out/skybox/ice.webp",
      "out/skybox/water.webp",
      "out/skybox/croppedterrain.webp",
      "out/skybox/aurora.webp",
    ],
    textures: [
      "electricalBox1", "gray", "pureSnow", "cleanWood", "greenWood", "blueWood",
      "metalRoof", "snowyGrass", "oldWood", "basicPlank", "Ibeam", "concretePlates1",
      "glass", "metalicGray", "logs", "grayRock", "logEnd", "concretePlates2",
      "dirtyCorrugatedMetal", "alaskantownsign1", "windowGlass", "mud", "metalplate",
      "Coloredmetalpipe", "oldWhiteBricksSnow", "stylisedWood", "metalplatelengths",
      "redmetal", "OldWoodboardsDark", "redFabric", "metalpipe1", "sawBlade",
      "asphaltGround", "whiteFabric", "electicalBox2", "electricalBox3", "barrell",
      "cruddyDoor", "crateTexture", "DirtGround",
    ],
  },
  manor: {
    hasLightmap1: true,
    skybox: [
      "out/skybox/skybox.obj",
      "out/skybox/Bush2.webp",
    ],
    textures: [
      "Window", "Carpet", "Bush2", "Grass", "Paintings", "Metal", "Plaster",
      "Slate", "Props", "Wood", "Brick2", "Material", "Copper", "Tile",
      "Brick", "StoneFloor", "Bush3", "TrimSheet2", "TrimSheet1", "Flag",
    ],
  },
  neon: {
    hasLightmap1: false,
    skybox: [
      "out/skybox/outskybox.drc",
    ],
    textures: [
      "Concrete", "Drywall", "DrywallWhite", "MetalDoor", "WhiteConcrete",
      "DarkBricks", "WoodFloor", "BlueWall", "BrickFloorOrange", "PlasterCracked",
      "SubwayTile", "Bamboo", "ConcreteTrim", "Grass", "Gravel", "ElectricalProps3",
      "ColoredMetal", "Luggage", "MetalDarkGray", "Asphalt", "ShopTrim",
      "JapaneseRoofTile", "JapaneseTrimSheet", "MetalRoof", "SubwayCeiling",
      "ApartmentProps", "NeonSignBase", "Marble", "Billboards", "FloorTile",
      "SubwayFloor", "WindowsDoors", "BluePanelWall", "BuildingAtlas", "Tarps",
      "ElectricalProps2", "KeiTruck", "ElectricalProps", "Tree", "OutdoorProps",
      "Foliage", "TransTrim", "RoadTrim", "Glass", "NeonSignTrans", "StoneTrim",
      "Graffiti", "TrashDamage", "Fences", "EmissionScroll", "TarpsDynamic",
      "TarpsStatic", "Puddle",
    ],
  },
  newmlab: {
    hasLightmap1: true,
    skybox: [
      "out/skybox/skybox.glb",
    ],
    textures: [
      "bake", "BambooLeaves_clip_nobake", "Bamboo", "bluecontainermat", "CaveFloor",
      "CaveProps", "CaveWall", "ChemicalPropsAlpha_nobake_clip", "ChemicalProps",
      "ConcreteTrim", "CyanPaintedWall", "darkconcrete1", "DefaultMaterial",
      "ElectricalProps2", "ElectricalProps", "Fences_nobake", "fern1", "ForestFloor1",
      "Garage", "Glass", "LabFloor", "LabPropsTransparent_blend_nobake", "LabProps",
      "LabWall", "Lights", "MetalRoof", "moss1", "Moss1", "MossTrans_nobake_clip",
      "mushroom1", "mushroom2", "OutdoorConcrete1", "Pipe", "Pump", "RailingTrim",
      "ReinforcedConcrete", "Riverbed2", "Riverbed_nobake", "Rock7", "Rockwall1",
      "SteelTrim", "TireTracks_multiply_nobake", "TreeBase", "TreeLeaves_clip_nobake",
      "TruckTrans", "Truck", "WarehouseFloor", "WarehouseTile", "Water_Scroll_nobake",
      "WindowsDoor", "WoodTrim",
    ],
  },
};

function buildFileList(mapName, config) {
  const files = [
    "icon.webp",
    "out/out.drc",
    "out/smalllightmap0.webp",
    "out/lightmap0.webp",
    "out/lightmap0.ktx2",
    "out/mobilelightmap0.ktx2",
  ];

  if (config.hasLightmap1) {
    files.push("out/smalllightmap1.webp");
    files.push("out/lightmap1.webp");
    files.push("out/lightmap1.ktx2");
    files.push("out/mobilelightmap1.ktx2");
  }

  for (const s of config.skybox) {
    files.push(s);
  }

  for (const t of config.textures) {
    files.push(`out/compressedTextures/${t}.webp`);
    files.push(`out/mobileTextures/${t}.webp`);
  }

  return files;
}

async function downloadFile(url, destPath, isTexture = false) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return { status: "cached", size: fs.statSync(destPath).size };
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (res.status === 200) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(destPath, buf);
        return { status: "downloaded", size: buf.length };
      }
      if (res.status === 404) {
        if (isTexture) {
          fs.writeFileSync(destPath, PLACEHOLDER_WEBP);
          return { status: "placeholder", size: PLACEHOLDER_WEBP.length };
        }
        return { status: "404", size: 0 };
      }
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  return { status: "failed", size: 0 };
}

async function main() {
  console.log("=== Deadshot Map Fetcher ===");
  console.log(`Target: ${TARGET_MAPS_DIR}`);

  const tasks = [];

  for (const [mapName, config] of Object.entries(MAP_CONFIGS)) {
    const fileList = buildFileList(mapName, config);
    console.log(`[${mapName}] ${fileList.length} assets queued`);

    for (const relFile of fileList) {
      const url = `${CDN_BASE}/${mapName}/${relFile}`;
      const dest = path.join(TARGET_MAPS_DIR, mapName, relFile);
      const isTexture = relFile.includes("compressedTextures/");
      tasks.push({ mapName, relFile, url, dest, isTexture });
    }
  }

  console.log(`\nStarting concurrent download of ${tasks.length} files...`);

  let completed = 0;
  let totalBytes = 0;
  const CONCURRENCY = 16;
  const queue = [...tasks];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      try {
        const res = await downloadFile(item.url, item.dest, item.isTexture);
        completed++;
        totalBytes += res.size;
        if (completed % 25 === 0 || completed === tasks.length) {
          const mb = (totalBytes / (1024 * 1024)).toFixed(1);
          console.log(`Progress: ${completed}/${tasks.length} (${mb} MB downloaded)`);
        }
      } catch (err) {
        console.error(`Error downloading ${item.url}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`\nFinished downloading. Total data: ${(totalBytes / (1024 * 1024)).toFixed(1)} MB.`);

  if (!fs.existsSync(CLIENT_MAPS_DIR)) {
    try {
      fs.symlinkSync(TARGET_MAPS_DIR, CLIENT_MAPS_DIR, "dir");
      console.log(`Created symlink: ${CLIENT_MAPS_DIR} -> ${TARGET_MAPS_DIR}`);
    } catch (e) {
      console.log(`Symlink note: ${e.message}`);
    }
  }

  const ANDROID_MAPS_DIR = path.join(ROOT, "android", "app", "src", "main", "assets", "client", "maps");
  if (fs.existsSync(ANDROID_MAPS_DIR)) {
    console.log(`\nSyncing downloaded maps to Android assets: ${ANDROID_MAPS_DIR}...`);
    fs.cpSync(TARGET_MAPS_DIR, ANDROID_MAPS_DIR, { recursive: true });
    console.log("Sync to Android assets complete.");
  }

  console.log("\nVerifying geometry (out.drc) on disk:");
  const allLobbyMaps = ["tf", "industry", "winter", "newmlab", "manor", "neon"];
  for (const m of allLobbyMaps) {
    const drcPath = path.join(TARGET_MAPS_DIR, m, "out", "out.drc");
    const exists = fs.existsSync(drcPath);
    const sz = exists ? fs.statSync(drcPath).size : 0;
    console.log(`  - ${m}: ${exists ? `OK (${sz} bytes)` : "MISSING!"}`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
