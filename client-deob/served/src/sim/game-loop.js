// GENERATED from ../../raw/bundles/final.pkg.js [code region] — edit tools/, not this file.
// module: sim/game-loop.js | units: 2301 | span: [0,2746690) (interleaved; exact ranges are per-unit markers below)
// emission order within this file follows global order (sorted by start); rebundle with: node tools/bundle.mjs
// __UNIT__ u0000 [0,1) kind=empty len=1
;
// __UNIT__ u0003 [472,560) kind=function len=134
function decodeString(a,b){var c=getStringTable();return decodeString=function(d,e){d=d-0x7b;var f=c[d];return f;},decodeString(a,b);}
// __UNIT__ u0009 [206087,206100) kind=expr len=13
'use strict';
// __UNIT__ u0010 [206100,206118) kind=var len=23
var globalScope=window;
// __UNIT__ u0012 [383455,383468) kind=expr len=17
litegl=window.GL;
// __UNIT__ u0015 [423018,423019) kind=empty len=1
;
// __UNIT__ u0018 [423096,423103) kind=var len=20
var weakMapPolyfill;
// __UNIT__ u0041 [1462312,1462322) kind=var len=24
var basisFormatCodes={};
// __UNIT__ u0043 [1462732,1462742) kind=var len=23
var s3tcFormatEnums={};
// __UNIT__ u0053 [1623777,1623787) kind=var len=16
var neonSkin={};
// __UNIT__ u0055 [1623866,1623876) kind=var len=18
var rusticSkin={};
// __UNIT__ u0056 [1623876,1623915) kind=expr len=70
rusticSkin['name']=stringDecoderAlias(0x29d),rusticSkin['rarity']=0x4;
// __UNIT__ u0057 [1623915,1623925) kind=var len=20
var birthdaySkin={};
// __UNIT__ u0059 [1624012,1624022) kind=var len=16
var hlwnSkin={};
// __UNIT__ u0061 [1624106,1624116) kind=var len=23
var hallow22SkinDef={};
// __UNIT__ u0062 [1624116,1624201) kind=expr len=167
hallow22SkinDef['name']='HLWN\x20\x2722',hallow22SkinDef[stringDecoderAlias(0xef7)]=0x4,hallow22SkinDef[stringDecoderAlias(0x5d9)]=![],hallow22SkinDef['sellable']=![];
// __UNIT__ u0063 [1624201,1624211) kind=var len=23
var summer24SkinDef={};
// __UNIT__ u0064 [1624211,1624300) kind=expr len=171
summer24SkinDef[stringDecoderAlias(0x9ec)]='Summer\x20\x2724',summer24SkinDef['rarity']=0x4,summer24SkinDef[stringDecoderAlias(0x5d9)]=![],summer24SkinDef['sellable']=![];
// __UNIT__ u0065 [1624300,1624310) kind=var len=26
var winter22SkinBundle={};
// __UNIT__ u0067 [1624392,1624402) kind=var len=26
var winter24SkinBundle={};
// __UNIT__ u0068 [1624402,1624489) kind=expr len=181
winter24SkinBundle['name']='Winter\x20\x2724',winter24SkinBundle[stringDecoderAlias(0xef7)]=0x4,winter24SkinBundle[stringDecoderAlias(0x5d9)]=![],winter24SkinBundle['sellable']=![];
// __UNIT__ u0069 [1624489,1624499) kind=var len=20
var sillySkinDef={};
// __UNIT__ u0071 [1624579,1624589) kind=var len=19
var alezSkinDef={};
// __UNIT__ u0073 [1624664,1624674) kind=var len=24
var frostbiteSkinDef={};
// __UNIT__ u0075 [1624757,1624767) kind=var len=26
var hydrodipSkinPreset={};
// __UNIT__ u0077 [1624830,1624840) kind=var len=23
var geomVertexTempA={};
// __UNIT__ u0079 [1624925,1624935) kind=var len=25
var frostyGlowSkinDef={};
// __UNIT__ u0081 [1625018,1625028) kind=var len=23
var geomVertexTempC={};
// __UNIT__ u0082 [1625028,1625106) kind=expr len=175
geomVertexTempC['name']=stringDecoderAlias(0xc9b),geomVertexTempC['rarity']=0x4,geomVertexTempC[stringDecoderAlias(0x5d9)]=![],geomVertexTempC[stringDecoderAlias(0x6b1)]=!![];
// __UNIT__ u0083 [1625106,1625116) kind=var len=19
var horizonSkin={};
// __UNIT__ u0085 [1625202,1625212) kind=var len=18
var cloudySkin={};
// __UNIT__ u0087 [1625293,1625303) kind=var len=21
var quacksterSkin={};
// __UNIT__ u0089 [1625384,1625394) kind=var len=18
var safariSkin={};
// __UNIT__ u0090 [1625394,1625485) kind=expr len=168
safariSkin['name']=stringDecoderAlias(0x34b)+'ari',safariSkin[stringDecoderAlias(0xfbd)]='saf'+'ari',safariSkin['rarity']=0x3,safariSkin[stringDecoderAlias(0x708)]=0x0;
// __UNIT__ u0091 [1625485,1625495) kind=var len=17
var moneySkin={};
// __UNIT__ u0092 [1625495,1625557) kind=expr len=113
moneySkin['name']=stringDecoderAlias(0xf47),moneySkin[stringDecoderAlias(0xef7)]=0x3,moneySkin['collection']=0x0;
// __UNIT__ u0093 [1625557,1625567) kind=var len=20
var snowCamoSkin={};
// __UNIT__ u0094 [1625567,1625610) kind=expr len=63
snowCamoSkin['name']='Snow\x20Camo',snowCamoSkin['rarity']=0x3;
// __UNIT__ u0095 [1625610,1625620) kind=var len=17
var astroSkin={};
// __UNIT__ u0096 [1625620,1625659) kind=expr len=68
astroSkin['name']=stringDecoderAlias(0x4b4),astroSkin['rarity']=0x3;
// __UNIT__ u0097 [1625659,1625669) kind=var len=17
var prismSkin={};
// __UNIT__ u0098 [1625669,1625733) kind=expr len=115
prismSkin[stringDecoderAlias(0x9ec)]=stringDecoderAlias(0x90c),prismSkin['rarity']=0x2,prismSkin['collection']=0x0;
// __UNIT__ u0099 [1625733,1625743) kind=var len=18
var cherrySkin={};
// __UNIT__ u0100 [1625743,1625804) kind=expr len=100
cherrySkin['name']='Blossom',cherrySkin[stringDecoderAlias(0xef7)]=0x2,cherrySkin['collection']=0x0;
// __UNIT__ u0101 [1625804,1625814) kind=var len=17
var vaporSkin={};
// __UNIT__ u0102 [1625814,1625872) kind=expr len=109
vaporSkin['name']=stringDecoderAlias(0x7ea),vaporSkin['rarity']=0x2,vaporSkin[stringDecoderAlias(0x708)]=0x0;
// __UNIT__ u0103 [1625872,1625882) kind=var len=17
var swirlSkin={};
// __UNIT__ u0104 [1625882,1625920) kind=expr len=67
swirlSkin['name']='Swirl',swirlSkin[stringDecoderAlias(0xef7)]=0x2;
// __UNIT__ u0105 [1625920,1625930) kind=var len=20
var splatterSkin={};
// __UNIT__ u0106 [1625930,1625967) kind=expr len=57
splatterSkin['name']='Marble',splatterSkin['rarity']=0x2;
// __UNIT__ u0107 [1625967,1625977) kind=var len=17
var baconSkin={};
// __UNIT__ u0108 [1625977,1626036) kind=expr len=95
baconSkin['name']='Bacon',baconSkin[stringDecoderAlias(0xef7)]=0x1,baconSkin['collection']=0x0;
// __UNIT__ u0109 [1626036,1626046) kind=var len=17
var tigerSkin={};
// __UNIT__ u0110 [1626046,1626104) kind=expr len=79
tigerSkin['name']='Tigris',tigerSkin['rarity']=0x1,tigerSkin['collection']=0x0;
// __UNIT__ u0111 [1626104,1626114) kind=var len=18
var carbonSkin={};
// __UNIT__ u0112 [1626114,1626183) kind=expr len=123
carbonSkin[stringDecoderAlias(0x9ec)]='Carbon\x20Fiber',carbonSkin['rarity']=0x1,carbonSkin[stringDecoderAlias(0x708)]=0x0;
// __UNIT__ u0113 [1626183,1626193) kind=var len=17
var linenSkin={};
// __UNIT__ u0114 [1626193,1626259) kind=expr len=87
linenSkin['name']='Fresh\x20Linen',linenSkin['rarity']=0x1,linenSkin['collection']=0x0;
// __UNIT__ u0115 [1626259,1626269) kind=var len=21
var greenCamoSkin={};
// __UNIT__ u0116 [1626269,1626310) kind=expr len=93
greenCamoSkin['name']=stringDecoderAlias(0xc73),greenCamoSkin[stringDecoderAlias(0xef7)]=0x1;
// __UNIT__ u0117 [1626310,1626320) kind=var len=19
var redCamoSkin={};
// __UNIT__ u0118 [1626320,1626366) kind=expr len=79
redCamoSkin[stringDecoderAlias(0x9ec)]='Red\x20Camo',redCamoSkin['rarity']=0x1;
// __UNIT__ u0119 [1626366,1626376) kind=var len=19
var defaultSkin={};
// __UNIT__ u0121 [1626455,1626465) kind=var len=17
var skinTable={};
// __UNIT__ u0122 [1626465,1627049) kind=expr len=1412
skinTable[stringDecoderAlias(0x46f)]=matrixSkin,skinTable['neon']=neonSkin,skinTable[stringDecoderAlias(0xeb8)]=rusticSkin,skinTable[stringDecoderAlias(0xde6)]=birthdaySkin,skinTable['hlwn']=hlwnSkin,skinTable['hallow22']=hallow22SkinDef,skinTable['summer']=summer24SkinDef,skinTable['winter']=winter22SkinBundle,skinTable[stringDecoderAlias(0xe82)]=winter24SkinBundle,skinTable['silly']=sillySkinDef,skinTable['alez']=alezSkinDef,skinTable['ice']=frostbiteSkinDef,skinTable[stringDecoderAlias(0x67a)]=hydrodipSkinPreset,skinTable[stringDecoderAlias(0xc0e)]=geomVertexTempA,skinTable[stringDecoderAlias(0xf7f)]=frostyGlowSkinDef,skinTable['neonpulse']=geomVertexTempC,skinTable[stringDecoderAlias(0xcd1)]=horizonSkin,skinTable['cloudy']=cloudySkin,skinTable[stringDecoderAlias(0xc9a)]=quacksterSkin,skinTable['safari']=safariSkin,skinTable['money']=moneySkin,skinTable[stringDecoderAlias(0x92e)]=snowCamoSkin,skinTable['astro']=astroSkin,skinTable[stringDecoderAlias(0x7a5)]=prismSkin,skinTable['cherry']=cherrySkin,skinTable['vapor']=vaporSkin,skinTable[stringDecoderAlias(0x379)]=swirlSkin,skinTable[stringDecoderAlias(0xcef)]=splatterSkin,skinTable['bacon']=baconSkin,skinTable['tiger']=tigerSkin,skinTable['carbon']=carbonSkin,skinTable[stringDecoderAlias(0xaed)]=linenSkin,skinTable['greencamo']=greenCamoSkin,skinTable[stringDecoderAlias(0x2f0)]=redCamoSkin,skinTable[stringDecoderAlias(0xe5)]=defaultSkin;
// __UNIT__ u0123 [1627049,1627065) kind=var len=52
var skinTableRef=skinTable,equippedDefaultSkinAr={};
// __UNIT__ u0124 [1627065,1627119) kind=expr len=111
equippedDefaultSkinAr['name']='default',equippedDefaultSkinAr['weapon']='ar',equippedDefaultSkinAr['wear']=0x0;
// __UNIT__ u0125 [1627119,1627129) kind=var len=22
var defaultSkinSmg={};
// __UNIT__ u0126 [1627129,1627186) kind=expr len=123
defaultSkinSmg['name']=stringDecoderAlias(0xe5),defaultSkinSmg[stringDecoderAlias(0x24d)]='smg',defaultSkinSmg['wear']=0x0;
// __UNIT__ u0127 [1627186,1627196) kind=var len=22
var defaultSkinAwp={};
// __UNIT__ u0128 [1627196,1627259) kind=expr len=129
defaultSkinAwp[stringDecoderAlias(0x9ec)]='default',defaultSkinAwp['weapon']='awp',defaultSkinAwp[stringDecoderAlias(0xeeb)]=0x0;
// __UNIT__ u0129 [1627259,1627269) kind=var len=26
var defaultSkinShotgun={};
// __UNIT__ u0130 [1627269,1627333) kind=expr len=142
defaultSkinShotgun['name']='default',defaultSkinShotgun['weapon']=stringDecoderAlias(0x2ba),defaultSkinShotgun[stringDecoderAlias(0xeeb)]=0x0;
// __UNIT__ u0131 [1627333,1627424) kind=var len=221
var defaultEquippedSkins=[equippedDefaultSkinAr,defaultSkinSmg,defaultSkinAwp,defaultSkinShotgun],weaponKeys=['smg','ar','awp',stringDecoderAlias(0x2ba)],randomWeaponNames=['smg','ar',stringDecoderAlias(0xfd3),'shotgun'];
// __UNIT__ u0133 [1628067,1628156) kind=function len=117
function pickLowerRarity(a3i,a3j){var anv=stringDecoderAlias;if(a3i['rarity']<a3j[anv(0xef7)])return a3i;return a3j;}
// __UNIT__ u0135 [1628359,1631169) kind=var len=2832
const blurMulTable=[0x200,0x200,0x1c8,0x200,0x148,0x1c8,0x14f,0x200,0x195,0x148,0x10f,0x1c8,0x184,0x14f,0x124,0x200,0x1c6,0x195,0x16c,0x148,0x12a,0x10f,0x1f0,0x1c8,0x1a4,0x184,0x168,0x14f,0x138,0x124,0x111,0x200,0x1e2,0x1c6,0x1ac,0x195,0x17f,0x16c,0x159,0x148,0x138,0x12a,0x11c,0x10f,0x103,0x1f0,0x1db,0x1c8,0x1b5,0x1a4,0x194,0x184,0x176,0x168,0x15b,0x14f,0x143,0x138,0x12e,0x124,0x11a,0x111,0x109,0x200,0x1f1,0x1e2,0x1d4,0x1c6,0x1b9,0x1ac,0x1a1,0x195,0x18a,0x17f,0x175,0x16c,0x162,0x159,0x151,0x148,0x140,0x138,0x131,0x12a,0x123,0x11c,0x116,0x10f,0x109,0x103,0x1fb,0x1f0,0x1e5,0x1db,0x1d1,0x1c8,0x1be,0x1b5,0x1ac,0x1a4,0x19c,0x194,0x18c,0x184,0x17d,0x176,0x16f,0x168,0x162,0x15b,0x155,0x14f,0x149,0x143,0x13e,0x138,0x133,0x12e,0x129,0x124,0x11f,0x11a,0x116,0x111,0x10d,0x109,0x105,0x200,0x1f9,0x1f1,0x1e9,0x1e2,0x1db,0x1d4,0x1cd,0x1c6,0x1bf,0x1b9,0x1b3,0x1ac,0x1a6,0x1a1,0x19b,0x195,0x18f,0x18a,0x185,0x17f,0x17a,0x175,0x170,0x16c,0x167,0x162,0x15e,0x159,0x155,0x151,0x14c,0x148,0x144,0x140,0x13c,0x138,0x135,0x131,0x12d,0x12a,0x126,0x123,0x11f,0x11c,0x119,0x116,0x112,0x10f,0x10c,0x109,0x106,0x103,0x101,0x1fb,0x1f5,0x1f0,0x1eb,0x1e5,0x1e0,0x1db,0x1d6,0x1d1,0x1cc,0x1c8,0x1c3,0x1be,0x1ba,0x1b5,0x1b1,0x1ac,0x1a8,0x1a4,0x1a0,0x19c,0x198,0x194,0x190,0x18c,0x188,0x184,0x181,0x17d,0x179,0x176,0x172,0x16f,0x16b,0x168,0x165,0x162,0x15e,0x15b,0x158,0x155,0x152,0x14f,0x14c,0x149,0x146,0x143,0x140,0x13e,0x13b,0x138,0x136,0x133,0x130,0x12e,0x12b,0x129,0x126,0x124,0x121,0x11f,0x11d,0x11a,0x118,0x116,0x113,0x111,0x10f,0x10d,0x10b,0x109,0x107,0x105,0x103],blurShiftTable=[0x9,0xb,0xc,0xd,0xd,0xe,0xe,0xf,0xf,0xf,0xf,0x10,0x10,0x10,0x10,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x12,0x12,0x12,0x12,0x12,0x12,0x12,0x12,0x12,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18];
// __UNIT__ u0142 [1638052,1638151) kind=class len=110
class blurStackNode{constructor(){this['r']=0x0,this['g']=0x0,this['b']=0x0,this['a']=0x0,this['next']=null;}}
// __UNIT__ u0143 [1638151,1638161) kind=var len=20
var stackBlurLib={};
// __UNIT__ u0144 [1638161,1638276) kind=expr len=286
stackBlurLib['processImage']=stackBlurProcessImage,stackBlurLib['processCanvasRGBA']=stackBlurCanvasRGBA,stackBlurLib[stringDecoderAlias(0x542)]=stackBlurCanvasRGB,stackBlurLib['processImageDataRGBA']=stackBlurImageDataRGBA,stackBlurLib[stringDecoderAlias(0xe16)]=stackBlurImageDataRGB;
// __UNIT__ u0145 [1638276,1638286) kind=var len=32
var stackBlurAlias=stackBlurLib;
// __UNIT__ u0149 [1702524,1702576) kind=expr len=117
skyboxShader[stringDecoderAlias(0x3da)]=stringDecoderAlias(0xec1),skyboxShader['fragment']=stringDecoderAlias(0xbd1);
// __UNIT__ u0150 [1702576,1702592) kind=var len=65
var skyboxShaderAlias=skyboxShader,meshBasicReplacementShader={};
// __UNIT__ u0152 [1702822,1702838) kind=var len=91
var meshBasicReplacementShaderAlias=meshBasicReplacementShader,skinnedBasicVertexShader={};
// __UNIT__ u0154 [1703098,1703114) kind=var len=84
var skinnedBasicVertexShaderAlias=skinnedBasicVertexShader,captureProgressShader={};
// __UNIT__ u0156 [1703725,1703741) kind=var len=77
var captureProgressShaderAlias=captureProgressShader,capturePennantShader={};
// __UNIT__ u0157 [1703741,1703792) kind=expr len=132
capturePennantShader['vertex']=stringDecoderAlias(0xd37),capturePennantShader[stringDecoderAlias(0xe2e)]=stringDecoderAlias(0x1074);
// __UNIT__ u0158 [1703792,1703808) kind=var len=75
var capturePennantShaderAlias=capturePennantShader,scopeBlurShaderAlias={};
// __UNIT__ u0162 [1711522,1711538) kind=var len=52
var waterShaderAlias=waterShader,waterfallShader={};
// __UNIT__ u0164 [1712183,1712199) kind=var len=57
var waterfallShaderAlias=waterfallShader,auroraShader={};
// __UNIT__ u0166 [1712783,1712799) kind=var len=56
var auroraShaderAlias=auroraShader,skyboxWaterShader={};
// __UNIT__ u0167 [1712799,1712851) kind=expr len=127
skyboxWaterShader[stringDecoderAlias(0x3da)]=stringDecoderAlias(0xe07),skyboxWaterShader['fragment']=stringDecoderAlias(0x4b3);
// __UNIT__ u0168 [1712851,1712867) kind=var len=69
var skyboxWaterShaderAlias=skyboxWaterShader,depthGrayscaleShader={};
// __UNIT__ u0170 [1713150,1713166) kind=var len=79
var depthGrayscaleShaderAlias=depthGrayscaleShader,defaultMapGeometryShader={};
// __UNIT__ u0172 [1715846,1715862) kind=var len=81
var defaultMapGeometryShaderAlias=defaultMapGeometryShader,gltfLightmapShader={};
// __UNIT__ u0174 [1716265,1716281) kind=var len=61
var gltfLightmapShaderAlias=gltfLightmapShader,nullShader={};
// __UNIT__ u0176 [1716648,1716664) kind=var len=55
var nullShaderAlias=nullShader,swayingFoliageShader={};
// __UNIT__ u0178 [1718134,1718150) kind=var len=75
var swayingFoliageShaderAlias=swayingFoliageShader,treeLeavesClipShader={};
// __UNIT__ u0180 [1718243,1718259) kind=var len=72
var treeLeavesClipShaderAlias=treeLeavesClipShader,waterScrollShader={};
// __UNIT__ u0182 [1723493,1723509) kind=var len=60
var waterScrollShaderAlias=waterScrollShader,bush2Shader={};
// __UNIT__ u0184 [1725217,1725233) kind=var len=48
var bush2ShaderAlias=bush2Shader,bush3Shader={};
// __UNIT__ u0186 [1726421,1726437) kind=var len=60
var bush3ShaderAlias=bush3Shader,transparentCutoutShader={};
// __UNIT__ u0188 [1726964,1726980) kind=var len=78
var transparentCutoutShaderAlias=transparentCutoutShader,dxtRedChannelTemp={};
// __UNIT__ u0190 [1727449,1727465) kind=var len=55
var flagShader=dxtRedChannelTemp,tarpsDynamicShader={};
// __UNIT__ u0191 [1727465,1727579) kind=expr len=254
tarpsDynamicShader['animated']=!![],tarpsDynamicShader['transparent']=![],tarpsDynamicShader[stringDecoderAlias(0xf45)]=!![],tarpsDynamicShader[stringDecoderAlias(0x3da)]=stringDecoderAlias(0x459),tarpsDynamicShader['fragment']=stringDecoderAlias(0x5ac);
// __UNIT__ u0192 [1727579,1727595) kind=var len=75
var tarpsDynamicShaderAlias=tarpsDynamicShader,tireTracksMultiplyShader={};
// __UNIT__ u0194 [1728642,1728658) kind=var len=82
var tireTracksMultiplyShaderAlias=tireTracksMultiplyShader,animatedGrassPreset={};
// __UNIT__ u0196 [1729224,1729240) kind=var len=67
var animatedGrassPresetAlias=animatedGrassPreset,aoMapShaderDef={};
// __UNIT__ u0198 [1730409,1730425) kind=var len=36
var ra=aoMapShaderDef,bushShader={};
// __UNIT__ u0199 [1730425,1730518) kind=expr len=185
bushShader[stringDecoderAlias(0xb87)]=!![],bushShader['doubleSided']=!![],bushShader['vertex']=stringDecoderAlias(0xfa0),bushShader[stringDecoderAlias(0xe2e)]=stringDecoderAlias(0x639);
// __UNIT__ u0200 [1730518,1730534) kind=var len=37
var bushShaderAlias=bushShader,rd={};
// __UNIT__ u0201 [1730534,1730645) kind=expr len=171
rd['animated']=!![],rd[stringDecoderAlias(0xf45)]=![],rd['transparent']=![],rd['vertex']=stringDecoderAlias(0xe95),rd[stringDecoderAlias(0xe2e)]=stringDecoderAlias(0xb14);
// __UNIT__ u0202 [1730645,1730661) kind=var len=30
var re=rd,trimSheet2Preset={};
// __UNIT__ u0206 [1742909,1742925) kind=var len=84
var multiTextureBlendShaderAlias=multiTextureBlendShaderDef,alphaCutoutShaderDef={};
// __UNIT__ u0208 [1744688,1744704) kind=var len=78
var alphaCutoutShaderAlias=alphaCutoutShaderDef,circularBlurDiffuseUniform={};
// __UNIT__ u0209 [1744704,1744721) kind=expr len=41
circularBlurDiffuseUniform['value']=null;
// __UNIT__ u0210 [1744721,1744731) kind=var len=31
var circularBlurStepUniform={};
// __UNIT__ u0211 [1744731,1744750) kind=expr len=55
circularBlurStepUniform[stringDecoderAlias(0x9c5)]=0x1;
// __UNIT__ u0212 [1744750,1744760) kind=var len=32
var circularBlurPassUniforms={};
// __UNIT__ u0213 [1744760,1744789) kind=expr len=118
circularBlurPassUniforms['tDiffuse']=circularBlurDiffuseUniform,circularBlurPassUniforms['h']=circularBlurStepUniform;
// __UNIT__ u0215 [1745963,1745980) kind=expr len=34
sphereRadiusSquared['value']=null;
// __UNIT__ u0216 [1745980,1745990) kind=var len=33
var horizontalBlurStepUniform={};
// __UNIT__ u0217 [1745990,1746006) kind=expr len=39
horizontalBlurStepUniform['value']=0x1;
// __UNIT__ u0218 [1746006,1746016) kind=var len=32
var horizontalBlurResUniform={};
// __UNIT__ u0219 [1746016,1746035) kind=expr len=56
horizontalBlurResUniform[stringDecoderAlias(0x9c5)]=0x1;
// __UNIT__ u0220 [1746035,1746045) kind=var len=34
var horizontalBlurPassUniforms={};
// __UNIT__ u0221 [1746045,1746087) kind=expr len=176
horizontalBlurPassUniforms['tDiffuse']=sphereRadiusSquared,horizontalBlurPassUniforms['h']=horizontalBlurStepUniform,horizontalBlurPassUniforms['res']=horizontalBlurResUniform;
// __UNIT__ u0223 [1747159,1747176) kind=expr len=40
finalOutputDiffuseUniform['value']=null;
// __UNIT__ u0224 [1747176,1747186) kind=var len=30
var finalOutputStepUniform={};
// __UNIT__ u0225 [1747186,1747202) kind=expr len=36
finalOutputStepUniform['value']=0x1;
// __UNIT__ u0226 [1747202,1747212) kind=var len=29
var finalOutputResUniform={};
// __UNIT__ u0227 [1747212,1747228) kind=expr len=35
finalOutputResUniform['value']=0x1;
// __UNIT__ u0228 [1747228,1747238) kind=var len=31
var finalOutputPassUniforms={};
// __UNIT__ u0229 [1747238,1747285) kind=expr len=202
finalOutputPassUniforms[stringDecoderAlias(0xbf2)]=finalOutputDiffuseUniform,finalOutputPassUniforms['h']=finalOutputStepUniform,finalOutputPassUniforms[stringDecoderAlias(0x3ab)]=finalOutputResUniform;
// __UNIT__ u0231 [1748346,1748363) kind=expr len=36
sharpenDiffuseUniform['value']=null;
// __UNIT__ u0232 [1748363,1748373) kind=var len=28
var sharpenRadiusUniform={};
// __UNIT__ u0233 [1748373,1748389) kind=expr len=34
sharpenRadiusUniform['value']=0x4;
// __UNIT__ u0234 [1748389,1748399) kind=var len=27
var sharpenPassUniforms={};
// __UNIT__ u0235 [1748399,1748433) kind=expr len=120
sharpenPassUniforms[stringDecoderAlias(0xbf2)]=sharpenDiffuseUniform,sharpenPassUniforms['radius']=sharpenRadiusUniform;
// __UNIT__ u0237 [1748697,1748714) kind=expr len=34
sepiaDiffuseUniform['value']=null;
// __UNIT__ u0238 [1748714,1748724) kind=var len=26
var sepiaRadiusUniform={};
// __UNIT__ u0239 [1748724,1748740) kind=expr len=32
sepiaRadiusUniform['value']=0x4;
// __UNIT__ u0240 [1748740,1748750) kind=var len=25
var sepiaPassUniforms={};
// __UNIT__ u0241 [1748750,1748784) kind=expr len=97
sepiaPassUniforms['tDiffuse']=sepiaDiffuseUniform,sepiaPassUniforms['radius']=sepiaRadiusUniform;
// __UNIT__ u0244 [1750817,1750833) kind=var len=53
var rK=grungeOverlayShaderDef,paintDiffuseUniform={};
// __UNIT__ u0245 [1750833,1750850) kind=expr len=34
paintDiffuseUniform['value']=null;
// __UNIT__ u0246 [1750850,1750860) kind=var len=26
var paintRadiusUniform={};
// __UNIT__ u0247 [1750860,1750876) kind=expr len=32
paintRadiusUniform['value']=0x4;
// __UNIT__ u0248 [1750876,1750886) kind=var len=27
var paintShaderUniforms={};
// __UNIT__ u0249 [1750886,1750922) kind=expr len=118
paintShaderUniforms['tDiffuse']=paintDiffuseUniform,paintShaderUniforms[stringDecoderAlias(0xa00)]=paintRadiusUniform;
// __UNIT__ u0251 [1754022,1754039) kind=expr len=37
kuwaharaDiffuseUniform['value']=null;
// __UNIT__ u0252 [1754039,1754049) kind=var len=24
var kuwaharaHUniform={};
// __UNIT__ u0253 [1754049,1754071) kind=expr len=36
kuwaharaHUniform['value']=0x1/0x200;
// __UNIT__ u0254 [1754071,1754081) kind=var len=29
var kuwaharaRadiusUniform={};
// __UNIT__ u0255 [1754081,1754100) kind=expr len=53
kuwaharaRadiusUniform[stringDecoderAlias(0x9c5)]=0x4;
// __UNIT__ u0256 [1754100,1754110) kind=var len=30
var kuwaharaShaderUniforms={};
// __UNIT__ u0257 [1754110,1754155) kind=expr len=158
kuwaharaShaderUniforms['tDiffuse']=kuwaharaDiffuseUniform,kuwaharaShaderUniforms['h']=kuwaharaHUniform,kuwaharaShaderUniforms['radius']=kuwaharaRadiusUniform;
// __UNIT__ u0258 [1754155,1754165) kind=var len=22
var kuwaharaShader={};
// __UNIT__ u0260 [1754415,1754431) kind=var len=67
var kuwaharaShaderAlias=kuwaharaShader,radialGlowDiffuseUniform={};
// __UNIT__ u0261 [1754431,1754448) kind=expr len=39
radialGlowDiffuseUniform['value']=null;
// __UNIT__ u0262 [1754448,1754458) kind=var len=26
var radialGlowHUniform={};
// __UNIT__ u0263 [1754458,1754480) kind=expr len=38
radialGlowHUniform['value']=0x1/0x200;
// __UNIT__ u0264 [1754480,1754490) kind=var len=31
var radialGlowRadiusUniform={};
// __UNIT__ u0265 [1754490,1754506) kind=expr len=37
radialGlowRadiusUniform['value']=0x4;
// __UNIT__ u0266 [1754506,1754516) kind=var len=32
var radialGlowShaderUniforms={};
// __UNIT__ u0267 [1754516,1754561) kind=expr len=170
radialGlowShaderUniforms['tDiffuse']=radialGlowDiffuseUniform,radialGlowShaderUniforms['h']=radialGlowHUniform,radialGlowShaderUniforms['radius']=radialGlowRadiusUniform;
// __UNIT__ u0268 [1754561,1754571) kind=var len=24
var radialGlowShader={};
// __UNIT__ u0270 [1756062,1756078) kind=var len=68
var radialGlowShaderAlias=radialGlowShader,diffuseTextureUniform={};
// __UNIT__ u0271 [1756078,1756095) kind=expr len=36
diffuseTextureUniform['value']=null;
// __UNIT__ u0272 [1756095,1756105) kind=var len=32
var lightMapIntensityUniform={};
// __UNIT__ u0273 [1756105,1756124) kind=expr len=56
lightMapIntensityUniform[stringDecoderAlias(0x9c5)]=0x1;
// __UNIT__ u0274 [1756124,1756134) kind=var len=30
var lightmapShaderUniforms={};
// __UNIT__ u0275 [1756134,1756170) kind=expr len=147
lightmapShaderUniforms[stringDecoderAlias(0xbf2)]=diffuseTextureUniform,lightmapShaderUniforms[stringDecoderAlias(0x595)]=lightMapIntensityUniform;
// __UNIT__ u0276 [1756170,1756180) kind=var len=32
var lightmapUncompressShader={};
// __UNIT__ u0278 [1756434,1756450) kind=var len=83
var lightmapUncompressShaderAlias=lightmapUncompressShader,sunsetDiffuseUniform={};
// __UNIT__ u0279 [1756450,1756467) kind=expr len=35
sunsetDiffuseUniform['value']=null;
// __UNIT__ u0280 [1756467,1756477) kind=var len=38
var sunsetLightMapIntensityUniform={};
// __UNIT__ u0281 [1756477,1756493) kind=expr len=44
sunsetLightMapIntensityUniform['value']=0x1;
// __UNIT__ u0282 [1756493,1756503) kind=var len=28
var sunsetShaderUniforms={};
// __UNIT__ u0283 [1756503,1756539) kind=expr len=148
sunsetShaderUniforms[stringDecoderAlias(0xbf2)]=sunsetDiffuseUniform,sunsetShaderUniforms[stringDecoderAlias(0x595)]=sunsetLightMapIntensityUniform;
// __UNIT__ u0284 [1756539,1756549) kind=var len=23
var sunsetShaderDef={};
// __UNIT__ u0286 [1757466,1757482) kind=var len=68
var sunsetShader=sunsetShaderDef,lightmapIntensityDiffuseUniform={};
// __UNIT__ u0287 [1757482,1757499) kind=expr len=46
lightmapIntensityDiffuseUniform['value']=null;
// __UNIT__ u0288 [1757499,1757509) kind=var len=27
var mapLightGainUniform={};
// __UNIT__ u0289 [1757509,1757525) kind=expr len=33
mapLightGainUniform['value']=0x1;
// __UNIT__ u0290 [1757525,1757535) kind=var len=39
var lightmapIntensityShaderUniforms={};
// __UNIT__ u0291 [1757535,1757580) kind=expr len=164
lightmapIntensityShaderUniforms[stringDecoderAlias(0xbf2)]=lightmapIntensityDiffuseUniform,lightmapIntensityShaderUniforms['lightMapIntensity']=mapLightGainUniform;
// __UNIT__ u0292 [1757580,1757590) kind=var len=31
var lightmapIntensityShader={};
// __UNIT__ u0294 [1757664,1757680) kind=var len=84
var lightmapIntensityShaderAlias=lightmapIntensityShader,maxFilterDiffuseUniform={};
// __UNIT__ u0295 [1757680,1757700) kind=expr len=56
maxFilterDiffuseUniform[stringDecoderAlias(0x9c5)]=null;
// __UNIT__ u0296 [1757700,1757710) kind=var len=25
var blurRadiusUniform={};
// __UNIT__ u0297 [1757710,1757726) kind=expr len=31
blurRadiusUniform['value']=0x1;
// __UNIT__ u0298 [1757726,1757736) kind=var len=29
var maxFilterPassUniforms={};
// __UNIT__ u0299 [1757736,1757770) kind=expr len=108
maxFilterPassUniforms['tDiffuse']=maxFilterDiffuseUniform,maxFilterPassUniforms['radius']=blurRadiusUniform;
// __UNIT__ u0301 [1758008,1758025) kind=expr len=39
circleBlurDiffuseUniform['value']=null;
// __UNIT__ u0302 [1758025,1758035) kind=var len=29
var circleBlurStepUniform={};
// __UNIT__ u0303 [1758035,1758057) kind=expr len=41
circleBlurStepUniform['value']=0x1/0x200;
// __UNIT__ u0304 [1758057,1758067) kind=var len=30
var circleBlurPassUniforms={};
// __UNIT__ u0305 [1758067,1758096) kind=expr len=125
circleBlurPassUniforms[stringDecoderAlias(0xbf2)]=circleBlurDiffuseUniform,circleBlurPassUniforms['h']=circleBlurStepUniform;
// __UNIT__ u0307 [1758260,1758277) kind=expr len=39
squareBlurDiffuseUniform['value']=null;
// __UNIT__ u0308 [1758277,1758287) kind=var len=29
var squareBlurStepUniform={};
// __UNIT__ u0309 [1758287,1758312) kind=expr len=59
squareBlurStepUniform[stringDecoderAlias(0x9c5)]=0x1/0x200;
// __UNIT__ u0310 [1758312,1758322) kind=var len=26
var blurPassUniformsSq={};
// __UNIT__ u0311 [1758322,1758351) kind=expr len=102
blurPassUniformsSq['tDiffuse']=squareBlurDiffuseUniform,blurPassUniformsSq['h']=squareBlurStepUniform;
// __UNIT__ u0313 [1759694,1759714) kind=expr len=54
boxBlurDiffuseUniform[stringDecoderAlias(0x9c5)]=null;
// __UNIT__ u0314 [1759714,1759724) kind=var len=26
var boxBlurStepUniform={};
// __UNIT__ u0315 [1759724,1759746) kind=expr len=38
boxBlurStepUniform['value']=0x1/0x200;
// __UNIT__ u0316 [1759746,1759756) kind=var len=27
var boxBlurPassUniforms={};
// __UNIT__ u0317 [1759756,1759785) kind=expr len=98
boxBlurPassUniforms['tDiffuse']=boxBlurDiffuseUniform,boxBlurPassUniforms['h']=boxBlurStepUniform;
// __UNIT__ u0318 [1759785,1759795) kind=var len=21
var boxBlurShader={};
// __UNIT__ u0320 [1759875,1759891) kind=var len=61
var boxBlurShaderAlias=boxBlurShader,diffuseShaderUniform={};
// __UNIT__ u0321 [1759891,1759908) kind=expr len=35
diffuseShaderUniform['value']=null;
// __UNIT__ u0322 [1759908,1759918) kind=var len=29
var blurStepShaderUniform={};
// __UNIT__ u0323 [1759918,1759940) kind=expr len=41
blurStepShaderUniform['value']=0x1/0x200;
// __UNIT__ u0324 [1759940,1759950) kind=var len=24
var blurPassUniforms={};
// __UNIT__ u0325 [1759950,1759979) kind=expr len=94
blurPassUniforms['tDiffuse']=diffuseShaderUniform,blurPassUniforms['h']=blurStepShaderUniform;
// __UNIT__ u0328 [1767668,1767684) kind=var len=67
var basicStrippedShader=basicStrippedShaderDef,outlineShaderDef={};
// __UNIT__ u0330 [1768277,1768293) kind=var len=59
var outlineShader=outlineShaderDef,normalDebugShaderDef={};
// __UNIT__ u0332 [1772052,1772068) kind=var len=58
var sG=normalDebugShaderDef,fresnelRefractionShaderDef={};
// __UNIT__ u0334 [1773332,1773348) kind=var len=82
var fresnelRefractionShaderAlias=fresnelRefractionShaderDef,pickupBoxShaderDef={};
// __UNIT__ u0336 [1773574,1773590) kind=var len=71
var pickupBoxShaderAlias=pickupBoxShaderDef,weaponSkinBakeShaderDef={};
// __UNIT__ u0338 [1781241,1781257) kind=var len=73
var weaponSkinBakeShaderAlias=weaponSkinBakeShaderDef,hardpointShader={};
// __UNIT__ u0340 [1781469,1781485) kind=var len=62
var hardpointShaderAlias=hardpointShader,damageFlashShader={};
// __UNIT__ u0341 [1781485,1781535) kind=expr len=110
damageFlashShader['vertex']=stringDecoderAlias(0x7a6),damageFlashShader['fragment']=stringDecoderAlias(0xf81);
// __UNIT__ u0342 [1781535,1781551) kind=var len=67
var damageFlashShaderAlias=damageFlashShader,sniperShaderParams={};
// __UNIT__ u0344 [1784814,1784838) kind=var len=100
var sniperShaderParamsAlias=sniperShaderParams,sniperVertexShaderTemplate=stringDecoderAlias(0xc0d);
// __UNIT__ u0347 [1812039,1812088) kind=function len=95
function bezierCoeffA(bezierPointA,bezierPointB){return 0x1-0x3*bezierPointB+0x3*bezierPointA;}
// __UNIT__ u0348 [1812088,1812133) kind=function len=87
function bezierCoeffB(curveParamA,curveParamB){return 0x3*curveParamB-0x6*curveParamA;}
// __UNIT__ u0349 [1812133,1812166) kind=function len=57
function bezierCoeffC(inputValue){return 0x3*inputValue;}
// __UNIT__ u0354 [1812668,1812697) kind=function len=43
function linearEasing(value){return value;}
// __UNIT__ u0356 [1813359,1813360) kind=empty len=1
;
// __UNIT__ u0359 [1815046,1815072) kind=var len=47
var easingKeys=Object['keys'](easingFunctions);
// __UNIT__ u0360 [1815072,1815552) kind=for len=1032
for(var loopIndex=0x0;loopIndex<easingKeys['length'];loopIndex++){if(typeof easingFunctions[easingKeys[loopIndex]]=='string'){var configValueStr=easingFunctions[easingKeys[loopIndex]];for(var th=0x0;variantIdx<configValueStr[stringDecoderAlias(0x3a2)];variantIdx++){if(!isNaN(configValueStr['charAt'](variantIdx))){configValueStr=configValueStr['substr'](variantIdx);break;}}var configParts=configValueStr[stringDecoderAlias(0xb1e)](',');configValueStr=configParts[configParts['length']-0x1];for(var th=configValueStr[stringDecoderAlias(0x3a2)]-0x1;variantIdx>=0x0;variantIdx--){if(!isNaN(configValueStr['charAt'](variantIdx))){configValueStr=configValueStr['substr'](0x0,variantIdx+0x1),configParts[configParts[stringDecoderAlias(0x3a2)]-0x1]=configValueStr;break;}}for(var th=0x0;variantIdx<configParts[stringDecoderAlias(0x3a2)];variantIdx++){configParts[variantIdx]=Number(configParts[variantIdx]);}easingFunctions[easingKeys[loopIndex]]=createBezierEasing(configParts[0x0],configParts[0x1],configParts[0x2],configParts[0x3]);}}
// __UNIT__ u0361 [1815552,1815712) kind=function len=173
function isPointerLocked(){if(document['pointerLockElement']!=null||document['msPointerLockElement']!=null||document['webkitPointerLockElement']!=null)return!![];return![];}
// __UNIT__ u0362 [1815712,1815850) kind=function len=244
function createTransitionState(){var anV=stringDecoderAlias,viewportRect={};return viewportRect['x']=0x0,viewportRect['y']=0x0,viewportRect['x2']=0x0,viewportRect['y2']=0x0,viewportRect[anV(0xd6)]=0x1,viewportRect[anV(0x40e)]=0x1,viewportRect;}
// __UNIT__ u0363 [1815850,1815860) kind=var len=24
var touchPointerList=[];
// __UNIT__ u0364 [1815860,1816362) kind=function len=527
function touchPointer(){var anW=stringDecoderAlias,a3i={};return a3i['x']=0x0,a3i['y']=0x98967f,a3i[anW(0x25c)]=function(a3j){var anX=anW;this['x']=(this['x']-a3j[anX(0x1090)]/0x2)*a3j[anX(0x10b7)],this['y']=(this['y']-a3j[anX(0xf6d)]/0x2)*a3j['aratio'];},a3i[anW(0x286)]=function(a3j){var anY=anW;if(this['x']<a3j[anY(0x8a8)]['x']+a3j[anY(0xad0)]/0x2&&this['x']>a3j['hitbox']['x']-a3j['width']/0x2&&this['y']<a3j[anY(0x8a8)]['y']+a3j[anY(0x300)]/0x2&&this['y']>a3j['hitbox']['y']-a3j['height']/0x2)return!![];return![];},a3i;}
// __UNIT__ u0368 [1844859,1844900) kind=var len=205
var initAudioListener,resumeAudioContext,updateAudioListener,applyMasterVolume,playCachedSound,playKillStreakSound,playAudioBuffer,audioSampleCache,registerSound,playPositionalSound,audioDistanceScale=0.1;
// __UNIT__ u0369 [1844900,1844973) kind=expr len=104
audioDistanceScale=0.1,window['AudioContext']=window['AudioContext']||window[stringDecoderAlias(0x655)];
// __UNIT__ u0370 [1844973,1844999) kind=var len=36
var audioContext=new AudioContext();
// __UNIT__ u0371 [1844999,1845054) kind=if len=115
if(!audioContext[stringDecoderAlias(0x16a)])audioContext[stringDecoderAlias(0x16a)]=audioContext['createGainNode'];
// __UNIT__ u0372 [1845054,1845109) kind=if len=100
if(!audioContext['createDelay'])audioContext['createDelay']=audioContext[stringDecoderAlias(0x601)];
// __UNIT__ u0373 [1845109,1845171) kind=if len=122
if(!audioContext['createScriptProcessor'])audioContext[stringDecoderAlias(0x4c7)]=audioContext[stringDecoderAlias(0xf48)];
// __UNIT__ u0374 [1845171,1845188) kind=var len=58
var baseVolumeScale=0.2,masterVolumeScale=baseVolumeScale;
// __UNIT__ u0376 [1850326,1850993) kind=expr len=712
Element['prototype'][stringDecoderAlias(0x681)]=function(){var aoX=stringDecoderAlias;this['style']['opacity']==0x1?(this['style']['opacity']=0x0,this['style']['visibility']=aoX(0x59d),this['style']['display']=aoX(0x24a)):(this['style']['opacity']=0x1,this['style'][aoX(0xa5a)]='visible',this[aoX(0xa92)]['display']='initial');},Number['prototype']['countDecimals']=function(){var aoY=stringDecoderAlias;if(Math[aoY(0x5ce)](this['valueOf']())===this[aoY(0x77d)]())return 0x0;var a3i=this['toString']();if(a3i[aoY(0xfad)]('.')!==-0x1&&a3i['indexOf']('-')!=-0x1)return a3i['split']('-')[0x1]||0x0;else{if(a3i['indexOf']('.')!=-0x1)return a3i['split']('.')[0x1]['length']||0x0;}return a3i['split']('-')[0x1]||0x0;};
// __UNIT__ u0377 [1850993,1851042) kind=var len=136
var hiddenSelectClassName=stringDecoderAlias(0x84f),customSelectClassName='new-select2',customOptionListClass=stringDecoderAlias(0xc59);
// __UNIT__ u0378 [1851042,1851113) kind=function len=111
function querySelectorAll(cssSelector){var nodeList=document['querySelectorAll'](cssSelector);return nodeList;}
// __UNIT__ u0379 [1851113,1851268) kind=function len=185
function parseHtmlTemplate(a3i){var aoZ=stringDecoderAlias,a3j=document['createElement'](aoZ(0x10e2)+'plate');return a3i=a3i['trim'](),a3j['innerHTML']=a3i,a3j['content'][aoZ(0x1027)];}
// __UNIT__ u0381 [1851659,1851952) kind=function len=404
function closeCustomSelects(){var ap1=stringDecoderAlias;querySelectorAll(ap1(0x273))['forEach'](function(a3i){var ap2=ap1;a3i[ap2(0x1fd)]['remove']('open');}),querySelectorAll('.'+customSelectClassName)['forEach'](function(a3i){a3i['classList']['remove']('active');}),querySelectorAll('.'+customOptionListClass)['forEach'](function(a3i){var ap3=ap1;a3i[ap3(0xa92)][ap3(0x40e)]=0x1,a3i[ap3(0x681)]();});}
// __UNIT__ u0382 [1851952,1852060) kind=expr len=154
document['addEventListener'](stringDecoderAlias(0x5dd),function(){var ap4=stringDecoderAlias;if(document[ap4(0x9ed)]!=null)return;closeCustomSelects();});
// __UNIT__ u0383 [1852060,1852067) kind=var len=24
var applyClientSettings;
// __UNIT__ u0385 [1852547,1852598) kind=var len=243
var spareStateSlotTO=0x0,settingsValueMap,settingsDefinitions,settingsRootDiv,settingsPagesContainer,settingsScrollContainer,settingsListElement,settingsSections={},activeSettingsCategory,settingsScrollLockUntil=0x0,generalSettingsCategory={};
// __UNIT__ u0386 [1852598,1852640) kind=expr len=99
generalSettingsCategory['id']=stringDecoderAlias(0x78d),generalSettingsCategory['label']='GENERAL';
// __UNIT__ u0387 [1852640,1852650) kind=var len=32
var controlsSettingsCategory={};
// __UNIT__ u0388 [1852650,1852693) kind=expr len=102
controlsSettingsCategory['id']=stringDecoderAlias(0x124),controlsSettingsCategory['label']='CONTROLS';
// __UNIT__ u0389 [1852693,1852703) kind=var len=32
var keybindsSettingsCategory={};
// __UNIT__ u0390 [1852703,1852751) kind=expr len=107
keybindsSettingsCategory['id']='ofbGMnQRPK',keybindsSettingsCategory[stringDecoderAlias(0x192)]='KEYBINDS';
// __UNIT__ u0391 [1852751,1852761) kind=var len=29
var audioSettingsCategory={};
// __UNIT__ u0392 [1852761,1852801) kind=expr len=93
audioSettingsCategory['id']='audio',audioSettingsCategory['label']=stringDecoderAlias(0x893);
// __UNIT__ u0393 [1852801,1852811) kind=var len=29
var videoSettingsCategory={};
// __UNIT__ u0394 [1852811,1852854) kind=expr len=111
videoSettingsCategory['id']='video',videoSettingsCategory[stringDecoderAlias(0x192)]=stringDecoderAlias(0x8d1);
// __UNIT__ u0395 [1852854,1852864) kind=var len=31
var crosshairSettingsOption={};
// __UNIT__ u0397 [1852909,1852919) kind=var len=28
var mobileSettingsOption={};
// __UNIT__ u0398 [1852919,1852958) kind=expr len=75
mobileSettingsOption['id']='mobile',mobileSettingsOption['label']='MOBILE';
// __UNIT__ u0399 [1852958,1852988) kind=var len=188
var platformOptionList=[generalSettingsCategory,controlsSettingsCategory,keybindsSettingsCategory,audioSettingsCategory,videoSettingsCategory,crosshairSettingsOption,mobileSettingsOption];
// __UNIT__ u0400 [1852988,1853138) kind=function len=235
function getSettingsCategoryLabel(a3i){var ap6=stringDecoderAlias;for(var a3j=0x0;a3j<platformOptionList[ap6(0x3a2)];a3j++){if(platformOptionList[a3j]['id']==a3i)return platformOptionList[a3j][ap6(0x192)];}return a3i['toUpperCase']();}
// __UNIT__ u0401 [1853138,1853250) kind=function len=212
function getSettingsCategoryIndex(targetId){for(var scanIdx=0x0;scanIdx<platformOptionList['length'];scanIdx++){if(platformOptionList[scanIdx]['id']==targetId)return scanIdx;}return platformOptionList['length'];}
// __UNIT__ u0415 [1870190,1870304) kind=expr len=183
document[stringDecoderAlias(0x3b9)]===stringDecoderAlias(0xb6f)?document[stringDecoderAlias(0xa9a)]('DOMContentLoaded',function(){billingManager['init']();}):billingManager['init']();
// __UNIT__ u0419 [1873780,1873790) kind=var len=29
var factoryDayLightPreset={};
// __UNIT__ u0420 [1873790,1873854) kind=expr len=117
factoryDayLightPreset[stringDecoderAlias(0x7d5)]=[0x1,0.9,0.8],factoryDayLightPreset['sunDirection']=[-0.5,1.4,-0.3];
// __UNIT__ u0421 [1873854,1873864) kind=var len=32
var factorySunsetLightPreset={};
// __UNIT__ u0422 [1873864,1873944) kind=expr len=176
factorySunsetLightPreset[stringDecoderAlias(0xde4)]=!![],factorySunsetLightPreset['sunColor']=[0x1,0.8,0.6],factorySunsetLightPreset[stringDecoderAlias(0x359)]=[-0.6,0.9,-0.2];
// __UNIT__ u0423 [1873944,1873954) kind=var len=26
var factorySpawnPoint1={};
// __UNIT__ u0424 [1873954,1874020) kind=expr len=146
factorySpawnPoint1['x']=-4.1,factorySpawnPoint1['y']=2.5,factorySpawnPoint1['z']=-0.2,factorySpawnPoint1['rx']=0x40,factorySpawnPoint1['ry']=0x80;
// __UNIT__ u0425 [1874020,1874030) kind=var len=22
var mapSpawnPreset={};
// __UNIT__ u0426 [1874030,1874097) kind=expr len=127
mapSpawnPreset['x']=-4.1,mapSpawnPreset['y']=-0.9,mapSpawnPreset['z']=21.4,mapSpawnPreset['rx']=0x40,mapSpawnPreset['ry']=0x40;
// __UNIT__ u0427 [1874097,1874107) kind=var len=26
var factorySpawnPoint3={};
// __UNIT__ u0428 [1874107,1874174) kind=expr len=147
factorySpawnPoint3['x']=-26.6,factorySpawnPoint3['y']=2.5,factorySpawnPoint3['z']=36.2,factorySpawnPoint3['rx']=0x3f,factorySpawnPoint3['ry']=0xbf;
// __UNIT__ u0429 [1874174,1874184) kind=var len=26
var factorySpawnPoint4={};
// __UNIT__ u0430 [1874184,1874250) kind=expr len=146
factorySpawnPoint4['x']=-6.4,factorySpawnPoint4['y']=2.7,factorySpawnPoint4['z']=0x1f,factorySpawnPoint4['rx']=0x3f,factorySpawnPoint4['ry']=0xbe;
// __UNIT__ u0431 [1874250,1874260) kind=var len=26
var factorySpawnPoint5={};
// __UNIT__ u0432 [1874260,1874326) kind=expr len=146
factorySpawnPoint5['x']=19.8,factorySpawnPoint5['y']=2.5,factorySpawnPoint5['z']=17.6,factorySpawnPoint5['rx']=0x3f,factorySpawnPoint5['ry']=0x7f;
// __UNIT__ u0433 [1874326,1874336) kind=var len=26
var factorySpawnPoint6={};
// __UNIT__ u0434 [1874336,1874401) kind=expr len=145
factorySpawnPoint6['x']=29.2,factorySpawnPoint6['y']=2.5,factorySpawnPoint6['z']=8.3,factorySpawnPoint6['rx']=0x3f,factorySpawnPoint6['ry']=0x7d;
// __UNIT__ u0435 [1874401,1874411) kind=var len=26
var factorySpawnPoint7={};
// __UNIT__ u0436 [1874411,1874477) kind=expr len=146
factorySpawnPoint7['x']=3.9,factorySpawnPoint7['y']=2.5,factorySpawnPoint7['z']=-21.7,factorySpawnPoint7['rx']=0x3f,factorySpawnPoint7['ry']=0x40;
// __UNIT__ u0437 [1874477,1874487) kind=var len=19
var spawnPoint8={};
// __UNIT__ u0438 [1874487,1874553) kind=expr len=111
spawnPoint8['x']=-38.1,spawnPoint8['y']=2.5,spawnPoint8['z']=1.6,spawnPoint8['rx']=0x40,spawnPoint8['ry']=0xbe;
// __UNIT__ u0439 [1874553,1874563) kind=var len=19
var spawnPoint9={};
// __UNIT__ u0440 [1874563,1874631) kind=expr len=113
spawnPoint9['x']=-24.8,spawnPoint9['y']=-2.1,spawnPoint9['z']=19.6,spawnPoint9['rx']=0x41,spawnPoint9['ry']=0xc1;
// __UNIT__ u0441 [1874631,1874641) kind=var len=25
var factoryBotSpawn00={};
// __UNIT__ u0442 [1874641,1874722) kind=expr len=156
factoryBotSpawn00['x']=-0x16,factoryBotSpawn00['y']=2.5,factoryBotSpawn00['z']=39.900001525878906,factoryBotSpawn00['rx']=0x39,factoryBotSpawn00['ry']=0xf2;
// __UNIT__ u0443 [1874722,1874732) kind=var len=25
var factoryBotSpawn01={};
// __UNIT__ u0444 [1874732,1874811) kind=expr len=154
factoryBotSpawn01['x']=6.199999809265137,factoryBotSpawn01['y']=2.5,factoryBotSpawn01['z']=40.5,factoryBotSpawn01['rx']=0x34,factoryBotSpawn01['ry']=0xf0;
// __UNIT__ u0445 [1874811,1874821) kind=var len=25
var factoryBotSpawn02={};
// __UNIT__ u0446 [1874821,1874901) kind=expr len=155
factoryBotSpawn02['x']=28.799999237060547,factoryBotSpawn02['y']=2.5,factoryBotSpawn02['z']=0x13,factoryBotSpawn02['rx']=0x33,factoryBotSpawn02['ry']=0xf4;
// __UNIT__ u0447 [1874901,1874911) kind=var len=20
var botMapPoseUA={};
// __UNIT__ u0448 [1874911,1874990) kind=expr len=129
botMapPoseUA['x']=29.700000762939453,botMapPoseUA['y']=2.5,botMapPoseUA['z']=0x3,botMapPoseUA['rx']=0x31,botMapPoseUA['ry']=0x3e;
// __UNIT__ u0449 [1874990,1875000) kind=var len=20
var botMapPoseUB={};
// __UNIT__ u0450 [1875000,1875094) kind=expr len=144
botMapPoseUB['x']=20.899999618530273,botMapPoseUB['y']=2.5,botMapPoseUB['z']=3.0999999046325684,botMapPoseUB['rx']=0x40,botMapPoseUB['ry']=0x15;
// __UNIT__ u0451 [1875094,1875104) kind=var len=20
var botMapPoseUC={};
// __UNIT__ u0452 [1875104,1875196) kind=expr len=142
botMapPoseUC['x']=6.599999904632568,botMapPoseUC['y']=2.5,botMapPoseUC['z']=6.300000190734863,botMapPoseUC['rx']=0x2f,botMapPoseUC['ry']=0x6b;
// __UNIT__ u0453 [1875196,1875206) kind=var len=20
var botMapPoseUD={};
// __UNIT__ u0454 [1875206,1875301) kind=expr len=145
botMapPoseUD['x']=-0.20000000298023224,botMapPoseUD['y']=2.5,botMapPoseUD['z']=3.299999952316284,botMapPoseUD['rx']=0x2f,botMapPoseUD['ry']=0x55;
// __UNIT__ u0455 [1875301,1875311) kind=var len=20
var botMapPoseUE={};
// __UNIT__ u0456 [1875311,1875407) kind=expr len=146
botMapPoseUE['x']=-0.8999999761581421,botMapPoseUE['y']=2.5,botMapPoseUE['z']=-11.399999618530273,botMapPoseUE['rx']=0x3b,botMapPoseUE['ry']=0xb1;
// __UNIT__ u0457 [1875407,1875417) kind=var len=20
var botMapPoseUF={};
// __UNIT__ u0458 [1875417,1875483) kind=expr len=116
botMapPoseUF['x']=8.5,botMapPoseUF['y']=2.5,botMapPoseUF['z']=-11.5,botMapPoseUF['rx']=0x49,botMapPoseUF['ry']=0xc2;
// __UNIT__ u0459 [1875483,1875493) kind=var len=20
var botMapPoseUG={};
// __UNIT__ u0460 [1875493,1875574) kind=expr len=131
botMapPoseUG['x']=20.600000381469727,botMapPoseUG['y']=2.5,botMapPoseUG['z']=-12.5,botMapPoseUG['rx']=0x34,botMapPoseUG['ry']=0x7f;
// __UNIT__ u0461 [1875574,1875584) kind=var len=20
var botMapPoseUH={};
// __UNIT__ u0462 [1875584,1875678) kind=expr len=144
botMapPoseUH['x']=9.699999809265137,botMapPoseUH['y']=2.5,botMapPoseUH['z']=-22.299999237060547,botMapPoseUH['rx']=0x38,botMapPoseUH['ry']=0x28;
// __UNIT__ u0463 [1875678,1875688) kind=var len=25
var factoryBotPoint12={};
// __UNIT__ u0464 [1875688,1875784) kind=expr len=171
factoryBotPoint12['x']=-11.300000190734863,factoryBotPoint12['y']=2.5,factoryBotPoint12['z']=-23.600000381469727,factoryBotPoint12['rx']=0x3a,factoryBotPoint12['ry']=0x59;
// __UNIT__ u0465 [1875784,1875794) kind=var len=25
var factoryBotPoint13={};
// __UNIT__ u0466 [1875794,1875875) kind=expr len=156
factoryBotPoint13['x']=-22.200000762939453,factoryBotPoint13['y']=2.5,factoryBotPoint13['z']=-0x9,factoryBotPoint13['rx']=0x38,factoryBotPoint13['ry']=0x72;
// __UNIT__ u0467 [1875875,1875885) kind=var len=25
var factoryBotPoint14={};
// __UNIT__ u0468 [1875885,1875965) kind=expr len=155
factoryBotPoint14['x']=-32.400001525878906,factoryBotPoint14['y']=2.5,factoryBotPoint14['z']=0x7,factoryBotPoint14['rx']=0x40,factoryBotPoint14['ry']=0x72;
// __UNIT__ u0469 [1875965,1875975) kind=var len=25
var factoryBotPoint15={};
// __UNIT__ u0470 [1875975,1876085) kind=expr len=185
factoryBotPoint15['x']=-32.79999923706055,factoryBotPoint15['y']=-1.7999999523162842,factoryBotPoint15['z']=19.100000381469727,factoryBotPoint15['rx']=0x31,factoryBotPoint15['ry']=0xc1;
// __UNIT__ u0471 [1876085,1876095) kind=var len=25
var factoryBotPoint16={};
// __UNIT__ u0472 [1876095,1876205) kind=expr len=185
factoryBotPoint16['x']=-4.800000190734863,factoryBotPoint16['y']=-0.8999999761581421,factoryBotPoint16['z']=23.700000762939453,factoryBotPoint16['rx']=0x37,factoryBotPoint16['ry']=0x10;
// __UNIT__ u0473 [1876205,1876215) kind=var len=25
var factoryBotPoint17={};
// __UNIT__ u0474 [1876215,1876310) kind=expr len=170
factoryBotPoint17['x']=-22.899999618530273,factoryBotPoint17['y']=2.5,factoryBotPoint17['z']=25.100000381469727,factoryBotPoint17['rx']=0x42,factoryBotPoint17['ry']=0xe6;
// __UNIT__ u0475 [1876310,1876320) kind=var len=24
var factoryNavPoint1={};
// __UNIT__ u0476 [1876320,1876401) kind=expr len=123
factoryNavPoint1['x']=-20.390042328829992,factoryNavPoint1['y']=1.0137487207870537,factoryNavPoint1['z']=40.26315008117996;
// __UNIT__ u0477 [1876401,1876411) kind=var len=24
var factoryNavPoint2={};
// __UNIT__ u0478 [1876411,1876491) kind=expr len=122
factoryNavPoint2['x']=15.246698652920202,factoryNavPoint2['y']=0.9560260427605223,factoryNavPoint2['z']=40.40338267723996;
// __UNIT__ u0479 [1876491,1876501) kind=var len=24
var factoryNavPoint3={};
// __UNIT__ u0480 [1876501,1876579) kind=expr len=120
factoryNavPoint3['x']=8.27968055154107,factoryNavPoint3['y']=0.9264680081761818,factoryNavPoint3['z']=5.571631971866196;
// __UNIT__ u0481 [1876579,1876589) kind=var len=24
var factoryNavPoint4={};
// __UNIT__ u0482 [1876589,1876669) kind=expr len=122
factoryNavPoint4['x']=-5.790133359946395,factoryNavPoint4['y']=1.0175892698364963,factoryNavPoint4['z']=-29.5529592327037;
// __UNIT__ u0483 [1876669,1876679) kind=var len=24
var factoryNavPoint5={};
// __UNIT__ u0484 [1876679,1876761) kind=expr len=124
factoryNavPoint5['x']=-34.314927775930755,factoryNavPoint5['y']=0.9093344094423133,factoryNavPoint5['z']=2.9493227098146946;
// __UNIT__ u0485 [1876761,1876771) kind=var len=23
var cinematicStart0={};
// __UNIT__ u0486 [1876771,1876833) kind=expr len=103
cinematicStart0['position']=[-0x18,0x4,0x2a],cinematicStart0[stringDecoderAlias(0xf5f)]=[0xe,0x3,0x24];
// __UNIT__ u0487 [1876833,1876843) kind=var len=21
var cinematicEnd0={};
// __UNIT__ u0488 [1876843,1876906) kind=expr len=85
cinematicEnd0['position']=[-0x2,0x2,0x27],cinematicEnd0['JoIkrtRxhZ']=[0xe,0x3,0x24];
// __UNIT__ u0489 [1876906,1876916) kind=var len=23
var cinematicScene0={};
// __UNIT__ u0490 [1876916,1876967) kind=expr len=129
cinematicScene0['start']=cinematicStart0,cinematicScene0[stringDecoderAlias(0x8f7)]=cinematicEnd0,cinematicScene0['time']=0x3a98;
// __UNIT__ u0491 [1876967,1876977) kind=var len=23
var cinematicStart1={};
// __UNIT__ u0492 [1876977,1877043) kind=expr len=92
cinematicStart1['position']=[-0x2,0x3,0x13],cinematicStart1['JoIkrtRxhZ']=[-0x18,-0x2,0x14];
// __UNIT__ u0493 [1877043,1877053) kind=var len=21
var cinematicEnd1={};
// __UNIT__ u0494 [1877053,1877119) kind=expr len=103
cinematicEnd1['position']=[-0x10,-0x2,0x14],cinematicEnd1[stringDecoderAlias(0xf5f)]=[-0x18,-0x2,0x14];
// __UNIT__ u0495 [1877119,1877129) kind=var len=23
var cinematicScene1={};
// __UNIT__ u0496 [1877129,1877178) kind=expr len=127
cinematicScene1[stringDecoderAlias(0x9a6)]=cinematicStart1,cinematicScene1['end']=cinematicEnd1,cinematicScene1['time']=0x3a98;
// __UNIT__ u0497 [1877178,1877188) kind=var len=23
var cinematicStart2={};
// __UNIT__ u0498 [1877188,1877254) kind=expr len=92
cinematicStart2['position']=[-0x1a,0x2,-0x8],cinematicStart2['JoIkrtRxhZ']=[-0xa,0x3,-0x16];
// __UNIT__ u0499 [1877254,1877264) kind=var len=21
var cinematicEnd2={};
// __UNIT__ u0500 [1877264,1877331) kind=expr len=89
cinematicEnd2['position']=[-0x12,0x4,-0x10],cinematicEnd2['JoIkrtRxhZ']=[-0xa,0x3,-0x16];
// __UNIT__ u0501 [1877331,1877341) kind=var len=23
var cinematicScene2={};
// __UNIT__ u0502 [1877341,1877391) kind=expr len=128
cinematicScene2['start']=cinematicStart2,cinematicScene2['end']=cinematicEnd2,cinematicScene2[stringDecoderAlias(0x35c)]=0x2328;
// __UNIT__ u0503 [1877391,1877401) kind=var len=27
var nightLightingPreset={};
// __UNIT__ u0504 [1877401,1877506) kind=expr len=203
nightLightingPreset[stringDecoderAlias(0xcd7)]=!![],nightLightingPreset[stringDecoderAlias(0xc53)]=!![],nightLightingPreset['sunColor']=[0.5,0.35,0.2],nightLightingPreset['sunDirection']=[-0.5,0.8,-0.3];
// __UNIT__ u0505 [1877506,1877516) kind=var len=22
var dayLightPreset={};
// __UNIT__ u0506 [1877516,1877599) kind=expr len=149
dayLightPreset[stringDecoderAlias(0xcd7)]=![],dayLightPreset[stringDecoderAlias(0x7d5)]=[0x1,0.9,0.8],dayLightPreset['sunDirection']=[-0.5,1.8,-0.5];
// __UNIT__ u0507 [1877599,1877609) kind=var len=20
var spawnPointV4={};
// __UNIT__ u0508 [1877609,1877676) kind=expr len=117
spawnPointV4['x']=-0xd,spawnPointV4['y']=6.5,spawnPointV4['z']=-0x25,spawnPointV4['rx']=0x40,spawnPointV4['ry']=0xc0;
// __UNIT__ u0509 [1877676,1877686) kind=var len=20
var spawnPointV5={};
// __UNIT__ u0510 [1877686,1877753) kind=expr len=117
spawnPointV5['x']=-0.7,spawnPointV5['y']=6.5,spawnPointV5['z']=-0x14,spawnPointV5['rx']=0x40,spawnPointV5['ry']=0xff;
// __UNIT__ u0511 [1877753,1877763) kind=var len=20
var spawnPointV6={};
// __UNIT__ u0512 [1877763,1877828) kind=expr len=115
spawnPointV6['x']=6.1,spawnPointV6['y']=2.8,spawnPointV6['z']=-8.3,spawnPointV6['rx']=0x3e,spawnPointV6['ry']=0xbe;
// __UNIT__ u0513 [1877828,1877838) kind=var len=20
var spawnPointV7={};
// __UNIT__ u0514 [1877838,1877903) kind=expr len=115
spawnPointV7['x']=2.2,spawnPointV7['y']=7.4,spawnPointV7['z']=33.1,spawnPointV7['rx']=0x3f,spawnPointV7['ry']=0xfe;
// __UNIT__ u0515 [1877903,1877913) kind=var len=20
var spawnPointV8={};
// __UNIT__ u0516 [1877913,1877980) kind=expr len=117
spawnPointV8['x']=18.9,spawnPointV8['y']=9.3,spawnPointV8['z']=-20.4,spawnPointV8['rx']=0x40,spawnPointV8['ry']=0xfe;
// __UNIT__ u0517 [1877980,1877990) kind=var len=21
var mapNavPointV9={};
// __UNIT__ u0518 [1877990,1878071) kind=expr len=114
mapNavPointV9['x']=-7.496861402285596,mapNavPointV9['y']=5.0513023839844955,mapNavPointV9['z']=-33.03368692626958;
// __UNIT__ u0519 [1878071,1878081) kind=var len=21
var mapNavPoint02={};
// __UNIT__ u0520 [1878081,1878161) kind=expr len=113
mapNavPoint02['x']=21.48919543862951,mapNavPoint02['y']=7.792162199255133,mapNavPoint02['z']=-24.617679868263167;
// __UNIT__ u0521 [1878161,1878171) kind=var len=21
var mapNavPointVb={};
// __UNIT__ u0522 [1878171,1878250) kind=expr len=112
mapNavPointVb['x']=29.712758136666878,mapNavPointVb['y']=4.149390030855203,mapNavPointVb['z']=5.246119611985577;
// __UNIT__ u0523 [1878250,1878260) kind=var len=21
var mapNavPointVc={};
// __UNIT__ u0524 [1878260,1878339) kind=expr len=112
mapNavPointVc['x']=2.422079862998814,mapNavPointVc['y']=5.880384538687916,mapNavPointVc['z']=27.938637089010967;
// __UNIT__ u0525 [1878339,1878349) kind=var len=21
var mapNavPointVd={};
// __UNIT__ u0526 [1878349,1878430) kind=expr len=114
mapNavPointVd['x']=1.2459032018891456,mapNavPointVd['y']=1.3603122480363306,mapNavPointVd['z']=-6.384632241090827;
// __UNIT__ u0527 [1878430,1878440) kind=var len=23
var refineryPointVe={};
// __UNIT__ u0528 [1878440,1878478) kind=expr len=77
refineryPointVe['x']=-0.4,refineryPointVe['y']=2.8,refineryPointVe['z']=-7.9;
// __UNIT__ u0529 [1878478,1878488) kind=var len=23
var refineryPointVf={};
// __UNIT__ u0530 [1878488,1878525) kind=expr len=76
refineryPointVf['x']=6.4,refineryPointVf['y']=7.4,refineryPointVf['z']=23.8;
// __UNIT__ u0531 [1878525,1878535) kind=var len=23
var refineryPointVg={};
// __UNIT__ u0532 [1878535,1878573) kind=expr len=77
refineryPointVg['x']=24.5,refineryPointVg['y']=9.2,refineryPointVg['z']=0x15;
// __UNIT__ u0533 [1878573,1878583) kind=var len=21
var mapNavPointVh={};
// __UNIT__ u0534 [1878583,1878622) kind=expr len=72
mapNavPointVh['x']=0x21,mapNavPointVh['y']=9.3,mapNavPointVh['z']=-14.7;
// __UNIT__ u0535 [1878622,1878632) kind=var len=21
var mapNavPointVi={};
// __UNIT__ u0536 [1878632,1878670) kind=expr len=71
mapNavPointVi['x']=5.6,mapNavPointVi['y']=7.8,mapNavPointVi['z']=-17.2;
// __UNIT__ u0537 [1878670,1878680) kind=var len=21
var mapNavPointVj={};
// __UNIT__ u0538 [1878680,1878720) kind=expr len=73
mapNavPointVj['x']=-12.1,mapNavPointVj['y']=6.5,mapNavPointVj['z']=-10.5;
// __UNIT__ u0539 [1878720,1878730) kind=var len=30
var cinematicSegmentAStart={};
// __UNIT__ u0540 [1878730,1878794) kind=expr len=119
cinematicSegmentAStart['position']=[7.12,8.5,-0x25],cinematicSegmentAStart[stringDecoderAlias(0xf5f)]=[-0xc,7.5,-0x14];
// __UNIT__ u0541 [1878794,1878804) kind=var len=28
var cinematicWaypointEnd={};
// __UNIT__ u0542 [1878804,1878870) kind=expr len=102
cinematicWaypointEnd['position']=[-2.4,6.5,-0x1d],cinematicWaypointEnd['JoIkrtRxhZ']=[-0xc,7.5,-0x14];
// __UNIT__ u0543 [1878870,1878880) kind=var len=25
var cinematicSegmentA={};
// __UNIT__ u0544 [1878880,1878938) kind=expr len=186
cinematicSegmentA[stringDecoderAlias(0x9a6)]=cinematicSegmentAStart,cinematicSegmentA[stringDecoderAlias(0x8f7)]=cinematicWaypointEnd,cinematicSegmentA[stringDecoderAlias(0x35c)]=0x2ee0;
// __UNIT__ u0545 [1878938,1878948) kind=var len=30
var cinematicSegmentBStart={};
// __UNIT__ u0546 [1878948,1879010) kind=expr len=117
cinematicSegmentBStart[stringDecoderAlias(0x215)]=[-0x3,0x5,0x9],cinematicSegmentBStart['JoIkrtRxhZ']=[0x3,0x8,0x16];
// __UNIT__ u0547 [1879010,1879020) kind=var len=28
var cinematicSegmentBEnd={};
// __UNIT__ u0548 [1879020,1879082) kind=expr len=113
cinematicSegmentBEnd[stringDecoderAlias(0x215)]=[0x3,0x8,0x16],cinematicSegmentBEnd['JoIkrtRxhZ']=[5.5,0xa,0x1e];
// __UNIT__ u0549 [1879082,1879092) kind=var len=25
var cinematicSegmentB={};
// __UNIT__ u0550 [1879092,1879138) kind=expr len=129
cinematicSegmentB['start']=cinematicSegmentBStart,cinematicSegmentB['end']=cinematicSegmentBEnd,cinematicSegmentB['time']=0x3a98;
// __UNIT__ u0551 [1879138,1879148) kind=var len=22
var smokeEmitterVq={};
// __UNIT__ u0552 [1879148,1879301) kind=expr len=240
smokeEmitterVq['type']='smoke',smokeEmitterVq['spawnEvery']=0x5,smokeEmitterVq['scaleRange']=[1.5,2.5],smokeEmitterVq['position']=[27.5,0xf,-0xf],smokeEmitterVq['vary']=[0x0,0x6,0x3],smokeEmitterVq[stringDecoderAlias(0x48b)]=[0.1,-0.1,0x0];
// __UNIT__ u0553 [1879301,1879311) kind=var len=22
var smokeEmitterVr={};
// __UNIT__ u0554 [1879311,1879473) kind=expr len=279
smokeEmitterVr[stringDecoderAlias(0xafb)]=stringDecoderAlias(0xd4c),smokeEmitterVr['spawnEvery']=0x7,smokeEmitterVr['scaleRange']=[1.5,2.5],smokeEmitterVr['position']=[0x1,15.5,29.5],smokeEmitterVr['vary']=[0x3,0x3,0x0],smokeEmitterVr[stringDecoderAlias(0x48b)]=[0x0,-0.05,-0.1];
// __UNIT__ u0555 [1879473,1879483) kind=var len=22
var smokeEmitterVs={};
// __UNIT__ u0557 [1879637,1879647) kind=var len=22
var smokeEmitterVt={};
// __UNIT__ u0559 [1879805,1879815) kind=var len=22
var smokeEmitterVu={};
// __UNIT__ u0561 [1879979,1879989) kind=var len=19
var spawnPoseVv={};
// __UNIT__ u0562 [1879989,1880096) kind=expr len=152
spawnPoseVv['x']=-9.699999809265137,spawnPoseVv['y']=6.199999809265137,spawnPoseVv['z']=29.299999237060547,spawnPoseVv['rx']=0x3e,spawnPoseVv['ry']=0x6;
// __UNIT__ u0563 [1880096,1880106) kind=var len=19
var spawnPoseVw={};
// __UNIT__ u0564 [1880106,1880216) kind=expr len=155
spawnPoseVw['x']=-21.100000381469727,spawnPoseVw['y']=9.100000381469727,spawnPoseVw['z']=-26.200000762939453,spawnPoseVw['rx']=0x3b,spawnPoseVw['ry']=0x7e;
// __UNIT__ u0565 [1880216,1880226) kind=var len=19
var spawnPoseVx={};
// __UNIT__ u0566 [1880226,1880322) kind=expr len=141
spawnPoseVx['x']=0x20,spawnPoseVx['y']=2.0999999046325684,spawnPoseVx['z']=-23.299999237060547,spawnPoseVx['rx']=0x3d,spawnPoseVx['ry']=0x84;
// __UNIT__ u0567 [1880322,1880332) kind=var len=19
var spawnPoseVy={};
// __UNIT__ u0568 [1880332,1880441) kind=expr len=154
spawnPoseVy['x']=26.100000381469727,spawnPoseVy['y']=9.899999618530273,spawnPoseVy['z']=-24.100000381469727,spawnPoseVy['rx']=0x3b,spawnPoseVy['ry']=0xda;
// __UNIT__ u0569 [1880441,1880451) kind=var len=19
var spawnPoseVz={};
// __UNIT__ u0570 [1880451,1880559) kind=expr len=153
spawnPoseVz['x']=3.299999952316284,spawnPoseVz['y']=6.099999904632568,spawnPoseVz['z']=-11.100000381469727,spawnPoseVz['rx']=0x3e,spawnPoseVz['ry']=0xd6;
// __UNIT__ u0571 [1880559,1880569) kind=var len=19
var spawnPoseVA={};
// __UNIT__ u0572 [1880569,1880677) kind=expr len=153
spawnPoseVA['x']=46.400001525878906,spawnPoseVA['y']=6.300000190734863,spawnPoseVA['z']=12.600000381469727,spawnPoseVA['rx']=0x3f,spawnPoseVA['ry']=0xe3;
// __UNIT__ u0573 [1880677,1880687) kind=var len=19
var spawnPoseVB={};
// __UNIT__ u0574 [1880687,1880795) kind=expr len=153
spawnPoseVB['x']=42.599998474121094,spawnPoseVB['y']=4.599999904632568,spawnPoseVB['z']=-48.79999923706055,spawnPoseVB['rx']=0x3e,spawnPoseVB['ry']=0xab;
// __UNIT__ u0575 [1880795,1880805) kind=var len=19
var spawnPoseVC={};
// __UNIT__ u0576 [1880805,1880900) kind=expr len=140
spawnPoseVC['x']=0x15,spawnPoseVC['y']=9.899999618530273,spawnPoseVC['z']=-17.799999237060547,spawnPoseVC['rx']=0x3e,spawnPoseVC['ry']=0xa0;
// __UNIT__ u0577 [1880900,1880910) kind=var len=21
var mapNavPointVD={};
// __UNIT__ u0578 [1880910,1880991) kind=expr len=114
mapNavPointVD['x']=32.29380753673695,mapNavPointVD['y']=0.6403324698151001,mapNavPointVD['z']=-18.701872554538568;
// __UNIT__ u0579 [1880991,1881001) kind=var len=21
var mapNavPointVE={};
// __UNIT__ u0580 [1881001,1881081) kind=expr len=113
mapNavPointVE['x']=55.02171570408234,mapNavPointVE['y']=6.661546811733244,mapNavPointVE['z']=-54.120196208339166;
// __UNIT__ u0581 [1881081,1881091) kind=var len=21
var mapNavPointVF={};
// __UNIT__ u0582 [1881091,1881170) kind=expr len=112
mapNavPointVF['x']=-9.259663014746906,mapNavPointVF['y']=5.47591583911105,mapNavPointVF['z']=-39.76599959686564;
// __UNIT__ u0583 [1881170,1881180) kind=var len=21
var mapNavPointVG={};
// __UNIT__ u0584 [1881180,1881258) kind=expr len=111
mapNavPointVG['x']=9.929534460338232,mapNavPointVG['y']=5.500801311424659,mapNavPointVG['z']=6.226374489316726;
// __UNIT__ u0585 [1881258,1881268) kind=var len=21
var mapNavPointVH={};
// __UNIT__ u0586 [1881268,1881347) kind=expr len=112
mapNavPointVH['x']=50.569006760835464,mapNavPointVH['y']=4.640717330475425,mapNavPointVH['z']=5.738879440762773;
// __UNIT__ u0587 [1881347,1881357) kind=var len=36
var snowfallCinematicSceneAStart={};
// __UNIT__ u0588 [1881357,1881423) kind=expr len=133
snowfallCinematicSceneAStart[stringDecoderAlias(0x215)]=[0x3a,0x8,-0x37],snowfallCinematicSceneAStart['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0589 [1881423,1881433) kind=var len=34
var snowfallCinematicSceneAEnd={};
// __UNIT__ u0590 [1881433,1881499) kind=expr len=129
snowfallCinematicSceneAEnd[stringDecoderAlias(0x215)]=[0x31,0x9,-38.5],snowfallCinematicSceneAEnd['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0591 [1881499,1881509) kind=var len=31
var snowfallCinematicSceneA={};
// __UNIT__ u0592 [1881509,1881558) kind=expr len=177
snowfallCinematicSceneA[stringDecoderAlias(0x9a6)]=snowfallCinematicSceneAStart,snowfallCinematicSceneA['end']=snowfallCinematicSceneAEnd,snowfallCinematicSceneA['time']=0x2ee0;
// __UNIT__ u0593 [1881558,1881568) kind=var len=36
var snowfallCinematicSceneBStart={};
// __UNIT__ u0594 [1881568,1881634) kind=expr len=133
snowfallCinematicSceneBStart[stringDecoderAlias(0x215)]=[0x3a,0x8,-0x37],snowfallCinematicSceneBStart['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0595 [1881634,1881644) kind=var len=34
var snowfallCinematicSceneBEnd={};
// __UNIT__ u0596 [1881644,1881708) kind=expr len=142
snowfallCinematicSceneBEnd[stringDecoderAlias(0x215)]=[0x31,0x9,-38.5],snowfallCinematicSceneBEnd[stringDecoderAlias(0xf5f)]=[0x22,0xa,-0x16];
// __UNIT__ u0597 [1881708,1881718) kind=var len=31
var snowfallCinematicSceneB={};
// __UNIT__ u0598 [1881718,1881764) kind=expr len=159
snowfallCinematicSceneB['start']=snowfallCinematicSceneBStart,snowfallCinematicSceneB['end']=snowfallCinematicSceneBEnd,snowfallCinematicSceneB['time']=0x2ee0;
// __UNIT__ u0599 [1881764,1881774) kind=var len=36
var snowfallCinematicSceneCStart={};
// __UNIT__ u0600 [1881774,1881838) kind=expr len=131
snowfallCinematicSceneCStart['position']=[0x3a,0x8,-0x37],snowfallCinematicSceneCStart[stringDecoderAlias(0xf5f)]=[0x22,0xa,-0x16];
// __UNIT__ u0601 [1881838,1881848) kind=var len=34
var snowfallCinematicSceneCEnd={};
// __UNIT__ u0602 [1881848,1881914) kind=expr len=129
snowfallCinematicSceneCEnd[stringDecoderAlias(0x215)]=[0x31,0x9,-38.5],snowfallCinematicSceneCEnd['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0603 [1881914,1881924) kind=var len=31
var snowfallCinematicSceneC={};
// __UNIT__ u0604 [1881924,1881970) kind=expr len=159
snowfallCinematicSceneC['start']=snowfallCinematicSceneCStart,snowfallCinematicSceneC['end']=snowfallCinematicSceneCEnd,snowfallCinematicSceneC['time']=0x2ee0;
// __UNIT__ u0605 [1881970,1881980) kind=var len=31
var snowfallSkyboxMaterials={};
// __UNIT__ u0606 [1881980,1882095) kind=expr len=259
snowfallSkyboxMaterials[stringDecoderAlias(0xaef)]='ice.webp',snowfallSkyboxMaterials[stringDecoderAlias(0xeb2)]='water.webp',snowfallSkyboxMaterials[stringDecoderAlias(0xbe0)]='croppedterrain.webp',snowfallSkyboxMaterials['aurora']=stringDecoderAlias(0xf12);
// __UNIT__ u0607 [1882095,1882105) kind=var len=32
var snowfallNightLightPreset={};
// __UNIT__ u0608 [1882105,1882224) kind=expr len=222
snowfallNightLightPreset[stringDecoderAlias(0xcd7)]=!![],snowfallNightLightPreset['skyboxMult']=[0.4,0.4,0.4],snowfallNightLightPreset['sunColor']=[0x1,0.7,0.4],snowfallNightLightPreset['sunDirection']=[-0.5,0.8*0.7,-0.3];
// __UNIT__ u0609 [1882224,1882234) kind=var len=30
var snowfallDayLightPreset={};
// __UNIT__ u0610 [1882234,1882329) kind=expr len=155
snowfallDayLightPreset['skyboxMult']=[0x1,0x1,0x1],snowfallDayLightPreset['sunColor']=[0x1,0.9,0.8],snowfallDayLightPreset['sunDirection']=[-0.5,0.8,-0.3];
// __UNIT__ u0611 [1882329,1882339) kind=var len=24
var skyboxTextureMap={};
// __UNIT__ u0612 [1882339,1882501) kind=expr len=336
skyboxTextureMap[stringDecoderAlias(0x297)]=stringDecoderAlias(0xf41),skyboxTextureMap[stringDecoderAlias(0x10a5)]=stringDecoderAlias(0x951),skyboxTextureMap['vines1']='vines2.webp',skyboxTextureMap[stringDecoderAlias(0x30e)]='water1.webp',skyboxTextureMap['waterfall1']=stringDecoderAlias(0x1089),skyboxTextureMap['light']='light.png';
// __UNIT__ u0613 [1882501,1882511) kind=var len=31
var forestSunsetLightPreset={};
// __UNIT__ u0614 [1882511,1882618) kind=expr len=221
forestSunsetLightPreset['sunset']=!![],forestSunsetLightPreset[stringDecoderAlias(0x7a1)]=[1.1,0.9,0.7],forestSunsetLightPreset['sunColor']=[1.2,0.8,0.4],forestSunsetLightPreset[stringDecoderAlias(0x359)]=[-0.5,0.8,-0.3];
// __UNIT__ u0615 [1882618,1882628) kind=var len=28
var forestDayLightPreset={};
// __UNIT__ u0616 [1882628,1882721) kind=expr len=177
forestDayLightPreset[stringDecoderAlias(0x7a1)]=[1.1,1.1,1.1],forestDayLightPreset['sunColor']=[1.1,0.9,0.7],forestDayLightPreset[stringDecoderAlias(0x359)]=[-0.5,0.8*1.7,-0.3];
// __UNIT__ u0617 [1882721,1882731) kind=var len=20
var spawnPointVX={};
// __UNIT__ u0618 [1882731,1882809) kind=expr len=128
spawnPointVX['x']=0x0,spawnPointVX['y']=9.299999952316284,spawnPointVX['z']=0x0,spawnPointVX['rx']=0x3e,spawnPointVX['ry']=0xf9;
// __UNIT__ u0619 [1882809,1882819) kind=var len=20
var spawnPointVY={};
// __UNIT__ u0620 [1882819,1882897) kind=expr len=128
spawnPointVY['x']=5.800000190734863,spawnPointVY['y']=4.5,spawnPointVY['z']=0xf,spawnPointVY['rx']=0x3e,spawnPointVY['ry']=0xee;
// __UNIT__ u0621 [1882897,1882907) kind=var len=20
var spawnPointVZ={};
// __UNIT__ u0622 [1882907,1883014) kind=expr len=157
spawnPointVZ['x']=54.400001525878906,spawnPointVZ['y']=7.099999904632568,spawnPointVZ['z']=8.100000381469727,spawnPointVZ['rx']=0x3e,spawnPointVZ['ry']=0x5f;
// __UNIT__ u0623 [1883014,1883024) kind=var len=20
var spawnPointW0={};
// __UNIT__ u0624 [1883024,1883103) kind=expr len=129
spawnPointW0['x']=65.80000305175781,spawnPointW0['y']=4.5,spawnPointW0['z']=-0xf,spawnPointW0['rx']=0x3f,spawnPointW0['ry']=0x62;
// __UNIT__ u0625 [1883103,1883113) kind=var len=20
var spawnPointW1={};
// __UNIT__ u0626 [1883113,1883208) kind=expr len=145
spawnPointW1['x']=47.599998474121094,spawnPointW1['y']=4.5,spawnPointW1['z']=-16.700000762939453,spawnPointW1['rx']=0x3e,spawnPointW1['ry']=0xb9;
// __UNIT__ u0627 [1883208,1883218) kind=var len=20
var spawnPointW2={};
// __UNIT__ u0628 [1883218,1883327) kind=expr len=159
spawnPointW2['x']=27.100000381469727,spawnPointW2['y']=3.200000047683716,spawnPointW2['z']=-23.899999618530273,spawnPointW2['rx']=0x40,spawnPointW2['ry']=0xc7;
// __UNIT__ u0629 [1883327,1883337) kind=var len=20
var spawnPointW3={};
// __UNIT__ u0630 [1883337,1883431) kind=expr len=144
spawnPointW3['x']=50.20000076293945,spawnPointW3['y']=4.5,spawnPointW3['z']=-40.400001525878906,spawnPointW3['rx']=0x3f,spawnPointW3['ry']=0x62;
// __UNIT__ u0631 [1883431,1883441) kind=var len=20
var spawnPointW4={};
// __UNIT__ u0632 [1883441,1883535) kind=expr len=144
spawnPointW4['x']=17.799999237060547,spawnPointW4['y']=5.5,spawnPointW4['z']=-33.20000076293945,spawnPointW4['rx']=0x40,spawnPointW4['ry']=0x3d;
// __UNIT__ u0633 [1883535,1883545) kind=var len=20
var spawnPointW5={};
// __UNIT__ u0634 [1883545,1883654) kind=expr len=159
spawnPointW5['x']=-12.399999618530273,spawnPointW5['y']=1.899999976158142,spawnPointW5['z']=-7.800000190734863,spawnPointW5['rx']=0x3f,spawnPointW5['ry']=0xd7;
// __UNIT__ u0635 [1883654,1883664) kind=var len=20
var spawnPointW6={};
// __UNIT__ u0636 [1883664,1883776) kind=expr len=162
spawnPointW6['x']=-29.899999618530273,spawnPointW6['y']=-0.10000000149011612,spawnPointW6['z']=-34.29999923706055,spawnPointW6['rx']=0x40,spawnPointW6['ry']=0xa3;
// __UNIT__ u0637 [1883776,1883786) kind=var len=20
var spawnPointW7={};
// __UNIT__ u0638 [1883786,1883883) kind=expr len=147
spawnPointW7['x']=-10.899999618530273,spawnPointW7['y']=2.9000000953674316,spawnPointW7['z']=-26.5,spawnPointW7['rx']=0x3d,spawnPointW7['ry']=0x45;
// __UNIT__ u0639 [1883883,1883893) kind=var len=20
var spawnPointW8={};
// __UNIT__ u0640 [1883893,1883973) kind=expr len=130
spawnPointW8['x']=26.899999618530273,spawnPointW8['y']=0x4,spawnPointW8['z']=-0xa,spawnPointW8['rx']=0x40,spawnPointW8['ry']=0x80;
// __UNIT__ u0641 [1883973,1883983) kind=var len=21
var mapNavPointW9={};
// __UNIT__ u0642 [1883983,1884065) kind=expr len=115
mapNavPointW9['x']=52.412523935983245,mapNavPointW9['y']=3.0143806332057093,mapNavPointW9['z']=-12.506612329683776;
// __UNIT__ u0643 [1884065,1884075) kind=var len=21
var mapNavPointWa={};
// __UNIT__ u0644 [1884075,1884158) kind=expr len=116
mapNavPointWa['x']=-18.73772430419922,mapNavPointWa['y']=-0.9737320028873911,mapNavPointWa['z']=-21.204753875732422;
// __UNIT__ u0645 [1884158,1884168) kind=var len=21
var mapNavPointWb={};
// __UNIT__ u0646 [1884168,1884250) kind=expr len=115
mapNavPointWb['x']=1.2392575152488483,mapNavPointWb['y']=3.0356469812039117,mapNavPointWb['z']=-30.324765287067407;
// __UNIT__ u0647 [1884250,1884260) kind=var len=21
var mapNavPointWc={};
// __UNIT__ u0648 [1884260,1884338) kind=expr len=111
mapNavPointWc['x']=-6.566822092670819,mapNavPointWc['y']=2.82443876168052,mapNavPointWc['z']=11.94691137566032;
// __UNIT__ u0649 [1884338,1884348) kind=var len=21
var mapNavPointWd={};
// __UNIT__ u0650 [1884348,1884429) kind=expr len=114
mapNavPointWd['x']=32.89552688598633,mapNavPointWd['y']=1.8954384733746004,mapNavPointWd['z']=-25.613801956176758;
// __UNIT__ u0651 [1884429,1884439) kind=var len=27
var waterSmokeEmitterWe={};
// __UNIT__ u0652 [1884439,1884599) kind=expr len=292
waterSmokeEmitterWe['type']='waterSmoke',waterSmokeEmitterWe['spawnEvery']=0x2,waterSmokeEmitterWe['scaleRange']=[2.5,3.5],waterSmokeEmitterWe[stringDecoderAlias(0x215)]=[-0x28,-0x3,-0x26],waterSmokeEmitterWe['vary']=[0xa,0x0,0x3],waterSmokeEmitterWe[stringDecoderAlias(0x48b)]=[0x0,0.5,0.3];
// __UNIT__ u0653 [1884599,1884609) kind=var len=30
var forestWaterfallEmitter={};
// __UNIT__ u0654 [1884609,1884710) kind=expr len=181
forestWaterfallEmitter['directional']=!![],forestWaterfallEmitter['position']=[-0x28,-0xa,-0x26],forestWaterfallEmitter['volume']=1.2,forestWaterfallEmitter['file']='waterfall.mp3';
// __UNIT__ u0655 [1884710,1884720) kind=var len=29
var forestAmbienceEmitter={};
// __UNIT__ u0656 [1884720,1884816) kind=expr len=172
forestAmbienceEmitter['directional']=!![],forestAmbienceEmitter['position']=[0x21,0x19,-3.5],forestAmbienceEmitter['volume']=1.7,forestAmbienceEmitter['file']='forest.mp3';
// __UNIT__ u0657 [1884816,1884826) kind=var len=34
var forestCinematicSceneAStart={};
// __UNIT__ u0658 [1884826,1884888) kind=expr len=110
forestCinematicSceneAStart['position']=[44.5,0x5,3.5],forestCinematicSceneAStart['JoIkrtRxhZ']=[-3.5,4.5,4.8];
// __UNIT__ u0659 [1884888,1884898) kind=var len=32
var forestCinematicSceneAEnd={};
// __UNIT__ u0660 [1884898,1884960) kind=expr len=106
forestCinematicSceneAEnd['position']=[0x1c,4.5,0x3],forestCinematicSceneAEnd['JoIkrtRxhZ']=[-3.5,4.5,4.8];
// __UNIT__ u0661 [1884960,1884970) kind=var len=29
var forestCinematicSceneA={};
// __UNIT__ u0662 [1884970,1885023) kind=expr len=186
forestCinematicSceneA[stringDecoderAlias(0x9a6)]=forestCinematicSceneAStart,forestCinematicSceneA['end']=forestCinematicSceneAEnd,forestCinematicSceneA[stringDecoderAlias(0x35c)]=0x3a98;
// __UNIT__ u0663 [1885023,1885033) kind=var len=34
var forestCinematicSceneBStart={};
// __UNIT__ u0664 [1885033,1885100) kind=expr len=130
forestCinematicSceneBStart[stringDecoderAlias(0x215)]=[-0xc,0.4,-0x13],forestCinematicSceneBStart['JoIkrtRxhZ']=[-0x28,0x5,-0x26];
// __UNIT__ u0665 [1885100,1885110) kind=var len=32
var forestCinematicSceneBEnd={};
// __UNIT__ u0666 [1885110,1885178) kind=expr len=127
forestCinematicSceneBEnd[stringDecoderAlias(0x215)]=[-0x16,0.5,-0x15],forestCinematicSceneBEnd['JoIkrtRxhZ']=[-0x28,0x5,-0x26];
// __UNIT__ u0667 [1885178,1885188) kind=var len=29
var forestCinematicSceneB={};
// __UNIT__ u0668 [1885188,1885243) kind=expr len=188
forestCinematicSceneB['start']=forestCinematicSceneBStart,forestCinematicSceneB[stringDecoderAlias(0x8f7)]=forestCinematicSceneBEnd,forestCinematicSceneB[stringDecoderAlias(0x35c)]=0x1f40;
// __UNIT__ u0669 [1885243,1885253) kind=var len=28
var vegetationTextureMap={};
// __UNIT__ u0670 [1885253,1885668) kind=expr len=814
vegetationTextureMap['Grass']=stringDecoderAlias(0x441),vegetationTextureMap[stringDecoderAlias(0x662)]='Bush2.webp',vegetationTextureMap['Wood']='compressedTextures/Wood.webp',vegetationTextureMap['Bush3']=stringDecoderAlias(0xa1d),vegetationTextureMap['PlantsPlanter']=stringDecoderAlias(0xf29),vegetationTextureMap[stringDecoderAlias(0xb97)]=stringDecoderAlias(0x9b8),vegetationTextureMap[stringDecoderAlias(0x182)]='compressedTextures/Leaves.webp',vegetationTextureMap['Brick2']='compressedTextures/Brick2.webp',vegetationTextureMap['TrimSheet2']='TrimSheet2.webp',vegetationTextureMap['Water']=stringDecoderAlias(0xc9c),vegetationTextureMap['Tile']='compressedTextures/Tile.webp',vegetationTextureMap[stringDecoderAlias(0x850)]=stringDecoderAlias(0x441),vegetationTextureMap['Wine']=stringDecoderAlias(0xd76);
// __UNIT__ u0671 [1885668,1885678) kind=var len=28
var manorSunsetSkyPreset={};
// __UNIT__ u0672 [1885678,1885786) kind=expr len=195
manorSunsetSkyPreset['sunset']=!![],manorSunsetSkyPreset['skyboxMult']=[1.1,0.9,0.7],manorSunsetSkyPreset['sunColor']=[1.2,0.8,0.4],manorSunsetSkyPreset[stringDecoderAlias(0x359)]=[0.4,0.8,-0.1];
// __UNIT__ u0673 [1885786,1885796) kind=var len=30
var manorDaylightSkyPreset={};
// __UNIT__ u0674 [1885796,1885889) kind=expr len=183
manorDaylightSkyPreset[stringDecoderAlias(0x7a1)]=[0x1,0x1,0x1],manorDaylightSkyPreset[stringDecoderAlias(0x7d5)]=[0x1,0.8,0.6],manorDaylightSkyPreset['sunDirection']=[-0.5,1.2,-0.3];
// __UNIT__ u0675 [1885889,1885899) kind=var len=20
var spawnPointWq={};
// __UNIT__ u0676 [1885899,1886009) kind=expr len=160
spawnPointWq['x']=-17.700000762939453,spawnPointWq['y']=-9.300000190734863,spawnPointWq['z']=-36.79999923706055,spawnPointWq['rx']=0x40,spawnPointWq['ry']=0x7e;
// __UNIT__ u0677 [1886009,1886019) kind=var len=20
var spawnPointWr={};
// __UNIT__ u0678 [1886019,1886100) kind=expr len=131
spawnPointWr['x']=4.5,spawnPointWr['y']=-1.5,spawnPointWr['z']=-16.399999618530273,spawnPointWr['rx']=0x40,spawnPointWr['ry']=0xdf;
// __UNIT__ u0679 [1886100,1886110) kind=var len=20
var spawnPointWt={};
// __UNIT__ u0680 [1886110,1886206) kind=expr len=146
spawnPointWt['x']=40.900001525878906,spawnPointWt['y']=-1.5,spawnPointWt['z']=-2.4000000953674316,spawnPointWt['rx']=0x40,spawnPointWt['ry']=0x3e;
// __UNIT__ u0681 [1886206,1886216) kind=var len=20
var spawnPointWu={};
// __UNIT__ u0682 [1886216,1886296) kind=expr len=130
spawnPointWu['x']=0xd,spawnPointWu['y']=-1.5,spawnPointWu['z']=14.699999809265137,spawnPointWu['rx']=0x3f,spawnPointWu['ry']=0xfa;
// __UNIT__ u0683 [1886296,1886306) kind=var len=20
var spawnPointWv={};
// __UNIT__ u0684 [1886306,1886388) kind=expr len=132
spawnPointWv['x']=-22.5,spawnPointWv['y']=-4.900000095367432,spawnPointWv['z']=30.5,spawnPointWv['rx']=0x3e,spawnPointWv['ry']=0x27;
// __UNIT__ u0685 [1886388,1886398) kind=var len=20
var spawnPointWw={};
// __UNIT__ u0686 [1886398,1886494) kind=expr len=146
spawnPointWw['x']=-49.5,spawnPointWw['y']=-3.299999952316284,spawnPointWw['z']=12.100000381469727,spawnPointWw['rx']=0x3f,spawnPointWw['ry']=0x7e;
// __UNIT__ u0687 [1886494,1886504) kind=var len=20
var spawnPointWx={};
// __UNIT__ u0688 [1886504,1886570) kind=expr len=116
spawnPointWx['x']=-22.5,spawnPointWx['y']=3.5,spawnPointWx['z']=29.5,spawnPointWx['rx']=0x40,spawnPointWx['ry']=0x5;
// __UNIT__ u0689 [1886570,1886580) kind=var len=20
var spawnPointWy={};
// __UNIT__ u0690 [1886580,1886693) kind=expr len=163
spawnPointWy['x']=-26.399999618530273,spawnPointWy['y']=-0.30000001192092896,spawnPointWy['z']=-15.399999618530273,spawnPointWy['rx']=0x3e,spawnPointWy['ry']=0xc0;
// __UNIT__ u0691 [1886693,1886703) kind=var len=21
var mapNavPointWz={};
// __UNIT__ u0692 [1886703,1886783) kind=expr len=113
mapNavPointWz['x']=5.732714986719955,mapNavPointWz['y']=-2.971759557723999,mapNavPointWz['z']=-6.125143265171928;
// __UNIT__ u0693 [1886783,1886793) kind=var len=21
var mapNavPointWA={};
// __UNIT__ u0694 [1886793,1886875) kind=expr len=115
mapNavPointWA['x']=-29.691604901103915,mapNavPointWA['y']=-7.326169490814209,mapNavPointWA['z']=30.337692049077305;
// __UNIT__ u0695 [1886875,1886885) kind=var len=21
var mapNavPointWB={};
// __UNIT__ u0696 [1886885,1886967) kind=expr len=115
mapNavPointWB['x']=-34.12650415513576,mapNavPointWB['y']=1.9594128131866455,mapNavPointWB['z']=-3.9757078394100205;
// __UNIT__ u0697 [1886967,1886977) kind=var len=21
var mapNavPointWC={};
// __UNIT__ u0698 [1886977,1887057) kind=expr len=113
mapNavPointWC['x']=8.264894605498057,mapNavPointWC['y']=-2.971759557723999,mapNavPointWC['z']=-20.85391597225191;
// __UNIT__ u0699 [1887057,1887067) kind=var len=21
var mapNavPointWD={};
// __UNIT__ u0700 [1887067,1887149) kind=expr len=115
mapNavPointWD['x']=-22.127180099487305,mapNavPointWD['y']=-10.80184555053711,mapNavPointWD['z']=-17.65236473083496;
// __UNIT__ u0701 [1887149,1887159) kind=var len=21
var mapNavPointWE={};
// __UNIT__ u0702 [1887159,1887240) kind=expr len=114
mapNavPointWE['x']=28.875674573352086,mapNavPointWE['y']=-2.971759796142578,mapNavPointWE['z']=16.450500922143448;
// __UNIT__ u0703 [1887240,1887250) kind=var len=22
var smokeEmitterWf={};
// __UNIT__ u0705 [1887430,1887440) kind=var len=22
var smokeEmitterWg={};
// __UNIT__ u0707 [1887620,1887630) kind=var len=22
var smokeEmitterWh={};
// __UNIT__ u0708 [1887630,1887808) kind=expr len=322
smokeEmitterWh['type']='smoke',smokeEmitterWh['spawnEvery']=0x5,smokeEmitterWh[stringDecoderAlias(0x40e)]=0.8,smokeEmitterWh['scaleRange']=[0.8,1.4],smokeEmitterWh[stringDecoderAlias(0x215)]=[35.5,-0x1,-0x7],smokeEmitterWh[stringDecoderAlias(0x98d)]=[0.4,0.4,0.4],smokeEmitterWh[stringDecoderAlias(0x48b)]=[-0.05,0.1,0x0];
// __UNIT__ u0709 [1887808,1887818) kind=var len=27
var wineParticleEmitter={};
// __UNIT__ u0711 [1887998,1888008) kind=var len=25
var manorMusicEmitter={};
// __UNIT__ u0712 [1888008,1888104) kind=expr len=186
manorMusicEmitter[stringDecoderAlias(0x4c2)]=!![],manorMusicEmitter['position']=[-0x3c,0x28,0xc],manorMusicEmitter['volume']=1.2,manorMusicEmitter[stringDecoderAlias(0x3f5)]='music.mp3';
// __UNIT__ u0713 [1888104,1888114) kind=var len=29
var manorWaterfallEmitter={};
// __UNIT__ u0714 [1888114,1888204) kind=expr len=196
manorWaterfallEmitter[stringDecoderAlias(0x4c2)]=!![],manorWaterfallEmitter['position']=[-4.2,1.5,0xd],manorWaterfallEmitter['volume']=0.25,manorWaterfallEmitter['file']=stringDecoderAlias(0xe22);
// __UNIT__ u0715 [1888204,1888214) kind=var len=26
var manorForestEmitter={};
// __UNIT__ u0716 [1888214,1888277) kind=expr len=111
manorForestEmitter['directional']=![],manorForestEmitter['volume']=0.1,manorForestEmitter['file']='forest.mp3';
// __UNIT__ u0717 [1888277,1888287) kind=var len=33
var manorCinematicSceneAStart={};
// __UNIT__ u0718 [1888287,1888347) kind=expr len=136
manorCinematicSceneAStart[stringDecoderAlias(0x215)]=[-0xd,0x7,-0xc],manorCinematicSceneAStart[stringDecoderAlias(0xf5f)]=[0xa,0x1,0xe];
// __UNIT__ u0719 [1888347,1888357) kind=var len=22
var cineEndFrameWn={};
// __UNIT__ u0720 [1888357,1888417) kind=expr len=84
cineEndFrameWn['position']=[0x6,0x1,0x7],cineEndFrameWn['JoIkrtRxhZ']=[0xc,0x1,0x7];
// __UNIT__ u0721 [1888417,1888427) kind=var len=28
var manorCinematicSceneA={};
// __UNIT__ u0722 [1888427,1888482) kind=expr len=174
manorCinematicSceneA['start']=manorCinematicSceneAStart,manorCinematicSceneA[stringDecoderAlias(0x8f7)]=cineEndFrameWn,manorCinematicSceneA[stringDecoderAlias(0x35c)]=0x3a98;
// __UNIT__ u0723 [1888482,1888492) kind=var len=24
var cameraWaypointWp={};
// __UNIT__ u0724 [1888492,1888556) kind=expr len=107
cameraWaypointWp['position']=[0x14,0x4,-0x32],cameraWaypointWp[stringDecoderAlias(0xf5f)]=[-0xa,0x4,-0x28];
// __UNIT__ u0725 [1888556,1888566) kind=var len=31
var manorCinematicSceneBEnd={};
// __UNIT__ u0726 [1888566,1888630) kind=expr len=106
manorCinematicSceneBEnd['position']=[-0xb,0x2,-0x1e],manorCinematicSceneBEnd['JoIkrtRxhZ']=[-0x5,0x4,0x0];
// __UNIT__ u0727 [1888630,1888640) kind=var len=28
var manorCinematicSceneB={};
// __UNIT__ u0728 [1888640,1888691) kind=expr len=155
manorCinematicSceneB['start']=cameraWaypointWp,manorCinematicSceneB[stringDecoderAlias(0x8f7)]=manorCinematicSceneBEnd,manorCinematicSceneB['time']=0x3a98;
// __UNIT__ u0729 [1888691,1888701) kind=var len=20
var spawnPointWS={};
// __UNIT__ u0730 [1888701,1888781) kind=expr len=130
spawnPointWS['x']=-0x13,spawnPointWS['y']=0x2,spawnPointWS['z']=8.300000190734863,spawnPointWS['rx']=0x3f,spawnPointWS['ry']=0xe2;
// __UNIT__ u0731 [1888781,1888791) kind=var len=20
var spawnPointWT={};
// __UNIT__ u0732 [1888791,1888871) kind=expr len=130
spawnPointWT['x']=-4.400000095367432,spawnPointWT['y']=0x2,spawnPointWT['z']=0x12,spawnPointWT['rx']=0x3f,spawnPointWT['ry']=0xd0;
// __UNIT__ u0733 [1888871,1888881) kind=var len=20
var spawnPointWU={};
// __UNIT__ u0734 [1888881,1888975) kind=expr len=144
spawnPointWU['x']=26.399999618530273,spawnPointWU['y']=0x2,spawnPointWU['z']=3.4000000953674316,spawnPointWU['rx']=0x3c,spawnPointWU['ry']=0xc1;
// __UNIT__ u0735 [1888975,1888985) kind=var len=20
var spawnPointWV={};
// __UNIT__ u0736 [1888985,1889079) kind=expr len=144
spawnPointWV['x']=25.899999618530273,spawnPointWV['y']=0x2,spawnPointWV['z']=-3.799999952316284,spawnPointWV['rx']=0x3e,spawnPointWV['ry']=0x1c;
// __UNIT__ u0737 [1889079,1889089) kind=var len=20
var spawnPointWW={};
// __UNIT__ u0738 [1889089,1889184) kind=expr len=145
spawnPointWW['x']=16.399999618530273,spawnPointWW['y']=4.5,spawnPointWW['z']=-28.200000762939453,spawnPointWW['rx']=0x40,spawnPointWW['ry']=0xda;
// __UNIT__ u0739 [1889184,1889194) kind=var len=20
var spawnPointWX={};
// __UNIT__ u0740 [1889194,1889274) kind=expr len=130
spawnPointWX['x']=5.300000190734863,spawnPointWX['y']=4.5,spawnPointWX['z']=-41.5,spawnPointWX['rx']=0x3a,spawnPointWX['ry']=0x40;
// __UNIT__ u0741 [1889274,1889284) kind=var len=20
var spawnPointWY={};
// __UNIT__ u0742 [1889284,1889365) kind=expr len=131
spawnPointWY['x']=1.7000000476837158,spawnPointWY['y']=4.5,spawnPointWY['z']=-0x16,spawnPointWY['rx']=0x3e,spawnPointWY['ry']=0x18;
// __UNIT__ u0743 [1889365,1889375) kind=var len=22
var cineShotAStart={};
// __UNIT__ u0744 [1889375,1889439) kind=expr len=118
cineShotAStart[stringDecoderAlias(0x215)]=[7.12,8.5,-0x25],cineShotAStart[stringDecoderAlias(0xf5f)]=[-0xc,7.5,-0x14];
// __UNIT__ u0745 [1889439,1889449) kind=var len=19
var cineShotEnd={};
// __UNIT__ u0746 [1889449,1889513) kind=expr len=97
cineShotEnd['position']=[-2.4,6.5,-0x1d],cineShotEnd[stringDecoderAlias(0xf5f)]=[-0xc,7.5,-0x14];
// __UNIT__ u0747 [1889513,1889523) kind=var len=17
var cineShotA={};
// __UNIT__ u0748 [1889523,1889577) kind=expr len=126
cineShotA[stringDecoderAlias(0x9a6)]=cineShotAStart,cineShotA[stringDecoderAlias(0x8f7)]=cineShotEnd,cineShotA['time']=0x2ee0;
// __UNIT__ u0749 [1889577,1889587) kind=var len=22
var cameraWaypoint={};
// __UNIT__ u0750 [1889587,1889649) kind=expr len=86
cameraWaypoint['position']=[-0x3,0x5,0x9],cameraWaypoint['JoIkrtRxhZ']=[0x3,0x8,0x16];
// __UNIT__ u0751 [1889649,1889659) kind=var len=22
var cineEndFrameX3={};
// __UNIT__ u0752 [1889659,1889719) kind=expr len=99
cineEndFrameX3['position']=[0x3,0x8,0x16],cineEndFrameX3[stringDecoderAlias(0xf5f)]=[5.5,0xa,0x1e];
// __UNIT__ u0753 [1889719,1889729) kind=var len=17
var cineShotB={};
// __UNIT__ u0754 [1889729,1889779) kind=expr len=110
cineShotB['start']=cameraWaypoint,cineShotB['end']=cineEndFrameX3,cineShotB[stringDecoderAlias(0x35c)]=0x3a98;
// __UNIT__ u0755 [1889779,1889789) kind=var len=24
var militiaMapConfig={};
// __UNIT__ u0757 [1890204,1890214) kind=var len=20
var spawnPointX6={};
// __UNIT__ u0758 [1890214,1890322) kind=expr len=158
spawnPointX6['x']=18.799999237060547,spawnPointX6['y']=5.300000190734863,spawnPointX6['z']=3.5999999046325684,spawnPointX6['rx']=0x40,spawnPointX6['ry']=0x7e;
// __UNIT__ u0759 [1890322,1890332) kind=var len=20
var spawnPointX7={};
// __UNIT__ u0760 [1890332,1890439) kind=expr len=157
spawnPointX7['x']=34.099998474121094,spawnPointX7['y']=5.300000190734863,spawnPointX7['z']=7.199999809265137,spawnPointX7['rx']=0x3d,spawnPointX7['ry']=0xbf;
// __UNIT__ u0761 [1890439,1890449) kind=var len=20
var spawnPointX8={};
// __UNIT__ u0762 [1890449,1890556) kind=expr len=157
spawnPointX8['x']=59.900001525878906,spawnPointX8['y']=5.300000190734863,spawnPointX8['z']=-1.100000023841858,spawnPointX8['rx']=0x3c,spawnPointX8['ry']=0x2;
// __UNIT__ u0763 [1890556,1890566) kind=var len=20
var spawnPointX9={};
// __UNIT__ u0764 [1890566,1890661) kind=expr len=145
spawnPointX9['x']=30.5,spawnPointX9['y']=5.300000190734863,spawnPointX9['z']=-15.199999809265137,spawnPointX9['rx']=0x3b,spawnPointX9['ry']=0xe4;
// __UNIT__ u0765 [1890661,1890671) kind=var len=26
var spatialGridSliceXa={};
// __UNIT__ u0766 [1890671,1890764) kind=expr len=173
spatialGridSliceXa['x']=9.5,spatialGridSliceXa['y']=5.300000190734863,spatialGridSliceXa['z']=-40.79999923706055,spatialGridSliceXa['rx']=0x3a,spatialGridSliceXa['ry']=0x40;
// __UNIT__ u0767 [1890764,1890774) kind=var len=20
var spawnPointXb={};
// __UNIT__ u0768 [1890774,1890883) kind=expr len=159
spawnPointXb['x']=12.300000190734863,spawnPointXb['y']=5.300000190734863,spawnPointXb['z']=-20.399999618530273,spawnPointXb['rx']=0x3d,spawnPointXb['ry']=0xed;
// __UNIT__ u0769 [1890883,1890893) kind=var len=20
var spawnPointXc={};
// __UNIT__ u0770 [1890893,1891003) kind=expr len=160
spawnPointXc['x']=0.10000000149011612,spawnPointXc['y']=5.300000190734863,spawnPointXc['z']=-20.299999237060547,spawnPointXc['rx']=0x39,spawnPointXc['ry']=0x2d;
// __UNIT__ u0771 [1891003,1891013) kind=var len=25
var shoothouseSpawn08={};
// __UNIT__ u0772 [1891013,1891122) kind=expr len=184
shoothouseSpawn08['x']=-26.600000381469727,shoothouseSpawn08['y']=5.300000190734863,shoothouseSpawn08['z']=-42.79999923706055,shoothouseSpawn08['rx']=0x3f,shoothouseSpawn08['ry']=0x60;
// __UNIT__ u0773 [1891122,1891132) kind=var len=20
var spawnPointXe={};
// __UNIT__ u0774 [1891132,1891242) kind=expr len=160
spawnPointXe['x']=-38.099998474121094,spawnPointXe['y']=5.300000190734863,spawnPointXe['z']=-18.100000381469727,spawnPointXe['rx']=0x3f,spawnPointXe['ry']=0x28;
// __UNIT__ u0775 [1891242,1891252) kind=var len=25
var shoothouseSpawn10={};
// __UNIT__ u0776 [1891252,1891359) kind=expr len=182
shoothouseSpawn10['x']=-34.400001525878906,shoothouseSpawn10['y']=5.300000190734863,shoothouseSpawn10['z']=32.20000076293945,shoothouseSpawn10['rx']=0x3d,shoothouseSpawn10['ry']=0x6;
// __UNIT__ u0777 [1891359,1891369) kind=var len=40
var cinematicSegmentShoothouseAStart={};
// __UNIT__ u0778 [1891369,1891433) kind=expr len=139
cinematicSegmentShoothouseAStart['position']=[7.12,8.5,-0x25],cinematicSegmentShoothouseAStart[stringDecoderAlias(0xf5f)]=[-0xc,7.5,-0x14];
// __UNIT__ u0779 [1891433,1891443) kind=var len=38
var cinematicSegmentShoothouseAEnd={};
// __UNIT__ u0780 [1891443,1891507) kind=expr len=135
cinematicSegmentShoothouseAEnd['position']=[-2.4,6.5,-0x1d],cinematicSegmentShoothouseAEnd[stringDecoderAlias(0xf5f)]=[-0xc,7.5,-0x14];
// __UNIT__ u0781 [1891507,1891517) kind=var len=35
var cinematicSegmentShoothouseA={};
// __UNIT__ u0782 [1891517,1891571) kind=expr len=217
cinematicSegmentShoothouseA[stringDecoderAlias(0x9a6)]=cinematicSegmentShoothouseAStart,cinematicSegmentShoothouseA[stringDecoderAlias(0x8f7)]=cinematicSegmentShoothouseAEnd,cinematicSegmentShoothouseA['time']=0x2ee0;
// __UNIT__ u0783 [1891571,1891581) kind=var len=40
var cinematicSegmentShoothouseBStart={};
// __UNIT__ u0784 [1891581,1891641) kind=expr len=150
cinematicSegmentShoothouseBStart[stringDecoderAlias(0x215)]=[-0x3,0x5,0x9],cinematicSegmentShoothouseBStart[stringDecoderAlias(0xf5f)]=[0x3,0x8,0x16];
// __UNIT__ u0785 [1891641,1891651) kind=var len=24
var cameraWaypointXk={};
// __UNIT__ u0786 [1891651,1891713) kind=expr len=90
cameraWaypointXk['position']=[0x3,0x8,0x16],cameraWaypointXk['JoIkrtRxhZ']=[5.5,0xa,0x1e];
// __UNIT__ u0787 [1891713,1891723) kind=var len=35
var cinematicSegmentShoothouseB={};
// __UNIT__ u0788 [1891723,1891774) kind=expr len=185
cinematicSegmentShoothouseB['start']=cinematicSegmentShoothouseBStart,cinematicSegmentShoothouseB[stringDecoderAlias(0x8f7)]=cameraWaypointXk,cinematicSegmentShoothouseB['time']=0x3a98;
// __UNIT__ u0789 [1891774,1891784) kind=var len=27
var shoothouseMapConfig={};
// __UNIT__ u0791 [1892227,1892237) kind=var len=23
var dust2SpawnPoint={};
// __UNIT__ u0792 [1892237,1892274) kind=expr len=76
dust2SpawnPoint['x']=0x0,dust2SpawnPoint['y']=0x64,dust2SpawnPoint['z']=0x0;
// __UNIT__ u0793 [1892274,1892284) kind=var len=30
var dust2SunsetLightPreset={};
// __UNIT__ u0794 [1892284,1892304) kind=expr len=55
dust2SunsetLightPreset[stringDecoderAlias(0xde4)]=!![];
// __UNIT__ u0795 [1892304,1892314) kind=var len=24
var cameraWaypointXp={};
// __UNIT__ u0796 [1892314,1892380) kind=expr len=94
cameraWaypointXp['position']=[7.12,8.5,-0x25],cameraWaypointXp['JoIkrtRxhZ']=[-0xc,7.5,-0x14];
// __UNIT__ u0797 [1892380,1892390) kind=var len=24
var cameraWaypointXq={};
// __UNIT__ u0798 [1892390,1892456) kind=expr len=94
cameraWaypointXq['position']=[-2.4,6.5,-0x1d],cameraWaypointXq['JoIkrtRxhZ']=[-0xc,7.5,-0x14];
// __UNIT__ u0799 [1892456,1892466) kind=var len=23
var cameraSegmentXr={};
// __UNIT__ u0800 [1892466,1892517) kind=expr len=133
cameraSegmentXr['start']=cameraWaypointXp,cameraSegmentXr[stringDecoderAlias(0x8f7)]=cameraWaypointXq,cameraSegmentXr['time']=0x2ee0;
// __UNIT__ u0801 [1892517,1892527) kind=var len=24
var cameraWaypointXs={};
// __UNIT__ u0802 [1892527,1892589) kind=expr len=105
cameraWaypointXs[stringDecoderAlias(0x215)]=[-0x3,0x5,0x9],cameraWaypointXs['JoIkrtRxhZ']=[0x3,0x8,0x16];
// __UNIT__ u0803 [1892589,1892599) kind=var len=24
var cameraWaypointXt={};
// __UNIT__ u0804 [1892599,1892661) kind=expr len=105
cameraWaypointXt[stringDecoderAlias(0x215)]=[0x3,0x8,0x16],cameraWaypointXt['JoIkrtRxhZ']=[5.5,0xa,0x1e];
// __UNIT__ u0805 [1892661,1892671) kind=var len=23
var cameraSegmentXu={};
// __UNIT__ u0806 [1892671,1892726) kind=expr len=152
cameraSegmentXu['start']=cameraWaypointXs,cameraSegmentXu[stringDecoderAlias(0x8f7)]=cameraWaypointXt,cameraSegmentXu[stringDecoderAlias(0x35c)]=0x3a98;
// __UNIT__ u0807 [1892726,1892736) kind=var len=22
var dust2MapConfig={};
// __UNIT__ u0809 [1893226,1893236) kind=var len=23
var neonSpawnPoint1={};
// __UNIT__ u0810 [1893236,1893330) kind=expr len=159
neonSpawnPoint1['x']=0x3,neonSpawnPoint1['y']=2.4000000953674316,neonSpawnPoint1['z']=0.6000000238418579,neonSpawnPoint1['rx']=0x3f,neonSpawnPoint1['ry']=0xb1;
// __UNIT__ u0811 [1893330,1893340) kind=var len=19
var spawnPoseXx={};
// __UNIT__ u0812 [1893340,1893434) kind=expr len=139
spawnPoseXx['x']=-11.899999618530273,spawnPoseXx['y']=1.399999976158142,spawnPoseXx['z']=0x1d,spawnPoseXx['rx']=0x3f,spawnPoseXx['ry']=0x0;
// __UNIT__ u0813 [1893434,1893444) kind=var len=19
var spawnPoseXy={};
// __UNIT__ u0814 [1893444,1893553) kind=expr len=154
spawnPoseXy['x']=-43.400001525878906,spawnPoseXy['y']=5.099999904632568,spawnPoseXy['z']=-12.899999618530273,spawnPoseXy['rx']=0x3e,spawnPoseXy['ry']=0x0;
// __UNIT__ u0815 [1893553,1893563) kind=var len=23
var neonSpawnPoint4={};
// __UNIT__ u0816 [1893563,1893657) kind=expr len=159
neonSpawnPoint4['x']=3.299999952316284,neonSpawnPoint4['y']=5.099999904632568,neonSpawnPoint4['z']=-35.5,neonSpawnPoint4['rx']=0x3f,neonSpawnPoint4['ry']=0x3f;
// __UNIT__ u0817 [1893657,1893667) kind=var len=23
var neonSpawnPoint5={};
// __UNIT__ u0818 [1893667,1893776) kind=expr len=174
neonSpawnPoint5['x']=2.9000000953674316,neonSpawnPoint5['y']=2.4000000953674316,neonSpawnPoint5['z']=-55.20000076293945,neonSpawnPoint5['rx']=0x3f,neonSpawnPoint5['ry']=0xbb;
// __UNIT__ u0819 [1893776,1893786) kind=var len=23
var neonSpawnPoint6={};
// __UNIT__ u0820 [1893786,1893894) kind=expr len=173
neonSpawnPoint6['x']=44.20000076293945,neonSpawnPoint6['y']=0.6000000238418579,neonSpawnPoint6['z']=35.099998474121094,neonSpawnPoint6['rx']=0x40,neonSpawnPoint6['ry']=0xfe;
// __UNIT__ u0821 [1893894,1893904) kind=var len=23
var neonSpawnPoint7={};
// __UNIT__ u0822 [1893904,1894013) kind=expr len=174
neonSpawnPoint7['x']=15.100000381469727,neonSpawnPoint7['y']=0.6000000238418579,neonSpawnPoint7['z']=20.700000762939453,neonSpawnPoint7['rx']=0x40,neonSpawnPoint7['ry']=0x7e;
// __UNIT__ u0823 [1894013,1894023) kind=var len=23
var neonSpawnPoint8={};
// __UNIT__ u0824 [1894023,1894130) kind=expr len=172
neonSpawnPoint8['x']=-6.699999809265137,neonSpawnPoint8['y']=5.199999809265137,neonSpawnPoint8['z']=32.79999923706055,neonSpawnPoint8['rx']=0x40,neonSpawnPoint8['ry']=0x3f;
// __UNIT__ u0825 [1894130,1894140) kind=var len=23
var neonSpawnPoint9={};
// __UNIT__ u0826 [1894140,1894235) kind=expr len=160
neonSpawnPoint9['x']=-0x22,neonSpawnPoint9['y']=5.099999904632568,neonSpawnPoint9['z']=11.699999809265137,neonSpawnPoint9['rx']=0x3e,neonSpawnPoint9['ry']=0x9f;
// __UNIT__ u0827 [1894235,1894245) kind=var len=24
var neonSpawnPoint10={};
// __UNIT__ u0828 [1894245,1894340) kind=expr len=165
neonSpawnPoint10['x']=-10.399999618530273,neonSpawnPoint10['y']=5.099999904632568,neonSpawnPoint10['z']=-0x5,neonSpawnPoint10['rx']=0x3f,neonSpawnPoint10['ry']=0x17;
// __UNIT__ u0829 [1894340,1894350) kind=var len=24
var neonSpawnPoint11={};
// __UNIT__ u0830 [1894350,1894430) kind=expr len=150
neonSpawnPoint11['x']=0x18,neonSpawnPoint11['y']=4.699999809265137,neonSpawnPoint11['z']=-8.5,neonSpawnPoint11['rx']=0x3f,neonSpawnPoint11['ry']=0xfe;
// __UNIT__ u0831 [1894430,1894440) kind=var len=21
var mapNavPointXh={};
// __UNIT__ u0832 [1894440,1894522) kind=expr len=115
mapNavPointXh['x']=15.868224620889578,mapNavPointXh['y']=2.0329501628875732,mapNavPointXh['z']=-22.804766712552237;
// __UNIT__ u0833 [1894522,1894532) kind=var len=21
var mapNavPointXi={};
// __UNIT__ u0834 [1894532,1894615) kind=expr len=116
mapNavPointXi['x']=-29.197706193916815,mapNavPointXi['y']=3.6473002433776855,mapNavPointXi['z']=-17.805919632908115;
// __UNIT__ u0835 [1894615,1894625) kind=var len=21
var mapNavPointXj={};
// __UNIT__ u0836 [1894625,1894706) kind=expr len=114
mapNavPointXj['x']=-14.1786896891876,mapNavPointXj['y']=-0.09599995613098145,mapNavPointXj['z']=9.136772605472586;
// __UNIT__ u0837 [1894706,1894716) kind=var len=21
var mapNavPointXk={};
// __UNIT__ u0838 [1894716,1894796) kind=expr len=113
mapNavPointXk['x']=-11.579063306655485,mapNavPointXk['y']=3.6514501571655273,mapNavPointXk['z']=34.7989858764829;
// __UNIT__ u0839 [1894796,1894806) kind=var len=21
var mapNavPointXl={};
// __UNIT__ u0840 [1894806,1894887) kind=expr len=114
mapNavPointXl['x']=44.34040796858392,mapNavPointXl['y']=-0.9010999798774719,mapNavPointXl['z']=30.401688410140366;
// __UNIT__ u0841 [1894887,1894897) kind=var len=21
var mapNavPointXm={};
// __UNIT__ u0842 [1894897,1894978) kind=expr len=114
mapNavPointXm['x']=26.33950352505417,mapNavPointXm['y']=0.9000000953674316,mapNavPointXm['z']=-0.3088005135245737;
// __UNIT__ u0843 [1894978,1894988) kind=var len=21
var mapNavPointXn={};
// __UNIT__ u0844 [1894988,1895069) kind=expr len=114
mapNavPointXn['x']=15.142993255860155,mapNavPointXn['y']=0.9000000953674316,mapNavPointXn['z']=-50.85724878695524;
// __UNIT__ u0845 [1895069,1895079) kind=var len=24
var midnightSunColor={};
// __UNIT__ u0846 [1895079,1895161) kind=expr len=124
midnightSunColor['x']=0.7294117647058823,midnightSunColor['y']=0.5803921568627451,midnightSunColor['z']=0.17254901960784313;
// __UNIT__ u0847 [1895161,1895171) kind=var len=28
var midnightSunDirection={};
// __UNIT__ u0848 [1895171,1895213) kind=expr len=96
midnightSunDirection['x']='0.61',midnightSunDirection['y']=0.8,midnightSunDirection['z']='0.84';
// __UNIT__ u0849 [1895213,1895223) kind=var len=26
var mapLightPositionXQ={};
// __UNIT__ u0850 [1895223,1895292) kind=expr len=117
mapLightPositionXQ['x']=-3.788101881634068,mapLightPositionXQ['y']=0.9375,mapLightPositionXQ['z']=1.5939705581246888;
// __UNIT__ u0851 [1895292,1895302) kind=var len=24
var mapLightPresetXR={};
// __UNIT__ u0852 [1895302,1895345) kind=expr len=117
mapLightPresetXR[stringDecoderAlias(0x932)]='default',mapLightPresetXR[stringDecoderAlias(0x215)]=mapLightPositionXQ;
// __UNIT__ u0853 [1895345,1895355) kind=var len=26
var mapLightPositionXS={};
// __UNIT__ u0854 [1895355,1895425) kind=expr len=118
mapLightPositionXS['x']=-1.2025000000000001,mapLightPositionXS['y']=0.7625000000000001,mapLightPositionXS['z']=-5.835;
// __UNIT__ u0855 [1895425,1895435) kind=var len=24
var mapLightPresetXT={};
// __UNIT__ u0856 [1895435,1895478) kind=expr len=132
mapLightPresetXT[stringDecoderAlias(0x932)]=stringDecoderAlias(0xe5),mapLightPresetXT[stringDecoderAlias(0x215)]=mapLightPositionXS;
// __UNIT__ u0857 [1895478,1895488) kind=var len=26
var mapLightPositionXU={};
// __UNIT__ u0858 [1895488,1895547) kind=expr len=107
mapLightPositionXU['x']=-1.7325,mapLightPositionXU['y']=0.7624253487949407,mapLightPositionXU['z']=-5.5925;
// __UNIT__ u0859 [1895547,1895557) kind=var len=24
var mapLightPresetXV={};
// __UNIT__ u0860 [1895557,1895600) kind=expr len=117
mapLightPresetXV[stringDecoderAlias(0x932)]=stringDecoderAlias(0xe5),mapLightPresetXV['position']=mapLightPositionXU;
// __UNIT__ u0861 [1895600,1895610) kind=var len=26
var mapLightPositionXW={};
// __UNIT__ u0862 [1895610,1895666) kind=expr len=104
mapLightPositionXW['x']=-2.255,mapLightPositionXW['y']=0.7651411327434875,mapLightPositionXW['z']=-5.34;
// __UNIT__ u0863 [1895666,1895676) kind=var len=24
var mapLightPresetXX={};
// __UNIT__ u0864 [1895676,1895719) kind=expr len=102
mapLightPresetXX[stringDecoderAlias(0x932)]='default',mapLightPresetXX['position']=mapLightPositionXW;
// __UNIT__ u0865 [1895719,1895729) kind=var len=26
var mapLightPositionXY={};
// __UNIT__ u0866 [1895729,1895771) kind=expr len=90
mapLightPositionXY['x']=-2.465,mapLightPositionXY['y']=1.01,mapLightPositionXY['z']=-5.26;
// __UNIT__ u0867 [1895771,1895781) kind=var len=24
var mapLightPresetXZ={};
// __UNIT__ u0868 [1895781,1895819) kind=expr len=82
mapLightPresetXZ['preset']='Blue',mapLightPresetXZ['position']=mapLightPositionXY;
// __UNIT__ u0869 [1895819,1895829) kind=var len=23
var lightPositionY0={};
// __UNIT__ u0870 [1895829,1895875) kind=expr len=85
lightPositionY0['x']=-0.905,lightPositionY0['y']=1.2425,lightPositionY0['z']=-6.0875;
// __UNIT__ u0871 [1895875,1895885) kind=var len=24
var mapLightPresetY1={};
// __UNIT__ u0872 [1895885,1895925) kind=expr len=81
mapLightPresetY1['preset']='Purple',mapLightPresetY1['position']=lightPositionY0;
// __UNIT__ u0873 [1895925,1895935) kind=var len=23
var lightPositionY2={};
// __UNIT__ u0874 [1895935,1895979) kind=expr len=83
lightPositionY2['x']=-0.9,lightPositionY2['y']=1.3825,lightPositionY2['z']=-6.0875;
// __UNIT__ u0875 [1895979,1895989) kind=var len=24
var mapLightPresetY3={};
// __UNIT__ u0876 [1895989,1896031) kind=expr len=98
mapLightPresetY3['preset']=stringDecoderAlias(0x643),mapLightPresetY3['position']=lightPositionY2;
// __UNIT__ u0877 [1896031,1896041) kind=var len=23
var lightPositionY4={};
// __UNIT__ u0878 [1896041,1896086) kind=expr len=84
lightPositionY4['x']=-0.8975,lightPositionY4['y']=1.51,lightPositionY4['z']=-6.0925;
// __UNIT__ u0879 [1896086,1896096) kind=var len=24
var mapLightPresetY5={};
// __UNIT__ u0880 [1896096,1896136) kind=expr len=81
mapLightPresetY5['preset']='Purple',mapLightPresetY5['position']=lightPositionY4;
// __UNIT__ u0881 [1896136,1896146) kind=var len=23
var lightPositionY6={};
// __UNIT__ u0882 [1896146,1896187) kind=expr len=80
lightPositionY6['x']=-2.68,lightPositionY6['y']=1.01,lightPositionY6['z']=-5.26;
// __UNIT__ u0883 [1896187,1896197) kind=var len=24
var mapLightPresetY7={};
// __UNIT__ u0884 [1896197,1896239) kind=expr len=98
mapLightPresetY7['preset']=stringDecoderAlias(0xd86),mapLightPresetY7['position']=lightPositionY6;
// __UNIT__ u0885 [1896239,1896249) kind=var len=23
var lightPositionY8={};
// __UNIT__ u0886 [1896249,1896295) kind=expr len=85
lightPositionY8['x']=-2.8875,lightPositionY8['y']=1.0175,lightPositionY8['z']=-5.255;
// __UNIT__ u0887 [1896295,1896305) kind=var len=24
var mapLightPresetY9={};
// __UNIT__ u0888 [1896305,1896345) kind=expr len=96
mapLightPresetY9[stringDecoderAlias(0x932)]='Blue',mapLightPresetY9['position']=lightPositionY8;
// __UNIT__ u0889 [1896345,1896355) kind=var len=26
var mapLightPositionYa={};
// __UNIT__ u0890 [1896355,1896435) kind=expr len=128
mapLightPositionYa['x']=1.276411883786117,mapLightPositionYa['y']=2.0844754887137156,mapLightPositionYa['z']=-7.050182819366453;
// __UNIT__ u0891 [1896435,1896445) kind=var len=28
var buildingLightPointYb={};
// __UNIT__ u0892 [1896445,1896489) kind=expr len=126
buildingLightPointYb[stringDecoderAlias(0x932)]=stringDecoderAlias(0xc5f),buildingLightPointYb['position']=mapLightPositionYa;
// __UNIT__ u0893 [1896489,1896499) kind=var len=26
var mapLightPositionYc={};
// __UNIT__ u0894 [1896499,1896579) kind=expr len=128
mapLightPositionYc['x']=1.886127149969321,mapLightPositionYc['y']=1.7060363612810894,mapLightPositionYc['z']=-7.050182819366453;
// __UNIT__ u0895 [1896579,1896589) kind=var len=28
var buildingLightPointYd={};
// __UNIT__ u0896 [1896589,1896636) kind=expr len=99
buildingLightPointYd['preset']='BuildingLight',buildingLightPointYd['position']=mapLightPositionYc;
// __UNIT__ u0897 [1896636,1896646) kind=var len=26
var mapLightPositionYe={};
// __UNIT__ u0898 [1896646,1896727) kind=expr len=129
mapLightPositionYe['x']=1.4750740642455031,mapLightPositionYe['y']=1.7068279324936582,mapLightPositionYe['z']=-7.050182819366453;
// __UNIT__ u0899 [1896727,1896737) kind=var len=28
var buildingLightPointYf={};
// __UNIT__ u0900 [1896737,1896786) kind=expr len=131
buildingLightPointYf[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointYf[stringDecoderAlias(0x215)]=mapLightPositionYe;
// __UNIT__ u0901 [1896786,1896796) kind=var len=26
var mapLightPositionYg={};
// __UNIT__ u0902 [1896796,1896877) kind=expr len=129
mapLightPositionYg['x']=2.2694581446110367,mapLightPositionYg['y']=1.1451601847988118,mapLightPositionYg['z']=-6.967312335968017;
// __UNIT__ u0903 [1896877,1896887) kind=var len=28
var buildingLightPointYh={};
// __UNIT__ u0904 [1896887,1896931) kind=expr len=126
buildingLightPointYh[stringDecoderAlias(0x932)]=stringDecoderAlias(0xc5f),buildingLightPointYh['position']=mapLightPositionYg;
// __UNIT__ u0905 [1896931,1896941) kind=var len=26
var mapLightPositionYi={};
// __UNIT__ u0906 [1896941,1897021) kind=expr len=128
mapLightPositionYi['x']=1.8892629070848654,mapLightPositionYi['y']=1.141903197401744,mapLightPositionYi['z']=-6.967312335968018;
// __UNIT__ u0907 [1897021,1897031) kind=var len=28
var buildingLightPointYj={};
// __UNIT__ u0908 [1897031,1897080) kind=expr len=116
buildingLightPointYj[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointYj['position']=mapLightPositionYi;
// __UNIT__ u0909 [1897080,1897090) kind=var len=26
var mapLightPositionYk={};
// __UNIT__ u0910 [1897090,1897171) kind=expr len=129
mapLightPositionYk['x']=-1.521255804273569,mapLightPositionYk['y']=2.3222496475829266,mapLightPositionYk['z']=-6.375516603508654;
// __UNIT__ u0911 [1897171,1897181) kind=var len=28
var buildingLightPointYl={};
// __UNIT__ u0912 [1897181,1897230) kind=expr len=131
buildingLightPointYl[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointYl[stringDecoderAlias(0x215)]=mapLightPositionYk;
// __UNIT__ u0913 [1897230,1897240) kind=var len=26
var mapLightPositionYm={};
// __UNIT__ u0914 [1897240,1897321) kind=expr len=129
mapLightPositionYm['x']=-1.7755782474522284,mapLightPositionYm['y']=3.349978457702597,mapLightPositionYm['z']=-6.253032698416195;
// __UNIT__ u0915 [1897321,1897331) kind=var len=28
var buildingLightPointYn={};
// __UNIT__ u0916 [1897331,1897378) kind=expr len=114
buildingLightPointYn['preset']='BuildingLight',buildingLightPointYn[stringDecoderAlias(0x215)]=mapLightPositionYm;
// __UNIT__ u0917 [1897378,1897388) kind=var len=26
var mapLightPositionYo={};
// __UNIT__ u0918 [1897388,1897470) kind=expr len=130
mapLightPositionYo['x']=-2.2814065133199994,mapLightPositionYo['y']=3.348895076766533,mapLightPositionYo['z']=-6.0094211913120255;
// __UNIT__ u0919 [1897470,1897480) kind=var len=28
var buildingLightPointYp={};
// __UNIT__ u0920 [1897480,1897527) kind=expr len=114
buildingLightPointYp['preset']='BuildingLight',buildingLightPointYp[stringDecoderAlias(0x215)]=mapLightPositionYo;
// __UNIT__ u0921 [1897527,1897537) kind=var len=26
var mapLightPositionYq={};
// __UNIT__ u0922 [1897537,1897619) kind=expr len=130
mapLightPositionYq['x']=-2.7845710483559043,mapLightPositionYq['y']=2.3148684651832023,mapLightPositionYq['z']=-5.767092710691837;
// __UNIT__ u0923 [1897619,1897629) kind=var len=28
var buildingLightPointYr={};
// __UNIT__ u0924 [1897629,1897676) kind=expr len=99
buildingLightPointYr['preset']='BuildingLight',buildingLightPointYr['position']=mapLightPositionYq;
// __UNIT__ u0925 [1897676,1897686) kind=var len=26
var mapLightPositionYs={};
// __UNIT__ u0926 [1897686,1897764) kind=expr len=126
mapLightPositionYs['x']=-3.0348787242516,mapLightPositionYs['y']=2.319675655410909,mapLightPositionYs['z']=-5.646542429497383;
// __UNIT__ u0927 [1897764,1897774) kind=var len=27
var neonBuildingLight05={};
// __UNIT__ u0928 [1897774,1897816) kind=expr len=107
neonBuildingLight05['preset']=stringDecoderAlias(0xc5f),neonBuildingLight05['position']=mapLightPositionYs;
// __UNIT__ u0929 [1897816,1897826) kind=var len=26
var mapLightPositionYu={};
// __UNIT__ u0930 [1897826,1897907) kind=expr len=129
mapLightPositionYu['x']=-0.2799902192115815,mapLightPositionYu['y']=1.424306154251099,mapLightPositionYu['z']=-6.414379225512917;
// __UNIT__ u0931 [1897907,1897917) kind=var len=28
var buildingLightPointYv={};
// __UNIT__ u0932 [1897917,1897964) kind=expr len=114
buildingLightPointYv['preset']='BuildingLight',buildingLightPointYv[stringDecoderAlias(0x215)]=mapLightPositionYu;
// __UNIT__ u0933 [1897964,1897974) kind=var len=26
var mapLightPositionYw={};
// __UNIT__ u0934 [1897974,1898055) kind=expr len=129
mapLightPositionYw['x']=-0.5145207168976929,mapLightPositionYw['y']=0.975394250272792,mapLightPositionYw['z']=-6.340712345554641;
// __UNIT__ u0935 [1898055,1898065) kind=var len=28
var buildingLightPointYx={};
// __UNIT__ u0936 [1898065,1898114) kind=expr len=131
buildingLightPointYx[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointYx[stringDecoderAlias(0x215)]=mapLightPositionYw;
// __UNIT__ u0937 [1898114,1898124) kind=var len=26
var mapLightPositionYy={};
// __UNIT__ u0938 [1898124,1898191) kind=expr len=115
mapLightPositionYy['x']=0.058592303080231,mapLightPositionYy['y']=1.38127254388771,mapLightPositionYy['z']=-6.3025;
// __UNIT__ u0939 [1898191,1898201) kind=var len=26
var purpleLightPointYz={};
// __UNIT__ u0940 [1898201,1898245) kind=expr len=137
purpleLightPointYz[stringDecoderAlias(0x932)]=stringDecoderAlias(0x643),purpleLightPointYz[stringDecoderAlias(0x215)]=mapLightPositionYy;
// __UNIT__ u0941 [1898245,1898255) kind=var len=23
var lightPositionYA={};
// __UNIT__ u0942 [1898255,1898327) kind=expr len=111
lightPositionYA['x']=0.054181914821799904,lightPositionYA['y']=1.1248284203705325,lightPositionYA['z']=-6.3075;
// __UNIT__ u0943 [1898327,1898337) kind=var len=24
var mapLightPresetYB={};
// __UNIT__ u0944 [1898337,1898377) kind=expr len=96
mapLightPresetYB['preset']='Purple',mapLightPresetYB[stringDecoderAlias(0x215)]=lightPositionYA;
// __UNIT__ u0945 [1898377,1898387) kind=var len=23
var lightPositionYC={};
// __UNIT__ u0946 [1898387,1898470) kind=expr len=122
lightPositionYC['x']=0.05133169549452332,lightPositionYC['y']=0.8158600381908304,lightPositionYC['z']=-6.3100000000000005;
// __UNIT__ u0947 [1898470,1898480) kind=var len=24
var mapLightPresetYD={};
// __UNIT__ u0948 [1898480,1898524) kind=expr len=115
mapLightPresetYD[stringDecoderAlias(0x932)]=stringDecoderAlias(0x643),mapLightPresetYD['position']=lightPositionYC;
// __UNIT__ u0949 [1898524,1898534) kind=var len=23
var lightPositionYE={};
// __UNIT__ u0950 [1898534,1898578) kind=expr len=83
lightPositionYE['x']=-2.835,lightPositionYE['y']=1.3875,lightPositionYE['z']=-0.66;
// __UNIT__ u0951 [1898578,1898588) kind=var len=24
var mapLightPresetYF={};
// __UNIT__ u0952 [1898588,1898634) kind=expr len=102
mapLightPresetYF[stringDecoderAlias(0x932)]='SubwayLogo',mapLightPresetYF['position']=lightPositionYE;
// __UNIT__ u0953 [1898634,1898644) kind=var len=23
var lightPositionYG={};
// __UNIT__ u0954 [1898644,1898724) kind=expr len=119
lightPositionYG['x']=-2.1421890254724576,lightPositionYG['y']=1.409917507447883,lightPositionYG['z']=-0.96274346113205;
// __UNIT__ u0955 [1898724,1898734) kind=var len=28
var buildingLightPointYH={};
// __UNIT__ u0956 [1898734,1898781) kind=expr len=96
buildingLightPointYH['preset']='BuildingLight',buildingLightPointYH['position']=lightPositionYG;
// __UNIT__ u0957 [1898781,1898791) kind=var len=23
var lightPositionYI={};
// __UNIT__ u0958 [1898791,1898874) kind=expr len=122
lightPositionYI['x']=-1.2559624577280444,lightPositionYI['y']=1.9714911041324303,lightPositionYI['z']=-1.0606278181076048;
// __UNIT__ u0959 [1898874,1898884) kind=var len=28
var buildingLightPointYJ={};
// __UNIT__ u0960 [1898884,1898933) kind=expr len=128
buildingLightPointYJ[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointYJ[stringDecoderAlias(0x215)]=lightPositionYI;
// __UNIT__ u0961 [1898933,1898943) kind=var len=23
var lightPositionYK={};
// __UNIT__ u0962 [1898943,1899025) kind=expr len=121
lightPositionYK['x']=-0.6643594306422824,lightPositionYK['y']=1.9829590388287464,lightPositionYK['z']=-1.060627818107605;
// __UNIT__ u0963 [1899025,1899035) kind=var len=28
var buildingLightPointYL={};
// __UNIT__ u0964 [1899035,1899084) kind=expr len=128
buildingLightPointYL[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointYL[stringDecoderAlias(0x215)]=lightPositionYK;
// __UNIT__ u0965 [1899084,1899094) kind=var len=23
var lightPositionYM={};
// __UNIT__ u0966 [1899094,1899175) kind=expr len=120
lightPositionYM['x']=-4.024265522574681,lightPositionYM['y']=1.585179384250099,lightPositionYM['z']=-3.8782131671905526;
// __UNIT__ u0967 [1899175,1899185) kind=var len=28
var buildingLightPointYN={};
// __UNIT__ u0968 [1899185,1899232) kind=expr len=96
buildingLightPointYN['preset']='BuildingLight',buildingLightPointYN['position']=lightPositionYM;
// __UNIT__ u0969 [1899232,1899242) kind=var len=26
var mapLightPositionYO={};
// __UNIT__ u0970 [1899242,1899287) kind=expr len=93
mapLightPositionYO['x']=-0.165,mapLightPositionYO['y']=2.025,mapLightPositionYO['z']=-4.4275;
// __UNIT__ u0971 [1899287,1899297) kind=var len=26
var orangeLightPointYP={};
// __UNIT__ u0972 [1899297,1899341) kind=expr len=122
orangeLightPointYP[stringDecoderAlias(0x932)]=stringDecoderAlias(0x329),orangeLightPointYP['position']=mapLightPositionYO;
// __UNIT__ u0973 [1899341,1899351) kind=var len=26
var mapLightPositionYQ={};
// __UNIT__ u0974 [1899351,1899394) kind=expr len=91
mapLightPositionYQ['x']=-0.155,mapLightPositionYQ['y']=1.76,mapLightPositionYQ['z']=-4.425;
// __UNIT__ u0975 [1899394,1899404) kind=var len=26
var orangeLightPointYR={};
// __UNIT__ u0976 [1899404,1899444) kind=expr len=88
orangeLightPointYR['preset']='Orange',orangeLightPointYR['position']=mapLightPositionYQ;
// __UNIT__ u0977 [1899444,1899454) kind=var len=26
var mapLightPositionYS={};
// __UNIT__ u0978 [1899454,1899501) kind=expr len=95
mapLightPositionYS['x']=-0.1525,mapLightPositionYS['y']=1.4975,mapLightPositionYS['z']=-4.4325;
// __UNIT__ u0979 [1899501,1899511) kind=var len=26
var orangeLightPointYT={};
// __UNIT__ u0980 [1899511,1899555) kind=expr len=137
orangeLightPointYT[stringDecoderAlias(0x932)]=stringDecoderAlias(0x329),orangeLightPointYT[stringDecoderAlias(0x215)]=mapLightPositionYS;
// __UNIT__ u0981 [1899555,1899565) kind=var len=26
var mapLightPositionYU={};
// __UNIT__ u0982 [1899565,1899632) kind=expr len=115
mapLightPositionYU['x']=-0.18,mapLightPositionYU['y']=2.035703374647007,mapLightPositionYU['z']=-4.702646710847129;
// __UNIT__ u0983 [1899632,1899642) kind=var len=24
var blueLightPointYV={};
// __UNIT__ u0984 [1899642,1899684) kind=expr len=116
blueLightPointYV['preset']=stringDecoderAlias(0xd86),blueLightPointYV[stringDecoderAlias(0x215)]=mapLightPositionYU;
// __UNIT__ u0985 [1899684,1899694) kind=var len=26
var mapLightPositionYW={};
// __UNIT__ u0986 [1899694,1899762) kind=expr len=116
mapLightPositionYW['x']=-0.16,mapLightPositionYW['y']=1.6387414286138966,mapLightPositionYW['z']=-4.706646303909892;
// __UNIT__ u0987 [1899762,1899772) kind=var len=24
var blueLightPointYX={};
// __UNIT__ u0988 [1899772,1899810) kind=expr len=82
blueLightPointYX['preset']='Blue',blueLightPointYX['position']=mapLightPositionYW;
// __UNIT__ u0989 [1899810,1899820) kind=var len=26
var mapLightPositionYY={};
// __UNIT__ u0990 [1899820,1899877) kind=expr len=105
mapLightPositionYY['x']=-0.1675,mapLightPositionYY['y']=1.835,mapLightPositionYY['z']=-4.704752992517663;
// __UNIT__ u0991 [1899877,1899887) kind=var len=24
var blueLightPointYZ={};
// __UNIT__ u0992 [1899887,1899931) kind=expr len=133
blueLightPointYZ[stringDecoderAlias(0x932)]=stringDecoderAlias(0xd86),blueLightPointYZ[stringDecoderAlias(0x215)]=mapLightPositionYY;
// __UNIT__ u0993 [1899931,1899941) kind=var len=26
var mapLightPositionZ0={};
// __UNIT__ u0994 [1899941,1899987) kind=expr len=94
mapLightPositionZ0['x']=0.2525,mapLightPositionZ0['y']=1.0925,mapLightPositionZ0['z']=-5.2425;
// __UNIT__ u0995 [1899987,1899997) kind=var len=24
var mapLightPresetZ1={};
// __UNIT__ u0996 [1899997,1900039) kind=expr len=101
mapLightPresetZ1['preset']=stringDecoderAlias(0xd86),mapLightPresetZ1['position']=mapLightPositionZ0;
// __UNIT__ u0997 [1900039,1900049) kind=var len=26
var mapLightPositionZ2={};
// __UNIT__ u0998 [1900049,1900129) kind=expr len=128
mapLightPositionZ2['x']=0.765326968728536,mapLightPositionZ2['y']=0.5028952916170034,mapLightPositionZ2['z']=-6.409800529479981;
// __UNIT__ u0999 [1900129,1900139) kind=var len=24
var blueLightPointZ3={};
// __UNIT__ u1000 [1900139,1900177) kind=expr len=97
blueLightPointZ3['preset']='Blue',blueLightPointZ3[stringDecoderAlias(0x215)]=mapLightPositionZ2;
// __UNIT__ u1001 [1900177,1900187) kind=var len=26
var mapLightPositionZ4={};
// __UNIT__ u1002 [1900187,1900244) kind=expr len=105
mapLightPositionZ4['x']=-1.2,mapLightPositionZ4['y']=0.32947382603281156,mapLightPositionZ4['z']=-5.8375;
// __UNIT__ u1003 [1900244,1900254) kind=var len=31
var reflection1LightPointZ5={};
// __UNIT__ u1004 [1900254,1900296) kind=expr len=115
reflection1LightPointZ5['preset']=stringDecoderAlias(0x24b),reflection1LightPointZ5['position']=mapLightPositionZ4;
// __UNIT__ u1005 [1900296,1900306) kind=var len=26
var mapLightPositionZ6={};
// __UNIT__ u1006 [1900306,1900389) kind=expr len=131
mapLightPositionZ6['x']=-1.7454920155485283,mapLightPositionZ6['y']=0.33022000895791026,mapLightPositionZ6['z']=-5.582637321058282;
// __UNIT__ u1007 [1900389,1900399) kind=var len=31
var reflection1LightPointZ7={};
// __UNIT__ u1008 [1900399,1900446) kind=expr len=120
reflection1LightPointZ7[stringDecoderAlias(0x932)]='Reflection1',reflection1LightPointZ7['position']=mapLightPositionZ6;
// __UNIT__ u1009 [1900446,1900456) kind=var len=26
var mapLightPositionZ8={};
// __UNIT__ u1010 [1900456,1900538) kind=expr len=130
mapLightPositionZ8['x']=-2.2788558925174667,mapLightPositionZ8['y']=0.3307272946474989,mapLightPositionZ8['z']=-5.321537725235785;
// __UNIT__ u1011 [1900538,1900548) kind=var len=31
var reflection1LightPointZ9={};
// __UNIT__ u1012 [1900548,1900592) kind=expr len=147
reflection1LightPointZ9[stringDecoderAlias(0x932)]=stringDecoderAlias(0x24b),reflection1LightPointZ9[stringDecoderAlias(0x215)]=mapLightPositionZ8;
// __UNIT__ u1013 [1900592,1900602) kind=var len=26
var mapLightPositionZa={};
// __UNIT__ u1014 [1900602,1900685) kind=expr len=131
mapLightPositionZa['x']=0.07580611892123329,mapLightPositionZa['y']=0.21862088736642954,mapLightPositionZa['z']=-6.340018098819977;
// __UNIT__ u1015 [1900685,1900695) kind=var len=34
var reflectionPinkLightPointZb={};
// __UNIT__ u1016 [1900695,1900737) kind=expr len=121
reflectionPinkLightPointZb['preset']=stringDecoderAlias(0x333),reflectionPinkLightPointZb['position']=mapLightPositionZa;
// __UNIT__ u1017 [1900737,1900747) kind=var len=26
var mapLightPositionZc={};
// __UNIT__ u1018 [1900747,1900831) kind=expr len=132
mapLightPositionZc['x']=-0.08720129438650526,mapLightPositionZc['y']=0.3306555550389421,mapLightPositionZc['z']=-4.4350000000000005;
// __UNIT__ u1019 [1900831,1900841) kind=var len=36
var orangeReflectionLightPointZd={};
// __UNIT__ u1020 [1900841,1900891) kind=expr len=133
orangeReflectionLightPointZd['preset']='OrangeReflection',orangeReflectionLightPointZd[stringDecoderAlias(0x215)]=mapLightPositionZc;
// __UNIT__ u1021 [1900891,1900901) kind=var len=26
var mapLightPositionZe={};
// __UNIT__ u1022 [1900901,1900971) kind=expr len=118
mapLightPositionZe['x']=-0.0886240287758644,mapLightPositionZe['y']=0.3275,mapLightPositionZe['z']=-4.711952161634878;
// __UNIT__ u1023 [1900971,1900981) kind=var len=36
var purpleReflectionLightPointZf={};
// __UNIT__ u1024 [1900981,1901031) kind=expr len=118
purpleReflectionLightPointZf['preset']='PurpleReflection',purpleReflectionLightPointZf['position']=mapLightPositionZe;
// __UNIT__ u1025 [1901031,1901041) kind=var len=26
var mapLightPositionZg={};
// __UNIT__ u1026 [1901041,1901099) kind=expr len=106
mapLightPositionZg['x']=-2.7475,mapLightPositionZg['y']=1.1025,mapLightPositionZg['z']=-5.042555723595179;
// __UNIT__ u1027 [1901099,1901109) kind=var len=26
var orangeLightPointZh={};
// __UNIT__ u1028 [1901109,1901149) kind=expr len=103
orangeLightPointZh['preset']='Orange',orangeLightPointZh[stringDecoderAlias(0x215)]=mapLightPositionZg;
// __UNIT__ u1029 [1901149,1901159) kind=var len=26
var mapLightPositionZi={};
// __UNIT__ u1030 [1901159,1901230) kind=expr len=119
mapLightPositionZi['x']=-2.7800000000000002,mapLightPositionZi['y']=1.1025,mapLightPositionZi['z']=-4.8955567481557365;
// __UNIT__ u1031 [1901230,1901240) kind=var len=26
var orangeLightPointZj={};
// __UNIT__ u1032 [1901240,1901282) kind=expr len=120
orangeLightPointZj['preset']=stringDecoderAlias(0x329),orangeLightPointZj[stringDecoderAlias(0x215)]=mapLightPositionZi;
// __UNIT__ u1033 [1901282,1901292) kind=var len=26
var mapLightPositionZk={};
// __UNIT__ u1034 [1901292,1901349) kind=expr len=105
mapLightPositionZk['x']=-2.77,mapLightPositionZk['y']=1.1025,mapLightPositionZk['z']=-4.7390190299187305;
// __UNIT__ u1035 [1901349,1901359) kind=var len=26
var orangeLightPointZl={};
// __UNIT__ u1036 [1901359,1901401) kind=expr len=105
orangeLightPointZl['preset']=stringDecoderAlias(0x329),orangeLightPointZl['position']=mapLightPositionZk;
// __UNIT__ u1037 [1901401,1901411) kind=var len=26
var mapLightPositionZm={};
// __UNIT__ u1038 [1901411,1901470) kind=expr len=107
mapLightPositionZm['x']=-2.7425,mapLightPositionZm['y']=1.0342920237978268,mapLightPositionZm['z']=-4.4475;
// __UNIT__ u1039 [1901470,1901480) kind=var len=24
var blueLightPointZn={};
// __UNIT__ u1040 [1901480,1901518) kind=expr len=82
blueLightPointZn['preset']='Blue',blueLightPointZn['position']=mapLightPositionZm;
// __UNIT__ u1041 [1901518,1901528) kind=var len=26
var mapLightPositionZo={};
// __UNIT__ u1042 [1901528,1901586) kind=expr len=106
mapLightPositionZo['x']=-2.7575,mapLightPositionZo['y']=1.0225,mapLightPositionZo['z']=-4.070402994952216;
// __UNIT__ u1043 [1901586,1901596) kind=var len=24
var blueLightPointZp={};
// __UNIT__ u1044 [1901596,1901634) kind=expr len=82
blueLightPointZp['preset']='Blue',blueLightPointZp['position']=mapLightPositionZo;
// __UNIT__ u1045 [1901634,1901644) kind=var len=26
var mapLightPositionZq={};
// __UNIT__ u1046 [1901644,1901688) kind=expr len=92
mapLightPositionZq['x']=-2.7875,mapLightPositionZq['y']=1.095,mapLightPositionZq['z']=-4.24;
// __UNIT__ u1047 [1901688,1901698) kind=var len=24
var blueLightPointZr={};
// __UNIT__ u1048 [1901698,1901736) kind=expr len=82
blueLightPointZr['preset']='Blue',blueLightPointZr['position']=mapLightPositionZq;
// __UNIT__ u1049 [1901736,1901746) kind=var len=26
var mapLightPositionZs={};
// __UNIT__ u1050 [1901746,1901791) kind=expr len=93
mapLightPositionZs['x']=-0.0025,mapLightPositionZs['y']=1.47,mapLightPositionZs['z']=-5.2975;
// __UNIT__ u1051 [1901791,1901801) kind=var len=25
var greenLightPointZt={};
// __UNIT__ u1052 [1901801,1901843) kind=expr len=103
greenLightPointZt['preset']=stringDecoderAlias(0x86d),greenLightPointZt['position']=mapLightPositionZs;
// __UNIT__ u1053 [1901843,1901853) kind=var len=26
var mapLightPositionZu={};
// __UNIT__ u1054 [1901853,1901908) kind=expr len=103
mapLightPositionZu['x']=-0.1525,mapLightPositionZu['y']=1.53630882591143,mapLightPositionZu['z']=-5.51;
// __UNIT__ u1055 [1901908,1901918) kind=var len=25
var greenLightPointZv={};
// __UNIT__ u1056 [1901918,1901960) kind=expr len=103
greenLightPointZv['preset']=stringDecoderAlias(0x86d),greenLightPointZv['position']=mapLightPositionZu;
// __UNIT__ u1057 [1901960,1901970) kind=var len=26
var mapLightPositionZw={};
// __UNIT__ u1058 [1901970,1902027) kind=expr len=105
mapLightPositionZw['x']=-0.2675,mapLightPositionZw['y']=1.5218971690782686,mapLightPositionZw['z']=-5.73;
// __UNIT__ u1059 [1902027,1902037) kind=var len=25
var greenLightPointZx={};
// __UNIT__ u1060 [1902037,1902081) kind=expr len=120
greenLightPointZx[stringDecoderAlias(0x932)]=stringDecoderAlias(0x86d),greenLightPointZx['position']=mapLightPositionZw;
// __UNIT__ u1061 [1902081,1902091) kind=var len=26
var mapLightPositionZy={};
// __UNIT__ u1062 [1902091,1902148) kind=expr len=105
mapLightPositionZy['x']=-0.38,mapLightPositionZy['y']=1.4652375641222777,mapLightPositionZy['z']=-5.9675;
// __UNIT__ u1063 [1902148,1902158) kind=var len=24
var mapLightPresetZz={};
// __UNIT__ u1064 [1902158,1902200) kind=expr len=101
mapLightPresetZz['preset']=stringDecoderAlias(0x9bb),mapLightPresetZz['position']=mapLightPositionZy;
// __UNIT__ u1065 [1902200,1902210) kind=var len=26
var mapLightPositionZA={};
// __UNIT__ u1066 [1902210,1902253) kind=expr len=91
mapLightPositionZA['x']=2.515,mapLightPositionZA['y']=1.6275,mapLightPositionZA['z']=-5.46;
// __UNIT__ u1067 [1902253,1902263) kind=var len=24
var blueLightPointZB={};
// __UNIT__ u1068 [1902263,1902305) kind=expr len=101
blueLightPointZB['preset']=stringDecoderAlias(0xd86),blueLightPointZB['position']=mapLightPositionZA;
// __UNIT__ u1069 [1902305,1902315) kind=var len=26
var mapLightPositionZC={};
// __UNIT__ u1070 [1902315,1902383) kind=expr len=116
mapLightPositionZC['x']=2.5300000000000002,mapLightPositionZC['y']=1.2594509444709565,mapLightPositionZC['z']=-5.46;
// __UNIT__ u1071 [1902383,1902393) kind=var len=24
var blueLightPointZD={};
// __UNIT__ u1072 [1902393,1902433) kind=expr len=99
blueLightPointZD[stringDecoderAlias(0x932)]='Blue',blueLightPointZD['position']=mapLightPositionZC;
// __UNIT__ u1073 [1902433,1902443) kind=var len=26
var mapLightPositionZE={};
// __UNIT__ u1074 [1902443,1902499) kind=expr len=104
mapLightPositionZE['x']=2.5325,mapLightPositionZE['y']=0.8380705699382374,mapLightPositionZE['z']=-5.44;
// __UNIT__ u1075 [1902499,1902509) kind=var len=24
var blueLightPointZF={};
// __UNIT__ u1076 [1902509,1902551) kind=expr len=116
blueLightPointZF['preset']=stringDecoderAlias(0xd86),blueLightPointZF[stringDecoderAlias(0x215)]=mapLightPositionZE;
// __UNIT__ u1077 [1902551,1902561) kind=var len=26
var mapLightPositionZG={};
// __UNIT__ u1078 [1902561,1902629) kind=expr len=116
mapLightPositionZG['x']=-1.50236485890886,mapLightPositionZG['y']=0.772258514582209,mapLightPositionZG['z']=-4.1125;
// __UNIT__ u1079 [1902629,1902639) kind=var len=27
var defaultLightPointZH={};
// __UNIT__ u1080 [1902639,1902680) kind=expr len=121
defaultLightPointZH['preset']=stringDecoderAlias(0xe5),defaultLightPointZH[stringDecoderAlias(0x215)]=mapLightPositionZG;
// __UNIT__ u1081 [1902680,1902690) kind=var len=26
var mapLightPositionZI={};
// __UNIT__ u1082 [1902690,1902735) kind=expr len=93
mapLightPositionZI['x']=-3.225,mapLightPositionZI['y']=-0.33,mapLightPositionZI['z']=-4.8275;
// __UNIT__ u1083 [1902735,1902745) kind=var len=25
var whiteLightPointZJ={};
// __UNIT__ u1084 [1902745,1902787) kind=expr len=118
whiteLightPointZJ['preset']=stringDecoderAlias(0x2e6),whiteLightPointZJ[stringDecoderAlias(0x215)]=mapLightPositionZI;
// __UNIT__ u1085 [1902787,1902797) kind=var len=26
var mapLightPositionZK={};
// __UNIT__ u1086 [1902797,1902880) kind=expr len=131
mapLightPositionZK['x']=-3.2572809277181087,mapLightPositionZK['y']=-0.3297842024282729,mapLightPositionZK['z']=-5.034187513582658;
// __UNIT__ u1087 [1902880,1902890) kind=var len=25
var whiteLightPointZL={};
// __UNIT__ u1088 [1902890,1902931) kind=expr len=102
whiteLightPointZL[stringDecoderAlias(0x932)]='White',whiteLightPointZL['position']=mapLightPositionZK;
// __UNIT__ u1089 [1902931,1902941) kind=var len=26
var mapLightPositionZM={};
// __UNIT__ u1090 [1902941,1903025) kind=expr len=132
mapLightPositionZM['x']=-3.2572809882910043,mapLightPositionZM['y']=-0.2679128585083547,mapLightPositionZM['z']=-4.3736301551967225;
// __UNIT__ u1091 [1903025,1903035) kind=var len=25
var whiteLightPointZN={};
// __UNIT__ u1092 [1903035,1903076) kind=expr len=102
whiteLightPointZN[stringDecoderAlias(0x932)]='White',whiteLightPointZN['position']=mapLightPositionZM;
// __UNIT__ u1093 [1903076,1903086) kind=var len=26
var mapLightPositionZO={};
// __UNIT__ u1094 [1903086,1903171) kind=expr len=133
mapLightPositionZO['x']=-3.2572810113253006,mapLightPositionZO['y']=-0.29401703813447566,mapLightPositionZO['z']=-4.1224373724095775;
// __UNIT__ u1095 [1903171,1903181) kind=var len=25
var whiteLightPointZP={};
// __UNIT__ u1096 [1903181,1903225) kind=expr len=135
whiteLightPointZP[stringDecoderAlias(0x932)]=stringDecoderAlias(0x2e6),whiteLightPointZP[stringDecoderAlias(0x215)]=mapLightPositionZO;
// __UNIT__ u1097 [1903225,1903235) kind=var len=26
var mapLightPositionZQ={};
// __UNIT__ u1098 [1903235,1903316) kind=expr len=129
mapLightPositionZQ['x']=-2.55351356680188,mapLightPositionZQ['y']=-0.2146899343260645,mapLightPositionZQ['z']=-6.137239456176758;
// __UNIT__ u1099 [1903316,1903326) kind=var len=25
var whiteLightPointZR={};
// __UNIT__ u1100 [1903326,1903370) kind=expr len=120
whiteLightPointZR[stringDecoderAlias(0x932)]=stringDecoderAlias(0x2e6),whiteLightPointZR['position']=mapLightPositionZQ;
// __UNIT__ u1101 [1903370,1903380) kind=var len=26
var mapLightPositionZS={};
// __UNIT__ u1102 [1903380,1903462) kind=expr len=130
mapLightPositionZS['x']=-0.490726721949476,mapLightPositionZS['y']=-0.4476004651665558,mapLightPositionZS['z']=-6.137239456176758;
// __UNIT__ u1103 [1903462,1903472) kind=var len=25
var whiteLightPointZT={};
// __UNIT__ u1104 [1903472,1903514) kind=expr len=103
whiteLightPointZT['preset']=stringDecoderAlias(0x2e6),whiteLightPointZT['position']=mapLightPositionZS;
// __UNIT__ u1105 [1903514,1903524) kind=var len=26
var mapLightPositionZU={};
// __UNIT__ u1106 [1903524,1903607) kind=expr len=131
mapLightPositionZU['x']=0.1907611830171213,mapLightPositionZU['y']=-0.5741614775711088,mapLightPositionZU['z']=-4.7001860745642885;
// __UNIT__ u1107 [1903607,1903617) kind=var len=25
var whiteLightPointZV={};
// __UNIT__ u1108 [1903617,1903658) kind=expr len=117
whiteLightPointZV[stringDecoderAlias(0x932)]='White',whiteLightPointZV[stringDecoderAlias(0x215)]=mapLightPositionZU;
// __UNIT__ u1109 [1903658,1903668) kind=var len=26
var mapLightPositionZW={};
// __UNIT__ u1110 [1903668,1903748) kind=expr len=128
mapLightPositionZW['x']=0.1907612993083625,mapLightPositionZW['y']=-0.4755502067249453,mapLightPositionZW['z']=-5.5823948916711;
// __UNIT__ u1111 [1903748,1903758) kind=var len=25
var whiteLightPointZX={};
// __UNIT__ u1112 [1903758,1903797) kind=expr len=100
whiteLightPointZX['preset']='White',whiteLightPointZX[stringDecoderAlias(0x215)]=mapLightPositionZW;
// __UNIT__ u1113 [1903797,1903807) kind=var len=26
var mapLightPositionZY={};
// __UNIT__ u1114 [1903807,1903891) kind=expr len=132
mapLightPositionZY['x']=0.19076124789644056,mapLightPositionZY['y']=-0.46571431544904796,mapLightPositionZY['z']=-5.192373682965803;
// __UNIT__ u1115 [1903891,1903901) kind=var len=25
var whiteLightPointZZ={};
// __UNIT__ u1116 [1903901,1903940) kind=expr len=100
whiteLightPointZZ['preset']='White',whiteLightPointZZ[stringDecoderAlias(0x215)]=mapLightPositionZY;
// __UNIT__ u1117 [1903940,1903950) kind=var len=26
var mapLightPositionA0={};
// __UNIT__ u1118 [1903950,1904019) kind=expr len=117
mapLightPositionA0['x']=0.19076129985359602,mapLightPositionA0['y']=-0.18,mapLightPositionA0['z']=-5.586531139739979;
// __UNIT__ u1119 [1904019,1904029) kind=var len=24
var mapLightPresetA1={};
// __UNIT__ u1120 [1904029,1904071) kind=expr len=101
mapLightPresetA1['preset']=stringDecoderAlias(0x2e6),mapLightPresetA1['position']=mapLightPositionA0;
// __UNIT__ u1121 [1904071,1904081) kind=var len=23
var mapLightColorA2={};
// __UNIT__ u1122 [1904081,1904163) kind=expr len=121
mapLightColorA2['x']=0.9921568627450981,mapLightColorA2['y']=0.8313725490196079,mapLightColorA2['z']=0.24705882352941178;
// __UNIT__ u1123 [1904163,1904173) kind=var len=24
var mapLightPreset01={};
// __UNIT__ u1124 [1904173,1904276) kind=expr len=231
mapLightPreset01['pointedDown']=![],mapLightPreset01[stringDecoderAlias(0xa00)]=stringDecoderAlias(0x6a9),mapLightPreset01[stringDecoderAlias(0xd6)]='2.2',mapLightPreset01['intensity']=0x1,mapLightPreset01['color']=mapLightColorA2;
// __UNIT__ u1125 [1904276,1904286) kind=var len=23
var mapLightColorA4={};
// __UNIT__ u1126 [1904286,1904366) kind=expr len=119
mapLightColorA4['x']=0.996078431372549,mapLightColorA4['y']=0.9803921568627451,mapLightColorA4['z']=0.5843137254901961;
// __UNIT__ u1127 [1904366,1904376) kind=var len=24
var mapLightPreset02={};
// __UNIT__ u1128 [1904376,1904466) kind=expr len=203
mapLightPreset02[stringDecoderAlias(0xfa4)]='1',mapLightPreset02['radius']=0.4,mapLightPreset02['scale']=0x6,mapLightPreset02['intensity']=0x1,mapLightPreset02[stringDecoderAlias(0x193)]=mapLightColorA4;
// __UNIT__ u1129 [1904466,1904476) kind=var len=23
var mapLightColorA6={};
// __UNIT__ u1130 [1904476,1904557) kind=expr len=120
mapLightColorA6['x']=0.6705882352941176,mapLightColorA6['y']=0.34509803921568627,mapLightColorA6['z']=0.996078431372549;
// __UNIT__ u1131 [1904557,1904567) kind=var len=24
var mapLightPreset03={};
// __UNIT__ u1132 [1904567,1904661) kind=expr len=207
mapLightPreset03[stringDecoderAlias(0xfa4)]=![],mapLightPreset03['radius']=stringDecoderAlias(0x339),mapLightPreset03['scale']='3',mapLightPreset03['intensity']=0x1,mapLightPreset03['color']=mapLightColorA6;
// __UNIT__ u1133 [1904661,1904671) kind=var len=23
var mapLightColorA8={};
// __UNIT__ u1134 [1904671,1904737) kind=expr len=105
mapLightColorA8['x']=0x1,mapLightColorA8['y']=0.7294117647058823,mapLightColorA8['z']=0.1411764705882353;
// __UNIT__ u1135 [1904737,1904747) kind=var len=24
var mapLightPreset04={};
// __UNIT__ u1136 [1904747,1904840) kind=expr len=191
mapLightPreset04['pointedDown']=![],mapLightPreset04['radius']='0.2',mapLightPreset04['scale']='3.2',mapLightPreset04[stringDecoderAlias(0x390)]=0x1,mapLightPreset04['color']=mapLightColorA8;
// __UNIT__ u1137 [1904840,1904850) kind=var len=23
var mapLightColorAa={};
// __UNIT__ u1138 [1904850,1904929) kind=expr len=118
mapLightColorAa['x']=0.996078431372549,mapLightColorAa['y']=0.788235294117647,mapLightColorAa['z']=0.2235294117647059;
// __UNIT__ u1139 [1904929,1904939) kind=var len=24
var mapLightPreset05={};
// __UNIT__ u1140 [1904939,1905038) kind=expr len=197
mapLightPreset05['pointedDown']=![],mapLightPreset05['radius']=stringDecoderAlias(0xee2),mapLightPreset05['scale']='4.2',mapLightPreset05['intensity']=0x1,mapLightPreset05['color']=mapLightColorAa;
// __UNIT__ u1141 [1905038,1905048) kind=var len=23
var mapLightColorAc={};
// __UNIT__ u1142 [1905048,1905129) kind=expr len=120
mapLightColorAc['x']=0.34509803921568627,mapLightColorAc['y']=0.996078431372549,mapLightColorAc['z']=0.4196078431372549;
// __UNIT__ u1143 [1905129,1905139) kind=var len=24
var mapLightPreset06={};
// __UNIT__ u1144 [1905139,1905237) kind=expr len=241
mapLightPreset06[stringDecoderAlias(0xfa4)]=![],mapLightPreset06[stringDecoderAlias(0xa00)]='0.33',mapLightPreset06['scale']=stringDecoderAlias(0xe3f),mapLightPreset06[stringDecoderAlias(0x390)]=0x1,mapLightPreset06['color']=mapLightColorAc;
// __UNIT__ u1145 [1905237,1905247) kind=var len=23
var mapLightColorAe={};
// __UNIT__ u1146 [1905247,1905328) kind=expr len=120
mapLightColorAe['x']=0.34509803921568627,mapLightColorAe['y']=0.9215686274509803,mapLightColorAe['z']=0.996078431372549;
// __UNIT__ u1147 [1905328,1905338) kind=var len=24
var mapLightPreset07={};
// __UNIT__ u1148 [1905338,1905436) kind=expr len=226
mapLightPreset07[stringDecoderAlias(0xfa4)]=![],mapLightPreset07[stringDecoderAlias(0xa00)]=stringDecoderAlias(0xc6b),mapLightPreset07['scale']='7.3',mapLightPreset07['intensity']=0x1,mapLightPreset07['color']=mapLightColorAe;
// __UNIT__ u1149 [1905436,1905446) kind=var len=23
var mapLightColorAg={};
// __UNIT__ u1150 [1905446,1905527) kind=expr len=120
mapLightColorAg['x']=0.996078431372549,mapLightColorAg['y']=0.5686274509803921,mapLightColorAg['z']=0.08627450980392157;
// __UNIT__ u1151 [1905527,1905537) kind=var len=24
var mapLightPreset08={};
// __UNIT__ u1152 [1905537,1905641) kind=expr len=262
mapLightPreset08[stringDecoderAlias(0xfa4)]=![],mapLightPreset08[stringDecoderAlias(0xa00)]='0.29',mapLightPreset08[stringDecoderAlias(0xd6)]=stringDecoderAlias(0x90f),mapLightPreset08['intensity']=0x1,mapLightPreset08[stringDecoderAlias(0x193)]=mapLightColorAg;
// __UNIT__ u1153 [1905641,1905651) kind=var len=23
var mapLightColorAi={};
// __UNIT__ u1154 [1905651,1905732) kind=expr len=120
mapLightColorAi['x']=0.08627450980392157,mapLightColorAi['y']=0.996078431372549,mapLightColorAi['z']=0.8117647058823529;
// __UNIT__ u1155 [1905732,1905742) kind=var len=24
var mapLightPreset09={};
// __UNIT__ u1156 [1905742,1905839) kind=expr len=210
mapLightPreset09[stringDecoderAlias(0xfa4)]=![],mapLightPreset09['radius']='0.29',mapLightPreset09['scale']=stringDecoderAlias(0x90f),mapLightPreset09['intensity']=0x1,mapLightPreset09['color']=mapLightColorAi;
// __UNIT__ u1157 [1905839,1905849) kind=var len=23
var mapLightColorAk={};
// __UNIT__ u1158 [1905849,1905930) kind=expr len=120
mapLightColorAk['x']=0.996078431372549,mapLightColorAk['y']=0.8549019607843137,mapLightColorAk['z']=0.34509803921568627;
// __UNIT__ u1159 [1905930,1905940) kind=var len=24
var mapLightPreset10={};
// __UNIT__ u1160 [1905940,1906034) kind=expr len=192
mapLightPreset10['pointedDown']=![],mapLightPreset10['radius']='0.29',mapLightPreset10['scale']='0.9',mapLightPreset10[stringDecoderAlias(0x390)]=0x1,mapLightPreset10['color']=mapLightColorAk;
// __UNIT__ u1161 [1906034,1906044) kind=var len=23
var mapLightColorAm={};
// __UNIT__ u1162 [1906044,1906125) kind=expr len=120
mapLightColorAm['x']=0.996078431372549,mapLightColorAm['y']=0.34509803921568627,mapLightColorAm['z']=0.8235294117647058;
// __UNIT__ u1163 [1906125,1906135) kind=var len=24
var mapLightPreset11={};
// __UNIT__ u1164 [1906135,1906229) kind=expr len=222
mapLightPreset11[stringDecoderAlias(0xfa4)]=![],mapLightPreset11['radius']='0.29',mapLightPreset11['scale']='1.1',mapLightPreset11[stringDecoderAlias(0x390)]=0x1,mapLightPreset11[stringDecoderAlias(0x193)]=mapLightColorAm;
// __UNIT__ u1165 [1906229,1906239) kind=var len=23
var mapLightColorAo={};
// __UNIT__ u1166 [1906239,1906320) kind=expr len=120
mapLightColorAo['x']=0.996078431372549,mapLightColorAo['y']=0.6392156862745098,mapLightColorAo['z']=0.34509803921568627;
// __UNIT__ u1167 [1906320,1906330) kind=var len=24
var mapLightPreset12={};
// __UNIT__ u1168 [1906330,1906435) kind=expr len=233
mapLightPreset12['pointedDown']=![],mapLightPreset12[stringDecoderAlias(0xa00)]='0.29',mapLightPreset12['scale']=stringDecoderAlias(0x7ee),mapLightPreset12['intensity']=0x1,mapLightPreset12[stringDecoderAlias(0x193)]=mapLightColorAo;
// __UNIT__ u1169 [1906435,1906445) kind=var len=23
var mapLightColorAq={};
// __UNIT__ u1170 [1906445,1906526) kind=expr len=120
mapLightColorAq['x']=0.8549019607843137,mapLightColorAq['y']=0.34509803921568627,mapLightColorAq['z']=0.996078431372549;
// __UNIT__ u1171 [1906526,1906536) kind=var len=24
var mapLightPreset13={};
// __UNIT__ u1172 [1906536,1906631) kind=expr len=178
mapLightPreset13['pointedDown']=![],mapLightPreset13['radius']='0.29',mapLightPreset13['scale']='0.9',mapLightPreset13['intensity']=0x1,mapLightPreset13['color']=mapLightColorAq;
// __UNIT__ u1173 [1906631,1906641) kind=var len=23
var mapLightColorAs={};
// __UNIT__ u1174 [1906641,1906722) kind=expr len=120
mapLightColorAs['x']=0.996078431372549,mapLightColorAs['y']=0.30196078431372547,mapLightColorAs['z']=0.7411764705882353;
// __UNIT__ u1175 [1906722,1906732) kind=var len=24
var mapLightPreset14={};
// __UNIT__ u1176 [1906732,1906827) kind=expr len=178
mapLightPreset14['pointedDown']=![],mapLightPreset14['radius']='0.31',mapLightPreset14['scale']='1.3',mapLightPreset14['intensity']=0x1,mapLightPreset14['color']=mapLightColorAs;
// __UNIT__ u1177 [1906827,1906837) kind=var len=23
var mapLightColorAu={};
// __UNIT__ u1178 [1906837,1906873) kind=expr len=75
mapLightColorAu['x']=0x1,mapLightColorAu['y']=0x1,mapLightColorAu['z']=0x1;
// __UNIT__ u1179 [1906873,1906883) kind=var len=24
var mapLightPreset15={};
// __UNIT__ u1180 [1906883,1906992) kind=expr len=267
mapLightPreset15['pointedDown']='0',mapLightPreset15[stringDecoderAlias(0xa00)]=stringDecoderAlias(0x10ec),mapLightPreset15['scale']=stringDecoderAlias(0x334),mapLightPreset15[stringDecoderAlias(0x390)]=0x1,mapLightPreset15[stringDecoderAlias(0x193)]=mapLightColorAu;
// __UNIT__ u1181 [1906992,1907002) kind=var len=27
var factoryLightPresets={};
// __UNIT__ u1182 [1907002,1907290) kind=expr len=813
factoryLightPresets['default']=mapLightPreset01,factoryLightPresets['Spotlight']=mapLightPreset02,factoryLightPresets['Purple']=mapLightPreset03,factoryLightPresets[stringDecoderAlias(0x9b2)]=mapLightPreset04,factoryLightPresets['BuildingLight']=mapLightPreset05,factoryLightPresets['Green']=mapLightPreset06,factoryLightPresets[stringDecoderAlias(0xb73)]=mapLightPreset07,factoryLightPresets[stringDecoderAlias(0x329)]=mapLightPreset08,factoryLightPresets[stringDecoderAlias(0xd86)]=mapLightPreset09,factoryLightPresets['Reflection1']=mapLightPreset10,factoryLightPresets['ReflectionPink']=mapLightPreset11,factoryLightPresets['OrangeReflection']=mapLightPreset12,factoryLightPresets['PurpleReflection']=mapLightPreset13,factoryLightPresets['Pink']=mapLightPreset14,factoryLightPresets['White']=mapLightPreset15;
// __UNIT__ u1183 [1907290,1907300) kind=var len=25
var midnightLightData={};
// __UNIT__ u1184 [1907300,1907643) kind=expr len=1671
midnightLightData['sunColor']=midnightSunColor,midnightLightData[stringDecoderAlias(0x359)]=midnightSunDirection,midnightLightData['penumbra']='0.017',midnightLightData['ambient']=stringDecoderAlias(0x5f4),midnightLightData[stringDecoderAlias(0x4ea)]=!![],midnightLightData[stringDecoderAlias(0xb31)]=[mapLightPresetXR,mapLightPresetXT,mapLightPresetXV,mapLightPresetXX,mapLightPresetXZ,mapLightPresetY1,mapLightPresetY3,mapLightPresetY5,mapLightPresetY7,mapLightPresetY9,buildingLightPointYb,buildingLightPointYd,buildingLightPointYf,buildingLightPointYh,buildingLightPointYj,buildingLightPointYl,buildingLightPointYn,buildingLightPointYp,buildingLightPointYr,neonBuildingLight05,buildingLightPointYv,buildingLightPointYx,purpleLightPointYz,mapLightPresetYB,mapLightPresetYD,mapLightPresetYF,buildingLightPointYH,buildingLightPointYJ,buildingLightPointYL,buildingLightPointYN,orangeLightPointYP,orangeLightPointYR,orangeLightPointYT,blueLightPointYV,blueLightPointYX,blueLightPointYZ,mapLightPresetZ1,blueLightPointZ3,reflection1LightPointZ5,reflection1LightPointZ7,reflection1LightPointZ9,reflectionPinkLightPointZb,orangeReflectionLightPointZd,purpleReflectionLightPointZf,orangeLightPointZh,orangeLightPointZj,orangeLightPointZl,blueLightPointZn,blueLightPointZp,blueLightPointZr,greenLightPointZt,greenLightPointZv,greenLightPointZx,mapLightPresetZz,blueLightPointZB,blueLightPointZD,blueLightPointZF,defaultLightPointZH,whiteLightPointZJ,whiteLightPointZL,whiteLightPointZN,whiteLightPointZP,whiteLightPointZR,whiteLightPointZT,whiteLightPointZV,whiteLightPointZX,whiteLightPointZZ,mapLightPresetA1],midnightLightData[stringDecoderAlias(0xd3f)]=factoryLightPresets;
// __UNIT__ u1185 [1907643,1907653) kind=var len=24
var lightmapPresetAy={};
// __UNIT__ u1186 [1907653,1907791) kind=expr len=282
lightmapPresetAy['sunset']=![],lightmapPresetAy['midnight']=!![],lightmapPresetAy[stringDecoderAlias(0x7d5)]=[0x0,0x0,0x0],lightmapPresetAy[stringDecoderAlias(0x380)]=0x3,lightmapPresetAy['sunDirection']=[-0.5,0.8,-0.3],lightmapPresetAy[stringDecoderAlias(0xa3d)]=midnightLightData;
// __UNIT__ u1187 [1907791,1907801) kind=var len=22
var smokeEmitterAz={};
// __UNIT__ u1188 [1907801,1907956) kind=expr len=287
smokeEmitterAz[stringDecoderAlias(0xafb)]='smoke',smokeEmitterAz[stringDecoderAlias(0x2c1)]=0x9,smokeEmitterAz['scaleRange']=[1.2,1.7],smokeEmitterAz[stringDecoderAlias(0x215)]=[16.4,0x7,-4.3],smokeEmitterAz['vary']=[0x0,0x1,0x0],smokeEmitterAz[stringDecoderAlias(0x48b)]=[0x0,0.13,0x0];
// __UNIT__ u1189 [1907956,1907966) kind=var len=22
var smokeEmitterAa={};
// __UNIT__ u1191 [1908123,1908133) kind=var len=21
var smokeEmitterA={};
// __UNIT__ u1192 [1908133,1908287) kind=expr len=265
smokeEmitterA['type']=stringDecoderAlias(0xd4c),smokeEmitterA['spawnEvery']=0x9,smokeEmitterA[stringDecoderAlias(0x85f)]=[1.2,1.7],smokeEmitterA['position']=[22.3,0x7,-4.3],smokeEmitterA['vary']=[0x0,0x1,0x0],smokeEmitterA[stringDecoderAlias(0x48b)]=[0x0,0.13,0x0];
// __UNIT__ u1193 [1908287,1908297) kind=var len=22
var smokeEmitterAc={};
// __UNIT__ u1194 [1908297,1908452) kind=expr len=257
smokeEmitterAc['type']='smoke',smokeEmitterAc['spawnEvery']=0xc,smokeEmitterAc['scaleRange']=[0.5,0.6],smokeEmitterAc[stringDecoderAlias(0x215)]=[-16.2,1.5,-3.79],smokeEmitterAc['vary']=[0x0,0x0,0x0],smokeEmitterAc[stringDecoderAlias(0x48b)]=[0x0,0.03,0x0];
// __UNIT__ u1195 [1908452,1908462) kind=var len=26
var arcadeMusicEmitter={};
// __UNIT__ u1196 [1908462,1908585) kind=expr len=233
arcadeMusicEmitter['directional']=!![],arcadeMusicEmitter[stringDecoderAlias(0x215)]=[-0x12,1.4,12.7],arcadeMusicEmitter['volume']=1.4,arcadeMusicEmitter['rolloff']=0x4,arcadeMusicEmitter[stringDecoderAlias(0x3f5)]='ArcadeMusic.mp3';
// __UNIT__ u1197 [1908585,1908595) kind=var len=34
var neonCityAmbiencePositionAE={};
// __UNIT__ u1198 [1908595,1908634) kind=expr len=111
neonCityAmbiencePositionAE['x']=-0x8,neonCityAmbiencePositionAE['y']=0x3,neonCityAmbiencePositionAE['z']=-0x50;
// __UNIT__ u1199 [1908634,1908644) kind=var len=34
var neonCityAmbiencePositionAF={};
// __UNIT__ u1200 [1908644,1908682) kind=expr len=110
neonCityAmbiencePositionAF['x']=0x3a,neonCityAmbiencePositionAF['y']=0x2,neonCityAmbiencePositionAF['z']=0x43;
// __UNIT__ u1201 [1908682,1908692) kind=var len=31
var neonCityAmbienceEmitter={};
// __UNIT__ u1202 [1908692,1908779) kind=expr len=264
neonCityAmbienceEmitter[stringDecoderAlias(0x4c2)]=!![],neonCityAmbienceEmitter['positions']=[neonCityAmbiencePositionAE,neonCityAmbiencePositionAF],neonCityAmbienceEmitter['volume']=0xf,neonCityAmbienceEmitter[stringDecoderAlias(0x3f5)]=stringDecoderAlias(0xe83);
// __UNIT__ u1203 [1908779,1908789) kind=var len=25
var neonHumPositionAH={};
// __UNIT__ u1204 [1908789,1908868) kind=expr len=124
neonHumPositionAH['x']=33.12487398027918,neonHumPositionAH['y']=4.078677607299565,neonHumPositionAH['z']=11.736156944081845;
// __UNIT__ u1205 [1908868,1908878) kind=var len=25
var neonHumPositionAI={};
// __UNIT__ u1206 [1908878,1908960) kind=expr len=127
neonHumPositionAI['x']=12.859715956098759,neonHumPositionAI['y']=3.4104022881858516,neonHumPositionAI['z']=-58.348846435546875;
// __UNIT__ u1207 [1908960,1908970) kind=var len=25
var neonHumPositionAJ={};
// __UNIT__ u1208 [1908970,1909052) kind=expr len=127
neonHumPositionAJ['x']=19.624618887599933,neonHumPositionAJ['y']=3.2904109519925857,neonHumPositionAJ['z']=-58.347415924072266;
// __UNIT__ u1209 [1909052,1909062) kind=var len=25
var neonHumPositionAK={};
// __UNIT__ u1210 [1909062,1909142) kind=expr len=125
neonHumPositionAK['x']=0.6321742358704532,neonHumPositionAK['y']=7.075142404080541,neonHumPositionAK['z']=-52.94449996948242;
// __UNIT__ u1211 [1909142,1909152) kind=var len=25
var neonHumPositionAL={};
// __UNIT__ u1212 [1909152,1909231) kind=expr len=124
neonHumPositionAL['x']=-24.9892520904541,neonHumPositionAL['y']=7.577969119350347,neonHumPositionAL['z']=-38.36957635876836;
// __UNIT__ u1213 [1909231,1909241) kind=var len=25
var neonHumPositionAM={};
// __UNIT__ u1214 [1909241,1909322) kind=expr len=126
neonHumPositionAM['x']=-34.32672670164786,neonHumPositionAM['y']=8.492390955267656,neonHumPositionAM['z']=-32.029197692871094;
// __UNIT__ u1215 [1909322,1909332) kind=var len=25
var neonHumPositionAN={};
// __UNIT__ u1216 [1909332,1909413) kind=expr len=126
neonHumPositionAN['x']=-32.16570702562437,neonHumPositionAN['y']=8.260352075310028,neonHumPositionAN['z']=-5.2522172927856445;
// __UNIT__ u1217 [1909413,1909423) kind=var len=25
var neonHumPositionAO={};
// __UNIT__ u1218 [1909423,1909503) kind=expr len=125
neonHumPositionAO['x']=-3.29837965965271,neonHumPositionAO['y']=10.140144244344869,neonHumPositionAO['z']=-9.769438455517808;
// __UNIT__ u1219 [1909503,1909513) kind=var len=25
var neonHumPositionAP={};
// __UNIT__ u1220 [1909513,1909594) kind=expr len=126
neonHumPositionAP['x']=21.153390884399414,neonHumPositionAP['y']=5.855867696704594,neonHumPositionAP['z']=-24.272856387072903;
// __UNIT__ u1221 [1909594,1909604) kind=var len=25
var neonHumPositionAQ={};
// __UNIT__ u1222 [1909604,1909682) kind=expr len=123
neonHumPositionAQ['x']=14.52393611268166,neonHumPositionAQ['y']=4.844855021794791,neonHumPositionAQ['z']=14.56745147705078;
// __UNIT__ u1223 [1909682,1909692) kind=var len=25
var neonHumPositionAR={};
// __UNIT__ u1224 [1909692,1909773) kind=expr len=126
neonHumPositionAR['x']=-15.553492546081543,neonHumPositionAR['y']=5.108441329050152,neonHumPositionAR['z']=21.910096951687102;
// __UNIT__ u1225 [1909773,1909783) kind=var len=23
var neonHumEmitterA={};
// __UNIT__ u1226 [1909783,1909918) kind=expr len=395
neonHumEmitterA['directional']=!![],neonHumEmitterA[stringDecoderAlias(0x46c)]=[neonHumPositionAH,neonHumPositionAI,neonHumPositionAJ,neonHumPositionAK,neonHumPositionAL,neonHumPositionAM,neonHumPositionAN,neonHumPositionAO,neonHumPositionAP,neonHumPositionAQ,neonHumPositionAR],neonHumEmitterA['volume']=0.6,neonHumEmitterA[stringDecoderAlias(0x100d)]=6.7,neonHumEmitterA['file']='NeonHum.mp3';
// __UNIT__ u1227 [1909918,1909928) kind=var len=33
var restaurantAmbienceEmitter={};
// __UNIT__ u1228 [1909928,1910062) kind=expr len=279
restaurantAmbienceEmitter['directional']=!![],restaurantAmbienceEmitter['position']=[-0xa,0x14,0xa],restaurantAmbienceEmitter[stringDecoderAlias(0xfe3)]=0xb,restaurantAmbienceEmitter['rolloff']=1.3,restaurantAmbienceEmitter[stringDecoderAlias(0x3f5)]='RestaurantLights&Fans.mp3';
// __UNIT__ u1229 [1910062,1910072) kind=var len=29
var garageAmbienceEmitter={};
// __UNIT__ u1230 [1910072,1910186) kind=expr len=254
garageAmbienceEmitter['directional']=!![],garageAmbienceEmitter[stringDecoderAlias(0x215)]=[-0x25,0xb,0x34],garageAmbienceEmitter['volume']=0x1,garageAmbienceEmitter[stringDecoderAlias(0x100d)]=0x3,garageAmbienceEmitter['file']=stringDecoderAlias(0xeae);
// __UNIT__ u1231 [1910186,1910196) kind=var len=29
var fridgeAudioPositionAV={};
// __UNIT__ u1232 [1910196,1910277) kind=expr len=138
fridgeAudioPositionAV['x']=-17.882731235746885,fridgeAudioPositionAV['y']=5.156770374258155,fridgeAudioPositionAV['z']=-5.819291114807129;
// __UNIT__ u1233 [1910277,1910287) kind=var len=29
var fridgeAudioPositionAW={};
// __UNIT__ u1234 [1910287,1910366) kind=expr len=136
fridgeAudioPositionAW['x']=-8.117840766906738,fridgeAudioPositionAW['y']=5.441127632046036,fridgeAudioPositionAW['z']=35.96741313445427;
// __UNIT__ u1235 [1910366,1910376) kind=var len=29
var fridgeAudioPositionAX={};
// __UNIT__ u1236 [1910376,1910457) kind=expr len=138
fridgeAudioPositionAX['x']=-6.569803237915039,fridgeAudioPositionAX['y']=4.980269310130779,fridgeAudioPositionAX['z']=-34.193724900762895;
// __UNIT__ u1237 [1910457,1910467) kind=var len=29
var fridgeAudioPositionAY={};
// __UNIT__ u1238 [1910467,1910548) kind=expr len=138
fridgeAudioPositionAY['x']=31.331634521484375,fridgeAudioPositionAY['y']=4.412258518642802,fridgeAudioPositionAY['z']=-11.229789380218573;
// __UNIT__ u1239 [1910548,1910558) kind=var len=29
var fridgeAudioPositionAZ={};
// __UNIT__ u1240 [1910558,1910639) kind=expr len=138
fridgeAudioPositionAZ['x']=5.109659194946289,fridgeAudioPositionAZ['y']=2.221428503773818,fridgeAudioPositionAZ['z']=-0.43308787835499185;
// __UNIT__ u1241 [1910639,1910649) kind=var len=29
var fridgeAudioPositionB0={};
// __UNIT__ u1242 [1910649,1910731) kind=expr len=139
fridgeAudioPositionB0['x']=23.589897764381707,fridgeAudioPositionB0['y']=0.13675530512772255,fridgeAudioPositionB0['z']=23.434541702270508;
// __UNIT__ u1243 [1910731,1910741) kind=var len=29
var fridgeAudioPositionB1={};
// __UNIT__ u1244 [1910741,1910821) kind=expr len=137
fridgeAudioPositionB1['x']=-31.4463867615366,fridgeAudioPositionB1['y']=5.2164428620192895,fridgeAudioPositionB1['z']=10.635064125061035;
// __UNIT__ u1245 [1910821,1910831) kind=var len=26
var fridgeAudioEmitter={};
// __UNIT__ u1246 [1910831,1910965) kind=expr len=362
fridgeAudioEmitter[stringDecoderAlias(0x4c2)]=!![],fridgeAudioEmitter['positions']=[fridgeAudioPositionAV,fridgeAudioPositionAW,fridgeAudioPositionAX,fridgeAudioPositionAY,fridgeAudioPositionAZ,fridgeAudioPositionB0,fridgeAudioPositionB1],fridgeAudioEmitter['volume']=0.5,fridgeAudioEmitter['rolloff']=0xa,fridgeAudioEmitter['file']='RestaurantRefrigerator.mp3';
// __UNIT__ u1247 [1910965,1910975) kind=var len=25
var neonHumPositionB3={};
// __UNIT__ u1248 [1910975,1911013) kind=expr len=83
neonHumPositionB3['x']=0x32,neonHumPositionB3['y']=0x4,neonHumPositionB3['z']=0x24;
// __UNIT__ u1249 [1911013,1911023) kind=var len=25
var neonHumPositionB4={};
// __UNIT__ u1250 [1911023,1911102) kind=expr len=124
neonHumPositionB4['x']=-23.51451349890201,neonHumPositionB4['y']=8.487221717834473,neonHumPositionB4['z']=3.359571575930236;
// __UNIT__ u1251 [1911102,1911112) kind=var len=25
var neonHumPositionB5={};
// __UNIT__ u1252 [1911112,1911193) kind=expr len=126
neonHumPositionB5['x']=-23.668818147691223,neonHumPositionB5['y']=8.487221717834473,neonHumPositionB5['z']=13.172199829973856;
// __UNIT__ u1253 [1911193,1911203) kind=var len=25
var neonHumPositionB6={};
// __UNIT__ u1254 [1911203,1911284) kind=expr len=126
neonHumPositionB6['x']=-31.543905009959595,neonHumPositionB6['y']=8.487221717834473,neonHumPositionB6['z']=22.467034208113443;
// __UNIT__ u1255 [1911284,1911294) kind=var len=25
var neonHumPositionB7={};
// __UNIT__ u1256 [1911294,1911372) kind=expr len=123
neonHumPositionB7['x']=-32.75681494595898,neonHumPositionB7['y']=11.8586743018267,neonHumPositionB7['z']=42.74196678940148;
// __UNIT__ u1257 [1911372,1911382) kind=var len=25
var neonHumPositionB8={};
// __UNIT__ u1258 [1911382,1911461) kind=expr len=124
neonHumPositionB8['x']=-9.450711353612038,neonHumPositionB8['y']=11.8688704133342,neonHumPositionB8['z']=46.649592518817144;
// __UNIT__ u1259 [1911461,1911471) kind=var len=25
var neonHumPositionB9={};
// __UNIT__ u1260 [1911471,1911550) kind=expr len=124
neonHumPositionB9['x']=18.7232981843503,neonHumPositionB9['y']=3.5396598748762145,neonHumPositionB9['z']=43.800926208496094;
// __UNIT__ u1261 [1911550,1911560) kind=var len=25
var neonHumPositionBa={};
// __UNIT__ u1262 [1911560,1911638) kind=expr len=123
neonHumPositionBa['x']=17.23659927107286,neonHumPositionBa['y']=3.01285982131958,neonHumPositionBa['z']=34.619133284591435;
// __UNIT__ u1263 [1911638,1911648) kind=var len=25
var neonHumPositionBb={};
// __UNIT__ u1264 [1911648,1911727) kind=expr len=124
neonHumPositionBb['x']=13.654501522830264,neonHumPositionBb['y']=7.218945014860484,neonHumPositionBb['z']=18.08576164035872;
// __UNIT__ u1265 [1911727,1911737) kind=var len=23
var neonHumEmitterB={};
// __UNIT__ u1266 [1911737,1911862) kind=expr len=340
neonHumEmitterB['directional']=!![],neonHumEmitterB['positions']=[neonHumPositionB3,neonHumPositionB4,neonHumPositionB5,neonHumPositionB6,neonHumPositionB7,neonHumPositionB8,neonHumPositionB9,neonHumPositionBa,neonHumPositionBb],neonHumEmitterB['volume']=0.6,neonHumEmitterB['rolloff']=6.7,neonHumEmitterB['file']=stringDecoderAlias(0x270);
// __UNIT__ u1267 [1911862,1911872) kind=var len=25
var trainArrivalSound={};
// __UNIT__ u1268 [1911872,1912027) kind=expr len=260
trainArrivalSound['directional']=!![],trainArrivalSound['position']=[0x32,0x3,-0x4],trainArrivalSound['volume']=0x6,trainArrivalSound['rolloff']=0x3,trainArrivalSound['file']='TrainStationStop2.mp3',trainArrivalSound[stringDecoderAlias(0xf35)]='TrainArriving';
// __UNIT__ u1269 [1912027,1912037) kind=var len=27
var trainDepartureSound={};
// __UNIT__ u1270 [1912037,1912184) kind=expr len=324
trainDepartureSound[stringDecoderAlias(0x4c2)]=!![],trainDepartureSound['position']=[0x32,0x3,-0x4],trainDepartureSound[stringDecoderAlias(0xfe3)]=0x6,trainDepartureSound['rolloff']=0x3,trainDepartureSound[stringDecoderAlias(0x3f5)]=stringDecoderAlias(0x19f),trainDepartureSound['syncToAnimation']=stringDecoderAlias(0x5b4);
// __UNIT__ u1271 [1912184,1912194) kind=var len=24
var cineStartFrameBf={};
// __UNIT__ u1272 [1912194,1912262) kind=expr len=96
cineStartFrameBf['position']=[-0x18,0x5,-35.9],cineStartFrameBf['JoIkrtRxhZ']=[-7.9,4.56,-50.1];
// __UNIT__ u1273 [1912262,1912272) kind=var len=22
var cineEndFrameBg={};
// __UNIT__ u1274 [1912272,1912338) kind=expr len=105
cineEndFrameBg['position']=[-11.5,3.47,-43.4],cineEndFrameBg[stringDecoderAlias(0xf5f)]=[47.7,4.5,-0x3d];
// __UNIT__ u1275 [1912338,1912348) kind=var len=27
var neonCinematicSceneA={};
// __UNIT__ u1276 [1912348,1912403) kind=expr len=162
neonCinematicSceneA['start']=cineStartFrameBf,neonCinematicSceneA[stringDecoderAlias(0x8f7)]=cineEndFrameBg,neonCinematicSceneA[stringDecoderAlias(0x35c)]=0x3a98;
// __UNIT__ u1277 [1912403,1912413) kind=var len=24
var cineStartFrameBi={};
// __UNIT__ u1278 [1912413,1912473) kind=expr len=118
cineStartFrameBi[stringDecoderAlias(0x215)]=[0x1e,0x4,-0x1],cineStartFrameBi[stringDecoderAlias(0xf5f)]=[0x2,0x2,0xf];
// __UNIT__ u1279 [1912473,1912483) kind=var len=22
var cineEndFrameBj={};
// __UNIT__ u1280 [1912483,1912543) kind=expr len=99
cineEndFrameBj['position']=[0xf,1.5,0x6],cineEndFrameBj[stringDecoderAlias(0xf5f)]=[-0x14,0x3,0xb];
// __UNIT__ u1281 [1912543,1912553) kind=var len=27
var neonCinematicSceneB={};
// __UNIT__ u1282 [1912553,1912599) kind=expr len=123
neonCinematicSceneB['start']=cineStartFrameBi,neonCinematicSceneB['end']=cineEndFrameBj,neonCinematicSceneB['time']=0x3a98;
// __UNIT__ u1283 [1912599,1912609) kind=var len=23
var mapSpawnPoint01={};
// __UNIT__ u1284 [1912609,1912704) kind=expr len=160
mapSpawnPoint01['x']=-0xb,mapSpawnPoint01['y']=-6.800000190734863,mapSpawnPoint01['z']=18.899999618530273,mapSpawnPoint01['rx']=0x3c,mapSpawnPoint01['ry']=0x1e;
// __UNIT__ u1285 [1912704,1912714) kind=var len=23
var mapSpawnPoint02={};
// __UNIT__ u1286 [1912714,1912824) kind=expr len=175
mapSpawnPoint02['x']=-27.600000381469727,mapSpawnPoint02['y']=-6.800000190734863,mapSpawnPoint02['z']=-2.799999952316284,mapSpawnPoint02['rx']=0x3d,mapSpawnPoint02['ry']=0x7d;
// __UNIT__ u1287 [1912824,1912834) kind=var len=23
var mapSpawnPoint03={};
// __UNIT__ u1288 [1912834,1912943) kind=expr len=174
mapSpawnPoint03['x']=-54.29999923706055,mapSpawnPoint03['y']=-6.900000095367432,mapSpawnPoint03['z']=55.900001525878906,mapSpawnPoint03['rx']=0x3f,mapSpawnPoint03['ry']=0xbe;
// __UNIT__ u1289 [1912943,1912953) kind=var len=23
var mapSpawnPoint04={};
// __UNIT__ u1290 [1912953,1913061) kind=expr len=173
mapSpawnPoint04['x']=-58.29999923706055,mapSpawnPoint04['y']=-4.199999809265137,mapSpawnPoint04['z']=84.19999694824219,mapSpawnPoint04['rx']=0x40,mapSpawnPoint04['ry']=0xbf;
// __UNIT__ u1291 [1913061,1913071) kind=var len=23
var mapSpawnPoint05={};
// __UNIT__ u1292 [1913071,1913179) kind=expr len=173
mapSpawnPoint05['x']=20.899999618530273,mapSpawnPoint05['y']=-6.800000190734863,mapSpawnPoint05['z']=79.30000305175781,mapSpawnPoint05['rx']=0x3e,mapSpawnPoint05['ry']=0xf4;
// __UNIT__ u1293 [1913179,1913189) kind=var len=23
var mapSpawnPoint06={};
// __UNIT__ u1294 [1913189,1913297) kind=expr len=173
mapSpawnPoint06['x']=30.100000381469727,mapSpawnPoint06['y']=-6.800000190734863,mapSpawnPoint06['z']=5.199999809265137,mapSpawnPoint06['rx']=0x40,mapSpawnPoint06['ry']=0x80;
// __UNIT__ u1295 [1913297,1913307) kind=var len=22
var sunsetSunColor={};
// __UNIT__ u1296 [1913307,1913389) kind=expr len=118
sunsetSunColor['x']=0.7294117647058823,sunsetSunColor['y']=0.5803921568627451,sunsetSunColor['z']=0.17254901960784313;
// __UNIT__ u1297 [1913389,1913399) kind=var len=26
var sunsetSunDirection={};
// __UNIT__ u1298 [1913399,1913441) kind=expr len=90
sunsetSunDirection['x']='0.61',sunsetSunDirection['y']=0.8,sunsetSunDirection['z']='0.84';
// __UNIT__ u1299 [1913441,1913451) kind=var len=26
var mapLightPositionBt={};
// __UNIT__ u1300 [1913451,1913520) kind=expr len=117
mapLightPositionBt['x']=-3.788101881634068,mapLightPositionBt['y']=0.9375,mapLightPositionBt['z']=1.5939705581246888;
// __UNIT__ u1301 [1913520,1913530) kind=var len=27
var defaultLightPointBu={};
// __UNIT__ u1302 [1913530,1913571) kind=expr len=91
defaultLightPointBu['preset']='default',defaultLightPointBu['position']=mapLightPositionBt;
// __UNIT__ u1303 [1913571,1913581) kind=var len=26
var mapLightPositionBv={};
// __UNIT__ u1304 [1913581,1913651) kind=expr len=118
mapLightPositionBv['x']=-1.2025000000000001,mapLightPositionBv['y']=0.7625000000000001,mapLightPositionBv['z']=-5.835;
// __UNIT__ u1305 [1913651,1913661) kind=var len=27
var defaultLightPointBw={};
// __UNIT__ u1306 [1913661,1913702) kind=expr len=106
defaultLightPointBw['preset']=stringDecoderAlias(0xe5),defaultLightPointBw['position']=mapLightPositionBv;
// __UNIT__ u1307 [1913702,1913712) kind=var len=26
var mapLightPositionBx={};
// __UNIT__ u1308 [1913712,1913771) kind=expr len=107
mapLightPositionBx['x']=-1.7325,mapLightPositionBx['y']=0.7624253487949407,mapLightPositionBx['z']=-5.5925;
// __UNIT__ u1309 [1913771,1913781) kind=var len=27
var defaultLightPointBy={};
// __UNIT__ u1310 [1913781,1913824) kind=expr len=108
defaultLightPointBy[stringDecoderAlias(0x932)]='default',defaultLightPointBy['position']=mapLightPositionBx;
// __UNIT__ u1311 [1913824,1913834) kind=var len=26
var mapLightPositionBz={};
// __UNIT__ u1312 [1913834,1913890) kind=expr len=104
mapLightPositionBz['x']=-2.255,mapLightPositionBz['y']=0.7651411327434875,mapLightPositionBz['z']=-5.34;
// __UNIT__ u1313 [1913890,1913900) kind=var len=27
var defaultLightPointBa={};
// __UNIT__ u1314 [1913900,1913943) kind=expr len=108
defaultLightPointBa[stringDecoderAlias(0x932)]='default',defaultLightPointBa['position']=mapLightPositionBz;
// __UNIT__ u1315 [1913943,1913953) kind=var len=26
var mapLightPositionBB={};
// __UNIT__ u1316 [1913953,1913995) kind=expr len=90
mapLightPositionBB['x']=-2.465,mapLightPositionBB['y']=1.01,mapLightPositionBB['z']=-5.26;
// __UNIT__ u1317 [1913995,1914005) kind=var len=24
var blueLightPointBc={};
// __UNIT__ u1318 [1914005,1914047) kind=expr len=116
blueLightPointBc['preset']=stringDecoderAlias(0xd86),blueLightPointBc[stringDecoderAlias(0x215)]=mapLightPositionBB;
// __UNIT__ u1319 [1914047,1914057) kind=var len=26
var mapLightPositionBD={};
// __UNIT__ u1320 [1914057,1914103) kind=expr len=94
mapLightPositionBD['x']=-0.905,mapLightPositionBD['y']=1.2425,mapLightPositionBD['z']=-6.0875;
// __UNIT__ u1321 [1914103,1914113) kind=var len=26
var purpleLightPointBe={};
// __UNIT__ u1322 [1914113,1914155) kind=expr len=105
purpleLightPointBe['preset']=stringDecoderAlias(0x643),purpleLightPointBe['position']=mapLightPositionBD;
// __UNIT__ u1323 [1914155,1914165) kind=var len=26
var mapLightPositionBF={};
// __UNIT__ u1324 [1914165,1914209) kind=expr len=92
mapLightPositionBF['x']=-0.9,mapLightPositionBF['y']=1.3825,mapLightPositionBF['z']=-6.0875;
// __UNIT__ u1325 [1914209,1914219) kind=var len=26
var purpleLightPointBg={};
// __UNIT__ u1326 [1914219,1914261) kind=expr len=105
purpleLightPointBg['preset']=stringDecoderAlias(0x643),purpleLightPointBg['position']=mapLightPositionBF;
// __UNIT__ u1327 [1914261,1914271) kind=var len=26
var mapLightPositionBh={};
// __UNIT__ u1328 [1914271,1914316) kind=expr len=93
mapLightPositionBh['x']=-0.8975,mapLightPositionBh['y']=1.51,mapLightPositionBh['z']=-6.0925;
// __UNIT__ u1329 [1914316,1914326) kind=var len=26
var purpleLightPointBi={};
// __UNIT__ u1330 [1914326,1914368) kind=expr len=120
purpleLightPointBi['preset']=stringDecoderAlias(0x643),purpleLightPointBi[stringDecoderAlias(0x215)]=mapLightPositionBh;
// __UNIT__ u1331 [1914368,1914378) kind=var len=26
var mapLightPositionBj={};
// __UNIT__ u1332 [1914378,1914419) kind=expr len=89
mapLightPositionBj['x']=-2.68,mapLightPositionBj['y']=1.01,mapLightPositionBj['z']=-5.26;
// __UNIT__ u1333 [1914419,1914429) kind=var len=24
var blueLightPointBk={};
// __UNIT__ u1334 [1914429,1914467) kind=expr len=82
blueLightPointBk['preset']='Blue',blueLightPointBk['position']=mapLightPositionBj;
// __UNIT__ u1335 [1914467,1914477) kind=var len=26
var mapLightPositionBl={};
// __UNIT__ u1336 [1914477,1914523) kind=expr len=94
mapLightPositionBl['x']=-2.8875,mapLightPositionBl['y']=1.0175,mapLightPositionBl['z']=-5.255;
// __UNIT__ u1337 [1914523,1914533) kind=var len=24
var blueLightPointBm={};
// __UNIT__ u1338 [1914533,1914573) kind=expr len=99
blueLightPointBm[stringDecoderAlias(0x932)]='Blue',blueLightPointBm['position']=mapLightPositionBl;
// __UNIT__ u1339 [1914573,1914583) kind=var len=26
var mapLightPositionBn={};
// __UNIT__ u1340 [1914583,1914663) kind=expr len=128
mapLightPositionBn['x']=1.276411883786117,mapLightPositionBn['y']=2.0844754887137156,mapLightPositionBn['z']=-7.050182819366453;
// __UNIT__ u1341 [1914663,1914673) kind=var len=28
var buildingLightPointBo={};
// __UNIT__ u1342 [1914673,1914720) kind=expr len=99
buildingLightPointBo['preset']='BuildingLight',buildingLightPointBo['position']=mapLightPositionBn;
// __UNIT__ u1343 [1914720,1914730) kind=var len=26
var mapLightPositionBp={};
// __UNIT__ u1344 [1914730,1914810) kind=expr len=128
mapLightPositionBp['x']=1.886127149969321,mapLightPositionBp['y']=1.7060363612810894,mapLightPositionBp['z']=-7.050182819366453;
// __UNIT__ u1345 [1914810,1914820) kind=var len=28
var buildingLightPointBq={};
// __UNIT__ u1346 [1914820,1914862) kind=expr len=109
buildingLightPointBq['preset']=stringDecoderAlias(0xc5f),buildingLightPointBq['position']=mapLightPositionBp;
// __UNIT__ u1347 [1914862,1914872) kind=var len=26
var mapLightPositionBr={};
// __UNIT__ u1348 [1914872,1914953) kind=expr len=129
mapLightPositionBr['x']=1.4750740642455031,mapLightPositionBr['y']=1.7068279324936582,mapLightPositionBr['z']=-7.050182819366453;
// __UNIT__ u1349 [1914953,1914963) kind=var len=28
var buildingLightPointBs={};
// __UNIT__ u1350 [1914963,1915007) kind=expr len=141
buildingLightPointBs[stringDecoderAlias(0x932)]=stringDecoderAlias(0xc5f),buildingLightPointBs[stringDecoderAlias(0x215)]=mapLightPositionBr;
// __UNIT__ u1351 [1915007,1915017) kind=var len=26
var mapLightPositionBT={};
// __UNIT__ u1352 [1915017,1915098) kind=expr len=129
mapLightPositionBT['x']=2.2694581446110367,mapLightPositionBT['y']=1.1451601847988118,mapLightPositionBT['z']=-6.967312335968017;
// __UNIT__ u1353 [1915098,1915108) kind=var len=28
var buildingLightPointBu={};
// __UNIT__ u1354 [1915108,1915157) kind=expr len=116
buildingLightPointBu[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointBu['position']=mapLightPositionBT;
// __UNIT__ u1355 [1915157,1915167) kind=var len=26
var mapLightPositionBV={};
// __UNIT__ u1356 [1915167,1915247) kind=expr len=128
mapLightPositionBV['x']=1.8892629070848654,mapLightPositionBV['y']=1.141903197401744,mapLightPositionBV['z']=-6.967312335968018;
// __UNIT__ u1357 [1915247,1915257) kind=var len=28
var buildingLightPointBw={};
// __UNIT__ u1358 [1915257,1915304) kind=expr len=114
buildingLightPointBw['preset']='BuildingLight',buildingLightPointBw[stringDecoderAlias(0x215)]=mapLightPositionBV;
// __UNIT__ u1359 [1915304,1915314) kind=var len=26
var mapLightPositionBX={};
// __UNIT__ u1360 [1915314,1915395) kind=expr len=129
mapLightPositionBX['x']=-1.521255804273569,mapLightPositionBX['y']=2.3222496475829266,mapLightPositionBX['z']=-6.375516603508654;
// __UNIT__ u1361 [1915395,1915405) kind=var len=28
var buildingLightPointBy={};
// __UNIT__ u1362 [1915405,1915447) kind=expr len=124
buildingLightPointBy['preset']=stringDecoderAlias(0xc5f),buildingLightPointBy[stringDecoderAlias(0x215)]=mapLightPositionBX;
// __UNIT__ u1363 [1915447,1915457) kind=var len=26
var mapLightPositionBZ={};
// __UNIT__ u1364 [1915457,1915538) kind=expr len=129
mapLightPositionBZ['x']=-1.7755782474522284,mapLightPositionBZ['y']=3.349978457702597,mapLightPositionBZ['z']=-6.253032698416195;
// __UNIT__ u1365 [1915538,1915548) kind=var len=18
var mapLightC0={};
// __UNIT__ u1366 [1915548,1915590) kind=expr len=89
mapLightC0['preset']=stringDecoderAlias(0xc5f),mapLightC0['position']=mapLightPositionBZ;
// __UNIT__ u1367 [1915590,1915600) kind=var len=26
var mapLightPositionC1={};
// __UNIT__ u1368 [1915600,1915682) kind=expr len=130
mapLightPositionC1['x']=-2.2814065133199994,mapLightPositionC1['y']=3.348895076766533,mapLightPositionC1['z']=-6.0094211913120255;
// __UNIT__ u1369 [1915682,1915692) kind=var len=18
var mapLightC2={};
// __UNIT__ u1370 [1915692,1915736) kind=expr len=121
mapLightC2[stringDecoderAlias(0x932)]=stringDecoderAlias(0xc5f),mapLightC2[stringDecoderAlias(0x215)]=mapLightPositionC1;
// __UNIT__ u1371 [1915736,1915746) kind=var len=26
var mapLightPositionC3={};
// __UNIT__ u1372 [1915746,1915828) kind=expr len=130
mapLightPositionC3['x']=-2.7845710483559043,mapLightPositionC3['y']=2.3148684651832023,mapLightPositionC3['z']=-5.767092710691837;
// __UNIT__ u1373 [1915828,1915838) kind=var len=18
var mapLightC4={};
// __UNIT__ u1374 [1915838,1915885) kind=expr len=79
mapLightC4['preset']='BuildingLight',mapLightC4['position']=mapLightPositionC3;
// __UNIT__ u1375 [1915885,1915895) kind=var len=26
var mapLightPositionC5={};
// __UNIT__ u1376 [1915895,1915973) kind=expr len=126
mapLightPositionC5['x']=-3.0348787242516,mapLightPositionC5['y']=2.319675655410909,mapLightPositionC5['z']=-5.646542429497383;
// __UNIT__ u1377 [1915973,1915983) kind=var len=18
var mapLightC6={};
// __UNIT__ u1378 [1915983,1916030) kind=expr len=79
mapLightC6['preset']='BuildingLight',mapLightC6['position']=mapLightPositionC5;
// __UNIT__ u1379 [1916030,1916040) kind=var len=26
var mapLightPositionC7={};
// __UNIT__ u1380 [1916040,1916121) kind=expr len=129
mapLightPositionC7['x']=-0.2799902192115815,mapLightPositionC7['y']=1.424306154251099,mapLightPositionC7['z']=-6.414379225512917;
// __UNIT__ u1381 [1916121,1916131) kind=var len=18
var mapLightC8={};
// __UNIT__ u1382 [1916131,1916178) kind=expr len=79
mapLightC8['preset']='BuildingLight',mapLightC8['position']=mapLightPositionC7;
// __UNIT__ u1383 [1916178,1916188) kind=var len=26
var mapLightPositionC9={};
// __UNIT__ u1384 [1916188,1916269) kind=expr len=129
mapLightPositionC9['x']=-0.5145207168976929,mapLightPositionC9['y']=0.975394250272792,mapLightPositionC9['z']=-6.340712345554641;
// __UNIT__ u1385 [1916269,1916279) kind=var len=28
var buildingLightPointCa={};
// __UNIT__ u1386 [1916279,1916328) kind=expr len=116
buildingLightPointCa[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointCa['position']=mapLightPositionC9;
// __UNIT__ u1387 [1916328,1916338) kind=var len=26
var mapLightPositionCb={};
// __UNIT__ u1388 [1916338,1916405) kind=expr len=115
mapLightPositionCb['x']=0.058592303080231,mapLightPositionCb['y']=1.38127254388771,mapLightPositionCb['z']=-6.3025;
// __UNIT__ u1389 [1916405,1916415) kind=var len=26
var purpleLightPointCc={};
// __UNIT__ u1390 [1916415,1916457) kind=expr len=105
purpleLightPointCc['preset']=stringDecoderAlias(0x643),purpleLightPointCc['position']=mapLightPositionCb;
// __UNIT__ u1391 [1916457,1916467) kind=var len=26
var mapLightPositionCd={};
// __UNIT__ u1392 [1916467,1916539) kind=expr len=120
mapLightPositionCd['x']=0.054181914821799904,mapLightPositionCd['y']=1.1248284203705325,mapLightPositionCd['z']=-6.3075;
// __UNIT__ u1393 [1916539,1916549) kind=var len=26
var purpleLightPointCe={};
// __UNIT__ u1394 [1916549,1916591) kind=expr len=105
purpleLightPointCe['preset']=stringDecoderAlias(0x643),purpleLightPointCe['position']=mapLightPositionCd;
// __UNIT__ u1395 [1916591,1916601) kind=var len=26
var mapLightPositionCf={};
// __UNIT__ u1396 [1916601,1916684) kind=expr len=131
mapLightPositionCf['x']=0.05133169549452332,mapLightPositionCf['y']=0.8158600381908304,mapLightPositionCf['z']=-6.3100000000000005;
// __UNIT__ u1397 [1916684,1916694) kind=var len=26
var purpleLightPointCg={};
// __UNIT__ u1398 [1916694,1916734) kind=expr len=88
purpleLightPointCg['preset']='Purple',purpleLightPointCg['position']=mapLightPositionCf;
// __UNIT__ u1399 [1916734,1916744) kind=var len=26
var mapLightPositionCh={};
// __UNIT__ u1400 [1916744,1916788) kind=expr len=92
mapLightPositionCh['x']=-2.835,mapLightPositionCh['y']=1.3875,mapLightPositionCh['z']=-0.66;
// __UNIT__ u1401 [1916788,1916798) kind=var len=30
var subwayLogoLightPointCi={};
// __UNIT__ u1402 [1916798,1916842) kind=expr len=115
subwayLogoLightPointCi['preset']='SubwayLogo',subwayLogoLightPointCi[stringDecoderAlias(0x215)]=mapLightPositionCh;
// __UNIT__ u1403 [1916842,1916852) kind=var len=26
var mapLightPositionCj={};
// __UNIT__ u1404 [1916852,1916932) kind=expr len=128
mapLightPositionCj['x']=-2.1421890254724576,mapLightPositionCj['y']=1.409917507447883,mapLightPositionCj['z']=-0.96274346113205;
// __UNIT__ u1405 [1916932,1916942) kind=var len=28
var buildingLightPointCk={};
// __UNIT__ u1406 [1916942,1916984) kind=expr len=124
buildingLightPointCk['preset']=stringDecoderAlias(0xc5f),buildingLightPointCk[stringDecoderAlias(0x215)]=mapLightPositionCj;
// __UNIT__ u1407 [1916984,1916994) kind=var len=26
var mapLightPositionCl={};
// __UNIT__ u1408 [1916994,1917077) kind=expr len=131
mapLightPositionCl['x']=-1.2559624577280444,mapLightPositionCl['y']=1.9714911041324303,mapLightPositionCl['z']=-1.0606278181076048;
// __UNIT__ u1409 [1917077,1917087) kind=var len=28
var buildingLightPointCm={};
// __UNIT__ u1410 [1917087,1917131) kind=expr len=126
buildingLightPointCm[stringDecoderAlias(0x932)]=stringDecoderAlias(0xc5f),buildingLightPointCm['position']=mapLightPositionCl;
// __UNIT__ u1411 [1917131,1917141) kind=var len=26
var mapLightPositionCn={};
// __UNIT__ u1412 [1917141,1917223) kind=expr len=130
mapLightPositionCn['x']=-0.6643594306422824,mapLightPositionCn['y']=1.9829590388287464,mapLightPositionCn['z']=-1.060627818107605;
// __UNIT__ u1413 [1917223,1917233) kind=var len=28
var buildingLightPointCo={};
// __UNIT__ u1414 [1917233,1917280) kind=expr len=114
buildingLightPointCo['preset']='BuildingLight',buildingLightPointCo[stringDecoderAlias(0x215)]=mapLightPositionCn;
// __UNIT__ u1415 [1917280,1917290) kind=var len=26
var mapLightPositionCp={};
// __UNIT__ u1416 [1917290,1917371) kind=expr len=129
mapLightPositionCp['x']=-4.024265522574681,mapLightPositionCp['y']=1.585179384250099,mapLightPositionCp['z']=-3.8782131671905526;
// __UNIT__ u1417 [1917371,1917381) kind=var len=28
var buildingLightPointCq={};
// __UNIT__ u1418 [1917381,1917430) kind=expr len=116
buildingLightPointCq[stringDecoderAlias(0x932)]='BuildingLight',buildingLightPointCq['position']=mapLightPositionCp;
// __UNIT__ u1419 [1917430,1917440) kind=var len=26
var mapLightPositionCr={};
// __UNIT__ u1420 [1917440,1917485) kind=expr len=93
mapLightPositionCr['x']=-0.165,mapLightPositionCr['y']=2.025,mapLightPositionCr['z']=-4.4275;
// __UNIT__ u1421 [1917485,1917495) kind=var len=26
var orangeLightPointCs={};
// __UNIT__ u1422 [1917495,1917537) kind=expr len=105
orangeLightPointCs[stringDecoderAlias(0x932)]='Orange',orangeLightPointCs['position']=mapLightPositionCr;
// __UNIT__ u1423 [1917537,1917547) kind=var len=26
var mapLightPositionCt={};
// __UNIT__ u1424 [1917547,1917590) kind=expr len=91
mapLightPositionCt['x']=-0.155,mapLightPositionCt['y']=1.76,mapLightPositionCt['z']=-4.425;
// __UNIT__ u1425 [1917590,1917600) kind=var len=26
var orangeLightPointCu={};
// __UNIT__ u1426 [1917600,1917642) kind=expr len=105
orangeLightPointCu['preset']=stringDecoderAlias(0x329),orangeLightPointCu['position']=mapLightPositionCt;
// __UNIT__ u1427 [1917642,1917652) kind=var len=26
var mapLightPositionCv={};
// __UNIT__ u1428 [1917652,1917699) kind=expr len=95
mapLightPositionCv['x']=-0.1525,mapLightPositionCv['y']=1.4975,mapLightPositionCv['z']=-4.4325;
// __UNIT__ u1429 [1917699,1917709) kind=var len=26
var orangeLightPointCw={};
// __UNIT__ u1430 [1917709,1917753) kind=expr len=122
orangeLightPointCw[stringDecoderAlias(0x932)]=stringDecoderAlias(0x329),orangeLightPointCw['position']=mapLightPositionCv;
// __UNIT__ u1431 [1917753,1917763) kind=var len=26
var mapLightPositionCx={};
// __UNIT__ u1432 [1917763,1917830) kind=expr len=115
mapLightPositionCx['x']=-0.18,mapLightPositionCx['y']=2.035703374647007,mapLightPositionCx['z']=-4.702646710847129;
// __UNIT__ u1433 [1917830,1917840) kind=var len=24
var blueLightPointCy={};
// __UNIT__ u1434 [1917840,1917884) kind=expr len=133
blueLightPointCy[stringDecoderAlias(0x932)]=stringDecoderAlias(0xd86),blueLightPointCy[stringDecoderAlias(0x215)]=mapLightPositionCx;
// __UNIT__ u1435 [1917884,1917894) kind=var len=26
var mapLightPositionCz={};
// __UNIT__ u1436 [1917894,1917962) kind=expr len=116
mapLightPositionCz['x']=-0.16,mapLightPositionCz['y']=1.6387414286138966,mapLightPositionCz['z']=-4.706646303909892;
// __UNIT__ u1437 [1917962,1917972) kind=var len=24
var blueLightPointCa={};
// __UNIT__ u1438 [1917972,1918010) kind=expr len=97
blueLightPointCa['preset']='Blue',blueLightPointCa[stringDecoderAlias(0x215)]=mapLightPositionCz;
// __UNIT__ u1439 [1918010,1918020) kind=var len=26
var mapLightPositionCB={};
// __UNIT__ u1440 [1918020,1918077) kind=expr len=105
mapLightPositionCB['x']=-0.1675,mapLightPositionCB['y']=1.835,mapLightPositionCB['z']=-4.704752992517663;
// __UNIT__ u1441 [1918077,1918087) kind=var len=24
var blueLightPointCc={};
// __UNIT__ u1442 [1918087,1918125) kind=expr len=82
blueLightPointCc['preset']='Blue',blueLightPointCc['position']=mapLightPositionCB;
// __UNIT__ u1443 [1918125,1918135) kind=var len=26
var mapLightPositionCD={};
// __UNIT__ u1444 [1918135,1918181) kind=expr len=94
mapLightPositionCD['x']=0.2525,mapLightPositionCD['y']=1.0925,mapLightPositionCD['z']=-5.2425;
// __UNIT__ u1445 [1918181,1918191) kind=var len=24
var blueLightPointCE={};
// __UNIT__ u1446 [1918191,1918229) kind=expr len=97
blueLightPointCE['preset']='Blue',blueLightPointCE[stringDecoderAlias(0x215)]=mapLightPositionCD;
// __UNIT__ u1447 [1918229,1918239) kind=var len=26
var mapLightPositionCF={};
// __UNIT__ u1448 [1918239,1918319) kind=expr len=128
mapLightPositionCF['x']=0.765326968728536,mapLightPositionCF['y']=0.5028952916170034,mapLightPositionCF['z']=-6.409800529479981;
// __UNIT__ u1449 [1918319,1918329) kind=var len=24
var blueLightPointCG={};
// __UNIT__ u1450 [1918329,1918367) kind=expr len=97
blueLightPointCG['preset']='Blue',blueLightPointCG[stringDecoderAlias(0x215)]=mapLightPositionCF;
// __UNIT__ u1451 [1918367,1918377) kind=var len=26
var mapLightPositionCH={};
// __UNIT__ u1452 [1918377,1918434) kind=expr len=105
mapLightPositionCH['x']=-1.2,mapLightPositionCH['y']=0.32947382603281156,mapLightPositionCH['z']=-5.8375;
// __UNIT__ u1453 [1918434,1918444) kind=var len=31
var reflection1LightPointCI={};
// __UNIT__ u1454 [1918444,1918488) kind=expr len=132
reflection1LightPointCI[stringDecoderAlias(0x932)]=stringDecoderAlias(0x24b),reflection1LightPointCI['position']=mapLightPositionCH;
// __UNIT__ u1455 [1918488,1918498) kind=var len=26
var mapLightPositionCJ={};
// __UNIT__ u1456 [1918498,1918581) kind=expr len=131
mapLightPositionCJ['x']=-1.7454920155485283,mapLightPositionCJ['y']=0.33022000895791026,mapLightPositionCJ['z']=-5.582637321058282;
// __UNIT__ u1457 [1918581,1918591) kind=var len=31
var reflection1LightPointCK={};
// __UNIT__ u1458 [1918591,1918633) kind=expr len=130
reflection1LightPointCK['preset']=stringDecoderAlias(0x24b),reflection1LightPointCK[stringDecoderAlias(0x215)]=mapLightPositionCJ;
// __UNIT__ u1459 [1918633,1918643) kind=var len=26
var mapLightPositionCL={};
// __UNIT__ u1460 [1918643,1918725) kind=expr len=130
mapLightPositionCL['x']=-2.2788558925174667,mapLightPositionCL['y']=0.3307272946474989,mapLightPositionCL['z']=-5.321537725235785;
// __UNIT__ u1461 [1918725,1918735) kind=var len=31
var reflection1LightPointCM={};
// __UNIT__ u1462 [1918735,1918782) kind=expr len=120
reflection1LightPointCM[stringDecoderAlias(0x932)]='Reflection1',reflection1LightPointCM['position']=mapLightPositionCL;
// __UNIT__ u1463 [1918782,1918792) kind=var len=26
var mapLightPositionCN={};
// __UNIT__ u1464 [1918792,1918875) kind=expr len=131
mapLightPositionCN['x']=0.07580611892123329,mapLightPositionCN['y']=0.21862088736642954,mapLightPositionCN['z']=-6.340018098819977;
// __UNIT__ u1465 [1918875,1918885) kind=var len=34
var reflectionPinkLightPointCO={};
// __UNIT__ u1466 [1918885,1918935) kind=expr len=129
reflectionPinkLightPointCO[stringDecoderAlias(0x932)]='ReflectionPink',reflectionPinkLightPointCO['position']=mapLightPositionCN;
// __UNIT__ u1467 [1918935,1918945) kind=var len=26
var mapLightPositionCP={};
// __UNIT__ u1468 [1918945,1919029) kind=expr len=132
mapLightPositionCP['x']=-0.08720129438650526,mapLightPositionCP['y']=0.3306555550389421,mapLightPositionCP['z']=-4.4350000000000005;
// __UNIT__ u1469 [1919029,1919039) kind=var len=36
var orangeReflectionLightPointCQ={};
// __UNIT__ u1470 [1919039,1919081) kind=expr len=125
orangeReflectionLightPointCQ['preset']=stringDecoderAlias(0xd97),orangeReflectionLightPointCQ['position']=mapLightPositionCP;
// __UNIT__ u1471 [1919081,1919091) kind=var len=26
var mapLightPositionCR={};
// __UNIT__ u1472 [1919091,1919161) kind=expr len=118
mapLightPositionCR['x']=-0.0886240287758644,mapLightPositionCR['y']=0.3275,mapLightPositionCR['z']=-4.711952161634878;
// __UNIT__ u1473 [1919161,1919171) kind=var len=36
var purpleReflectionLightPointCS={};
// __UNIT__ u1474 [1919171,1919223) kind=expr len=150
purpleReflectionLightPointCS[stringDecoderAlias(0x932)]='PurpleReflection',purpleReflectionLightPointCS[stringDecoderAlias(0x215)]=mapLightPositionCR;
// __UNIT__ u1475 [1919223,1919233) kind=var len=26
var mapLightPositionCT={};
// __UNIT__ u1476 [1919233,1919291) kind=expr len=106
mapLightPositionCT['x']=-2.7475,mapLightPositionCT['y']=1.1025,mapLightPositionCT['z']=-5.042555723595179;
// __UNIT__ u1477 [1919291,1919301) kind=var len=26
var orangeLightPointCU={};
// __UNIT__ u1478 [1919301,1919341) kind=expr len=103
orangeLightPointCU['preset']='Orange',orangeLightPointCU[stringDecoderAlias(0x215)]=mapLightPositionCT;
// __UNIT__ u1479 [1919341,1919351) kind=var len=26
var mapLightPositionCV={};
// __UNIT__ u1480 [1919351,1919422) kind=expr len=119
mapLightPositionCV['x']=-2.7800000000000002,mapLightPositionCV['y']=1.1025,mapLightPositionCV['z']=-4.8955567481557365;
// __UNIT__ u1481 [1919422,1919432) kind=var len=26
var orangeLightPointCW={};
// __UNIT__ u1482 [1919432,1919474) kind=expr len=105
orangeLightPointCW[stringDecoderAlias(0x932)]='Orange',orangeLightPointCW['position']=mapLightPositionCV;
// __UNIT__ u1483 [1919474,1919484) kind=var len=26
var mapLightPositionCX={};
// __UNIT__ u1484 [1919484,1919541) kind=expr len=105
mapLightPositionCX['x']=-2.77,mapLightPositionCX['y']=1.1025,mapLightPositionCX['z']=-4.7390190299187305;
// __UNIT__ u1485 [1919541,1919551) kind=var len=26
var orangeLightPointCY={};
// __UNIT__ u1486 [1919551,1919595) kind=expr len=137
orangeLightPointCY[stringDecoderAlias(0x932)]=stringDecoderAlias(0x329),orangeLightPointCY[stringDecoderAlias(0x215)]=mapLightPositionCX;
// __UNIT__ u1487 [1919595,1919605) kind=var len=26
var mapLightPositionCZ={};
// __UNIT__ u1488 [1919605,1919664) kind=expr len=107
mapLightPositionCZ['x']=-2.7425,mapLightPositionCZ['y']=1.0342920237978268,mapLightPositionCZ['z']=-4.4475;
// __UNIT__ u1489 [1919664,1919674) kind=var len=24
var blueLightPointD0={};
// __UNIT__ u1490 [1919674,1919716) kind=expr len=101
blueLightPointD0['preset']=stringDecoderAlias(0xd86),blueLightPointD0['position']=mapLightPositionCZ;
// __UNIT__ u1491 [1919716,1919726) kind=var len=26
var mapLightPositionD1={};
// __UNIT__ u1492 [1919726,1919784) kind=expr len=106
mapLightPositionD1['x']=-2.7575,mapLightPositionD1['y']=1.0225,mapLightPositionD1['z']=-4.070402994952216;
// __UNIT__ u1493 [1919784,1919794) kind=var len=18
var mapLightD2={};
// __UNIT__ u1494 [1919794,1919836) kind=expr len=89
mapLightD2['preset']=stringDecoderAlias(0xd86),mapLightD2['position']=mapLightPositionD1;
// __UNIT__ u1495 [1919836,1919846) kind=var len=26
var mapLightPositionD3={};
// __UNIT__ u1496 [1919846,1919890) kind=expr len=92
mapLightPositionD3['x']=-2.7875,mapLightPositionD3['y']=1.095,mapLightPositionD3['z']=-4.24;
// __UNIT__ u1497 [1919890,1919900) kind=var len=18
var mapLightD4={};
// __UNIT__ u1498 [1919900,1919938) kind=expr len=70
mapLightD4['preset']='Blue',mapLightD4['position']=mapLightPositionD3;
// __UNIT__ u1499 [1919938,1919948) kind=var len=26
var mapLightPositionD5={};
// __UNIT__ u1500 [1919948,1919993) kind=expr len=93
mapLightPositionD5['x']=-0.0025,mapLightPositionD5['y']=1.47,mapLightPositionD5['z']=-5.2975;
// __UNIT__ u1501 [1919993,1920003) kind=var len=18
var mapLightD6={};
// __UNIT__ u1502 [1920003,1920044) kind=expr len=103
mapLightD6[stringDecoderAlias(0x932)]='Green',mapLightD6[stringDecoderAlias(0x215)]=mapLightPositionD5;
// __UNIT__ u1503 [1920044,1920054) kind=var len=26
var mapLightPositionD7={};
// __UNIT__ u1504 [1920054,1920109) kind=expr len=103
mapLightPositionD7['x']=-0.1525,mapLightPositionD7['y']=1.53630882591143,mapLightPositionD7['z']=-5.51;
// __UNIT__ u1505 [1920109,1920119) kind=var len=18
var mapLightD8={};
// __UNIT__ u1506 [1920119,1920161) kind=expr len=89
mapLightD8['preset']=stringDecoderAlias(0x86d),mapLightD8['position']=mapLightPositionD7;
// __UNIT__ u1507 [1920161,1920171) kind=var len=26
var mapLightPositionD9={};
// __UNIT__ u1508 [1920171,1920228) kind=expr len=105
mapLightPositionD9['x']=-0.2675,mapLightPositionD9['y']=1.5218971690782686,mapLightPositionD9['z']=-5.73;
// __UNIT__ u1509 [1920228,1920238) kind=var len=18
var mapLightDa={};
// __UNIT__ u1510 [1920238,1920277) kind=expr len=71
mapLightDa['preset']='Green',mapLightDa['position']=mapLightPositionD9;
// __UNIT__ u1511 [1920277,1920287) kind=var len=26
var mapLightPositionDb={};
// __UNIT__ u1512 [1920287,1920344) kind=expr len=105
mapLightPositionDb['x']=-0.38,mapLightPositionDb['y']=1.4652375641222777,mapLightPositionDb['z']=-5.9675;
// __UNIT__ u1513 [1920344,1920354) kind=var len=18
var mapLightDc={};
// __UNIT__ u1514 [1920354,1920392) kind=expr len=85
mapLightDc['preset']='Pink',mapLightDc[stringDecoderAlias(0x215)]=mapLightPositionDb;
// __UNIT__ u1515 [1920392,1920402) kind=var len=26
var mapLightPositionDd={};
// __UNIT__ u1516 [1920402,1920445) kind=expr len=91
mapLightPositionDd['x']=2.515,mapLightPositionDd['y']=1.6275,mapLightPositionDd['z']=-5.46;
// __UNIT__ u1517 [1920445,1920455) kind=var len=18
var mapLightDe={};
// __UNIT__ u1518 [1920455,1920495) kind=expr len=87
mapLightDe[stringDecoderAlias(0x932)]='Blue',mapLightDe['position']=mapLightPositionDd;
// __UNIT__ u1519 [1920495,1920505) kind=var len=26
var mapLightPositionDf={};
// __UNIT__ u1520 [1920505,1920573) kind=expr len=116
mapLightPositionDf['x']=2.5300000000000002,mapLightPositionDf['y']=1.2594509444709565,mapLightPositionDf['z']=-5.46;
// __UNIT__ u1521 [1920573,1920583) kind=var len=18
var mapLightDg={};
// __UNIT__ u1522 [1920583,1920621) kind=expr len=70
mapLightDg['preset']='Blue',mapLightDg['position']=mapLightPositionDf;
// __UNIT__ u1523 [1920621,1920631) kind=var len=26
var mapLightPositionDh={};
// __UNIT__ u1524 [1920631,1920687) kind=expr len=104
mapLightPositionDh['x']=2.5325,mapLightPositionDh['y']=0.8380705699382374,mapLightPositionDh['z']=-5.44;
// __UNIT__ u1525 [1920687,1920697) kind=var len=24
var blueLightPointDi={};
// __UNIT__ u1526 [1920697,1920739) kind=expr len=116
blueLightPointDi['preset']=stringDecoderAlias(0xd86),blueLightPointDi[stringDecoderAlias(0x215)]=mapLightPositionDh;
// __UNIT__ u1527 [1920739,1920749) kind=var len=26
var mapLightPositionDj={};
// __UNIT__ u1528 [1920749,1920817) kind=expr len=116
mapLightPositionDj['x']=-1.50236485890886,mapLightPositionDj['y']=0.772258514582209,mapLightPositionDj['z']=-4.1125;
// __UNIT__ u1529 [1920817,1920827) kind=var len=27
var defaultLightPointDk={};
// __UNIT__ u1530 [1920827,1920868) kind=expr len=91
defaultLightPointDk['preset']='default',defaultLightPointDk['position']=mapLightPositionDj;
// __UNIT__ u1531 [1920868,1920878) kind=var len=26
var mapLightPositionDl={};
// __UNIT__ u1532 [1920878,1920923) kind=expr len=93
mapLightPositionDl['x']=-3.225,mapLightPositionDl['y']=-0.33,mapLightPositionDl['z']=-4.8275;
// __UNIT__ u1533 [1920923,1920933) kind=var len=25
var whiteLightPointDm={};
// __UNIT__ u1534 [1920933,1920975) kind=expr len=118
whiteLightPointDm['preset']=stringDecoderAlias(0x2e6),whiteLightPointDm[stringDecoderAlias(0x215)]=mapLightPositionDl;
// __UNIT__ u1535 [1920975,1920985) kind=var len=26
var mapLightPositionDn={};
// __UNIT__ u1536 [1920985,1921068) kind=expr len=131
mapLightPositionDn['x']=-3.2572809277181087,mapLightPositionDn['y']=-0.3297842024282729,mapLightPositionDn['z']=-5.034187513582658;
// __UNIT__ u1537 [1921068,1921078) kind=var len=25
var whiteLightPointDo={};
// __UNIT__ u1538 [1921078,1921122) kind=expr len=135
whiteLightPointDo[stringDecoderAlias(0x932)]=stringDecoderAlias(0x2e6),whiteLightPointDo[stringDecoderAlias(0x215)]=mapLightPositionDn;
// __UNIT__ u1539 [1921122,1921132) kind=var len=26
var mapLightPositionDp={};
// __UNIT__ u1540 [1921132,1921216) kind=expr len=132
mapLightPositionDp['x']=-3.2572809882910043,mapLightPositionDp['y']=-0.2679128585083547,mapLightPositionDp['z']=-4.3736301551967225;
// __UNIT__ u1541 [1921216,1921226) kind=var len=25
var whiteLightPointDq={};
// __UNIT__ u1542 [1921226,1921267) kind=expr len=117
whiteLightPointDq[stringDecoderAlias(0x932)]='White',whiteLightPointDq[stringDecoderAlias(0x215)]=mapLightPositionDp;
// __UNIT__ u1543 [1921267,1921277) kind=var len=26
var mapLightPositionDr={};
// __UNIT__ u1544 [1921277,1921362) kind=expr len=133
mapLightPositionDr['x']=-3.2572810113253006,mapLightPositionDr['y']=-0.29401703813447566,mapLightPositionDr['z']=-4.1224373724095775;
// __UNIT__ u1545 [1921362,1921372) kind=var len=25
var whiteLightPointDs={};
// __UNIT__ u1546 [1921372,1921413) kind=expr len=102
whiteLightPointDs[stringDecoderAlias(0x932)]='White',whiteLightPointDs['position']=mapLightPositionDr;
// __UNIT__ u1547 [1921413,1921423) kind=var len=26
var mapLightPositionDt={};
// __UNIT__ u1548 [1921423,1921504) kind=expr len=129
mapLightPositionDt['x']=-2.55351356680188,mapLightPositionDt['y']=-0.2146899343260645,mapLightPositionDt['z']=-6.137239456176758;
// __UNIT__ u1549 [1921504,1921514) kind=var len=25
var whiteLightPointDu={};
// __UNIT__ u1550 [1921514,1921553) kind=expr len=85
whiteLightPointDu['preset']='White',whiteLightPointDu['position']=mapLightPositionDt;
// __UNIT__ u1551 [1921553,1921563) kind=var len=26
var mapLightPositionDv={};
// __UNIT__ u1552 [1921563,1921645) kind=expr len=130
mapLightPositionDv['x']=-0.490726721949476,mapLightPositionDv['y']=-0.4476004651665558,mapLightPositionDv['z']=-6.137239456176758;
// __UNIT__ u1553 [1921645,1921655) kind=var len=25
var whiteLightPointDw={};
// __UNIT__ u1554 [1921655,1921694) kind=expr len=100
whiteLightPointDw['preset']='White',whiteLightPointDw[stringDecoderAlias(0x215)]=mapLightPositionDv;
// __UNIT__ u1555 [1921694,1921704) kind=var len=26
var mapLightPositionDx={};
// __UNIT__ u1556 [1921704,1921787) kind=expr len=131
mapLightPositionDx['x']=0.1907611830171213,mapLightPositionDx['y']=-0.5741614775711088,mapLightPositionDx['z']=-4.7001860745642885;
// __UNIT__ u1557 [1921787,1921797) kind=var len=25
var whiteLightPointDy={};
// __UNIT__ u1558 [1921797,1921839) kind=expr len=103
whiteLightPointDy['preset']=stringDecoderAlias(0x2e6),whiteLightPointDy['position']=mapLightPositionDx;
// __UNIT__ u1559 [1921839,1921849) kind=var len=26
var mapLightPositionDz={};
// __UNIT__ u1560 [1921849,1921929) kind=expr len=128
mapLightPositionDz['x']=0.1907612993083625,mapLightPositionDz['y']=-0.4755502067249453,mapLightPositionDz['z']=-5.5823948916711;
// __UNIT__ u1561 [1921929,1921939) kind=var len=18
var mapLightDA={};
// __UNIT__ u1562 [1921939,1921980) kind=expr len=103
mapLightDA[stringDecoderAlias(0x932)]='White',mapLightDA[stringDecoderAlias(0x215)]=mapLightPositionDz;
// __UNIT__ u1563 [1921980,1921990) kind=var len=26
var mapLightPositionDB={};
// __UNIT__ u1564 [1921990,1922074) kind=expr len=132
mapLightPositionDB['x']=0.19076124789644056,mapLightPositionDB['y']=-0.46571431544904796,mapLightPositionDB['z']=-5.192373682965803;
// __UNIT__ u1565 [1922074,1922084) kind=var len=18
var mapLightDC={};
// __UNIT__ u1566 [1922084,1922125) kind=expr len=88
mapLightDC[stringDecoderAlias(0x932)]='White',mapLightDC['position']=mapLightPositionDB;
// __UNIT__ u1567 [1922125,1922135) kind=var len=26
var mapLightPositionDD={};
// __UNIT__ u1568 [1922135,1922204) kind=expr len=117
mapLightPositionDD['x']=0.19076129985359602,mapLightPositionDD['y']=-0.18,mapLightPositionDD['z']=-5.586531139739979;
// __UNIT__ u1569 [1922204,1922214) kind=var len=18
var mapLightDE={};
// __UNIT__ u1570 [1922214,1922253) kind=expr len=86
mapLightDE['preset']='White',mapLightDE[stringDecoderAlias(0x215)]=mapLightPositionDD;
// __UNIT__ u1571 [1922253,1922263) kind=var len=23
var mapLightColorDF={};
// __UNIT__ u1572 [1922263,1922345) kind=expr len=121
mapLightColorDF['x']=0.9921568627450981,mapLightColorDF['y']=0.8313725490196079,mapLightColorDF['z']=0.24705882352941178;
// __UNIT__ u1573 [1922345,1922355) kind=var len=24
var mapLightPreset16={};
// __UNIT__ u1574 [1922355,1922460) kind=expr len=233
mapLightPreset16['pointedDown']=![],mapLightPreset16[stringDecoderAlias(0xa00)]='0.29',mapLightPreset16['scale']=stringDecoderAlias(0x90f),mapLightPreset16['intensity']=0x1,mapLightPreset16[stringDecoderAlias(0x193)]=mapLightColorDF;
// __UNIT__ u1575 [1922460,1922470) kind=var len=23
var mapLightColorDH={};
// __UNIT__ u1576 [1922470,1922550) kind=expr len=119
mapLightColorDH['x']=0.996078431372549,mapLightColorDH['y']=0.9803921568627451,mapLightColorDH['z']=0.5843137254901961;
// __UNIT__ u1577 [1922550,1922560) kind=var len=24
var mapLightPreset17={};
// __UNIT__ u1578 [1922560,1922652) kind=expr len=190
mapLightPreset17['pointedDown']='1',mapLightPreset17[stringDecoderAlias(0xa00)]=0.4,mapLightPreset17['scale']=0x6,mapLightPreset17['intensity']=0x1,mapLightPreset17['color']=mapLightColorDH;
// __UNIT__ u1579 [1922652,1922662) kind=var len=23
var mapLightColorDJ={};
// __UNIT__ u1580 [1922662,1922743) kind=expr len=120
mapLightColorDJ['x']=0.6705882352941176,mapLightColorDJ['y']=0.34509803921568627,mapLightColorDJ['z']=0.996078431372549;
// __UNIT__ u1581 [1922743,1922753) kind=var len=24
var mapLightPreset18={};
// __UNIT__ u1582 [1922753,1922849) kind=expr len=224
mapLightPreset18[stringDecoderAlias(0xfa4)]=![],mapLightPreset18[stringDecoderAlias(0xa00)]=stringDecoderAlias(0x339),mapLightPreset18['scale']='3',mapLightPreset18['intensity']=0x1,mapLightPreset18['color']=mapLightColorDJ;
// __UNIT__ u1583 [1922849,1922859) kind=var len=23
var mapLightColorDL={};
// __UNIT__ u1584 [1922859,1922925) kind=expr len=105
mapLightColorDL['x']=0x1,mapLightColorDL['y']=0.7294117647058823,mapLightColorDL['z']=0.1411764705882353;
// __UNIT__ u1585 [1922925,1922935) kind=var len=24
var mapLightPreset19={};
// __UNIT__ u1586 [1922935,1923034) kind=expr len=227
mapLightPreset19[stringDecoderAlias(0xfa4)]=![],mapLightPreset19['radius']='0.2',mapLightPreset19['scale']=stringDecoderAlias(0x92a),mapLightPreset19['intensity']=0x1,mapLightPreset19[stringDecoderAlias(0x193)]=mapLightColorDL;
// __UNIT__ u1587 [1923034,1923044) kind=var len=23
var mapLightColorDN={};
// __UNIT__ u1588 [1923044,1923123) kind=expr len=118
mapLightColorDN['x']=0.996078431372549,mapLightColorDN['y']=0.788235294117647,mapLightColorDN['z']=0.2235294117647059;
// __UNIT__ u1589 [1923123,1923133) kind=var len=24
var mapLightPreset20={};
// __UNIT__ u1590 [1923133,1923235) kind=expr len=215
mapLightPreset20['pointedDown']=![],mapLightPreset20[stringDecoderAlias(0xa00)]='0.57',mapLightPreset20['scale']=stringDecoderAlias(0xe52),mapLightPreset20['intensity']=0x1,mapLightPreset20['color']=mapLightColorDN;
// __UNIT__ u1591 [1923235,1923245) kind=var len=23
var mapLightColorDP={};
// __UNIT__ u1592 [1923245,1923326) kind=expr len=120
mapLightColorDP['x']=0.34509803921568627,mapLightColorDP['y']=0.996078431372549,mapLightColorDP['z']=0.4196078431372549;
// __UNIT__ u1593 [1923326,1923336) kind=var len=24
var mapLightPreset21={};
// __UNIT__ u1594 [1923336,1923442) kind=expr len=234
mapLightPreset21['pointedDown']=![],mapLightPreset21['radius']=stringDecoderAlias(0xb01),mapLightPreset21[stringDecoderAlias(0xd6)]=stringDecoderAlias(0xe3f),mapLightPreset21['intensity']=0x1,mapLightPreset21['color']=mapLightColorDP;
// __UNIT__ u1595 [1923442,1923452) kind=var len=23
var mapLightColorDR={};
// __UNIT__ u1596 [1923452,1923533) kind=expr len=120
mapLightColorDR['x']=0.34509803921568627,mapLightColorDR['y']=0.9215686274509803,mapLightColorDR['z']=0.996078431372549;
// __UNIT__ u1597 [1923533,1923543) kind=var len=24
var mapLightPreset22={};
// __UNIT__ u1598 [1923543,1923646) kind=expr len=216
mapLightPreset22['pointedDown']=![],mapLightPreset22['radius']='0.79',mapLightPreset22['scale']=stringDecoderAlias(0x587),mapLightPreset22['intensity']=0x1,mapLightPreset22[stringDecoderAlias(0x193)]=mapLightColorDR;
// __UNIT__ u1599 [1923646,1923656) kind=var len=23
var mapLightColorDT={};
// __UNIT__ u1600 [1923656,1923737) kind=expr len=120
mapLightColorDT['x']=0.996078431372549,mapLightColorDT['y']=0.5686274509803921,mapLightColorDT['z']=0.08627450980392157;
// __UNIT__ u1601 [1923737,1923747) kind=var len=24
var mapLightPreset23={};
// __UNIT__ u1602 [1923747,1923852) kind=expr len=233
mapLightPreset23['pointedDown']=![],mapLightPreset23[stringDecoderAlias(0xa00)]='0.29',mapLightPreset23['scale']=stringDecoderAlias(0x90f),mapLightPreset23['intensity']=0x1,mapLightPreset23[stringDecoderAlias(0x193)]=mapLightColorDT;
// __UNIT__ u1603 [1923852,1923862) kind=var len=23
var mapLightColorDV={};
// __UNIT__ u1604 [1923862,1923943) kind=expr len=120
mapLightColorDV['x']=0.08627450980392157,mapLightColorDV['y']=0.996078431372549,mapLightColorDV['z']=0.8117647058823529;
// __UNIT__ u1605 [1923943,1923953) kind=var len=24
var mapLightPreset24={};
// __UNIT__ u1606 [1923953,1924055) kind=expr len=230
mapLightPreset24['pointedDown']=![],mapLightPreset24['radius']='0.29',mapLightPreset24['scale']=stringDecoderAlias(0x90f),mapLightPreset24[stringDecoderAlias(0x390)]=0x1,mapLightPreset24[stringDecoderAlias(0x193)]=mapLightColorDV;
// __UNIT__ u1607 [1924055,1924065) kind=var len=23
var mapLightColorDX={};
// __UNIT__ u1608 [1924065,1924146) kind=expr len=120
mapLightColorDX['x']=0.996078431372549,mapLightColorDX['y']=0.8549019607843137,mapLightColorDX['z']=0.34509803921568627;
// __UNIT__ u1609 [1924146,1924156) kind=var len=24
var mapLightPreset25={};
// __UNIT__ u1610 [1924156,1924254) kind=expr len=211
mapLightPreset25['pointedDown']=![],mapLightPreset25['radius']=stringDecoderAlias(0x6a9),mapLightPreset25['scale']='0.9',mapLightPreset25[stringDecoderAlias(0x390)]=0x1,mapLightPreset25['color']=mapLightColorDX;
// __UNIT__ u1611 [1924254,1924264) kind=var len=23
var mapLightColorDZ={};
// __UNIT__ u1612 [1924264,1924345) kind=expr len=120
mapLightColorDZ['x']=0.996078431372549,mapLightColorDZ['y']=0.34509803921568627,mapLightColorDZ['z']=0.8235294117647058;
// __UNIT__ u1613 [1924345,1924355) kind=var len=24
var mapLightPreset26={};
// __UNIT__ u1614 [1924355,1924450) kind=expr len=238
mapLightPreset26[stringDecoderAlias(0xfa4)]=![],mapLightPreset26[stringDecoderAlias(0xa00)]='0.29',mapLightPreset26[stringDecoderAlias(0xd6)]='1.1',mapLightPreset26[stringDecoderAlias(0x390)]=0x1,mapLightPreset26['color']=mapLightColorDZ;
// __UNIT__ u1615 [1924450,1924460) kind=var len=23
var mapLightColorE1={};
// __UNIT__ u1616 [1924460,1924541) kind=expr len=120
mapLightColorE1['x']=0.996078431372549,mapLightColorE1['y']=0.6392156862745098,mapLightColorE1['z']=0.34509803921568627;
// __UNIT__ u1617 [1924541,1924551) kind=var len=24
var mapLightPreset27={};
// __UNIT__ u1618 [1924551,1924642) kind=expr len=204
mapLightPreset27[stringDecoderAlias(0xfa4)]=![],mapLightPreset27['radius']='0.29',mapLightPreset27['scale']='0.9',mapLightPreset27[stringDecoderAlias(0x390)]=0x1,mapLightPreset27['color']=mapLightColorE1;
// __UNIT__ u1619 [1924642,1924652) kind=var len=23
var mapLightColorE3={};
// __UNIT__ u1620 [1924652,1924733) kind=expr len=120
mapLightColorE3['x']=0.8549019607843137,mapLightColorE3['y']=0.34509803921568627,mapLightColorE3['z']=0.996078431372549;
// __UNIT__ u1621 [1924733,1924743) kind=var len=24
var mapLightPreset28={};
// __UNIT__ u1622 [1924743,1924842) kind=expr len=212
mapLightPreset28['pointedDown']=![],mapLightPreset28[stringDecoderAlias(0xa00)]='0.29',mapLightPreset28[stringDecoderAlias(0xd6)]='0.9',mapLightPreset28['intensity']=0x1,mapLightPreset28['color']=mapLightColorE3;
// __UNIT__ u1623 [1924842,1924852) kind=var len=23
var mapLightColorE5={};
// __UNIT__ u1624 [1924852,1924933) kind=expr len=120
mapLightColorE5['x']=0.996078431372549,mapLightColorE5['y']=0.30196078431372547,mapLightColorE5['z']=0.7411764705882353;
// __UNIT__ u1625 [1924933,1924943) kind=var len=24
var mapLightPreset29={};
// __UNIT__ u1626 [1924943,1925049) kind=expr len=234
mapLightPreset29['pointedDown']=![],mapLightPreset29[stringDecoderAlias(0xa00)]=stringDecoderAlias(0xb9f),mapLightPreset29['scale']=stringDecoderAlias(0xe3f),mapLightPreset29['intensity']=0x1,mapLightPreset29['color']=mapLightColorE5;
// __UNIT__ u1627 [1925049,1925059) kind=var len=23
var mapLightColorE7={};
// __UNIT__ u1628 [1925059,1925095) kind=expr len=75
mapLightColorE7['x']=0x1,mapLightColorE7['y']=0x1,mapLightColorE7['z']=0x1;
// __UNIT__ u1629 [1925095,1925105) kind=var len=24
var mapLightPreset30={};
// __UNIT__ u1630 [1925105,1925202) kind=expr len=210
mapLightPreset30['pointedDown']='0',mapLightPreset30['radius']='0.26',mapLightPreset30['scale']='0.8',mapLightPreset30[stringDecoderAlias(0x390)]=0x1,mapLightPreset30[stringDecoderAlias(0x193)]=mapLightColorE7;
// __UNIT__ u1631 [1925202,1925212) kind=var len=29
var sandstormLightPresets={};
// __UNIT__ u1632 [1925212,1925485) kind=expr len=843
sandstormLightPresets[stringDecoderAlias(0xe5)]=mapLightPreset16,sandstormLightPresets[stringDecoderAlias(0x6b7)]=mapLightPreset17,sandstormLightPresets['Purple']=mapLightPreset18,sandstormLightPresets['Red']=mapLightPreset19,sandstormLightPresets[stringDecoderAlias(0xc5f)]=mapLightPreset20,sandstormLightPresets['Green']=mapLightPreset21,sandstormLightPresets['SubwayLogo']=mapLightPreset22,sandstormLightPresets['Orange']=mapLightPreset23,sandstormLightPresets['Blue']=mapLightPreset24,sandstormLightPresets[stringDecoderAlias(0x24b)]=mapLightPreset25,sandstormLightPresets['ReflectionPink']=mapLightPreset26,sandstormLightPresets['OrangeReflection']=mapLightPreset27,sandstormLightPresets['PurpleReflection']=mapLightPreset28,sandstormLightPresets['Pink']=mapLightPreset29,sandstormLightPresets[stringDecoderAlias(0x2e6)]=mapLightPreset30;
// __UNIT__ u1633 [1925485,1925495) kind=var len=23
var sunsetLightData={};
// __UNIT__ u1634 [1925495,1925838) kind=expr len=1503
sunsetLightData['sunColor']=sunsetSunColor,sunsetLightData['sunDirection']=sunsetSunDirection,sunsetLightData[stringDecoderAlias(0x546)]='0.017',sunsetLightData['ambient']='0.5',sunsetLightData['diffuse']=!![],sunsetLightData['lights']=[defaultLightPointBu,defaultLightPointBw,defaultLightPointBy,defaultLightPointBa,blueLightPointBc,purpleLightPointBe,purpleLightPointBg,purpleLightPointBi,blueLightPointBk,blueLightPointBm,buildingLightPointBo,buildingLightPointBq,buildingLightPointBs,buildingLightPointBu,buildingLightPointBw,buildingLightPointBy,mapLightC0,mapLightC2,mapLightC4,mapLightC6,mapLightC8,buildingLightPointCa,purpleLightPointCc,purpleLightPointCe,purpleLightPointCg,subwayLogoLightPointCi,buildingLightPointCk,buildingLightPointCm,buildingLightPointCo,buildingLightPointCq,orangeLightPointCs,orangeLightPointCu,orangeLightPointCw,blueLightPointCy,blueLightPointCa,blueLightPointCc,blueLightPointCE,blueLightPointCG,reflection1LightPointCI,reflection1LightPointCK,reflection1LightPointCM,reflectionPinkLightPointCO,orangeReflectionLightPointCQ,purpleReflectionLightPointCS,orangeLightPointCU,orangeLightPointCW,orangeLightPointCY,blueLightPointD0,mapLightD2,mapLightD4,mapLightD6,mapLightD8,mapLightDa,mapLightDc,mapLightDe,mapLightDg,blueLightPointDi,defaultLightPointDk,whiteLightPointDm,whiteLightPointDo,whiteLightPointDq,whiteLightPointDs,whiteLightPointDu,whiteLightPointDw,whiteLightPointDy,mapLightDA,mapLightDC,mapLightDE],sunsetLightData['lightPresets']=sandstormLightPresets;
// __UNIT__ u1635 [1925838,1925848) kind=var len=24
var lightmapPresetEb={};
// __UNIT__ u1637 [1925992,1926002) kind=var len=39
var cinematicSegmentSandstormAStart={};
// __UNIT__ u1638 [1926002,1926064) kind=expr len=135
cinematicSegmentSandstormAStart['position']=[-0x22,-0x4,5.5],cinematicSegmentSandstormAStart[stringDecoderAlias(0xf5f)]=[0xe,-0x6,5.5];
// __UNIT__ u1639 [1926064,1926074) kind=var len=37
var cinematicSegmentSandstormAEnd={};
// __UNIT__ u1640 [1926074,1926136) kind=expr len=131
cinematicSegmentSandstormAEnd['position']=[-0x14,-0x4,5.5],cinematicSegmentSandstormAEnd[stringDecoderAlias(0xf5f)]=[0xe,-0x6,5.5];
// __UNIT__ u1641 [1926136,1926146) kind=var len=34
var cinematicSegmentSandstormA={};
// __UNIT__ u1642 [1926146,1926199) kind=expr len=211
cinematicSegmentSandstormA[stringDecoderAlias(0x9a6)]=cinematicSegmentSandstormAStart,cinematicSegmentSandstormA['end']=cinematicSegmentSandstormAEnd,cinematicSegmentSandstormA[stringDecoderAlias(0x35c)]=0x3a98;
// __UNIT__ u1643 [1926199,1926209) kind=var len=27
var sandstormMapConfigA={};
// __UNIT__ u1645 [1926707,1926717) kind=var len=23
var mapSpawnPoint07={};
// __UNIT__ u1646 [1926717,1926827) kind=expr len=175
mapSpawnPoint07['x']=-31.600000381469727,mapSpawnPoint07['y']=10.600000381469727,mapSpawnPoint07['z']=-60.20000076293945,mapSpawnPoint07['rx']=0x3e,mapSpawnPoint07['ry']=0xc1;
// __UNIT__ u1647 [1926827,1926837) kind=var len=23
var middaySkyPreset={};
// __UNIT__ u1649 [1926955,1926965) kind=var len=30
var cinematicWaypointStart={};
// __UNIT__ u1650 [1926965,1927031) kind=expr len=106
cinematicWaypointStart['position']=[-0x22,0xc,-0x3c],cinematicWaypointStart['JoIkrtRxhZ']=[0xe,0xa,-0x3c];
// __UNIT__ u1651 [1927031,1927041) kind=var len=37
var cinematicSegmentSandstormBEnd={};
// __UNIT__ u1652 [1927041,1927105) kind=expr len=148
cinematicSegmentSandstormBEnd[stringDecoderAlias(0x215)]=[-0x14,0xc,-0x3c],cinematicSegmentSandstormBEnd[stringDecoderAlias(0xf5f)]=[0xe,0xa,-0x3c];
// __UNIT__ u1653 [1927105,1927115) kind=var len=34
var cinematicSegmentSandstormB={};
// __UNIT__ u1654 [1927115,1927168) kind=expr len=202
cinematicSegmentSandstormB[stringDecoderAlias(0x9a6)]=cinematicWaypointStart,cinematicSegmentSandstormB['end']=cinematicSegmentSandstormBEnd,cinematicSegmentSandstormB[stringDecoderAlias(0x35c)]=0x3a98;
// __UNIT__ u1655 [1927168,1927178) kind=var len=27
var sandstormMapConfigB={};
// __UNIT__ u1657 [1927669,1927679) kind=var len=26
var labSunsetSkyPreset={};
// __UNIT__ u1659 [1927785,1927795) kind=var len=28
var labDaylightSkyPreset={};
// __UNIT__ u1661 [1927895,1927905) kind=var len=23
var mapSpawnPoint08={};
// __UNIT__ u1662 [1927905,1928000) kind=expr len=160
mapSpawnPoint08['x']=48.900001525878906,mapSpawnPoint08['y']=4.599999904632568,mapSpawnPoint08['z']=-0x16,mapSpawnPoint08['rx']=0x3c,mapSpawnPoint08['ry']=0xfe;
// __UNIT__ u1663 [1928000,1928010) kind=var len=23
var mapSpawnPoint09={};
// __UNIT__ u1664 [1928010,1928103) kind=expr len=158
mapSpawnPoint09['x']=0x37,mapSpawnPoint09['y']=4.599999904632568,mapSpawnPoint09['z']=4.599999904632568,mapSpawnPoint09['rx']=0x3f,mapSpawnPoint09['ry']=0xfd;
// __UNIT__ u1665 [1928103,1928113) kind=var len=23
var mapSpawnPoint10={};
// __UNIT__ u1666 [1928113,1928205) kind=expr len=157
mapSpawnPoint10['x']=67.30000305175781,mapSpawnPoint10['y']=2.5,mapSpawnPoint10['z']=3.700000047683716,mapSpawnPoint10['rx']=0x3f,mapSpawnPoint10['ry']=0xc0;
// __UNIT__ u1667 [1928205,1928215) kind=var len=23
var mapSpawnPoint11={};
// __UNIT__ u1668 [1928215,1928309) kind=expr len=159
mapSpawnPoint11['x']=60.900001525878906,mapSpawnPoint11['y']=2.5,mapSpawnPoint11['z']=13.899999618530273,mapSpawnPoint11['rx']=0x3b,mapSpawnPoint11['ry']=0x7a;
// __UNIT__ u1669 [1928309,1928319) kind=var len=23
var mapSpawnPoint12={};
// __UNIT__ u1670 [1928319,1928415) kind=expr len=161
mapSpawnPoint12['x']=-10.5,mapSpawnPoint12['y']=4.599999904632568,mapSpawnPoint12['z']=0.10000000149011612,mapSpawnPoint12['rx']=0x3f,mapSpawnPoint12['ry']=0x90;
// __UNIT__ u1671 [1928415,1928425) kind=var len=23
var mapSpawnPoint13={};
// __UNIT__ u1672 [1928425,1928521) kind=expr len=161
mapSpawnPoint13['x']=-15.600000381469727,mapSpawnPoint13['y']=0x2,mapSpawnPoint13['z']=-1.7999999523162842,mapSpawnPoint13['rx']=0x3f,mapSpawnPoint13['ry']=0xf9;
// __UNIT__ u1673 [1928521,1928531) kind=var len=23
var mapSpawnPoint14={};
// __UNIT__ u1674 [1928531,1928641) kind=expr len=175
mapSpawnPoint14['x']=3.299999952316284,mapSpawnPoint14['y']=-0.4000000059604645,mapSpawnPoint14['z']=-16.600000381469727,mapSpawnPoint14['rx']=0x3f,mapSpawnPoint14['ry']=0x3f;
// __UNIT__ u1675 [1928641,1928651) kind=var len=23
var mapSpawnPoint15={};
// __UNIT__ u1676 [1928651,1928747) kind=expr len=161
mapSpawnPoint15['x']=-22.399999618530273,mapSpawnPoint15['y']=0.800000011920929,mapSpawnPoint15['z']=-0x28,mapSpawnPoint15['rx']=0x3d,mapSpawnPoint15['ry']=0x8b;
// __UNIT__ u1677 [1928747,1928757) kind=var len=23
var mapSpawnPoint16={};
// __UNIT__ u1678 [1928757,1928866) kind=expr len=174
mapSpawnPoint16['x']=17.299999237060547,mapSpawnPoint16['y']=4.400000095367432,mapSpawnPoint16['z']=-30.299999237060547,mapSpawnPoint16['rx']=0x3c,mapSpawnPoint16['ry']=0x2e;
// __UNIT__ u1679 [1928866,1928876) kind=var len=23
var mapSpawnPoint17={};
// __UNIT__ u1680 [1928876,1928983) kind=expr len=172
mapSpawnPoint17['x']=53.599998474121094,mapSpawnPoint17['y']=7.199999809265137,mapSpawnPoint17['z']=7.699999809265137,mapSpawnPoint17['rx']=0x3f,mapSpawnPoint17['ry']=0x6d;
// __UNIT__ u1681 [1928983,1928993) kind=var len=20
var forestPointA={};
// __UNIT__ u1682 [1928993,1929073) kind=expr len=110
forestPointA['x']=52.32250778047478,forestPointA['y']=3.136899948120117,forestPointA['z']=-14.894120319555839;
// __UNIT__ u1683 [1929073,1929083) kind=var len=20
var forestPointB={};
// __UNIT__ u1684 [1929083,1929163) kind=expr len=110
forestPointB['x']=1.255060929444502,forestPointB['y']=3.334099769592285,forestPointB['z']=-13.073578303904029;
// __UNIT__ u1685 [1929163,1929173) kind=var len=21
var mapNavPointEA={};
// __UNIT__ u1686 [1929173,1929254) kind=expr len=114
mapNavPointEA['x']=-6.294223514073776,mapNavPointEA['y']=3.0340886637368776,mapNavPointEA['z']=10.997057424966606;
// __UNIT__ u1687 [1929254,1929264) kind=var len=21
var mapNavPointEB={};
// __UNIT__ u1688 [1929264,1929342) kind=expr len=111
mapNavPointEB['x']=59.61523158773343,mapNavPointEB['y']=0.989799976348877,mapNavPointEB['z']=18.04071814447252;
// __UNIT__ u1689 [1929342,1929352) kind=var len=21
var mapNavPointEC={};
// __UNIT__ u1690 [1929352,1929433) kind=expr len=114
mapNavPointEC['x']=40.24166488647461,mapNavPointEC['y']=2.5750612571336067,mapNavPointEC['z']=-28.542022705078125;
// __UNIT__ u1691 [1929433,1929443) kind=var len=27
var waterSmokeEmitterEd={};
// __UNIT__ u1692 [1929443,1929601) kind=expr len=290
waterSmokeEmitterEd['type']='waterSmoke',waterSmokeEmitterEd[stringDecoderAlias(0x2c1)]=0x2,waterSmokeEmitterEd['scaleRange']=[2.5,3.5],waterSmokeEmitterEd['position']=[-0x28,-0x3,-0x26],waterSmokeEmitterEd['vary']=[0xa,0x0,0x3],waterSmokeEmitterEd[stringDecoderAlias(0x48b)]=[0x0,0.5,0.3];
// __UNIT__ u1693 [1929601,1929611) kind=var len=32
var labWaterfallAudioEmitter={};
// __UNIT__ u1694 [1929611,1929709) kind=expr len=201
labWaterfallAudioEmitter[stringDecoderAlias(0x4c2)]=!![],labWaterfallAudioEmitter['position']=[-0x28,-0xa,-0x26],labWaterfallAudioEmitter['volume']=1.2,labWaterfallAudioEmitter['file']='waterfall.mp3';
// __UNIT__ u1695 [1929709,1929719) kind=var len=29
var labForestAudioEmitter={};
// __UNIT__ u1696 [1929719,1929815) kind=expr len=172
labForestAudioEmitter['directional']=!![],labForestAudioEmitter['position']=[0x21,0x19,-3.5],labForestAudioEmitter['volume']=1.7,labForestAudioEmitter['file']='forest.mp3';
// __UNIT__ u1697 [1929815,1929825) kind=var len=24
var cameraWaypointEg={};
// __UNIT__ u1698 [1929825,1929885) kind=expr len=118
cameraWaypointEg[stringDecoderAlias(0x215)]=[44.5,5.5,3.5],cameraWaypointEg[stringDecoderAlias(0xf5f)]=[-3.5,0x5,4.8];
// __UNIT__ u1699 [1929885,1929895) kind=var len=24
var cameraWaypointEh={};
// __UNIT__ u1700 [1929895,1929955) kind=expr len=118
cameraWaypointEh[stringDecoderAlias(0x215)]=[0x1c,0x5,0x3],cameraWaypointEh[stringDecoderAlias(0xf5f)]=[-3.5,0x5,4.8];
// __UNIT__ u1701 [1929955,1929965) kind=var len=26
var cinematicSegmentEI={};
// __UNIT__ u1702 [1929965,1930019) kind=expr len=160
cinematicSegmentEI[stringDecoderAlias(0x9a6)]=cameraWaypointEg,cinematicSegmentEI[stringDecoderAlias(0x8f7)]=cameraWaypointEh,cinematicSegmentEI['time']=0x3a98;
// __UNIT__ u1703 [1930019,1930029) kind=var len=24
var cameraWaypointEj={};
// __UNIT__ u1704 [1930029,1930094) kind=expr len=108
cameraWaypointEj['position']=[-0xc,0.4,-0x13],cameraWaypointEj[stringDecoderAlias(0xf5f)]=[-0x28,0x5,-0x26];
// __UNIT__ u1705 [1930094,1930104) kind=var len=29
var cinematicSegmentELEnd={};
// __UNIT__ u1706 [1930104,1930172) kind=expr len=106
cinematicSegmentELEnd['position']=[-0x16,0.5,-0x15],cinematicSegmentELEnd['JoIkrtRxhZ']=[-0x28,0x5,-0x26];
// __UNIT__ u1707 [1930172,1930182) kind=var len=26
var cinematicSegmentEL={};
// __UNIT__ u1708 [1930182,1930235) kind=expr len=164
cinematicSegmentEL[stringDecoderAlias(0x9a6)]=cameraWaypointEj,cinematicSegmentEL['end']=cinematicSegmentELEnd,cinematicSegmentEL[stringDecoderAlias(0x35c)]=0x2ee0;
// __UNIT__ u1710 [2005701,2005859) kind=expr len=299
perfCounterMap['shootingA']=0x0,perfCounterMap['shootingB']=0x0,perfCounterMap[stringDecoderAlias(0xd54)]=0x0,perfCounterMap['simulate']=0x0,perfCounterMap['simulateA']=0x0,perfCounterMap[stringDecoderAlias(0x5d7)]=0x0,perfCounterMap[stringDecoderAlias(0x225)]=0x0,perfCounterMap['updateLobby']=0x0;
// __UNIT__ u1717 [2006863,2007002) kind=var len=349
var respawnDelayMs=0x9c4,moveDirectionSin=0x0,moveDirectionCos=0x0,renderHeightPx=0x5a0,diagonalMoveFactor=Math['sqrt'](0x2)/0x2,prevGamePlaying=!![],gamePlaying=!![],showDebugMarker=![],prerendersDisabled=![],occlusionDebugFlag=![],isMobilePhone=![],isTouchDevice=![],isIPad=![],cameraNearPlane=0.1,crazyGamesGame,crazyGamesBanner,isCrazyGames=![];
// __UNIT__ u1719 [2007333,2007852) kind=var len=558
var ignoreNextTouch=![],forceAimTouch=![],pelletSpreadTable=[0.07500949505484174,0.2742310167635935,0.5095642211425883,0.0755562782639434,0.880903751068238,0.22882640372441448,0.850836187997291,0.015487909324228721,0.0445111058859672,0.8941071186652906,0.6507282260110268,0.420593261914604,0.25092124950649275,0.995929718481344,0.7809543613255743,0.9707107548465537,0.9598217014967565,0.5902976992494882,0.9069080357006323,0.7426300052286265,0.7826137546368939,0.7863502506103135,0.0539798736823629,0.5039291682205764,0.27263009560882584,0.6100577118853376];
// __UNIT__ u1720 [2007852,2008351) kind=if len=774
if(!pZ){var isMac=navigator['platform']['toUpperCase']()[stringDecoderAlias(0xfad)]('MAC')!=-0x1,isIPhone=navigator['platform']['toUpperCase']()['indexOf']('IPHONE')!=-0x1,isFirefox=navigator[stringDecoderAlias(0xec9)]['indexOf'](stringDecoderAlias(0x64f))!=-0x1,isChrome=navigator[stringDecoderAlias(0xec9)]['indexOf']('Chrome')!=-0x1,isSafari=!isChrome&&navigator['userAgent'][stringDecoderAlias(0xfad)]('Safari')!=-0x1,fullscreenEnabled=window['location']==window['par'+'ent']['location']&&!isMac&&!isFirefox&&isChrome;if(location[stringDecoderAlias(0xeee)]!==stringDecoderAlias(0x980)){}var checkShaderErrorsEnabled=![],powerPreference='default';isIPhone&&(powerPreference='low-power');powerPreference=stringDecoderAlias(0x500);var unadjustedMovement=![],toggleAds=![];}
// __UNIT__ u1721 [2008351,2008369) kind=var len=52
var pointerUnlockExpected=![],leftHandedEnabled=![];
// __UNIT__ u1723 [2008621,2008704) kind=var len=111
var typeNameList=['Uint8','Int8','Uint16','Int16','Float32','Uint32','Float64'],frameDeltaSamples=[],nowMs=0x0;
// __UNIT__ u1724 [2008704,2008736) kind=function len=39
function litegl(){nowMs=Date['now']();}
// __UNIT__ u1725 [2008736,2008892) kind=function len=263
function sampleFrameDelta(){var apV=stringDecoderAlias;frameDeltaSamples['push'](Date[apV(0x1c2)]()-nowMs);if(frameDeltaSamples['length']>0x64){var a3i=0x0;for(var a3j=0x0;a3j<frameDeltaSamples['length'];a3j++){a3i+=frameDeltaSamples[a3j];}frameDeltaSamples=[];}}
// __UNIT__ u1726 [2008892,2008902) kind=var len=24
var debugPositionLog=[];
// __UNIT__ u1727 [2008902,2008917) kind=function len=29
function logDebugPosition(){}
// __UNIT__ u1728 [2008917,2008980) kind=function len=105
function dumpPositionLog(){var apW=stringDecoderAlias;console['log'](JSON[apW(0xc6)](debugPositionLog));}
// __UNIT__ u1729 [2008980,2009176) kind=function len=245
function seededRandom(initialSeed){var apX=stringDecoderAlias;this['m']=0x80000000,this['mi']=0x1/(this['m']-0x1),this['a']=0x41c64e6d,this['c']=0x3039,this[apX(0xfb1)]=initialSeed?initialSeed:Math[apX(0x5ce)](Math['random']()*(this['m']-0x1));}
// __UNIT__ u1730 [2009176,2009531) kind=expr len=435
seededRandom['prototype'][stringDecoderAlias(0x5b2)]=function(){var apY=stringDecoderAlias;return this['state']=(this['a']*this[apY(0xfb1)]+this['c'])%this['m'],this['state'];},seededRandom['prototype']['nextFloat']=function(){var apZ=stringDecoderAlias;return this[apZ(0x5b2)]()*this['mi'];},Math[stringDecoderAlias(0xb00)]=Math['KkKRLGFtA']||function(a3i){return function(a3j){return a3i[0x0]=a3j,a3i[0x0];};}(new Float32Array(0x1));
// __UNIT__ u1732 [2010844,2011010) kind=function len=253
function resetObjectTransform(targetObject){var aq7=stringDecoderAlias;targetObject['rotation']['x']=targetObject['rotation']['y']=targetObject['rotation']['z']=0x0,targetObject['position']['CNFryyAhIm'](0x0),targetObject[aq7(0xd6)]['CNFryyAhIm'](0x1);}
// __UNIT__ u1733 [2011010,2011071) kind=function len=102
function horizontalLengthSq(position){return position['x']*position['x']+position['z']*position['z'];}
// __UNIT__ u1743 [2015748,2015958) kind=function len=215
function collectSceneGeometries(scene){var geos=[];for(var i=0;i<scene.children.length;i++){var child=scene.children[i];if(child!==undefined&&child.RNQDluasaN!==undefined){geos.push(child.RNQDluasaN);}}return geos;}
// __UNIT__ u1746 [2017050,2017077) kind=var len=27
var faceBufferLength=3*6+5;
// __UNIT__ u1748 [2018217,2018234) kind=var len=29
var faceVertexKeys=['b','c'];
// __UNIT__ u1752 [2018359,2018381) kind=var len=23
var faceNormalOffset=0;
// __UNIT__ u1753 [2018381,2018398) kind=var len=24
var faceVertexAOffset=3;
// __UNIT__ u1754 [2018398,2018415) kind=var len=24
var faceVertexBOffset=6;
// __UNIT__ u1755 [2018415,2018432) kind=var len=24
var faceVertexCOffset=9;
// __UNIT__ u1756 [2018432,2018455) kind=var len=28
var faceHitboxFlagOffset=12;
// __UNIT__ u1757 [2018455,2018477) kind=var len=27
var faceAddedFlagOffset=13;
// __UNIT__ u1758 [2018477,2018503) kind=var len=31
var faceCollisionFlagOffset=14;
// __UNIT__ u1759 [2018503,2018523) kind=var len=25
var faceAabbMaxOffset=15;
// __UNIT__ u1760 [2018523,2018543) kind=var len=25
var faceAabbMinOffset=18;
// __UNIT__ u1761 [2018543,2018564) kind=var len=22
var faceDvalOffset=21;
// __UNIT__ u1762 [2018564,2018586) kind=var len=23
var faceSoundOffset=22;
// __UNIT__ u1763 [2018586,2019970) kind=function len=1557
function buildFaceAabb(face,verts,faceBuffer,index){'use strict';face.aa=verts[face.a];face.ab=verts[face.b];face.ac=verts[face.c];face.aabb.min.copy(verts[face.a]);face.aabb.max.copy(verts[face.a]);index*=faceBufferLength;faceBuffer[index+faceHitboxFlagOffset]=face.hitbox?1:0;triEdgeVectorB.bLuhQxfFGDS(face.ab,face.aa);triangleEdgeVectorC.bLuhQxfFGDS(face.ac,face.aa);faceNormalScratch.UZFffGBjyhk(triEdgeVectorB,triangleEdgeVectorC);faceNormalScratch.normalize();faceNormalScratch.toArray(faceBuffer,index+faceNormalOffset);var n=faceNormalScratch;face.dVal=-(n.x*face.aa.x+n.y*face.aa.y+n.z*face.aa.z);faceBuffer[index+faceDvalOffset]=face.dVal;face.aa.toArray(faceBuffer,index+faceVertexAOffset);face.ab.toArray(faceBuffer,index+faceVertexBOffset);face.ac.toArray(faceBuffer,index+faceVertexCOffset);faceBuffer[index+faceAddedFlagOffset]=0;if(face.collision==undefined){faceBuffer[index+faceCollisionFlagOffset]=1;}else{faceBuffer[index+faceCollisionFlagOffset]=face.collision;}faceBuffer[index+faceSoundOffset]=face.UVCeyZNLZ||0;for(var a=0;a<faceVertexKeys.length;a++){var x=faceVertexKeys[a];for(var b=0;b<axisNames.length;b++){var y=axisNames[b];if(verts[face[x]][y]<face.aabb.min[y]){face.aabb.min[y]=verts[face[x]][y];}if(verts[face[x]][y]>face.aabb.max[y]){face.aabb.max[y]=verts[face[x]][y];}}}face.aabb.max.toArray(faceBuffer,index+faceAabbMaxOffset);face.aabb.min.toArray(faceBuffer,index+faceAabbMinOffset);var useAABBthreshold=0.1;axisNames.forEach(function(a){if(face.aabb.max[a]-face.aabb.min[a]<useAABBthreshold){face.useAABB=true;}});}
// __UNIT__ u1767 [2020151,2020161) kind=var len=22
var smgBloomTuning={};
// __UNIT__ u1769 [2020289,2020309) kind=var len=84
var bloomTuningAlias=smgBloomTuning,bloomTuningKeys=getObjectKeys(bloomTuningAlias);
// __UNIT__ u1770 [2020309,2020395) kind=for len=206
for(var loopIndex=0x0;loopIndex<bloomTuningKeys[stringDecoderAlias(0x3a2)];loopIndex++){var H6=bloomTuningKeys[loopIndex];bloomTuningAlias[oldKey]=Math[stringDecoderAlias(0xb00)](bloomTuningAlias[oldKey]);}
// __UNIT__ u1771 [2020395,2020405) kind=var len=18
var smgUiStats={};
// __UNIT__ u1772 [2020405,2020428) kind=expr len=46
smgUiStats[stringDecoderAlias(0xbf1)]='Close';
// __UNIT__ u1773 [2020428,2020438) kind=var len=25
var smgKillfeedConfig={};
// __UNIT__ u1774 [2020438,2020470) kind=expr len=62
smgKillfeedConfig['size']=1.1,smgKillfeedConfig['offset']=0x8;
// __UNIT__ u1775 [2020470,2020480) kind=var len=25
var smgWeaponUiConfig={};
// __UNIT__ u1776 [2020480,2020573) kind=expr len=236
smgWeaponUiConfig['name']='SMG',smgWeaponUiConfig[stringDecoderAlias(0x377)]=0x5,smgWeaponUiConfig[stringDecoderAlias(0xe8c)]=1.7,smgWeaponUiConfig['DMZbIHLgyk']=smgUiStats,smgWeaponUiConfig[stringDecoderAlias(0x2f6)]=smgKillfeedConfig;
// __UNIT__ u1777 [2020573,2020583) kind=var len=23
var smgSpreadTuning={};
// __UNIT__ u1779 [2020750,2020760) kind=var len=23
var smgWeaponConfig={};
// __UNIT__ u1781 [2021217,2021227) kind=var len=17
var arUiStats={};
// __UNIT__ u1782 [2021227,2021253) kind=expr len=63
arUiStats[stringDecoderAlias(0xbf1)]=stringDecoderAlias(0x460);
// __UNIT__ u1783 [2021253,2021263) kind=var len=24
var arKillfeedConfig={};
// __UNIT__ u1784 [2021263,2021298) kind=expr len=78
arKillfeedConfig['size']=1.05,arKillfeedConfig[stringDecoderAlias(0x377)]=0x3;
// __UNIT__ u1785 [2021298,2021308) kind=var len=24
var arWeaponUiConfig={};
// __UNIT__ u1786 [2021308,2021383) kind=expr len=182
arWeaponUiConfig['name']=stringDecoderAlias(0x4e7),arWeaponUiConfig['size']=1.5,arWeaponUiConfig['DMZbIHLgyk']=arUiStats,arWeaponUiConfig[stringDecoderAlias(0x2f6)]=arKillfeedConfig;
// __UNIT__ u1787 [2021383,2021393) kind=var len=22
var arSpreadTuning={};
// __UNIT__ u1788 [2021393,2021557) kind=expr len=335
arSpreadTuning["A8a6k73WsA2"]=1.75,arSpreadTuning[stringDecoderAlias(0x92d)]=1.25,arSpreadTuning[stringDecoderAlias(0xb88)]=0.95,arSpreadTuning[stringDecoderAlias(0x36c)]=0.5,arSpreadTuning["XQ9Y5sC5x"]=0.02,arSpreadTuning[stringDecoderAlias(0x994)]=0.015,arSpreadTuning[stringDecoderAlias(0x943)]=0.6,arSpreadTuning["W91ldgW19d"]=0.5;
// __UNIT__ u1789 [2021557,2021567) kind=var len=22
var arWeaponConfig={};
// __UNIT__ u1790 [2021567,2022028) kind=expr len=886
arWeaponConfig['ui']=arWeaponUiConfig,arWeaponConfig['KnpNRhnMD']=3.2,arWeaponConfig[stringDecoderAlias(0xf68)]=0x1,arWeaponConfig[stringDecoderAlias(0xe11)]=0.6,arWeaponConfig['EZDFHAjrW']=0x1,arWeaponConfig[stringDecoderAlias(0x2c0)]=0x1e,arWeaponConfig['oCYaTYzkTP']=0x33,arWeaponConfig['TgNAHabmu']=0xb,arWeaponConfig['Cryjoaozcvi']=3.55,arWeaponConfig['distanceEffect']=0x0,arWeaponConfig['distanceMinimum']=0x1,arWeaponConfig['SOtVnhHOG']=1.6*0.75,arWeaponConfig[stringDecoderAlias(0xdba)]=0x2,arWeaponConfig['OGYwpLBdL']=2.6,arWeaponConfig[stringDecoderAlias(0x81a)]=0.94,arWeaponConfig['bloomRecoil']=0.02,arWeaponConfig['shotBloom']=0.02,arWeaponConfig[stringDecoderAlias(0x997)]=stringDecoderAlias(0x340),arWeaponConfig['QuvgZimFkef']=0x64,arWeaponConfig['bloomSpeed']=0.6,arWeaponConfig[stringDecoderAlias(0x8bc)]=2.5,arWeaponConfig[stringDecoderAlias(0x752)]=arSpreadTuning;
// __UNIT__ u1791 [2022028,2022038) kind=var len=18
var awpUiStats={};
// __UNIT__ u1792 [2022038,2022060) kind=expr len=45
awpUiStats[stringDecoderAlias(0xbf1)]='Long';
// __UNIT__ u1793 [2022060,2022070) kind=var len=25
var awpKillfeedLayout={};
// __UNIT__ u1794 [2022070,2022103) kind=expr len=63
awpKillfeedLayout['size']=0.9,awpKillfeedLayout['offset']=-0x6;
// __UNIT__ u1795 [2022103,2022113) kind=var len=25
var awpWeaponUiConfig={};
// __UNIT__ u1797 [2022193,2022203) kind=var len=23
var awpSpreadTuning={};
// __UNIT__ u1798 [2022203,2022365) kind=expr len=296
awpSpreadTuning["A8a6k73WsA2"]=2.5,awpSpreadTuning[stringDecoderAlias(0x92d)]=1.5,awpSpreadTuning['still']=1.5,awpSpreadTuning["j0EB3IT4Ug"]=0.8,awpSpreadTuning["XQ9Y5sC5x"]=0x0,awpSpreadTuning[stringDecoderAlias(0x994)]=0x0,awpSpreadTuning['crouchWalking']=1.2,awpSpreadTuning["W91ldgW19d"]=0x1;
// __UNIT__ u1799 [2022365,2022375) kind=var len=23
var awpWeaponConfig={};
// __UNIT__ u1801 [2022762,2022772) kind=var len=22
var shotgunUiStats={};
// __UNIT__ u1802 [2022772,2022795) kind=expr len=50
shotgunUiStats[stringDecoderAlias(0xbf1)]='Close';
// __UNIT__ u1803 [2022795,2022805) kind=var len=29
var shotgunKillfeedLayout={};
// __UNIT__ u1804 [2022805,2022837) kind=expr len=70
shotgunKillfeedLayout['size']=0x1,shotgunKillfeedLayout['offset']=0x3;
// __UNIT__ u1805 [2022837,2022847) kind=var len=29
var shotgunWeaponUiConfig={};
// __UNIT__ u1807 [2022925,2022935) kind=var len=27
var shotgunSpreadTuning={};
// __UNIT__ u1809 [2023102,2023112) kind=var len=27
var shotgunWeaponConfig={};
// __UNIT__ u1811 [2023572,2023582) kind=var len=24
var weaponStatsByKey={};
// __UNIT__ u1812 [2023582,2023643) kind=expr len=202
weaponStatsByKey['smg']=smgWeaponConfig,weaponStatsByKey['ar']=arWeaponConfig,weaponStatsByKey[stringDecoderAlias(0xfd3)]=awpWeaponConfig,weaponStatsByKey[stringDecoderAlias(0x2ba)]=shotgunWeaponConfig;
// __UNIT__ u1820 [2024924,2024964) kind=var len=119
var activeTweenList=new createCustomList(),activeShakeList=new createCustomList(),freeTweenPool=new createCustomList();
// __UNIT__ u1821 [2024964,2025014) kind=function len=95
function recycleTween(pooledEntry){pooledEntry['obj']=null,freeTweenPool['push'](pooledEntry);}
// __UNIT__ u1825 [2025727,2025832) kind=function len=197
function cancelAllTweens(){for(var queueIdx=0x0;queueIdx<activeTweenList['length'];queueIdx++){recycleTween(activeTweenList['array'][queueIdx]),activeTweenList['splice'](queueIdx,0x1),queueIdx--;}}
// __UNIT__ u1831 [2026772,2026956) kind=function len=221
function recoilDecayCurveOverride(a3i){var aqj=stringDecoderAlias;a3i*=Math['KkKRLGFtA'](2.46),a3i-=Math[aqj(0xb00)](1.633);var a3j=Math[aqj(0xb00)]((a3i*a3i*a3i-0x2*a3i+0x2-Math['KkKRLGFtA'](0.228)*0x4)/0x2);return a3j;}
// __UNIT__ u1832 [2026956,2027090) kind=function len=219
function recoilDecayCurve(easingInput){var aqk=stringDecoderAlias;easingInput*=0x3,easingInput-=0x2;var a3j=(easingInput*easingInput*easingInput-0x3*easingInput+0x2)*Math[aqk(0xb00)](0.25);return Math[aqk(0xb00)](a3j);}
// __UNIT__ u1833 [2027090,2027096) kind=expr len=42
recoilDecayCurve=recoilDecayCurveOverride;
// __UNIT__ u1835 [2027462,2027705) kind=function len=269
function makeAnimState(){var aqm=stringDecoderAlias,a3i={};return a3i[aqm(0xed8)]=![],a3i[aqm(0xff3)]=![],a3i['up']=![],a3i['down']=![],a3i[aqm(0x994)]=![],a3i["vQ5Ra371n0"]=![],a3i[aqm(0xe1f)]=![],a3i[aqm(0xa20)]=![],a3i["W91ldgW19d"]=![],a3i['name']='animstate',a3i;}
// __UNIT__ u1836 [2027705,2027852) kind=var len=209
var playerStateFlagKeys=['LgTIfDCCqp',"vQ5Ra371n0",stringDecoderAlias(0x392),'vjZBZwpDuuw','wrKTJhhJp',"W91ldgW19d",stringDecoderAlias(0x604),'hhUYpsfkFuA','GBKteThUrkj','wSWCRFIDs',stringDecoderAlias(0x54d)];
// __UNIT__ u1842 [2028508,2028592) kind=function len=119
function solveGameAuthChallenge(a3i){var aqp=stringDecoderAlias;return Math[aqp(0x5ce)]((a3i*0x2+0x178c4e)%0x1c9c380);}
// __UNIT__ u1843 [2028592,2028676) kind=function len=121
function solveMatchmakerChallenge(a3i){var aqq=stringDecoderAlias;return Math[aqq(0x5ce)]((a3i*0x3+0x11e1d1)%0x1c9c380);}
// __UNIT__ u1844 [2028676,2028774) kind=var len=210
var typeByteSizes=[0x1,0x1,0x2,0x2,0x4,0x4,0x8],uint8TypeCode=0x0,INT_ONE=0x1,INT_TWO=0x2,int16TypeCode=0x3,float32TypeCode=0x4,TYPE_UINT32=0x5,float64TypeCode=0x6,dataViewGetterNames=[],dataViewSetterNames=[];
// __UNIT__ u1845 [2028774,2028862) kind=for len=187
for(var loopIndex=0x0;loopIndex<typeNameList['length'];loopIndex++){dataViewGetterNames['push']('get'+typeNameList[loopIndex]),dataViewSetterNames['push']('set'+typeNameList[loopIndex]);}
// __UNIT__ u1846 [2028862,2028872) kind=var len=25
var messageTemplateIc={};
// __UNIT__ u1847 [2028872,2028925) kind=expr len=166
messageTemplateIc['val']=INT_TWO,messageTemplateIc['x']=uint8TypeCode,messageTemplateIc['y']=uint8TypeCode,messageTemplateIc[stringDecoderAlias(0x20b)]=uint8TypeCode;
// __UNIT__ u1848 [2028925,2028935) kind=var len=25
var messageTemplateId={};
// __UNIT__ u1850 [2029127,2029137) kind=var len=26
var selfAssignTemplate={};
// __UNIT__ u1851 [2029137,2029156) kind=expr len=46
selfAssignTemplate['tdkZouYda']=uint8TypeCode;
// __UNIT__ u1852 [2029156,2029166) kind=var len=26
var tickRateUpTemplate={};
// __UNIT__ u1853 [2029166,2029187) kind=expr len=48
tickRateUpTemplate['cKRwdjkqGai']=uint8TypeCode;
// __UNIT__ u1854 [2029187,2029197) kind=var len=28
var tickRateDownTemplate={};
// __UNIT__ u1855 [2029197,2029218) kind=expr len=50
tickRateDownTemplate['cKRwdjkqGai']=uint8TypeCode;
// __UNIT__ u1856 [2029218,2029228) kind=var len=29
var tickRateResetTemplate={};
// __UNIT__ u1857 [2029228,2029246) kind=expr len=63
tickRateResetTemplate[stringDecoderAlias(0x1d3)]=uint8TypeCode;
// __UNIT__ u1858 [2029246,2029256) kind=var len=25
var messageTemplateIi={};
// __UNIT__ u1859 [2029256,2029275) kind=expr len=45
messageTemplateIi['tdkZouYda']=uint8TypeCode;
// __UNIT__ u1860 [2029275,2029285) kind=var len=25
var messageTemplateIj={};
// __UNIT__ u1862 [2029418,2029428) kind=var len=25
var messageTemplateIk={};
// __UNIT__ u1864 [2029564,2029574) kind=var len=25
var messageTemplateIl={};
// __UNIT__ u1866 [2029631,2029641) kind=var len=24
var seedSyncTemplate={};
// __UNIT__ u1867 [2029641,2029659) kind=expr len=56
seedSyncTemplate[stringDecoderAlias(0xe24)]=TYPE_UINT32;
// __UNIT__ u1868 [2029659,2029669) kind=var len=22
var fieldTypeMapIn={};
// __UNIT__ u1870 [2029768,2029778) kind=var len=27
var snapshotAckTemplate={};
// __UNIT__ u1871 [2029778,2029796) kind=expr len=61
snapshotAckTemplate[stringDecoderAlias(0x3b2)]=uint8TypeCode;
// __UNIT__ u1872 [2029796,2029806) kind=var len=25
var cameraAimTemplate={};
// __UNIT__ u1873 [2029806,2029828) kind=expr len=74
cameraAimTemplate['x']=uint8TypeCode,cameraAimTemplate['y']=uint8TypeCode;
// __UNIT__ u1874 [2029828,2029838) kind=var len=25
var messageTemplateIq={};
// __UNIT__ u1875 [2029838,2030228) kind=expr len=1066
messageTemplateIq['loEhMkBVEme']=uint8TypeCode,messageTemplateIq['JoHdvmpcMvL']=float32TypeCode,messageTemplateIq[stringDecoderAlias(0x939)]=float32TypeCode,messageTemplateIq['yxEKoSFAg']=float32TypeCode,messageTemplateIq['zjSptXbZfA']=float32TypeCode,messageTemplateIq[stringDecoderAlias(0xe4b)]=float32TypeCode,messageTemplateIq['ULHoUFJiqo']=float32TypeCode,messageTemplateIq['BMflnUjRv']=float32TypeCode,messageTemplateIq['pTWaJQCQIlk']=float32TypeCode,messageTemplateIq['KUkUYkavzt']=float32TypeCode,messageTemplateIq['bdyycxmjR']=float32TypeCode,messageTemplateIq['gPEUHGwIpHk']=float32TypeCode,messageTemplateIq[stringDecoderAlias(0x306)]=float32TypeCode,messageTemplateIq['a']=uint8TypeCode,messageTemplateIq[stringDecoderAlias(0xd35)]=uint8TypeCode,messageTemplateIq['sc']=uint8TypeCode,messageTemplateIq['sd']=INT_TWO,messageTemplateIq['rt']=uint8TypeCode,messageTemplateIq['tog']=uint8TypeCode,messageTemplateIq['la']=float32TypeCode,messageTemplateIq['ja']=float32TypeCode,messageTemplateIq['sp']=float32TypeCode,messageTemplateIq['AUBAkIWQqEk']=INT_TWO;
// __UNIT__ u1876 [2030228,2030238) kind=var len=26
var matchTimerTemplate={};
// __UNIT__ u1877 [2030238,2030252) kind=expr len=35
matchTimerTemplate['time']=INT_TWO;
// __UNIT__ u1878 [2030252,2030262) kind=var len=21
var deathTemplate={};
// __UNIT__ u1879 [2030262,2030285) kind=expr len=67
deathTemplate['id']=uint8TypeCode,deathTemplate['h']=uint8TypeCode;
// __UNIT__ u1880 [2030285,2030295) kind=var len=27
var classSelectTemplate={};
// __UNIT__ u1881 [2030295,2030325) kind=expr len=86
classSelectTemplate['v']=uint8TypeCode,classSelectTemplate['eXABYtRfN']=uint8TypeCode;
// __UNIT__ u1882 [2030325,2030335) kind=var len=28
var playerWeaponTemplate={};
// __UNIT__ u1883 [2030335,2030361) kind=expr len=84
playerWeaponTemplate['id']=uint8TypeCode,playerWeaponTemplate['type']=uint8TypeCode;
// __UNIT__ u1884 [2030361,2030371) kind=var len=27
var killConfirmTemplate={};
// __UNIT__ u1885 [2030371,2030447) kind=expr len=212
killConfirmTemplate[stringDecoderAlias(0x197)]=uint8TypeCode,killConfirmTemplate['ldBboSufaY']=uint8TypeCode,killConfirmTemplate['fRcMMMfSas']=uint8TypeCode,killConfirmTemplate[stringDecoderAlias(0x837)]=INT_TWO;
// __UNIT__ u1886 [2030447,2030457) kind=var len=25
var messageTemplateIw={};
// __UNIT__ u1887 [2030457,2030647) kind=expr len=570
messageTemplateIw['id']=uint8TypeCode,messageTemplateIw[stringDecoderAlias(0x9a7)]=INT_TWO,messageTemplateIw['k']=uint8TypeCode,messageTemplateIw['d']=uint8TypeCode,messageTemplateIw['h']=uint8TypeCode,messageTemplateIw['p']=INT_TWO,messageTemplateIw['c']=INT_TWO,messageTemplateIw[stringDecoderAlias(0xc31)]=uint8TypeCode,messageTemplateIw[stringDecoderAlias(0x368)]=uint8TypeCode,messageTemplateIw['ha']=uint8TypeCode,messageTemplateIw[stringDecoderAlias(0x4fe)]=uint8TypeCode,messageTemplateIw['TxJblhJNah']=uint8TypeCode,messageTemplateIw['aMWaisFtZ']=uint8TypeCode;
// __UNIT__ u1888 [2030647,2030657) kind=var len=29
var killfeedEntryTemplate={};
// __UNIT__ u1889 [2030657,2030734) kind=expr len=212
killfeedEntryTemplate['WJxrwBXgp']=uint8TypeCode,killfeedEntryTemplate['cRzBBcbLPR']=uint8TypeCode,killfeedEntryTemplate[stringDecoderAlias(0x4d8)]=uint8TypeCode,killfeedEntryTemplate['KiQwnWACHo']=uint8TypeCode;
// __UNIT__ u1890 [2030734,2030744) kind=var len=25
var messageTemplateIy={};
// __UNIT__ u1891 [2030744,2030782) kind=expr len=105
messageTemplateIy['rjVasvUkpY']=uint8TypeCode,messageTemplateIy[stringDecoderAlias(0x614)]=uint8TypeCode;
// __UNIT__ u1892 [2030782,2030792) kind=var len=32
var leaderboardEntryTemplate={};
// __UNIT__ u1893 [2030792,2030892) kind=expr len=337
leaderboardEntryTemplate['id']=uint8TypeCode,leaderboardEntryTemplate[stringDecoderAlias(0x121)]=uint8TypeCode,leaderboardEntryTemplate[stringDecoderAlias(0x9a7)]=INT_TWO,leaderboardEntryTemplate[stringDecoderAlias(0x532)]=uint8TypeCode,leaderboardEntryTemplate['qKOctHozRiE']=uint8TypeCode,leaderboardEntryTemplate['hsp']=uint8TypeCode;
// __UNIT__ u1894 [2030892,2030902) kind=var len=25
var messageTemplateIa={};
// __UNIT__ u1895 [2030902,2031054) kind=expr len=380
messageTemplateIa['val']=TYPE_UINT32,messageTemplateIa['lpm']=INT_ONE,messageTemplateIa[stringDecoderAlias(0xd00)]=INT_ONE,messageTemplateIa['pmap']=INT_ONE,messageTemplateIa[stringDecoderAlias(0x311)]=INT_ONE,messageTemplateIa['PSPGZlgWAcZ']=INT_ONE,messageTemplateIa['YsgdCDVtFmu']=INT_ONE,messageTemplateIa[stringDecoderAlias(0x56b)]=TYPE_UINT32,messageTemplateIa['string']='';
// __UNIT__ u1896 [2031054,2031064) kind=var len=25
var messageTemplateIB={};
// __UNIT__ u1897 [2031064,2031105) kind=expr len=134
messageTemplateIB['id']=uint8TypeCode,messageTemplateIB['h']=uint8TypeCode,messageTemplateIB[stringDecoderAlias(0xc9e)]=uint8TypeCode;
// __UNIT__ u1898 [2031105,2031115) kind=var len=24
var gameModeTemplate={};
// __UNIT__ u1899 [2031115,2031126) kind=expr len=36
gameModeTemplate['h']=uint8TypeCode;
// __UNIT__ u1900 [2031126,2031136) kind=var len=25
var changeMapTemplate={};
// __UNIT__ u1901 [2031136,2031159) kind=expr len=75
changeMapTemplate['h']=uint8TypeCode,changeMapTemplate['lm']=uint8TypeCode;
// __UNIT__ u1902 [2031159,2031169) kind=var len=28
var statusEffectTemplate={};
// __UNIT__ u1903 [2031169,2031192) kind=expr len=75
statusEffectTemplate['ef']=INT_ONE,statusEffectTemplate['t']=uint8TypeCode;
// __UNIT__ u1904 [2031192,2031202) kind=var len=24
var itemListTemplate={};
// __UNIT__ u1905 [2031202,2031218) kind=expr len=30
itemListTemplate['string']='';
// __UNIT__ u1906 [2031218,2031228) kind=var len=25
var messageTemplateIG={};
// __UNIT__ u1907 [2031228,2031276) kind=expr len=156
messageTemplateIG['id']=uint8TypeCode,messageTemplateIG[stringDecoderAlias(0x4cd)]=uint8TypeCode,messageTemplateIG[stringDecoderAlias(0x411)]=uint8TypeCode;
// __UNIT__ u1908 [2031276,2031286) kind=var len=29
var authChallengeTemplate={};
// __UNIT__ u1909 [2031286,2031299) kind=expr len=41
authChallengeTemplate['val']=TYPE_UINT32;
// __UNIT__ u1910 [2031299,2031309) kind=var len=32
var killConfirmToastTemplate={};
// __UNIT__ u1911 [2031309,2031320) kind=expr len=44
killConfirmToastTemplate['t']=uint8TypeCode;
// __UNIT__ u1912 [2031320,2031330) kind=var len=20
var chatTemplate={};
// __UNIT__ u1913 [2031330,2031358) kind=expr len=53
chatTemplate['id']=INT_ONE,chatTemplate['string']='';
// __UNIT__ u1914 [2031358,2031368) kind=var len=26
var teamScoresTemplate={};
// __UNIT__ u1915 [2031368,2031390) kind=expr len=64
teamScoresTemplate['a']=INT_TWO,teamScoresTemplate['b']=INT_TWO;
// __UNIT__ u1916 [2031390,2031400) kind=var len=25
var messageTemplateIL={};
// __UNIT__ u1917 [2031400,2031442) kind=expr len=111
messageTemplateIL['id']=uint8TypeCode,messageTemplateIL['rank']=float32TypeCode,messageTemplateIL['string']='';
// __UNIT__ u1918 [2031442,2031452) kind=var len=29
var playerLoadoutTemplate={};
// __UNIT__ u1919 [2031452,2031482) kind=expr len=94
playerLoadoutTemplate['id']=uint8TypeCode,playerLoadoutTemplate[stringDecoderAlias(0x9ce)]='';
// __UNIT__ u1920 [2031482,2031492) kind=var len=25
var messageTemplateIn={};
// __UNIT__ u1921 [2031492,2031572) kind=expr len=166
messageTemplateIn['xJXXoGTVwzq']=INT_ONE,messageTemplateIn['CwlkAKnpe']=INT_ONE,messageTemplateIn['JPLyTVkUrDj']=INT_ONE,messageTemplateIn['ciJOoINuc']=uint8TypeCode;
// __UNIT__ u1922 [2031572,2031582) kind=var len=25
var messageTemplateIo={};
// __UNIT__ u1924 [2031659,2031669) kind=var len=30
var objectiveTimerTemplate={};
// __UNIT__ u1925 [2031669,2031680) kind=expr len=42
objectiveTimerTemplate['t']=uint8TypeCode;
// __UNIT__ u1926 [2031680,2031690) kind=var len=25
var partyJoinTemplate={};
// __UNIT__ u1927 [2031690,2031717) kind=expr len=68
partyJoinTemplate['t']=uint8TypeCode,partyJoinTemplate['string']='';
// __UNIT__ u1928 [2031717,2031727) kind=var len=28
var serverMarkerTemplate={};
// __UNIT__ u1929 [2031727,2031745) kind=expr len=51
serverMarkerTemplate[stringDecoderAlias(0x9ce)]='';
// __UNIT__ u1930 [2031745,2031755) kind=var len=31
var dominationPointTemplate={};
// __UNIT__ u1931 [2031755,2031767) kind=expr len=38
dominationPointTemplate['pt']=INT_ONE;
// __UNIT__ u1932 [2031767,2031777) kind=var len=25
var mobileYawTemplate={};
// __UNIT__ u1933 [2031777,2031788) kind=expr len=37
mobileYawTemplate['y']=uint8TypeCode;
// __UNIT__ u1934 [2031788,2031798) kind=var len=25
var messageTemplateIU={};
// __UNIT__ u1935 [2031798,2031831) kind=expr len=117
messageTemplateIU['x']=float32TypeCode,messageTemplateIU['y']=float32TypeCode,messageTemplateIU['z']=float32TypeCode;
// __UNIT__ u1936 [2031831,2031841) kind=var len=34
var impactMarkerToggleTemplate={};
// __UNIT__ u1937 [2031841,2031852) kind=expr len=46
impactMarkerToggleTemplate['a']=uint8TypeCode;
// __UNIT__ u1938 [2031852,2031862) kind=var len=25
var messageTemplateIW={};
// __UNIT__ u1940 [2031905,2031915) kind=var len=29
var ignoredStringTemplate={};
// __UNIT__ u1941 [2031915,2031933) kind=expr len=52
ignoredStringTemplate[stringDecoderAlias(0x9ce)]='';
// __UNIT__ u1942 [2031933,2031943) kind=var len=25
var messageTemplateIY={};
// __UNIT__ u1943 [2031943,2031987) kind=expr len=128
messageTemplateIY['sgr']=float32TypeCode,messageTemplateIY['rank']=float32TypeCode,messageTemplateIY['ranksgr']=float32TypeCode;
// __UNIT__ u1944 [2031987,2031997) kind=var len=25
var playerStatsBucket={};
// __UNIT__ u1945 [2031997,2032126) kind=expr len=329
playerStatsBucket['YlyjPgZsW']=uint8TypeCode,playerStatsBucket['headshots']=INT_TWO,playerStatsBucket['points']=INT_TWO,playerStatsBucket[stringDecoderAlias(0x75a)]=uint8TypeCode,playerStatsBucket['sniperKills']=uint8TypeCode,playerStatsBucket['smgKills']=uint8TypeCode,playerStatsBucket[stringDecoderAlias(0x489)]=uint8TypeCode;
// __UNIT__ u1946 [2032126,2032136) kind=var len=33
var authTokenResponseTemplate={};
// __UNIT__ u1947 [2032136,2032152) kind=expr len=39
authTokenResponseTemplate['string']='';
// __UNIT__ u1948 [2032152,2032162) kind=var len=25
var messageTemplateJ1={};
// __UNIT__ u1949 [2032162,2032230) kind=expr len=212
messageTemplateJ1['m0']=TYPE_UINT32,messageTemplateJ1['m1']=TYPE_UINT32,messageTemplateJ1['a']=TYPE_UINT32,messageTemplateJ1['b']=TYPE_UINT32,messageTemplateJ1['c']=TYPE_UINT32,messageTemplateJ1['d']=TYPE_UINT32;
// __UNIT__ u1953 [2033468,2033527) kind=expr len=121
templateKeyAliases[stringDecoderAlias(0x532)]='kil'+'ls',templateKeyAliases['headshots']='hea'+stringDecoderAlias(0xe62);
// __UNIT__ u1954 [2033527,2033593) kind=var len=173
var templateKeyAliasMap=templateKeyAliases,templateKeyList=Object['keys'](templatesLive[stringDecoderAlias(0xbae)]),templateAliasKeyList=Object['keys'](templateKeyAliasMap);
// __UNIT__ u1955 [2033593,2033870) kind=for len=572
for(var loopIndex=0x0;loopIndex<templateKeyList['length'];loopIndex++){if(templateKeyAliasMap[templateKeyList[loopIndex]]==undefined){var stashedEntry=templatesLive['yEE39Vc650'][templateKeyList[loopIndex]];delete templatesLive['yEE39Vc650'][templateKeyList[loopIndex]],templatesLive['yEE39Vc650'][templateKeyList[loopIndex]]=stashedEntry;continue;}var oldKey=templateKeyList[loopIndex];if(oldKey==templateKeyAliasMap[oldKey])continue;templatesLive['yEE39Vc650'][templateKeyAliasMap[oldKey]]=templatesLive['yEE39Vc650'][oldKey],delete templatesLive['yEE39Vc650'][oldKey];}
// __UNIT__ u1957 [2033884,2034368) kind=for len=1064
for(var loopIndex=0x0;loopIndex<templateOrder[stringDecoderAlias(0x3a2)];loopIndex++){var Ja=templatesLive[templateOrder[loopIndex]];delete templateEntry[stringDecoderAlias(0x3e9)];var globalKeyList=getObjectKeys(templateEntry);templateEntry['byteSizes']=[];var hasStringFlag=globalKeyList['indexOf'](stringDecoderAlias(0x9ce))!=-0x1;hasStringFlag&&globalKeyList['splice'](globalKeyList['indexOf']('string'),0x1);templateEntry['totalSize']=0x2,templateEntry['byteSizes']=[];for(var scratchNumericJc=0x0;scratchNumericJc<globalKeyList['length'];scratchNumericJc++){templateEntry[stringDecoderAlias(0xb95)]+=typeByteSizes[templateEntry[globalKeyList[scratchNumericJc]]],templateEntry['byteSizes'][stringDecoderAlias(0xf1e)](templateEntry[globalKeyList[scratchNumericJc]]);}templateEntry['globalKeys']=globalKeyList,templateEntry[stringDecoderAlias(0x7f1)]=loopIndex+0x1,templateEntry[stringDecoderAlias(0x787)]=templateOrder[loopIndex],templateEntry['preStrSize']=templateEntry['totalSize'],templateEntry['hasString']=hasStringFlag,templateEntry['afCJVYrCGK']=!![];}
// __UNIT__ u1963 [2035913,2035943) kind=var len=48
var axisNames=['x','y','z'],baseMoveSpeed=0.083;
// __UNIT__ u1964 [2035943,2035970) kind=expr len=53
baseMoveSpeed=Math[stringDecoderAlias(0xb00)](0.074);
// __UNIT__ u1965 [2035970,2036200) kind=var len=541
var maxGroundSpeed=Math[stringDecoderAlias(0xb00)](Math['sqrt'](baseMoveSpeed)),maxGroundSpeedSq=baseMoveSpeed,airborneSpeedCapSq=Math['KkKRLGFtA'](baseMoveSpeed-0.005+0.6),airborneSpeedCap=Math[stringDecoderAlias(0xb00)](Math['sqrt'](airborneSpeedCapSq)),airborneSpeedLimitSq=airborneSpeedCapSq,reducedAirborneCapSq=Math['KkKRLGFtA'](airborneSpeedCapSq*9.9/0xa),reducedAirborneCap=Math[stringDecoderAlias(0xb00)](Math['sqrt'](reducedAirborneCapSq)),reducedAirborneCapSqAlias=reducedAirborneCapSq,slideSpeedMultiplier=Math['KkKRLGFtA'](2.3);
// __UNIT__ u1966 [2036200,2036208) kind=if len=26
if(alternatePhysicsFlag){}
// __UNIT__ u1967 [2036208,2036372) kind=var len=384
var slideSpeed=Math[stringDecoderAlias(0xb00)](Math[stringDecoderAlias(0xba3)](baseMoveSpeed*slideSpeedMultiplier)),slideSpeedSq=Math['KkKRLGFtA'](baseMoveSpeed*slideSpeedMultiplier),slideMoveSpeed=Math['KkKRLGFtA'](Math[stringDecoderAlias(0xba3)](baseMoveSpeed*(slideSpeedMultiplier-0.05))),slideMoveSpeedSq=Math[stringDecoderAlias(0xb00)](baseMoveSpeed*(slideSpeedMultiplier-0.05));
// __UNIT__ u1968 [2036372,2036380) kind=if len=26
if(alternatePhysicsFlag){}
// __UNIT__ u1969 [2036380,2036390) kind=var len=34
var sinLookupTable,cosLookupTable;
// __UNIT__ u1971 [2074136,2074146) kind=var len=18
var gemPack400={};
// __UNIT__ u1972 [2074146,2074246) kind=expr len=185
gemPack400[stringDecoderAlias(0x7bf)]='gems400',gemPack400[stringDecoderAlias(0xcd9)]=0x190,gemPack400['price']=3.99,gemPack400['extra']=0x0,gemPack400[stringDecoderAlias(0x1021)]=0x64;
// __UNIT__ u1973 [2074246,2074256) kind=var len=18
var gemPack850={};
// __UNIT__ u1974 [2074256,2074352) kind=expr len=136
gemPack850['sku']='gems850',gemPack850['gems']=0x352,gemPack850['price']=7.99,gemPack850['extra']=0x32,gemPack850['gemsPerDollar']=0x64;
// __UNIT__ u1975 [2074352,2074362) kind=var len=19
var gemPack1600={};
// __UNIT__ u1976 [2074362,2074464) kind=expr len=162
gemPack1600['sku']='gems1600',gemPack1600[stringDecoderAlias(0xcd9)]=0x640,gemPack1600['price']=14.99,gemPack1600['extra']=0x64,gemPack1600['gemsPerDollar']=0x6b;
// __UNIT__ u1977 [2074464,2074474) kind=var len=19
var gemPack2800={};
// __UNIT__ u1978 [2074474,2074581) kind=expr len=197
gemPack2800[stringDecoderAlias(0x7bf)]=stringDecoderAlias(0x252),gemPack2800['gems']=0xaf0,gemPack2800['price']=24.99,gemPack2800[stringDecoderAlias(0x32d)]=0x12c,gemPack2800['gemsPerDollar']=0x70;
// __UNIT__ u1979 [2074581,2074591) kind=var len=19
var gemPack6000={};
// __UNIT__ u1980 [2074591,2074690) kind=expr len=174
gemPack6000['sku']='gems6000',gemPack6000['gems']=0x1770,gemPack6000['price']=49.99,gemPack6000[stringDecoderAlias(0x32d)]=0x3e8,gemPack6000[stringDecoderAlias(0x1021)]=0x78;
// __UNIT__ u1981 [2074690,2074700) kind=var len=23
var neonArSkinEntry={};
// __UNIT__ u1982 [2074700,2074742) kind=expr len=98
neonArSkinEntry[stringDecoderAlias(0x9ec)]='neon',neonArSkinEntry[stringDecoderAlias(0x24d)]='ar';
// __UNIT__ u1983 [2074742,2074752) kind=var len=22
var neonArShopItem={};
// __UNIT__ u1984 [2074752,2074840) kind=expr len=194
neonArShopItem[stringDecoderAlias(0x7bf)]='neonar',neonArShopItem[stringDecoderAlias(0x9ec)]=stringDecoderAlias(0xd1),neonArShopItem['price']=0x320,neonArShopItem['aJkQkTWQo']=[neonArSkinEntry];
// __UNIT__ u1985 [2074840,2074850) kind=var len=24
var neonSmgSkinEntry={};
// __UNIT__ u1986 [2074850,2074892) kind=expr len=85
neonSmgSkinEntry['name']='neon',neonSmgSkinEntry['weapon']=stringDecoderAlias(0x83a);
// __UNIT__ u1987 [2074892,2074902) kind=var len=23
var neonSmgShopItem={};
// __UNIT__ u1988 [2074902,2074993) kind=expr len=187
neonSmgShopItem['sku']='neonsmg',neonSmgShopItem[stringDecoderAlias(0x9ec)]='Neon\x20SMG',neonSmgShopItem[stringDecoderAlias(0x5a4)]=0x320,neonSmgShopItem['aJkQkTWQo']=[neonSmgSkinEntry];
// __UNIT__ u1989 [2074993,2075003) kind=var len=24
var neonAwpSkinEntry={};
// __UNIT__ u1990 [2075003,2075048) kind=expr len=103
neonAwpSkinEntry[stringDecoderAlias(0x9ec)]=stringDecoderAlias(0x9d2),neonAwpSkinEntry['weapon']='awp';
// __UNIT__ u1991 [2075048,2075058) kind=var len=23
var neonAwpShopItem={};
// __UNIT__ u1992 [2075058,2075146) kind=expr len=169
neonAwpShopItem['sku']='neonawp',neonAwpShopItem[stringDecoderAlias(0x9ec)]='Neon\x20AWP',neonAwpShopItem['price']=0x320,neonAwpShopItem['aJkQkTWQo']=[neonAwpSkinEntry];
// __UNIT__ u1993 [2075146,2075156) kind=var len=28
var neonShotgunSkinEntry={};
// __UNIT__ u1994 [2075156,2075197) kind=expr len=77
neonShotgunSkinEntry['name']='neon',neonShotgunSkinEntry['weapon']='shotgun';
// __UNIT__ u1995 [2075197,2075207) kind=var len=27
var neonShotgunShopItem={};
// __UNIT__ u1996 [2075207,2075297) kind=expr len=206
neonShotgunShopItem[stringDecoderAlias(0x7bf)]='neonshotgun',neonShotgunShopItem['name']=stringDecoderAlias(0xda0),neonShotgunShopItem['price']=0x320,neonShotgunShopItem['aJkQkTWQo']=[neonShotgunSkinEntry];
// __UNIT__ u1997 [2075297,2075307) kind=var len=29
var neonBundleArSkinEntry={};
// __UNIT__ u1998 [2075307,2075349) kind=expr len=110
neonBundleArSkinEntry[stringDecoderAlias(0x9ec)]='neon',neonBundleArSkinEntry[stringDecoderAlias(0x24d)]='ar';
// __UNIT__ u1999 [2075349,2075359) kind=var len=30
var neonBundleSmgSkinEntry={};
// __UNIT__ u2000 [2075359,2075396) kind=expr len=77
neonBundleSmgSkinEntry['name']='neon',neonBundleSmgSkinEntry['weapon']='smg';
// __UNIT__ u2001 [2075396,2075406) kind=var len=30
var neonBundleAwpSkinEntry={};
// __UNIT__ u2002 [2075406,2075443) kind=expr len=77
neonBundleAwpSkinEntry['name']='neon',neonBundleAwpSkinEntry['weapon']='awp';
// __UNIT__ u2003 [2075443,2075453) kind=var len=34
var neonBundleShotgunSkinEntry={};
// __UNIT__ u2004 [2075453,2075496) kind=expr len=106
neonBundleShotgunSkinEntry['name']='neon',neonBundleShotgunSkinEntry[stringDecoderAlias(0x24d)]='shotgun';
// __UNIT__ u2005 [2075496,2075506) kind=var len=26
var neonBundleShopItem={};
// __UNIT__ u2006 [2075506,2075612) kind=expr len=298
neonBundleShopItem[stringDecoderAlias(0x7bf)]=stringDecoderAlias(0xd5b),neonBundleShopItem[stringDecoderAlias(0x9ec)]='Neon\x20Bundle',neonBundleShopItem['price']=0x960,neonBundleShopItem['aJkQkTWQo']=[neonBundleArSkinEntry,neonBundleSmgSkinEntry,neonBundleAwpSkinEntry,neonBundleShotgunSkinEntry];
// __UNIT__ u2007 [2075612,2075622) kind=var len=23
var shopCatalogData={};
// __UNIT__ u2008 [2075622,2075691) kind=expr len=209
shopCatalogData['gemOptions']=[gemPack400,gemPack850,gemPack1600,gemPack2800,gemPack6000],shopCatalogData['itemOptions']=[neonArShopItem,neonSmgShopItem,neonAwpShopItem,neonShotgunShopItem,neonBundleShopItem];
// __UNIT__ u2009 [2075691,2075707) kind=var len=50
var shopCatalog=shopCatalogData,tempTextureMap={};
// __UNIT__ u2010 [2075707,2076132) kind=expr len=704
tempTextureMap[stringDecoderAlias(0x4ed)]='textures/tempblue.png',tempTextureMap['tempgray']='textures/tempgray.png',tempTextureMap['temporange']=stringDecoderAlias(0x8b6),tempTextureMap[stringDecoderAlias(0x6c2)]='textures/temppurple.png',tempTextureMap['wood']=stringDecoderAlias(0x105d),tempTextureMap[stringDecoderAlias(0xf64)]='textures/stylizedredwood.png',tempTextureMap['brick']='textures/stylizedbrick.png',tempTextureMap[stringDecoderAlias(0x223)]='textures/stylizedredbrick.png',tempTextureMap['sand']=stringDecoderAlias(0x1ea),tempTextureMap[stringDecoderAlias(0x1056)]='textures/grunge.png',tempTextureMap['concrete']=stringDecoderAlias(0x310),tempTextureMap['siding']='textures/siding.jpg';
// __UNIT__ u2011 [2076132,2076148) kind=var len=65
var tempTextureMapAlias=tempTextureMap,tempblueMaterialPreset={};
// __UNIT__ u2012 [2076148,2076218) kind=expr len=160
tempblueMaterialPreset[stringDecoderAlias(0xbf7)]='tempblue',tempblueMaterialPreset[stringDecoderAlias(0x19e)]=0x46/0xf,tempblueMaterialPreset['grayscale']=![];
// __UNIT__ u2013 [2076218,2076228) kind=var len=30
var tempgrayMaterialPreset={};
// __UNIT__ u2014 [2076228,2076293) kind=expr len=140
tempgrayMaterialPreset['image']=stringDecoderAlias(0xe58),tempgrayMaterialPreset['repeat']=0x46/0xf,tempgrayMaterialPreset['grayscale']=![];
// __UNIT__ u2015 [2076293,2076303) kind=var len=32
var temporangeMaterialPreset={};
// __UNIT__ u2016 [2076303,2076369) kind=expr len=147
temporangeMaterialPreset['image']='temporange',temporangeMaterialPreset['repeat']=0x46/0xf,temporangeMaterialPreset[stringDecoderAlias(0x741)]=![];
// __UNIT__ u2017 [2076369,2076379) kind=var len=32
var temppurpleMaterialPreset={};
// __UNIT__ u2018 [2076379,2076448) kind=expr len=150
temppurpleMaterialPreset['image']='temppurple',temppurpleMaterialPreset[stringDecoderAlias(0x19e)]=0x46/0xf,temppurpleMaterialPreset['grayscale']=![];
// __UNIT__ u2019 [2076448,2076458) kind=var len=31
var separatorMaterialPreset={};
// __UNIT__ u2020 [2076458,2076577) kind=expr len=290
separatorMaterialPreset['image']='wood',separatorMaterialPreset[stringDecoderAlias(0x193)]=stringDecoderAlias(0x23c),separatorMaterialPreset['opacity']=0.5,separatorMaterialPreset['repeat']=1.5,separatorMaterialPreset['rotation']=0x0,separatorMaterialPreset[stringDecoderAlias(0x741)]=!![];
// __UNIT__ u2021 [2076577,2076587) kind=var len=27
var brickMaterialPreset={};
// __UNIT__ u2022 [2076587,2076716) kind=expr len=276
brickMaterialPreset['image']='redbrick',brickMaterialPreset['color']='hsl(20,30%,60%)',brickMaterialPreset[stringDecoderAlias(0x40e)]=0x0,brickMaterialPreset[stringDecoderAlias(0x19e)]=2.9,brickMaterialPreset['rotation']=0x0,brickMaterialPreset[stringDecoderAlias(0x741)]=![];
// __UNIT__ u2023 [2076716,2076726) kind=var len=30
var buildingMaterialPreset={};
// __UNIT__ u2024 [2076726,2076844) kind=expr len=283
buildingMaterialPreset['image']='wood',buildingMaterialPreset['color']=stringDecoderAlias(0x36e),buildingMaterialPreset['opacity']=0.4,buildingMaterialPreset[stringDecoderAlias(0x19e)]=0x2,buildingMaterialPreset[stringDecoderAlias(0x90d)]=0x0,buildingMaterialPreset['grayscale']=![];
// __UNIT__ u2025 [2076844,2076854) kind=var len=29
var redwoodMaterialPreset={};
// __UNIT__ u2026 [2076854,2076975) kind=expr len=295
redwoodMaterialPreset[stringDecoderAlias(0xbf7)]='redwood',redwoodMaterialPreset['color']=stringDecoderAlias(0xab3),redwoodMaterialPreset['opacity']=0x0,redwoodMaterialPreset['repeat']=2.4,redwoodMaterialPreset[stringDecoderAlias(0x90d)]=0x0,redwoodMaterialPreset[stringDecoderAlias(0x741)]=![];
// __UNIT__ u2027 [2076975,2076985) kind=var len=26
var sandMaterialPreset={};
// __UNIT__ u2028 [2076985,2077103) kind=expr len=259
sandMaterialPreset['image']='sand',sandMaterialPreset['color']=stringDecoderAlias(0x49f),sandMaterialPreset['opacity']=0x0,sandMaterialPreset[stringDecoderAlias(0x19e)]=0.5,sandMaterialPreset[stringDecoderAlias(0x90d)]=0x1,sandMaterialPreset['grayscale']=![];
// __UNIT__ u2029 [2077103,2077113) kind=var len=31
var wallbrickMaterialPreset={};
// __UNIT__ u2030 [2077113,2077230) kind=expr len=258
wallbrickMaterialPreset['image']='brick',wallbrickMaterialPreset['color']='#C9AB9C',wallbrickMaterialPreset[stringDecoderAlias(0x40e)]=0.2,wallbrickMaterialPreset['repeat']=2.9,wallbrickMaterialPreset['rotation']=0x0,wallbrickMaterialPreset['grayscale']=![];
// __UNIT__ u2031 [2077230,2077240) kind=var len=28
var sidingMaterialPreset={};
// __UNIT__ u2032 [2077240,2077356) kind=expr len=224
sidingMaterialPreset['image']='siding',sidingMaterialPreset['color']='#000',sidingMaterialPreset['opacity']=0.43,sidingMaterialPreset['repeat']=1.5,sidingMaterialPreset['rotation']=0x0,sidingMaterialPreset['grayscale']=!![];
// __UNIT__ u2033 [2077356,2077366) kind=var len=25
var materialPresetMap={};
// __UNIT__ u2034 [2077366,2077567) kind=expr len=672
materialPresetMap['tempblue']=tempblueMaterialPreset,materialPresetMap[stringDecoderAlias(0xe58)]=tempgrayMaterialPreset,materialPresetMap[stringDecoderAlias(0x565)]=temporangeMaterialPreset,materialPresetMap['temppurple']=temppurpleMaterialPreset,materialPresetMap[stringDecoderAlias(0xd60)]=separatorMaterialPreset,materialPresetMap['brick']=brickMaterialPreset,materialPresetMap[stringDecoderAlias(0xbd3)]=buildingMaterialPreset,materialPresetMap['red\x20wood']=redwoodMaterialPreset,materialPresetMap[stringDecoderAlias(0x6e8)]=sandMaterialPreset,materialPresetMap['wallbrick']=wallbrickMaterialPreset,materialPresetMap[stringDecoderAlias(0x166)]=sidingMaterialPreset;
// __UNIT__ u2035 [2077567,2077605) kind=var len=132
var materialPresetMapAlias=materialPresetMap,materialPresetKeys=Object['keys'](materialPresetMapAlias),shortbasicRoomStylePreset={};
// __UNIT__ u2036 [2077605,2077918) kind=expr len=442
shortbasicRoomStylePreset['name']=stringDecoderAlias(0xe6b),shortbasicRoomStylePreset['walls']=[['separator',0.2],['brick',2.5],[stringDecoderAlias(0xd60),0x0,0x0,0.07],['separator',0.3,0.07,0.07],['separator',0x0,0.07,0x0],[stringDecoderAlias(0xbd3),2.5],[stringDecoderAlias(0xd60),0x0,0x0,0.17],['separator',0.45,0.17,0.17],['separator',0x0,0.17,-0.2],['separator',-0.3,-0.2,-0.2]],shortbasicRoomStylePreset['DngZNuZBydL']=['building',0x0];
// __UNIT__ u2037 [2077918,2077928) kind=var len=30
var moldingRoomStylePreset={};
// __UNIT__ u2038 [2077928,2078040) kind=expr len=197
moldingRoomStylePreset['name']=stringDecoderAlias(0xbcd),moldingRoomStylePreset['walls']=[['separator',0x0,0x0,0.1],[stringDecoderAlias(0xd60),0.3,0.1,0.1],[stringDecoderAlias(0xd60),0x0,0.1,0x0]];
// __UNIT__ u2039 [2078040,2078050) kind=var len=29
var orangeRoomStylePreset={};
// __UNIT__ u2040 [2078050,2078159) kind=expr len=181
orangeRoomStylePreset[stringDecoderAlias(0x9ec)]='mNZeiqoUotp\x20orange',orangeRoomStylePreset['walls']=[['temporange',0x3]],orangeRoomStylePreset['DngZNuZBydL']=['temporange',0x0];
// __UNIT__ u2041 [2078159,2078169) kind=var len=27
var blueRoomStylePreset={};
// __UNIT__ u2042 [2078169,2078290) kind=expr len=249
blueRoomStylePreset[stringDecoderAlias(0x9ec)]=stringDecoderAlias(0x209),blueRoomStylePreset['walls']=[[stringDecoderAlias(0x4ed),0x3]],blueRoomStylePreset['DngZNuZBydL']=['tempblue',0x0],blueRoomStylePreset['floor']=[stringDecoderAlias(0x4ed),0x0];
// __UNIT__ u2043 [2078290,2078300) kind=var len=28
var floorRoomStylePreset={};
// __UNIT__ u2044 [2078300,2078369) kind=expr len=123
floorRoomStylePreset['name']='floor',floorRoomStylePreset['walls']=[],floorRoomStylePreset['DngZNuZBydL']=['tempgray',0x0];
// __UNIT__ u2045 [2078369,2078379) kind=var len=32
var brickwallRoomStylePreset={};
// __UNIT__ u2046 [2078379,2078480) kind=expr len=212
brickwallRoomStylePreset[stringDecoderAlias(0x9ec)]='brickwall',brickwallRoomStylePreset['walls']=[[stringDecoderAlias(0xd60),0.2],['brick',0x3]],brickwallRoomStylePreset[stringDecoderAlias(0x1dc)]=['brick',0x0];
// __UNIT__ u2047 [2078480,2078490) kind=var len=29
var noroofRoomStylePreset={};
// __UNIT__ u2048 [2078490,2078550) kind=expr len=143
noroofRoomStylePreset[stringDecoderAlias(0x9ec)]=stringDecoderAlias(0x394),noroofRoomStylePreset[stringDecoderAlias(0x7f7)]=[['tempblue',0x3]];
// __UNIT__ u2049 [2078550,2078580) kind=var len=182
var roomStylePresets=[shortbasicRoomStylePreset,moldingRoomStylePreset,orangeRoomStylePreset,blueRoomStylePreset,floorRoomStylePreset,brickwallRoomStylePreset,noroofRoomStylePreset];
// __UNIT__ u2051 [2079266,2079276) kind=var len=24
var changelogEntries={};
// __UNIT__ u2053 [2085175,2085191) kind=var len=51
var changelogData=changelogEntries,prismAwpSkin={};
// __UNIT__ u2054 [2085191,2085246) kind=expr len=100
prismAwpSkin['name']='prism',prismAwpSkin[stringDecoderAlias(0x24d)]='awp',prismAwpSkin['wear']=0x0;
// __UNIT__ u2055 [2085246,2085256) kind=var len=30
var partyMemberSweptThrone={};
// __UNIT__ u2057 [2085354,2085364) kind=var len=19
var alezSmgSkin={};
// __UNIT__ u2058 [2085364,2085422) kind=expr len=115
alezSmgSkin[stringDecoderAlias(0x9ec)]='alez',alezSmgSkin[stringDecoderAlias(0x24d)]='smg',alezSmgSkin['wear']=0x0;
// __UNIT__ u2059 [2085422,2085432) kind=var len=23
var partyMemberAlez={};
// __UNIT__ u2061 [2085521,2085531) kind=var len=24
var defaultPartyInfo={};
// __UNIT__ u2062 [2085531,2085593) kind=expr len=149
defaultPartyInfo['map']=stringDecoderAlias(0x51d),defaultPartyInfo[stringDecoderAlias(0x2b1)]=stringDecoderAlias(0xb70),defaultPartyInfo['time']=0x5;
// __UNIT__ u2065 [2087315,2087484) kind=function len=197
function openExternalUrl(a3i){var aqN=stringDecoderAlias;if(window['MobileApp']){window[aqN(0x7c8)][aqN(0x958)](a3i);return;}var a3j=window['open'](a3i,'_blank');a3j!=undefined&&a3j[aqN(0xd56)]();}
// __UNIT__ u2066 [2087484,2087613) kind=var len=398
var shopPreviewLock=![],shopPreviewActive=![],playerSkillRating=0.3,rankDisplayScore=0.3,rankedSkillRating=0.3,isRankedMatch=![],lobbyButtonList=[],respawnAdSlots=[],refreshRespawnBanners,claimReward,KF=![],isEditingMobileLayout=![],activeTouchList=[],pauseSettingsScene={},welcomeScene={},onboardingScene={},leaderboardDataKl=[],selfLeaderboardIndex=0x0,localTeamId=0x0,leaderboardConsumeFlag=![];
// __UNIT__ u2069 [2087872,2087898) kind=var len=52
var victoryBlueColor=buildRgbString(0x3c,0x96,0xe6);
// __UNIT__ u2071 [2088102,2088109) kind=var len=22
var googleTokenClient;
// __UNIT__ u2079 [2090901,2091032) kind=expr len=248
readLocalStorage('sgr')!=undefined&&!isNaN(readLocalStorage(stringDecoderAlias(0x10a2)))&&(playerSkillRating=Number(readLocalStorage('sgr')),isNaN(playerSkillRating)&&window[stringDecoderAlias(0x15f)]('Loaded\x20as\x20NaN:\x20'+playerSkillRating));
// __UNIT__ u2081 [2091400,2091410) kind=var len=21
var defaultSkinAr={};
// __UNIT__ u2082 [2091410,2091464) kind=expr len=87
defaultSkinAr['name']='default',defaultSkinAr['weapon']='ar',defaultSkinAr['wear']=0x0;
// __UNIT__ u2083 [2091464,2091509) kind=var len=71
var selectedSkin=defaultSkinAr,isHttps=location['protocol']==='https:';
// __UNIT__ u2084 [2091509,2091534) kind=expr len=25
window['uiDisabled']=![];
// __UNIT__ u2086 [2091722,2091743) kind=expr len=48
coinRewardIcon['src']=stringDecoderAlias(0xa49);
// __UNIT__ u2087 [2091743,2091782) kind=var len=81
var coinStackImage=document[stringDecoderAlias(0x8b0)](stringDecoderAlias(0xda));
// __UNIT__ u2088 [2091782,2091820) kind=expr len=65
coinStackImage[stringDecoderAlias(0x18d)]='promo/coinstack.webp';
// __UNIT__ u2089 [2091820,2091864) kind=var len=73
var diamondIconImage=document['createElement'](stringDecoderAlias(0xda));
// __UNIT__ u2090 [2091864,2091885) kind=expr len=50
diamondIconImage['src']=stringDecoderAlias(0xa30);
// __UNIT__ u2091 [2091885,2091925) kind=var len=53
var googleLogoImage=document['createElement']('img');
// __UNIT__ u2092 [2091925,2091946) kind=expr len=49
googleLogoImage['src']=stringDecoderAlias(0x420);
// __UNIT__ u2093 [2091946,2091990) kind=var len=71
var checkmarkBadge=document['createElement'](stringDecoderAlias(0xda));
// __UNIT__ u2094 [2091990,2092023) kind=expr len=60
checkmarkBadge[stringDecoderAlias(0x18d)]='promo/check.png';
// __UNIT__ u2095 [2092023,2092063) kind=var len=56
var verifiedBadgeImage=document['createElement']('img');
// __UNIT__ u2096 [2092063,2092099) kind=expr len=67
verifiedBadgeImage[stringDecoderAlias(0x18d)]='promo/verified.png';
// __UNIT__ u2097 [2092099,2092138) kind=var len=84
var boostedBadgeImage=document[stringDecoderAlias(0x8b0)](stringDecoderAlias(0xda));
// __UNIT__ u2098 [2092138,2092173) kind=expr len=65
boostedBadgeImage[stringDecoderAlias(0x18d)]='promo/boosted.png';
// __UNIT__ u2099 [2092173,2092226) kind=var len=95
var loginBaseUrl='https://login.de'+'adshot.io',authTokenStorageKey=stringDecoderAlias(0x105f);
// __UNIT__ u2100 [2092226,2092276) kind=expr len=95
!isHttps&&(loginBaseUrl=stringDecoderAlias(0xe8a)+location[stringDecoderAlias(0x157)]+':8082');
// __UNIT__ u2101 [2092276,2092414) kind=expr len=210
(location['host']==stringDecoderAlias(0x4d3)+stringDecoderAlias(0x3f1)||location['host']=='beta2.de'+'adshot.io')&&(loginBaseUrl='https://testlogin.de'+stringDecoderAlias(0x3f1),authTokenStorageKey='dsesBeta');
// __UNIT__ u2106 [2093920,2094054) kind=var len=246
var tintWorkCanvas=document['createElement']('canvas'),tintWorkContext=tintWorkCanvas['getContext']('2d'),outlineWorkCanvas=document['createElement'](stringDecoderAlias(0x483)),tintWorkContextAlias=tintWorkCanvas[stringDecoderAlias(0x616)]('2d');
// __UNIT__ u2116 [2099460,2099470) kind=var len=20
var elementCache={};
// __UNIT__ u2120 [2110307,2110350) kind=var len=60
var reticleSpriteCanvas=document['createElement']('canvas');
// __UNIT__ u2121 [2110350,2110385) kind=expr len=99
reticleSpriteCanvas[stringDecoderAlias(0xad0)]=reticleSpriteCanvas[stringDecoderAlias(0x300)]=0x80;
// __UNIT__ u2122 [2110385,2110413) kind=var len=74
var hudCanvasContext=reticleSpriteCanvas[stringDecoderAlias(0x616)]('2d');
// __UNIT__ u2123 [2110413,2110508) kind=expr len=216
hudCanvasContext[stringDecoderAlias(0x6d3)]=0x9,hudCanvasContext[stringDecoderAlias(0x42c)](reticleSpriteCanvas['width']/0x2,reticleSpriteCanvas[stringDecoderAlias(0x300)]/0x2),hudCanvasContext['strokeStyle']='#EEE';
// __UNIT__ u2124 [2110508,2110731) kind=for len=371
for(var loopIndex=0x0;loopIndex<0x4;loopIndex++){hudCanvasContext['beginPath'](),hudCanvasContext['moveTo'](0x0,-0x14),hudCanvasContext['lineTo'](0x0,-0x37),hudCanvasContext['stroke'](),hudCanvasContext['beginPath'](),hudCanvasContext['arc'](0x0,0x0,0x26,0.45,Math['PI']/0x2-0.45),hudCanvasContext['stroke'](),hudCanvasContext[stringDecoderAlias(0x45e)](Math['PI']/0x2);}
// __UNIT__ u2125 [2110731,2110738) kind=var len=24
var floatingMessageList;
// __UNIT__ u2127 [2112373,2112384) kind=var len=34
var enableFloatingMessageFade=![];
// __UNIT__ u2129 [2122175,2122201) kind=var len=52
var healthCrossColor=buildHslString(0x73,0x32,0x2d);
// __UNIT__ u2139 [2144246,2144259) kind=var len=53
var menuLogoText,menuLogoContainer,menuLogoPrerender;
// __UNIT__ u2142 [2146358,2146517) kind=var len=197
var gradientCanvasTexture=createGradientTexture(0x64,0x1,0x1,0x0,[[0x0,'rgba(\x200,\x200,\x200,\x201\x20)'],[0.7,'rgba(\x200,\x200,\x200,\x200.54\x20)'],[0x1,'rgba(\x200,\x200,\x200,\x200\x20)']]);
// __UNIT__ u2149 [2148381,2148483) kind=function len=186
function showUsernameInput(){var arW=stringDecoderAlias;usernameInputOverlay['elem'][arW(0x1040)]==undefined&&usernameInputOverlay[arW(0x8cb)][arW(0xe3c)](usernameInputOverlay['elem']);}
// __UNIT__ u2150 [2148483,2148560) kind=function len=144
function clearUsernameInput(){var arX=stringDecoderAlias;usernameInputOverlay['elem']['value']='',usernameInputOverlay[arX(0x774)]['remove']();}
// __UNIT__ u2152 [2404383,2404403) kind=var len=34
var skipSplashTweens=!![],Nu=!![];
// __UNIT__ u2153 [2404403,2404411) kind=var len=8
var $=3;
// __UNIT__ u2154 [2404411,2404432) kind=if len=21
if($ in{'a':'b'}){7;}
// __UNIT__ u2155 [2404432,2404498) kind=var len=136
var reportNonce=Math[stringDecoderAlias(0x5ce)](Math[stringDecoderAlias(0x4bd)]()*0x186a0),errorReportCount=0x0,clientReportVersion=0x1;
// __UNIT__ u2157 [2405962,2405996) kind=var len=100
var slowTimerReportCount=0x0,maxSlowTimerReports=0x14,slowTimerThresholdMs=0x78,adDeferredCount=0x0;
// __UNIT__ u2159 [2407222,2407229) kind=var len=24
var tamperReferenceTime;
// __UNIT__ u2160 [2407229,2407285) kind=if len=73
if(typeof ws_bindgen_tm!='undefined'){tamperReferenceTime=ws_bindgen_tm;}
// __UNIT__ u2161 [2407285,2407292) kind=var len=20
var clientAuthToken;
// __UNIT__ u2162 [2407292,2407348) kind=if len=69
if(typeof ws_bindgen_at!='undefined'){clientAuthToken=ws_bindgen_at;}
// __UNIT__ u2164 [2407626,2407736) kind=var len=184
var bridgeMessagePayload=['','','',![]],mobileUserAgentKeywords=['Android','webOS','iPhone','iPad',stringDecoderAlias(0x170),'Blackberry','Windows\x20Phone'],mobileUserAgentRegexes=[];
// __UNIT__ u2165 [2407736,2407809) kind=for len=163
for(var loopIndex=0x0;loopIndex<mobileUserAgentKeywords['length'];loopIndex++){mobileUserAgentRegexes['push'](new RegExp(mobileUserAgentKeywords[loopIndex],'i'));}
// __UNIT__ u2166 [2407809,2407828) kind=var len=41
var tamperCheckPassed=![],mathAlias=Math;
// __UNIT__ u2168 [2408049,2408058) kind=if len=14
if(!isHttps){}
// __UNIT__ u2169 [2408058,2408068) kind=expr len=36
isMobilePhone=isMobilePhone||isIPad;
// __UNIT__ u2170 [2408068,2408086) kind=expr len=49
isMobilePhone&&!isHttps&&(fullscreenEnabled=![]);
// __UNIT__ u2173 [2408408,2408434) kind=var len=54
var bootTimestampMs=Date[stringDecoderAlias(0x1c2)]();
// __UNIT__ u2174 [2408434,2408592) kind=expr len=173
'caches'in window&&caches['keys']()['then'](function(a3l){var axn=stringDecoderAlias;return Promise[axn(0x235)](a3l['map'](function(a3m){return caches['delete'](a3m);}));});
// __UNIT__ u2178 [2409309,2409385) kind=expr len=121
window[stringDecoderAlias(0xbf9)]=function(){return{};},initPhysicsEngine(),window['loginAPI']=stringDecoderAlias(0x35e);
// __UNIT__ u2179 [2409385,2409425) kind=var len=69
var movementKeyNames=['up',stringDecoderAlias(0xa96),'left','right'];
// __UNIT__ u2180 [2409425,2409437) kind=expr len=37
isMobilePhone&&(movementKeyNames=[]);
// __UNIT__ u2182 [2409711,2409736) kind=var len=57
var matrixUpdateCount=0x0,matrixUpdateFrameId=0x1,NR=![];
// __UNIT__ u2189 [2412339,2412416) kind=var len=179
var tamperTripFlag=!![],mathAbsMethodKey=decodeByteString([-0x57,-0x58,-0x69]),originalMathAbs=mathAlias[mathAbsMethodKey],tamperTolerance=0x3e8*0x3c*0xa,tamperTimeDivisor=0x2710;
// __UNIT__ u2190 [2412416,2412554) kind=expr len=271
mathAlias[mathAbsMethodKey]=function(a3l){if(typeof ws_bindgen_tm!='undefined'&&a3l==ws_bindgen_tm-bootTimestampMs/tamperTimeDivisor){tamperTripFlag=false;a3l>=tamperTolerance?tamperTripFlag=true:mathAlias[mathAbsMethodKey]=originalMathAbs;}return originalMathAbs(a3l);};
// __UNIT__ u2192 [2414859,2414872) kind=expr len=37
isMobilePhone&&(sniperScopeZoom=3.5);
// __UNIT__ u2195 [2416100,2416146) kind=var len=82
var debugWireframeFlag=![],isHttps=location[stringDecoderAlias(0xeee)]==='https:';
// __UNIT__ u2196 [2416146,2416159) kind=expr len=32
isHttps&&(skipSplashTweens=![]);
// __UNIT__ u2197 [2416159,2416172) kind=expr len=35
isMobilePhone&&(maxAnisotropy=0x1);
// __UNIT__ u2198 [2416172,2416183) kind=var len=26
var showImpactMarkers=![];
// __UNIT__ u2200 [2416250,2416274) kind=var len=58
var activeAudioObjects=[],sfxVolume=0x1,ambientVolume=0x1;
// __UNIT__ u2201 [2416274,2416337) kind=expr len=96
window[stringDecoderAlias(0x4d9)]=function(a3l){return a3l=='ambient'?ambientVolume:sfxVolume;};
// __UNIT__ u2202 [2416337,2416442) kind=function len=149
function getObjectAudioCategoryVolume(audioOpts){return window['getAudioCategoryVolume'](audioOpts!=undefined?audioOpts['audioCategory']:undefined);}
// __UNIT__ u2203 [2416442,2416863) kind=function len=629
function applyAudioObjectVolume(soundChannel,volumeLevel){var axy=stringDecoderAlias;if(soundChannel==undefined||soundChannel['gain']==undefined||soundChannel['gain']['gain']==undefined)return![];var computedGain=soundChannel['localVolume']*masterVolumeScale*getObjectAudioCategoryVolume(soundChannel);if(isNaN(parseFloat(computedGain)))return window[axy(0x15f)](axy(0x222)+volumeLevel+axy(0x95c)+soundChannel[axy(0x1c4)]),![];if(!soundChannel[axy(0x969)]['gain']['setValueAtTime'](parseFloat(computedGain),0x0))return window['onerror'](axy(0x67b)+volumeLevel+',\x20localVolume:\x20'+soundChannel['localVolume']),![];return!![];}
// __UNIT__ u2204 [2416863,2416952) kind=function len=176
function refreshAllAudioVolumes(a3l){var axz=stringDecoderAlias;for(let a3m=0x0;a3m<activeAudioObjects[axz(0x3a2)];a3m++){applyAudioObjectVolume(activeAudioObjects[a3m],a3l);}}
// __UNIT__ u2205 [2416952,2417042) kind=function len=254
function reapplySavedMasterVolume(rawVolumeInput){var timeScale=masterVolumeScale/baseVolumeScale;typeof savedUserVolume=='number'&&!isNaN(savedUserVolume)&&(timeScale=savedUserVolume),applyMasterVolume(timeScale),refreshAllAudioVolumes(rawVolumeInput);}
// __UNIT__ u2206 [2417042,2417052) kind=expr len=40
initSoundRegistry(),initAudioListener();
// __UNIT__ u2207 [2417052,2417100) kind=var len=63
var arrayPushFnSource=Array['prototype']['push']['toString']();
// __UNIT__ u2208 [2417100,2417184) kind=if len=99
if(arrayPushFnSource['indexOf']('if\x20(object\x20&&\x20object.material)\x20{')!=-0x1)while(!![]){}
// __UNIT__ u2209 [2417184,2417481) kind=function len=435
function loadCrazyGamesSdk(){var axB=stringDecoderAlias;isCrazyGames=!![],fullscreenEnabled=![];var sdkScript=document['createElement']('script');sdkScript['onload']=function(){var axA=decodeString;crazyGamesGame=window['CrazyGames']['SDK']['ga'+'me'],crazyGamesBanner=window['CrazyGames'][axA(0x458)][axA(0xe7c)],refreshCrazyGamesBanners();},sdkScript['src']=axB(0x1067)+axB(0xc98)+axB(0xd90),document['body'][axB(0xe3c)](sdkScript);}
// __UNIT__ u2210 [2417481,2417504) kind=expr len=49
getQueryParam('cg')=='true'&&loadCrazyGamesSdk();
// __UNIT__ u2212 [2417523,2417534) kind=var len=21
var isNowGgEmbed=![];
// __UNIT__ u2213 [2417534,2417563) kind=expr len=50
getQueryParam('ngg')=='true'&&(isNowGgEmbed=!![]);
// __UNIT__ u2214 [2417563,2417573) kind=var len=27
var emptyCollisionWorld={};
// __UNIT__ u2216 [2417625,2417635) kind=var len=39
var collisionWorld=emptyCollisionWorld;
// __UNIT__ u2218 [2418246,2418882) kind=function len=902
function updateActiveShakes(deltaTime){var axD=stringDecoderAlias;for(var shakeIndex=0x0;shakeIndex<activeShakeList['length'];shakeIndex++){var shake=activeShakeList['array'][shakeIndex];shake['IUTkaCQgos']+=deltaTime;if(shake[axD(0xe31)]<shake[axD(0xe2d)])continue;if(shake['IUTkaCQgos']>shake[axD(0xe2d)]+shake['time']){shake['obj']['position']['x']=0x0,shake['obj']['position']['y']=0x0,shake[axD(0x9a0)][axD(0x343)]=![];shake['cb']!==undefined&&(shake['cb'](shake[axD(0x9a0)]),shake['cb']=null);activeShakeList['splice'](shakeIndex,0x1),shakeIndex--;continue;}var shakeStrength=(shake['IUTkaCQgos']-shake['delay'])/shake[axD(0x35c)];shakeStrength=0x1-shakeStrength,shakeStrength*=shake['amount'];var jitterIdx=Math[axD(0x5ce)](Math['random']()*0x100);shake[axD(0x9a0)]['position']['x']=cosLookupTable[jitterIdx]*shakeStrength,shake['obj'][axD(0x215)]['y']=sinLookupTable[jitterIdx]*shakeStrength;}}
// __UNIT__ u2219 [2418882,2418900) kind=var len=37
var gamepadState=null,gamepadList=[];
// __UNIT__ u2220 [2418900,2419068) kind=function len=223
function isGamepadButtonPressed(a3l){var axE=stringDecoderAlias;if(gamepadState['buttons'][axE(0x3a2)]<=a3l)return![];var a3m=gamepadState[axE(0x4bc)][a3l];if(typeof a3m===axE(0x478))return a3m['pressed'];return a3m===0x1;}
// __UNIT__ u2221 [2419068,2419089) kind=var len=59
var stickDeadzone=0.1,stickDeadzoneRange=0x1-stickDeadzone;
// __UNIT__ u2222 [2419089,2419213) kind=function len=193
function applyStickDeadzone(a3l){var axF=stringDecoderAlias,a3m=Math[axF(0xe3a)](a3l);return a3l=Math['max'](stickDeadzone,Math['abs'](a3l)),a3l-=stickDeadzone,a3l/=stickDeadzoneRange,a3l*a3m;}
// __UNIT__ u2223 [2419213,2419229) kind=var len=58
var prevGamepadButtonStates=[],currGamepadButtonStates=[];
// __UNIT__ u2224 [2419229,2419271) kind=function len=108
function gamepadButtonChanged(index){return prevGamepadButtonStates[index]!=currGamepadButtonStates[index];}
// __UNIT__ u2225 [2419271,2419327) kind=var len=164
var currentGamepadState=new makeBaseInputState(),prevGamepadState=new makeBaseInputState(),gamepadFireHeld=![],gamepadAdsHeld=![],mouseFireHeld=![],adsHeldFlag=![];
// __UNIT__ u2227 [2421088,2421245) kind=expr len=264
window['addEventListener']('ga'+stringDecoderAlias(0x102f),function(a3l){pollGamepadInput();}),window['addEventListener']('ga'+stringDecoderAlias(0x360),function(a3l){pollGamepadInput(),aimYawOffset=0x0,gamepadFireHeld=![],gamepadAdsHeld=![];}),pollGamepadInput();
// __UNIT__ u2228 [2421245,2421322) kind=var len=157
var chatInputWidth=0x15e,chatInputHeight=0x28,chatInputFontSize=0x14,chatInputPaddingLeft=0xf,chatInput=document['createElement'](stringDecoderAlias(0x6dc));
// __UNIT__ u2230 [2421362,2421373) kind=var len=25
var chatInputFocused=![];
// __UNIT__ u2231 [2421373,2421588) kind=expr len=323
chatInput['style'][stringDecoderAlias(0xced)]='none',chatInput['addEventListener']('focus',function(){var axH=stringDecoderAlias;chatInputFocused=!![],chatInput['style']['pointerEvents']=axH(0x762);}),chatInput[stringDecoderAlias(0xa9a)]('blur',function(){chatInputFocused=![],chatInput['style']['pointerEvents']='none';});
// __UNIT__ u2232 [2421588,2421752) kind=function len=243
function showChatInput(){var axI=stringDecoderAlias;if(prerendersDisabled)return;cancelTween(chatInput['style'],'opacity'),chatInput['style'][axI(0xa5a)]='visible',chatInput['style'][axI(0xecf)]='initial',chatInput[axI(0xa92)]['opacity']=0x1;}
// __UNIT__ u2233 [2421752,2421856) kind=function len=144
function hideChatInput(){var axJ=stringDecoderAlias;chatInput[axJ(0xa92)]['visibility']=axJ(0x59d),chatInput[axJ(0xa92)]['display']=axJ(0x24a);}
// __UNIT__ u2234 [2421856,2422134) kind=expr len=480
hideChatInput(),chatInput['style']['zIndex']=0x64,chatInput['style'][stringDecoderAlias(0x215)]='absolute',chatInput['style'][stringDecoderAlias(0x480)]=stringDecoderAlias(0x24a),chatInput['style'][stringDecoderAlias(0x91b)]='none',chatInput[stringDecoderAlias(0xa92)][stringDecoderAlias(0x193)]='#EEE',chatInput[stringDecoderAlias(0xa92)]['fontFamily']='Open\x20Sans',chatInput['style']['fontWeight']=stringDecoderAlias(0x4b0),chatInput[stringDecoderAlias(0xa92)]['opacity']=0x1;
// __UNIT__ u2235 [2422134,2422271) kind=var len=177
var textShadowOffsetPx=0x1,textShadowColor='rgba(0,0,0,0.4)',textShadowCss='-Qpx\x20-Qpx\x200\x20C,\x20Qpx\x20-Qpx\x200\x20C,\x20-Qpx\x20Qpx\x200\x20C,\x20Qpx\x20Qpx\x200\x20C';
// __UNIT__ u2236 [2422271,2422343) kind=while len=136
while(textShadowCss['indexOf']('Q')!=-0x1){textShadowCss=textShadowCss['replace']('Q',textShadowOffsetPx[stringDecoderAlias(0xe45)]());}
// __UNIT__ u2237 [2422343,2422416) kind=while len=134
while(textShadowCss[stringDecoderAlias(0xfad)]('C')!=-0x1){textShadowCss=textShadowCss['replace']('C',textShadowColor['toString']());}
// __UNIT__ u2238 [2422416,2422518) kind=expr len=131
chatInput[stringDecoderAlias(0x85e)]('spellcheck','false'),chatInput['setAttribute']('placeholder','[Enter]\x20to\x20use\x20chat');
// __UNIT__ u2240 [2423312,2423353) kind=expr len=74
hideChatInput(),pageBody=document['body'],uiToolkit=new canvasUiToolkit();
// __UNIT__ u2241 [2423353,2423403) kind=expr len=94
isMobilePhone&&!isIPad&&(uiToolkit['textScale']=0.9,uiToolkit[stringDecoderAlias(0x4a7)]=1.2);
// __UNIT__ u2242 [2423403,2423450) kind=expr len=67
isSafari?uiToolkit['EpyzjenecZQ']=![]:uiToolkit['EpyzjenecZQ']=![];
// __UNIT__ u2243 [2423450,2423486) kind=var len=97
var isMobileRenderMode=isMobilePhone,canvasRenderer=new uiToolkit[(stringDecoderAlias(0x711))]();
// __UNIT__ u2244 [2423486,2423521) kind=expr len=62
canvasRenderer['c'][stringDecoderAlias(0xa92)]['zIndex']=0x31;
// __UNIT__ u2245 [2423521,2423564) kind=var len=59
var randomPromoBgIndex=Math['floor'](Math['random']()*0x7);
// __UNIT__ u2247 [2424289,2424299) kind=var len=22
var domOverlayList=[];
// __UNIT__ u2248 [2424299,2424453) kind=function len=209
function refreshDomOverlays(){var axO=stringDecoderAlias;for(var a3l=0x0;a3l<domOverlayList[axO(0x3a2)];a3l++){var a3m=domOverlayList[a3l];a3m['x']=a3m['x'],a3m['y']=a3m['y'],a3m[axO(0xe8c)]=a3m[axO(0xe8c)];}}
// __UNIT__ u2249 [2424453,2425453) kind=expr len=1126
domOverlayPositioner=function(elem,initX,initY,size){var axP=stringDecoderAlias;if(elem==undefined){var a3p={};a3p['style']={},elem=a3p;}elem['style'][axP(0x215)]='absolute';var a3q={set 'x'(a3s){var axQ=axP;this[axQ(0x2d7)]=a3s,this['s']['marginLeft']=(this[axQ(0x2d7)]+this[axQ(0xb9a)]+canvasRenderer[axQ(0xe8e)])/canvasRenderer['aratio']+'px';},get 'x'(){var axR=axP;return this[axR(0x2d7)];},set 'addX'(a3s){this['privateAddX']=a3s,this['x']=this['privateX'];},get 'addX'(){return this['privateAddX'];},set 'y'(value){this['privateY']=value,this['s']['marginTop']=(this['privateY']+canvasRenderer['bottomOfScreen'])/canvasRenderer['aratio']+'px';},get 'y'(){var axS=axP;return this[axS(0x4dd)];},set 'size'(a3s){var axT=axP;this['privateSize']=a3s,this['s'][axT(0x215)]=axT(0xb8b),this['s']['transform']=axT(0x5b9)+this['size']/canvasRenderer[axT(0x10b7)]+')';},get 'size'(){return this['privateSize'];}};a3q['elem']=elem,a3q['parent']=elem['parentNode'],a3q['s']=elem[axP(0xa92)],a3q['privateX']=initX,a3q[axP(0x4dd)]=initY,a3q[axP(0xb9a)]=0x0,a3q['privateSize']=size;var a3r=a3q;return domOverlayList['push'](a3r),a3r;};
// __UNIT__ u2250 [2425453,2425560) kind=function len=140
function persistClientSettings(){if(clientSettings==undefined){return;}try{localStorage.settings=JSON.stringify(clientSettings);}catch(e){}}
// __UNIT__ u2252 [2426313,2426908) kind=function len=705
function loadClientSettings(){var savedSettings;try{try{if(localStorage.settings!=undefined){savedSettings=JSON.parse(localStorage.settings);clientSettings=JSON.parse(JSON.stringify(savedSettings));}}catch(e){}if(savedSettings==undefined){return;}var tempKeys=Object.keys(savedSettings);for(var i=0;i<tempKeys.length;i++){for(var j=0;j<settingsOptions.length;j++){if(settingsOptions[j].id==tempKeys[i]){if(tempKeys[i]==undefined){continue;}settingsOptions[j].default=savedSettings[tempKeys[i]];if(tempKeys[i]=='region'){settingsOptions[j].default='';}if(savedSettings.version==undefined&&tempKeys[i]=='sensitivity'){if(settingsOptions[j].default!=1){settingsOptions[j].default*=1.4;}}break;}}}}catch(e){}}
// __UNIT__ u2253 [2426908,2426924) kind=var len=49
var regionPingRequests=[],regionPingResponses=[];
// __UNIT__ u2256 [2428197,2428394) kind=function len=334
function pingAllRegions(preserveRegions){if(!isHttps)return;regionPingStarted=!![],regionPingRequests=[],!preserveRegions&&(regionPingResponses=[]),pingRegion('na','North\x20America'),pingRegion('eu','Europe'),pingRegion('as','Asia'),pingRegion('in','South\x20India'),pingRegion('sa','South\x20America'),pingRegion('au','Australia');}
// __UNIT__ u2257 [2428394,2428411) kind=var len=45
var regionPingStarted=![],rawMouseSetting={};
// __UNIT__ u2259 [2428598,2428608) kind=var len=27
var inverseMouseSetting={};
// __UNIT__ u2262 [2437574,2437685) kind=for len=205
for(var loopIndex=0x0;loopIndex<settingsOptions['length'];loopIndex++){settingsOptions[loopIndex]['ReDNKHkwk']=!![],settingsOptions[loopIndex]['mobileOnly']&&(settingsOptions[loopIndex]['ReDNKHkwk']=![]);}
// __UNIT__ u2263 [2437685,2437972) kind=if len=610
if(isTouchDevice||window[stringDecoderAlias(0x7c8)]){var desktopOnlySettingIds=[stringDecoderAlias(0x1002),stringDecoderAlias(0xb10),'antialias','fullscreen',stringDecoderAlias(0x2fe)];for(var loopIndex=0x0;loopIndex<settingsOptions['length'];loopIndex++){settingsOptions[loopIndex]['mobileOnly']&&(settingsOptions[loopIndex]['ReDNKHkwk']=!![]);for(var th=0x0;variantIdx<desktopOnlySettingIds[stringDecoderAlias(0x3a2)];variantIdx++){settingsOptions[loopIndex]['id']==desktopOnlySettingIds[variantIdx]&&(settingsOptions[loopIndex][stringDecoderAlias(0xb1d)]=![],variantIdx+=desktopOnlySettingIds['length']);}}}
// __UNIT__ u2264 [2437972,2437987) kind=expr len=21
loadClientSettings();
// __UNIT__ u2265 [2437987,2438067) kind=var len=135
var touchmoveKey=decodeByteString([-0x6a,-0x65,-0x6b,-0x59,-0x5e,-0x63,-0x65,-0x6c,-0x5b]),clientSettings,RA,settingsDebounceTimer=0x0;
// __UNIT__ u2266 [2438067,2438318) kind=function len=369
function saveAndApplySettings(){var ayf=stringDecoderAlias;persistClientSettings();var a3l=Object[ayf(0x6a4)](clientSettings);for(var a3m=0x0;a3m<a3l[ayf(0x3a2)];a3m++){for(var a3n=0x0;a3n<settingsOptions['length'];a3n++){settingsOptions[a3n]['id']==a3l[a3m]&&(settingsOptions[a3n]['onchange']!=undefined&&settingsOptions[a3n]['onchange'](clientSettings[a3l[a3m]]));}}}
// __UNIT__ u2267 [2438318,2438329) kind=var len=30
var clientSettingsVersion=0x2;
// __UNIT__ u2268 [2438329,2439028) kind=expr len=1165
applyClientSettings=function(a3l){var ayg=stringDecoderAlias;clientSettings==undefined&&(clientSettings=a3l);var a3m=Object[ayg(0x6a4)](a3l);for(var a3n=0x0;a3n<a3m['length'];a3n++){var a3o=a3m[a3n];clientSettings[a3o]=a3l[a3o];}clientSettings['version']=clientSettingsVersion,settingsDebounceTimer=0xc8;},window['getSettingValue']=function(settingsUpdate){var ayh=stringDecoderAlias;if(clientSettings!=undefined&&clientSettings[settingsUpdate]!=undefined)return clientSettings[settingsUpdate];for(var settingKeys=0x0;settingKeys<settingsOptions['length'];settingKeys++){if(settingsOptions[settingKeys]['id']==settingsUpdate)return settingsOptions[settingKeys][ayh(0xe5)];}},window['updateSettingValue']=function(a3l,a3m){var ayi=stringDecoderAlias,a3n={};a3n[a3l]=a3m,applyClientSettings(a3n);for(var a3o=0x0;a3o<settingsOptions[ayi(0x3a2)];a3o++){if(settingsOptions[a3o]['id']==a3l){settingsOptions[a3o][ayi(0xe5)]=a3m;settingsOptions[a3o]['onchange']!=undefined&&settingsOptions[a3o][ayi(0xc6c)](a3m);return;}}},buildSettingsPanel(settingsOptions),settingsPanelView=new domOverlayPositioner(document['getElementById'](stringDecoderAlias(0x101b)),0xc8,0x78,1.25);
// __UNIT__ u2269 [2439028,2439087) kind=var len=112
var initialUsernameOverlay=new domOverlayPositioner(document[stringDecoderAlias(0x8e2)]('uname'),0x0,-0x14,1.1);
// __UNIT__ u2270 [2439087,2439128) kind=expr len=115
usernameInputOverlay=initialUsernameOverlay,getCachedElementById('uname'),usernameInputOverlay['elem']['remove']();
// __UNIT__ u2271 [2439128,2439220) kind=var len=174
var enableAdSlots=!![],allowHttpAdSlots=!![],debugHideAdSlots=![],adBannerSlot=new domOverlayPositioner(document['createElement'](stringDecoderAlias(0xaca)),0x1869f,0x0,0x1);
// __UNIT__ u2272 [2439220,2439226) kind=expr len=31
homeAdBannerSlot1=adBannerSlot;
// __UNIT__ u2273 [2439226,2439405) kind=expr len=280
(isCrazyGames||!![])&&(enableAdSlots&&(document['body']['prepend'](adBannerSlot['elem']),adBannerSlot[stringDecoderAlias(0x8cb)]=adBannerSlot['elem']['parentNode']),adBannerSlot[stringDecoderAlias(0x774)]['id']='banner-home',adBannerSlot['elem']['style']['pointerEvents']='none');
// __UNIT__ u2274 [2439405,2439438) kind=expr len=72
debugHideAdSlots&&(adBannerSlot['s'][stringDecoderAlias(0x557)]='#F00');
// __UNIT__ u2275 [2439438,2439541) kind=expr len=168
adBannerSlot['s'][stringDecoderAlias(0xad0)]='300px',adBannerSlot['s']['height']='250px',adBannerSlot['s']['zIndex']=0x32,adBannerSlot['x']=0x0,adBannerSlot['y']=-0x64;
// __UNIT__ u2276 [2439541,2439610) kind=var len=112
var adBannerSlot=new domOverlayPositioner(document['createElement'](stringDecoderAlias(0xaca)),0x1869f,0x0,0x1);
// __UNIT__ u2277 [2439610,2439616) kind=expr len=31
homeAdBannerSlot2=adBannerSlot;
// __UNIT__ u2278 [2439616,2439797) kind=expr len=282
(isCrazyGames||!![])&&(enableAdSlots&&(document[stringDecoderAlias(0x1043)][stringDecoderAlias(0x10a3)](adBannerSlot['elem']),adBannerSlot['parent']=adBannerSlot['elem']['parentNode']),adBannerSlot['elem']['id']='banner-home2',adBannerSlot['elem']['style']['pointerEvents']='none');
// __UNIT__ u2279 [2439797,2439834) kind=expr len=91
debugHideAdSlots&&(adBannerSlot['s'][stringDecoderAlias(0x557)]=stringDecoderAlias(0xc07));
// __UNIT__ u2280 [2439834,2439940) kind=expr len=201
adBannerSlot['s']['width']=stringDecoderAlias(0x3cd),adBannerSlot['s'][stringDecoderAlias(0x300)]='250px',adBannerSlot['s'][stringDecoderAlias(0x9d7)]=0x32,adBannerSlot['x']=0x0,adBannerSlot['y']=0xc8;
// __UNIT__ u2281 [2439940,2439989) kind=if len=124
if(!isCrazyGames&&(isHttps||allowHttpAdSlots))var adSlotElem=homeAdBannerSlot1['elem'],adSlotElem=homeAdBannerSlot2['elem'];
// __UNIT__ u2282 [2439989,2439995) kind=expr len=18
respawnAdSlots=[];
// __UNIT__ u2283 [2439995,2440717) kind=for len=1279
for(var loopIndex=0x0;loopIndex<0x2;loopIndex++){var adBannerSlot=new domOverlayPositioner(document['createElement']('div'),0x1869f,0x0,0x1);(isCrazyGames||!![])&&(enableAdSlots&&(document[stringDecoderAlias(0x1043)]['prepend'](adBannerSlot['elem']),adBannerSlot['parent']=adBannerSlot['elem'][stringDecoderAlias(0x1040)]),adBannerSlot['elem']['id']=stringDecoderAlias(0x1005)+(loopIndex+0x1),adBannerSlot['elem']['style']['pointerEvents']='none');debugHideAdSlots&&(adBannerSlot['s'][stringDecoderAlias(0x557)]='#F00',adBannerSlot['s']['display']=stringDecoderAlias(0x24a),adBannerSlot['s']['visibility']='hidden',useDomOverlay&&adBannerSlot[stringDecoderAlias(0x774)]['remove']());adBannerSlot['s']['width']='300px',adBannerSlot['s']['height']='250px',adBannerSlot['s'][stringDecoderAlias(0x9d7)]=0x32,adBannerSlot['x']=0x0,adBannerSlot['y']=-0x96+0x12c*loopIndex;if(!isCrazyGames&&(isHttps||allowHttpAdSlots)){adBannerSlot['s'][stringDecoderAlias(0xad0)]='336px',adBannerSlot['s']['height']=stringDecoderAlias(0xd7f),adBannerSlot['y']=adBannerSlot['y']=-0xd7+0x12c*loopIndex;var RJ=adBannerSlot[stringDecoderAlias(0x774)];}else adBannerSlot['s'][stringDecoderAlias(0xecf)]='none',adBannerSlot['s']['visibility']=stringDecoderAlias(0x59d);respawnAdSlots['push'](adBannerSlot);}
// __UNIT__ u2284 [2440717,2440728) kind=var len=25
var lastHomeBannerMs=0x0;
// __UNIT__ u2285 [2440728,2441063) kind=function len=452
function refreshCrazyGamesBanners(){var ayj=stringDecoderAlias;if(!isCrazyGames)return;try{lastHomeBannerMs=Date['now'](),crazyGamesBanner['clearBanner'](ayj(0x8cd)),crazyGamesBanner['clearBanner'](ayj(0x481));var a3l={};a3l['id']='banner-home',a3l['width']=0x12c,a3l['height']=0xfa,crazyGamesBanner['requestBanner'](a3l);var a3m={};a3m['id']='banner-home2',a3m[ayj(0xad0)]=0x12c,a3m['height']=0xfa,crazyGamesBanner['requestBanner'](a3m);}catch(a3n){}}
// __UNIT__ u2286 [2441063,2441184) kind=function len=190
function clearHomeAdBanners(){var ayk=stringDecoderAlias;if(!isCrazyGames)return;try{crazyGamesBanner['clearBanner']('banner-home'),crazyGamesBanner['clearBanner'](ayk(0x481));}catch(a3l){}}
// __UNIT__ u2287 [2441184,2441315) kind=function len=203
function clearRespawnAdBanners(){var ayl=stringDecoderAlias;if(!isCrazyGames)return;try{crazyGamesBanner[ayl(0xf2d)]('banner-respawn-1'),crazyGamesBanner['clearBanner']('banner-respawn-2');}catch(a3l){}}
// __UNIT__ u2288 [2441315,2441326) kind=var len=28
var lastRespawnBannerMs=0x0;
// __UNIT__ u2289 [2441326,2441702) kind=expr len=510
refreshRespawnBanners=function(){var aym=stringDecoderAlias;if(!isCrazyGames)return;lastRespawnBannerMs=Date['now']();try{crazyGamesBanner['clearBanner']('banner-respawn-1'),crazyGamesBanner[aym(0xf2d)]('banner-respawn-2');var a3l={};a3l['id']='banner-respawn-1',a3l['width']=0x12c,a3l['height']=0xfa,crazyGamesBanner['requestBanner'](a3l);var a3m={};a3m['id']=aym(0x7fe),a3m['width']=0x12c,a3m['height']=0xfa,crazyGamesBanner['requestBanner'](a3m);}catch(a3n){console['error'](a3n),lastRespawnBannerMs=0x0;}};
// __UNIT__ u2290 [2441702,2441769) kind=var len=106
var positionKey=decodeByteString([-0x66,-0x65,-0x69,-0x5f,-0x6a,-0x5f,-0x65,-0x64]),occlusionQueryList=[];
// __UNIT__ u2291 [2441769,2441883) kind=function len=207
function clearOcclusionQueries(){var ayn=stringDecoderAlias;for(let a3l=0x0;a3l<occlusionQueryList['length'];a3l++){webglRenderer['getContext']()[ayn(0x1d1)](occlusionQueryList[a3l]);}occlusionQueryList=[];}
// __UNIT__ u2292 [2441883,2441977) kind=function len=222
function deleteOcclusionQuery(queryToRemove){let queryIndex=occlusionQueryList['indexOf'](queryToRemove);occlusionQueryInterface['deleteQuery'](occlusionQueryList[queryIndex]),occlusionQueryList['splice'](queryIndex,0x1);}
// __UNIT__ u2293 [2441977,2441990) kind=var len=50
var webglRendererCache=[],occlusionQueryInterface;
// __UNIT__ u2295 [2443399,2443454) kind=expr len=103
clientSettings['antialias']!=undefined?applyAntialias(clientSettings['antialias']):applyAntialias(![]);
// __UNIT__ u2296 [2443454,2443586) kind=var len=232
var rendererMaxTextures=webglRenderer['capabilities']['maxTextures'],RX=webglRenderer[stringDecoderAlias(0xb2e)](),rotationKey=decodeByteString([-0x68,-0x65,-0x6a,-0x57,-0x6a,-0x5f,-0x65,-0x64]),savedUserVolume=0x1,adMuteActive=![];
// __UNIT__ u2297 [2443586,2443747) kind=function len=248
function muteVolumeForAd(){var ayp=stringDecoderAlias;window['uiDisabled']=!![],adMuteActive=!![];for(var a3l=0x0;a3l<settingsOptions[ayp(0x3a2)];a3l++){settingsOptions[a3l]['id']=='volume'&&settingsOptions[a3l][ayp(0xc6c)](0x0);}adMuteActive=![];}
// __UNIT__ u2298 [2443747,2444027) kind=function len=451
function handleAdFinished(){var ayq=stringDecoderAlias;window['uiDisabled']=![];for(var a3l=0x0;a3l<settingsOptions[ayq(0x3a2)];a3l++){settingsOptions[a3l]['id']=='volume'&&settingsOptions[a3l][ayq(0xc6c)](savedUserVolume*0x64);}crazyGamesGame['removeEventListener']('adStarted',muteVolumeForAd),crazyGamesGame['removeEventListener']('adFinished',handleAdFinished),crazyGamesGame['removeEventListener']('adError',handleAdFinished),startMatchmaking();}
// __UNIT__ u2299 [2444027,2444043) kind=var len=44
var crosshairInstance=new createCrosshair();
// __UNIT__ u2300 [2444043,2444102) kind=function len=114
function setCrosshairVisible(visible){visible?crosshairInstance['hCVrxoItOl']():crosshairInstance['piylfJrZJ']();}
// __UNIT__ u2301 [2444102,2444474) kind=expr len=728
window['applyCrosshairSettings']=function(){var ayr=stringDecoderAlias,a3l=buildRgbString(crosshairRedByte,crosshairGreenByte,crosshairBlueByte),a3m=crosshairAlphaByte/0xff;crosshairInstance[ayr(0xab6)]!=undefined&&crosshairInstance['setColor'](a3l,a3m),crosshairInstance['setStyle']!=undefined&&crosshairInstance['setStyle'](0x1,crosshairThickness,crosshairLength),crosshairInstance[ayr(0x8e7)]!=undefined&&crosshairInstance['WAULgehsdg'](crosshairCenterDot),crosshairInstance['setOutline']!=undefined&&crosshairInstance['setOutline'](crosshairOutlineThickness,crosshairOutlineAlphaByte/0xff),setCrosshairVisible(crosshairInstance['mesh']['visible']);},window['applyCrosshairSettings'](),overlayLayer['add'](crosshairInstance);
// __UNIT__ u2302 [2444474,2444490) kind=var len=44
var hitmarkerOverlay=new hitmarkerDisplay();
// __UNIT__ u2303 [2444490,2444504) kind=expr len=38
overlayLayer['add'](hitmarkerOverlay);
// __UNIT__ u2304 [2444504,2444520) kind=var len=43
var slideSpeedLines=new speedLinesEffect();
// __UNIT__ u2305 [2444520,2444539) kind=expr len=57
overlayLayer[stringDecoderAlias(0x8da)](slideSpeedLines);
// __UNIT__ u2306 [2444539,2444557) kind=var len=47
var slideKeyPrompt=new slideKeyHint(uiToolkit);
// __UNIT__ u2307 [2444557,2444576) kind=expr len=52
!isMobilePhone&&overlayLayer['add'](slideKeyPrompt);
// __UNIT__ u2308 [2444576,2444606) kind=var len=93
var warningToast=new warningToastPopup(uiToolkit),objectiveMarker=new objectiveMarkerBadge();
// __UNIT__ u2309 [2444606,2444637) kind=expr len=82
objectiveMarker[stringDecoderAlias(0x9f7)](),overlayLayer['add'](objectiveMarker);
// __UNIT__ u2310 [2444637,2444653) kind=var len=53
var dominationPointMarkers=new capturePointDisplay();
// __UNIT__ u2311 [2444653,2444708) kind=expr len=157
dominationPointMarkers[stringDecoderAlias(0x9f7)](),overlayLayer[stringDecoderAlias(0x8da)](dominationPointMarkers),uiToolkit[stringDecoderAlias(0x4d0)]=0x0;
// __UNIT__ u2312 [2444708,2444743) kind=var len=96
var mouseInputHandler=new uiToolkit['mouse'](canvasRenderer),mouseInputList=[mouseInputHandler];
// __UNIT__ u2313 [2444743,2444809) kind=expr len=135
mouseInputHandler['x']=mouseInputHandler['y']=0xf4240,canvasRenderer['clearScreen']=![],canvasRenderer[stringDecoderAlias(0xa12)]=!![];
// __UNIT__ u2314 [2444809,2444834) kind=var len=42
var matchUiScene=new uiToolkit['scene']();
// __UNIT__ u2316 [2445107,2445162) kind=class len=55
class Se{#pf;#pfi=0x2a;static #psf;static #psfwi=0x2a;}
// __UNIT__ u2319 [2446421,2446432) kind=var len=31
var positionalAudioEnabled=![];
// __UNIT__ u2320 [2446432,2446896) kind=function len=897
function setPositionalAudioEnabled(soundEnabled){var ayw=stringDecoderAlias;soundEnabled==undefined&&(soundEnabled=positionalAudioEnabled);positionalAudioEnabled=soundEnabled;for(var audioSlotIndex=0x0;audioSlotIndex<positionalAudioList['length'];audioSlotIndex++){var soundEntry=positionalAudioList[audioSlotIndex];if(soundEntry['obj']==undefined)continue;soundEnabled?soundEntry['obj']['localVolume']=soundEntry[ayw(0x9a0)]['originalLocalVolume']:soundEntry['obj']['localVolume']=0x0;if(soundEntry['directional']){var a3o=soundEntry['at'];positionalAudioList[audioSlotIndex]['UDYrzIiOP']['setPosition'](a3o['x']*audioDistanceScale,a3o['y']*audioDistanceScale,a3o['z']*audioDistanceScale);}}for(var audioSlotIndex=0x0;audioSlotIndex<settingsOptions[ayw(0x3a2)];audioSlotIndex++){settingsOptions[audioSlotIndex]['id']=='volume'&&settingsOptions[audioSlotIndex]['onchange'](savedUserVolume*0x64);}}
// __UNIT__ u2321 [2446896,2446991) kind=var len=199
var activeDirectionalAudioCount,directionalAudioScanCount,injectedScriptElement,Sl,Sm,touchstartKey=decodeByteString([-0x6a,-0x65,-0x6b,-0x59,-0x5e,-0x69,-0x6a,-0x57,-0x68,-0x6a]),forceAudioSync=![];
// __UNIT__ u2323 [2450031,2450041) kind=var len=25
var listenerNoCapture={};
// __UNIT__ u2324 [2450041,2450162) kind=expr len=194
listenerNoCapture[decodeByteString([-0x59,-0x57,-0x66,-0x6a,-0x6b,-0x68,-0x5b])]=!![],listenerNoCapture[decodeByteString([-0x66,-0x57,-0x69,-0x69,-0x5f,-0x6c,-0x5b])]=!![],listenerNoCapture=![];
// __UNIT__ u2326 [2451648,2451664) kind=expr len=76
menuPlexusBackground=createPlexusBackground(),rankHelper=createRankHelper();
// __UNIT__ u2327 [2451664,2451681) kind=var len=68
var uiSceneManager=createMenuSceneManager(uiToolkit,canvasRenderer);
// __UNIT__ u2328 [2451681,2451695) kind=expr len=38
uiSceneManager['mice']=mouseInputList;
// __UNIT__ u2329 [2451695,2451767) kind=var len=173
var menuSceneList=uiSceneManager['scenes'],statusBannerContainer=new uiToolkit[(stringDecoderAlias(0x478))](),statusEffectPanel=new uiToolkit[(stringDecoderAlias(0x1a1))]();
// __UNIT__ u2331 [2451972,2452141) kind=var len=277
var statusBannerText=new uiToolkit[(stringDecoderAlias(0x5a6))]('',0x0,0x0,'#EEE','Verdana',0x4b,stringDecoderAlias(0x4b0),0x1,'center'),statusBannerShadowText=new uiToolkit[(stringDecoderAlias(0x5a6))]('',-0x5,0x5,'#444','Verdana',0x4b,stringDecoderAlias(0x4b0),0x1,'center');
// __UNIT__ u2333 [2452274,2452321) kind=var len=96
var documentBody=document['bo'+'dy'],reticleRedColor=stringDecoderAlias(0x65c),pillarboxBars=[];
// __UNIT__ u2334 [2452321,2452447) kind=expr len=192
pillarboxBars[stringDecoderAlias(0xf1e)](new uiToolkit['QtjDeukbWl'](0x0,0x0,0x0,0x762,'#000')),pillarboxBars[stringDecoderAlias(0xf1e)](new uiToolkit['QtjDeukbWl'](0x0,0x0,0x0,0x762,'#000'));
// __UNIT__ u2335 [2452447,2452676) kind=function len=352
function layoutPillarboxBars(){var ayB=stringDecoderAlias,a3l=0x3e8/0x2;pillarboxBars[0x0][ayB(0x215)]['x']=(canvasRenderer[ayB(0xe8e)]*0x2+a3l)/0x2,pillarboxBars[0x1][ayB(0x215)]['x']=(canvasRenderer[ayB(0x68b)]*0x2-a3l)/0x2,pillarboxBars[0x0]['width']=canvasRenderer['MBbucSOqeMu']*0x2-a3l,pillarboxBars[0x1][ayB(0xad0)]=pillarboxBars[0x0]['width'];}
// __UNIT__ u2336 [2452676,2452689) kind=var len=51
var reticleLayerA,reticleLayerB,cachedScopeOverlay;
// __UNIT__ u2342 [2457097,2457206) kind=var len=140
var addEventListenerKey=decodeByteString([-0x57,-0x5a,-0x5a,-0x3b,-0x6c,-0x5b,-0x64,-0x6a,-0x42,-0x5f,-0x69,-0x6a,-0x5b,-0x64,-0x5b,-0x68]);
// __UNIT__ u2343 [2457206,2457276) kind=if len=143
if(typeof ws_bindgen_tm=='undefined'||Math.abs(tamperReferenceTime-bootTimestampMs/tamperTimeDivisor)<tamperTolerance){tamperCheckPassed=true;}
// __UNIT__ u2344 [2457276,2457299) kind=var len=37
var SJ=0x98967f,lastElimBannerMs=0x0;
// __UNIT__ u2345 [2457299,2457984) kind=function len=869
function showElimBanner(victimName,scoreDelta,isHeadshot,streakCount){var ayF=stringDecoderAlias;if(nowMs==lastElimBannerMs)return;lastElimBannerMs=nowMs,elimBanner['qcXhPmLRUYO'](victimName,'+'+scoreDelta,isHeadshot,streakCount);return;SJ=0x0,nameRepositioner[ayF(0x152)][0x0]['text']=victimName,nameRepositioner['wAijZbUAD'][0x0]['text']=victimName,uiToolkit[ayF(0x217)](nameRepositioner,elimCanvas['width'],elimCanvas['height'],0x0,elimName['image']);return;nameRepositioner['add'](new uiToolkit['text'](victimName,-0xfa+0x4,0x0,'#EEE','Verdana',0x28,ayF(0x881),0x1,'left'));var a3p=uiToolkit['pANxEEFMRM'](nameRepositioner,0x1f4,0x5a,0x0,null,0x1);nameRepositioner['DgJwEtWhIm']=[],elimName['image']=applyImageOutline(a3p[ayF(0xbf7)],0x2,ayF(0xbe2),0.6),elimName[ayF(0xad0)]=elimName['image']['width']*0x2,elimName[ayF(0x300)]=elimName[ayF(0xbf7)][ayF(0x300)]*0x2;}
// __UNIT__ u2346 [2457984,2458153) kind=var len=324
var markerTriangleSize=0x14,triangleMarkerIcon=new uiToolkit['ycBClXLTJc'](0x0,0x0,[new uiToolkit['vFgdYWoMXeQ'](-markerTriangleSize/0x2,-markerTriangleSize/0x2),new uiToolkit['vFgdYWoMXeQ'](markerTriangleSize/0x2,-markerTriangleSize/0x2),new uiToolkit['vFgdYWoMXeQ'](0x0,markerTriangleSize/0x4)],stringDecoderAlias(0x52c));
// __UNIT__ u2347 [2458153,2458252) kind=expr len=222
triangleMarkerIcon=new uiToolkit['image'](applyImageOutline(uiToolkit['pANxEEFMRM'](triangleMarkerIcon,markerTriangleSize*0x2,markerTriangleSize*0x2,0x0,null,0x2)[stringDecoderAlias(0xbf7)],0x4,stringDecoderAlias(0xbe2)));
// __UNIT__ u2351 [2459730,2459954) kind=expr len=335
localPlayer['position']['y']=G1,localPlayer['position']['x']=G0+0xa,localPlayer['position']['z']=-0x4,localPlayer['position']['x']=-0x17,localPlayer['position']['y']=0x14,localPlayer['position']['z']=-0x5,localPlayer[stringDecoderAlias(0x215)]['x']=0x0,localPlayer[stringDecoderAlias(0x215)]['z']=0x0,localPlayer['position']['y']=0x32;
// __UNIT__ u2353 [2460070,2460084) kind=expr len=33
isMobilePhone&&(defaultFov=0x55);
// __UNIT__ u2355 [2460176,2460200) kind=expr len=48
worldCamera[stringDecoderAlias(0x215)]['z']=0x0;
// __UNIT__ u2357 [2460395,2460423) kind=expr len=60
nametagScene['add'](hudScene),hudScene['add'](weaponCamera);
// __UNIT__ u2359 [2461044,2461231) kind=expr len=292
document['body']['style'][stringDecoderAlias(0x79e)]='#111',document['body']['style'][stringDecoderAlias(0x6a7)]=0x0,document['body'][stringDecoderAlias(0xa92)][stringDecoderAlias(0xad0)]='100%',document['body'][stringDecoderAlias(0xa92)][stringDecoderAlias(0x300)]=stringDecoderAlias(0xac5);
// __UNIT__ u2364 [2462345,2462364) kind=expr len=43
worldCamera[stringDecoderAlias(0x8bc)]=0x1;
// __UNIT__ u2368 [2463341,2463469) kind=expr len=226
worldScene['oldAdd']=worldScene[stringDecoderAlias(0x8da)],worldScene['add']=function(a3l){var ayI=stringDecoderAlias;worldScene[ayI(0x381)](a3l);},worldScene['autoUpdate']=!![],webglRenderer['render'](worldScene,worldCamera);
// __UNIT__ u2369 [2463469,2463479) kind=var len=25
var scopeOverlayItems=[];
// __UNIT__ u2372 [2464091,2464105) kind=expr len=32
worldScene['add'](ambientLight);
// __UNIT__ u2374 [2464156,2464197) kind=expr len=65
effectComposer['QIlMuuaSb']=0x0,effectComposer['YESUYRTlrE']=0x0;
// __UNIT__ u2376 [2464240,2464296) kind=expr len=107
worldRenderPass['clearDepth']=!![],worldRenderPass['clear']=![],effectComposer['addPass'](worldRenderPass);
// __UNIT__ u2378 [2464336,2464355) kind=expr len=62
effectComposer[stringDecoderAlias(0x875)](horizontalBlurPass);
// __UNIT__ u2379 [2464355,2464365) kind=var len=29
var horizontalBlurDefines={};
// __UNIT__ u2380 [2464365,2464420) kind=expr len=154
horizontalBlurDefines[stringDecoderAlias(0x6f0)]=stringDecoderAlias(0xa41),horizontalBlurPass[stringDecoderAlias(0x52e)]['defines']=horizontalBlurDefines;
// __UNIT__ u2382 [2464460,2464504) kind=expr len=82
finalOutputPass['renderToScreen']=!![],effectComposer['addPass'](finalOutputPass);
// __UNIT__ u2383 [2464504,2464514) kind=var len=26
var finalOutputDefines={};
// __UNIT__ u2384 [2464514,2464564) kind=expr len=110
finalOutputDefines[stringDecoderAlias(0x6f0)]='1.0',finalOutputPass['material']['defines']=finalOutputDefines;
// __UNIT__ u2385 [2464564,2464579) kind=var len=59
var postProcessPasses=[horizontalBlurPass,finalOutputPass];
// __UNIT__ u2388 [2464694,2465108) kind=var len=611
var TC=![],spareStateSlotTD=0x0,mousemoveKey=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b,-0x63,-0x65,-0x6c,-0x5b]),pointermoveKey=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x63,-0x65,-0x6c,-0x5b]),pointerdownKey=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x5a,-0x65,-0x6d,-0x64]),pointerUpEventType=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x6b,-0x66]),mousePointerType=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b]),pointerTypeKey=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x4a,-0x6f,-0x66,-0x5b]),debugMarkerMaterialParams={};
// __UNIT__ u2389 [2465108,2465132) kind=expr len=62
debugMarkerMaterialParams[stringDecoderAlias(0x193)]=0xff0000;
// __UNIT__ u2391 [2465227,2465258) kind=expr len=47
gunshotDebugMarker['scale']['CNFryyAhIm'](0.1);
// __UNIT__ u2393 [2465315,2465427) kind=for len=216
for(var loopIndex=0x0;loopIndex<markerSphereGeometry['AUbXpMajF']['length'];loopIndex++){markerSphereGeometry['AUbXpMajF'][loopIndex]['y']<0x0&&(markerSphereGeometry['AUbXpMajF'][loopIndex]['y']-=debugMarkerLength);}
// __UNIT__ u2394 [2465427,2465437) kind=var len=33
var whiteMarkerMaterialParams={};
// __UNIT__ u2395 [2465437,2465479) kind=expr len=88
whiteMarkerMaterialParams['color']=0xffffff,whiteMarkerMaterialParams['dhHAhrXfI']=!![];
// __UNIT__ u2397 [2465526,2465567) kind=expr len=98
redMarkerMaterialParams['color']=0xff0000,redMarkerMaterialParams[stringDecoderAlias(0x6a3)]=!![];
// __UNIT__ u2399 [2465612,2465653) kind=expr len=100
blueMarkerMaterialParams[stringDecoderAlias(0x193)]=0xff,blueMarkerMaterialParams['dhHAhrXfI']=!![];
// __UNIT__ u2401 [2465698,2465740) kind=expr len=118
greenMarkerMaterialParams[stringDecoderAlias(0x193)]=0xff00,greenMarkerMaterialParams[stringDecoderAlias(0x6a3)]=!![];
// __UNIT__ u2403 [2465812,2465831) kind=expr len=35
markerMeshTemplate['ticksRed']=0x0;
// __UNIT__ u2404 [2465831,2465849) kind=expr len=55
showDebugMarker&&worldScene['add'](markerMeshTemplate);
// __UNIT__ u2405 [2465849,2465927) kind=var len=156
var debugMarkerSegment={'start':markerMeshTemplate[stringDecoderAlias(0x215)]['clone'](),'end':markerMeshTemplate['position'][stringDecoderAlias(0xae2)]()};
// __UNIT__ u2406 [2465927,2465951) kind=expr len=70
debugMarkerSegment[stringDecoderAlias(0x8f7)]['y']-=debugMarkerLength;
// __UNIT__ u2408 [2466084,2466209) kind=expr len=249
impactMarkerBox['scale']['CNFryyAhIm'](0.3),serverMarkerBox['scale'][stringDecoderAlias(0x4e6)](0.3),worldScene['add'](impactMarkerBox),worldScene['add'](serverMarkerBox),impactMarkerBox[stringDecoderAlias(0x5c5)]=![],serverMarkerBox['visible']=![];
// __UNIT__ u2410 [2466292,2466554) kind=expr len=519
markerSphereMesh['position']['y']=0.05,markerSphereMesh[stringDecoderAlias(0x1019)](),markerMeshTemplate['position']['y']=markerSphereMesh['position']['y']-debugMarkerLength*0.5,markerMeshTemplate['updateMatrix'](),markerMeshTemplate['RNQDluasaN']['GdTYEgIav'](markerMeshTemplate[stringDecoderAlias(0x46f)]),markerMeshTemplate['RNQDluasaN']['merge'](markerSphereMesh['RNQDluasaN'],markerSphereMesh['matrix']),markerMeshTemplate[stringDecoderAlias(0x215)]['y']=0x4,markerMeshTemplate[stringDecoderAlias(0x215)]['x']=0x2;
// __UNIT__ u2411 [2466554,2466578) kind=var len=75
var overheadMarkerTemplate=markerMeshTemplate[stringDecoderAlias(0xae2)]();
// __UNIT__ u2412 [2466578,2466596) kind=expr len=54
overheadMarkerTemplate['material']=blueMarkerMaterial;
// __UNIT__ u2413 [2466596,2466620) kind=var len=72
var eventMarkerTemplate=markerMeshTemplate[stringDecoderAlias(0xae2)]();
// __UNIT__ u2414 [2466620,2466638) kind=expr len=50
eventMarkerTemplate['material']=redMarkerMaterial;
// __UNIT__ u2415 [2466638,2466659) kind=var len=57
var trailingMarkerTemplate=markerMeshTemplate['clone']();
// __UNIT__ u2416 [2466659,2466677) kind=expr len=55
trailingMarkerTemplate['material']=greenMarkerMaterial;
// __UNIT__ u2417 [2466677,2466699) kind=var len=67
var overheadMarkerPool=[],eventMarkerPool=[],trailingMarkerPool=[];
// __UNIT__ u2418 [2466699,2466933) kind=for len=573
for(var loopIndex=0x0;loopIndex<0x14;loopIndex++){overheadMarkerPool[stringDecoderAlias(0xf1e)](overheadMarkerTemplate['clone']()),eventMarkerPool['push'](eventMarkerTemplate['clone']()),trailingMarkerPool[stringDecoderAlias(0xf1e)](trailingMarkerTemplate['clone']()),overheadMarkerPool[loopIndex][stringDecoderAlias(0x5c5)]=eventMarkerPool[loopIndex]['visible']=trailingMarkerPool[loopIndex]['visible']=![],worldScene[stringDecoderAlias(0x8da)](overheadMarkerPool[loopIndex]),worldScene['add'](eventMarkerPool[loopIndex]),worldScene['add'](trailingMarkerPool[loopIndex]);}
// __UNIT__ u2419 [2466933,2467000) kind=var len=97
var mouseDownEventType=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b,-0x5a,-0x65,-0x6d,-0x64]);
// __UNIT__ u2420 [2467000,2467045) kind=function len=46
function getNowMs(){return performance.now();}
// __UNIT__ u2421 [2467045,2467055) kind=var len=21
var perfMarkTimes={};
// __UNIT__ u2422 [2467055,2467102) kind=function len=80
function recordPerfMark(markName){perfMarkTimes[markName]=performance['now']();}
// __UNIT__ u2423 [2467102,2467221) kind=function len=191
function formatPerfElapsed(timerKey){var ayJ=stringDecoderAlias;if(perfMarkTimes[timerKey]==undefined)return;return timerKey+':\x20'+(performance[ayJ(0x1c2)]()-perfMarkTimes[timerKey])+'ms';}
// __UNIT__ u2426 [2472781,2473055) kind=var len=370
var toStringKey=decodeByteString([-0x6a,-0x65,-0x49,-0x6a,-0x68,-0x5f,-0x64,-0x5d]),nativeCodeKey=decodeByteString([-0x51,-0x64,-0x57,-0x6a,-0x5f,-0x6c,-0x5b,-0x16,-0x59,-0x65,-0x5a,-0x5b,-0x53]),prototypeKey=decodeByteString([-0x66,-0x68,-0x65,-0x6a,-0x65,-0x6a,-0x6f,-0x66,-0x5b]),webSocketKey=decodeByteString([-0x4d,-0x5b,-0x58,-0x49,-0x65,-0x59,-0x61,-0x5b,-0x6a]);
// __UNIT__ u2429 [2474576,2474627) kind=var len=105
var damageFlashOverlayA=new createDamageFlashOverlay(loadTextureCached('textures/noiserepeatable.webp'));
// __UNIT__ u2430 [2474627,2474641) kind=expr len=41
overlayLayer['add'](damageFlashOverlayA);
// __UNIT__ u2431 [2474641,2474671) kind=var len=99
var damageFlashOverlayB=new createDamageFlashOverlay(loadTextureCached(stringDecoderAlias(0x43a)));
// __UNIT__ u2432 [2474671,2474685) kind=expr len=41
overlayLayer['add'](damageFlashOverlayB);
// __UNIT__ u2433 [2474685,2474695) kind=var len=44
var activeDamageOverlay=damageFlashOverlayA;
// __UNIT__ u2434 [2474695,2474704) kind=if len=14
if(!isHttps){}
// __UNIT__ u2435 [2474704,2474732) kind=var len=52
var elimBanner=new bannerToast(undefined,uiToolkit);
// __UNIT__ u2436 [2474732,2474746) kind=expr len=32
overlayLayer['add'](elimBanner);
// __UNIT__ u2437 [2474746,2474769) kind=var len=50
var toastNotifier=new bannerToast(!![],uiToolkit);
// __UNIT__ u2438 [2474769,2474783) kind=expr len=35
overlayLayer['add'](toastNotifier);
// __UNIT__ u2441 [2474833,2474851) kind=var len=66
var damageDirectionIndicator=new damageDirectionWidget(uiToolkit);
// __UNIT__ u2442 [2474851,2474865) kind=expr len=46
overlayLayer['add'](damageDirectionIndicator);
// __UNIT__ u2443 [2474865,2474972) kind=var len=203
var holeTexture=loadTextureCached('textures/newhole.webp'),flashTexture=loadTextureCached('textures/flashes/flash04.webp'),loopTrailTexture=loadTextureWithRetry(stringDecoderAlias(0xebb),null,!![],!![]);
// __UNIT__ u2446 [2475240,2475505) kind=for len=721
for(let candidateIndex=0x0;candidateIndex<tamperCheckTargets['length'];candidateIndex++){windowAlias=tamperCheckTargets[candidateIndex];let candidateValue=windowAlias[addEventListenerKey][toStringKey]();tamperDetectedFlag=![];tamperTripFlag&&(tamperDetectedFlag=!![]);(candidateValue[indexOfKey](nativeCodeKey)==-0x1||candidateValue[indexOfKey](addEventListenerSrcKey)==-0x1)&&(tamperDetectedFlag=!![]);candidateValue['length']!=0x31&&candidateValue[stringDecoderAlias(0x3a2)]!=0x2d&&(tamperDetectedFlag=!![]);windowAlias[addEventListenerKey][hasOwnPropertyKey](toStringKey)&&(tamperDetectedFlag=!![]);prototypeKey in windowAlias[addEventListenerKey][toStringKey]&&(tamperDetectedFlag=!![]);if(!tamperDetectedFlag)break;}
// __UNIT__ u2447 [2475505,2475516) kind=var len=33
var browserExtensionDetected=![];
// __UNIT__ u2448 [2475516,2475540) kind=var len=60
let webSocketFuncSource=window[webSocketKey][toStringKey]();
// __UNIT__ u2449 [2475540,2475588) kind=expr len=144
(webSocketFuncSource[indexOfKey](nativeCodeKey)==-0x1||webSocketFuncSource[indexOfKey](webSocketSrcKey)==-0x1)&&(browserExtensionDetected=!![]);
// __UNIT__ u2450 [2475588,2475638) kind=expr len=106
webSocketFuncSource['length']!=0x2a&&webSocketFuncSource['length']!=0x26&&(browserExtensionDetected=!![]);
// __UNIT__ u2451 [2475638,2475668) kind=expr len=86
window[webSocketKey][hasOwnPropertyKey](toStringKey)&&(browserExtensionDetected=!![]);
// __UNIT__ u2452 [2475668,2475700) kind=expr len=83
prototypeKey in window[webSocketKey][toStringKey]&&(browserExtensionDetected=!![]);
// __UNIT__ u2453 [2475700,2475718) kind=var len=46
var webSocketConstructor=window[webSocketKey];
// __UNIT__ u2454 [2475718,2475732) kind=expr len=35
!isHttps&&(tamperDetectedFlag=![]);
// __UNIT__ u2455 [2475732,2475750) kind=if len=34
if(tamperDetectedFlag)var Uy=0x11;
// __UNIT__ u2456 [2475750,2475789) kind=var len=79
var smokeTexture=loadTextureCached('textures/smoke.webp'),smokeSpriteParams={};
// __UNIT__ u2457 [2475789,2475851) kind=expr len=147
smokeSpriteParams[stringDecoderAlias(0xff7)]=smokeTexture,smokeSpriteParams['transparent']=!![],smokeSpriteParams[stringDecoderAlias(0x8b8)]=0.002;
// __UNIT__ u2459 [2475931,2475993) kind=expr len=167
waterSmokeSpriteParams[stringDecoderAlias(0xff7)]=waterSmokeTexture,waterSmokeSpriteParams['transparent']=!![],waterSmokeSpriteParams[stringDecoderAlias(0x8b8)]=0.002;
// __UNIT__ u2462 [2476258,2476275) kind=var len=32
var UH,UI,maxGrassInstances=0x0;
// __UNIT__ u2464 [2476463,2476471) kind=expr len=30
initPickupMarkers(worldScene);
// __UNIT__ u2465 [2476471,2476487) kind=var len=46
var animatedMaterialList=[],freeMarkerPool=[];
// __UNIT__ u2470 [2478431,2478841) kind=for len=819
for(var variantIdx=0x0;variantIdx<0x2;variantIdx++){var UV,UW;variantIdx==0x0?(UV='#FFF',UW=whiteDigitSpriteCache):(UV=stringDecoderAlias(0x71b),UW=UU);for(var loopIndex=0x0;loopIndex<0xa;loopIndex++){continue;var scratchCanvasElement=document['createElement']('canvas');scratchCanvasElement['height']=0x50,scratchCanvasElement[stringDecoderAlias(0xad0)]=0x32;var hudCanvasContext=scratchCanvasElement[stringDecoderAlias(0x616)]('2d');hudCanvasContext[stringDecoderAlias(0xc43)]='bold\x2060px\x20Verdana',hudCanvasContext[stringDecoderAlias(0xfee)]=UV;var UX=hudCanvasContext[stringDecoderAlias(0x6e5)](loopIndex);hudCanvasContext['fillText'](loopIndex,scratchCanvasElement['width']/0x2-UX[stringDecoderAlias(0xad0)]/0x2,0x3c),applyImageOutline(scratchCanvasElement,0x5,'#000',0x1),UW[loopIndex]=scratchCanvasElement;}}
// __UNIT__ u2473 [2492364,2492380) kind=var len=54
var fallbackEffectInstance=new createEffectInstance();
// __UNIT__ u2474 [2492380,2492616) kind=function len=438
function acquireEffectInstance(type){let typeIndex=effectNameList.indexOf(type);if(type=='hole'&&effectMeshPool[typeIndex].count>=particleEffectDefs[type].count/2){return fallbackEffectInstance;}if(effectMeshPool[typeIndex].count>=particleEffectDefs[type].count){return fallbackEffectInstance;}let p=effectInstancePools[typeIndex][effectMeshPool[typeIndex].count++];p.index=effectMeshPool[typeIndex].count-1;p.matrixUpdate=true;return p;}
// __UNIT__ u2475 [2492616,2492646) kind=var len=66
var effectPhysicsClockMs=getNowMs(),effectPhysicsStepMs=0x3e8/0xf;
// __UNIT__ u2479 [2494907,2494995) kind=var len=154
var mouseupEventName=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b,-0x6b,-0x66]),grassEffectIndex=effectNameList['indexOf']('grass'),grassSwayPhase=0x0;
// __UNIT__ u2480 [2494995,2495328) kind=function len=524
function animateGrassSway(){var azN=stringDecoderAlias;grassSwayPhase+=frameDeltaMs/0x258;var meshEntry=effectMeshPool[grassEffectIndex],meshGeometry=meshEntry['RNQDluasaN'],a3q=0x1/3.5;meshGeometry['AUbXpMajF'][0x0]['z']=Math[azN(0xbd6)](grassSwayPhase)*a3q,meshGeometry['AUbXpMajF'][0x1]['z']=Math[azN(0xbd6)](grassSwayPhase+1.9)*a3q,meshGeometry[azN(0x8af)][0x0]['x']=-Math['sin'](grassSwayPhase/0x2)*a3q-0.5,meshGeometry['AUbXpMajF'][0x1]['x']=-Math['sin'](grassSwayPhase/0x2+1.9)*a3q+0.5,meshGeometry[azN(0xe32)]=!![];}
// __UNIT__ u2481 [2495328,2495969) kind=function len=851
function updateParticleEffects(){stepEffectPhysics();for(var w=0;w<effectNameList.length;w++){var typeConfig=particleEffectDefs[effectNameList[w]];let m=effectMeshPool[w];let pa=effectInstancePools[w];effectMeshPool[w].instanceMatrix.afCJVYrCGK=true;if(typeConfig.updateFrequency!==undefined){m.updateTick+=frameDeltaMs;if(m.updateTick<typeConfig.updateFrequency){continue;}m.updateTick=0;}for(var x=0;x<m.count;x++){let p=pa[x];if(effectUpdateCallbacks[w](p,x)){m.count--;pa[x]=pa[m.count];pa[m.count]=p;pa[x].index=x;m.offsets[x*2]=m.offsets[m.count*2];m.zaCEeRAJY[x]=m.zaCEeRAJY[m.count];p.index=m.count;pa[x].matrixUpdate=true;x--;}else{if(p.matrixUpdate&&!p.neverUpdateMatrix){p.updateMatrix();effectMeshPool[w].setMatrixAt(x,p.matrix);p.matrixUpdate=p.alwaysUpdateMatrix;}}}}animateGrassSway();skyboxMesh[rotationKey].y+=1/20000*frameDeltaMs/4;}
// __UNIT__ u2482 [2495969,2496481) kind=function len=697
function orientTracerEffect(effectNode,segStart,segEnd,beamLength,intensityScale){var azO=stringDecoderAlias;intensityScale==undefined&&(intensityScale=0x1);var a3t=effectNode;effectNode=effectNode[azO(0x8cb)],effectNode[azO(0x215)][azO(0x941)](segStart,segEnd),effectNode['position']['OpiuFvBcQd'](0.5),effectNode[azO(0xf5f)](segEnd),effectNode[azO(0xd6)]['z']=beamLength/0x8,effectNode[azO(0x1019)](),a3t['m1']['copy'](effectNode['matrix']),a3t[azO(0x19c)][azO(0x1019)](),a3t['m1']['multiply'](a3t['oZzvWrXBEG']['matrix']),a3t[azO(0x6eb)]['offsets'][a3t['index']*0x2]=Math['random'](),a3t[azO(0x6eb)]['zaCEeRAJY'][a3t[azO(0x4c0)]]=effectNode[azO(0xd6)]['z']/0x3*intensityScale*a3t['zaCEeRAJY'];}
// __UNIT__ u2483 [2496481,2496556) kind=var len=99
var VN=0x50,movementXKey=decodeByteString([-0x63,-0x65,-0x6c,-0x5b,-0x63,-0x5b,-0x64,-0x6a,-0x4e]);
// __UNIT__ u2486 [2497602,2497618) kind=var len=53
var adsZoomInterpolator=new makeLinearInterpolator();
// __UNIT__ u2488 [2497658,2497668) kind=var len=31
var crosshairMaterialParams={};
// __UNIT__ u2489 [2497668,2497689) kind=expr len=42
crosshairMaterialParams['color']=0xffffff;
// __UNIT__ u2492 [2497964,2497975) kind=var len=24
var crosshairSpread=0.5;
// __UNIT__ u2493 [2497975,2498195) kind=function len=371
function setCrosshairSpread(orbitRadius){crosshairSpread=orbitRadius;for(var childIndex=0x0;childIndex<crosshairBarGroup['children']['length'];childIndex++){var childNode=crosshairBarGroup['children'][childIndex];childNode['position']['x']=Math['cos'](childIndex*Math['PI']/0x2)*orbitRadius,childNode['position']['y']=Math['sin'](childIndex*Math['PI']/0x2)*orbitRadius;}}
// __UNIT__ u2494 [2498195,2498202) kind=expr len=36
setCrosshairSpread(crosshairSpread);
// __UNIT__ u2495 [2498202,2498213) kind=var len=11
var W1=0x0;
// __UNIT__ u2496 [2498213,2498239) kind=function len=62
function playSoundEffect(soundKey){playCachedSound(soundKey);}
// __UNIT__ u2497 [2498239,2498251) kind=var len=12
var W3=!![];
// __UNIT__ u2498 [2498251,2498270) kind=expr len=50
menuContentWrapper[stringDecoderAlias(0x40e)]=0x0;
// __UNIT__ u2501 [2501267,2501279) kind=var len=24
var deathFadeTimer=-0x1;
// __UNIT__ u2502 [2501279,2501321) kind=expr len=55
![]&&setTimeout(function(){triggerGameOver();},0x1388);
// __UNIT__ u2504 [2501448,2501541) kind=function len=240
function lerpSnapshotValue(startVal,endVal){if(entitySnapshotAgeMs>snapshotIntervalMs+0x5)return(endVal-startVal)/snapshotIntervalMs*(snapshotIntervalMs+0x5)+startVal;return(endVal-startVal)/snapshotIntervalMs*entitySnapshotAgeMs+startVal;}
// __UNIT__ u2505 [2501541,2501680) kind=function len=162
function distanceXZ(a3o,a3p){var azT=stringDecoderAlias;return Math[azT(0xba3)]((a3o['x']-a3p['x'])*(a3o['x']-a3p['x'])+(a3o['z']-a3p['z'])*(a3o['z']-a3p['z']));}
// __UNIT__ u2507 [2501778,2501853) kind=function len=155
function addTimedWorldObject(scheduledTask){scheduledTask['ticksLeft']=0xa*0x1e,worldScene['add'](scheduledTask),timedWorldObjects['push'](scheduledTask);}
// __UNIT__ u2508 [2501853,2501928) kind=var len=183
var BYTE_PER_RADIAN=0x80/Math['PI'],RADIAN_PER_BYTE=0x1/BYTE_PER_RADIAN,fireTriggerHeld=![],fireReleasePending=![],shootKeyHeld=![],adsKeyHeld=![],triggerRearmed=!![],keyNameTable={};
// __UNIT__ u2509 [2501928,2503372) kind=expr len=2623
keyNameTable['8']='Backspace',keyNameTable['9']=stringDecoderAlias(0xa2),keyNameTable['13']='Enter',keyNameTable['16']='Shift',keyNameTable['17']='Ctrl',keyNameTable['18']='Alt',keyNameTable['19']='Pause/Break',keyNameTable['20']='Capslock',keyNameTable['27']=stringDecoderAlias(0x83f),keyNameTable['32']='Space',keyNameTable['33']='Page\x20Up',keyNameTable['34']='Page\x20Down',keyNameTable['35']='End',keyNameTable['36']='Home',keyNameTable['37']='Left',keyNameTable['38']='Up',keyNameTable['39']=stringDecoderAlias(0xb7),keyNameTable['40']=stringDecoderAlias(0x74c),keyNameTable['43']='+',keyNameTable['44']='Print\x20Screen',keyNameTable['45']='Insert',keyNameTable['46']='Delete',keyNameTable['48']='0',keyNameTable['49']='1',keyNameTable['50']='2',keyNameTable['51']='3',keyNameTable['52']='4',keyNameTable['53']='5',keyNameTable['54']='6',keyNameTable['55']='7',keyNameTable['56']='8',keyNameTable['57']='9',keyNameTable['59']=';',keyNameTable['61']='=',keyNameTable['65']='A',keyNameTable['66']='B',keyNameTable['67']='C',keyNameTable['68']='D',keyNameTable['69']='E',keyNameTable['70']='F',keyNameTable['71']='G',keyNameTable['72']='H',keyNameTable['73']='I',keyNameTable['74']='J',keyNameTable['75']='K',keyNameTable['76']='L',keyNameTable['77']='M',keyNameTable['78']='N',keyNameTable['79']='O',keyNameTable['80']='P',keyNameTable['81']='Q',keyNameTable['82']='R',keyNameTable['83']='S',keyNameTable['84']='T',keyNameTable['85']='U',keyNameTable['86']='V',keyNameTable['87']='W',keyNameTable['88']='X',keyNameTable['89']='Y',keyNameTable['90']='Z',keyNameTable['106']='*',keyNameTable['107']='+',keyNameTable['109']='-',keyNameTable[stringDecoderAlias(0x8d5)]='.',keyNameTable[stringDecoderAlias(0xe9a)]='/',keyNameTable['112']='f1',keyNameTable[stringDecoderAlias(0x281)]='f2',keyNameTable['114']='f3',keyNameTable['115']='f4',keyNameTable['116']='f5',keyNameTable[stringDecoderAlias(0xf3b)]='f6',keyNameTable[stringDecoderAlias(0xbf3)]='f7',keyNameTable['119']='f8',keyNameTable['120']='f9',keyNameTable['121']='f10',keyNameTable['122']='f11',keyNameTable['123']=stringDecoderAlias(0x101f),keyNameTable['144']='Num\x20Lock',keyNameTable[stringDecoderAlias(0xc7)]='Scroll\x20Lock',keyNameTable['186']=';',keyNameTable[stringDecoderAlias(0xb0)]='=',keyNameTable['188']=',',keyNameTable['189']='-',keyNameTable['190']='.',keyNameTable[stringDecoderAlias(0x181)]='/',keyNameTable['192']='',keyNameTable[stringDecoderAlias(0x2ca)]='[',keyNameTable['220']='\x5c',keyNameTable['221']=']',keyNameTable[stringDecoderAlias(0x108a)]='\x27',keyCodeLabelTable=keyNameTable,keyCodeLabelTable[0xc0]=decodeByteString([-0x56]);
// __UNIT__ u2510 [2503372,2503430) kind=for len=108
for(var loopIndex=0x0;loopIndex<0x14;loopIndex++){keyCodeLabelTable[0x12c+loopIndex]='Mouse\x20'+loopIndex;}
// __UNIT__ u2511 [2503430,2503450) kind=var len=73
var keyCodeKeyList=getObjectKeys(keyCodeLabelTable),keyLabelToCodeMap={};
// __UNIT__ u2512 [2503450,2503518) kind=for len=169
for(var loopIndex=0x0;loopIndex<keyCodeKeyList['length'];loopIndex++){keyLabelToCodeMap[keyCodeLabelTable[keyCodeKeyList[loopIndex]]]=Number(keyCodeKeyList[loopIndex]);}
// __UNIT__ u2513 [2503518,2503528) kind=var len=21
var keyBindingMap={};
// __UNIT__ u2514 [2503528,2503796) kind=expr len=497
keyBindingMap['up']='W',keyBindingMap[stringDecoderAlias(0xa96)]='S',keyBindingMap[stringDecoderAlias(0xed8)]='A',keyBindingMap['right']='D',keyBindingMap['space']='Space',keyBindingMap['HpsuHliFMHL']='Shift',keyBindingMap["hRdQS9697"]='R',keyBindingMap['chat']=stringDecoderAlias(0xe6d),keyBindingMap['pause']=stringDecoderAlias(0x83f),keyBindingMap[stringDecoderAlias(0xab8)]='Tab',keyBindingMap['ads']='L',keyBindingMap['shoot']='K',keyBindingMap['MFUoomFzxq']='C',keyBindingMap['inspect']='F';
// __UNIT__ u2515 [2503796,2503806) kind=var len=37
var keyBindingMapAlias=keyBindingMap;
// __UNIT__ u2516 [2503806,2503836) kind=expr len=61
fullscreenEnabled&&(keyBindingMapAlias['MFUoomFzxq']='Ctrl');
// __UNIT__ u2517 [2503836,2503904) kind=if len=113
if(window[stringDecoderAlias(0x2c4)]!=window[stringDecoderAlias(0x1080)+stringDecoderAlias(0xa76)]['location']){}
// __UNIT__ u2518 [2503904,2503961) kind=expr len=88
window['location']['host']==stringDecoderAlias(0x63e)&&(keyBindingMapAlias['ads']='f7');
// __UNIT__ u2522 [2504026,2504045) kind=var len=64
var neutralInputState=new makeBaseInputState(),resetKeyNameList;
// __UNIT__ u2525 [2504961,2504995) kind=var len=51
var blockedCtrlKeyCodes=[0x53,0x57,0x44,0x46,0x74];
// __UNIT__ u2526 [2504995,2505028) kind=expr len=70
(isHttps||!![])&&blockedCtrlKeyCodes[stringDecoderAlias(0xf1e)](0x52);
// __UNIT__ u2527 [2505028,2505074) kind=var len=91
var scrollPreventKeys=[stringDecoderAlias(0xd24),'ArrowDown','\x20'],spaceRespawnLatch=![];
// __UNIT__ u2529 [2507148,2507159) kind=var len=15
var isDead=![];
// __UNIT__ u2530 [2507159,2507600) kind=expr len=615
documentBody['requestFullscreen']=documentBody[stringDecoderAlias(0x926)]||documentBody['webkitRequestFullscreen']||documentBody['msRequestFullscreen'],documentBody[stringDecoderAlias(0xf82)]=documentBody['requestFullscreen'],documentBody[stringDecoderAlias(0x926)]=function(){var azX=stringDecoderAlias;try{if(isIPad)return;document[azX(0x3a8)]==null&&document['webkitFullscreenElement']==null&&document[azX(0x2a9)]==null&&(mouseInputHandler[azX(0xf34)]=!![],documentBody['dqegDqxsC'](),isMobilePhone&&screen['orientation']['lock']!=undefined&&screen['orientation']['lock'](azX(0x88e)),isDead=!![]);}catch(a3o){}};
// __UNIT__ u2531 [2507600,2507617) kind=var len=31
var lastAdsToggleMs=getNowMs();
// __UNIT__ u2532 [2507617,2507874) kind=function len=404
function engageAdsAim(){var azY=stringDecoderAlias;if(localPlayer['zBgadyCVYk']==undefined)return;toggleAds?Math['abs'](frameTimestampMs-lastAdsToggleMs)>0x64&&(localPlayer["d2J6H770A10"]=!localPlayer["d2J6H770A10"],localPlayer['zBgadyCVYk']['OUsPgMLOT']=!localPlayer[azY(0xb16)]['OUsPgMLOT'],lastAdsToggleMs=frameTimestampMs):(localPlayer["d2J6H770A10"]=!![],localPlayer[azY(0xb16)]['OUsPgMLOT']=!![]);}
// __UNIT__ u2533 [2507874,2507998) kind=function len=186
function disengageAdsAim(){var azZ=stringDecoderAlias;if(localPlayer['zBgadyCVYk']==undefined)return;!toggleAds&&(localPlayer[azZ(0x879)]=![],localPlayer['zBgadyCVYk'][azZ(0x994)]=![]);}
// __UNIT__ u2535 [2508037,2508045) kind=if len=24
if(unadjustedMovement){}
// __UNIT__ u2536 [2508045,2508191) kind=function len=174
function isPointerLocked(){var aA0=stringDecoderAlias;if(document[aA0(0x9ed)]!=null||document['msPointerLockElement']!=null||document[aA0(0xd08)]!=null)return!![];return![];}
// __UNIT__ u2539 [2509004,2509121) kind=expr len=206
acquirePointerLock=requestPointerLockWithFallback,document[stringDecoderAlias(0xff)]=document[stringDecoderAlias(0xff)]||document[stringDecoderAlias(0xd9e)]||document['webkitExitPointerLock']||function(){};
// __UNIT__ u2541 [2509775,2510089) kind=expr len=497
document['addEventListener'](stringDecoderAlias(0x103b),handlePointerLockChange,![]),document['addEventListener'](stringDecoderAlias(0x1ab),handlePointerLockChange,![]),document['addEventListener'](stringDecoderAlias(0x7a9),handlePointerLockChange,![]),document['addEventListener']('pointerlockerror',handlePointerLockError,![]),document['addEventListener']('mozpointerlockerror',handlePointerLockError,![]),document[stringDecoderAlias(0xa9a)]('webkitpointerlockerror',handlePointerLockError,![]);
// __UNIT__ u2543 [2510169,2510188) kind=expr len=53
aimCameraRig[stringDecoderAlias(0xb80)](worldCamera);
// __UNIT__ u2545 [2510226,2510245) kind=expr len=52
uiSceneHolder[stringDecoderAlias(0x8da)](ui3DScene);
// __UNIT__ u2547 [2510284,2510312) kind=expr len=67
worldCamera['add'](weaponMountNode),aimCameraRig['add'](aimCamera);
// __UNIT__ u2550 [2510461,2510576) kind=var len=368
var aimSensitivityUnit=0x1/0x320,baseAimSensitivity=0x1/0.7,currentAimSensitivity=aimSensitivityUnit*baseAimSensitivity,adsSensitivityMultiplier=0x1,adsAimSensitivity=baseAimSensitivity*adsSensitivityMultiplier,adsZoomMin=0x1,weaponZoomFactor=2.1,playerPitchAngle=0x0,X8=new uiToolkit[(stringDecoderAlias(0x5ee))](),lastDeathLookInputMs=0x0,ignoreDeathLookSpikes=!![];
// __UNIT__ u2551 [2510576,2510630) kind=function len=222
function applyBaseSensitivity(newBaseSensitivity){var aspectRatio=currentAimSensitivity/baseAimSensitivity;baseAimSensitivity=newBaseSensitivity,currentAimSensitivity=aspectRatio*baseAimSensitivity,recalcAdsSensitivity();}
// __UNIT__ u2553 [2510733,2510782) kind=function len=77
function lookInputGate(){if(transitionFadeFactor<0.05)return 0x0;return 0x1;}
// __UNIT__ u2554 [2510782,2510813) kind=var len=55
var lookSwayAccumulator=new uiToolkit['vFgdYWoMXeQ']();
// __UNIT__ u2555 [2510813,2510848) kind=expr len=84
lookSwayAccumulator[stringDecoderAlias(0x78f)]=lookSwayAccumulator['rUAZVLknP']=0x0;
// __UNIT__ u2556 [2510848,2510859) kind=var len=26
var lookSwayDirtyFlag=![];
// __UNIT__ u2557 [2510859,2510985) kind=expr len=170
document['addEventListener']('keydown',function(keyEvent){handleKeyEvent(keyEvent);}),document['addEventListener']('keyup',function(keyEvent){handleKeyEvent(keyEvent);});
// __UNIT__ u2558 [2510985,2510996) kind=var len=30
var renderResolutionScale=0x1;
// __UNIT__ u2559 [2510996,2511070) kind=expr len=137
canvasRenderer['fKVPxWlcWa']=0x1,canvasRenderer['lowQuality']=0x1,canvasRenderer[stringDecoderAlias(0x977)]=canvasRenderer['fKVPxWlcWa'];
// __UNIT__ u2560 [2511070,2511092) kind=var len=36
var weaponModelSlots=new Array(0x5);
// __UNIT__ u2562 [2512204,2512211) kind=var len=23
var resizeGameRenderer;
// __UNIT__ u2565 [2513623,2513630) kind=expr len=34
resizeGameRenderer(webglRenderer);
// __UNIT__ u2566 [2513630,2513650) kind=var len=56
var resizeDebounceDelayMs=0x23,resizeDebounceTimer=null;
// __UNIT__ u2567 [2513650,2513769) kind=expr len=216
window['addEventListener']('resize',function(){resizeDebounceTimer!=null&&clearTimeout(resizeDebounceTimer),resizeDebounceTimer=setTimeout(function(){resizeGameRenderer(webglRenderer);},resizeDebounceDelayMs);},![]);
// __UNIT__ u2568 [2513769,2513930) kind=expr len=273
window['visualViewport']&&window['visualViewport']['addEventListener'](stringDecoderAlias(0x226),function(){resizeDebounceTimer!=null&&clearTimeout(resizeDebounceTimer),resizeDebounceTimer=setTimeout(function(){resizeGameRenderer(webglRenderer);},resizeDebounceDelayMs);});
// __UNIT__ u2570 [2514252,2514378) kind=function len=155
function cloneArrayBuffer(a3o){var aAa=stringDecoderAlias,a3p=new ArrayBuffer(a3o[aAa(0xd25)]);return new Uint8Array(a3p)['set'](new Uint8Array(a3o)),a3p;}
// __UNIT__ u2572 [2515287,2515459) kind=function len=302
function recoilKickEnvelope(easeTime){if(easeTime==-0x1)return 0x0;easeTime/=0x2;var easeResult,easeSplit=0.12;return easeTime<easeSplit?easeResult=easingFunctions['easeOutQuad'](easeTime/easeSplit):easeResult=0x1-easingFunctions['easeOutElastic']((easeTime-easeSplit)/(0x1-easeSplit)),easeResult/1.8;}
// __UNIT__ u2573 [2515459,2515602) kind=function len=221
function crosshairSpreadDecay(falloffInput){var aAe=stringDecoderAlias;if(falloffInput<0x0)return 0x0;falloffInput*=2.5;if(falloffInput>0x2)return 0x0;var a3p=(0x2-falloffInput)*0.88;return Math[aAe(0xbd6)](a3p*a3p)/1.7;}
// __UNIT__ u2574 [2515602,2515732) kind=function len=165
function attachAwpScope(parent,child){if(parent==undefined||child==undefined||parent['awp']!=undefined)return;parent['awp']=child,parent['uMpvMUJct']['add'](child);}
// __UNIT__ u2579 [2516089,2516096) kind=var len=7
var XD;
// __UNIT__ u2581 [2516396,2516426) kind=var len=87
var activeMixerList=[],spareStateSlotXG=0x0,spareStateSlotXH=0x0,pendingEntityQueue=[];
// __UNIT__ u2582 [2516426,2516470) kind=for len=81
for(var loopIndex=0x0;loopIndex<0x5;loopIndex++){pendingEntityQueue['push']([]);}
// __UNIT__ u2583 [2516470,2516480) kind=var len=25
var pendingCloneQueue={};
// __UNIT__ u2584 [2516480,2516558) kind=function len=124
function addCachedWeaponClone(a3o,a3p){var aAh=stringDecoderAlias,a3q=weaponMeshCache[a3o]['clone']();a3p[aAh(0x8da)](a3q);}
// __UNIT__ u2585 [2516558,2516894) kind=function len=644
function flushPendingWeaponClones(){var aAi=stringDecoderAlias,assetKeys=Object['keys'](pendingCloneQueue);for(var assetKeyIdx=0x0;assetKeyIdx<assetKeys['length'];assetKeyIdx++){if(weaponMeshCache[assetKeys[assetKeyIdx]]!==undefined&&pendingCloneQueue[assetKeys[assetKeyIdx]]!=null&&pendingCloneQueue[assetKeys[assetKeyIdx]]!=undefined){for(var itemIdx=0x0;itemIdx<pendingCloneQueue[assetKeys[assetKeyIdx]]['length'];itemIdx++){var a3r=pendingCloneQueue[assetKeys[assetKeyIdx]][itemIdx];addCachedWeaponClone(assetKeys[assetKeyIdx],a3r),a3r[aAi(0xf53)]&&a3r[aAi(0xf53)](a3r),a3r['loaded']=!![];}pendingCloneQueue[assetKeys[assetKeyIdx]]=null;}}}
// __UNIT__ u2588 [2518754,2519023) kind=function len=442
function updateEntityNametag(nametagEntity,nametagText){var aAn=stringDecoderAlias;if(nametagEntity==null||nametagEntity==undefined||nametagText==undefined||nametagEntity['threeNametag']==undefined)return;nametagEntity['threeNametag'][aAn(0x347)](nametagText,nametagEntity['PhbhpxFxPP'],localTeamId),nametagEntity[aAn(0x368)]==localTeamId&&localTeamId!=0x0?nametagEntity["r23ZS3L2g"][aAn(0x906)]():nametagEntity[aAn(0xc7e)]['oRdkBpYPvUp']();}
// __UNIT__ u2589 [2519023,2519205) kind=function len=298
function tweenOpacityToTarget(fadeTarget){var aAo=stringDecoderAlias;fadeTarget['actualOpacity']!=fadeTarget['EafIbhzQZQ']&&(cancelTween(fadeTarget,'opacity'),tweenProperty(fadeTarget,aAo(0x40e),fadeTarget['opacity'],fadeTarget['EafIbhzQZQ'],0xfa),fadeTarget[aAo(0x18e)]=fadeTarget['EafIbhzQZQ']);}
// __UNIT__ u2598 [2529581,2529604) kind=expr len=37
awpHipOffsetBias['OpiuFvBcQd'](0.15);
// __UNIT__ u2600 [2529668,2529939) kind=expr len=392
previewImageMap[stringDecoderAlias(0x83a)]='weapons/vector/vectorcomp.webp',previewImageMap['female']='character/female.webp',previewImageMap['ar']=stringDecoderAlias(0xa94),previewImageMap['rookie']='character/rookie.webp',previewImageMap['awp']='weapons/awp/newawpcomp.webp',previewImageMap['tuxedo']='character/tuxedo.webp',previewImageMap['shotgun']='weapons/shotgun/sh'+'otguncomp.webp';
// __UNIT__ u2601 [2529939,2529949) kind=var len=38
var weaponMaterialMap=previewImageMap;
// __UNIT__ u2602 [2529949,2530219) kind=if len=386
if(isMobilePhone){var Ya={};Ya['smg']=stringDecoderAlias(0x2ee),Ya[stringDecoderAlias(0xbca)]='character/female.webp',Ya['ar']='weapons/ar2/arcompmobile.webp',Ya['rookie']=stringDecoderAlias(0x1d0),Ya['awp']='weapons/awp/newawpcompmobile.webp',Ya[stringDecoderAlias(0x648)]='character/tuxedo.webp',Ya['shotgun']=stringDecoderAlias(0x510)+stringDecoderAlias(0xbaf),weaponMaterialMap=Ya;}
// __UNIT__ u2603 [2530219,2530278) kind=expr len=119
weaponMaterialMap[stringDecoderAlias(0xe6a)+'ayer']='character/sh'+stringDecoderAlias(0x86e)+stringDecoderAlias(0xb49);
// __UNIT__ u2604 [2530278,2530308) kind=var len=77
var weaponMaterialNames=Object[stringDecoderAlias(0x6a4)](weaponMaterialMap);
// __UNIT__ u2607 [2533693,2533754) kind=var len=84
var touchendKey=decodeByteString([-0x6a,-0x65,-0x6b,-0x59,-0x5e,-0x5b,-0x64,-0x5a]);
// __UNIT__ u2608 [2533754,2533837) kind=function len=172
function renderSkinPreviewSeeded(previewSkin,previewWeapon,seedValue){return renderWeaponSkinPreview(previewSkin,previewWeapon,~(Math['floor'](seedValue*0x2710)^0x22f41));}
// __UNIT__ u2609 [2533837,2533844) kind=var len=25
var defaultRigAnimations;
// __UNIT__ u2611 [2536375,2536480) kind=var len=149
var changedTouchesKey=decodeByteString([-0x59,-0x5e,-0x57,-0x64,-0x5d,-0x5b,-0x5a,-0x4a,-0x65,-0x6b,-0x59,-0x5e,-0x5b,-0x69]),useCompressedRigs=!![];
// __UNIT__ u2612 [2536480,2536697) kind=function len=259
function getRigAssetUrl(a3o){var aAI=stringDecoderAlias;if(a3o==aAI(0x648))return aAI(0xb4);if(a3o==aAI(0x2b6))return'character/compressed/shotgunpla'+aAI(0x3d2);if(useCompressedRigs)return'character/compressed/'+a3o+'out.gltf';return'character/'+a3o+'.glb';}
// __UNIT__ u2613 [2536697,2536720) kind=var len=77
var loadedPlayerRigCount=0x0,untexturedRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2614 [2536720,2536919) kind=expr len=355
untexturedRigLoader[stringDecoderAlias(0x199)](getRigAssetUrl(stringDecoderAlias(0x294)),function(a3o,a3p){var aAJ=stringDecoderAlias;untexturedRigLoader['dracoLoader'][aAJ(0x1052)](),untexturedRigLoader['dracoLoader']=null,finalizePlayerRig(a3o,0x1),loadedPlayerRigCount++;},undefined,function(a3o){var aAK=stringDecoderAlias;console[aAK(0x646)](a3o);});
// __UNIT__ u2615 [2536919,2536935) kind=var len=48
var tuxedoRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2616 [2536935,2537118) kind=expr len=297
tuxedoRigLoader[stringDecoderAlias(0x199)](getRigAssetUrl('tuxedo'),function(a3o,a3p){tuxedoRigLoader['dracoLoader']['dispose'](),tuxedoRigLoader['dracoLoader']=null,finalizePlayerRig(a3o,0x2),loadedPlayerRigCount++;},undefined,function(a3o){var aAL=stringDecoderAlias;console[aAL(0x646)](a3o);});
// __UNIT__ u2617 [2537118,2537134) kind=var len=48
var femaleRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2618 [2537134,2537328) kind=expr len=338
femaleRigLoader[stringDecoderAlias(0x199)](getRigAssetUrl(stringDecoderAlias(0x57b)),function(a3o,a3p){var aAM=stringDecoderAlias;femaleRigLoader[aAM(0x910)]['dispose'](),femaleRigLoader['dracoLoader']=null,finalizePlayerRig(a3o,0x0),loadedPlayerRigCount++;},undefined,function(a3o){var aAN=stringDecoderAlias;console[aAN(0x646)](a3o);});
// __UNIT__ u2619 [2537328,2537344) kind=var len=49
var shotgunRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2620 [2537344,2537530) kind=expr len=310
shotgunRigLoader['load'](getRigAssetUrl('shotgunplayer'),function(loadedAsset,unusedArg){shotgunRigLoader['dracoLoader']['dispose'](),shotgunRigLoader['dracoLoader']=null,finalizePlayerRig(loadedAsset,0x3),loadedPlayerRigCount++;},undefined,function(a3o){var aAO=stringDecoderAlias;console[aAO(0x646)](a3o);});
// __UNIT__ u2623 [2539094,2539128) kind=var len=60
var envmapTexture=loadTextureCached('textures/envmap.webp');
// __UNIT__ u2625 [2540557,2540600) kind=var len=56
var defaultAoCanvas=document['createElement']('canvas');
// __UNIT__ u2626 [2540600,2540629) kind=expr len=55
defaultAoCanvas['width']=defaultAoCanvas['height']=0x1;
// __UNIT__ u2627 [2540629,2540659) kind=var len=57
var defaultAoContext=defaultAoCanvas['getContext']('2d');
// __UNIT__ u2628 [2540659,2540713) kind=expr len=97
defaultAoContext[stringDecoderAlias(0xfee)]='#777',defaultAoContext['fillRect'](0x0,0x0,0x1,0x1);
// __UNIT__ u2630 [2540753,2541032) kind=function len=424
function collectWorldGeometries(sceneNode,geometryList){var aB1=stringDecoderAlias;geometryList==undefined&&(geometryList=[]);if(sceneNode['RNQDluasaN']!==undefined){var a3q=sceneNode[aB1(0xbac)]['clone']();a3q['GdTYEgIav'](sceneNode['matrixWorld']),geometryList['push'](a3q);}for(var a3r=0x0;a3r<sceneNode['children'][aB1(0x3a2)];a3r++){collectWorldGeometries(sceneNode['children'][a3r],geometryList);}return geometryList;}
// __UNIT__ u2631 [2541032,2541043) kind=var len=33
var mapContentGroupPreexists=![];
// __UNIT__ u2632 [2541043,2541077) kind=expr len=69
typeof mapContentGroup!='undefined'&&(mapContentGroupPreexists=!![]);
// __UNIT__ u2634 [2541116,2541130) kind=expr len=42
worldScene['add'](skyboxTransparentGroup);
// __UNIT__ u2636 [2541169,2541204) kind=expr len=84
mapContentGroup['mixers']=[],worldScene[stringDecoderAlias(0x8da)](mapContentGroup);
// __UNIT__ u2638 [2541243,2541282) kind=expr len=81
animatedObjectGroup['animatedObjects']=[],worldScene['add'](animatedObjectGroup);
// __UNIT__ u2639 [2541282,2541289) kind=var len=22
var occlusionCellData;
// __UNIT__ u2641 [2542188,2542272) kind=function len=237
function notifyLightmapLoaded(loadRequestId){if(loadRequestId!=undefined&&loadRequestId!==mapLoadRequestId)return;loadedTextureCount++,loadedTextureCount>=neededTextureCount&&neededTextureCount>0x0&&isMapLoadFinished&&finalizeMapLoad();}
// __UNIT__ u2642 [2542272,2542308) kind=var len=111
var useKtx2Lightmap=!![],useSmallLightmap=![],ktx2LoaderInstance,ktx2InitAttempted=![],ktx2FormatSupported=![];
// __UNIT__ u2644 [2542840,2542885) kind=function len=98
function isKtx2Ready(){return getKtx2Loader(),ktx2LoaderInstance!=undefined&&ktx2FormatSupported;}
// __UNIT__ u2646 [2543042,2543181) kind=for len=286
for(var loopIndexHv=0x0;loopIndexHv<hardpointMarkerGeometry[stringDecoderAlias(0xd8a)]['length'];loopIndexHv++){Math['abs'](hardpointMarkerGeometry[stringDecoderAlias(0xd8a)][loopIndexHv]['normal']['y'])>0.5&&(hardpointMarkerGeometry['faces']['splice'](loopIndexHv,0x1),loopIndexHv--);}
// __UNIT__ u2648 [2543226,2543302) kind=function len=157
function teamIdToColor(teamId){if(teamId==localTeamId)return localTeamColor;else return teamId==0x0?neutralTeamColor:enemyTeamColor;return neutralTeamColor;}
// __UNIT__ u2650 [2543879,2543895) kind=var len=51
var mapTextureCache={},defaultAmbientAudioEntry={};
// __UNIT__ u2651 [2543895,2543959) kind=expr len=160
defaultAmbientAudioEntry['directional']=![],defaultAmbientAudioEntry[stringDecoderAlias(0x77e)]=!![],defaultAmbientAudioEntry['file']=stringDecoderAlias(0xd57);
// __UNIT__ u2652 [2543959,2543977) kind=var len=74
var defaultPositionalAudioList=[defaultAmbientAudioEntry],mapLightList=[];
// __UNIT__ u2653 [2543977,2544023) kind=function len=75
function loadNeonMap(){var aB4=stringDecoderAlias;loadMap(aB4(0x9d2),0x0);}
// __UNIT__ u2655 [2589690,2589700) kind=var len=26
var cameraTrackVectors=[];
// __UNIT__ u2657 [2589795,2589805) kind=var len=28
var grayscaleCanvasCache={};
// __UNIT__ u2658 [2589805,2590108) kind=function len=338
function applyGrayscaleToCanvas(a3o,a3p){var aBC=stringDecoderAlias,a3q=a3p['getImageData'](0x0,0x0,a3o[aBC(0xad0)],a3o[aBC(0x300)]),a3r=a3q[aBC(0x7d1)];for(var a3s=0x0;a3s<a3r[aBC(0x3a2)];a3s+=0x4){var a3t=0.34*a3r[a3s]+0.5*a3r[a3s+0x1]+0.16*a3r[a3s+0x2];a3r[a3s]=a3t,a3r[a3s+0x1]=a3t,a3r[a3s+0x2]=a3t;}a3p['putImageData'](a3q,0x0,0x0);}
// __UNIT__ u2659 [2590108,2590620) kind=function len=858
function tileImage2x2ToScratchCanvas(a3o){var aBD=stringDecoderAlias,a3p=a3o[aBD(0xbf7)];scratchCanvasElement=document['createElement']('canvas'),scratchCanvasElement['width']=a3p['width']*0x2,scratchCanvasElement[aBD(0x300)]=a3p['height']*0x2;var a3q=scratchCanvasElement['getContext']('2d');a3q['drawImage'](a3p,0x0,0x0,scratchCanvasElement[aBD(0xad0)]/0x2,scratchCanvasElement['height']/0x2),a3q[aBD(0xccc)](a3p,scratchCanvasElement[aBD(0xad0)]/0x2,0x0,scratchCanvasElement['width']/0x2,scratchCanvasElement[aBD(0x300)]/0x2),a3q['drawImage'](a3p,0x0,scratchCanvasElement['height']/0x2,scratchCanvasElement['width']/0x2,scratchCanvasElement['height']/0x2),a3q['drawImage'](a3p,scratchCanvasElement['width']/0x2,scratchCanvasElement[aBD(0x300)]/0x2,scratchCanvasElement[aBD(0xad0)]/0x2,scratchCanvasElement['height']/0x2),a3o['image']=scratchCanvasElement;}
// __UNIT__ u2660 [2590620,2590923) kind=function len=402
function cloneCanvasResized(drawSource,snapSize){var aBE=stringDecoderAlias,a3q=document['createElement']('canvas');a3q['width']=drawSource[aBE(0xad0)],a3q[aBE(0x300)]=drawSource[aBE(0x300)];snapSize&&(a3q['width']=floorToPowerOfTwo(a3q['width']),a3q['height']=floorToPowerOfTwo(a3q['height']));var a3r=a3q['getContext']('2d');return a3r[aBE(0xccc)](drawSource,0x0,0x0,a3q['width'],a3q['height']),a3q;}
// __UNIT__ u2661 [2590923,2590934) kind=var len=27
var prevGamepadButtons=0x0;
// __UNIT__ u2662 [2590934,2591200) kind=function len=375
function cloneCanvasToSquarePot(canvasImageSrc){var aBF=stringDecoderAlias,a3p=document['createElement']('canvas');a3p['width']=Math[aBF(0x909)](floorToPowerOfTwo(canvasImageSrc['width']),floorToPowerOfTwo(canvasImageSrc['height'])),a3p[aBF(0x300)]=a3p['width'];var a3q=a3p['getContext']('2d');return a3q[aBF(0xccc)](canvasImageSrc,0x0,0x0,a3p['width'],a3p[aBF(0x300)]),a3p;}
// __UNIT__ u2663 [2591200,2591239) kind=function len=52
function isPowerOfTwoInt(num){return!(num&num-0x1);}
// __UNIT__ u2664 [2591239,2591371) kind=function len=162
function floorToPowerOfTwo(a3o){var aBG=stringDecoderAlias;for(var a3p=Math[aBG(0x326)](0x2,0xe);a3p>0x2;a3p=a3p>>>0x1){if((a3o&a3p)==a3p)return a3p;}return 0x1;}
// __UNIT__ u2665 [2591371,2591494) kind=function len=180
function replaceImageWithResizedClone(a3o){var aBH=stringDecoderAlias,a3p=cloneCanvasResized(a3o[aBH(0xbf7)],!![]),a3q=a3o['image']['src'];a3o[aBH(0xbf7)]=a3p,a3p[aBH(0x18d)]=a3q;}
// __UNIT__ u2666 [2591494,2591504) kind=var len=26
var aoMaterialRegistry=[];
// __UNIT__ u2668 [2592246,2592276) kind=var len=66
var pendingLookDelta=new uiToolkit[(stringDecoderAlias(0x5ee))]();
// __UNIT__ u2670 [2595672,2596166) kind=function len=660
function applyPaintedTextureStyle(paintTexture,paintLevel){var aBM=stringDecoderAlias;return;if(paintTexture['painted'])return;paintTexture['painted']=!![];var a3q=paintTexture[aBM(0xbf7)],a3r=paintTexture[aBM(0x18d)],a3s=0x2;paintLevel==undefined&&(paintLevel=0x3);if(paintTexture['image']['width']>=0x400){}a3r[aBM(0xfad)](aBM(0xb7c))!=-0x1&&(a3s=0x4);var a3t=typeof performance!='undefined'&&performance!=null&&performance['now']!=undefined?performance['now']():null;paintTexture['image']=applyPostProcessEffects(a3q,['render','paint','sepia','sharpen'],0x1,paintLevel),a3t!=null&&(paintAccumMs+=performance[aBM(0x1c2)]()-a3t),paintTexture[aBM(0x87b)]=0x2;}
// __UNIT__ u2672 [2597088,2597244) kind=function len=258
function tintClonedSprite(cloneTarget,secondArg,thirdArg,fourthArg,fifthArg){var argCount=arguments['length'],argsCopy=[];while(argCount--)argsCopy[argCount]=arguments[argCount];argsCopy[0x0]=argsCopy[0x0]['clone'](),tintSpriteImage['apply'](null,argsCopy);}
// __UNIT__ u2674 [2597856,2597882) kind=var len=47
var discSpriteSource=new uiToolkit['object']();
// __UNIT__ u2675 [2597882,2597940) kind=expr len=94
discSpriteSource[stringDecoderAlias(0x8da)](new uiToolkit['circle'](0x0,0x0,0x32,'#FFF',0.4));
// __UNIT__ u2676 [2597940,2598022) kind=var len=177
var discSprite=uiToolkit['pANxEEFMRM'](discSpriteSource,0x80,0x80,0x28),discSpriteCanvas=discSprite['image'],discSpriteContext=discSpriteCanvas[stringDecoderAlias(0x616)]('2d');
// __UNIT__ u2680 [2599334,2599385) kind=var len=75
var offscreenCanvas=document['createElement']('canvas'),skyboxTexture=null;
// __UNIT__ u2682 [2599686,2599696) kind=var len=24
var skyboxMapUniform={};
// __UNIT__ u2683 [2599696,2599714) kind=expr len=58
skyboxMapUniform[stringDecoderAlias(0x9c5)]=skyboxTexture;
// __UNIT__ u2684 [2599714,2599724) kind=var len=22
var skyboxUniforms={};
// __UNIT__ u2685 [2599724,2599737) kind=expr len=39
skyboxUniforms['map']=skyboxMapUniform;
// __UNIT__ u2686 [2599737,2599747) kind=var len=21
var skyboxDefines={};
// __UNIT__ u2687 [2599747,2599765) kind=expr len=44
skyboxDefines[stringDecoderAlias(0x1bf)]='';
// __UNIT__ u2689 [2599939,2600003) kind=expr len=131
skyboxMesh['material']=skyboxMaterial,applySkyboxTexture('textures/skybox.webp'),worldScene[stringDecoderAlias(0x8da)](skyboxMesh);
// __UNIT__ u2690 [2600003,2600029) kind=var len=66
var vlitagAdsEnabled=![],venatusAdsEnabled=!![],useDomOverlay=![];
// __UNIT__ u2691 [2600029,2600081) kind=expr len=82
location['host']==stringDecoderAlias(0x4d3)+'adshot.io'&&(venatusAdsEnabled=!![]);
// __UNIT__ u2692 [2600081,2600095) kind=expr len=34
!isHttps&&(venatusAdsEnabled=![]);
// __UNIT__ u2693 [2600095,2600106) kind=var len=25
var respawnAdsHidden=![];
// __UNIT__ u2694 [2600106,2600115) kind=if len=23
if(!vlitagAdsEnabled){}
// __UNIT__ u2695 [2600115,2600908) kind=if len=1209
if(!isCrazyGames&&!isMobilePhone){if(vlitagAdsEnabled){var injectedScriptElement=document[stringDecoderAlias(0x8b0)](stringDecoderAlias(0x102b));injectedScriptElement['src']=stringDecoderAlias(0xd66),document['head'][stringDecoderAlias(0xe3c)](injectedScriptElement);var injectedScriptElement=document['createElement'](stringDecoderAlias(0x102b));injectedScriptElement[stringDecoderAlias(0x18d)]='//cdn.vlitag.com/ata/adv/173dae6e-1be6-407d-b0f6-7b0abd082594.js',document['head']['appendChild'](injectedScriptElement);}else{if(venatusAdsEnabled){var injectedScriptElement=document[stringDecoderAlias(0x8b0)](stringDecoderAlias(0x102b));injectedScriptElement['src']=stringDecoderAlias(0xeba)+'adshot.io/index.js',document['head'][stringDecoderAlias(0xe3c)](injectedScriptElement),window[stringDecoderAlias(0xeb)]=window['__VM']||[],window['__VM'][stringDecoderAlias(0xf1e)](function(a3o,a3p){var aBR=stringDecoderAlias;try{a3p[aBR(0x535)]['get'](aBR(0x8f4))['display']('banner-home'),a3p[aBR(0x535)]['get'](aBR(0x8f4))['display']('banner-home2'),a3p['Config']['get']('mpu')['display']('banner-respawn-1'),a3p[aBR(0x535)]['get']('mpu')['display']('banner-respawn-2');}catch(a3q){console[aBR(0x646)](a3q);}});}}}
// __UNIT__ u2698 [2601035,2601178) kind=for len=296
for(var loopIndex=0x0;loopIndex<panoramaCylinderGeometry[stringDecoderAlias(0xd8a)]['length'];loopIndex++){Math[stringDecoderAlias(0x4fc)](panoramaCylinderGeometry['faces'][loopIndex]['normal']['y'])>0.5&&(panoramaCylinderGeometry['faces'][stringDecoderAlias(0x5de)](loopIndex,0x1),loopIndex--);}
// __UNIT__ u2699 [2601178,2601194) kind=var len=71
var panoramaTextureMap,sandPanoramaTexture,mountainsPanoramaTexture,ZS;
// __UNIT__ u2701 [2602648,2602728) kind=var len=150
var ZU=loadTextureWithRetry(stringDecoderAlias(0xf7a),function(a3o){a3o['repeat']['set'](0x3,0x1),mountainsPanoramaTexture=a3o,buildPanoramaMesh();});
// __UNIT__ u2702 [2602728,2602776) kind=expr len=113
loadTextureWithRetry(stringDecoderAlias(0x938),function(a3o){sandPanoramaTexture=a3o,buildPanoramaMesh();},!![]);
// __UNIT__ u2704 [2602976,2603012) kind=expr len=46
muzzleMountB['position']['set'](0x0,1.1,0.05);
// __UNIT__ u2706 [2603678,2603806) kind=function len=157
function aabbOverlapOnAxis(a3o,a3p,a3q){var aBT=stringDecoderAlias;return a3o[aBT(0x909)][a3q]>=a3p[aBT(0x40a)][a3q]&&a3o['min'][a3q]<=a3p[aBT(0x909)][a3q];}
// __UNIT__ u2707 [2603806,2604082) kind=function len=301
function aabbOverlap3D(a3o,a3p){var aBU=stringDecoderAlias;return!(a3o['max']['x']<a3p[aBU(0x40a)]['x']||a3o[aBU(0x40a)]['x']>a3p[aBU(0x909)]['x']||a3o['max']['y']<a3p[aBU(0x40a)]['y']||a3o['min']['y']>a3p['max']['y']||a3o[aBU(0x909)]['z']<a3p['min']['z']||a3o[aBU(0x40a)]['z']>a3p[aBU(0x909)]['z']);}
// __UNIT__ u2710 [2604209,2604222) kind=var len=48
var tamperDetectedSnapshot=!!tamperDetectedFlag;
// __UNIT__ u2711 [2604222,2604383) kind=function len=246
function getEntityById(lookupKey){var aBV=stringDecoderAlias;if(localPlayer['MqaFuSJOX']==lookupKey)return localPlayer;for(var a3p=0x0;a3p<entityList['length'];a3p++){if(entityList[a3p][aBV(0xd07)]==lookupKey)return entityList[a3p];}return null;}
// __UNIT__ u2712 [2604383,2604526) kind=function len=199
function collectAllPlayerIds(){var aBW=stringDecoderAlias,a3o=[];for(var a3p=0x0;a3p<entityList[aBW(0x3a2)];a3p++){a3o['push'](entityList[a3p][aBW(0xd07)]);}return a3o[aBW(0xf1e)](selfPlayerId),a3o;}
// __UNIT__ u2713 [2604526,2604679) kind=for len=314
for(var loopIndex=0x0;loopIndex<templateOrder['length'];loopIndex++){var templateEntry=templatesLive[templateOrder[loopIndex]];templateEntry['internalBuffer']=new ArrayBuffer(templateEntry[stringDecoderAlias(0xb95)]),templateEntry[stringDecoderAlias(0xc3b)]=new DataView(templateEntry[stringDecoderAlias(0xcb7)]);}
// __UNIT__ u2717 [2605435,2605565) kind=var len=197
var entityFactoryMap={'ZJqJUhuzUb':function(){var freshPlayerEntity={"vQ5Ra371n0":![],'hhUYpsfkFuA':![],"KWC92ef2Y9":new makeAnimState()};return setupPlayerEntity(freshPlayerEntity,![],![],0x1);}};
// __UNIT__ u2718 [2605565,2605602) kind=function len=79
function createEntityByType(entityType){return entityFactoryMap[entityType]();}
// __UNIT__ u2719 [2605602,2605614) kind=var len=25
var leaderboardDirty=![];
// __UNIT__ u2720 [2605614,2605646) kind=function len=62
function markLeaderboardDirty(){leaderboardDirty=!![];return;}
// __UNIT__ u2721 [2605646,2605788) kind=function len=203
function makeLeaderboardRow(){var statRow={};statRow['Name']='',statRow['K']=0x0,statRow['D']=0x0,statRow['Weapon']='ar',statRow['Ping']=0x0;let resultRow=statRow;return resultRow['HS%']='0%',resultRow;}
// __UNIT__ u2724 [2607618,2607650) kind=var len=71
var a0m=[],entityUpdateReceived=![],syncedSeededRng=new seededRandom();
// __UNIT__ u2726 [2609854,2610010) kind=function len=275
function clearHudFeedback(){var aC5=stringDecoderAlias;damageDirectionIndicator[aC5(0x402)](0x2710),elimBanner['update'](0x2710),damageFlashOverlayA['update'](0x2710),damageFlashOverlayB['update'](0x2710),hitmarkerOverlay['update'](0x2710),slideSpeedLines['update'](0x2710);}
// __UNIT__ u2780 [2638639,2638670) kind=expr len=31
setTimeout(function(){},0xfa0);
// __UNIT__ u2782 [2638743,2638744) kind=empty len=1
;
// __UNIT__ u2783 [2638744,2638757) kind=var len=28
var networkSendEnabled=!![];
// __UNIT__ u2784 [2638757,2638772) kind=expr len=35
isHttps&&(networkSendEnabled=!![]);
// __UNIT__ u2785 [2638772,2638792) kind=var len=33
var a0K=![],showHitboxMeshes=![];
// __UNIT__ u2786 [2638792,2638806) kind=expr len=32
isHttps&&(showHitboxMeshes=![]);
// __UNIT__ u2787 [2638806,2638824) kind=var len=47
var hitboxMeshList=[],mapFinalizeTweenState={};
// __UNIT__ u2788 [2638824,2638837) kind=expr len=31
mapFinalizeTweenState['a']=0x0;
// __UNIT__ u2789 [2638837,2638865) kind=var len=90
var mapFinalizeTween=mapFinalizeTweenState,mapFinalizePending=![],postProcessCompiled=![];
// __UNIT__ u2792 [2643511,2643577) kind=var len=104
var selfPlayerId=-0x1,gameWebSocket,a0V=null,lastEntitySnapshotMs=getNowMs(),a0W=new Array(0xa),a0X=0x0;
// __UNIT__ u2796 [2645006,2645066) kind=var len=154
var loadSessionState=null,nextLoadSessionId=0x0,loadSessionTimeoutMs=0x3a98,loadSessionHardTimeoutMs=0xafc8,maxFailedAssets=0xc,maxLoadSessionEvents=0x28;
// __UNIT__ u2797 [2645066,2645139) kind=function len=91
function getCurrentTimestampMs(){return Date['now']?Date['now']():new Date()['getTime']();}
// __UNIT__ u2798 [2645139,2645548) kind=function len=552
function formatErrorMessage(errValue){var aCQ=stringDecoderAlias;if(errValue==undefined||errValue==null)return'';var msgText='';try{if(typeof errValue=='string')msgText=errValue;else{if(errValue['message']!=undefined)msgText=errValue[aCQ(0xf83)];else{if(errValue[aCQ(0x8ce)]!=undefined)msgText=errValue[aCQ(0x8ce)];else errValue[aCQ(0xafb)]!=undefined?msgText=errValue['type']:msgText=JSON['stringify'](errValue);}}}catch(a3q){msgText=String(errValue);}return msgText=String(msgText||''),msgText[aCQ(0x3a2)]>0x1f4?msgText['substr'](0x0,0x1f4):msgText;}
// __UNIT__ u2800 [2646539,2646770) kind=function len=272
function getUrlHostPath(rawUrl){var aCS=stringDecoderAlias;if(rawUrl==undefined||rawUrl==null)return'';try{var a3p=new URL(String(rawUrl),location[aCS(0x9d9)]);return a3p['host']+a3p[aCS(0xdc4)];}catch(a3q){return String(rawUrl)['split']('?')[0x0][aCS(0xc96)](0x0,0xf0);}}
// __UNIT__ u2801 [2646770,2646914) kind=function len=199
function cloneJsonData(srcValue){if(srcValue==undefined||srcValue==null)return{};try{return JSON['parse'](JSON['stringify'](srcValue));}catch(cloneErr){return{'value':formatErrorMessage(srcValue)};}}
// __UNIT__ u2803 [2647360,2647733) kind=function len=596
function recordLoadMilestone(a3o,a3p){var aCU=stringDecoderAlias;if(loadSessionState==null||loadSessionState[aCU(0x942)])return;var a3q=getCurrentTimestampMs(),a3r=a3q-loadSessionState['startedAt'],a3s=cloneJsonData(a3p);loadSessionState[aCU(0xa0d)]=a3o,loadSessionState[aCU(0xdfa)]=a3q,loadSessionState['milestones'][a3o]=a3r;var a3t={};a3t['stage']=a3o,a3t['elapsedMs']=a3r,a3t['data']=a3s,loadSessionState['events']['push'](a3t),loadSessionState[aCU(0x352)][aCU(0x3a2)]>maxLoadSessionEvents&&loadSessionState['events']['splice'](0x0,loadSessionState['events']['length']-maxLoadSessionEvents);}
// __UNIT__ u2810 [2654154,2654261) kind=function len=222
function logMatchmakerFailure(message,stageOverride,options){if(loadSessionState==null||loadSessionState['completed'])return;recordLoadMilestone(stageOverride||message,options||{}),finalizeLoadSession('terminal',message);}
// __UNIT__ u2811 [2654261,2654667) kind=function len=625
function completeLoadSession(a3o){var aD3=stringDecoderAlias;if(loadSessionState==null)return;recordLoadMilestone(a3o||aD3(0x710),{}),a3o==aD3(0x259)&&finalizeLoadSession('complete','entered-pkghYgdlX'),loadSessionState[aD3(0x942)]=!![],loadSessionState[aD3(0xffe)]!=null&&(clearTimeout(loadSessionState[aD3(0xffe)]),loadSessionState['timeout']=null),loadSessionState['hardTimeout']!=null&&(clearTimeout(loadSessionState[aD3(0xeb9)]),loadSessionState[aD3(0xeb9)]=null),loadSessionState['gltfStallTimer']!=null&&(clearTimeout(loadSessionState['gltfStallTimer']),loadSessionState['gltfStallTimer']=null),loadSessionState=null;}
// __UNIT__ u2812 [2654667,2654963) kind=function len=543
function recordAssetFailure(assetKind,assetUrl,assetError,assetExtra){if(loadSessionState==null||loadSessionState['completed'])return;var assetMap=loadSessionState['map'],failedAssetEntry={'kind':assetKind,'url':getUrlHostPath(assetUrl),'error':formatErrorMessage(assetError)};assetExtra!=undefined&&(failedAssetEntry['extra']=cloneJsonData(assetExtra)),assetMap['failedAssetCount']++,assetMap['failedAssets']['length']<maxFailedAssets&&assetMap['failedAssets']['push'](failedAssetEntry),recordLoadMilestone('asset-failure',failedAssetEntry);}
// __UNIT__ u2814 [2658631,2658668) kind=if len=69
if(typeof profanityBlocklist==='undefined')var profanityBlocklist=[];
// __UNIT__ u2815 [2658668,2658946) kind=function len=421
function maskBlockedPhrase(inputText,bannedWord){var aDa=stringDecoderAlias,lowerText=inputText['toLowerCase']();while(lowerText['indexOf'](bannedWord)!=-0x1){var a3r=inputText['substr'](0x0,lowerText[aDa(0xfad)](bannedWord));a3r='*'['repeat'](bannedWord[aDa(0x3a2)]),a3r+=inputText[aDa(0xc96)](lowerText[aDa(0xfad)](bannedWord)+bannedWord['length']),inputText=a3r,lowerText=inputText['toLowerCase']();}return inputText;}
// __UNIT__ u2816 [2658946,2659485) kind=function len=920
function filterChatProfanity(filteredText){var aDb=stringDecoderAlias,wordList=filteredText['split']('\x20');filteredText='';for(let wordIndex=0x0;wordIndex<wordList['length'];wordIndex++){let lowerWord=wordList[wordIndex]['toLowerCase']();if(lowerWord['length']!=0x0){let matchStart=binarySearchBlocklist(profanityBlocklist,lowerWord['charAt'](0x0));for(let a3t=matchStart;a3t<profanityBlocklist['length'];a3t++){if(lowerWord[aDb(0x44d)](0x0)!=profanityBlocklist[a3t]['charAt'](0x0)&&a3t>matchStart+0x2)break;if(lowerWord==profanityBlocklist[a3t]){wordList[wordIndex]='*'['repeat'](wordList[wordIndex][aDb(0x3a2)]);break;}}}filteredText+=wordList[wordIndex],wordIndex!=wordList[aDb(0x3a2)]-0x1&&(filteredText+='\x20');}for(let a3u=0x0;a3u<profanityBlocklist['length'];a3u++){profanityBlocklist[a3u][aDb(0xfad)]('\x20')!=-0x1&&(filteredText=maskBlockedPhrase(filteredText,profanityBlocklist[a3u]));}return filteredText;}
// __UNIT__ u2817 [2659485,2659739) kind=function len=327
function binarySearchBlocklist(sortedArray,a3p){var aDc=stringDecoderAlias,a3q=0x0,a3r=sortedArray['length']-0x1,a3s=Math[aDc(0x5ce)]((a3r+a3q)/0x2);while(sortedArray[a3s]!=a3p&&a3q<a3r){if(a3p<sortedArray[a3s])a3r=a3s-0x1;else a3p>sortedArray[a3s]&&(a3q=a3s+0x1);a3s=Math['floor']((a3r+a3q)/0x2);}return Math['max'](a3s,0x0);}
// __UNIT__ u2818 [2659739,2659807) kind=var len=161
var matchmakingActive=![],matchmakerSocket=null,matchmakerHandshakeId=-0x1,matchmakerSendQueue=[],flushMatchmakerQueue=function(){},partyInviteUrl='',partyId='';
// __UNIT__ u2822 [2661614,2661636) kind=var len=66
var matchmakerPendingRequest=null,matchmakerReservationToken=null;
// __UNIT__ u2828 [2672336,2672379) kind=var len=125
var inputEventQueue=new createCustomList(),inputQueueBufferA=new createCustomList(),inputQueueBufferB=new createCustomList();
// __UNIT__ u2829 [2672379,2672471) kind=function len=122
function makeLookInputEvent(){var aDH=stringDecoderAlias,a3o={};return a3o['x']=0x0,a3o['y']=0x0,a3o[aDH(0x445)]=0x0,a3o;}
// __UNIT__ u2830 [2672471,2672524) kind=for len=101
for(var loopIndex=0x0;loopIndex<0x14;loopIndex++){inputEventQueue['push'](new makeLookInputEvent());}
// __UNIT__ u2835 [2677898,2678059) kind=function len=343
function mirrorForLeftHand(mirrorPoint){var aDV=stringDecoderAlias;if(!leftHandedEnabled)return mirrorPoint;return mirrorScratchVector['copy'](mirrorPoint),worldCamera['worldToLocal'](mirrorScratchVector),mirrorScratchVector['x']*=-0x1,worldCamera['localToWorld'](mirrorScratchVector),mirrorPoint[aDV(0x609)](mirrorScratchVector),mirrorPoint;}
// __UNIT__ u2842 [2687226,2687264) kind=var len=106
var splitOriginalMeshList=new createCustomList(),splitMeshPool=new createCustomList(),a2c,splitChildIndex;
// __UNIT__ u2844 [2687767,2688016) kind=function len=322
function releaseSplitMesh(splitEntry){var aE2=stringDecoderAlias;if(splitEntry['splitParent']==undefined){window['onerror']('removeSplitReplacement\x20-\x20splitParent\x20is\x20undefined');return;}splitEntry[aE2(0x76c)]['splitReplacement']=undefined,splitEntry[aE2(0x76c)]=undefined,splitMeshPool[aE2(0xf1e)](splitEntry);}
// __UNIT__ u2845 [2688016,2688448) kind=function len=786
function restoreSplitMeshes(parentNode){var aE3=stringDecoderAlias;for(var outerChildIndex=0x0;outerChildIndex<parentNode[aE3(0xc76)]['length'];outerChildIndex++){var currentChild=parentNode['children'][outerChildIndex];if(currentChild[aE3(0xfc2)]!=undefined)for(var innerChildIndex=0x0;innerChildIndex<parentNode['children']['length'];innerChildIndex++){if(parentNode['children'][innerChildIndex]['splitParent']==parentNode['children'][outerChildIndex]){var swappedChild=parentNode['children'][innerChildIndex];releaseSplitMesh(swappedChild),parentNode[aE3(0xc76)][innerChildIndex]=parentNode[aE3(0xc76)][outerChildIndex],parentNode['children'][outerChildIndex]=swappedChild,swappedChild['parent']=null,parentNode['children']['splice'](outerChildIndex,0x1),outerChildIndex--;break;}}}}
// __UNIT__ u2847 [2688926,2689327) kind=function len=557
function restoreSplitMeshesLegacy(treeNode){var aE5=stringDecoderAlias;for(var a3y=0x0;a3y<splitOriginalMeshList['length'];a3y++){var a3z=treeNode[aE5(0xc76)][a3y];if(a3z['splitReplacement']!=undefined)for(var a3A=0x0;a3A<splitOriginalMeshList[aE5(0x3a2)];a3A++){if(treeNode['children'][a3A]['splitParent']==treeNode['children'][a3y]){var a3B=splitOriginalMeshList['array'][a3A];releaseSplitMesh(a3B),treeNode['children'][a3A]=treeNode[aE5(0xc76)][a3y],treeNode['children'][a3y]=a3B,a3B[aE5(0x8cb)]=null,splitOriginalMeshList['remove'](a3y),a3y--;break;}}}}
// __UNIT__ u2848 [2689327,2689566) kind=var len=580
var frameCounter=0x0,activeCamera,overlayCompilePending=![],sparePerfSlotA2m=0x0,sparePerfSlotA2n=0x78,prevFrameStamp=null,prevHeapBytes=null,frameBeginStamp=null,lastRenderMs=null,parseAccumMs=0x0,compileAccumMs=0x0,paintAccumMs=0x0,drawAccumMs=0x0,uiAccumMs=0x0,slowPacketMaxMs=0x0,slowPacketType=null,renderStartStamp=0x0,lastUpdateMs=null,lastDrawMs=null,lastUiMs=null,knownShaderProgramCount=-0x1,frameStallReportCount=0x0,maxFrameStallReports=0x8,shaderCompileReportCount=0x0,maxShaderCompileReports=0x19,frameStallMinMs=0x64,frameStallMaxMs=0xbb8,knownShaderCacheKeys=null;
// __UNIT__ u2851 [2689859,2690508) kind=function len=885
function collectNewShaderPrograms(){var aE7=stringDecoderAlias;try{if(typeof webglRenderer=='undefined'||webglRenderer==null||webglRenderer['info']==undefined||webglRenderer['info']['programs']==undefined)return null;var a3x=webglRenderer[aE7(0x79c)]['programs'];if(knownShaderCacheKeys==null){knownShaderCacheKeys={};for(var a3y=0x0;a3y<a3x['length'];a3y++){knownShaderCacheKeys[a3x[a3y]['cache'+'Key']]=!![];}return knownShaderProgramCount=a3x[aE7(0x3a2)],null;}if(a3x['length']==knownShaderProgramCount)return null;knownShaderProgramCount=a3x[aE7(0x3a2)];var a3z=null;for(var a3A=0x0;a3A<a3x['length'];a3A++){var a3B=a3x[a3A]['cache'+aE7(0x3b8)];a3B!=undefined&&knownShaderCacheKeys[a3B]!==!![]&&(knownShaderCacheKeys[a3B]=!![],a3z==null&&(a3z=[]),a3z['push']({'shaderName':a3x[a3A][aE7(0x9ec)]||'','cacheKey':(''+a3B)[aE7(0x67c)](0x0,0xa0)}));}return a3z;}catch(a3C){return null;}}
// __UNIT__ u2853 [2691847,2691876) kind=var len=78
var longtaskReportCount=0x0,maxLongtaskReports=0xf,longtaskMinDurationMs=0x96;
// __UNIT__ u2856 [2715547,2715666) kind=expr len=160
(tamperDetectedSnapshot||browserExtensionDetected)&&alert('Please\x20disable\x20your\x20browser\x20extensions\x20in\x20order\x20to\x20play\x20this\x20ga'+'me');
// __UNIT__ u2857 [2715666,2715755) kind=var len=216
var frameTimeHistoryReady=!![],spareFrameTimeSlotA2W=0x0,frameTimeHistory=new Array(0x3c),frameTimeCursor=0x0,fireTickPhase=0x0,transitionFadeFactor=0x1,frameAvgWeight=0x1/frameTimeHistory[stringDecoderAlias(0x3a2)];
// __UNIT__ u2858 [2715755,2715809) kind=for len=108
for(var loopIndex=0x0;loopIndex<frameTimeHistory['length'];loopIndex++){frameTimeHistory[loopIndex]=16.667;}
// __UNIT__ u2860 [2716686,2716988) kind=function len=515
function smoothFrameDelta(a3y){var aEe=stringDecoderAlias;if(!frameTimeHistoryReady)return frameTimeHistory[frameTimeCursor++]=a3y,frameTimeCursor>frameTimeHistory[aEe(0x3a2)]&&(frameTimeHistoryReady=!![]),a3y;a3y=Math['min'](a3y,0x64),frameTimeHistory[frameTimeCursor]=a3y,frameTimeCursor=(frameTimeCursor+0x1)%frameTimeHistory[aEe(0x3a2)];var a3z=0x0;for(var a3A=0x0;a3A<frameTimeHistory['length'];a3A++){a3z+=frameTimeHistory[a3A];}a3z*=frameAvgWeight;if(Math['abs'](a3y-a3z)>0x8)return(a3y+a3z)/0x2;return a3z;}
// __UNIT__ u2863 [2734152,2734164) kind=expr len=52
tamperCheckPassed&&scheduleNextFrame(mainFrameLoop);
// __UNIT__ u2864 [2734164,2734289) kind=function len=206
function openDeathScreen(){var aEi=stringDecoderAlias;fireTriggerHeld=![],localPlayer[aEi(0x879)]=![],localPlayer['zBgadyCVYk']['OUsPgMLOT']=![],pointerUnlockExpected=!![],isDead=![],document[aEi(0xff)]();}
// __UNIT__ u2865 [2734289,2734349) kind=var len=67
var captchaHolderElement=document.getElementById('captcha-holder');
// __UNIT__ u2866 [2734349,2734374) kind=var len=27
var isHcaptchaLoaded=false;
// __UNIT__ u2869 [2734815,2734826) kind=var len=32
var postProcessComposerState={};
// __UNIT__ u2870 [2734826,2734849) kind=expr len=44
postProcessComposerState['initialized']=![];
// __UNIT__ u2871 [2734849,2734861) kind=var len=49
var postProcessComposer=postProcessComposerState;
// __UNIT__ u2873 [2735859,2735870) kind=var len=23
var shaderPassCache=[];
// __UNIT__ u2874 [2735870,2735985) kind=function len=154
function cacheShaderPass(a3y,a3z,a3A){var aEk=stringDecoderAlias,a3B={};a3B['pass']=a3y,a3B[aEk(0x9ec)]=a3z,a3B['vars']=a3A,shaderPassCache['push'](a3B);}
// __UNIT__ u2875 [2735985,2736145) kind=function len=239
function getCachedShaderPass(a3y,a3z){var aEl=stringDecoderAlias;for(var a3A=0x0;a3A<shaderPassCache[aEl(0x3a2)];a3A++){if(shaderPassCache[a3A][aEl(0x9ec)]==a3y&&shaderPassCache[a3A][aEl(0x10a6)]==a3z)return shaderPassCache[a3A]['pass'];}}
// __UNIT__ u2877 [2738346,2738354) kind=var len=28
var renderWeaponSkinPreview;
// __UNIT__ u2879 [2746678,2746690) kind=var len=38
var createPickupMarker,pickupTypeDefs;
