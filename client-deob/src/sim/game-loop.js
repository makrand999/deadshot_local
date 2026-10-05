// GENERATED from ../../raw/bundles/VM9.deob.txt — edit tools/, not this file.
// module: sim/game-loop.js | units: 2264 | span: [523,2801927) (interleaved; exact ranges are per-unit markers below)
// emission order within this file follows global order (sorted by start); rebundle with: node tools/bundle.mjs
// __UNIT__ u0003 [523,611) kind=function len=134
function decodeString(a,b){var c=getStringTable();return decodeString=function(d,e){d=d-0x7b;var f=c[d];return f;},decodeString(a,b);}
// __UNIT__ u0009 [205412,205425) kind=expr len=13
'use strict';
// __UNIT__ u0010 [205425,205443) kind=var len=23
var globalScope=window;
// __UNIT__ u0012 [382782,382795) kind=expr len=17
litegl=window.GL;
// __UNIT__ u0015 [422345,422346) kind=empty len=1
;
// __UNIT__ u0018 [422423,422430) kind=var len=20
var weakMapPolyfill;
// __UNIT__ u0041 [1463430,1463440) kind=var len=24
var basisFormatCodes={};
// __UNIT__ u0043 [1463868,1463878) kind=var len=23
var s3tcFormatEnums={};
// __UNIT__ u0053 [1625651,1625661) kind=var len=16
var neonSkin={};
// __UNIT__ u0055 [1625735,1625745) kind=var len=18
var rusticSkin={};
// __UNIT__ u0056 [1625745,1625781) kind=expr len=52
rusticSkin['name']="Royal",rusticSkin['rarity']=0x4;
// __UNIT__ u0057 [1625781,1625791) kind=var len=20
var birthdaySkin={};
// __UNIT__ u0059 [1625876,1625886) kind=var len=16
var hlwnSkin={};
// __UNIT__ u0061 [1625970,1625980) kind=var len=23
var hallow22SkinDef={};
// __UNIT__ u0063 [1626064,1626074) kind=var len=23
var summer24SkinDef={};
// __UNIT__ u0065 [1626160,1626170) kind=var len=26
var winter22SkinBundle={};
// __UNIT__ u0067 [1626250,1626260) kind=var len=26
var winter24SkinBundle={};
// __UNIT__ u0069 [1626346,1626356) kind=var len=20
var sillySkinDef={};
// __UNIT__ u0071 [1626431,1626441) kind=var len=19
var alezSkinDef={};
// __UNIT__ u0073 [1626515,1626525) kind=var len=24
var frostbiteSkinDef={};
// __UNIT__ u0075 [1626604,1626614) kind=var len=26
var hydrodipSkinPreset={};
// __UNIT__ u0077 [1626677,1626687) kind=var len=23
var geomVertexTempA={};
// __UNIT__ u0079 [1626774,1626784) kind=var len=25
var frostyGlowSkinDef={};
// __UNIT__ u0081 [1626870,1626880) kind=var len=23
var geomVertexTempC={};
// __UNIT__ u0083 [1626965,1626975) kind=var len=19
var horizonSkin={};
// __UNIT__ u0085 [1627057,1627067) kind=var len=18
var cloudySkin={};
// __UNIT__ u0087 [1627148,1627158) kind=var len=21
var quacksterSkin={};
// __UNIT__ u0089 [1627237,1627247) kind=var len=18
var safariSkin={};
// __UNIT__ u0090 [1627247,1627334) kind=expr len=119
safariSkin['name']="Saf"+'ari',safariSkin["useLink"]='saf'+'ari',safariSkin['rarity']=0x3,safariSkin["collection"]=0x0;
// __UNIT__ u0091 [1627334,1627344) kind=var len=17
var moneySkin={};
// __UNIT__ u0092 [1627344,1627403) kind=expr len=80
moneySkin['name']="Pay Day",moneySkin["rarity"]=0x3,moneySkin['collection']=0x0;
// __UNIT__ u0093 [1627403,1627413) kind=var len=20
var snowCamoSkin={};
// __UNIT__ u0094 [1627413,1627456) kind=expr len=63
snowCamoSkin['name']='Snow\x20Camo',snowCamoSkin['rarity']=0x3;
// __UNIT__ u0095 [1627456,1627466) kind=var len=17
var astroSkin={};
// __UNIT__ u0096 [1627466,1627502) kind=expr len=50
astroSkin['name']="Astro",astroSkin['rarity']=0x3;
// __UNIT__ u0097 [1627502,1627512) kind=var len=17
var prismSkin={};
// __UNIT__ u0098 [1627512,1627572) kind=expr len=81
prismSkin["name"]="Gemstone",prismSkin['rarity']=0x2,prismSkin['collection']=0x0;
// __UNIT__ u0099 [1627572,1627582) kind=var len=18
var cherrySkin={};
// __UNIT__ u0100 [1627582,1627641) kind=expr len=83
cherrySkin['name']='Blossom',cherrySkin["rarity"]=0x2,cherrySkin['collection']=0x0;
// __UNIT__ u0101 [1627641,1627651) kind=var len=17
var vaporSkin={};
// __UNIT__ u0102 [1627651,1627712) kind=expr len=82
vaporSkin['name']="Vaporwave",vaporSkin['rarity']=0x2,vaporSkin["collection"]=0x0;
// __UNIT__ u0103 [1627712,1627722) kind=var len=17
var swirlSkin={};
// __UNIT__ u0104 [1627722,1627758) kind=expr len=50
swirlSkin['name']='Swirl',swirlSkin["rarity"]=0x2;
// __UNIT__ u0105 [1627758,1627768) kind=var len=20
var splatterSkin={};
// __UNIT__ u0106 [1627768,1627805) kind=expr len=57
splatterSkin['name']='Marble',splatterSkin['rarity']=0x2;
// __UNIT__ u0107 [1627805,1627815) kind=var len=17
var baconSkin={};
// __UNIT__ u0108 [1627815,1627872) kind=expr len=78
baconSkin['name']='Bacon',baconSkin["rarity"]=0x1,baconSkin['collection']=0x0;
// __UNIT__ u0109 [1627872,1627882) kind=var len=17
var tigerSkin={};
// __UNIT__ u0110 [1627882,1627940) kind=expr len=79
tigerSkin['name']='Tigris',tigerSkin['rarity']=0x1,tigerSkin['collection']=0x0;
// __UNIT__ u0111 [1627940,1627950) kind=var len=18
var carbonSkin={};
// __UNIT__ u0112 [1627950,1628017) kind=expr len=91
carbonSkin["name"]='Carbon\x20Fiber',carbonSkin['rarity']=0x1,carbonSkin["collection"]=0x0;
// __UNIT__ u0113 [1628017,1628027) kind=var len=17
var linenSkin={};
// __UNIT__ u0114 [1628027,1628093) kind=expr len=87
linenSkin['name']='Fresh\x20Linen',linenSkin['rarity']=0x1,linenSkin['collection']=0x0;
// __UNIT__ u0115 [1628093,1628103) kind=var len=21
var greenCamoSkin={};
// __UNIT__ u0116 [1628103,1628144) kind=expr len=63
greenCamoSkin['name']="Green Camo",greenCamoSkin["rarity"]=0x1;
// __UNIT__ u0117 [1628144,1628154) kind=var len=19
var redCamoSkin={};
// __UNIT__ u0118 [1628154,1628196) kind=expr len=60
redCamoSkin["name"]='Red\x20Camo',redCamoSkin['rarity']=0x1;
// __UNIT__ u0119 [1628196,1628206) kind=var len=19
var defaultSkin={};
// __UNIT__ u0121 [1628283,1628293) kind=var len=17
var skinTable={};
// __UNIT__ u0122 [1628293,1628864) kind=expr len=1159
skinTable["matrix"]=matrixSkin,skinTable['neon']=neonSkin,skinTable["rustic"]=rusticSkin,skinTable["birthday"]=birthdaySkin,skinTable['hlwn']=hlwnSkin,skinTable['hallow22']=hallow22SkinDef,skinTable['summer']=summer24SkinDef,skinTable['winter']=winter22SkinBundle,skinTable["winter2024"]=winter24SkinBundle,skinTable['silly']=sillySkinDef,skinTable['alez']=alezSkinDef,skinTable['ice']=frostbiteSkinDef,skinTable["hydro"]=hydrodipSkinPreset,skinTable["scanline"]=geomVertexTempA,skinTable["frostyglow"]=frostyGlowSkinDef,skinTable['neonpulse']=geomVertexTempC,skinTable["horizon"]=horizonSkin,skinTable['cloudy']=cloudySkin,skinTable["quackster"]=quacksterSkin,skinTable['safari']=safariSkin,skinTable['money']=moneySkin,skinTable["snowcamo"]=snowCamoSkin,skinTable['astro']=astroSkin,skinTable["prism"]=prismSkin,skinTable['cherry']=cherrySkin,skinTable['vapor']=vaporSkin,skinTable["swirl"]=swirlSkin,skinTable["splatter"]=splatterSkin,skinTable['bacon']=baconSkin,skinTable['tiger']=tigerSkin,skinTable['carbon']=carbonSkin,skinTable["linen"]=linenSkin,skinTable['greencamo']=greenCamoSkin,skinTable["redcamo"]=redCamoSkin,skinTable["default"]=defaultSkin;
// __UNIT__ u0123 [1628864,1628880) kind=var len=52
var skinTableRef=skinTable,equippedDefaultSkinAr={};
// __UNIT__ u0124 [1628880,1628934) kind=expr len=111
equippedDefaultSkinAr['name']='default',equippedDefaultSkinAr['weapon']='ar',equippedDefaultSkinAr['wear']=0x0;
// __UNIT__ u0125 [1628934,1628944) kind=var len=22
var defaultSkinSmg={};
// __UNIT__ u0126 [1628944,1628999) kind=expr len=91
defaultSkinSmg['name']="default",defaultSkinSmg["weapon"]='smg',defaultSkinSmg['wear']=0x0;
// __UNIT__ u0127 [1628999,1629009) kind=var len=22
var defaultSkinAwp={};
// __UNIT__ u0128 [1629009,1629064) kind=expr len=91
defaultSkinAwp["name"]='default',defaultSkinAwp['weapon']='awp',defaultSkinAwp["wear"]=0x0;
// __UNIT__ u0129 [1629064,1629074) kind=var len=26
var defaultSkinShotgun={};
// __UNIT__ u0130 [1629074,1629133) kind=expr len=107
defaultSkinShotgun['name']='default',defaultSkinShotgun['weapon']="shotgun",defaultSkinShotgun["wear"]=0x0;
// __UNIT__ u0131 [1629133,1629218) kind=var len=185
var defaultEquippedSkins=[equippedDefaultSkinAr,defaultSkinSmg,defaultSkinAwp,defaultSkinShotgun],weaponKeys=['smg','ar','awp',"shotgun"],randomWeaponNames=['smg','ar',"awp",'shotgun'];
// __UNIT__ u0133 [1629844,1629931) kind=function len=115
function pickLowerRarity(a3i,a3j){var anv=stringDecoderAlias;if(a3i['rarity']<a3j["rarity"])return a3i;return a3j;}
// __UNIT__ u0135 [1630134,1632944) kind=var len=2832
const blurMulTable=[0x200,0x200,0x1c8,0x200,0x148,0x1c8,0x14f,0x200,0x195,0x148,0x10f,0x1c8,0x184,0x14f,0x124,0x200,0x1c6,0x195,0x16c,0x148,0x12a,0x10f,0x1f0,0x1c8,0x1a4,0x184,0x168,0x14f,0x138,0x124,0x111,0x200,0x1e2,0x1c6,0x1ac,0x195,0x17f,0x16c,0x159,0x148,0x138,0x12a,0x11c,0x10f,0x103,0x1f0,0x1db,0x1c8,0x1b5,0x1a4,0x194,0x184,0x176,0x168,0x15b,0x14f,0x143,0x138,0x12e,0x124,0x11a,0x111,0x109,0x200,0x1f1,0x1e2,0x1d4,0x1c6,0x1b9,0x1ac,0x1a1,0x195,0x18a,0x17f,0x175,0x16c,0x162,0x159,0x151,0x148,0x140,0x138,0x131,0x12a,0x123,0x11c,0x116,0x10f,0x109,0x103,0x1fb,0x1f0,0x1e5,0x1db,0x1d1,0x1c8,0x1be,0x1b5,0x1ac,0x1a4,0x19c,0x194,0x18c,0x184,0x17d,0x176,0x16f,0x168,0x162,0x15b,0x155,0x14f,0x149,0x143,0x13e,0x138,0x133,0x12e,0x129,0x124,0x11f,0x11a,0x116,0x111,0x10d,0x109,0x105,0x200,0x1f9,0x1f1,0x1e9,0x1e2,0x1db,0x1d4,0x1cd,0x1c6,0x1bf,0x1b9,0x1b3,0x1ac,0x1a6,0x1a1,0x19b,0x195,0x18f,0x18a,0x185,0x17f,0x17a,0x175,0x170,0x16c,0x167,0x162,0x15e,0x159,0x155,0x151,0x14c,0x148,0x144,0x140,0x13c,0x138,0x135,0x131,0x12d,0x12a,0x126,0x123,0x11f,0x11c,0x119,0x116,0x112,0x10f,0x10c,0x109,0x106,0x103,0x101,0x1fb,0x1f5,0x1f0,0x1eb,0x1e5,0x1e0,0x1db,0x1d6,0x1d1,0x1cc,0x1c8,0x1c3,0x1be,0x1ba,0x1b5,0x1b1,0x1ac,0x1a8,0x1a4,0x1a0,0x19c,0x198,0x194,0x190,0x18c,0x188,0x184,0x181,0x17d,0x179,0x176,0x172,0x16f,0x16b,0x168,0x165,0x162,0x15e,0x15b,0x158,0x155,0x152,0x14f,0x14c,0x149,0x146,0x143,0x140,0x13e,0x13b,0x138,0x136,0x133,0x130,0x12e,0x12b,0x129,0x126,0x124,0x121,0x11f,0x11d,0x11a,0x118,0x116,0x113,0x111,0x10f,0x10d,0x10b,0x109,0x107,0x105,0x103],blurShiftTable=[0x9,0xb,0xc,0xd,0xd,0xe,0xe,0xf,0xf,0xf,0xf,0x10,0x10,0x10,0x10,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x12,0x12,0x12,0x12,0x12,0x12,0x12,0x12,0x12,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x13,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x15,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x17,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18];
// __UNIT__ u0142 [1639812,1639911) kind=class len=110
class blurStackNode{constructor(){this['r']=0x0,this['g']=0x0,this['b']=0x0,this['a']=0x0,this['next']=null;}}
// __UNIT__ u0143 [1639911,1639921) kind=var len=20
var stackBlurLib={};
// __UNIT__ u0144 [1639921,1640055) kind=expr len=275
stackBlurLib['processImage']=stackBlurProcessImage,stackBlurLib['processCanvasRGBA']=stackBlurCanvasRGBA,stackBlurLib["processCanvasRGB"]=stackBlurCanvasRGB,stackBlurLib['processImageDataRGBA']=stackBlurImageDataRGBA,stackBlurLib["processImageDataRGB"]=stackBlurImageDataRGB;
// __UNIT__ u0145 [1640055,1640065) kind=var len=32
var stackBlurAlias=stackBlurLib;
// __UNIT__ u0150 [1704613,1704629) kind=var len=65
var skyboxShaderAlias=skyboxShader,meshBasicReplacementShader={};
// __UNIT__ u0152 [1704995,1705011) kind=var len=91
var meshBasicReplacementShaderAlias=meshBasicReplacementShader,skinnedBasicVertexShader={};
// __UNIT__ u0154 [1705688,1705704) kind=var len=84
var skinnedBasicVertexShaderAlias=skinnedBasicVertexShader,captureProgressShader={};
// __UNIT__ u0156 [1706315,1706331) kind=var len=77
var captureProgressShaderAlias=captureProgressShader,capturePennantShader={};
// __UNIT__ u0158 [1707292,1707308) kind=var len=75
var capturePennantShaderAlias=capturePennantShader,scopeBlurShaderAlias={};
// __UNIT__ u0162 [1715232,1715248) kind=var len=52
var waterShaderAlias=waterShader,waterfallShader={};
// __UNIT__ u0164 [1715893,1715909) kind=var len=57
var waterfallShaderAlias=waterfallShader,auroraShader={};
// __UNIT__ u0166 [1717059,1717075) kind=var len=56
var auroraShaderAlias=auroraShader,skyboxWaterShader={};
// __UNIT__ u0168 [1718018,1718034) kind=var len=69
var skyboxWaterShaderAlias=skyboxWaterShader,depthGrayscaleShader={};
// __UNIT__ u0170 [1718664,1718680) kind=var len=79
var depthGrayscaleShaderAlias=depthGrayscaleShader,defaultMapGeometryShader={};
// __UNIT__ u0172 [1721358,1721374) kind=var len=81
var defaultMapGeometryShaderAlias=defaultMapGeometryShader,gltfLightmapShader={};
// __UNIT__ u0174 [1721999,1722015) kind=var len=61
var gltfLightmapShaderAlias=gltfLightmapShader,nullShader={};
// __UNIT__ u0176 [1722394,1722410) kind=var len=55
var nullShaderAlias=nullShader,swayingFoliageShader={};
// __UNIT__ u0178 [1724640,1724656) kind=var len=75
var swayingFoliageShaderAlias=swayingFoliageShader,treeLeavesClipShader={};
// __UNIT__ u0180 [1725707,1725723) kind=var len=72
var treeLeavesClipShaderAlias=treeLeavesClipShader,waterScrollShader={};
// __UNIT__ u0182 [1731315,1731331) kind=var len=60
var waterScrollShaderAlias=waterScrollShader,bush2Shader={};
// __UNIT__ u0184 [1733042,1733058) kind=var len=48
var bush2ShaderAlias=bush2Shader,bush3Shader={};
// __UNIT__ u0186 [1734704,1734720) kind=var len=60
var bush3ShaderAlias=bush3Shader,transparentCutoutShader={};
// __UNIT__ u0188 [1735546,1735562) kind=var len=78
var transparentCutoutShaderAlias=transparentCutoutShader,dxtRedChannelTemp={};
// __UNIT__ u0190 [1736867,1736883) kind=var len=55
var flagShader=dxtRedChannelTemp,tarpsDynamicShader={};
// __UNIT__ u0192 [1738088,1738104) kind=var len=75
var tarpsDynamicShaderAlias=tarpsDynamicShader,tireTracksMultiplyShader={};
// __UNIT__ u0194 [1739151,1739167) kind=var len=82
var tireTracksMultiplyShaderAlias=tireTracksMultiplyShader,animatedGrassPreset={};
// __UNIT__ u0196 [1740282,1740298) kind=var len=67
var animatedGrassPresetAlias=animatedGrassPreset,aoMapShaderDef={};
// __UNIT__ u0198 [1742416,1742432) kind=var len=36
var ra=aoMapShaderDef,bushShader={};
// __UNIT__ u0200 [1743640,1743656) kind=var len=37
var bushShaderAlias=bushShader,rd={};
// __UNIT__ u0202 [1745969,1745985) kind=var len=30
var re=rd,trimSheet2Preset={};
// __UNIT__ u0206 [1758497,1758513) kind=var len=84
var multiTextureBlendShaderAlias=multiTextureBlendShaderDef,alphaCutoutShaderDef={};
// __UNIT__ u0208 [1760276,1760292) kind=var len=78
var alphaCutoutShaderAlias=alphaCutoutShaderDef,circularBlurDiffuseUniform={};
// __UNIT__ u0209 [1760292,1760309) kind=expr len=41
circularBlurDiffuseUniform['value']=null;
// __UNIT__ u0210 [1760309,1760319) kind=var len=31
var circularBlurStepUniform={};
// __UNIT__ u0211 [1760319,1760335) kind=expr len=37
circularBlurStepUniform["value"]=0x1;
// __UNIT__ u0212 [1760335,1760345) kind=var len=32
var circularBlurPassUniforms={};
// __UNIT__ u0213 [1760345,1760374) kind=expr len=118
circularBlurPassUniforms['tDiffuse']=circularBlurDiffuseUniform,circularBlurPassUniforms['h']=circularBlurStepUniform;
// __UNIT__ u0215 [1761614,1761631) kind=expr len=34
sphereRadiusSquared['value']=null;
// __UNIT__ u0216 [1761631,1761641) kind=var len=33
var horizontalBlurStepUniform={};
// __UNIT__ u0217 [1761641,1761657) kind=expr len=39
horizontalBlurStepUniform['value']=0x1;
// __UNIT__ u0218 [1761657,1761667) kind=var len=32
var horizontalBlurResUniform={};
// __UNIT__ u0219 [1761667,1761683) kind=expr len=38
horizontalBlurResUniform["value"]=0x1;
// __UNIT__ u0220 [1761683,1761693) kind=var len=34
var horizontalBlurPassUniforms={};
// __UNIT__ u0221 [1761693,1761735) kind=expr len=176
horizontalBlurPassUniforms['tDiffuse']=sphereRadiusSquared,horizontalBlurPassUniforms['h']=horizontalBlurStepUniform,horizontalBlurPassUniforms['res']=horizontalBlurResUniform;
// __UNIT__ u0223 [1762880,1762897) kind=expr len=40
finalOutputDiffuseUniform['value']=null;
// __UNIT__ u0224 [1762897,1762907) kind=var len=30
var finalOutputStepUniform={};
// __UNIT__ u0225 [1762907,1762923) kind=expr len=36
finalOutputStepUniform['value']=0x1;
// __UNIT__ u0226 [1762923,1762933) kind=var len=29
var finalOutputResUniform={};
// __UNIT__ u0227 [1762933,1762949) kind=expr len=35
finalOutputResUniform['value']=0x1;
// __UNIT__ u0228 [1762949,1762959) kind=var len=31
var finalOutputPassUniforms={};
// __UNIT__ u0229 [1762959,1763001) kind=expr len=167
finalOutputPassUniforms["tDiffuse"]=finalOutputDiffuseUniform,finalOutputPassUniforms['h']=finalOutputStepUniform,finalOutputPassUniforms["res"]=finalOutputResUniform;
// __UNIT__ u0231 [1764138,1764155) kind=expr len=36
sharpenDiffuseUniform['value']=null;
// __UNIT__ u0232 [1764155,1764165) kind=var len=28
var sharpenRadiusUniform={};
// __UNIT__ u0233 [1764165,1764181) kind=expr len=34
sharpenRadiusUniform['value']=0x4;
// __UNIT__ u0234 [1764181,1764191) kind=var len=27
var sharpenPassUniforms={};
// __UNIT__ u0235 [1764191,1764225) kind=expr len=105
sharpenPassUniforms["tDiffuse"]=sharpenDiffuseUniform,sharpenPassUniforms['radius']=sharpenRadiusUniform;
// __UNIT__ u0237 [1764966,1764983) kind=expr len=34
sepiaDiffuseUniform['value']=null;
// __UNIT__ u0238 [1764983,1764993) kind=var len=26
var sepiaRadiusUniform={};
// __UNIT__ u0239 [1764993,1765009) kind=expr len=32
sepiaRadiusUniform['value']=0x4;
// __UNIT__ u0240 [1765009,1765019) kind=var len=25
var sepiaPassUniforms={};
// __UNIT__ u0241 [1765019,1765053) kind=expr len=97
sepiaPassUniforms['tDiffuse']=sepiaDiffuseUniform,sepiaPassUniforms['radius']=sepiaRadiusUniform;
// __UNIT__ u0244 [1767091,1767107) kind=var len=53
var rK=grungeOverlayShaderDef,paintDiffuseUniform={};
// __UNIT__ u0245 [1767107,1767124) kind=expr len=34
paintDiffuseUniform['value']=null;
// __UNIT__ u0246 [1767124,1767134) kind=var len=26
var paintRadiusUniform={};
// __UNIT__ u0247 [1767134,1767150) kind=expr len=32
paintRadiusUniform['value']=0x4;
// __UNIT__ u0248 [1767150,1767160) kind=var len=27
var paintShaderUniforms={};
// __UNIT__ u0249 [1767160,1767194) kind=expr len=101
paintShaderUniforms['tDiffuse']=paintDiffuseUniform,paintShaderUniforms["radius"]=paintRadiusUniform;
// __UNIT__ u0251 [1770290,1770307) kind=expr len=37
kuwaharaDiffuseUniform['value']=null;
// __UNIT__ u0252 [1770307,1770317) kind=var len=24
var kuwaharaHUniform={};
// __UNIT__ u0253 [1770317,1770339) kind=expr len=36
kuwaharaHUniform['value']=0x1/0x200;
// __UNIT__ u0254 [1770339,1770349) kind=var len=29
var kuwaharaRadiusUniform={};
// __UNIT__ u0255 [1770349,1770365) kind=expr len=35
kuwaharaRadiusUniform["value"]=0x4;
// __UNIT__ u0256 [1770365,1770375) kind=var len=30
var kuwaharaShaderUniforms={};
// __UNIT__ u0257 [1770375,1770420) kind=expr len=158
kuwaharaShaderUniforms['tDiffuse']=kuwaharaDiffuseUniform,kuwaharaShaderUniforms['h']=kuwaharaHUniform,kuwaharaShaderUniforms['radius']=kuwaharaRadiusUniform;
// __UNIT__ u0258 [1770420,1770430) kind=var len=22
var kuwaharaShader={};
// __UNIT__ u0260 [1771915,1771931) kind=var len=67
var kuwaharaShaderAlias=kuwaharaShader,radialGlowDiffuseUniform={};
// __UNIT__ u0261 [1771931,1771948) kind=expr len=39
radialGlowDiffuseUniform['value']=null;
// __UNIT__ u0262 [1771948,1771958) kind=var len=26
var radialGlowHUniform={};
// __UNIT__ u0263 [1771958,1771980) kind=expr len=38
radialGlowHUniform['value']=0x1/0x200;
// __UNIT__ u0264 [1771980,1771990) kind=var len=31
var radialGlowRadiusUniform={};
// __UNIT__ u0265 [1771990,1772006) kind=expr len=37
radialGlowRadiusUniform['value']=0x4;
// __UNIT__ u0266 [1772006,1772016) kind=var len=32
var radialGlowShaderUniforms={};
// __UNIT__ u0267 [1772016,1772061) kind=expr len=170
radialGlowShaderUniforms['tDiffuse']=radialGlowDiffuseUniform,radialGlowShaderUniforms['h']=radialGlowHUniform,radialGlowShaderUniforms['radius']=radialGlowRadiusUniform;
// __UNIT__ u0268 [1772061,1772071) kind=var len=24
var radialGlowShader={};
// __UNIT__ u0270 [1773562,1773578) kind=var len=68
var radialGlowShaderAlias=radialGlowShader,diffuseTextureUniform={};
// __UNIT__ u0271 [1773578,1773595) kind=expr len=36
diffuseTextureUniform['value']=null;
// __UNIT__ u0272 [1773595,1773605) kind=var len=32
var lightMapIntensityUniform={};
// __UNIT__ u0273 [1773605,1773621) kind=expr len=38
lightMapIntensityUniform["value"]=0x1;
// __UNIT__ u0274 [1773621,1773631) kind=var len=30
var lightmapShaderUniforms={};
// __UNIT__ u0275 [1773631,1773676) kind=expr len=126
lightmapShaderUniforms["tDiffuse"]=diffuseTextureUniform,lightmapShaderUniforms["lightMapIntensity"]=lightMapIntensityUniform;
// __UNIT__ u0276 [1773676,1773686) kind=var len=32
var lightmapUncompressShader={};
// __UNIT__ u0278 [1774294,1774310) kind=var len=83
var lightmapUncompressShaderAlias=lightmapUncompressShader,sunsetDiffuseUniform={};
// __UNIT__ u0279 [1774310,1774327) kind=expr len=35
sunsetDiffuseUniform['value']=null;
// __UNIT__ u0280 [1774327,1774337) kind=var len=38
var sunsetLightMapIntensityUniform={};
// __UNIT__ u0281 [1774337,1774353) kind=expr len=44
sunsetLightMapIntensityUniform['value']=0x1;
// __UNIT__ u0282 [1774353,1774363) kind=var len=28
var sunsetShaderUniforms={};
// __UNIT__ u0283 [1774363,1774408) kind=expr len=127
sunsetShaderUniforms["tDiffuse"]=sunsetDiffuseUniform,sunsetShaderUniforms["lightMapIntensity"]=sunsetLightMapIntensityUniform;
// __UNIT__ u0284 [1774408,1774418) kind=var len=23
var sunsetShaderDef={};
// __UNIT__ u0286 [1775345,1775361) kind=var len=68
var sunsetShader=sunsetShaderDef,lightmapIntensityDiffuseUniform={};
// __UNIT__ u0287 [1775361,1775378) kind=expr len=46
lightmapIntensityDiffuseUniform['value']=null;
// __UNIT__ u0288 [1775378,1775388) kind=var len=27
var mapLightGainUniform={};
// __UNIT__ u0289 [1775388,1775404) kind=expr len=33
mapLightGainUniform['value']=0x1;
// __UNIT__ u0290 [1775404,1775414) kind=var len=39
var lightmapIntensityShaderUniforms={};
// __UNIT__ u0291 [1775414,1775459) kind=expr len=149
lightmapIntensityShaderUniforms["tDiffuse"]=lightmapIntensityDiffuseUniform,lightmapIntensityShaderUniforms['lightMapIntensity']=mapLightGainUniform;
// __UNIT__ u0292 [1775459,1775469) kind=var len=31
var lightmapIntensityShader={};
// __UNIT__ u0294 [1775959,1775975) kind=var len=84
var lightmapIntensityShaderAlias=lightmapIntensityShader,maxFilterDiffuseUniform={};
// __UNIT__ u0295 [1775975,1775992) kind=expr len=38
maxFilterDiffuseUniform["value"]=null;
// __UNIT__ u0296 [1775992,1776002) kind=var len=25
var blurRadiusUniform={};
// __UNIT__ u0297 [1776002,1776018) kind=expr len=31
blurRadiusUniform['value']=0x1;
// __UNIT__ u0298 [1776018,1776028) kind=var len=29
var maxFilterPassUniforms={};
// __UNIT__ u0299 [1776028,1776062) kind=expr len=108
maxFilterPassUniforms['tDiffuse']=maxFilterDiffuseUniform,maxFilterPassUniforms['radius']=blurRadiusUniform;
// __UNIT__ u0301 [1777031,1777048) kind=expr len=39
circleBlurDiffuseUniform['value']=null;
// __UNIT__ u0302 [1777048,1777058) kind=var len=29
var circleBlurStepUniform={};
// __UNIT__ u0303 [1777058,1777080) kind=expr len=41
circleBlurStepUniform['value']=0x1/0x200;
// __UNIT__ u0304 [1777080,1777090) kind=var len=30
var circleBlurPassUniforms={};
// __UNIT__ u0305 [1777090,1777119) kind=expr len=110
circleBlurPassUniforms["tDiffuse"]=circleBlurDiffuseUniform,circleBlurPassUniforms['h']=circleBlurStepUniform;
// __UNIT__ u0307 [1777831,1777848) kind=expr len=39
squareBlurDiffuseUniform['value']=null;
// __UNIT__ u0308 [1777848,1777858) kind=var len=29
var squareBlurStepUniform={};
// __UNIT__ u0309 [1777858,1777880) kind=expr len=41
squareBlurStepUniform["value"]=0x1/0x200;
// __UNIT__ u0310 [1777880,1777890) kind=var len=26
var blurPassUniformsSq={};
// __UNIT__ u0311 [1777890,1777919) kind=expr len=102
blurPassUniformsSq['tDiffuse']=squareBlurDiffuseUniform,blurPassUniformsSq['h']=squareBlurStepUniform;
// __UNIT__ u0313 [1779265,1779282) kind=expr len=36
boxBlurDiffuseUniform["value"]=null;
// __UNIT__ u0314 [1779282,1779292) kind=var len=26
var boxBlurStepUniform={};
// __UNIT__ u0315 [1779292,1779314) kind=expr len=38
boxBlurStepUniform['value']=0x1/0x200;
// __UNIT__ u0316 [1779314,1779324) kind=var len=27
var boxBlurPassUniforms={};
// __UNIT__ u0317 [1779324,1779353) kind=expr len=98
boxBlurPassUniforms['tDiffuse']=boxBlurDiffuseUniform,boxBlurPassUniforms['h']=boxBlurStepUniform;
// __UNIT__ u0318 [1779353,1779363) kind=var len=21
var boxBlurShader={};
// __UNIT__ u0320 [1780016,1780032) kind=var len=61
var boxBlurShaderAlias=boxBlurShader,diffuseShaderUniform={};
// __UNIT__ u0321 [1780032,1780049) kind=expr len=35
diffuseShaderUniform['value']=null;
// __UNIT__ u0322 [1780049,1780059) kind=var len=29
var blurStepShaderUniform={};
// __UNIT__ u0323 [1780059,1780081) kind=expr len=41
blurStepShaderUniform['value']=0x1/0x200;
// __UNIT__ u0324 [1780081,1780091) kind=var len=24
var blurPassUniforms={};
// __UNIT__ u0325 [1780091,1780120) kind=expr len=94
blurPassUniforms['tDiffuse']=diffuseShaderUniform,blurPassUniforms['h']=blurStepShaderUniform;
// __UNIT__ u0328 [1788734,1788750) kind=var len=67
var basicStrippedShader=basicStrippedShaderDef,outlineShaderDef={};
// __UNIT__ u0330 [1789848,1789864) kind=var len=59
var outlineShader=outlineShaderDef,normalDebugShaderDef={};
// __UNIT__ u0332 [1793621,1793637) kind=var len=58
var sG=normalDebugShaderDef,fresnelRefractionShaderDef={};
// __UNIT__ u0334 [1796553,1796569) kind=var len=82
var fresnelRefractionShaderAlias=fresnelRefractionShaderDef,pickupBoxShaderDef={};
// __UNIT__ u0336 [1797724,1797740) kind=var len=71
var pickupBoxShaderAlias=pickupBoxShaderDef,weaponSkinBakeShaderDef={};
// __UNIT__ u0338 [1805391,1805407) kind=var len=73
var weaponSkinBakeShaderAlias=weaponSkinBakeShaderDef,hardpointShader={};
// __UNIT__ u0340 [1806331,1806347) kind=var len=62
var hardpointShaderAlias=hardpointShader,damageFlashShader={};
// __UNIT__ u0342 [1807484,1807500) kind=var len=67
var damageFlashShaderAlias=damageFlashShader,sniperShaderParams={};
// __UNIT__ u0347 [1851101,1851150) kind=function len=95
function bezierCoeffA(bezierPointA,bezierPointB){return 0x1-0x3*bezierPointB+0x3*bezierPointA;}
// __UNIT__ u0348 [1851150,1851195) kind=function len=87
function bezierCoeffB(curveParamA,curveParamB){return 0x3*curveParamB-0x6*curveParamA;}
// __UNIT__ u0349 [1851195,1851228) kind=function len=57
function bezierCoeffC(inputValue){return 0x3*inputValue;}
// __UNIT__ u0354 [1851730,1851759) kind=function len=43
function linearEasing(value){return value;}
// __UNIT__ u0356 [1852421,1852422) kind=empty len=1
;
// __UNIT__ u0359 [1854116,1854142) kind=var len=47
var easingKeys=Object['keys'](easingFunctions);
// __UNIT__ u0360 [1854142,1854611) kind=for len=946
for(var loopIndex=0x0;loopIndex<easingKeys['length'];loopIndex++){if(typeof easingFunctions[easingKeys[loopIndex]]=='string'){var configValueStr=easingFunctions[easingKeys[loopIndex]];for(var th=0x0;variantIdx<configValueStr["length"];variantIdx++){if(!isNaN(configValueStr['charAt'](variantIdx))){configValueStr=configValueStr['substr'](variantIdx);break;}}var configParts=configValueStr["split"](',');configValueStr=configParts[configParts['length']-0x1];for(var th=configValueStr["length"]-0x1;variantIdx>=0x0;variantIdx--){if(!isNaN(configValueStr['charAt'](variantIdx))){configValueStr=configValueStr['substr'](0x0,variantIdx+0x1),configParts[configParts["length"]-0x1]=configValueStr;break;}}for(var th=0x0;variantIdx<configParts["length"];variantIdx++){configParts[variantIdx]=Number(configParts[variantIdx]);}easingFunctions[easingKeys[loopIndex]]=createBezierEasing(configParts[0x0],configParts[0x1],configParts[0x2],configParts[0x3]);}}
// __UNIT__ u0361 [1854611,1854771) kind=function len=173
function isPointerLocked(){if(document['pointerLockElement']!=null||document['msPointerLockElement']!=null||document['webkitPointerLockElement']!=null)return!![];return![];}
// __UNIT__ u0362 [1854771,1854906) kind=function len=241
function createTransitionState(){var anV=stringDecoderAlias,viewportRect={};return viewportRect['x']=0x0,viewportRect['y']=0x0,viewportRect['x2']=0x0,viewportRect['y2']=0x0,viewportRect["scale"]=0x1,viewportRect["opacity"]=0x1,viewportRect;}
// __UNIT__ u0363 [1854906,1854916) kind=var len=24
var touchPointerList=[];
// __UNIT__ u0364 [1854916,1855412) kind=function len=521
function touchPointer(){var anW=stringDecoderAlias,a3i={};return a3i['x']=0x0,a3i['y']=0x98967f,a3i["LrAPqsjYfmN"]=function(a3j){var anX=anW;this['x']=(this['x']-a3j["uaHjzyYxj"]/0x2)*a3j["aratio"],this['y']=(this['y']-a3j["hLpxYoCtr"]/0x2)*a3j['aratio'];},a3i["HtqDLxtmBs"]=function(a3j){var anY=anW;if(this['x']<a3j["hitbox"]['x']+a3j["width"]/0x2&&this['x']>a3j['hitbox']['x']-a3j['width']/0x2&&this['y']<a3j["hitbox"]['y']+a3j["height"]/0x2&&this['y']>a3j['hitbox']['y']-a3j['height']/0x2)return!![];return![];},a3i;}
// __UNIT__ u0368 [1883987,1884028) kind=var len=205
var initAudioListener,resumeAudioContext,updateAudioListener,applyMasterVolume,playCachedSound,playKillStreakSound,playAudioBuffer,audioSampleCache,registerSound,playPositionalSound,audioDistanceScale=0.1;
// __UNIT__ u0369 [1884028,1884111) kind=expr len=99
audioDistanceScale=0.1,window['AudioContext']=window['AudioContext']||window["webkitAudioContext"];
// __UNIT__ u0370 [1884111,1884137) kind=var len=36
var audioContext=new AudioContext();
// __UNIT__ u0371 [1884137,1884196) kind=if len=89
if(!audioContext["createGain"])audioContext["createGain"]=audioContext['createGainNode'];
// __UNIT__ u0372 [1884196,1884258) kind=if len=92
if(!audioContext['createDelay'])audioContext['createDelay']=audioContext["createDelayNode"];
// __UNIT__ u0373 [1884258,1884345) kind=if len=117
if(!audioContext['createScriptProcessor'])audioContext["createScriptProcessor"]=audioContext["createJavaScriptNode"];
// __UNIT__ u0374 [1884345,1884362) kind=var len=58
var baseVolumeScale=0.2,masterVolumeScale=baseVolumeScale;
// __UNIT__ u0376 [1889584,1890237) kind=expr len=683
Element['prototype']["toggle"]=function(){var aoX=stringDecoderAlias;this['style']['opacity']==0x1?(this['style']['opacity']=0x0,this['style']['visibility']="hidden",this['style']['display']="none"):(this['style']['opacity']=0x1,this['style']["visibility"]='visible',this["style"]['display']='initial');},Number['prototype']['countDecimals']=function(){var aoY=stringDecoderAlias;if(Math["floor"](this['valueOf']())===this["valueOf"]())return 0x0;var a3i=this['toString']();if(a3i["indexOf"]('.')!==-0x1&&a3i['indexOf']('-')!=-0x1)return a3i['split']('-')[0x1]||0x0;else{if(a3i['indexOf']('.')!=-0x1)return a3i['split']('.')[0x1]['length']||0x0;}return a3i['split']('-')[0x1]||0x0;};
// __UNIT__ u0377 [1890237,1890288) kind=var len=108
var hiddenSelectClassName="s-hidden",customSelectClassName='new-select2',customOptionListClass="new-option";
// __UNIT__ u0378 [1890288,1890359) kind=function len=111
function querySelectorAll(cssSelector){var nodeList=document['querySelectorAll'](cssSelector);return nodeList;}
// __UNIT__ u0379 [1890359,1890509) kind=function len=180
function parseHtmlTemplate(a3i){var aoZ=stringDecoderAlias,a3j=document['createElement']("tem"+'plate');return a3i=a3i['trim'](),a3j['innerHTML']=a3i,a3j['content']["firstChild"];}
// __UNIT__ u0381 [1890900,1891187) kind=function len=398
function closeCustomSelects(){var ap1=stringDecoderAlias;querySelectorAll(".select")['forEach'](function(a3i){var ap2=ap1;a3i["classList"]['remove']('open');}),querySelectorAll('.'+customSelectClassName)['forEach'](function(a3i){a3i['classList']['remove']('active');}),querySelectorAll('.'+customOptionListClass)['forEach'](function(a3i){var ap3=ap1;a3i["style"]["opacity"]=0x1,a3i["toggle"]();});}
// __UNIT__ u0382 [1891187,1891302) kind=expr len=146
document['addEventListener']("click",function(){var ap4=stringDecoderAlias;if(document["pointerLockElement"]!=null)return;closeCustomSelects();});
// __UNIT__ u0383 [1891302,1891309) kind=var len=24
var applyClientSettings;
// __UNIT__ u0385 [1891806,1891857) kind=var len=243
var spareStateSlotTO=0x0,settingsValueMap,settingsDefinitions,settingsRootDiv,settingsPagesContainer,settingsScrollContainer,settingsListElement,settingsSections={},activeSettingsCategory,settingsScrollLockUntil=0x0,generalSettingsCategory={};
// __UNIT__ u0386 [1891857,1891898) kind=expr len=83
generalSettingsCategory['id']="general",generalSettingsCategory['label']='GENERAL';
// __UNIT__ u0387 [1891898,1891908) kind=var len=32
var controlsSettingsCategory={};
// __UNIT__ u0389 [1891954,1891964) kind=var len=32
var keybindsSettingsCategory={};
// __UNIT__ u0390 [1891964,1892009) kind=expr len=89
keybindsSettingsCategory['id']='ofbGMnQRPK',keybindsSettingsCategory["label"]='KEYBINDS';
// __UNIT__ u0391 [1892009,1892019) kind=var len=29
var audioSettingsCategory={};
// __UNIT__ u0392 [1892019,1892056) kind=expr len=75
audioSettingsCategory['id']='audio',audioSettingsCategory['label']="AUDIO";
// __UNIT__ u0393 [1892056,1892066) kind=var len=29
var videoSettingsCategory={};
// __UNIT__ u0394 [1892066,1892103) kind=expr len=75
videoSettingsCategory['id']='video',videoSettingsCategory["label"]="VIDEO";
// __UNIT__ u0395 [1892103,1892113) kind=var len=31
var crosshairSettingsOption={};
// __UNIT__ u0397 [1892158,1892168) kind=var len=28
var mobileSettingsOption={};
// __UNIT__ u0398 [1892168,1892207) kind=expr len=75
mobileSettingsOption['id']='mobile',mobileSettingsOption['label']='MOBILE';
// __UNIT__ u0399 [1892207,1892237) kind=var len=188
var platformOptionList=[generalSettingsCategory,controlsSettingsCategory,keybindsSettingsCategory,audioSettingsCategory,videoSettingsCategory,crosshairSettingsOption,mobileSettingsOption];
// __UNIT__ u0400 [1892237,1892382) kind=function len=230
function getSettingsCategoryLabel(a3i){var ap6=stringDecoderAlias;for(var a3j=0x0;a3j<platformOptionList["length"];a3j++){if(platformOptionList[a3j]['id']==a3i)return platformOptionList[a3j]["label"];}return a3i['toUpperCase']();}
// __UNIT__ u0401 [1892382,1892494) kind=function len=212
function getSettingsCategoryIndex(targetId){for(var scanIdx=0x0;scanIdx<platformOptionList['length'];scanIdx++){if(platformOptionList[scanIdx]['id']==targetId)return scanIdx;}return platformOptionList['length'];}
// __UNIT__ u0415 [1909729,1909852) kind=expr len=147
document["readyState"]==="loading"?document["addEventListener"]('DOMContentLoaded',function(){billingManager['init']();}):billingManager['init']();
// __UNIT__ u0419 [1913331,1913341) kind=var len=29
var factoryDayLightPreset={};
// __UNIT__ u0420 [1913341,1913405) kind=expr len=102
factoryDayLightPreset["sunColor"]=[0x1,0.9,0.8],factoryDayLightPreset['sunDirection']=[-0.5,1.4,-0.3];
// __UNIT__ u0421 [1913405,1913415) kind=var len=32
var factorySunsetLightPreset={};
// __UNIT__ u0422 [1913415,1913497) kind=expr len=148
factorySunsetLightPreset["sunset"]=!![],factorySunsetLightPreset['sunColor']=[0x1,0.8,0.6],factorySunsetLightPreset["sunDirection"]=[-0.6,0.9,-0.2];
// __UNIT__ u0423 [1913497,1913507) kind=var len=26
var factorySpawnPoint1={};
// __UNIT__ u0424 [1913507,1913573) kind=expr len=146
factorySpawnPoint1['x']=-4.1,factorySpawnPoint1['y']=2.5,factorySpawnPoint1['z']=-0.2,factorySpawnPoint1['rx']=0x40,factorySpawnPoint1['ry']=0x80;
// __UNIT__ u0425 [1913573,1913583) kind=var len=22
var mapSpawnPreset={};
// __UNIT__ u0426 [1913583,1913650) kind=expr len=127
mapSpawnPreset['x']=-4.1,mapSpawnPreset['y']=-0.9,mapSpawnPreset['z']=21.4,mapSpawnPreset['rx']=0x40,mapSpawnPreset['ry']=0x40;
// __UNIT__ u0427 [1913650,1913660) kind=var len=26
var factorySpawnPoint3={};
// __UNIT__ u0428 [1913660,1913727) kind=expr len=147
factorySpawnPoint3['x']=-26.6,factorySpawnPoint3['y']=2.5,factorySpawnPoint3['z']=36.2,factorySpawnPoint3['rx']=0x3f,factorySpawnPoint3['ry']=0xbf;
// __UNIT__ u0429 [1913727,1913737) kind=var len=26
var factorySpawnPoint4={};
// __UNIT__ u0430 [1913737,1913803) kind=expr len=146
factorySpawnPoint4['x']=-6.4,factorySpawnPoint4['y']=2.7,factorySpawnPoint4['z']=0x1f,factorySpawnPoint4['rx']=0x3f,factorySpawnPoint4['ry']=0xbe;
// __UNIT__ u0431 [1913803,1913813) kind=var len=26
var factorySpawnPoint5={};
// __UNIT__ u0432 [1913813,1913879) kind=expr len=146
factorySpawnPoint5['x']=19.8,factorySpawnPoint5['y']=2.5,factorySpawnPoint5['z']=17.6,factorySpawnPoint5['rx']=0x3f,factorySpawnPoint5['ry']=0x7f;
// __UNIT__ u0433 [1913879,1913889) kind=var len=26
var factorySpawnPoint6={};
// __UNIT__ u0434 [1913889,1913954) kind=expr len=145
factorySpawnPoint6['x']=29.2,factorySpawnPoint6['y']=2.5,factorySpawnPoint6['z']=8.3,factorySpawnPoint6['rx']=0x3f,factorySpawnPoint6['ry']=0x7d;
// __UNIT__ u0435 [1913954,1913964) kind=var len=26
var factorySpawnPoint7={};
// __UNIT__ u0436 [1913964,1914030) kind=expr len=146
factorySpawnPoint7['x']=3.9,factorySpawnPoint7['y']=2.5,factorySpawnPoint7['z']=-21.7,factorySpawnPoint7['rx']=0x3f,factorySpawnPoint7['ry']=0x40;
// __UNIT__ u0437 [1914030,1914040) kind=var len=19
var spawnPoint8={};
// __UNIT__ u0438 [1914040,1914106) kind=expr len=111
spawnPoint8['x']=-38.1,spawnPoint8['y']=2.5,spawnPoint8['z']=1.6,spawnPoint8['rx']=0x40,spawnPoint8['ry']=0xbe;
// __UNIT__ u0439 [1914106,1914116) kind=var len=19
var spawnPoint9={};
// __UNIT__ u0440 [1914116,1914184) kind=expr len=113
spawnPoint9['x']=-24.8,spawnPoint9['y']=-2.1,spawnPoint9['z']=19.6,spawnPoint9['rx']=0x41,spawnPoint9['ry']=0xc1;
// __UNIT__ u0441 [1914184,1914194) kind=var len=25
var factoryBotSpawn00={};
// __UNIT__ u0442 [1914194,1914275) kind=expr len=156
factoryBotSpawn00['x']=-0x16,factoryBotSpawn00['y']=2.5,factoryBotSpawn00['z']=39.900001525878906,factoryBotSpawn00['rx']=0x39,factoryBotSpawn00['ry']=0xf2;
// __UNIT__ u0443 [1914275,1914285) kind=var len=25
var factoryBotSpawn01={};
// __UNIT__ u0444 [1914285,1914364) kind=expr len=154
factoryBotSpawn01['x']=6.199999809265137,factoryBotSpawn01['y']=2.5,factoryBotSpawn01['z']=40.5,factoryBotSpawn01['rx']=0x34,factoryBotSpawn01['ry']=0xf0;
// __UNIT__ u0445 [1914364,1914374) kind=var len=25
var factoryBotSpawn02={};
// __UNIT__ u0446 [1914374,1914454) kind=expr len=155
factoryBotSpawn02['x']=28.799999237060547,factoryBotSpawn02['y']=2.5,factoryBotSpawn02['z']=0x13,factoryBotSpawn02['rx']=0x33,factoryBotSpawn02['ry']=0xf4;
// __UNIT__ u0447 [1914454,1914464) kind=var len=20
var botMapPoseUA={};
// __UNIT__ u0448 [1914464,1914543) kind=expr len=129
botMapPoseUA['x']=29.700000762939453,botMapPoseUA['y']=2.5,botMapPoseUA['z']=0x3,botMapPoseUA['rx']=0x31,botMapPoseUA['ry']=0x3e;
// __UNIT__ u0449 [1914543,1914553) kind=var len=20
var botMapPoseUB={};
// __UNIT__ u0450 [1914553,1914647) kind=expr len=144
botMapPoseUB['x']=20.899999618530273,botMapPoseUB['y']=2.5,botMapPoseUB['z']=3.0999999046325684,botMapPoseUB['rx']=0x40,botMapPoseUB['ry']=0x15;
// __UNIT__ u0451 [1914647,1914657) kind=var len=20
var botMapPoseUC={};
// __UNIT__ u0452 [1914657,1914749) kind=expr len=142
botMapPoseUC['x']=6.599999904632568,botMapPoseUC['y']=2.5,botMapPoseUC['z']=6.300000190734863,botMapPoseUC['rx']=0x2f,botMapPoseUC['ry']=0x6b;
// __UNIT__ u0453 [1914749,1914759) kind=var len=20
var botMapPoseUD={};
// __UNIT__ u0454 [1914759,1914854) kind=expr len=145
botMapPoseUD['x']=-0.20000000298023224,botMapPoseUD['y']=2.5,botMapPoseUD['z']=3.299999952316284,botMapPoseUD['rx']=0x2f,botMapPoseUD['ry']=0x55;
// __UNIT__ u0455 [1914854,1914864) kind=var len=20
var botMapPoseUE={};
// __UNIT__ u0456 [1914864,1914960) kind=expr len=146
botMapPoseUE['x']=-0.8999999761581421,botMapPoseUE['y']=2.5,botMapPoseUE['z']=-11.399999618530273,botMapPoseUE['rx']=0x3b,botMapPoseUE['ry']=0xb1;
// __UNIT__ u0457 [1914960,1914970) kind=var len=20
var botMapPoseUF={};
// __UNIT__ u0458 [1914970,1915036) kind=expr len=116
botMapPoseUF['x']=8.5,botMapPoseUF['y']=2.5,botMapPoseUF['z']=-11.5,botMapPoseUF['rx']=0x49,botMapPoseUF['ry']=0xc2;
// __UNIT__ u0459 [1915036,1915046) kind=var len=20
var botMapPoseUG={};
// __UNIT__ u0460 [1915046,1915127) kind=expr len=131
botMapPoseUG['x']=20.600000381469727,botMapPoseUG['y']=2.5,botMapPoseUG['z']=-12.5,botMapPoseUG['rx']=0x34,botMapPoseUG['ry']=0x7f;
// __UNIT__ u0461 [1915127,1915137) kind=var len=20
var botMapPoseUH={};
// __UNIT__ u0462 [1915137,1915231) kind=expr len=144
botMapPoseUH['x']=9.699999809265137,botMapPoseUH['y']=2.5,botMapPoseUH['z']=-22.299999237060547,botMapPoseUH['rx']=0x38,botMapPoseUH['ry']=0x28;
// __UNIT__ u0463 [1915231,1915241) kind=var len=25
var factoryBotPoint12={};
// __UNIT__ u0464 [1915241,1915337) kind=expr len=171
factoryBotPoint12['x']=-11.300000190734863,factoryBotPoint12['y']=2.5,factoryBotPoint12['z']=-23.600000381469727,factoryBotPoint12['rx']=0x3a,factoryBotPoint12['ry']=0x59;
// __UNIT__ u0465 [1915337,1915347) kind=var len=25
var factoryBotPoint13={};
// __UNIT__ u0466 [1915347,1915428) kind=expr len=156
factoryBotPoint13['x']=-22.200000762939453,factoryBotPoint13['y']=2.5,factoryBotPoint13['z']=-0x9,factoryBotPoint13['rx']=0x38,factoryBotPoint13['ry']=0x72;
// __UNIT__ u0467 [1915428,1915438) kind=var len=25
var factoryBotPoint14={};
// __UNIT__ u0468 [1915438,1915518) kind=expr len=155
factoryBotPoint14['x']=-32.400001525878906,factoryBotPoint14['y']=2.5,factoryBotPoint14['z']=0x7,factoryBotPoint14['rx']=0x40,factoryBotPoint14['ry']=0x72;
// __UNIT__ u0469 [1915518,1915528) kind=var len=25
var factoryBotPoint15={};
// __UNIT__ u0470 [1915528,1915638) kind=expr len=185
factoryBotPoint15['x']=-32.79999923706055,factoryBotPoint15['y']=-1.7999999523162842,factoryBotPoint15['z']=19.100000381469727,factoryBotPoint15['rx']=0x31,factoryBotPoint15['ry']=0xc1;
// __UNIT__ u0471 [1915638,1915648) kind=var len=25
var factoryBotPoint16={};
// __UNIT__ u0472 [1915648,1915758) kind=expr len=185
factoryBotPoint16['x']=-4.800000190734863,factoryBotPoint16['y']=-0.8999999761581421,factoryBotPoint16['z']=23.700000762939453,factoryBotPoint16['rx']=0x37,factoryBotPoint16['ry']=0x10;
// __UNIT__ u0473 [1915758,1915768) kind=var len=25
var factoryBotPoint17={};
// __UNIT__ u0474 [1915768,1915863) kind=expr len=170
factoryBotPoint17['x']=-22.899999618530273,factoryBotPoint17['y']=2.5,factoryBotPoint17['z']=25.100000381469727,factoryBotPoint17['rx']=0x42,factoryBotPoint17['ry']=0xe6;
// __UNIT__ u0475 [1915863,1915873) kind=var len=24
var factoryNavPoint1={};
// __UNIT__ u0476 [1915873,1915954) kind=expr len=123
factoryNavPoint1['x']=-20.390042328829992,factoryNavPoint1['y']=1.0137487207870537,factoryNavPoint1['z']=40.26315008117996;
// __UNIT__ u0477 [1915954,1915964) kind=var len=24
var factoryNavPoint2={};
// __UNIT__ u0478 [1915964,1916044) kind=expr len=122
factoryNavPoint2['x']=15.246698652920202,factoryNavPoint2['y']=0.9560260427605223,factoryNavPoint2['z']=40.40338267723996;
// __UNIT__ u0479 [1916044,1916054) kind=var len=24
var factoryNavPoint3={};
// __UNIT__ u0480 [1916054,1916132) kind=expr len=120
factoryNavPoint3['x']=8.27968055154107,factoryNavPoint3['y']=0.9264680081761818,factoryNavPoint3['z']=5.571631971866196;
// __UNIT__ u0481 [1916132,1916142) kind=var len=24
var factoryNavPoint4={};
// __UNIT__ u0482 [1916142,1916222) kind=expr len=122
factoryNavPoint4['x']=-5.790133359946395,factoryNavPoint4['y']=1.0175892698364963,factoryNavPoint4['z']=-29.5529592327037;
// __UNIT__ u0483 [1916222,1916232) kind=var len=24
var factoryNavPoint5={};
// __UNIT__ u0484 [1916232,1916314) kind=expr len=124
factoryNavPoint5['x']=-34.314927775930755,factoryNavPoint5['y']=0.9093344094423133,factoryNavPoint5['z']=2.9493227098146946;
// __UNIT__ u0485 [1916314,1916324) kind=var len=23
var cinematicStart0={};
// __UNIT__ u0486 [1916324,1916388) kind=expr len=90
cinematicStart0['position']=[-0x18,0x4,0x2a],cinematicStart0["JoIkrtRxhZ"]=[0xe,0x3,0x24];
// __UNIT__ u0487 [1916388,1916398) kind=var len=21
var cinematicEnd0={};
// __UNIT__ u0488 [1916398,1916461) kind=expr len=85
cinematicEnd0['position']=[-0x2,0x2,0x27],cinematicEnd0['JoIkrtRxhZ']=[0xe,0x3,0x24];
// __UNIT__ u0489 [1916461,1916471) kind=var len=23
var cinematicScene0={};
// __UNIT__ u0490 [1916471,1916517) kind=expr len=109
cinematicScene0['start']=cinematicStart0,cinematicScene0["end"]=cinematicEnd0,cinematicScene0['time']=0x3a98;
// __UNIT__ u0491 [1916517,1916527) kind=var len=23
var cinematicStart1={};
// __UNIT__ u0492 [1916527,1916593) kind=expr len=92
cinematicStart1['position']=[-0x2,0x3,0x13],cinematicStart1['JoIkrtRxhZ']=[-0x18,-0x2,0x14];
// __UNIT__ u0493 [1916593,1916603) kind=var len=21
var cinematicEnd1={};
// __UNIT__ u0494 [1916603,1916671) kind=expr len=90
cinematicEnd1['position']=[-0x10,-0x2,0x14],cinematicEnd1["JoIkrtRxhZ"]=[-0x18,-0x2,0x14];
// __UNIT__ u0495 [1916671,1916681) kind=var len=23
var cinematicScene1={};
// __UNIT__ u0496 [1916681,1916727) kind=expr len=109
cinematicScene1["start"]=cinematicStart1,cinematicScene1['end']=cinematicEnd1,cinematicScene1['time']=0x3a98;
// __UNIT__ u0497 [1916727,1916737) kind=var len=23
var cinematicStart2={};
// __UNIT__ u0498 [1916737,1916803) kind=expr len=92
cinematicStart2['position']=[-0x1a,0x2,-0x8],cinematicStart2['JoIkrtRxhZ']=[-0xa,0x3,-0x16];
// __UNIT__ u0499 [1916803,1916813) kind=var len=21
var cinematicEnd2={};
// __UNIT__ u0500 [1916813,1916880) kind=expr len=89
cinematicEnd2['position']=[-0x12,0x4,-0x10],cinematicEnd2['JoIkrtRxhZ']=[-0xa,0x3,-0x16];
// __UNIT__ u0501 [1916880,1916890) kind=var len=23
var cinematicScene2={};
// __UNIT__ u0502 [1916890,1916936) kind=expr len=109
cinematicScene2['start']=cinematicStart2,cinematicScene2['end']=cinematicEnd2,cinematicScene2["time"]=0x2328;
// __UNIT__ u0503 [1916936,1916946) kind=var len=27
var nightLightingPreset={};
// __UNIT__ u0504 [1916946,1917050) kind=expr len=172
nightLightingPreset["night"]=!![],nightLightingPreset["prioritize"]=!![],nightLightingPreset['sunColor']=[0.5,0.35,0.2],nightLightingPreset['sunDirection']=[-0.5,0.8,-0.3];
// __UNIT__ u0505 [1917050,1917060) kind=var len=22
var dayLightPreset={};
// __UNIT__ u0506 [1917060,1917140) kind=expr len=116
dayLightPreset["night"]=![],dayLightPreset["sunColor"]=[0x1,0.9,0.8],dayLightPreset['sunDirection']=[-0.5,1.8,-0.5];
// __UNIT__ u0507 [1917140,1917150) kind=var len=20
var spawnPointV4={};
// __UNIT__ u0508 [1917150,1917217) kind=expr len=117
spawnPointV4['x']=-0xd,spawnPointV4['y']=6.5,spawnPointV4['z']=-0x25,spawnPointV4['rx']=0x40,spawnPointV4['ry']=0xc0;
// __UNIT__ u0509 [1917217,1917227) kind=var len=20
var spawnPointV5={};
// __UNIT__ u0510 [1917227,1917294) kind=expr len=117
spawnPointV5['x']=-0.7,spawnPointV5['y']=6.5,spawnPointV5['z']=-0x14,spawnPointV5['rx']=0x40,spawnPointV5['ry']=0xff;
// __UNIT__ u0511 [1917294,1917304) kind=var len=20
var spawnPointV6={};
// __UNIT__ u0512 [1917304,1917369) kind=expr len=115
spawnPointV6['x']=6.1,spawnPointV6['y']=2.8,spawnPointV6['z']=-8.3,spawnPointV6['rx']=0x3e,spawnPointV6['ry']=0xbe;
// __UNIT__ u0513 [1917369,1917379) kind=var len=20
var spawnPointV7={};
// __UNIT__ u0514 [1917379,1917444) kind=expr len=115
spawnPointV7['x']=2.2,spawnPointV7['y']=7.4,spawnPointV7['z']=33.1,spawnPointV7['rx']=0x3f,spawnPointV7['ry']=0xfe;
// __UNIT__ u0515 [1917444,1917454) kind=var len=20
var spawnPointV8={};
// __UNIT__ u0516 [1917454,1917521) kind=expr len=117
spawnPointV8['x']=18.9,spawnPointV8['y']=9.3,spawnPointV8['z']=-20.4,spawnPointV8['rx']=0x40,spawnPointV8['ry']=0xfe;
// __UNIT__ u0517 [1917521,1917531) kind=var len=21
var mapNavPointV9={};
// __UNIT__ u0518 [1917531,1917612) kind=expr len=114
mapNavPointV9['x']=-7.496861402285596,mapNavPointV9['y']=5.0513023839844955,mapNavPointV9['z']=-33.03368692626958;
// __UNIT__ u0519 [1917612,1917622) kind=var len=21
var mapNavPoint02={};
// __UNIT__ u0520 [1917622,1917702) kind=expr len=113
mapNavPoint02['x']=21.48919543862951,mapNavPoint02['y']=7.792162199255133,mapNavPoint02['z']=-24.617679868263167;
// __UNIT__ u0521 [1917702,1917712) kind=var len=21
var mapNavPointVb={};
// __UNIT__ u0522 [1917712,1917791) kind=expr len=112
mapNavPointVb['x']=29.712758136666878,mapNavPointVb['y']=4.149390030855203,mapNavPointVb['z']=5.246119611985577;
// __UNIT__ u0523 [1917791,1917801) kind=var len=21
var mapNavPointVc={};
// __UNIT__ u0524 [1917801,1917880) kind=expr len=112
mapNavPointVc['x']=2.422079862998814,mapNavPointVc['y']=5.880384538687916,mapNavPointVc['z']=27.938637089010967;
// __UNIT__ u0525 [1917880,1917890) kind=var len=21
var mapNavPointVd={};
// __UNIT__ u0526 [1917890,1917971) kind=expr len=114
mapNavPointVd['x']=1.2459032018891456,mapNavPointVd['y']=1.3603122480363306,mapNavPointVd['z']=-6.384632241090827;
// __UNIT__ u0527 [1917971,1917981) kind=var len=23
var refineryPointVe={};
// __UNIT__ u0528 [1917981,1918019) kind=expr len=77
refineryPointVe['x']=-0.4,refineryPointVe['y']=2.8,refineryPointVe['z']=-7.9;
// __UNIT__ u0529 [1918019,1918029) kind=var len=23
var refineryPointVf={};
// __UNIT__ u0530 [1918029,1918066) kind=expr len=76
refineryPointVf['x']=6.4,refineryPointVf['y']=7.4,refineryPointVf['z']=23.8;
// __UNIT__ u0531 [1918066,1918076) kind=var len=23
var refineryPointVg={};
// __UNIT__ u0532 [1918076,1918114) kind=expr len=77
refineryPointVg['x']=24.5,refineryPointVg['y']=9.2,refineryPointVg['z']=0x15;
// __UNIT__ u0533 [1918114,1918124) kind=var len=21
var mapNavPointVh={};
// __UNIT__ u0534 [1918124,1918163) kind=expr len=72
mapNavPointVh['x']=0x21,mapNavPointVh['y']=9.3,mapNavPointVh['z']=-14.7;
// __UNIT__ u0535 [1918163,1918173) kind=var len=21
var mapNavPointVi={};
// __UNIT__ u0536 [1918173,1918211) kind=expr len=71
mapNavPointVi['x']=5.6,mapNavPointVi['y']=7.8,mapNavPointVi['z']=-17.2;
// __UNIT__ u0537 [1918211,1918221) kind=var len=21
var mapNavPointVj={};
// __UNIT__ u0538 [1918221,1918261) kind=expr len=73
mapNavPointVj['x']=-12.1,mapNavPointVj['y']=6.5,mapNavPointVj['z']=-10.5;
// __UNIT__ u0539 [1918261,1918271) kind=var len=30
var cinematicSegmentAStart={};
// __UNIT__ u0540 [1918271,1918337) kind=expr len=106
cinematicSegmentAStart['position']=[7.12,8.5,-0x25],cinematicSegmentAStart["JoIkrtRxhZ"]=[-0xc,7.5,-0x14];
// __UNIT__ u0541 [1918337,1918347) kind=var len=28
var cinematicWaypointEnd={};
// __UNIT__ u0542 [1918347,1918413) kind=expr len=102
cinematicWaypointEnd['position']=[-2.4,6.5,-0x1d],cinematicWaypointEnd['JoIkrtRxhZ']=[-0xc,7.5,-0x14];
// __UNIT__ u0543 [1918413,1918423) kind=var len=25
var cinematicSegmentA={};
// __UNIT__ u0544 [1918423,1918469) kind=expr len=129
cinematicSegmentA["start"]=cinematicSegmentAStart,cinematicSegmentA["end"]=cinematicWaypointEnd,cinematicSegmentA["time"]=0x2ee0;
// __UNIT__ u0545 [1918469,1918479) kind=var len=30
var cinematicSegmentBStart={};
// __UNIT__ u0546 [1918479,1918541) kind=expr len=102
cinematicSegmentBStart["position"]=[-0x3,0x5,0x9],cinematicSegmentBStart['JoIkrtRxhZ']=[0x3,0x8,0x16];
// __UNIT__ u0547 [1918541,1918551) kind=var len=28
var cinematicSegmentBEnd={};
// __UNIT__ u0548 [1918551,1918613) kind=expr len=98
cinematicSegmentBEnd["position"]=[0x3,0x8,0x16],cinematicSegmentBEnd['JoIkrtRxhZ']=[5.5,0xa,0x1e];
// __UNIT__ u0549 [1918613,1918623) kind=var len=25
var cinematicSegmentB={};
// __UNIT__ u0550 [1918623,1918669) kind=expr len=129
cinematicSegmentB['start']=cinematicSegmentBStart,cinematicSegmentB['end']=cinematicSegmentBEnd,cinematicSegmentB['time']=0x3a98;
// __UNIT__ u0551 [1918669,1918679) kind=var len=22
var smokeEmitterVq={};
// __UNIT__ u0553 [1918833,1918843) kind=var len=22
var smokeEmitterVr={};
// __UNIT__ u0555 [1918999,1919009) kind=var len=22
var smokeEmitterVs={};
// __UNIT__ u0557 [1919165,1919175) kind=var len=22
var smokeEmitterVt={};
// __UNIT__ u0559 [1919331,1919341) kind=var len=22
var smokeEmitterVu={};
// __UNIT__ u0561 [1919497,1919507) kind=var len=19
var spawnPoseVv={};
// __UNIT__ u0562 [1919507,1919614) kind=expr len=152
spawnPoseVv['x']=-9.699999809265137,spawnPoseVv['y']=6.199999809265137,spawnPoseVv['z']=29.299999237060547,spawnPoseVv['rx']=0x3e,spawnPoseVv['ry']=0x6;
// __UNIT__ u0563 [1919614,1919624) kind=var len=19
var spawnPoseVw={};
// __UNIT__ u0564 [1919624,1919734) kind=expr len=155
spawnPoseVw['x']=-21.100000381469727,spawnPoseVw['y']=9.100000381469727,spawnPoseVw['z']=-26.200000762939453,spawnPoseVw['rx']=0x3b,spawnPoseVw['ry']=0x7e;
// __UNIT__ u0565 [1919734,1919744) kind=var len=19
var spawnPoseVx={};
// __UNIT__ u0566 [1919744,1919840) kind=expr len=141
spawnPoseVx['x']=0x20,spawnPoseVx['y']=2.0999999046325684,spawnPoseVx['z']=-23.299999237060547,spawnPoseVx['rx']=0x3d,spawnPoseVx['ry']=0x84;
// __UNIT__ u0567 [1919840,1919850) kind=var len=19
var spawnPoseVy={};
// __UNIT__ u0568 [1919850,1919959) kind=expr len=154
spawnPoseVy['x']=26.100000381469727,spawnPoseVy['y']=9.899999618530273,spawnPoseVy['z']=-24.100000381469727,spawnPoseVy['rx']=0x3b,spawnPoseVy['ry']=0xda;
// __UNIT__ u0569 [1919959,1919969) kind=var len=19
var spawnPoseVz={};
// __UNIT__ u0570 [1919969,1920077) kind=expr len=153
spawnPoseVz['x']=3.299999952316284,spawnPoseVz['y']=6.099999904632568,spawnPoseVz['z']=-11.100000381469727,spawnPoseVz['rx']=0x3e,spawnPoseVz['ry']=0xd6;
// __UNIT__ u0571 [1920077,1920087) kind=var len=19
var spawnPoseVA={};
// __UNIT__ u0572 [1920087,1920195) kind=expr len=153
spawnPoseVA['x']=46.400001525878906,spawnPoseVA['y']=6.300000190734863,spawnPoseVA['z']=12.600000381469727,spawnPoseVA['rx']=0x3f,spawnPoseVA['ry']=0xe3;
// __UNIT__ u0573 [1920195,1920205) kind=var len=19
var spawnPoseVB={};
// __UNIT__ u0574 [1920205,1920313) kind=expr len=153
spawnPoseVB['x']=42.599998474121094,spawnPoseVB['y']=4.599999904632568,spawnPoseVB['z']=-48.79999923706055,spawnPoseVB['rx']=0x3e,spawnPoseVB['ry']=0xab;
// __UNIT__ u0575 [1920313,1920323) kind=var len=19
var spawnPoseVC={};
// __UNIT__ u0576 [1920323,1920418) kind=expr len=140
spawnPoseVC['x']=0x15,spawnPoseVC['y']=9.899999618530273,spawnPoseVC['z']=-17.799999237060547,spawnPoseVC['rx']=0x3e,spawnPoseVC['ry']=0xa0;
// __UNIT__ u0577 [1920418,1920428) kind=var len=21
var mapNavPointVD={};
// __UNIT__ u0578 [1920428,1920509) kind=expr len=114
mapNavPointVD['x']=32.29380753673695,mapNavPointVD['y']=0.6403324698151001,mapNavPointVD['z']=-18.701872554538568;
// __UNIT__ u0579 [1920509,1920519) kind=var len=21
var mapNavPointVE={};
// __UNIT__ u0580 [1920519,1920599) kind=expr len=113
mapNavPointVE['x']=55.02171570408234,mapNavPointVE['y']=6.661546811733244,mapNavPointVE['z']=-54.120196208339166;
// __UNIT__ u0581 [1920599,1920609) kind=var len=21
var mapNavPointVF={};
// __UNIT__ u0582 [1920609,1920688) kind=expr len=112
mapNavPointVF['x']=-9.259663014746906,mapNavPointVF['y']=5.47591583911105,mapNavPointVF['z']=-39.76599959686564;
// __UNIT__ u0583 [1920688,1920698) kind=var len=21
var mapNavPointVG={};
// __UNIT__ u0584 [1920698,1920776) kind=expr len=111
mapNavPointVG['x']=9.929534460338232,mapNavPointVG['y']=5.500801311424659,mapNavPointVG['z']=6.226374489316726;
// __UNIT__ u0585 [1920776,1920786) kind=var len=21
var mapNavPointVH={};
// __UNIT__ u0586 [1920786,1920865) kind=expr len=112
mapNavPointVH['x']=50.569006760835464,mapNavPointVH['y']=4.640717330475425,mapNavPointVH['z']=5.738879440762773;
// __UNIT__ u0587 [1920865,1920875) kind=var len=36
var snowfallCinematicSceneAStart={};
// __UNIT__ u0588 [1920875,1920941) kind=expr len=118
snowfallCinematicSceneAStart["position"]=[0x3a,0x8,-0x37],snowfallCinematicSceneAStart['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0589 [1920941,1920951) kind=var len=34
var snowfallCinematicSceneAEnd={};
// __UNIT__ u0590 [1920951,1921017) kind=expr len=114
snowfallCinematicSceneAEnd["position"]=[0x31,0x9,-38.5],snowfallCinematicSceneAEnd['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0591 [1921017,1921027) kind=var len=31
var snowfallCinematicSceneA={};
// __UNIT__ u0592 [1921027,1921073) kind=expr len=159
snowfallCinematicSceneA["start"]=snowfallCinematicSceneAStart,snowfallCinematicSceneA['end']=snowfallCinematicSceneAEnd,snowfallCinematicSceneA['time']=0x2ee0;
// __UNIT__ u0593 [1921073,1921083) kind=var len=36
var snowfallCinematicSceneBStart={};
// __UNIT__ u0594 [1921083,1921149) kind=expr len=118
snowfallCinematicSceneBStart["position"]=[0x3a,0x8,-0x37],snowfallCinematicSceneBStart['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0595 [1921149,1921159) kind=var len=34
var snowfallCinematicSceneBEnd={};
// __UNIT__ u0596 [1921159,1921225) kind=expr len=114
snowfallCinematicSceneBEnd["position"]=[0x31,0x9,-38.5],snowfallCinematicSceneBEnd["JoIkrtRxhZ"]=[0x22,0xa,-0x16];
// __UNIT__ u0597 [1921225,1921235) kind=var len=31
var snowfallCinematicSceneB={};
// __UNIT__ u0598 [1921235,1921281) kind=expr len=159
snowfallCinematicSceneB['start']=snowfallCinematicSceneBStart,snowfallCinematicSceneB['end']=snowfallCinematicSceneBEnd,snowfallCinematicSceneB['time']=0x2ee0;
// __UNIT__ u0599 [1921281,1921291) kind=var len=36
var snowfallCinematicSceneCStart={};
// __UNIT__ u0600 [1921291,1921357) kind=expr len=118
snowfallCinematicSceneCStart['position']=[0x3a,0x8,-0x37],snowfallCinematicSceneCStart["JoIkrtRxhZ"]=[0x22,0xa,-0x16];
// __UNIT__ u0601 [1921357,1921367) kind=var len=34
var snowfallCinematicSceneCEnd={};
// __UNIT__ u0602 [1921367,1921433) kind=expr len=114
snowfallCinematicSceneCEnd["position"]=[0x31,0x9,-38.5],snowfallCinematicSceneCEnd['JoIkrtRxhZ']=[0x22,0xa,-0x16];
// __UNIT__ u0603 [1921433,1921443) kind=var len=31
var snowfallCinematicSceneC={};
// __UNIT__ u0604 [1921443,1921489) kind=expr len=159
snowfallCinematicSceneC['start']=snowfallCinematicSceneCStart,snowfallCinematicSceneC['end']=snowfallCinematicSceneCEnd,snowfallCinematicSceneC['time']=0x2ee0;
// __UNIT__ u0605 [1921489,1921499) kind=var len=31
var snowfallSkyboxMaterials={};
// __UNIT__ u0606 [1921499,1921626) kind=expr len=211
snowfallSkyboxMaterials["icicles"]='ice.webp',snowfallSkyboxMaterials["opaque_water"]='water.webp',snowfallSkyboxMaterials["terrainTexture"]='croppedterrain.webp',snowfallSkyboxMaterials['aurora']="aurora.webp";
// __UNIT__ u0607 [1921626,1921636) kind=var len=32
var snowfallNightLightPreset={};
// __UNIT__ u0608 [1921636,1921752) kind=expr len=204
snowfallNightLightPreset["night"]=!![],snowfallNightLightPreset['skyboxMult']=[0.4,0.4,0.4],snowfallNightLightPreset['sunColor']=[0x1,0.7,0.4],snowfallNightLightPreset['sunDirection']=[-0.5,0.8*0.7,-0.3];
// __UNIT__ u0609 [1921752,1921762) kind=var len=30
var snowfallDayLightPreset={};
// __UNIT__ u0610 [1921762,1921857) kind=expr len=155
snowfallDayLightPreset['skyboxMult']=[0x1,0x1,0x1],snowfallDayLightPreset['sunColor']=[0x1,0.9,0.8],snowfallDayLightPreset['sunDirection']=[-0.5,0.8,-0.3];
// __UNIT__ u0611 [1921857,1921867) kind=var len=24
var skyboxTextureMap={};
// __UNIT__ u0612 [1921867,1922057) kind=expr len=274
skyboxTextureMap["HazardStripe1"]="HazardStripe1.png",skyboxTextureMap["tiretracks1"]="tiretracks1.webp",skyboxTextureMap['vines1']='vines2.webp',skyboxTextureMap["water1"]='water1.webp',skyboxTextureMap['waterfall1']="waterfall1.webp",skyboxTextureMap['light']='light.png';
// __UNIT__ u0613 [1922057,1922067) kind=var len=31
var forestSunsetLightPreset={};
// __UNIT__ u0614 [1922067,1922180) kind=expr len=197
forestSunsetLightPreset['sunset']=!![],forestSunsetLightPreset["skyboxMult"]=[1.1,0.9,0.7],forestSunsetLightPreset['sunColor']=[1.2,0.8,0.4],forestSunsetLightPreset["sunDirection"]=[-0.5,0.8,-0.3];
// __UNIT__ u0615 [1922180,1922190) kind=var len=28
var forestDayLightPreset={};
// __UNIT__ u0616 [1922190,1922289) kind=expr len=153
forestDayLightPreset["skyboxMult"]=[1.1,1.1,1.1],forestDayLightPreset['sunColor']=[1.1,0.9,0.7],forestDayLightPreset["sunDirection"]=[-0.5,0.8*1.7,-0.3];
// __UNIT__ u0617 [1922289,1922299) kind=var len=20
var spawnPointVX={};
// __UNIT__ u0618 [1922299,1922377) kind=expr len=128
spawnPointVX['x']=0x0,spawnPointVX['y']=9.299999952316284,spawnPointVX['z']=0x0,spawnPointVX['rx']=0x3e,spawnPointVX['ry']=0xf9;
// __UNIT__ u0619 [1922377,1922387) kind=var len=20
var spawnPointVY={};
// __UNIT__ u0620 [1922387,1922465) kind=expr len=128
spawnPointVY['x']=5.800000190734863,spawnPointVY['y']=4.5,spawnPointVY['z']=0xf,spawnPointVY['rx']=0x3e,spawnPointVY['ry']=0xee;
// __UNIT__ u0621 [1922465,1922475) kind=var len=20
var spawnPointVZ={};
// __UNIT__ u0622 [1922475,1922582) kind=expr len=157
spawnPointVZ['x']=54.400001525878906,spawnPointVZ['y']=7.099999904632568,spawnPointVZ['z']=8.100000381469727,spawnPointVZ['rx']=0x3e,spawnPointVZ['ry']=0x5f;
// __UNIT__ u0623 [1922582,1922592) kind=var len=20
var spawnPointW0={};
// __UNIT__ u0624 [1922592,1922671) kind=expr len=129
spawnPointW0['x']=65.80000305175781,spawnPointW0['y']=4.5,spawnPointW0['z']=-0xf,spawnPointW0['rx']=0x3f,spawnPointW0['ry']=0x62;
// __UNIT__ u0625 [1922671,1922681) kind=var len=20
var spawnPointW1={};
// __UNIT__ u0626 [1922681,1922776) kind=expr len=145
spawnPointW1['x']=47.599998474121094,spawnPointW1['y']=4.5,spawnPointW1['z']=-16.700000762939453,spawnPointW1['rx']=0x3e,spawnPointW1['ry']=0xb9;
// __UNIT__ u0627 [1922776,1922786) kind=var len=20
var spawnPointW2={};
// __UNIT__ u0628 [1922786,1922895) kind=expr len=159
spawnPointW2['x']=27.100000381469727,spawnPointW2['y']=3.200000047683716,spawnPointW2['z']=-23.899999618530273,spawnPointW2['rx']=0x40,spawnPointW2['ry']=0xc7;
// __UNIT__ u0629 [1922895,1922905) kind=var len=20
var spawnPointW3={};
// __UNIT__ u0630 [1922905,1922999) kind=expr len=144
spawnPointW3['x']=50.20000076293945,spawnPointW3['y']=4.5,spawnPointW3['z']=-40.400001525878906,spawnPointW3['rx']=0x3f,spawnPointW3['ry']=0x62;
// __UNIT__ u0631 [1922999,1923009) kind=var len=20
var spawnPointW4={};
// __UNIT__ u0632 [1923009,1923103) kind=expr len=144
spawnPointW4['x']=17.799999237060547,spawnPointW4['y']=5.5,spawnPointW4['z']=-33.20000076293945,spawnPointW4['rx']=0x40,spawnPointW4['ry']=0x3d;
// __UNIT__ u0633 [1923103,1923113) kind=var len=20
var spawnPointW5={};
// __UNIT__ u0634 [1923113,1923222) kind=expr len=159
spawnPointW5['x']=-12.399999618530273,spawnPointW5['y']=1.899999976158142,spawnPointW5['z']=-7.800000190734863,spawnPointW5['rx']=0x3f,spawnPointW5['ry']=0xd7;
// __UNIT__ u0635 [1923222,1923232) kind=var len=20
var spawnPointW6={};
// __UNIT__ u0636 [1923232,1923344) kind=expr len=162
spawnPointW6['x']=-29.899999618530273,spawnPointW6['y']=-0.10000000149011612,spawnPointW6['z']=-34.29999923706055,spawnPointW6['rx']=0x40,spawnPointW6['ry']=0xa3;
// __UNIT__ u0637 [1923344,1923354) kind=var len=20
var spawnPointW7={};
// __UNIT__ u0638 [1923354,1923451) kind=expr len=147
spawnPointW7['x']=-10.899999618530273,spawnPointW7['y']=2.9000000953674316,spawnPointW7['z']=-26.5,spawnPointW7['rx']=0x3d,spawnPointW7['ry']=0x45;
// __UNIT__ u0639 [1923451,1923461) kind=var len=20
var spawnPointW8={};
// __UNIT__ u0640 [1923461,1923541) kind=expr len=130
spawnPointW8['x']=26.899999618530273,spawnPointW8['y']=0x4,spawnPointW8['z']=-0xa,spawnPointW8['rx']=0x40,spawnPointW8['ry']=0x80;
// __UNIT__ u0641 [1923541,1923551) kind=var len=21
var mapNavPointW9={};
// __UNIT__ u0642 [1923551,1923633) kind=expr len=115
mapNavPointW9['x']=52.412523935983245,mapNavPointW9['y']=3.0143806332057093,mapNavPointW9['z']=-12.506612329683776;
// __UNIT__ u0643 [1923633,1923643) kind=var len=21
var mapNavPointWa={};
// __UNIT__ u0644 [1923643,1923726) kind=expr len=116
mapNavPointWa['x']=-18.73772430419922,mapNavPointWa['y']=-0.9737320028873911,mapNavPointWa['z']=-21.204753875732422;
// __UNIT__ u0645 [1923726,1923736) kind=var len=21
var mapNavPointWb={};
// __UNIT__ u0646 [1923736,1923818) kind=expr len=115
mapNavPointWb['x']=1.2392575152488483,mapNavPointWb['y']=3.0356469812039117,mapNavPointWb['z']=-30.324765287067407;
// __UNIT__ u0647 [1923818,1923828) kind=var len=21
var mapNavPointWc={};
// __UNIT__ u0648 [1923828,1923906) kind=expr len=111
mapNavPointWc['x']=-6.566822092670819,mapNavPointWc['y']=2.82443876168052,mapNavPointWc['z']=11.94691137566032;
// __UNIT__ u0649 [1923906,1923916) kind=var len=21
var mapNavPointWd={};
// __UNIT__ u0650 [1923916,1923997) kind=expr len=114
mapNavPointWd['x']=32.89552688598633,mapNavPointWd['y']=1.8954384733746004,mapNavPointWd['z']=-25.613801956176758;
// __UNIT__ u0651 [1923997,1924007) kind=var len=27
var waterSmokeEmitterWe={};
// __UNIT__ u0653 [1924168,1924178) kind=var len=30
var forestWaterfallEmitter={};
// __UNIT__ u0654 [1924178,1924279) kind=expr len=181
forestWaterfallEmitter['directional']=!![],forestWaterfallEmitter['position']=[-0x28,-0xa,-0x26],forestWaterfallEmitter['volume']=1.2,forestWaterfallEmitter['file']='waterfall.mp3';
// __UNIT__ u0655 [1924279,1924289) kind=var len=29
var forestAmbienceEmitter={};
// __UNIT__ u0656 [1924289,1924385) kind=expr len=172
forestAmbienceEmitter['directional']=!![],forestAmbienceEmitter['position']=[0x21,0x19,-3.5],forestAmbienceEmitter['volume']=1.7,forestAmbienceEmitter['file']='forest.mp3';
// __UNIT__ u0657 [1924385,1924395) kind=var len=34
var forestCinematicSceneAStart={};
// __UNIT__ u0658 [1924395,1924457) kind=expr len=110
forestCinematicSceneAStart['position']=[44.5,0x5,3.5],forestCinematicSceneAStart['JoIkrtRxhZ']=[-3.5,4.5,4.8];
// __UNIT__ u0659 [1924457,1924467) kind=var len=32
var forestCinematicSceneAEnd={};
// __UNIT__ u0660 [1924467,1924529) kind=expr len=106
forestCinematicSceneAEnd['position']=[0x1c,4.5,0x3],forestCinematicSceneAEnd['JoIkrtRxhZ']=[-3.5,4.5,4.8];
// __UNIT__ u0661 [1924529,1924539) kind=var len=29
var forestCinematicSceneA={};
// __UNIT__ u0662 [1924539,1924585) kind=expr len=149
forestCinematicSceneA["start"]=forestCinematicSceneAStart,forestCinematicSceneA['end']=forestCinematicSceneAEnd,forestCinematicSceneA["time"]=0x3a98;
// __UNIT__ u0663 [1924585,1924595) kind=var len=34
var forestCinematicSceneBStart={};
// __UNIT__ u0664 [1924595,1924662) kind=expr len=115
forestCinematicSceneBStart["position"]=[-0xc,0.4,-0x13],forestCinematicSceneBStart['JoIkrtRxhZ']=[-0x28,0x5,-0x26];
// __UNIT__ u0665 [1924662,1924672) kind=var len=32
var forestCinematicSceneBEnd={};
// __UNIT__ u0666 [1924672,1924740) kind=expr len=112
forestCinematicSceneBEnd["position"]=[-0x16,0.5,-0x15],forestCinematicSceneBEnd['JoIkrtRxhZ']=[-0x28,0x5,-0x26];
// __UNIT__ u0667 [1924740,1924750) kind=var len=29
var forestCinematicSceneB={};
// __UNIT__ u0668 [1924750,1924796) kind=expr len=149
forestCinematicSceneB['start']=forestCinematicSceneBStart,forestCinematicSceneB["end"]=forestCinematicSceneBEnd,forestCinematicSceneB["time"]=0x1f40;
// __UNIT__ u0669 [1924796,1924806) kind=var len=28
var vegetationTextureMap={};
// __UNIT__ u0670 [1924806,1925306) kind=expr len=734
vegetationTextureMap['Grass']="compressedTextures/Grass.webp",vegetationTextureMap["Bush2"]='Bush2.webp',vegetationTextureMap['Wood']='compressedTextures/Wood.webp',vegetationTextureMap['Bush3']="compressedTextures/Bush3.webp",vegetationTextureMap['PlantsPlanter']="PlantsPlanter.png",vegetationTextureMap["Bush"]="compressedTextures/Bush.webp",vegetationTextureMap["Leaves"]='compressedTextures/Leaves.webp',vegetationTextureMap['Brick2']='compressedTextures/Brick2.webp',vegetationTextureMap['TrimSheet2']='TrimSheet2.webp',vegetationTextureMap['Water']="Water.png",vegetationTextureMap['Tile']='compressedTextures/Tile.webp',vegetationTextureMap["Grass.001"]="compressedTextures/Grass.webp",vegetationTextureMap['Wine']="Wine.png";
// __UNIT__ u0671 [1925306,1925316) kind=var len=28
var manorSunsetSkyPreset={};
// __UNIT__ u0672 [1925316,1925428) kind=expr len=184
manorSunsetSkyPreset['sunset']=!![],manorSunsetSkyPreset['skyboxMult']=[1.1,0.9,0.7],manorSunsetSkyPreset['sunColor']=[1.2,0.8,0.4],manorSunsetSkyPreset["sunDirection"]=[0.4,0.8,-0.1];
// __UNIT__ u0673 [1925428,1925438) kind=var len=30
var manorDaylightSkyPreset={};
// __UNIT__ u0674 [1925438,1925533) kind=expr len=155
manorDaylightSkyPreset["skyboxMult"]=[0x1,0x1,0x1],manorDaylightSkyPreset["sunColor"]=[0x1,0.8,0.6],manorDaylightSkyPreset['sunDirection']=[-0.5,1.2,-0.3];
// __UNIT__ u0675 [1925533,1925543) kind=var len=20
var spawnPointWq={};
// __UNIT__ u0676 [1925543,1925653) kind=expr len=160
spawnPointWq['x']=-17.700000762939453,spawnPointWq['y']=-9.300000190734863,spawnPointWq['z']=-36.79999923706055,spawnPointWq['rx']=0x40,spawnPointWq['ry']=0x7e;
// __UNIT__ u0677 [1925653,1925663) kind=var len=20
var spawnPointWr={};
// __UNIT__ u0678 [1925663,1925744) kind=expr len=131
spawnPointWr['x']=4.5,spawnPointWr['y']=-1.5,spawnPointWr['z']=-16.399999618530273,spawnPointWr['rx']=0x40,spawnPointWr['ry']=0xdf;
// __UNIT__ u0679 [1925744,1925754) kind=var len=20
var spawnPointWt={};
// __UNIT__ u0680 [1925754,1925850) kind=expr len=146
spawnPointWt['x']=40.900001525878906,spawnPointWt['y']=-1.5,spawnPointWt['z']=-2.4000000953674316,spawnPointWt['rx']=0x40,spawnPointWt['ry']=0x3e;
// __UNIT__ u0681 [1925850,1925860) kind=var len=20
var spawnPointWu={};
// __UNIT__ u0682 [1925860,1925940) kind=expr len=130
spawnPointWu['x']=0xd,spawnPointWu['y']=-1.5,spawnPointWu['z']=14.699999809265137,spawnPointWu['rx']=0x3f,spawnPointWu['ry']=0xfa;
// __UNIT__ u0683 [1925940,1925950) kind=var len=20
var spawnPointWv={};
// __UNIT__ u0684 [1925950,1926032) kind=expr len=132
spawnPointWv['x']=-22.5,spawnPointWv['y']=-4.900000095367432,spawnPointWv['z']=30.5,spawnPointWv['rx']=0x3e,spawnPointWv['ry']=0x27;
// __UNIT__ u0685 [1926032,1926042) kind=var len=20
var spawnPointWw={};
// __UNIT__ u0686 [1926042,1926138) kind=expr len=146
spawnPointWw['x']=-49.5,spawnPointWw['y']=-3.299999952316284,spawnPointWw['z']=12.100000381469727,spawnPointWw['rx']=0x3f,spawnPointWw['ry']=0x7e;
// __UNIT__ u0687 [1926138,1926148) kind=var len=20
var spawnPointWx={};
// __UNIT__ u0688 [1926148,1926214) kind=expr len=116
spawnPointWx['x']=-22.5,spawnPointWx['y']=3.5,spawnPointWx['z']=29.5,spawnPointWx['rx']=0x40,spawnPointWx['ry']=0x5;
// __UNIT__ u0689 [1926214,1926224) kind=var len=20
var spawnPointWy={};
// __UNIT__ u0690 [1926224,1926337) kind=expr len=163
spawnPointWy['x']=-26.399999618530273,spawnPointWy['y']=-0.30000001192092896,spawnPointWy['z']=-15.399999618530273,spawnPointWy['rx']=0x3e,spawnPointWy['ry']=0xc0;
// __UNIT__ u0691 [1926337,1926347) kind=var len=21
var mapNavPointWz={};
// __UNIT__ u0692 [1926347,1926427) kind=expr len=113
mapNavPointWz['x']=5.732714986719955,mapNavPointWz['y']=-2.971759557723999,mapNavPointWz['z']=-6.125143265171928;
// __UNIT__ u0693 [1926427,1926437) kind=var len=21
var mapNavPointWA={};
// __UNIT__ u0694 [1926437,1926519) kind=expr len=115
mapNavPointWA['x']=-29.691604901103915,mapNavPointWA['y']=-7.326169490814209,mapNavPointWA['z']=30.337692049077305;
// __UNIT__ u0695 [1926519,1926529) kind=var len=21
var mapNavPointWB={};
// __UNIT__ u0696 [1926529,1926611) kind=expr len=115
mapNavPointWB['x']=-34.12650415513576,mapNavPointWB['y']=1.9594128131866455,mapNavPointWB['z']=-3.9757078394100205;
// __UNIT__ u0697 [1926611,1926621) kind=var len=21
var mapNavPointWC={};
// __UNIT__ u0698 [1926621,1926701) kind=expr len=113
mapNavPointWC['x']=8.264894605498057,mapNavPointWC['y']=-2.971759557723999,mapNavPointWC['z']=-20.85391597225191;
// __UNIT__ u0699 [1926701,1926711) kind=var len=21
var mapNavPointWD={};
// __UNIT__ u0700 [1926711,1926793) kind=expr len=115
mapNavPointWD['x']=-22.127180099487305,mapNavPointWD['y']=-10.80184555053711,mapNavPointWD['z']=-17.65236473083496;
// __UNIT__ u0701 [1926793,1926803) kind=var len=21
var mapNavPointWE={};
// __UNIT__ u0702 [1926803,1926884) kind=expr len=114
mapNavPointWE['x']=28.875674573352086,mapNavPointWE['y']=-2.971759796142578,mapNavPointWE['z']=16.450500922143448;
// __UNIT__ u0703 [1926884,1926894) kind=var len=22
var smokeEmitterWf={};
// __UNIT__ u0705 [1927070,1927080) kind=var len=22
var smokeEmitterWg={};
// __UNIT__ u0707 [1927253,1927263) kind=var len=22
var smokeEmitterWh={};
// __UNIT__ u0709 [1927437,1927447) kind=var len=27
var wineParticleEmitter={};
// __UNIT__ u0711 [1927621,1927631) kind=var len=25
var manorMusicEmitter={};
// __UNIT__ u0712 [1927631,1927726) kind=expr len=155
manorMusicEmitter["directional"]=!![],manorMusicEmitter['position']=[-0x3c,0x28,0xc],manorMusicEmitter['volume']=1.2,manorMusicEmitter["file"]='music.mp3';
// __UNIT__ u0713 [1927726,1927736) kind=var len=29
var manorWaterfallEmitter={};
// __UNIT__ u0714 [1927736,1927834) kind=expr len=174
manorWaterfallEmitter["directional"]=!![],manorWaterfallEmitter['position']=[-4.2,1.5,0xd],manorWaterfallEmitter['volume']=0.25,manorWaterfallEmitter['file']="waterfall.mp3";
// __UNIT__ u0715 [1927834,1927844) kind=var len=26
var manorForestEmitter={};
// __UNIT__ u0716 [1927844,1927907) kind=expr len=111
manorForestEmitter['directional']=![],manorForestEmitter['volume']=0.1,manorForestEmitter['file']='forest.mp3';
// __UNIT__ u0717 [1927907,1927917) kind=var len=33
var manorCinematicSceneAStart={};
// __UNIT__ u0718 [1927917,1927979) kind=expr len=108
manorCinematicSceneAStart["position"]=[-0xd,0x7,-0xc],manorCinematicSceneAStart["JoIkrtRxhZ"]=[0xa,0x1,0xe];
// __UNIT__ u0719 [1927979,1927989) kind=var len=22
var cineEndFrameWn={};
// __UNIT__ u0720 [1927989,1928049) kind=expr len=84
cineEndFrameWn['position']=[0x6,0x1,0x7],cineEndFrameWn['JoIkrtRxhZ']=[0xc,0x1,0x7];
// __UNIT__ u0721 [1928049,1928059) kind=var len=28
var manorCinematicSceneA={};
// __UNIT__ u0722 [1928059,1928105) kind=expr len=135
manorCinematicSceneA['start']=manorCinematicSceneAStart,manorCinematicSceneA["end"]=cineEndFrameWn,manorCinematicSceneA["time"]=0x3a98;
// __UNIT__ u0723 [1928105,1928115) kind=var len=24
var cameraWaypointWp={};
// __UNIT__ u0724 [1928115,1928181) kind=expr len=94
cameraWaypointWp['position']=[0x14,0x4,-0x32],cameraWaypointWp["JoIkrtRxhZ"]=[-0xa,0x4,-0x28];
// __UNIT__ u0725 [1928181,1928191) kind=var len=31
var manorCinematicSceneBEnd={};
// __UNIT__ u0726 [1928191,1928255) kind=expr len=106
manorCinematicSceneBEnd['position']=[-0xb,0x2,-0x1e],manorCinematicSceneBEnd['JoIkrtRxhZ']=[-0x5,0x4,0x0];
// __UNIT__ u0727 [1928255,1928265) kind=var len=28
var manorCinematicSceneB={};
// __UNIT__ u0728 [1928265,1928311) kind=expr len=135
manorCinematicSceneB['start']=cameraWaypointWp,manorCinematicSceneB["end"]=manorCinematicSceneBEnd,manorCinematicSceneB['time']=0x3a98;
// __UNIT__ u0729 [1928311,1928321) kind=var len=20
var spawnPointWS={};
// __UNIT__ u0730 [1928321,1928401) kind=expr len=130
spawnPointWS['x']=-0x13,spawnPointWS['y']=0x2,spawnPointWS['z']=8.300000190734863,spawnPointWS['rx']=0x3f,spawnPointWS['ry']=0xe2;
// __UNIT__ u0731 [1928401,1928411) kind=var len=20
var spawnPointWT={};
// __UNIT__ u0732 [1928411,1928491) kind=expr len=130
spawnPointWT['x']=-4.400000095367432,spawnPointWT['y']=0x2,spawnPointWT['z']=0x12,spawnPointWT['rx']=0x3f,spawnPointWT['ry']=0xd0;
// __UNIT__ u0733 [1928491,1928501) kind=var len=20
var spawnPointWU={};
// __UNIT__ u0734 [1928501,1928595) kind=expr len=144
spawnPointWU['x']=26.399999618530273,spawnPointWU['y']=0x2,spawnPointWU['z']=3.4000000953674316,spawnPointWU['rx']=0x3c,spawnPointWU['ry']=0xc1;
// __UNIT__ u0735 [1928595,1928605) kind=var len=20
var spawnPointWV={};
// __UNIT__ u0736 [1928605,1928699) kind=expr len=144
spawnPointWV['x']=25.899999618530273,spawnPointWV['y']=0x2,spawnPointWV['z']=-3.799999952316284,spawnPointWV['rx']=0x3e,spawnPointWV['ry']=0x1c;
// __UNIT__ u0737 [1928699,1928709) kind=var len=20
var spawnPointWW={};
// __UNIT__ u0738 [1928709,1928804) kind=expr len=145
spawnPointWW['x']=16.399999618530273,spawnPointWW['y']=4.5,spawnPointWW['z']=-28.200000762939453,spawnPointWW['rx']=0x40,spawnPointWW['ry']=0xda;
// __UNIT__ u0739 [1928804,1928814) kind=var len=20
var spawnPointWX={};
// __UNIT__ u0740 [1928814,1928894) kind=expr len=130
spawnPointWX['x']=5.300000190734863,spawnPointWX['y']=4.5,spawnPointWX['z']=-41.5,spawnPointWX['rx']=0x3a,spawnPointWX['ry']=0x40;
// __UNIT__ u0741 [1928894,1928904) kind=var len=20
var spawnPointWY={};
// __UNIT__ u0742 [1928904,1928985) kind=expr len=131
spawnPointWY['x']=1.7000000476837158,spawnPointWY['y']=4.5,spawnPointWY['z']=-0x16,spawnPointWY['rx']=0x3e,spawnPointWY['ry']=0x18;
// __UNIT__ u0743 [1928985,1928995) kind=var len=22
var cineShotAStart={};
// __UNIT__ u0744 [1928995,1929061) kind=expr len=90
cineShotAStart["position"]=[7.12,8.5,-0x25],cineShotAStart["JoIkrtRxhZ"]=[-0xc,7.5,-0x14];
// __UNIT__ u0745 [1929061,1929071) kind=var len=19
var cineShotEnd={};
// __UNIT__ u0746 [1929071,1929137) kind=expr len=84
cineShotEnd['position']=[-2.4,6.5,-0x1d],cineShotEnd["JoIkrtRxhZ"]=[-0xc,7.5,-0x14];
// __UNIT__ u0747 [1929137,1929147) kind=var len=17
var cineShotA={};
// __UNIT__ u0748 [1929147,1929193) kind=expr len=88
cineShotA["start"]=cineShotAStart,cineShotA["end"]=cineShotEnd,cineShotA['time']=0x2ee0;
// __UNIT__ u0749 [1929193,1929203) kind=var len=22
var cameraWaypoint={};
// __UNIT__ u0750 [1929203,1929265) kind=expr len=86
cameraWaypoint['position']=[-0x3,0x5,0x9],cameraWaypoint['JoIkrtRxhZ']=[0x3,0x8,0x16];
// __UNIT__ u0751 [1929265,1929275) kind=var len=22
var cineEndFrameX3={};
// __UNIT__ u0752 [1929275,1929337) kind=expr len=86
cineEndFrameX3['position']=[0x3,0x8,0x16],cineEndFrameX3["JoIkrtRxhZ"]=[5.5,0xa,0x1e];
// __UNIT__ u0753 [1929337,1929347) kind=var len=17
var cineShotB={};
// __UNIT__ u0754 [1929347,1929393) kind=expr len=91
cineShotB['start']=cameraWaypoint,cineShotB['end']=cineEndFrameX3,cineShotB["time"]=0x3a98;
// __UNIT__ u0755 [1929393,1929403) kind=var len=24
var militiaMapConfig={};
// __UNIT__ u0757 [1929830,1929840) kind=var len=20
var spawnPointX6={};
// __UNIT__ u0758 [1929840,1929948) kind=expr len=158
spawnPointX6['x']=18.799999237060547,spawnPointX6['y']=5.300000190734863,spawnPointX6['z']=3.5999999046325684,spawnPointX6['rx']=0x40,spawnPointX6['ry']=0x7e;
// __UNIT__ u0759 [1929948,1929958) kind=var len=20
var spawnPointX7={};
// __UNIT__ u0760 [1929958,1930065) kind=expr len=157
spawnPointX7['x']=34.099998474121094,spawnPointX7['y']=5.300000190734863,spawnPointX7['z']=7.199999809265137,spawnPointX7['rx']=0x3d,spawnPointX7['ry']=0xbf;
// __UNIT__ u0761 [1930065,1930075) kind=var len=20
var spawnPointX8={};
// __UNIT__ u0762 [1930075,1930182) kind=expr len=157
spawnPointX8['x']=59.900001525878906,spawnPointX8['y']=5.300000190734863,spawnPointX8['z']=-1.100000023841858,spawnPointX8['rx']=0x3c,spawnPointX8['ry']=0x2;
// __UNIT__ u0763 [1930182,1930192) kind=var len=20
var spawnPointX9={};
// __UNIT__ u0764 [1930192,1930287) kind=expr len=145
spawnPointX9['x']=30.5,spawnPointX9['y']=5.300000190734863,spawnPointX9['z']=-15.199999809265137,spawnPointX9['rx']=0x3b,spawnPointX9['ry']=0xe4;
// __UNIT__ u0765 [1930287,1930297) kind=var len=26
var spatialGridSliceXa={};
// __UNIT__ u0766 [1930297,1930390) kind=expr len=173
spatialGridSliceXa['x']=9.5,spatialGridSliceXa['y']=5.300000190734863,spatialGridSliceXa['z']=-40.79999923706055,spatialGridSliceXa['rx']=0x3a,spatialGridSliceXa['ry']=0x40;
// __UNIT__ u0767 [1930390,1930400) kind=var len=20
var spawnPointXb={};
// __UNIT__ u0768 [1930400,1930509) kind=expr len=159
spawnPointXb['x']=12.300000190734863,spawnPointXb['y']=5.300000190734863,spawnPointXb['z']=-20.399999618530273,spawnPointXb['rx']=0x3d,spawnPointXb['ry']=0xed;
// __UNIT__ u0769 [1930509,1930519) kind=var len=20
var spawnPointXc={};
// __UNIT__ u0770 [1930519,1930629) kind=expr len=160
spawnPointXc['x']=0.10000000149011612,spawnPointXc['y']=5.300000190734863,spawnPointXc['z']=-20.299999237060547,spawnPointXc['rx']=0x39,spawnPointXc['ry']=0x2d;
// __UNIT__ u0771 [1930629,1930639) kind=var len=25
var shoothouseSpawn08={};
// __UNIT__ u0772 [1930639,1930748) kind=expr len=184
shoothouseSpawn08['x']=-26.600000381469727,shoothouseSpawn08['y']=5.300000190734863,shoothouseSpawn08['z']=-42.79999923706055,shoothouseSpawn08['rx']=0x3f,shoothouseSpawn08['ry']=0x60;
// __UNIT__ u0773 [1930748,1930758) kind=var len=20
var spawnPointXe={};
// __UNIT__ u0774 [1930758,1930868) kind=expr len=160
spawnPointXe['x']=-38.099998474121094,spawnPointXe['y']=5.300000190734863,spawnPointXe['z']=-18.100000381469727,spawnPointXe['rx']=0x3f,spawnPointXe['ry']=0x28;
// __UNIT__ u0775 [1930868,1930878) kind=var len=25
var shoothouseSpawn10={};
// __UNIT__ u0776 [1930878,1930985) kind=expr len=182
shoothouseSpawn10['x']=-34.400001525878906,shoothouseSpawn10['y']=5.300000190734863,shoothouseSpawn10['z']=32.20000076293945,shoothouseSpawn10['rx']=0x3d,shoothouseSpawn10['ry']=0x6;
// __UNIT__ u0777 [1930985,1930995) kind=var len=40
var cinematicSegmentShoothouseAStart={};
// __UNIT__ u0778 [1930995,1931061) kind=expr len=126
cinematicSegmentShoothouseAStart['position']=[7.12,8.5,-0x25],cinematicSegmentShoothouseAStart["JoIkrtRxhZ"]=[-0xc,7.5,-0x14];
// __UNIT__ u0779 [1931061,1931071) kind=var len=38
var cinematicSegmentShoothouseAEnd={};
// __UNIT__ u0780 [1931071,1931137) kind=expr len=122
cinematicSegmentShoothouseAEnd['position']=[-2.4,6.5,-0x1d],cinematicSegmentShoothouseAEnd["JoIkrtRxhZ"]=[-0xc,7.5,-0x14];
// __UNIT__ u0781 [1931137,1931147) kind=var len=35
var cinematicSegmentShoothouseA={};
// __UNIT__ u0782 [1931147,1931193) kind=expr len=179
cinematicSegmentShoothouseA["start"]=cinematicSegmentShoothouseAStart,cinematicSegmentShoothouseA["end"]=cinematicSegmentShoothouseAEnd,cinematicSegmentShoothouseA['time']=0x2ee0;
// __UNIT__ u0783 [1931193,1931203) kind=var len=40
var cinematicSegmentShoothouseBStart={};
// __UNIT__ u0784 [1931203,1931265) kind=expr len=122
cinematicSegmentShoothouseBStart["position"]=[-0x3,0x5,0x9],cinematicSegmentShoothouseBStart["JoIkrtRxhZ"]=[0x3,0x8,0x16];
// __UNIT__ u0785 [1931265,1931275) kind=var len=24
var cameraWaypointXk={};
// __UNIT__ u0786 [1931275,1931337) kind=expr len=90
cameraWaypointXk['position']=[0x3,0x8,0x16],cameraWaypointXk['JoIkrtRxhZ']=[5.5,0xa,0x1e];
// __UNIT__ u0787 [1931337,1931347) kind=var len=35
var cinematicSegmentShoothouseB={};
// __UNIT__ u0788 [1931347,1931393) kind=expr len=165
cinematicSegmentShoothouseB['start']=cinematicSegmentShoothouseBStart,cinematicSegmentShoothouseB["end"]=cameraWaypointXk,cinematicSegmentShoothouseB['time']=0x3a98;
// __UNIT__ u0789 [1931393,1931403) kind=var len=27
var shoothouseMapConfig={};
// __UNIT__ u0791 [1931848,1931858) kind=var len=23
var dust2SpawnPoint={};
// __UNIT__ u0792 [1931858,1931895) kind=expr len=76
dust2SpawnPoint['x']=0x0,dust2SpawnPoint['y']=0x64,dust2SpawnPoint['z']=0x0;
// __UNIT__ u0793 [1931895,1931905) kind=var len=30
var dust2SunsetLightPreset={};
// __UNIT__ u0794 [1931905,1931923) kind=expr len=38
dust2SunsetLightPreset["sunset"]=!![];
// __UNIT__ u0795 [1931923,1931933) kind=var len=24
var cameraWaypointXp={};
// __UNIT__ u0796 [1931933,1931999) kind=expr len=94
cameraWaypointXp['position']=[7.12,8.5,-0x25],cameraWaypointXp['JoIkrtRxhZ']=[-0xc,7.5,-0x14];
// __UNIT__ u0797 [1931999,1932009) kind=var len=24
var cameraWaypointXq={};
// __UNIT__ u0798 [1932009,1932075) kind=expr len=94
cameraWaypointXq['position']=[-2.4,6.5,-0x1d],cameraWaypointXq['JoIkrtRxhZ']=[-0xc,7.5,-0x14];
// __UNIT__ u0799 [1932075,1932085) kind=var len=23
var cameraSegmentXr={};
// __UNIT__ u0800 [1932085,1932131) kind=expr len=113
cameraSegmentXr['start']=cameraWaypointXp,cameraSegmentXr["end"]=cameraWaypointXq,cameraSegmentXr['time']=0x2ee0;
// __UNIT__ u0801 [1932131,1932141) kind=var len=24
var cameraWaypointXs={};
// __UNIT__ u0802 [1932141,1932203) kind=expr len=90
cameraWaypointXs["position"]=[-0x3,0x5,0x9],cameraWaypointXs['JoIkrtRxhZ']=[0x3,0x8,0x16];
// __UNIT__ u0803 [1932203,1932213) kind=var len=24
var cameraWaypointXt={};
// __UNIT__ u0804 [1932213,1932275) kind=expr len=90
cameraWaypointXt["position"]=[0x3,0x8,0x16],cameraWaypointXt['JoIkrtRxhZ']=[5.5,0xa,0x1e];
// __UNIT__ u0805 [1932275,1932285) kind=var len=23
var cameraSegmentXu={};
// __UNIT__ u0806 [1932285,1932331) kind=expr len=113
cameraSegmentXu['start']=cameraWaypointXs,cameraSegmentXu["end"]=cameraWaypointXt,cameraSegmentXu["time"]=0x3a98;
// __UNIT__ u0807 [1932331,1932341) kind=var len=22
var dust2MapConfig={};
// __UNIT__ u0809 [1932821,1932831) kind=var len=23
var neonSpawnPoint1={};
// __UNIT__ u0810 [1932831,1932925) kind=expr len=159
neonSpawnPoint1['x']=0x3,neonSpawnPoint1['y']=2.4000000953674316,neonSpawnPoint1['z']=0.6000000238418579,neonSpawnPoint1['rx']=0x3f,neonSpawnPoint1['ry']=0xb1;
// __UNIT__ u0811 [1932925,1932935) kind=var len=19
var spawnPoseXx={};
// __UNIT__ u0812 [1932935,1933029) kind=expr len=139
spawnPoseXx['x']=-11.899999618530273,spawnPoseXx['y']=1.399999976158142,spawnPoseXx['z']=0x1d,spawnPoseXx['rx']=0x3f,spawnPoseXx['ry']=0x0;
// __UNIT__ u0813 [1933029,1933039) kind=var len=19
var spawnPoseXy={};
// __UNIT__ u0814 [1933039,1933148) kind=expr len=154
spawnPoseXy['x']=-43.400001525878906,spawnPoseXy['y']=5.099999904632568,spawnPoseXy['z']=-12.899999618530273,spawnPoseXy['rx']=0x3e,spawnPoseXy['ry']=0x0;
// __UNIT__ u0815 [1933148,1933158) kind=var len=23
var neonSpawnPoint4={};
// __UNIT__ u0816 [1933158,1933252) kind=expr len=159
neonSpawnPoint4['x']=3.299999952316284,neonSpawnPoint4['y']=5.099999904632568,neonSpawnPoint4['z']=-35.5,neonSpawnPoint4['rx']=0x3f,neonSpawnPoint4['ry']=0x3f;
// __UNIT__ u0817 [1933252,1933262) kind=var len=23
var neonSpawnPoint5={};
// __UNIT__ u0818 [1933262,1933371) kind=expr len=174
neonSpawnPoint5['x']=2.9000000953674316,neonSpawnPoint5['y']=2.4000000953674316,neonSpawnPoint5['z']=-55.20000076293945,neonSpawnPoint5['rx']=0x3f,neonSpawnPoint5['ry']=0xbb;
// __UNIT__ u0819 [1933371,1933381) kind=var len=23
var neonSpawnPoint6={};
// __UNIT__ u0820 [1933381,1933489) kind=expr len=173
neonSpawnPoint6['x']=44.20000076293945,neonSpawnPoint6['y']=0.6000000238418579,neonSpawnPoint6['z']=35.099998474121094,neonSpawnPoint6['rx']=0x40,neonSpawnPoint6['ry']=0xfe;
// __UNIT__ u0821 [1933489,1933499) kind=var len=23
var neonSpawnPoint7={};
// __UNIT__ u0822 [1933499,1933608) kind=expr len=174
neonSpawnPoint7['x']=15.100000381469727,neonSpawnPoint7['y']=0.6000000238418579,neonSpawnPoint7['z']=20.700000762939453,neonSpawnPoint7['rx']=0x40,neonSpawnPoint7['ry']=0x7e;
// __UNIT__ u0823 [1933608,1933618) kind=var len=23
var neonSpawnPoint8={};
// __UNIT__ u0824 [1933618,1933725) kind=expr len=172
neonSpawnPoint8['x']=-6.699999809265137,neonSpawnPoint8['y']=5.199999809265137,neonSpawnPoint8['z']=32.79999923706055,neonSpawnPoint8['rx']=0x40,neonSpawnPoint8['ry']=0x3f;
// __UNIT__ u0825 [1933725,1933735) kind=var len=23
var neonSpawnPoint9={};
// __UNIT__ u0826 [1933735,1933830) kind=expr len=160
neonSpawnPoint9['x']=-0x22,neonSpawnPoint9['y']=5.099999904632568,neonSpawnPoint9['z']=11.699999809265137,neonSpawnPoint9['rx']=0x3e,neonSpawnPoint9['ry']=0x9f;
// __UNIT__ u0827 [1933830,1933840) kind=var len=24
var neonSpawnPoint10={};
// __UNIT__ u0828 [1933840,1933935) kind=expr len=165
neonSpawnPoint10['x']=-10.399999618530273,neonSpawnPoint10['y']=5.099999904632568,neonSpawnPoint10['z']=-0x5,neonSpawnPoint10['rx']=0x3f,neonSpawnPoint10['ry']=0x17;
// __UNIT__ u0829 [1933935,1933945) kind=var len=24
var neonSpawnPoint11={};
// __UNIT__ u0830 [1933945,1934025) kind=expr len=150
neonSpawnPoint11['x']=0x18,neonSpawnPoint11['y']=4.699999809265137,neonSpawnPoint11['z']=-8.5,neonSpawnPoint11['rx']=0x3f,neonSpawnPoint11['ry']=0xfe;
// __UNIT__ u0831 [1934025,1934035) kind=var len=21
var mapNavPointXh={};
// __UNIT__ u0832 [1934035,1934117) kind=expr len=115
mapNavPointXh['x']=15.868224620889578,mapNavPointXh['y']=2.0329501628875732,mapNavPointXh['z']=-22.804766712552237;
// __UNIT__ u0833 [1934117,1934127) kind=var len=21
var mapNavPointXi={};
// __UNIT__ u0834 [1934127,1934210) kind=expr len=116
mapNavPointXi['x']=-29.197706193916815,mapNavPointXi['y']=3.6473002433776855,mapNavPointXi['z']=-17.805919632908115;
// __UNIT__ u0835 [1934210,1934220) kind=var len=21
var mapNavPointXj={};
// __UNIT__ u0836 [1934220,1934301) kind=expr len=114
mapNavPointXj['x']=-14.1786896891876,mapNavPointXj['y']=-0.09599995613098145,mapNavPointXj['z']=9.136772605472586;
// __UNIT__ u0837 [1934301,1934311) kind=var len=21
var mapNavPointXk={};
// __UNIT__ u0838 [1934311,1934391) kind=expr len=113
mapNavPointXk['x']=-11.579063306655485,mapNavPointXk['y']=3.6514501571655273,mapNavPointXk['z']=34.7989858764829;
// __UNIT__ u0839 [1934391,1934401) kind=var len=21
var mapNavPointXl={};
// __UNIT__ u0840 [1934401,1934482) kind=expr len=114
mapNavPointXl['x']=44.34040796858392,mapNavPointXl['y']=-0.9010999798774719,mapNavPointXl['z']=30.401688410140366;
// __UNIT__ u0841 [1934482,1934492) kind=var len=21
var mapNavPointXm={};
// __UNIT__ u0842 [1934492,1934573) kind=expr len=114
mapNavPointXm['x']=26.33950352505417,mapNavPointXm['y']=0.9000000953674316,mapNavPointXm['z']=-0.3088005135245737;
// __UNIT__ u0843 [1934573,1934583) kind=var len=21
var mapNavPointXn={};
// __UNIT__ u0844 [1934583,1934664) kind=expr len=114
mapNavPointXn['x']=15.142993255860155,mapNavPointXn['y']=0.9000000953674316,mapNavPointXn['z']=-50.85724878695524;
// __UNIT__ u0845 [1934664,1934674) kind=var len=24
var midnightSunColor={};
// __UNIT__ u0846 [1934674,1934756) kind=expr len=124
midnightSunColor['x']=0.7294117647058823,midnightSunColor['y']=0.5803921568627451,midnightSunColor['z']=0.17254901960784313;
// __UNIT__ u0847 [1934756,1934766) kind=var len=28
var midnightSunDirection={};
// __UNIT__ u0848 [1934766,1934808) kind=expr len=96
midnightSunDirection['x']='0.61',midnightSunDirection['y']=0.8,midnightSunDirection['z']='0.84';
// __UNIT__ u0849 [1934808,1934818) kind=var len=26
var mapLightPositionXQ={};
// __UNIT__ u0850 [1934818,1934887) kind=expr len=117
mapLightPositionXQ['x']=-3.788101881634068,mapLightPositionXQ['y']=0.9375,mapLightPositionXQ['z']=1.5939705581246888;
// __UNIT__ u0851 [1934887,1934897) kind=var len=24
var mapLightPresetXR={};
// __UNIT__ u0852 [1934897,1934938) kind=expr len=85
mapLightPresetXR["preset"]='default',mapLightPresetXR["position"]=mapLightPositionXQ;
// __UNIT__ u0853 [1934938,1934948) kind=var len=26
var mapLightPositionXS={};
// __UNIT__ u0854 [1934948,1935018) kind=expr len=118
mapLightPositionXS['x']=-1.2025000000000001,mapLightPositionXS['y']=0.7625000000000001,mapLightPositionXS['z']=-5.835;
// __UNIT__ u0855 [1935018,1935028) kind=var len=24
var mapLightPresetXT={};
// __UNIT__ u0856 [1935028,1935069) kind=expr len=85
mapLightPresetXT["preset"]="default",mapLightPresetXT["position"]=mapLightPositionXS;
// __UNIT__ u0857 [1935069,1935079) kind=var len=26
var mapLightPositionXU={};
// __UNIT__ u0858 [1935079,1935138) kind=expr len=107
mapLightPositionXU['x']=-1.7325,mapLightPositionXU['y']=0.7624253487949407,mapLightPositionXU['z']=-5.5925;
// __UNIT__ u0859 [1935138,1935148) kind=var len=24
var mapLightPresetXV={};
// __UNIT__ u0860 [1935148,1935189) kind=expr len=85
mapLightPresetXV["preset"]="default",mapLightPresetXV['position']=mapLightPositionXU;
// __UNIT__ u0861 [1935189,1935199) kind=var len=26
var mapLightPositionXW={};
// __UNIT__ u0862 [1935199,1935255) kind=expr len=104
mapLightPositionXW['x']=-2.255,mapLightPositionXW['y']=0.7651411327434875,mapLightPositionXW['z']=-5.34;
// __UNIT__ u0863 [1935255,1935265) kind=var len=24
var mapLightPresetXX={};
// __UNIT__ u0864 [1935265,1935306) kind=expr len=85
mapLightPresetXX["preset"]='default',mapLightPresetXX['position']=mapLightPositionXW;
// __UNIT__ u0865 [1935306,1935316) kind=var len=26
var mapLightPositionXY={};
// __UNIT__ u0866 [1935316,1935358) kind=expr len=90
mapLightPositionXY['x']=-2.465,mapLightPositionXY['y']=1.01,mapLightPositionXY['z']=-5.26;
// __UNIT__ u0867 [1935358,1935368) kind=var len=24
var mapLightPresetXZ={};
// __UNIT__ u0868 [1935368,1935406) kind=expr len=82
mapLightPresetXZ['preset']='Blue',mapLightPresetXZ['position']=mapLightPositionXY;
// __UNIT__ u0869 [1935406,1935416) kind=var len=23
var lightPositionY0={};
// __UNIT__ u0870 [1935416,1935462) kind=expr len=85
lightPositionY0['x']=-0.905,lightPositionY0['y']=1.2425,lightPositionY0['z']=-6.0875;
// __UNIT__ u0871 [1935462,1935472) kind=var len=24
var mapLightPresetY1={};
// __UNIT__ u0872 [1935472,1935512) kind=expr len=81
mapLightPresetY1['preset']='Purple',mapLightPresetY1['position']=lightPositionY0;
// __UNIT__ u0873 [1935512,1935522) kind=var len=23
var lightPositionY2={};
// __UNIT__ u0874 [1935522,1935566) kind=expr len=83
lightPositionY2['x']=-0.9,lightPositionY2['y']=1.3825,lightPositionY2['z']=-6.0875;
// __UNIT__ u0875 [1935566,1935576) kind=var len=24
var mapLightPresetY3={};
// __UNIT__ u0876 [1935576,1935616) kind=expr len=81
mapLightPresetY3['preset']="Purple",mapLightPresetY3['position']=lightPositionY2;
// __UNIT__ u0877 [1935616,1935626) kind=var len=23
var lightPositionY4={};
// __UNIT__ u0878 [1935626,1935671) kind=expr len=84
lightPositionY4['x']=-0.8975,lightPositionY4['y']=1.51,lightPositionY4['z']=-6.0925;
// __UNIT__ u0879 [1935671,1935681) kind=var len=24
var mapLightPresetY5={};
// __UNIT__ u0880 [1935681,1935721) kind=expr len=81
mapLightPresetY5['preset']='Purple',mapLightPresetY5['position']=lightPositionY4;
// __UNIT__ u0881 [1935721,1935731) kind=var len=23
var lightPositionY6={};
// __UNIT__ u0882 [1935731,1935772) kind=expr len=80
lightPositionY6['x']=-2.68,lightPositionY6['y']=1.01,lightPositionY6['z']=-5.26;
// __UNIT__ u0883 [1935772,1935782) kind=var len=24
var mapLightPresetY7={};
// __UNIT__ u0884 [1935782,1935820) kind=expr len=79
mapLightPresetY7['preset']="Blue",mapLightPresetY7['position']=lightPositionY6;
// __UNIT__ u0885 [1935820,1935830) kind=var len=23
var lightPositionY8={};
// __UNIT__ u0886 [1935830,1935876) kind=expr len=85
lightPositionY8['x']=-2.8875,lightPositionY8['y']=1.0175,lightPositionY8['z']=-5.255;
// __UNIT__ u0887 [1935876,1935886) kind=var len=24
var mapLightPresetY9={};
// __UNIT__ u0888 [1935886,1935924) kind=expr len=79
mapLightPresetY9["preset"]='Blue',mapLightPresetY9['position']=lightPositionY8;
// __UNIT__ u0889 [1935924,1935934) kind=var len=26
var mapLightPositionYa={};
// __UNIT__ u0890 [1935934,1936014) kind=expr len=128
mapLightPositionYa['x']=1.276411883786117,mapLightPositionYa['y']=2.0844754887137156,mapLightPositionYa['z']=-7.050182819366453;
// __UNIT__ u0891 [1936014,1936024) kind=var len=28
var buildingLightPointYb={};
// __UNIT__ u0892 [1936024,1936071) kind=expr len=99
buildingLightPointYb["preset"]="BuildingLight",buildingLightPointYb['position']=mapLightPositionYa;
// __UNIT__ u0893 [1936071,1936081) kind=var len=26
var mapLightPositionYc={};
// __UNIT__ u0894 [1936081,1936161) kind=expr len=128
mapLightPositionYc['x']=1.886127149969321,mapLightPositionYc['y']=1.7060363612810894,mapLightPositionYc['z']=-7.050182819366453;
// __UNIT__ u0895 [1936161,1936171) kind=var len=28
var buildingLightPointYd={};
// __UNIT__ u0896 [1936171,1936218) kind=expr len=99
buildingLightPointYd['preset']='BuildingLight',buildingLightPointYd['position']=mapLightPositionYc;
// __UNIT__ u0897 [1936218,1936228) kind=var len=26
var mapLightPositionYe={};
// __UNIT__ u0898 [1936228,1936309) kind=expr len=129
mapLightPositionYe['x']=1.4750740642455031,mapLightPositionYe['y']=1.7068279324936582,mapLightPositionYe['z']=-7.050182819366453;
// __UNIT__ u0899 [1936309,1936319) kind=var len=28
var buildingLightPointYf={};
// __UNIT__ u0900 [1936319,1936366) kind=expr len=99
buildingLightPointYf["preset"]='BuildingLight',buildingLightPointYf["position"]=mapLightPositionYe;
// __UNIT__ u0901 [1936366,1936376) kind=var len=26
var mapLightPositionYg={};
// __UNIT__ u0902 [1936376,1936457) kind=expr len=129
mapLightPositionYg['x']=2.2694581446110367,mapLightPositionYg['y']=1.1451601847988118,mapLightPositionYg['z']=-6.967312335968017;
// __UNIT__ u0903 [1936457,1936467) kind=var len=28
var buildingLightPointYh={};
// __UNIT__ u0904 [1936467,1936514) kind=expr len=99
buildingLightPointYh["preset"]="BuildingLight",buildingLightPointYh['position']=mapLightPositionYg;
// __UNIT__ u0905 [1936514,1936524) kind=var len=26
var mapLightPositionYi={};
// __UNIT__ u0906 [1936524,1936604) kind=expr len=128
mapLightPositionYi['x']=1.8892629070848654,mapLightPositionYi['y']=1.141903197401744,mapLightPositionYi['z']=-6.967312335968018;
// __UNIT__ u0907 [1936604,1936614) kind=var len=28
var buildingLightPointYj={};
// __UNIT__ u0908 [1936614,1936661) kind=expr len=99
buildingLightPointYj["preset"]='BuildingLight',buildingLightPointYj['position']=mapLightPositionYi;
// __UNIT__ u0909 [1936661,1936671) kind=var len=26
var mapLightPositionYk={};
// __UNIT__ u0910 [1936671,1936752) kind=expr len=129
mapLightPositionYk['x']=-1.521255804273569,mapLightPositionYk['y']=2.3222496475829266,mapLightPositionYk['z']=-6.375516603508654;
// __UNIT__ u0911 [1936752,1936762) kind=var len=28
var buildingLightPointYl={};
// __UNIT__ u0912 [1936762,1936809) kind=expr len=99
buildingLightPointYl["preset"]='BuildingLight',buildingLightPointYl["position"]=mapLightPositionYk;
// __UNIT__ u0913 [1936809,1936819) kind=var len=26
var mapLightPositionYm={};
// __UNIT__ u0914 [1936819,1936900) kind=expr len=129
mapLightPositionYm['x']=-1.7755782474522284,mapLightPositionYm['y']=3.349978457702597,mapLightPositionYm['z']=-6.253032698416195;
// __UNIT__ u0915 [1936900,1936910) kind=var len=28
var buildingLightPointYn={};
// __UNIT__ u0916 [1936910,1936957) kind=expr len=99
buildingLightPointYn['preset']='BuildingLight',buildingLightPointYn["position"]=mapLightPositionYm;
// __UNIT__ u0917 [1936957,1936967) kind=var len=26
var mapLightPositionYo={};
// __UNIT__ u0918 [1936967,1937049) kind=expr len=130
mapLightPositionYo['x']=-2.2814065133199994,mapLightPositionYo['y']=3.348895076766533,mapLightPositionYo['z']=-6.0094211913120255;
// __UNIT__ u0919 [1937049,1937059) kind=var len=28
var buildingLightPointYp={};
// __UNIT__ u0920 [1937059,1937106) kind=expr len=99
buildingLightPointYp['preset']='BuildingLight',buildingLightPointYp["position"]=mapLightPositionYo;
// __UNIT__ u0921 [1937106,1937116) kind=var len=26
var mapLightPositionYq={};
// __UNIT__ u0922 [1937116,1937198) kind=expr len=130
mapLightPositionYq['x']=-2.7845710483559043,mapLightPositionYq['y']=2.3148684651832023,mapLightPositionYq['z']=-5.767092710691837;
// __UNIT__ u0923 [1937198,1937208) kind=var len=28
var buildingLightPointYr={};
// __UNIT__ u0924 [1937208,1937255) kind=expr len=99
buildingLightPointYr['preset']='BuildingLight',buildingLightPointYr['position']=mapLightPositionYq;
// __UNIT__ u0925 [1937255,1937265) kind=var len=26
var mapLightPositionYs={};
// __UNIT__ u0926 [1937265,1937343) kind=expr len=126
mapLightPositionYs['x']=-3.0348787242516,mapLightPositionYs['y']=2.319675655410909,mapLightPositionYs['z']=-5.646542429497383;
// __UNIT__ u0927 [1937343,1937353) kind=var len=27
var neonBuildingLight05={};
// __UNIT__ u0928 [1937353,1937400) kind=expr len=97
neonBuildingLight05['preset']="BuildingLight",neonBuildingLight05['position']=mapLightPositionYs;
// __UNIT__ u0929 [1937400,1937410) kind=var len=26
var mapLightPositionYu={};
// __UNIT__ u0930 [1937410,1937491) kind=expr len=129
mapLightPositionYu['x']=-0.2799902192115815,mapLightPositionYu['y']=1.424306154251099,mapLightPositionYu['z']=-6.414379225512917;
// __UNIT__ u0931 [1937491,1937501) kind=var len=28
var buildingLightPointYv={};
// __UNIT__ u0932 [1937501,1937548) kind=expr len=99
buildingLightPointYv['preset']='BuildingLight',buildingLightPointYv["position"]=mapLightPositionYu;
// __UNIT__ u0933 [1937548,1937558) kind=var len=26
var mapLightPositionYw={};
// __UNIT__ u0934 [1937558,1937639) kind=expr len=129
mapLightPositionYw['x']=-0.5145207168976929,mapLightPositionYw['y']=0.975394250272792,mapLightPositionYw['z']=-6.340712345554641;
// __UNIT__ u0935 [1937639,1937649) kind=var len=28
var buildingLightPointYx={};
// __UNIT__ u0936 [1937649,1937696) kind=expr len=99
buildingLightPointYx["preset"]='BuildingLight',buildingLightPointYx["position"]=mapLightPositionYw;
// __UNIT__ u0937 [1937696,1937706) kind=var len=26
var mapLightPositionYy={};
// __UNIT__ u0938 [1937706,1937773) kind=expr len=115
mapLightPositionYy['x']=0.058592303080231,mapLightPositionYy['y']=1.38127254388771,mapLightPositionYy['z']=-6.3025;
// __UNIT__ u0939 [1937773,1937783) kind=var len=26
var purpleLightPointYz={};
// __UNIT__ u0940 [1937783,1937823) kind=expr len=88
purpleLightPointYz["preset"]="Purple",purpleLightPointYz["position"]=mapLightPositionYy;
// __UNIT__ u0941 [1937823,1937833) kind=var len=23
var lightPositionYA={};
// __UNIT__ u0942 [1937833,1937905) kind=expr len=111
lightPositionYA['x']=0.054181914821799904,lightPositionYA['y']=1.1248284203705325,lightPositionYA['z']=-6.3075;
// __UNIT__ u0943 [1937905,1937915) kind=var len=24
var mapLightPresetYB={};
// __UNIT__ u0944 [1937915,1937955) kind=expr len=81
mapLightPresetYB['preset']='Purple',mapLightPresetYB["position"]=lightPositionYA;
// __UNIT__ u0945 [1937955,1937965) kind=var len=23
var lightPositionYC={};
// __UNIT__ u0946 [1937965,1938048) kind=expr len=122
lightPositionYC['x']=0.05133169549452332,lightPositionYC['y']=0.8158600381908304,lightPositionYC['z']=-6.3100000000000005;
// __UNIT__ u0947 [1938048,1938058) kind=var len=24
var mapLightPresetYD={};
// __UNIT__ u0948 [1938058,1938098) kind=expr len=81
mapLightPresetYD["preset"]="Purple",mapLightPresetYD['position']=lightPositionYC;
// __UNIT__ u0949 [1938098,1938108) kind=var len=23
var lightPositionYE={};
// __UNIT__ u0950 [1938108,1938152) kind=expr len=83
lightPositionYE['x']=-2.835,lightPositionYE['y']=1.3875,lightPositionYE['z']=-0.66;
// __UNIT__ u0951 [1938152,1938162) kind=var len=24
var mapLightPresetYF={};
// __UNIT__ u0952 [1938162,1938206) kind=expr len=85
mapLightPresetYF["preset"]='SubwayLogo',mapLightPresetYF['position']=lightPositionYE;
// __UNIT__ u0953 [1938206,1938216) kind=var len=23
var lightPositionYG={};
// __UNIT__ u0954 [1938216,1938296) kind=expr len=119
lightPositionYG['x']=-2.1421890254724576,lightPositionYG['y']=1.409917507447883,lightPositionYG['z']=-0.96274346113205;
// __UNIT__ u0955 [1938296,1938306) kind=var len=28
var buildingLightPointYH={};
// __UNIT__ u0956 [1938306,1938353) kind=expr len=96
buildingLightPointYH['preset']='BuildingLight',buildingLightPointYH['position']=lightPositionYG;
// __UNIT__ u0957 [1938353,1938363) kind=var len=23
var lightPositionYI={};
// __UNIT__ u0958 [1938363,1938446) kind=expr len=122
lightPositionYI['x']=-1.2559624577280444,lightPositionYI['y']=1.9714911041324303,lightPositionYI['z']=-1.0606278181076048;
// __UNIT__ u0959 [1938446,1938456) kind=var len=28
var buildingLightPointYJ={};
// __UNIT__ u0960 [1938456,1938503) kind=expr len=96
buildingLightPointYJ["preset"]='BuildingLight',buildingLightPointYJ["position"]=lightPositionYI;
// __UNIT__ u0961 [1938503,1938513) kind=var len=23
var lightPositionYK={};
// __UNIT__ u0962 [1938513,1938595) kind=expr len=121
lightPositionYK['x']=-0.6643594306422824,lightPositionYK['y']=1.9829590388287464,lightPositionYK['z']=-1.060627818107605;
// __UNIT__ u0963 [1938595,1938605) kind=var len=28
var buildingLightPointYL={};
// __UNIT__ u0964 [1938605,1938652) kind=expr len=96
buildingLightPointYL["preset"]='BuildingLight',buildingLightPointYL["position"]=lightPositionYK;
// __UNIT__ u0965 [1938652,1938662) kind=var len=23
var lightPositionYM={};
// __UNIT__ u0966 [1938662,1938743) kind=expr len=120
lightPositionYM['x']=-4.024265522574681,lightPositionYM['y']=1.585179384250099,lightPositionYM['z']=-3.8782131671905526;
// __UNIT__ u0967 [1938743,1938753) kind=var len=28
var buildingLightPointYN={};
// __UNIT__ u0968 [1938753,1938800) kind=expr len=96
buildingLightPointYN['preset']='BuildingLight',buildingLightPointYN['position']=lightPositionYM;
// __UNIT__ u0969 [1938800,1938810) kind=var len=26
var mapLightPositionYO={};
// __UNIT__ u0970 [1938810,1938855) kind=expr len=93
mapLightPositionYO['x']=-0.165,mapLightPositionYO['y']=2.025,mapLightPositionYO['z']=-4.4275;
// __UNIT__ u0971 [1938855,1938865) kind=var len=26
var orangeLightPointYP={};
// __UNIT__ u0972 [1938865,1938905) kind=expr len=88
orangeLightPointYP["preset"]="Orange",orangeLightPointYP['position']=mapLightPositionYO;
// __UNIT__ u0973 [1938905,1938915) kind=var len=26
var mapLightPositionYQ={};
// __UNIT__ u0974 [1938915,1938958) kind=expr len=91
mapLightPositionYQ['x']=-0.155,mapLightPositionYQ['y']=1.76,mapLightPositionYQ['z']=-4.425;
// __UNIT__ u0975 [1938958,1938968) kind=var len=26
var orangeLightPointYR={};
// __UNIT__ u0976 [1938968,1939008) kind=expr len=88
orangeLightPointYR['preset']='Orange',orangeLightPointYR['position']=mapLightPositionYQ;
// __UNIT__ u0977 [1939008,1939018) kind=var len=26
var mapLightPositionYS={};
// __UNIT__ u0978 [1939018,1939065) kind=expr len=95
mapLightPositionYS['x']=-0.1525,mapLightPositionYS['y']=1.4975,mapLightPositionYS['z']=-4.4325;
// __UNIT__ u0979 [1939065,1939075) kind=var len=26
var orangeLightPointYT={};
// __UNIT__ u0980 [1939075,1939115) kind=expr len=88
orangeLightPointYT["preset"]="Orange",orangeLightPointYT["position"]=mapLightPositionYS;
// __UNIT__ u0981 [1939115,1939125) kind=var len=26
var mapLightPositionYU={};
// __UNIT__ u0982 [1939125,1939192) kind=expr len=115
mapLightPositionYU['x']=-0.18,mapLightPositionYU['y']=2.035703374647007,mapLightPositionYU['z']=-4.702646710847129;
// __UNIT__ u0983 [1939192,1939202) kind=var len=24
var blueLightPointYV={};
// __UNIT__ u0984 [1939202,1939240) kind=expr len=82
blueLightPointYV['preset']="Blue",blueLightPointYV["position"]=mapLightPositionYU;
// __UNIT__ u0985 [1939240,1939250) kind=var len=26
var mapLightPositionYW={};
// __UNIT__ u0986 [1939250,1939318) kind=expr len=116
mapLightPositionYW['x']=-0.16,mapLightPositionYW['y']=1.6387414286138966,mapLightPositionYW['z']=-4.706646303909892;
// __UNIT__ u0987 [1939318,1939328) kind=var len=24
var blueLightPointYX={};
// __UNIT__ u0988 [1939328,1939366) kind=expr len=82
blueLightPointYX['preset']='Blue',blueLightPointYX['position']=mapLightPositionYW;
// __UNIT__ u0989 [1939366,1939376) kind=var len=26
var mapLightPositionYY={};
// __UNIT__ u0990 [1939376,1939433) kind=expr len=105
mapLightPositionYY['x']=-0.1675,mapLightPositionYY['y']=1.835,mapLightPositionYY['z']=-4.704752992517663;
// __UNIT__ u0991 [1939433,1939443) kind=var len=24
var blueLightPointYZ={};
// __UNIT__ u0992 [1939443,1939481) kind=expr len=82
blueLightPointYZ["preset"]="Blue",blueLightPointYZ["position"]=mapLightPositionYY;
// __UNIT__ u0993 [1939481,1939491) kind=var len=26
var mapLightPositionZ0={};
// __UNIT__ u0994 [1939491,1939537) kind=expr len=94
mapLightPositionZ0['x']=0.2525,mapLightPositionZ0['y']=1.0925,mapLightPositionZ0['z']=-5.2425;
// __UNIT__ u0995 [1939537,1939547) kind=var len=24
var mapLightPresetZ1={};
// __UNIT__ u0996 [1939547,1939585) kind=expr len=82
mapLightPresetZ1['preset']="Blue",mapLightPresetZ1['position']=mapLightPositionZ0;
// __UNIT__ u0997 [1939585,1939595) kind=var len=26
var mapLightPositionZ2={};
// __UNIT__ u0998 [1939595,1939675) kind=expr len=128
mapLightPositionZ2['x']=0.765326968728536,mapLightPositionZ2['y']=0.5028952916170034,mapLightPositionZ2['z']=-6.409800529479981;
// __UNIT__ u0999 [1939675,1939685) kind=var len=24
var blueLightPointZ3={};
// __UNIT__ u1000 [1939685,1939723) kind=expr len=82
blueLightPointZ3['preset']='Blue',blueLightPointZ3["position"]=mapLightPositionZ2;
// __UNIT__ u1001 [1939723,1939733) kind=var len=26
var mapLightPositionZ4={};
// __UNIT__ u1002 [1939733,1939790) kind=expr len=105
mapLightPositionZ4['x']=-1.2,mapLightPositionZ4['y']=0.32947382603281156,mapLightPositionZ4['z']=-5.8375;
// __UNIT__ u1003 [1939790,1939800) kind=var len=31
var reflection1LightPointZ5={};
// __UNIT__ u1004 [1939800,1939845) kind=expr len=103
reflection1LightPointZ5['preset']="Reflection1",reflection1LightPointZ5['position']=mapLightPositionZ4;
// __UNIT__ u1005 [1939845,1939855) kind=var len=26
var mapLightPositionZ6={};
// __UNIT__ u1006 [1939855,1939938) kind=expr len=131
mapLightPositionZ6['x']=-1.7454920155485283,mapLightPositionZ6['y']=0.33022000895791026,mapLightPositionZ6['z']=-5.582637321058282;
// __UNIT__ u1007 [1939938,1939948) kind=var len=31
var reflection1LightPointZ7={};
// __UNIT__ u1008 [1939948,1939993) kind=expr len=103
reflection1LightPointZ7["preset"]='Reflection1',reflection1LightPointZ7['position']=mapLightPositionZ6;
// __UNIT__ u1009 [1939993,1940003) kind=var len=26
var mapLightPositionZ8={};
// __UNIT__ u1010 [1940003,1940085) kind=expr len=130
mapLightPositionZ8['x']=-2.2788558925174667,mapLightPositionZ8['y']=0.3307272946474989,mapLightPositionZ8['z']=-5.321537725235785;
// __UNIT__ u1011 [1940085,1940095) kind=var len=31
var reflection1LightPointZ9={};
// __UNIT__ u1012 [1940095,1940140) kind=expr len=103
reflection1LightPointZ9["preset"]="Reflection1",reflection1LightPointZ9["position"]=mapLightPositionZ8;
// __UNIT__ u1013 [1940140,1940150) kind=var len=26
var mapLightPositionZa={};
// __UNIT__ u1014 [1940150,1940233) kind=expr len=131
mapLightPositionZa['x']=0.07580611892123329,mapLightPositionZa['y']=0.21862088736642954,mapLightPositionZa['z']=-6.340018098819977;
// __UNIT__ u1015 [1940233,1940243) kind=var len=34
var reflectionPinkLightPointZb={};
// __UNIT__ u1016 [1940243,1940291) kind=expr len=112
reflectionPinkLightPointZb['preset']="ReflectionPink",reflectionPinkLightPointZb['position']=mapLightPositionZa;
// __UNIT__ u1017 [1940291,1940301) kind=var len=26
var mapLightPositionZc={};
// __UNIT__ u1018 [1940301,1940385) kind=expr len=132
mapLightPositionZc['x']=-0.08720129438650526,mapLightPositionZc['y']=0.3306555550389421,mapLightPositionZc['z']=-4.4350000000000005;
// __UNIT__ u1019 [1940385,1940395) kind=var len=36
var orangeReflectionLightPointZd={};
// __UNIT__ u1020 [1940395,1940445) kind=expr len=118
orangeReflectionLightPointZd['preset']='OrangeReflection',orangeReflectionLightPointZd["position"]=mapLightPositionZc;
// __UNIT__ u1021 [1940445,1940455) kind=var len=26
var mapLightPositionZe={};
// __UNIT__ u1022 [1940455,1940525) kind=expr len=118
mapLightPositionZe['x']=-0.0886240287758644,mapLightPositionZe['y']=0.3275,mapLightPositionZe['z']=-4.711952161634878;
// __UNIT__ u1023 [1940525,1940535) kind=var len=36
var purpleReflectionLightPointZf={};
// __UNIT__ u1024 [1940535,1940585) kind=expr len=118
purpleReflectionLightPointZf['preset']='PurpleReflection',purpleReflectionLightPointZf['position']=mapLightPositionZe;
// __UNIT__ u1025 [1940585,1940595) kind=var len=26
var mapLightPositionZg={};
// __UNIT__ u1026 [1940595,1940653) kind=expr len=106
mapLightPositionZg['x']=-2.7475,mapLightPositionZg['y']=1.1025,mapLightPositionZg['z']=-5.042555723595179;
// __UNIT__ u1027 [1940653,1940663) kind=var len=26
var orangeLightPointZh={};
// __UNIT__ u1028 [1940663,1940703) kind=expr len=88
orangeLightPointZh['preset']='Orange',orangeLightPointZh["position"]=mapLightPositionZg;
// __UNIT__ u1029 [1940703,1940713) kind=var len=26
var mapLightPositionZi={};
// __UNIT__ u1030 [1940713,1940784) kind=expr len=119
mapLightPositionZi['x']=-2.7800000000000002,mapLightPositionZi['y']=1.1025,mapLightPositionZi['z']=-4.8955567481557365;
// __UNIT__ u1031 [1940784,1940794) kind=var len=26
var orangeLightPointZj={};
// __UNIT__ u1032 [1940794,1940834) kind=expr len=88
orangeLightPointZj['preset']="Orange",orangeLightPointZj["position"]=mapLightPositionZi;
// __UNIT__ u1033 [1940834,1940844) kind=var len=26
var mapLightPositionZk={};
// __UNIT__ u1034 [1940844,1940901) kind=expr len=105
mapLightPositionZk['x']=-2.77,mapLightPositionZk['y']=1.1025,mapLightPositionZk['z']=-4.7390190299187305;
// __UNIT__ u1035 [1940901,1940911) kind=var len=26
var orangeLightPointZl={};
// __UNIT__ u1036 [1940911,1940951) kind=expr len=88
orangeLightPointZl['preset']="Orange",orangeLightPointZl['position']=mapLightPositionZk;
// __UNIT__ u1037 [1940951,1940961) kind=var len=26
var mapLightPositionZm={};
// __UNIT__ u1038 [1940961,1941020) kind=expr len=107
mapLightPositionZm['x']=-2.7425,mapLightPositionZm['y']=1.0342920237978268,mapLightPositionZm['z']=-4.4475;
// __UNIT__ u1039 [1941020,1941030) kind=var len=24
var blueLightPointZn={};
// __UNIT__ u1040 [1941030,1941068) kind=expr len=82
blueLightPointZn['preset']='Blue',blueLightPointZn['position']=mapLightPositionZm;
// __UNIT__ u1041 [1941068,1941078) kind=var len=26
var mapLightPositionZo={};
// __UNIT__ u1042 [1941078,1941136) kind=expr len=106
mapLightPositionZo['x']=-2.7575,mapLightPositionZo['y']=1.0225,mapLightPositionZo['z']=-4.070402994952216;
// __UNIT__ u1043 [1941136,1941146) kind=var len=24
var blueLightPointZp={};
// __UNIT__ u1044 [1941146,1941184) kind=expr len=82
blueLightPointZp['preset']='Blue',blueLightPointZp['position']=mapLightPositionZo;
// __UNIT__ u1045 [1941184,1941194) kind=var len=26
var mapLightPositionZq={};
// __UNIT__ u1046 [1941194,1941238) kind=expr len=92
mapLightPositionZq['x']=-2.7875,mapLightPositionZq['y']=1.095,mapLightPositionZq['z']=-4.24;
// __UNIT__ u1047 [1941238,1941248) kind=var len=24
var blueLightPointZr={};
// __UNIT__ u1048 [1941248,1941286) kind=expr len=82
blueLightPointZr['preset']='Blue',blueLightPointZr['position']=mapLightPositionZq;
// __UNIT__ u1049 [1941286,1941296) kind=var len=26
var mapLightPositionZs={};
// __UNIT__ u1050 [1941296,1941341) kind=expr len=93
mapLightPositionZs['x']=-0.0025,mapLightPositionZs['y']=1.47,mapLightPositionZs['z']=-5.2975;
// __UNIT__ u1051 [1941341,1941351) kind=var len=25
var greenLightPointZt={};
// __UNIT__ u1052 [1941351,1941390) kind=expr len=85
greenLightPointZt['preset']="Green",greenLightPointZt['position']=mapLightPositionZs;
// __UNIT__ u1053 [1941390,1941400) kind=var len=26
var mapLightPositionZu={};
// __UNIT__ u1054 [1941400,1941455) kind=expr len=103
mapLightPositionZu['x']=-0.1525,mapLightPositionZu['y']=1.53630882591143,mapLightPositionZu['z']=-5.51;
// __UNIT__ u1055 [1941455,1941465) kind=var len=25
var greenLightPointZv={};
// __UNIT__ u1056 [1941465,1941504) kind=expr len=85
greenLightPointZv['preset']="Green",greenLightPointZv['position']=mapLightPositionZu;
// __UNIT__ u1057 [1941504,1941514) kind=var len=26
var mapLightPositionZw={};
// __UNIT__ u1058 [1941514,1941571) kind=expr len=105
mapLightPositionZw['x']=-0.2675,mapLightPositionZw['y']=1.5218971690782686,mapLightPositionZw['z']=-5.73;
// __UNIT__ u1059 [1941571,1941581) kind=var len=25
var greenLightPointZx={};
// __UNIT__ u1060 [1941581,1941620) kind=expr len=85
greenLightPointZx["preset"]="Green",greenLightPointZx['position']=mapLightPositionZw;
// __UNIT__ u1061 [1941620,1941630) kind=var len=26
var mapLightPositionZy={};
// __UNIT__ u1062 [1941630,1941687) kind=expr len=105
mapLightPositionZy['x']=-0.38,mapLightPositionZy['y']=1.4652375641222777,mapLightPositionZy['z']=-5.9675;
// __UNIT__ u1063 [1941687,1941697) kind=var len=24
var mapLightPresetZz={};
// __UNIT__ u1064 [1941697,1941735) kind=expr len=82
mapLightPresetZz['preset']="Pink",mapLightPresetZz['position']=mapLightPositionZy;
// __UNIT__ u1065 [1941735,1941745) kind=var len=26
var mapLightPositionZA={};
// __UNIT__ u1066 [1941745,1941788) kind=expr len=91
mapLightPositionZA['x']=2.515,mapLightPositionZA['y']=1.6275,mapLightPositionZA['z']=-5.46;
// __UNIT__ u1067 [1941788,1941798) kind=var len=24
var blueLightPointZB={};
// __UNIT__ u1068 [1941798,1941836) kind=expr len=82
blueLightPointZB['preset']="Blue",blueLightPointZB['position']=mapLightPositionZA;
// __UNIT__ u1069 [1941836,1941846) kind=var len=26
var mapLightPositionZC={};
// __UNIT__ u1070 [1941846,1941914) kind=expr len=116
mapLightPositionZC['x']=2.5300000000000002,mapLightPositionZC['y']=1.2594509444709565,mapLightPositionZC['z']=-5.46;
// __UNIT__ u1071 [1941914,1941924) kind=var len=24
var blueLightPointZD={};
// __UNIT__ u1072 [1941924,1941962) kind=expr len=82
blueLightPointZD["preset"]='Blue',blueLightPointZD['position']=mapLightPositionZC;
// __UNIT__ u1073 [1941962,1941972) kind=var len=26
var mapLightPositionZE={};
// __UNIT__ u1074 [1941972,1942028) kind=expr len=104
mapLightPositionZE['x']=2.5325,mapLightPositionZE['y']=0.8380705699382374,mapLightPositionZE['z']=-5.44;
// __UNIT__ u1075 [1942028,1942038) kind=var len=24
var blueLightPointZF={};
// __UNIT__ u1076 [1942038,1942076) kind=expr len=82
blueLightPointZF['preset']="Blue",blueLightPointZF["position"]=mapLightPositionZE;
// __UNIT__ u1077 [1942076,1942086) kind=var len=26
var mapLightPositionZG={};
// __UNIT__ u1078 [1942086,1942154) kind=expr len=116
mapLightPositionZG['x']=-1.50236485890886,mapLightPositionZG['y']=0.772258514582209,mapLightPositionZG['z']=-4.1125;
// __UNIT__ u1079 [1942154,1942164) kind=var len=27
var defaultLightPointZH={};
// __UNIT__ u1080 [1942164,1942205) kind=expr len=91
defaultLightPointZH['preset']="default",defaultLightPointZH["position"]=mapLightPositionZG;
// __UNIT__ u1081 [1942205,1942215) kind=var len=26
var mapLightPositionZI={};
// __UNIT__ u1082 [1942215,1942260) kind=expr len=93
mapLightPositionZI['x']=-3.225,mapLightPositionZI['y']=-0.33,mapLightPositionZI['z']=-4.8275;
// __UNIT__ u1083 [1942260,1942270) kind=var len=25
var whiteLightPointZJ={};
// __UNIT__ u1084 [1942270,1942309) kind=expr len=85
whiteLightPointZJ['preset']="White",whiteLightPointZJ["position"]=mapLightPositionZI;
// __UNIT__ u1085 [1942309,1942319) kind=var len=26
var mapLightPositionZK={};
// __UNIT__ u1086 [1942319,1942402) kind=expr len=131
mapLightPositionZK['x']=-3.2572809277181087,mapLightPositionZK['y']=-0.3297842024282729,mapLightPositionZK['z']=-5.034187513582658;
// __UNIT__ u1087 [1942402,1942412) kind=var len=25
var whiteLightPointZL={};
// __UNIT__ u1088 [1942412,1942451) kind=expr len=85
whiteLightPointZL["preset"]='White',whiteLightPointZL['position']=mapLightPositionZK;
// __UNIT__ u1089 [1942451,1942461) kind=var len=26
var mapLightPositionZM={};
// __UNIT__ u1090 [1942461,1942545) kind=expr len=132
mapLightPositionZM['x']=-3.2572809882910043,mapLightPositionZM['y']=-0.2679128585083547,mapLightPositionZM['z']=-4.3736301551967225;
// __UNIT__ u1091 [1942545,1942555) kind=var len=25
var whiteLightPointZN={};
// __UNIT__ u1092 [1942555,1942594) kind=expr len=85
whiteLightPointZN["preset"]='White',whiteLightPointZN['position']=mapLightPositionZM;
// __UNIT__ u1093 [1942594,1942604) kind=var len=26
var mapLightPositionZO={};
// __UNIT__ u1094 [1942604,1942689) kind=expr len=133
mapLightPositionZO['x']=-3.2572810113253006,mapLightPositionZO['y']=-0.29401703813447566,mapLightPositionZO['z']=-4.1224373724095775;
// __UNIT__ u1095 [1942689,1942699) kind=var len=25
var whiteLightPointZP={};
// __UNIT__ u1096 [1942699,1942738) kind=expr len=85
whiteLightPointZP["preset"]="White",whiteLightPointZP["position"]=mapLightPositionZO;
// __UNIT__ u1097 [1942738,1942748) kind=var len=26
var mapLightPositionZQ={};
// __UNIT__ u1098 [1942748,1942829) kind=expr len=129
mapLightPositionZQ['x']=-2.55351356680188,mapLightPositionZQ['y']=-0.2146899343260645,mapLightPositionZQ['z']=-6.137239456176758;
// __UNIT__ u1099 [1942829,1942839) kind=var len=25
var whiteLightPointZR={};
// __UNIT__ u1100 [1942839,1942878) kind=expr len=85
whiteLightPointZR["preset"]="White",whiteLightPointZR['position']=mapLightPositionZQ;
// __UNIT__ u1101 [1942878,1942888) kind=var len=26
var mapLightPositionZS={};
// __UNIT__ u1102 [1942888,1942970) kind=expr len=130
mapLightPositionZS['x']=-0.490726721949476,mapLightPositionZS['y']=-0.4476004651665558,mapLightPositionZS['z']=-6.137239456176758;
// __UNIT__ u1103 [1942970,1942980) kind=var len=25
var whiteLightPointZT={};
// __UNIT__ u1104 [1942980,1943019) kind=expr len=85
whiteLightPointZT['preset']="White",whiteLightPointZT['position']=mapLightPositionZS;
// __UNIT__ u1105 [1943019,1943029) kind=var len=26
var mapLightPositionZU={};
// __UNIT__ u1106 [1943029,1943112) kind=expr len=131
mapLightPositionZU['x']=0.1907611830171213,mapLightPositionZU['y']=-0.5741614775711088,mapLightPositionZU['z']=-4.7001860745642885;
// __UNIT__ u1107 [1943112,1943122) kind=var len=25
var whiteLightPointZV={};
// __UNIT__ u1108 [1943122,1943161) kind=expr len=85
whiteLightPointZV["preset"]='White',whiteLightPointZV["position"]=mapLightPositionZU;
// __UNIT__ u1109 [1943161,1943171) kind=var len=26
var mapLightPositionZW={};
// __UNIT__ u1110 [1943171,1943251) kind=expr len=128
mapLightPositionZW['x']=0.1907612993083625,mapLightPositionZW['y']=-0.4755502067249453,mapLightPositionZW['z']=-5.5823948916711;
// __UNIT__ u1111 [1943251,1943261) kind=var len=25
var whiteLightPointZX={};
// __UNIT__ u1112 [1943261,1943300) kind=expr len=85
whiteLightPointZX['preset']='White',whiteLightPointZX["position"]=mapLightPositionZW;
// __UNIT__ u1113 [1943300,1943310) kind=var len=26
var mapLightPositionZY={};
// __UNIT__ u1114 [1943310,1943394) kind=expr len=132
mapLightPositionZY['x']=0.19076124789644056,mapLightPositionZY['y']=-0.46571431544904796,mapLightPositionZY['z']=-5.192373682965803;
// __UNIT__ u1115 [1943394,1943404) kind=var len=25
var whiteLightPointZZ={};
// __UNIT__ u1116 [1943404,1943443) kind=expr len=85
whiteLightPointZZ['preset']='White',whiteLightPointZZ["position"]=mapLightPositionZY;
// __UNIT__ u1117 [1943443,1943453) kind=var len=26
var mapLightPositionA0={};
// __UNIT__ u1118 [1943453,1943522) kind=expr len=117
mapLightPositionA0['x']=0.19076129985359602,mapLightPositionA0['y']=-0.18,mapLightPositionA0['z']=-5.586531139739979;
// __UNIT__ u1119 [1943522,1943532) kind=var len=24
var mapLightPresetA1={};
// __UNIT__ u1120 [1943532,1943571) kind=expr len=83
mapLightPresetA1['preset']="White",mapLightPresetA1['position']=mapLightPositionA0;
// __UNIT__ u1121 [1943571,1943581) kind=var len=23
var mapLightColorA2={};
// __UNIT__ u1122 [1943581,1943663) kind=expr len=121
mapLightColorA2['x']=0.9921568627450981,mapLightColorA2['y']=0.8313725490196079,mapLightColorA2['z']=0.24705882352941178;
// __UNIT__ u1123 [1943663,1943673) kind=var len=24
var mapLightPreset01={};
// __UNIT__ u1124 [1943673,1943768) kind=expr len=178
mapLightPreset01['pointedDown']=![],mapLightPreset01["radius"]="0.29",mapLightPreset01["scale"]='2.2',mapLightPreset01['intensity']=0x1,mapLightPreset01['color']=mapLightColorA2;
// __UNIT__ u1125 [1943768,1943778) kind=var len=23
var mapLightColorA4={};
// __UNIT__ u1126 [1943778,1943858) kind=expr len=119
mapLightColorA4['x']=0.996078431372549,mapLightColorA4['y']=0.9803921568627451,mapLightColorA4['z']=0.5843137254901961;
// __UNIT__ u1127 [1943858,1943868) kind=var len=24
var mapLightPreset02={};
// __UNIT__ u1128 [1943868,1943958) kind=expr len=173
mapLightPreset02["pointedDown"]='1',mapLightPreset02['radius']=0.4,mapLightPreset02['scale']=0x6,mapLightPreset02['intensity']=0x1,mapLightPreset02["color"]=mapLightColorA4;
// __UNIT__ u1129 [1943958,1943968) kind=var len=23
var mapLightColorA6={};
// __UNIT__ u1130 [1943968,1944049) kind=expr len=120
mapLightColorA6['x']=0.6705882352941176,mapLightColorA6['y']=0.34509803921568627,mapLightColorA6['z']=0.996078431372549;
// __UNIT__ u1131 [1944049,1944059) kind=var len=24
var mapLightPreset03={};
// __UNIT__ u1132 [1944059,1944151) kind=expr len=175
mapLightPreset03["pointedDown"]=![],mapLightPreset03['radius']="0.2",mapLightPreset03['scale']='3',mapLightPreset03['intensity']=0x1,mapLightPreset03['color']=mapLightColorA6;
// __UNIT__ u1133 [1944151,1944161) kind=var len=23
var mapLightColorA8={};
// __UNIT__ u1134 [1944161,1944227) kind=expr len=105
mapLightColorA8['x']=0x1,mapLightColorA8['y']=0.7294117647058823,mapLightColorA8['z']=0.1411764705882353;
// __UNIT__ u1135 [1944227,1944237) kind=var len=24
var mapLightPreset04={};
// __UNIT__ u1136 [1944237,1944331) kind=expr len=177
mapLightPreset04['pointedDown']=![],mapLightPreset04['radius']='0.2',mapLightPreset04['scale']='3.2',mapLightPreset04["intensity"]=0x1,mapLightPreset04['color']=mapLightColorA8;
// __UNIT__ u1137 [1944331,1944341) kind=var len=23
var mapLightColorAa={};
// __UNIT__ u1138 [1944341,1944420) kind=expr len=118
mapLightColorAa['x']=0.996078431372549,mapLightColorAa['y']=0.788235294117647,mapLightColorAa['z']=0.2235294117647059;
// __UNIT__ u1139 [1944420,1944430) kind=var len=24
var mapLightPreset05={};
// __UNIT__ u1140 [1944430,1944525) kind=expr len=178
mapLightPreset05['pointedDown']=![],mapLightPreset05['radius']="0.57",mapLightPreset05['scale']='4.2',mapLightPreset05['intensity']=0x1,mapLightPreset05['color']=mapLightColorAa;
// __UNIT__ u1141 [1944525,1944535) kind=var len=23
var mapLightColorAc={};
// __UNIT__ u1142 [1944535,1944616) kind=expr len=120
mapLightColorAc['x']=0.34509803921568627,mapLightColorAc['y']=0.996078431372549,mapLightColorAc['z']=0.4196078431372549;
// __UNIT__ u1143 [1944616,1944626) kind=var len=24
var mapLightPreset06={};
// __UNIT__ u1144 [1944626,1944721) kind=expr len=178
mapLightPreset06["pointedDown"]=![],mapLightPreset06["radius"]='0.33',mapLightPreset06['scale']="1.3",mapLightPreset06["intensity"]=0x1,mapLightPreset06['color']=mapLightColorAc;
// __UNIT__ u1145 [1944721,1944731) kind=var len=23
var mapLightColorAe={};
// __UNIT__ u1146 [1944731,1944812) kind=expr len=120
mapLightColorAe['x']=0.34509803921568627,mapLightColorAe['y']=0.9215686274509803,mapLightColorAe['z']=0.996078431372549;
// __UNIT__ u1147 [1944812,1944822) kind=var len=24
var mapLightPreset07={};
// __UNIT__ u1148 [1944822,1944917) kind=expr len=178
mapLightPreset07["pointedDown"]=![],mapLightPreset07["radius"]="0.79",mapLightPreset07['scale']='7.3',mapLightPreset07['intensity']=0x1,mapLightPreset07['color']=mapLightColorAe;
// __UNIT__ u1149 [1944917,1944927) kind=var len=23
var mapLightColorAg={};
// __UNIT__ u1150 [1944927,1945008) kind=expr len=120
mapLightColorAg['x']=0.996078431372549,mapLightColorAg['y']=0.5686274509803921,mapLightColorAg['z']=0.08627450980392157;
// __UNIT__ u1151 [1945008,1945018) kind=var len=24
var mapLightPreset08={};
// __UNIT__ u1152 [1945018,1945113) kind=expr len=178
mapLightPreset08["pointedDown"]=![],mapLightPreset08["radius"]='0.29',mapLightPreset08["scale"]="2.2",mapLightPreset08['intensity']=0x1,mapLightPreset08["color"]=mapLightColorAg;
// __UNIT__ u1153 [1945113,1945123) kind=var len=23
var mapLightColorAi={};
// __UNIT__ u1154 [1945123,1945204) kind=expr len=120
mapLightColorAi['x']=0.08627450980392157,mapLightColorAi['y']=0.996078431372549,mapLightColorAi['z']=0.8117647058823529;
// __UNIT__ u1155 [1945204,1945214) kind=var len=24
var mapLightPreset09={};
// __UNIT__ u1156 [1945214,1945309) kind=expr len=178
mapLightPreset09["pointedDown"]=![],mapLightPreset09['radius']='0.29',mapLightPreset09['scale']="2.2",mapLightPreset09['intensity']=0x1,mapLightPreset09['color']=mapLightColorAi;
// __UNIT__ u1157 [1945309,1945319) kind=var len=23
var mapLightColorAk={};
// __UNIT__ u1158 [1945319,1945400) kind=expr len=120
mapLightColorAk['x']=0.996078431372549,mapLightColorAk['y']=0.8549019607843137,mapLightColorAk['z']=0.34509803921568627;
// __UNIT__ u1159 [1945400,1945410) kind=var len=24
var mapLightPreset10={};
// __UNIT__ u1160 [1945410,1945505) kind=expr len=178
mapLightPreset10['pointedDown']=![],mapLightPreset10['radius']='0.29',mapLightPreset10['scale']='0.9',mapLightPreset10["intensity"]=0x1,mapLightPreset10['color']=mapLightColorAk;
// __UNIT__ u1161 [1945505,1945515) kind=var len=23
var mapLightColorAm={};
// __UNIT__ u1162 [1945515,1945596) kind=expr len=120
mapLightColorAm['x']=0.996078431372549,mapLightColorAm['y']=0.34509803921568627,mapLightColorAm['z']=0.8235294117647058;
// __UNIT__ u1163 [1945596,1945606) kind=var len=24
var mapLightPreset11={};
// __UNIT__ u1164 [1945606,1945701) kind=expr len=178
mapLightPreset11["pointedDown"]=![],mapLightPreset11['radius']='0.29',mapLightPreset11['scale']='1.1',mapLightPreset11["intensity"]=0x1,mapLightPreset11["color"]=mapLightColorAm;
// __UNIT__ u1165 [1945701,1945711) kind=var len=23
var mapLightColorAo={};
// __UNIT__ u1166 [1945711,1945792) kind=expr len=120
mapLightColorAo['x']=0.996078431372549,mapLightColorAo['y']=0.6392156862745098,mapLightColorAo['z']=0.34509803921568627;
// __UNIT__ u1167 [1945792,1945802) kind=var len=24
var mapLightPreset12={};
// __UNIT__ u1168 [1945802,1945897) kind=expr len=178
mapLightPreset12['pointedDown']=![],mapLightPreset12["radius"]='0.29',mapLightPreset12['scale']="0.9",mapLightPreset12['intensity']=0x1,mapLightPreset12["color"]=mapLightColorAo;
// __UNIT__ u1169 [1945897,1945907) kind=var len=23
var mapLightColorAq={};
// __UNIT__ u1170 [1945907,1945988) kind=expr len=120
mapLightColorAq['x']=0.8549019607843137,mapLightColorAq['y']=0.34509803921568627,mapLightColorAq['z']=0.996078431372549;
// __UNIT__ u1171 [1945988,1945998) kind=var len=24
var mapLightPreset13={};
// __UNIT__ u1172 [1945998,1946093) kind=expr len=178
mapLightPreset13['pointedDown']=![],mapLightPreset13['radius']='0.29',mapLightPreset13['scale']='0.9',mapLightPreset13['intensity']=0x1,mapLightPreset13['color']=mapLightColorAq;
// __UNIT__ u1173 [1946093,1946103) kind=var len=23
var mapLightColorAs={};
// __UNIT__ u1174 [1946103,1946184) kind=expr len=120
mapLightColorAs['x']=0.996078431372549,mapLightColorAs['y']=0.30196078431372547,mapLightColorAs['z']=0.7411764705882353;
// __UNIT__ u1175 [1946184,1946194) kind=var len=24
var mapLightPreset14={};
// __UNIT__ u1176 [1946194,1946289) kind=expr len=178
mapLightPreset14['pointedDown']=![],mapLightPreset14['radius']='0.31',mapLightPreset14['scale']='1.3',mapLightPreset14['intensity']=0x1,mapLightPreset14['color']=mapLightColorAs;
// __UNIT__ u1177 [1946289,1946299) kind=var len=23
var mapLightColorAu={};
// __UNIT__ u1178 [1946299,1946335) kind=expr len=75
mapLightColorAu['x']=0x1,mapLightColorAu['y']=0x1,mapLightColorAu['z']=0x1;
// __UNIT__ u1179 [1946335,1946345) kind=var len=24
var mapLightPreset15={};
// __UNIT__ u1180 [1946345,1946440) kind=expr len=178
mapLightPreset15['pointedDown']='0',mapLightPreset15["radius"]="0.26",mapLightPreset15['scale']="0.8",mapLightPreset15["intensity"]=0x1,mapLightPreset15["color"]=mapLightColorAu;
// __UNIT__ u1181 [1946440,1946450) kind=var len=27
var factoryLightPresets={};
// __UNIT__ u1182 [1946450,1946729) kind=expr len=744
factoryLightPresets['default']=mapLightPreset01,factoryLightPresets['Spotlight']=mapLightPreset02,factoryLightPresets['Purple']=mapLightPreset03,factoryLightPresets["Red"]=mapLightPreset04,factoryLightPresets['BuildingLight']=mapLightPreset05,factoryLightPresets['Green']=mapLightPreset06,factoryLightPresets["SubwayLogo"]=mapLightPreset07,factoryLightPresets["Orange"]=mapLightPreset08,factoryLightPresets["Blue"]=mapLightPreset09,factoryLightPresets['Reflection1']=mapLightPreset10,factoryLightPresets['ReflectionPink']=mapLightPreset11,factoryLightPresets['OrangeReflection']=mapLightPreset12,factoryLightPresets['PurpleReflection']=mapLightPreset13,factoryLightPresets['Pink']=mapLightPreset14,factoryLightPresets['White']=mapLightPreset15;
// __UNIT__ u1183 [1946729,1946739) kind=var len=25
var midnightLightData={};
// __UNIT__ u1184 [1946739,1947082) kind=expr len=1596
midnightLightData['sunColor']=midnightSunColor,midnightLightData["sunDirection"]=midnightSunDirection,midnightLightData['penumbra']='0.017',midnightLightData['ambient']="0.5",midnightLightData["diffuse"]=!![],midnightLightData["lights"]=[mapLightPresetXR,mapLightPresetXT,mapLightPresetXV,mapLightPresetXX,mapLightPresetXZ,mapLightPresetY1,mapLightPresetY3,mapLightPresetY5,mapLightPresetY7,mapLightPresetY9,buildingLightPointYb,buildingLightPointYd,buildingLightPointYf,buildingLightPointYh,buildingLightPointYj,buildingLightPointYl,buildingLightPointYn,buildingLightPointYp,buildingLightPointYr,neonBuildingLight05,buildingLightPointYv,buildingLightPointYx,purpleLightPointYz,mapLightPresetYB,mapLightPresetYD,mapLightPresetYF,buildingLightPointYH,buildingLightPointYJ,buildingLightPointYL,buildingLightPointYN,orangeLightPointYP,orangeLightPointYR,orangeLightPointYT,blueLightPointYV,blueLightPointYX,blueLightPointYZ,mapLightPresetZ1,blueLightPointZ3,reflection1LightPointZ5,reflection1LightPointZ7,reflection1LightPointZ9,reflectionPinkLightPointZb,orangeReflectionLightPointZd,purpleReflectionLightPointZf,orangeLightPointZh,orangeLightPointZj,orangeLightPointZl,blueLightPointZn,blueLightPointZp,blueLightPointZr,greenLightPointZt,greenLightPointZv,greenLightPointZx,mapLightPresetZz,blueLightPointZB,blueLightPointZD,blueLightPointZF,defaultLightPointZH,whiteLightPointZJ,whiteLightPointZL,whiteLightPointZN,whiteLightPointZP,whiteLightPointZR,whiteLightPointZT,whiteLightPointZV,whiteLightPointZX,whiteLightPointZZ,mapLightPresetA1],midnightLightData["lightPresets"]=factoryLightPresets;
// __UNIT__ u1185 [1947082,1947092) kind=var len=24
var lightmapPresetAy={};
// __UNIT__ u1187 [1947234,1947244) kind=var len=22
var smokeEmitterAz={};
// __UNIT__ u1189 [1947398,1947408) kind=var len=22
var smokeEmitterAa={};
// __UNIT__ u1191 [1947562,1947572) kind=var len=21
var smokeEmitterA={};
// __UNIT__ u1193 [1947726,1947736) kind=var len=22
var smokeEmitterAc={};
// __UNIT__ u1195 [1947892,1947902) kind=var len=26
var arcadeMusicEmitter={};
// __UNIT__ u1196 [1947902,1948021) kind=expr len=199
arcadeMusicEmitter['directional']=!![],arcadeMusicEmitter["position"]=[-0x12,1.4,12.7],arcadeMusicEmitter['volume']=1.4,arcadeMusicEmitter['rolloff']=0x4,arcadeMusicEmitter["file"]='ArcadeMusic.mp3';
// __UNIT__ u1197 [1948021,1948031) kind=var len=34
var neonCityAmbiencePositionAE={};
// __UNIT__ u1198 [1948031,1948070) kind=expr len=111
neonCityAmbiencePositionAE['x']=-0x8,neonCityAmbiencePositionAE['y']=0x3,neonCityAmbiencePositionAE['z']=-0x50;
// __UNIT__ u1199 [1948070,1948080) kind=var len=34
var neonCityAmbiencePositionAF={};
// __UNIT__ u1200 [1948080,1948118) kind=expr len=110
neonCityAmbiencePositionAF['x']=0x3a,neonCityAmbiencePositionAF['y']=0x2,neonCityAmbiencePositionAF['z']=0x43;
// __UNIT__ u1201 [1948118,1948128) kind=var len=31
var neonCityAmbienceEmitter={};
// __UNIT__ u1202 [1948128,1948222) kind=expr len=226
neonCityAmbienceEmitter["directional"]=!![],neonCityAmbienceEmitter['positions']=[neonCityAmbiencePositionAE,neonCityAmbiencePositionAF],neonCityAmbienceEmitter['volume']=0xf,neonCityAmbienceEmitter["file"]="CityAmbience.mp3";
// __UNIT__ u1203 [1948222,1948232) kind=var len=25
var neonHumPositionAH={};
// __UNIT__ u1204 [1948232,1948311) kind=expr len=124
neonHumPositionAH['x']=33.12487398027918,neonHumPositionAH['y']=4.078677607299565,neonHumPositionAH['z']=11.736156944081845;
// __UNIT__ u1205 [1948311,1948321) kind=var len=25
var neonHumPositionAI={};
// __UNIT__ u1206 [1948321,1948403) kind=expr len=127
neonHumPositionAI['x']=12.859715956098759,neonHumPositionAI['y']=3.4104022881858516,neonHumPositionAI['z']=-58.348846435546875;
// __UNIT__ u1207 [1948403,1948413) kind=var len=25
var neonHumPositionAJ={};
// __UNIT__ u1208 [1948413,1948495) kind=expr len=127
neonHumPositionAJ['x']=19.624618887599933,neonHumPositionAJ['y']=3.2904109519925857,neonHumPositionAJ['z']=-58.347415924072266;
// __UNIT__ u1209 [1948495,1948505) kind=var len=25
var neonHumPositionAK={};
// __UNIT__ u1210 [1948505,1948585) kind=expr len=125
neonHumPositionAK['x']=0.6321742358704532,neonHumPositionAK['y']=7.075142404080541,neonHumPositionAK['z']=-52.94449996948242;
// __UNIT__ u1211 [1948585,1948595) kind=var len=25
var neonHumPositionAL={};
// __UNIT__ u1212 [1948595,1948674) kind=expr len=124
neonHumPositionAL['x']=-24.9892520904541,neonHumPositionAL['y']=7.577969119350347,neonHumPositionAL['z']=-38.36957635876836;
// __UNIT__ u1213 [1948674,1948684) kind=var len=25
var neonHumPositionAM={};
// __UNIT__ u1214 [1948684,1948765) kind=expr len=126
neonHumPositionAM['x']=-34.32672670164786,neonHumPositionAM['y']=8.492390955267656,neonHumPositionAM['z']=-32.029197692871094;
// __UNIT__ u1215 [1948765,1948775) kind=var len=25
var neonHumPositionAN={};
// __UNIT__ u1216 [1948775,1948856) kind=expr len=126
neonHumPositionAN['x']=-32.16570702562437,neonHumPositionAN['y']=8.260352075310028,neonHumPositionAN['z']=-5.2522172927856445;
// __UNIT__ u1217 [1948856,1948866) kind=var len=25
var neonHumPositionAO={};
// __UNIT__ u1218 [1948866,1948946) kind=expr len=125
neonHumPositionAO['x']=-3.29837965965271,neonHumPositionAO['y']=10.140144244344869,neonHumPositionAO['z']=-9.769438455517808;
// __UNIT__ u1219 [1948946,1948956) kind=var len=25
var neonHumPositionAP={};
// __UNIT__ u1220 [1948956,1949037) kind=expr len=126
neonHumPositionAP['x']=21.153390884399414,neonHumPositionAP['y']=5.855867696704594,neonHumPositionAP['z']=-24.272856387072903;
// __UNIT__ u1221 [1949037,1949047) kind=var len=25
var neonHumPositionAQ={};
// __UNIT__ u1222 [1949047,1949125) kind=expr len=123
neonHumPositionAQ['x']=14.52393611268166,neonHumPositionAQ['y']=4.844855021794791,neonHumPositionAQ['z']=14.56745147705078;
// __UNIT__ u1223 [1949125,1949135) kind=var len=25
var neonHumPositionAR={};
// __UNIT__ u1224 [1949135,1949216) kind=expr len=126
neonHumPositionAR['x']=-15.553492546081543,neonHumPositionAR['y']=5.108441329050152,neonHumPositionAR['z']=21.910096951687102;
// __UNIT__ u1225 [1949216,1949226) kind=var len=23
var neonHumEmitterA={};
// __UNIT__ u1226 [1949226,1949360) kind=expr len=364
neonHumEmitterA['directional']=!![],neonHumEmitterA["positions"]=[neonHumPositionAH,neonHumPositionAI,neonHumPositionAJ,neonHumPositionAK,neonHumPositionAL,neonHumPositionAM,neonHumPositionAN,neonHumPositionAO,neonHumPositionAP,neonHumPositionAQ,neonHumPositionAR],neonHumEmitterA['volume']=0.6,neonHumEmitterA["rolloff"]=6.7,neonHumEmitterA['file']='NeonHum.mp3';
// __UNIT__ u1227 [1949360,1949370) kind=var len=33
var restaurantAmbienceEmitter={};
// __UNIT__ u1228 [1949370,1949498) kind=expr len=243
restaurantAmbienceEmitter['directional']=!![],restaurantAmbienceEmitter['position']=[-0xa,0x14,0xa],restaurantAmbienceEmitter["volume"]=0xb,restaurantAmbienceEmitter['rolloff']=1.3,restaurantAmbienceEmitter["file"]='RestaurantLights&Fans.mp3';
// __UNIT__ u1229 [1949498,1949508) kind=var len=29
var garageAmbienceEmitter={};
// __UNIT__ u1230 [1949508,1949622) kind=expr len=209
garageAmbienceEmitter['directional']=!![],garageAmbienceEmitter["position"]=[-0x25,0xb,0x34],garageAmbienceEmitter['volume']=0x1,garageAmbienceEmitter["rolloff"]=0x3,garageAmbienceEmitter['file']="Garage.mp3";
// __UNIT__ u1231 [1949622,1949632) kind=var len=29
var fridgeAudioPositionAV={};
// __UNIT__ u1232 [1949632,1949713) kind=expr len=138
fridgeAudioPositionAV['x']=-17.882731235746885,fridgeAudioPositionAV['y']=5.156770374258155,fridgeAudioPositionAV['z']=-5.819291114807129;
// __UNIT__ u1233 [1949713,1949723) kind=var len=29
var fridgeAudioPositionAW={};
// __UNIT__ u1234 [1949723,1949802) kind=expr len=136
fridgeAudioPositionAW['x']=-8.117840766906738,fridgeAudioPositionAW['y']=5.441127632046036,fridgeAudioPositionAW['z']=35.96741313445427;
// __UNIT__ u1235 [1949802,1949812) kind=var len=29
var fridgeAudioPositionAX={};
// __UNIT__ u1236 [1949812,1949893) kind=expr len=138
fridgeAudioPositionAX['x']=-6.569803237915039,fridgeAudioPositionAX['y']=4.980269310130779,fridgeAudioPositionAX['z']=-34.193724900762895;
// __UNIT__ u1237 [1949893,1949903) kind=var len=29
var fridgeAudioPositionAY={};
// __UNIT__ u1238 [1949903,1949984) kind=expr len=138
fridgeAudioPositionAY['x']=31.331634521484375,fridgeAudioPositionAY['y']=4.412258518642802,fridgeAudioPositionAY['z']=-11.229789380218573;
// __UNIT__ u1239 [1949984,1949994) kind=var len=29
var fridgeAudioPositionAZ={};
// __UNIT__ u1240 [1949994,1950075) kind=expr len=138
fridgeAudioPositionAZ['x']=5.109659194946289,fridgeAudioPositionAZ['y']=2.221428503773818,fridgeAudioPositionAZ['z']=-0.43308787835499185;
// __UNIT__ u1241 [1950075,1950085) kind=var len=29
var fridgeAudioPositionB0={};
// __UNIT__ u1242 [1950085,1950167) kind=expr len=139
fridgeAudioPositionB0['x']=23.589897764381707,fridgeAudioPositionB0['y']=0.13675530512772255,fridgeAudioPositionB0['z']=23.434541702270508;
// __UNIT__ u1243 [1950167,1950177) kind=var len=29
var fridgeAudioPositionB1={};
// __UNIT__ u1244 [1950177,1950257) kind=expr len=137
fridgeAudioPositionB1['x']=-31.4463867615366,fridgeAudioPositionB1['y']=5.2164428620192895,fridgeAudioPositionB1['z']=10.635064125061035;
// __UNIT__ u1245 [1950257,1950267) kind=var len=26
var fridgeAudioEmitter={};
// __UNIT__ u1246 [1950267,1950404) kind=expr len=350
fridgeAudioEmitter["directional"]=!![],fridgeAudioEmitter['positions']=[fridgeAudioPositionAV,fridgeAudioPositionAW,fridgeAudioPositionAX,fridgeAudioPositionAY,fridgeAudioPositionAZ,fridgeAudioPositionB0,fridgeAudioPositionB1],fridgeAudioEmitter['volume']=0.5,fridgeAudioEmitter['rolloff']=0xa,fridgeAudioEmitter['file']='RestaurantRefrigerator.mp3';
// __UNIT__ u1247 [1950404,1950414) kind=var len=25
var neonHumPositionB3={};
// __UNIT__ u1248 [1950414,1950452) kind=expr len=83
neonHumPositionB3['x']=0x32,neonHumPositionB3['y']=0x4,neonHumPositionB3['z']=0x24;
// __UNIT__ u1249 [1950452,1950462) kind=var len=25
var neonHumPositionB4={};
// __UNIT__ u1250 [1950462,1950541) kind=expr len=124
neonHumPositionB4['x']=-23.51451349890201,neonHumPositionB4['y']=8.487221717834473,neonHumPositionB4['z']=3.359571575930236;
// __UNIT__ u1251 [1950541,1950551) kind=var len=25
var neonHumPositionB5={};
// __UNIT__ u1252 [1950551,1950632) kind=expr len=126
neonHumPositionB5['x']=-23.668818147691223,neonHumPositionB5['y']=8.487221717834473,neonHumPositionB5['z']=13.172199829973856;
// __UNIT__ u1253 [1950632,1950642) kind=var len=25
var neonHumPositionB6={};
// __UNIT__ u1254 [1950642,1950723) kind=expr len=126
neonHumPositionB6['x']=-31.543905009959595,neonHumPositionB6['y']=8.487221717834473,neonHumPositionB6['z']=22.467034208113443;
// __UNIT__ u1255 [1950723,1950733) kind=var len=25
var neonHumPositionB7={};
// __UNIT__ u1256 [1950733,1950811) kind=expr len=123
neonHumPositionB7['x']=-32.75681494595898,neonHumPositionB7['y']=11.8586743018267,neonHumPositionB7['z']=42.74196678940148;
// __UNIT__ u1257 [1950811,1950821) kind=var len=25
var neonHumPositionB8={};
// __UNIT__ u1258 [1950821,1950900) kind=expr len=124
neonHumPositionB8['x']=-9.450711353612038,neonHumPositionB8['y']=11.8688704133342,neonHumPositionB8['z']=46.649592518817144;
// __UNIT__ u1259 [1950900,1950910) kind=var len=25
var neonHumPositionB9={};
// __UNIT__ u1260 [1950910,1950989) kind=expr len=124
neonHumPositionB9['x']=18.7232981843503,neonHumPositionB9['y']=3.5396598748762145,neonHumPositionB9['z']=43.800926208496094;
// __UNIT__ u1261 [1950989,1950999) kind=var len=25
var neonHumPositionBa={};
// __UNIT__ u1262 [1950999,1951077) kind=expr len=123
neonHumPositionBa['x']=17.23659927107286,neonHumPositionBa['y']=3.01285982131958,neonHumPositionBa['z']=34.619133284591435;
// __UNIT__ u1263 [1951077,1951087) kind=var len=25
var neonHumPositionBb={};
// __UNIT__ u1264 [1951087,1951166) kind=expr len=124
neonHumPositionBb['x']=13.654501522830264,neonHumPositionBb['y']=7.218945014860484,neonHumPositionBb['z']=18.08576164035872;
// __UNIT__ u1265 [1951166,1951176) kind=var len=23
var neonHumEmitterB={};
// __UNIT__ u1266 [1951176,1951304) kind=expr len=328
neonHumEmitterB['directional']=!![],neonHumEmitterB['positions']=[neonHumPositionB3,neonHumPositionB4,neonHumPositionB5,neonHumPositionB6,neonHumPositionB7,neonHumPositionB8,neonHumPositionB9,neonHumPositionBa,neonHumPositionBb],neonHumEmitterB['volume']=0.6,neonHumEmitterB['rolloff']=6.7,neonHumEmitterB['file']="NeonHum.mp3";
// __UNIT__ u1267 [1951304,1951314) kind=var len=25
var trainArrivalSound={};
// __UNIT__ u1268 [1951314,1951476) kind=expr len=252
trainArrivalSound['directional']=!![],trainArrivalSound['position']=[0x32,0x3,-0x4],trainArrivalSound['volume']=0x6,trainArrivalSound['rolloff']=0x3,trainArrivalSound['file']='TrainStationStop2.mp3',trainArrivalSound["syncToAnimation"]='TrainArriving';
// __UNIT__ u1269 [1951476,1951486) kind=var len=27
var trainDepartureSound={};
// __UNIT__ u1270 [1951486,1951648) kind=expr len=264
trainDepartureSound["directional"]=!![],trainDepartureSound['position']=[0x32,0x3,-0x4],trainDepartureSound["volume"]=0x6,trainDepartureSound['rolloff']=0x3,trainDepartureSound["file"]="TrainStationStart2.mp3",trainDepartureSound['syncToAnimation']="TrainLeaving";
// __UNIT__ u1271 [1951648,1951658) kind=var len=24
var cineStartFrameBf={};
// __UNIT__ u1272 [1951658,1951726) kind=expr len=96
cineStartFrameBf['position']=[-0x18,0x5,-35.9],cineStartFrameBf['JoIkrtRxhZ']=[-7.9,4.56,-50.1];
// __UNIT__ u1273 [1951726,1951736) kind=var len=22
var cineEndFrameBg={};
// __UNIT__ u1274 [1951736,1951804) kind=expr len=92
cineEndFrameBg['position']=[-11.5,3.47,-43.4],cineEndFrameBg["JoIkrtRxhZ"]=[47.7,4.5,-0x3d];
// __UNIT__ u1275 [1951804,1951814) kind=var len=27
var neonCinematicSceneA={};
// __UNIT__ u1276 [1951814,1951860) kind=expr len=123
neonCinematicSceneA['start']=cineStartFrameBf,neonCinematicSceneA["end"]=cineEndFrameBg,neonCinematicSceneA["time"]=0x3a98;
// __UNIT__ u1277 [1951860,1951870) kind=var len=24
var cineStartFrameBi={};
// __UNIT__ u1278 [1951870,1951932) kind=expr len=90
cineStartFrameBi["position"]=[0x1e,0x4,-0x1],cineStartFrameBi["JoIkrtRxhZ"]=[0x2,0x2,0xf];
// __UNIT__ u1279 [1951932,1951942) kind=var len=22
var cineEndFrameBj={};
// __UNIT__ u1280 [1951942,1952004) kind=expr len=86
cineEndFrameBj['position']=[0xf,1.5,0x6],cineEndFrameBj["JoIkrtRxhZ"]=[-0x14,0x3,0xb];
// __UNIT__ u1281 [1952004,1952014) kind=var len=27
var neonCinematicSceneB={};
// __UNIT__ u1282 [1952014,1952060) kind=expr len=123
neonCinematicSceneB['start']=cineStartFrameBi,neonCinematicSceneB['end']=cineEndFrameBj,neonCinematicSceneB['time']=0x3a98;
// __UNIT__ u1283 [1952060,1952070) kind=var len=23
var mapSpawnPoint01={};
// __UNIT__ u1284 [1952070,1952165) kind=expr len=160
mapSpawnPoint01['x']=-0xb,mapSpawnPoint01['y']=-6.800000190734863,mapSpawnPoint01['z']=18.899999618530273,mapSpawnPoint01['rx']=0x3c,mapSpawnPoint01['ry']=0x1e;
// __UNIT__ u1285 [1952165,1952175) kind=var len=23
var mapSpawnPoint02={};
// __UNIT__ u1286 [1952175,1952285) kind=expr len=175
mapSpawnPoint02['x']=-27.600000381469727,mapSpawnPoint02['y']=-6.800000190734863,mapSpawnPoint02['z']=-2.799999952316284,mapSpawnPoint02['rx']=0x3d,mapSpawnPoint02['ry']=0x7d;
// __UNIT__ u1287 [1952285,1952295) kind=var len=23
var mapSpawnPoint03={};
// __UNIT__ u1288 [1952295,1952404) kind=expr len=174
mapSpawnPoint03['x']=-54.29999923706055,mapSpawnPoint03['y']=-6.900000095367432,mapSpawnPoint03['z']=55.900001525878906,mapSpawnPoint03['rx']=0x3f,mapSpawnPoint03['ry']=0xbe;
// __UNIT__ u1289 [1952404,1952414) kind=var len=23
var mapSpawnPoint04={};
// __UNIT__ u1290 [1952414,1952522) kind=expr len=173
mapSpawnPoint04['x']=-58.29999923706055,mapSpawnPoint04['y']=-4.199999809265137,mapSpawnPoint04['z']=84.19999694824219,mapSpawnPoint04['rx']=0x40,mapSpawnPoint04['ry']=0xbf;
// __UNIT__ u1291 [1952522,1952532) kind=var len=23
var mapSpawnPoint05={};
// __UNIT__ u1292 [1952532,1952640) kind=expr len=173
mapSpawnPoint05['x']=20.899999618530273,mapSpawnPoint05['y']=-6.800000190734863,mapSpawnPoint05['z']=79.30000305175781,mapSpawnPoint05['rx']=0x3e,mapSpawnPoint05['ry']=0xf4;
// __UNIT__ u1293 [1952640,1952650) kind=var len=23
var mapSpawnPoint06={};
// __UNIT__ u1294 [1952650,1952758) kind=expr len=173
mapSpawnPoint06['x']=30.100000381469727,mapSpawnPoint06['y']=-6.800000190734863,mapSpawnPoint06['z']=5.199999809265137,mapSpawnPoint06['rx']=0x40,mapSpawnPoint06['ry']=0x80;
// __UNIT__ u1295 [1952758,1952768) kind=var len=22
var sunsetSunColor={};
// __UNIT__ u1296 [1952768,1952850) kind=expr len=118
sunsetSunColor['x']=0.7294117647058823,sunsetSunColor['y']=0.5803921568627451,sunsetSunColor['z']=0.17254901960784313;
// __UNIT__ u1297 [1952850,1952860) kind=var len=26
var sunsetSunDirection={};
// __UNIT__ u1298 [1952860,1952902) kind=expr len=90
sunsetSunDirection['x']='0.61',sunsetSunDirection['y']=0.8,sunsetSunDirection['z']='0.84';
// __UNIT__ u1299 [1952902,1952912) kind=var len=26
var mapLightPositionBt={};
// __UNIT__ u1300 [1952912,1952981) kind=expr len=117
mapLightPositionBt['x']=-3.788101881634068,mapLightPositionBt['y']=0.9375,mapLightPositionBt['z']=1.5939705581246888;
// __UNIT__ u1301 [1952981,1952991) kind=var len=27
var defaultLightPointBu={};
// __UNIT__ u1302 [1952991,1953032) kind=expr len=91
defaultLightPointBu['preset']='default',defaultLightPointBu['position']=mapLightPositionBt;
// __UNIT__ u1303 [1953032,1953042) kind=var len=26
var mapLightPositionBv={};
// __UNIT__ u1304 [1953042,1953112) kind=expr len=118
mapLightPositionBv['x']=-1.2025000000000001,mapLightPositionBv['y']=0.7625000000000001,mapLightPositionBv['z']=-5.835;
// __UNIT__ u1305 [1953112,1953122) kind=var len=27
var defaultLightPointBw={};
// __UNIT__ u1306 [1953122,1953163) kind=expr len=91
defaultLightPointBw['preset']="default",defaultLightPointBw['position']=mapLightPositionBv;
// __UNIT__ u1307 [1953163,1953173) kind=var len=26
var mapLightPositionBx={};
// __UNIT__ u1308 [1953173,1953232) kind=expr len=107
mapLightPositionBx['x']=-1.7325,mapLightPositionBx['y']=0.7624253487949407,mapLightPositionBx['z']=-5.5925;
// __UNIT__ u1309 [1953232,1953242) kind=var len=27
var defaultLightPointBy={};
// __UNIT__ u1310 [1953242,1953283) kind=expr len=91
defaultLightPointBy["preset"]='default',defaultLightPointBy['position']=mapLightPositionBx;
// __UNIT__ u1311 [1953283,1953293) kind=var len=26
var mapLightPositionBz={};
// __UNIT__ u1312 [1953293,1953349) kind=expr len=104
mapLightPositionBz['x']=-2.255,mapLightPositionBz['y']=0.7651411327434875,mapLightPositionBz['z']=-5.34;
// __UNIT__ u1313 [1953349,1953359) kind=var len=27
var defaultLightPointBa={};
// __UNIT__ u1314 [1953359,1953400) kind=expr len=91
defaultLightPointBa["preset"]='default',defaultLightPointBa['position']=mapLightPositionBz;
// __UNIT__ u1315 [1953400,1953410) kind=var len=26
var mapLightPositionBB={};
// __UNIT__ u1316 [1953410,1953452) kind=expr len=90
mapLightPositionBB['x']=-2.465,mapLightPositionBB['y']=1.01,mapLightPositionBB['z']=-5.26;
// __UNIT__ u1317 [1953452,1953462) kind=var len=24
var blueLightPointBc={};
// __UNIT__ u1318 [1953462,1953500) kind=expr len=82
blueLightPointBc['preset']="Blue",blueLightPointBc["position"]=mapLightPositionBB;
// __UNIT__ u1319 [1953500,1953510) kind=var len=26
var mapLightPositionBD={};
// __UNIT__ u1320 [1953510,1953556) kind=expr len=94
mapLightPositionBD['x']=-0.905,mapLightPositionBD['y']=1.2425,mapLightPositionBD['z']=-6.0875;
// __UNIT__ u1321 [1953556,1953566) kind=var len=26
var purpleLightPointBe={};
// __UNIT__ u1322 [1953566,1953606) kind=expr len=88
purpleLightPointBe['preset']="Purple",purpleLightPointBe['position']=mapLightPositionBD;
// __UNIT__ u1323 [1953606,1953616) kind=var len=26
var mapLightPositionBF={};
// __UNIT__ u1324 [1953616,1953660) kind=expr len=92
mapLightPositionBF['x']=-0.9,mapLightPositionBF['y']=1.3825,mapLightPositionBF['z']=-6.0875;
// __UNIT__ u1325 [1953660,1953670) kind=var len=26
var purpleLightPointBg={};
// __UNIT__ u1326 [1953670,1953710) kind=expr len=88
purpleLightPointBg['preset']="Purple",purpleLightPointBg['position']=mapLightPositionBF;
// __UNIT__ u1327 [1953710,1953720) kind=var len=26
var mapLightPositionBh={};
// __UNIT__ u1328 [1953720,1953765) kind=expr len=93
mapLightPositionBh['x']=-0.8975,mapLightPositionBh['y']=1.51,mapLightPositionBh['z']=-6.0925;
// __UNIT__ u1329 [1953765,1953775) kind=var len=26
var purpleLightPointBi={};
// __UNIT__ u1330 [1953775,1953815) kind=expr len=88
purpleLightPointBi['preset']="Purple",purpleLightPointBi["position"]=mapLightPositionBh;
// __UNIT__ u1331 [1953815,1953825) kind=var len=26
var mapLightPositionBj={};
// __UNIT__ u1332 [1953825,1953866) kind=expr len=89
mapLightPositionBj['x']=-2.68,mapLightPositionBj['y']=1.01,mapLightPositionBj['z']=-5.26;
// __UNIT__ u1333 [1953866,1953876) kind=var len=24
var blueLightPointBk={};
// __UNIT__ u1334 [1953876,1953914) kind=expr len=82
blueLightPointBk['preset']='Blue',blueLightPointBk['position']=mapLightPositionBj;
// __UNIT__ u1335 [1953914,1953924) kind=var len=26
var mapLightPositionBl={};
// __UNIT__ u1336 [1953924,1953970) kind=expr len=94
mapLightPositionBl['x']=-2.8875,mapLightPositionBl['y']=1.0175,mapLightPositionBl['z']=-5.255;
// __UNIT__ u1337 [1953970,1953980) kind=var len=24
var blueLightPointBm={};
// __UNIT__ u1338 [1953980,1954018) kind=expr len=82
blueLightPointBm["preset"]='Blue',blueLightPointBm['position']=mapLightPositionBl;
// __UNIT__ u1339 [1954018,1954028) kind=var len=26
var mapLightPositionBn={};
// __UNIT__ u1340 [1954028,1954108) kind=expr len=128
mapLightPositionBn['x']=1.276411883786117,mapLightPositionBn['y']=2.0844754887137156,mapLightPositionBn['z']=-7.050182819366453;
// __UNIT__ u1341 [1954108,1954118) kind=var len=28
var buildingLightPointBo={};
// __UNIT__ u1342 [1954118,1954165) kind=expr len=99
buildingLightPointBo['preset']='BuildingLight',buildingLightPointBo['position']=mapLightPositionBn;
// __UNIT__ u1343 [1954165,1954175) kind=var len=26
var mapLightPositionBp={};
// __UNIT__ u1344 [1954175,1954255) kind=expr len=128
mapLightPositionBp['x']=1.886127149969321,mapLightPositionBp['y']=1.7060363612810894,mapLightPositionBp['z']=-7.050182819366453;
// __UNIT__ u1345 [1954255,1954265) kind=var len=28
var buildingLightPointBq={};
// __UNIT__ u1346 [1954265,1954312) kind=expr len=99
buildingLightPointBq['preset']="BuildingLight",buildingLightPointBq['position']=mapLightPositionBp;
// __UNIT__ u1347 [1954312,1954322) kind=var len=26
var mapLightPositionBr={};
// __UNIT__ u1348 [1954322,1954403) kind=expr len=129
mapLightPositionBr['x']=1.4750740642455031,mapLightPositionBr['y']=1.7068279324936582,mapLightPositionBr['z']=-7.050182819366453;
// __UNIT__ u1349 [1954403,1954413) kind=var len=28
var buildingLightPointBs={};
// __UNIT__ u1350 [1954413,1954460) kind=expr len=99
buildingLightPointBs["preset"]="BuildingLight",buildingLightPointBs["position"]=mapLightPositionBr;
// __UNIT__ u1351 [1954460,1954470) kind=var len=26
var mapLightPositionBT={};
// __UNIT__ u1352 [1954470,1954551) kind=expr len=129
mapLightPositionBT['x']=2.2694581446110367,mapLightPositionBT['y']=1.1451601847988118,mapLightPositionBT['z']=-6.967312335968017;
// __UNIT__ u1353 [1954551,1954561) kind=var len=28
var buildingLightPointBu={};
// __UNIT__ u1354 [1954561,1954608) kind=expr len=99
buildingLightPointBu["preset"]='BuildingLight',buildingLightPointBu['position']=mapLightPositionBT;
// __UNIT__ u1355 [1954608,1954618) kind=var len=26
var mapLightPositionBV={};
// __UNIT__ u1356 [1954618,1954698) kind=expr len=128
mapLightPositionBV['x']=1.8892629070848654,mapLightPositionBV['y']=1.141903197401744,mapLightPositionBV['z']=-6.967312335968018;
// __UNIT__ u1357 [1954698,1954708) kind=var len=28
var buildingLightPointBw={};
// __UNIT__ u1358 [1954708,1954755) kind=expr len=99
buildingLightPointBw['preset']='BuildingLight',buildingLightPointBw["position"]=mapLightPositionBV;
// __UNIT__ u1359 [1954755,1954765) kind=var len=26
var mapLightPositionBX={};
// __UNIT__ u1360 [1954765,1954846) kind=expr len=129
mapLightPositionBX['x']=-1.521255804273569,mapLightPositionBX['y']=2.3222496475829266,mapLightPositionBX['z']=-6.375516603508654;
// __UNIT__ u1361 [1954846,1954856) kind=var len=28
var buildingLightPointBy={};
// __UNIT__ u1362 [1954856,1954903) kind=expr len=99
buildingLightPointBy['preset']="BuildingLight",buildingLightPointBy["position"]=mapLightPositionBX;
// __UNIT__ u1363 [1954903,1954913) kind=var len=26
var mapLightPositionBZ={};
// __UNIT__ u1364 [1954913,1954994) kind=expr len=129
mapLightPositionBZ['x']=-1.7755782474522284,mapLightPositionBZ['y']=3.349978457702597,mapLightPositionBZ['z']=-6.253032698416195;
// __UNIT__ u1365 [1954994,1955004) kind=var len=18
var mapLightC0={};
// __UNIT__ u1366 [1955004,1955051) kind=expr len=79
mapLightC0['preset']="BuildingLight",mapLightC0['position']=mapLightPositionBZ;
// __UNIT__ u1367 [1955051,1955061) kind=var len=26
var mapLightPositionC1={};
// __UNIT__ u1368 [1955061,1955143) kind=expr len=130
mapLightPositionC1['x']=-2.2814065133199994,mapLightPositionC1['y']=3.348895076766533,mapLightPositionC1['z']=-6.0094211913120255;
// __UNIT__ u1369 [1955143,1955153) kind=var len=18
var mapLightC2={};
// __UNIT__ u1370 [1955153,1955200) kind=expr len=79
mapLightC2["preset"]="BuildingLight",mapLightC2["position"]=mapLightPositionC1;
// __UNIT__ u1371 [1955200,1955210) kind=var len=26
var mapLightPositionC3={};
// __UNIT__ u1372 [1955210,1955292) kind=expr len=130
mapLightPositionC3['x']=-2.7845710483559043,mapLightPositionC3['y']=2.3148684651832023,mapLightPositionC3['z']=-5.767092710691837;
// __UNIT__ u1373 [1955292,1955302) kind=var len=18
var mapLightC4={};
// __UNIT__ u1374 [1955302,1955349) kind=expr len=79
mapLightC4['preset']='BuildingLight',mapLightC4['position']=mapLightPositionC3;
// __UNIT__ u1375 [1955349,1955359) kind=var len=26
var mapLightPositionC5={};
// __UNIT__ u1376 [1955359,1955437) kind=expr len=126
mapLightPositionC5['x']=-3.0348787242516,mapLightPositionC5['y']=2.319675655410909,mapLightPositionC5['z']=-5.646542429497383;
// __UNIT__ u1377 [1955437,1955447) kind=var len=18
var mapLightC6={};
// __UNIT__ u1378 [1955447,1955494) kind=expr len=79
mapLightC6['preset']='BuildingLight',mapLightC6['position']=mapLightPositionC5;
// __UNIT__ u1379 [1955494,1955504) kind=var len=26
var mapLightPositionC7={};
// __UNIT__ u1380 [1955504,1955585) kind=expr len=129
mapLightPositionC7['x']=-0.2799902192115815,mapLightPositionC7['y']=1.424306154251099,mapLightPositionC7['z']=-6.414379225512917;
// __UNIT__ u1381 [1955585,1955595) kind=var len=18
var mapLightC8={};
// __UNIT__ u1382 [1955595,1955642) kind=expr len=79
mapLightC8['preset']='BuildingLight',mapLightC8['position']=mapLightPositionC7;
// __UNIT__ u1383 [1955642,1955652) kind=var len=26
var mapLightPositionC9={};
// __UNIT__ u1384 [1955652,1955733) kind=expr len=129
mapLightPositionC9['x']=-0.5145207168976929,mapLightPositionC9['y']=0.975394250272792,mapLightPositionC9['z']=-6.340712345554641;
// __UNIT__ u1385 [1955733,1955743) kind=var len=28
var buildingLightPointCa={};
// __UNIT__ u1386 [1955743,1955790) kind=expr len=99
buildingLightPointCa["preset"]='BuildingLight',buildingLightPointCa['position']=mapLightPositionC9;
// __UNIT__ u1387 [1955790,1955800) kind=var len=26
var mapLightPositionCb={};
// __UNIT__ u1388 [1955800,1955867) kind=expr len=115
mapLightPositionCb['x']=0.058592303080231,mapLightPositionCb['y']=1.38127254388771,mapLightPositionCb['z']=-6.3025;
// __UNIT__ u1389 [1955867,1955877) kind=var len=26
var purpleLightPointCc={};
// __UNIT__ u1390 [1955877,1955917) kind=expr len=88
purpleLightPointCc['preset']="Purple",purpleLightPointCc['position']=mapLightPositionCb;
// __UNIT__ u1391 [1955917,1955927) kind=var len=26
var mapLightPositionCd={};
// __UNIT__ u1392 [1955927,1955999) kind=expr len=120
mapLightPositionCd['x']=0.054181914821799904,mapLightPositionCd['y']=1.1248284203705325,mapLightPositionCd['z']=-6.3075;
// __UNIT__ u1393 [1955999,1956009) kind=var len=26
var purpleLightPointCe={};
// __UNIT__ u1394 [1956009,1956049) kind=expr len=88
purpleLightPointCe['preset']="Purple",purpleLightPointCe['position']=mapLightPositionCd;
// __UNIT__ u1395 [1956049,1956059) kind=var len=26
var mapLightPositionCf={};
// __UNIT__ u1396 [1956059,1956142) kind=expr len=131
mapLightPositionCf['x']=0.05133169549452332,mapLightPositionCf['y']=0.8158600381908304,mapLightPositionCf['z']=-6.3100000000000005;
// __UNIT__ u1397 [1956142,1956152) kind=var len=26
var purpleLightPointCg={};
// __UNIT__ u1398 [1956152,1956192) kind=expr len=88
purpleLightPointCg['preset']='Purple',purpleLightPointCg['position']=mapLightPositionCf;
// __UNIT__ u1399 [1956192,1956202) kind=var len=26
var mapLightPositionCh={};
// __UNIT__ u1400 [1956202,1956246) kind=expr len=92
mapLightPositionCh['x']=-2.835,mapLightPositionCh['y']=1.3875,mapLightPositionCh['z']=-0.66;
// __UNIT__ u1401 [1956246,1956256) kind=var len=30
var subwayLogoLightPointCi={};
// __UNIT__ u1402 [1956256,1956300) kind=expr len=100
subwayLogoLightPointCi['preset']='SubwayLogo',subwayLogoLightPointCi["position"]=mapLightPositionCh;
// __UNIT__ u1403 [1956300,1956310) kind=var len=26
var mapLightPositionCj={};
// __UNIT__ u1404 [1956310,1956390) kind=expr len=128
mapLightPositionCj['x']=-2.1421890254724576,mapLightPositionCj['y']=1.409917507447883,mapLightPositionCj['z']=-0.96274346113205;
// __UNIT__ u1405 [1956390,1956400) kind=var len=28
var buildingLightPointCk={};
// __UNIT__ u1406 [1956400,1956447) kind=expr len=99
buildingLightPointCk['preset']="BuildingLight",buildingLightPointCk["position"]=mapLightPositionCj;
// __UNIT__ u1407 [1956447,1956457) kind=var len=26
var mapLightPositionCl={};
// __UNIT__ u1408 [1956457,1956540) kind=expr len=131
mapLightPositionCl['x']=-1.2559624577280444,mapLightPositionCl['y']=1.9714911041324303,mapLightPositionCl['z']=-1.0606278181076048;
// __UNIT__ u1409 [1956540,1956550) kind=var len=28
var buildingLightPointCm={};
// __UNIT__ u1410 [1956550,1956597) kind=expr len=99
buildingLightPointCm["preset"]="BuildingLight",buildingLightPointCm['position']=mapLightPositionCl;
// __UNIT__ u1411 [1956597,1956607) kind=var len=26
var mapLightPositionCn={};
// __UNIT__ u1412 [1956607,1956689) kind=expr len=130
mapLightPositionCn['x']=-0.6643594306422824,mapLightPositionCn['y']=1.9829590388287464,mapLightPositionCn['z']=-1.060627818107605;
// __UNIT__ u1413 [1956689,1956699) kind=var len=28
var buildingLightPointCo={};
// __UNIT__ u1414 [1956699,1956746) kind=expr len=99
buildingLightPointCo['preset']='BuildingLight',buildingLightPointCo["position"]=mapLightPositionCn;
// __UNIT__ u1415 [1956746,1956756) kind=var len=26
var mapLightPositionCp={};
// __UNIT__ u1416 [1956756,1956837) kind=expr len=129
mapLightPositionCp['x']=-4.024265522574681,mapLightPositionCp['y']=1.585179384250099,mapLightPositionCp['z']=-3.8782131671905526;
// __UNIT__ u1417 [1956837,1956847) kind=var len=28
var buildingLightPointCq={};
// __UNIT__ u1418 [1956847,1956894) kind=expr len=99
buildingLightPointCq["preset"]='BuildingLight',buildingLightPointCq['position']=mapLightPositionCp;
// __UNIT__ u1419 [1956894,1956904) kind=var len=26
var mapLightPositionCr={};
// __UNIT__ u1420 [1956904,1956949) kind=expr len=93
mapLightPositionCr['x']=-0.165,mapLightPositionCr['y']=2.025,mapLightPositionCr['z']=-4.4275;
// __UNIT__ u1421 [1956949,1956959) kind=var len=26
var orangeLightPointCs={};
// __UNIT__ u1422 [1956959,1956999) kind=expr len=88
orangeLightPointCs["preset"]='Orange',orangeLightPointCs['position']=mapLightPositionCr;
// __UNIT__ u1423 [1956999,1957009) kind=var len=26
var mapLightPositionCt={};
// __UNIT__ u1424 [1957009,1957052) kind=expr len=91
mapLightPositionCt['x']=-0.155,mapLightPositionCt['y']=1.76,mapLightPositionCt['z']=-4.425;
// __UNIT__ u1425 [1957052,1957062) kind=var len=26
var orangeLightPointCu={};
// __UNIT__ u1426 [1957062,1957102) kind=expr len=88
orangeLightPointCu['preset']="Orange",orangeLightPointCu['position']=mapLightPositionCt;
// __UNIT__ u1427 [1957102,1957112) kind=var len=26
var mapLightPositionCv={};
// __UNIT__ u1428 [1957112,1957159) kind=expr len=95
mapLightPositionCv['x']=-0.1525,mapLightPositionCv['y']=1.4975,mapLightPositionCv['z']=-4.4325;
// __UNIT__ u1429 [1957159,1957169) kind=var len=26
var orangeLightPointCw={};
// __UNIT__ u1430 [1957169,1957209) kind=expr len=88
orangeLightPointCw["preset"]="Orange",orangeLightPointCw['position']=mapLightPositionCv;
// __UNIT__ u1431 [1957209,1957219) kind=var len=26
var mapLightPositionCx={};
// __UNIT__ u1432 [1957219,1957286) kind=expr len=115
mapLightPositionCx['x']=-0.18,mapLightPositionCx['y']=2.035703374647007,mapLightPositionCx['z']=-4.702646710847129;
// __UNIT__ u1433 [1957286,1957296) kind=var len=24
var blueLightPointCy={};
// __UNIT__ u1434 [1957296,1957334) kind=expr len=82
blueLightPointCy["preset"]="Blue",blueLightPointCy["position"]=mapLightPositionCx;
// __UNIT__ u1435 [1957334,1957344) kind=var len=26
var mapLightPositionCz={};
// __UNIT__ u1436 [1957344,1957412) kind=expr len=116
mapLightPositionCz['x']=-0.16,mapLightPositionCz['y']=1.6387414286138966,mapLightPositionCz['z']=-4.706646303909892;
// __UNIT__ u1437 [1957412,1957422) kind=var len=24
var blueLightPointCa={};
// __UNIT__ u1438 [1957422,1957460) kind=expr len=82
blueLightPointCa['preset']='Blue',blueLightPointCa["position"]=mapLightPositionCz;
// __UNIT__ u1439 [1957460,1957470) kind=var len=26
var mapLightPositionCB={};
// __UNIT__ u1440 [1957470,1957527) kind=expr len=105
mapLightPositionCB['x']=-0.1675,mapLightPositionCB['y']=1.835,mapLightPositionCB['z']=-4.704752992517663;
// __UNIT__ u1441 [1957527,1957537) kind=var len=24
var blueLightPointCc={};
// __UNIT__ u1442 [1957537,1957575) kind=expr len=82
blueLightPointCc['preset']='Blue',blueLightPointCc['position']=mapLightPositionCB;
// __UNIT__ u1443 [1957575,1957585) kind=var len=26
var mapLightPositionCD={};
// __UNIT__ u1444 [1957585,1957631) kind=expr len=94
mapLightPositionCD['x']=0.2525,mapLightPositionCD['y']=1.0925,mapLightPositionCD['z']=-5.2425;
// __UNIT__ u1445 [1957631,1957641) kind=var len=24
var blueLightPointCE={};
// __UNIT__ u1446 [1957641,1957679) kind=expr len=82
blueLightPointCE['preset']='Blue',blueLightPointCE["position"]=mapLightPositionCD;
// __UNIT__ u1447 [1957679,1957689) kind=var len=26
var mapLightPositionCF={};
// __UNIT__ u1448 [1957689,1957769) kind=expr len=128
mapLightPositionCF['x']=0.765326968728536,mapLightPositionCF['y']=0.5028952916170034,mapLightPositionCF['z']=-6.409800529479981;
// __UNIT__ u1449 [1957769,1957779) kind=var len=24
var blueLightPointCG={};
// __UNIT__ u1450 [1957779,1957817) kind=expr len=82
blueLightPointCG['preset']='Blue',blueLightPointCG["position"]=mapLightPositionCF;
// __UNIT__ u1451 [1957817,1957827) kind=var len=26
var mapLightPositionCH={};
// __UNIT__ u1452 [1957827,1957884) kind=expr len=105
mapLightPositionCH['x']=-1.2,mapLightPositionCH['y']=0.32947382603281156,mapLightPositionCH['z']=-5.8375;
// __UNIT__ u1453 [1957884,1957894) kind=var len=31
var reflection1LightPointCI={};
// __UNIT__ u1454 [1957894,1957939) kind=expr len=103
reflection1LightPointCI["preset"]="Reflection1",reflection1LightPointCI['position']=mapLightPositionCH;
// __UNIT__ u1455 [1957939,1957949) kind=var len=26
var mapLightPositionCJ={};
// __UNIT__ u1456 [1957949,1958032) kind=expr len=131
mapLightPositionCJ['x']=-1.7454920155485283,mapLightPositionCJ['y']=0.33022000895791026,mapLightPositionCJ['z']=-5.582637321058282;
// __UNIT__ u1457 [1958032,1958042) kind=var len=31
var reflection1LightPointCK={};
// __UNIT__ u1458 [1958042,1958087) kind=expr len=103
reflection1LightPointCK['preset']="Reflection1",reflection1LightPointCK["position"]=mapLightPositionCJ;
// __UNIT__ u1459 [1958087,1958097) kind=var len=26
var mapLightPositionCL={};
// __UNIT__ u1460 [1958097,1958179) kind=expr len=130
mapLightPositionCL['x']=-2.2788558925174667,mapLightPositionCL['y']=0.3307272946474989,mapLightPositionCL['z']=-5.321537725235785;
// __UNIT__ u1461 [1958179,1958189) kind=var len=31
var reflection1LightPointCM={};
// __UNIT__ u1462 [1958189,1958234) kind=expr len=103
reflection1LightPointCM["preset"]='Reflection1',reflection1LightPointCM['position']=mapLightPositionCL;
// __UNIT__ u1463 [1958234,1958244) kind=var len=26
var mapLightPositionCN={};
// __UNIT__ u1464 [1958244,1958327) kind=expr len=131
mapLightPositionCN['x']=0.07580611892123329,mapLightPositionCN['y']=0.21862088736642954,mapLightPositionCN['z']=-6.340018098819977;
// __UNIT__ u1465 [1958327,1958337) kind=var len=34
var reflectionPinkLightPointCO={};
// __UNIT__ u1466 [1958337,1958385) kind=expr len=112
reflectionPinkLightPointCO["preset"]='ReflectionPink',reflectionPinkLightPointCO['position']=mapLightPositionCN;
// __UNIT__ u1467 [1958385,1958395) kind=var len=26
var mapLightPositionCP={};
// __UNIT__ u1468 [1958395,1958479) kind=expr len=132
mapLightPositionCP['x']=-0.08720129438650526,mapLightPositionCP['y']=0.3306555550389421,mapLightPositionCP['z']=-4.4350000000000005;
// __UNIT__ u1469 [1958479,1958489) kind=var len=36
var orangeReflectionLightPointCQ={};
// __UNIT__ u1470 [1958489,1958539) kind=expr len=118
orangeReflectionLightPointCQ['preset']="OrangeReflection",orangeReflectionLightPointCQ['position']=mapLightPositionCP;
// __UNIT__ u1471 [1958539,1958549) kind=var len=26
var mapLightPositionCR={};
// __UNIT__ u1472 [1958549,1958619) kind=expr len=118
mapLightPositionCR['x']=-0.0886240287758644,mapLightPositionCR['y']=0.3275,mapLightPositionCR['z']=-4.711952161634878;
// __UNIT__ u1473 [1958619,1958629) kind=var len=36
var purpleReflectionLightPointCS={};
// __UNIT__ u1474 [1958629,1958679) kind=expr len=118
purpleReflectionLightPointCS["preset"]='PurpleReflection',purpleReflectionLightPointCS["position"]=mapLightPositionCR;
// __UNIT__ u1475 [1958679,1958689) kind=var len=26
var mapLightPositionCT={};
// __UNIT__ u1476 [1958689,1958747) kind=expr len=106
mapLightPositionCT['x']=-2.7475,mapLightPositionCT['y']=1.1025,mapLightPositionCT['z']=-5.042555723595179;
// __UNIT__ u1477 [1958747,1958757) kind=var len=26
var orangeLightPointCU={};
// __UNIT__ u1478 [1958757,1958797) kind=expr len=88
orangeLightPointCU['preset']='Orange',orangeLightPointCU["position"]=mapLightPositionCT;
// __UNIT__ u1479 [1958797,1958807) kind=var len=26
var mapLightPositionCV={};
// __UNIT__ u1480 [1958807,1958878) kind=expr len=119
mapLightPositionCV['x']=-2.7800000000000002,mapLightPositionCV['y']=1.1025,mapLightPositionCV['z']=-4.8955567481557365;
// __UNIT__ u1481 [1958878,1958888) kind=var len=26
var orangeLightPointCW={};
// __UNIT__ u1482 [1958888,1958928) kind=expr len=88
orangeLightPointCW["preset"]='Orange',orangeLightPointCW['position']=mapLightPositionCV;
// __UNIT__ u1483 [1958928,1958938) kind=var len=26
var mapLightPositionCX={};
// __UNIT__ u1484 [1958938,1958995) kind=expr len=105
mapLightPositionCX['x']=-2.77,mapLightPositionCX['y']=1.1025,mapLightPositionCX['z']=-4.7390190299187305;
// __UNIT__ u1485 [1958995,1959005) kind=var len=26
var orangeLightPointCY={};
// __UNIT__ u1486 [1959005,1959045) kind=expr len=88
orangeLightPointCY["preset"]="Orange",orangeLightPointCY["position"]=mapLightPositionCX;
// __UNIT__ u1487 [1959045,1959055) kind=var len=26
var mapLightPositionCZ={};
// __UNIT__ u1488 [1959055,1959114) kind=expr len=107
mapLightPositionCZ['x']=-2.7425,mapLightPositionCZ['y']=1.0342920237978268,mapLightPositionCZ['z']=-4.4475;
// __UNIT__ u1489 [1959114,1959124) kind=var len=24
var blueLightPointD0={};
// __UNIT__ u1490 [1959124,1959162) kind=expr len=82
blueLightPointD0['preset']="Blue",blueLightPointD0['position']=mapLightPositionCZ;
// __UNIT__ u1491 [1959162,1959172) kind=var len=26
var mapLightPositionD1={};
// __UNIT__ u1492 [1959172,1959230) kind=expr len=106
mapLightPositionD1['x']=-2.7575,mapLightPositionD1['y']=1.0225,mapLightPositionD1['z']=-4.070402994952216;
// __UNIT__ u1493 [1959230,1959240) kind=var len=18
var mapLightD2={};
// __UNIT__ u1494 [1959240,1959278) kind=expr len=70
mapLightD2['preset']="Blue",mapLightD2['position']=mapLightPositionD1;
// __UNIT__ u1495 [1959278,1959288) kind=var len=26
var mapLightPositionD3={};
// __UNIT__ u1496 [1959288,1959332) kind=expr len=92
mapLightPositionD3['x']=-2.7875,mapLightPositionD3['y']=1.095,mapLightPositionD3['z']=-4.24;
// __UNIT__ u1497 [1959332,1959342) kind=var len=18
var mapLightD4={};
// __UNIT__ u1498 [1959342,1959380) kind=expr len=70
mapLightD4['preset']='Blue',mapLightD4['position']=mapLightPositionD3;
// __UNIT__ u1499 [1959380,1959390) kind=var len=26
var mapLightPositionD5={};
// __UNIT__ u1500 [1959390,1959435) kind=expr len=93
mapLightPositionD5['x']=-0.0025,mapLightPositionD5['y']=1.47,mapLightPositionD5['z']=-5.2975;
// __UNIT__ u1501 [1959435,1959445) kind=var len=18
var mapLightD6={};
// __UNIT__ u1502 [1959445,1959484) kind=expr len=71
mapLightD6["preset"]='Green',mapLightD6["position"]=mapLightPositionD5;
// __UNIT__ u1503 [1959484,1959494) kind=var len=26
var mapLightPositionD7={};
// __UNIT__ u1504 [1959494,1959549) kind=expr len=103
mapLightPositionD7['x']=-0.1525,mapLightPositionD7['y']=1.53630882591143,mapLightPositionD7['z']=-5.51;
// __UNIT__ u1505 [1959549,1959559) kind=var len=18
var mapLightD8={};
// __UNIT__ u1506 [1959559,1959598) kind=expr len=71
mapLightD8['preset']="Green",mapLightD8['position']=mapLightPositionD7;
// __UNIT__ u1507 [1959598,1959608) kind=var len=26
var mapLightPositionD9={};
// __UNIT__ u1508 [1959608,1959665) kind=expr len=105
mapLightPositionD9['x']=-0.2675,mapLightPositionD9['y']=1.5218971690782686,mapLightPositionD9['z']=-5.73;
// __UNIT__ u1509 [1959665,1959675) kind=var len=18
var mapLightDa={};
// __UNIT__ u1510 [1959675,1959714) kind=expr len=71
mapLightDa['preset']='Green',mapLightDa['position']=mapLightPositionD9;
// __UNIT__ u1511 [1959714,1959724) kind=var len=26
var mapLightPositionDb={};
// __UNIT__ u1512 [1959724,1959781) kind=expr len=105
mapLightPositionDb['x']=-0.38,mapLightPositionDb['y']=1.4652375641222777,mapLightPositionDb['z']=-5.9675;
// __UNIT__ u1513 [1959781,1959791) kind=var len=18
var mapLightDc={};
// __UNIT__ u1514 [1959791,1959829) kind=expr len=70
mapLightDc['preset']='Pink',mapLightDc["position"]=mapLightPositionDb;
// __UNIT__ u1515 [1959829,1959839) kind=var len=26
var mapLightPositionDd={};
// __UNIT__ u1516 [1959839,1959882) kind=expr len=91
mapLightPositionDd['x']=2.515,mapLightPositionDd['y']=1.6275,mapLightPositionDd['z']=-5.46;
// __UNIT__ u1517 [1959882,1959892) kind=var len=18
var mapLightDe={};
// __UNIT__ u1518 [1959892,1959930) kind=expr len=70
mapLightDe["preset"]='Blue',mapLightDe['position']=mapLightPositionDd;
// __UNIT__ u1519 [1959930,1959940) kind=var len=26
var mapLightPositionDf={};
// __UNIT__ u1520 [1959940,1960008) kind=expr len=116
mapLightPositionDf['x']=2.5300000000000002,mapLightPositionDf['y']=1.2594509444709565,mapLightPositionDf['z']=-5.46;
// __UNIT__ u1521 [1960008,1960018) kind=var len=18
var mapLightDg={};
// __UNIT__ u1522 [1960018,1960056) kind=expr len=70
mapLightDg['preset']='Blue',mapLightDg['position']=mapLightPositionDf;
// __UNIT__ u1523 [1960056,1960066) kind=var len=26
var mapLightPositionDh={};
// __UNIT__ u1524 [1960066,1960122) kind=expr len=104
mapLightPositionDh['x']=2.5325,mapLightPositionDh['y']=0.8380705699382374,mapLightPositionDh['z']=-5.44;
// __UNIT__ u1525 [1960122,1960132) kind=var len=24
var blueLightPointDi={};
// __UNIT__ u1526 [1960132,1960170) kind=expr len=82
blueLightPointDi['preset']="Blue",blueLightPointDi["position"]=mapLightPositionDh;
// __UNIT__ u1527 [1960170,1960180) kind=var len=26
var mapLightPositionDj={};
// __UNIT__ u1528 [1960180,1960248) kind=expr len=116
mapLightPositionDj['x']=-1.50236485890886,mapLightPositionDj['y']=0.772258514582209,mapLightPositionDj['z']=-4.1125;
// __UNIT__ u1529 [1960248,1960258) kind=var len=27
var defaultLightPointDk={};
// __UNIT__ u1530 [1960258,1960299) kind=expr len=91
defaultLightPointDk['preset']='default',defaultLightPointDk['position']=mapLightPositionDj;
// __UNIT__ u1531 [1960299,1960309) kind=var len=26
var mapLightPositionDl={};
// __UNIT__ u1532 [1960309,1960354) kind=expr len=93
mapLightPositionDl['x']=-3.225,mapLightPositionDl['y']=-0.33,mapLightPositionDl['z']=-4.8275;
// __UNIT__ u1533 [1960354,1960364) kind=var len=25
var whiteLightPointDm={};
// __UNIT__ u1534 [1960364,1960403) kind=expr len=85
whiteLightPointDm['preset']="White",whiteLightPointDm["position"]=mapLightPositionDl;
// __UNIT__ u1535 [1960403,1960413) kind=var len=26
var mapLightPositionDn={};
// __UNIT__ u1536 [1960413,1960496) kind=expr len=131
mapLightPositionDn['x']=-3.2572809277181087,mapLightPositionDn['y']=-0.3297842024282729,mapLightPositionDn['z']=-5.034187513582658;
// __UNIT__ u1537 [1960496,1960506) kind=var len=25
var whiteLightPointDo={};
// __UNIT__ u1538 [1960506,1960545) kind=expr len=85
whiteLightPointDo["preset"]="White",whiteLightPointDo["position"]=mapLightPositionDn;
// __UNIT__ u1539 [1960545,1960555) kind=var len=26
var mapLightPositionDp={};
// __UNIT__ u1540 [1960555,1960639) kind=expr len=132
mapLightPositionDp['x']=-3.2572809882910043,mapLightPositionDp['y']=-0.2679128585083547,mapLightPositionDp['z']=-4.3736301551967225;
// __UNIT__ u1541 [1960639,1960649) kind=var len=25
var whiteLightPointDq={};
// __UNIT__ u1542 [1960649,1960688) kind=expr len=85
whiteLightPointDq["preset"]='White',whiteLightPointDq["position"]=mapLightPositionDp;
// __UNIT__ u1543 [1960688,1960698) kind=var len=26
var mapLightPositionDr={};
// __UNIT__ u1544 [1960698,1960783) kind=expr len=133
mapLightPositionDr['x']=-3.2572810113253006,mapLightPositionDr['y']=-0.29401703813447566,mapLightPositionDr['z']=-4.1224373724095775;
// __UNIT__ u1545 [1960783,1960793) kind=var len=25
var whiteLightPointDs={};
// __UNIT__ u1546 [1960793,1960832) kind=expr len=85
whiteLightPointDs["preset"]='White',whiteLightPointDs['position']=mapLightPositionDr;
// __UNIT__ u1547 [1960832,1960842) kind=var len=26
var mapLightPositionDt={};
// __UNIT__ u1548 [1960842,1960923) kind=expr len=129
mapLightPositionDt['x']=-2.55351356680188,mapLightPositionDt['y']=-0.2146899343260645,mapLightPositionDt['z']=-6.137239456176758;
// __UNIT__ u1549 [1960923,1960933) kind=var len=25
var whiteLightPointDu={};
// __UNIT__ u1550 [1960933,1960972) kind=expr len=85
whiteLightPointDu['preset']='White',whiteLightPointDu['position']=mapLightPositionDt;
// __UNIT__ u1551 [1960972,1960982) kind=var len=26
var mapLightPositionDv={};
// __UNIT__ u1552 [1960982,1961064) kind=expr len=130
mapLightPositionDv['x']=-0.490726721949476,mapLightPositionDv['y']=-0.4476004651665558,mapLightPositionDv['z']=-6.137239456176758;
// __UNIT__ u1553 [1961064,1961074) kind=var len=25
var whiteLightPointDw={};
// __UNIT__ u1554 [1961074,1961113) kind=expr len=85
whiteLightPointDw['preset']='White',whiteLightPointDw["position"]=mapLightPositionDv;
// __UNIT__ u1555 [1961113,1961123) kind=var len=26
var mapLightPositionDx={};
// __UNIT__ u1556 [1961123,1961206) kind=expr len=131
mapLightPositionDx['x']=0.1907611830171213,mapLightPositionDx['y']=-0.5741614775711088,mapLightPositionDx['z']=-4.7001860745642885;
// __UNIT__ u1557 [1961206,1961216) kind=var len=25
var whiteLightPointDy={};
// __UNIT__ u1558 [1961216,1961255) kind=expr len=85
whiteLightPointDy['preset']="White",whiteLightPointDy['position']=mapLightPositionDx;
// __UNIT__ u1559 [1961255,1961265) kind=var len=26
var mapLightPositionDz={};
// __UNIT__ u1560 [1961265,1961345) kind=expr len=128
mapLightPositionDz['x']=0.1907612993083625,mapLightPositionDz['y']=-0.4755502067249453,mapLightPositionDz['z']=-5.5823948916711;
// __UNIT__ u1561 [1961345,1961355) kind=var len=18
var mapLightDA={};
// __UNIT__ u1562 [1961355,1961394) kind=expr len=71
mapLightDA["preset"]='White',mapLightDA["position"]=mapLightPositionDz;
// __UNIT__ u1563 [1961394,1961404) kind=var len=26
var mapLightPositionDB={};
// __UNIT__ u1564 [1961404,1961488) kind=expr len=132
mapLightPositionDB['x']=0.19076124789644056,mapLightPositionDB['y']=-0.46571431544904796,mapLightPositionDB['z']=-5.192373682965803;
// __UNIT__ u1565 [1961488,1961498) kind=var len=18
var mapLightDC={};
// __UNIT__ u1566 [1961498,1961537) kind=expr len=71
mapLightDC["preset"]='White',mapLightDC['position']=mapLightPositionDB;
// __UNIT__ u1567 [1961537,1961547) kind=var len=26
var mapLightPositionDD={};
// __UNIT__ u1568 [1961547,1961616) kind=expr len=117
mapLightPositionDD['x']=0.19076129985359602,mapLightPositionDD['y']=-0.18,mapLightPositionDD['z']=-5.586531139739979;
// __UNIT__ u1569 [1961616,1961626) kind=var len=18
var mapLightDE={};
// __UNIT__ u1570 [1961626,1961665) kind=expr len=71
mapLightDE['preset']='White',mapLightDE["position"]=mapLightPositionDD;
// __UNIT__ u1571 [1961665,1961675) kind=var len=23
var mapLightColorDF={};
// __UNIT__ u1572 [1961675,1961757) kind=expr len=121
mapLightColorDF['x']=0.9921568627450981,mapLightColorDF['y']=0.8313725490196079,mapLightColorDF['z']=0.24705882352941178;
// __UNIT__ u1573 [1961757,1961767) kind=var len=24
var mapLightPreset16={};
// __UNIT__ u1574 [1961767,1961862) kind=expr len=178
mapLightPreset16['pointedDown']=![],mapLightPreset16["radius"]='0.29',mapLightPreset16['scale']="2.2",mapLightPreset16['intensity']=0x1,mapLightPreset16["color"]=mapLightColorDF;
// __UNIT__ u1575 [1961862,1961872) kind=var len=23
var mapLightColorDH={};
// __UNIT__ u1576 [1961872,1961952) kind=expr len=119
mapLightColorDH['x']=0.996078431372549,mapLightColorDH['y']=0.9803921568627451,mapLightColorDH['z']=0.5843137254901961;
// __UNIT__ u1577 [1961952,1961962) kind=var len=24
var mapLightPreset17={};
// __UNIT__ u1578 [1961962,1962052) kind=expr len=173
mapLightPreset17['pointedDown']='1',mapLightPreset17["radius"]=0.4,mapLightPreset17['scale']=0x6,mapLightPreset17['intensity']=0x1,mapLightPreset17['color']=mapLightColorDH;
// __UNIT__ u1579 [1962052,1962062) kind=var len=23
var mapLightColorDJ={};
// __UNIT__ u1580 [1962062,1962143) kind=expr len=120
mapLightColorDJ['x']=0.6705882352941176,mapLightColorDJ['y']=0.34509803921568627,mapLightColorDJ['z']=0.996078431372549;
// __UNIT__ u1581 [1962143,1962153) kind=var len=24
var mapLightPreset18={};
// __UNIT__ u1582 [1962153,1962245) kind=expr len=175
mapLightPreset18["pointedDown"]=![],mapLightPreset18["radius"]="0.2",mapLightPreset18['scale']='3',mapLightPreset18['intensity']=0x1,mapLightPreset18['color']=mapLightColorDJ;
// __UNIT__ u1583 [1962245,1962255) kind=var len=23
var mapLightColorDL={};
// __UNIT__ u1584 [1962255,1962321) kind=expr len=105
mapLightColorDL['x']=0x1,mapLightColorDL['y']=0.7294117647058823,mapLightColorDL['z']=0.1411764705882353;
// __UNIT__ u1585 [1962321,1962331) kind=var len=24
var mapLightPreset19={};
// __UNIT__ u1586 [1962331,1962425) kind=expr len=177
mapLightPreset19["pointedDown"]=![],mapLightPreset19['radius']='0.2',mapLightPreset19['scale']="3.2",mapLightPreset19['intensity']=0x1,mapLightPreset19["color"]=mapLightColorDL;
// __UNIT__ u1587 [1962425,1962435) kind=var len=23
var mapLightColorDN={};
// __UNIT__ u1588 [1962435,1962514) kind=expr len=118
mapLightColorDN['x']=0.996078431372549,mapLightColorDN['y']=0.788235294117647,mapLightColorDN['z']=0.2235294117647059;
// __UNIT__ u1589 [1962514,1962524) kind=var len=24
var mapLightPreset20={};
// __UNIT__ u1590 [1962524,1962619) kind=expr len=178
mapLightPreset20['pointedDown']=![],mapLightPreset20["radius"]='0.57',mapLightPreset20['scale']="4.2",mapLightPreset20['intensity']=0x1,mapLightPreset20['color']=mapLightColorDN;
// __UNIT__ u1591 [1962619,1962629) kind=var len=23
var mapLightColorDP={};
// __UNIT__ u1592 [1962629,1962710) kind=expr len=120
mapLightColorDP['x']=0.34509803921568627,mapLightColorDP['y']=0.996078431372549,mapLightColorDP['z']=0.4196078431372549;
// __UNIT__ u1593 [1962710,1962720) kind=var len=24
var mapLightPreset21={};
// __UNIT__ u1594 [1962720,1962815) kind=expr len=178
mapLightPreset21['pointedDown']=![],mapLightPreset21['radius']="0.33",mapLightPreset21["scale"]="1.3",mapLightPreset21['intensity']=0x1,mapLightPreset21['color']=mapLightColorDP;
// __UNIT__ u1595 [1962815,1962825) kind=var len=23
var mapLightColorDR={};
// __UNIT__ u1596 [1962825,1962906) kind=expr len=120
mapLightColorDR['x']=0.34509803921568627,mapLightColorDR['y']=0.9215686274509803,mapLightColorDR['z']=0.996078431372549;
// __UNIT__ u1597 [1962906,1962916) kind=var len=24
var mapLightPreset22={};
// __UNIT__ u1598 [1962916,1963011) kind=expr len=178
mapLightPreset22['pointedDown']=![],mapLightPreset22['radius']='0.79',mapLightPreset22['scale']="7.3",mapLightPreset22['intensity']=0x1,mapLightPreset22["color"]=mapLightColorDR;
// __UNIT__ u1599 [1963011,1963021) kind=var len=23
var mapLightColorDT={};
// __UNIT__ u1600 [1963021,1963102) kind=expr len=120
mapLightColorDT['x']=0.996078431372549,mapLightColorDT['y']=0.5686274509803921,mapLightColorDT['z']=0.08627450980392157;
// __UNIT__ u1601 [1963102,1963112) kind=var len=24
var mapLightPreset23={};
// __UNIT__ u1602 [1963112,1963207) kind=expr len=178
mapLightPreset23['pointedDown']=![],mapLightPreset23["radius"]='0.29',mapLightPreset23['scale']="2.2",mapLightPreset23['intensity']=0x1,mapLightPreset23["color"]=mapLightColorDT;
// __UNIT__ u1603 [1963207,1963217) kind=var len=23
var mapLightColorDV={};
// __UNIT__ u1604 [1963217,1963298) kind=expr len=120
mapLightColorDV['x']=0.08627450980392157,mapLightColorDV['y']=0.996078431372549,mapLightColorDV['z']=0.8117647058823529;
// __UNIT__ u1605 [1963298,1963308) kind=var len=24
var mapLightPreset24={};
// __UNIT__ u1606 [1963308,1963403) kind=expr len=178
mapLightPreset24['pointedDown']=![],mapLightPreset24['radius']='0.29',mapLightPreset24['scale']="2.2",mapLightPreset24["intensity"]=0x1,mapLightPreset24["color"]=mapLightColorDV;
// __UNIT__ u1607 [1963403,1963413) kind=var len=23
var mapLightColorDX={};
// __UNIT__ u1608 [1963413,1963494) kind=expr len=120
mapLightColorDX['x']=0.996078431372549,mapLightColorDX['y']=0.8549019607843137,mapLightColorDX['z']=0.34509803921568627;
// __UNIT__ u1609 [1963494,1963504) kind=var len=24
var mapLightPreset25={};
// __UNIT__ u1610 [1963504,1963599) kind=expr len=178
mapLightPreset25['pointedDown']=![],mapLightPreset25['radius']="0.29",mapLightPreset25['scale']='0.9',mapLightPreset25["intensity"]=0x1,mapLightPreset25['color']=mapLightColorDX;
// __UNIT__ u1611 [1963599,1963609) kind=var len=23
var mapLightColorDZ={};
// __UNIT__ u1612 [1963609,1963690) kind=expr len=120
mapLightColorDZ['x']=0.996078431372549,mapLightColorDZ['y']=0.34509803921568627,mapLightColorDZ['z']=0.8235294117647058;
// __UNIT__ u1613 [1963690,1963700) kind=var len=24
var mapLightPreset26={};
// __UNIT__ u1614 [1963700,1963795) kind=expr len=178
mapLightPreset26["pointedDown"]=![],mapLightPreset26["radius"]='0.29',mapLightPreset26["scale"]='1.1',mapLightPreset26["intensity"]=0x1,mapLightPreset26['color']=mapLightColorDZ;
// __UNIT__ u1615 [1963795,1963805) kind=var len=23
var mapLightColorE1={};
// __UNIT__ u1616 [1963805,1963886) kind=expr len=120
mapLightColorE1['x']=0.996078431372549,mapLightColorE1['y']=0.6392156862745098,mapLightColorE1['z']=0.34509803921568627;
// __UNIT__ u1617 [1963886,1963896) kind=var len=24
var mapLightPreset27={};
// __UNIT__ u1618 [1963896,1963991) kind=expr len=178
mapLightPreset27["pointedDown"]=![],mapLightPreset27['radius']='0.29',mapLightPreset27['scale']='0.9',mapLightPreset27["intensity"]=0x1,mapLightPreset27['color']=mapLightColorE1;
// __UNIT__ u1619 [1963991,1964001) kind=var len=23
var mapLightColorE3={};
// __UNIT__ u1620 [1964001,1964082) kind=expr len=120
mapLightColorE3['x']=0.8549019607843137,mapLightColorE3['y']=0.34509803921568627,mapLightColorE3['z']=0.996078431372549;
// __UNIT__ u1621 [1964082,1964092) kind=var len=24
var mapLightPreset28={};
// __UNIT__ u1622 [1964092,1964187) kind=expr len=178
mapLightPreset28['pointedDown']=![],mapLightPreset28["radius"]='0.29',mapLightPreset28["scale"]='0.9',mapLightPreset28['intensity']=0x1,mapLightPreset28['color']=mapLightColorE3;
// __UNIT__ u1623 [1964187,1964197) kind=var len=23
var mapLightColorE5={};
// __UNIT__ u1624 [1964197,1964278) kind=expr len=120
mapLightColorE5['x']=0.996078431372549,mapLightColorE5['y']=0.30196078431372547,mapLightColorE5['z']=0.7411764705882353;
// __UNIT__ u1625 [1964278,1964288) kind=var len=24
var mapLightPreset29={};
// __UNIT__ u1626 [1964288,1964383) kind=expr len=178
mapLightPreset29['pointedDown']=![],mapLightPreset29["radius"]="0.31",mapLightPreset29['scale']="1.3",mapLightPreset29['intensity']=0x1,mapLightPreset29['color']=mapLightColorE5;
// __UNIT__ u1627 [1964383,1964393) kind=var len=23
var mapLightColorE7={};
// __UNIT__ u1628 [1964393,1964429) kind=expr len=75
mapLightColorE7['x']=0x1,mapLightColorE7['y']=0x1,mapLightColorE7['z']=0x1;
// __UNIT__ u1629 [1964429,1964439) kind=var len=24
var mapLightPreset30={};
// __UNIT__ u1630 [1964439,1964534) kind=expr len=178
mapLightPreset30['pointedDown']='0',mapLightPreset30['radius']='0.26',mapLightPreset30['scale']='0.8',mapLightPreset30["intensity"]=0x1,mapLightPreset30["color"]=mapLightColorE7;
// __UNIT__ u1631 [1964534,1964544) kind=var len=29
var sandstormLightPresets={};
// __UNIT__ u1632 [1964544,1964823) kind=expr len=774
sandstormLightPresets["default"]=mapLightPreset16,sandstormLightPresets["Spotlight"]=mapLightPreset17,sandstormLightPresets['Purple']=mapLightPreset18,sandstormLightPresets['Red']=mapLightPreset19,sandstormLightPresets["BuildingLight"]=mapLightPreset20,sandstormLightPresets['Green']=mapLightPreset21,sandstormLightPresets['SubwayLogo']=mapLightPreset22,sandstormLightPresets['Orange']=mapLightPreset23,sandstormLightPresets['Blue']=mapLightPreset24,sandstormLightPresets["Reflection1"]=mapLightPreset25,sandstormLightPresets['ReflectionPink']=mapLightPreset26,sandstormLightPresets['OrangeReflection']=mapLightPreset27,sandstormLightPresets['PurpleReflection']=mapLightPreset28,sandstormLightPresets['Pink']=mapLightPreset29,sandstormLightPresets["White"]=mapLightPreset30;
// __UNIT__ u1633 [1964823,1964833) kind=var len=23
var sunsetLightData={};
// __UNIT__ u1634 [1964833,1965176) kind=expr len=1488
sunsetLightData['sunColor']=sunsetSunColor,sunsetLightData['sunDirection']=sunsetSunDirection,sunsetLightData["penumbra"]='0.017',sunsetLightData['ambient']='0.5',sunsetLightData['diffuse']=!![],sunsetLightData['lights']=[defaultLightPointBu,defaultLightPointBw,defaultLightPointBy,defaultLightPointBa,blueLightPointBc,purpleLightPointBe,purpleLightPointBg,purpleLightPointBi,blueLightPointBk,blueLightPointBm,buildingLightPointBo,buildingLightPointBq,buildingLightPointBs,buildingLightPointBu,buildingLightPointBw,buildingLightPointBy,mapLightC0,mapLightC2,mapLightC4,mapLightC6,mapLightC8,buildingLightPointCa,purpleLightPointCc,purpleLightPointCe,purpleLightPointCg,subwayLogoLightPointCi,buildingLightPointCk,buildingLightPointCm,buildingLightPointCo,buildingLightPointCq,orangeLightPointCs,orangeLightPointCu,orangeLightPointCw,blueLightPointCy,blueLightPointCa,blueLightPointCc,blueLightPointCE,blueLightPointCG,reflection1LightPointCI,reflection1LightPointCK,reflection1LightPointCM,reflectionPinkLightPointCO,orangeReflectionLightPointCQ,purpleReflectionLightPointCS,orangeLightPointCU,orangeLightPointCW,orangeLightPointCY,blueLightPointD0,mapLightD2,mapLightD4,mapLightD6,mapLightD8,mapLightDa,mapLightDc,mapLightDe,mapLightDg,blueLightPointDi,defaultLightPointDk,whiteLightPointDm,whiteLightPointDo,whiteLightPointDq,whiteLightPointDs,whiteLightPointDu,whiteLightPointDw,whiteLightPointDy,mapLightDA,mapLightDC,mapLightDE],sunsetLightData['lightPresets']=sandstormLightPresets;
// __UNIT__ u1635 [1965176,1965186) kind=var len=24
var lightmapPresetEb={};
// __UNIT__ u1637 [1965328,1965338) kind=var len=39
var cinematicSegmentSandstormAStart={};
// __UNIT__ u1638 [1965338,1965402) kind=expr len=122
cinematicSegmentSandstormAStart['position']=[-0x22,-0x4,5.5],cinematicSegmentSandstormAStart["JoIkrtRxhZ"]=[0xe,-0x6,5.5];
// __UNIT__ u1639 [1965402,1965412) kind=var len=37
var cinematicSegmentSandstormAEnd={};
// __UNIT__ u1640 [1965412,1965476) kind=expr len=118
cinematicSegmentSandstormAEnd['position']=[-0x14,-0x4,5.5],cinematicSegmentSandstormAEnd["JoIkrtRxhZ"]=[0xe,-0x6,5.5];
// __UNIT__ u1641 [1965476,1965486) kind=var len=34
var cinematicSegmentSandstormA={};
// __UNIT__ u1642 [1965486,1965532) kind=expr len=174
cinematicSegmentSandstormA["start"]=cinematicSegmentSandstormAStart,cinematicSegmentSandstormA['end']=cinematicSegmentSandstormAEnd,cinematicSegmentSandstormA["time"]=0x3a98;
// __UNIT__ u1643 [1965532,1965542) kind=var len=27
var sandstormMapConfigA={};
// __UNIT__ u1645 [1966060,1966070) kind=var len=23
var mapSpawnPoint07={};
// __UNIT__ u1646 [1966070,1966180) kind=expr len=175
mapSpawnPoint07['x']=-31.600000381469727,mapSpawnPoint07['y']=10.600000381469727,mapSpawnPoint07['z']=-60.20000076293945,mapSpawnPoint07['rx']=0x3e,mapSpawnPoint07['ry']=0xc1;
// __UNIT__ u1647 [1966180,1966190) kind=var len=23
var middaySkyPreset={};
// __UNIT__ u1649 [1966312,1966322) kind=var len=30
var cinematicWaypointStart={};
// __UNIT__ u1650 [1966322,1966388) kind=expr len=106
cinematicWaypointStart['position']=[-0x22,0xc,-0x3c],cinematicWaypointStart['JoIkrtRxhZ']=[0xe,0xa,-0x3c];
// __UNIT__ u1651 [1966388,1966398) kind=var len=37
var cinematicSegmentSandstormBEnd={};
// __UNIT__ u1652 [1966398,1966464) kind=expr len=120
cinematicSegmentSandstormBEnd["position"]=[-0x14,0xc,-0x3c],cinematicSegmentSandstormBEnd["JoIkrtRxhZ"]=[0xe,0xa,-0x3c];
// __UNIT__ u1653 [1966464,1966474) kind=var len=34
var cinematicSegmentSandstormB={};
// __UNIT__ u1654 [1966474,1966520) kind=expr len=165
cinematicSegmentSandstormB["start"]=cinematicWaypointStart,cinematicSegmentSandstormB['end']=cinematicSegmentSandstormBEnd,cinematicSegmentSandstormB["time"]=0x3a98;
// __UNIT__ u1655 [1966520,1966530) kind=var len=27
var sandstormMapConfigB={};
// __UNIT__ u1657 [1967034,1967044) kind=var len=26
var labSunsetSkyPreset={};
// __UNIT__ u1659 [1967150,1967160) kind=var len=28
var labDaylightSkyPreset={};
// __UNIT__ u1661 [1967264,1967274) kind=var len=23
var mapSpawnPoint08={};
// __UNIT__ u1662 [1967274,1967369) kind=expr len=160
mapSpawnPoint08['x']=48.900001525878906,mapSpawnPoint08['y']=4.599999904632568,mapSpawnPoint08['z']=-0x16,mapSpawnPoint08['rx']=0x3c,mapSpawnPoint08['ry']=0xfe;
// __UNIT__ u1663 [1967369,1967379) kind=var len=23
var mapSpawnPoint09={};
// __UNIT__ u1664 [1967379,1967472) kind=expr len=158
mapSpawnPoint09['x']=0x37,mapSpawnPoint09['y']=4.599999904632568,mapSpawnPoint09['z']=4.599999904632568,mapSpawnPoint09['rx']=0x3f,mapSpawnPoint09['ry']=0xfd;
// __UNIT__ u1665 [1967472,1967482) kind=var len=23
var mapSpawnPoint10={};
// __UNIT__ u1666 [1967482,1967574) kind=expr len=157
mapSpawnPoint10['x']=67.30000305175781,mapSpawnPoint10['y']=2.5,mapSpawnPoint10['z']=3.700000047683716,mapSpawnPoint10['rx']=0x3f,mapSpawnPoint10['ry']=0xc0;
// __UNIT__ u1667 [1967574,1967584) kind=var len=23
var mapSpawnPoint11={};
// __UNIT__ u1668 [1967584,1967678) kind=expr len=159
mapSpawnPoint11['x']=60.900001525878906,mapSpawnPoint11['y']=2.5,mapSpawnPoint11['z']=13.899999618530273,mapSpawnPoint11['rx']=0x3b,mapSpawnPoint11['ry']=0x7a;
// __UNIT__ u1669 [1967678,1967688) kind=var len=23
var mapSpawnPoint12={};
// __UNIT__ u1670 [1967688,1967784) kind=expr len=161
mapSpawnPoint12['x']=-10.5,mapSpawnPoint12['y']=4.599999904632568,mapSpawnPoint12['z']=0.10000000149011612,mapSpawnPoint12['rx']=0x3f,mapSpawnPoint12['ry']=0x90;
// __UNIT__ u1671 [1967784,1967794) kind=var len=23
var mapSpawnPoint13={};
// __UNIT__ u1672 [1967794,1967890) kind=expr len=161
mapSpawnPoint13['x']=-15.600000381469727,mapSpawnPoint13['y']=0x2,mapSpawnPoint13['z']=-1.7999999523162842,mapSpawnPoint13['rx']=0x3f,mapSpawnPoint13['ry']=0xf9;
// __UNIT__ u1673 [1967890,1967900) kind=var len=23
var mapSpawnPoint14={};
// __UNIT__ u1674 [1967900,1968010) kind=expr len=175
mapSpawnPoint14['x']=3.299999952316284,mapSpawnPoint14['y']=-0.4000000059604645,mapSpawnPoint14['z']=-16.600000381469727,mapSpawnPoint14['rx']=0x3f,mapSpawnPoint14['ry']=0x3f;
// __UNIT__ u1675 [1968010,1968020) kind=var len=23
var mapSpawnPoint15={};
// __UNIT__ u1676 [1968020,1968116) kind=expr len=161
mapSpawnPoint15['x']=-22.399999618530273,mapSpawnPoint15['y']=0.800000011920929,mapSpawnPoint15['z']=-0x28,mapSpawnPoint15['rx']=0x3d,mapSpawnPoint15['ry']=0x8b;
// __UNIT__ u1677 [1968116,1968126) kind=var len=23
var mapSpawnPoint16={};
// __UNIT__ u1678 [1968126,1968235) kind=expr len=174
mapSpawnPoint16['x']=17.299999237060547,mapSpawnPoint16['y']=4.400000095367432,mapSpawnPoint16['z']=-30.299999237060547,mapSpawnPoint16['rx']=0x3c,mapSpawnPoint16['ry']=0x2e;
// __UNIT__ u1679 [1968235,1968245) kind=var len=23
var mapSpawnPoint17={};
// __UNIT__ u1680 [1968245,1968352) kind=expr len=172
mapSpawnPoint17['x']=53.599998474121094,mapSpawnPoint17['y']=7.199999809265137,mapSpawnPoint17['z']=7.699999809265137,mapSpawnPoint17['rx']=0x3f,mapSpawnPoint17['ry']=0x6d;
// __UNIT__ u1681 [1968352,1968362) kind=var len=20
var forestPointA={};
// __UNIT__ u1682 [1968362,1968442) kind=expr len=110
forestPointA['x']=52.32250778047478,forestPointA['y']=3.136899948120117,forestPointA['z']=-14.894120319555839;
// __UNIT__ u1683 [1968442,1968452) kind=var len=20
var forestPointB={};
// __UNIT__ u1684 [1968452,1968532) kind=expr len=110
forestPointB['x']=1.255060929444502,forestPointB['y']=3.334099769592285,forestPointB['z']=-13.073578303904029;
// __UNIT__ u1685 [1968532,1968542) kind=var len=21
var mapNavPointEA={};
// __UNIT__ u1686 [1968542,1968623) kind=expr len=114
mapNavPointEA['x']=-6.294223514073776,mapNavPointEA['y']=3.0340886637368776,mapNavPointEA['z']=10.997057424966606;
// __UNIT__ u1687 [1968623,1968633) kind=var len=21
var mapNavPointEB={};
// __UNIT__ u1688 [1968633,1968711) kind=expr len=111
mapNavPointEB['x']=59.61523158773343,mapNavPointEB['y']=0.989799976348877,mapNavPointEB['z']=18.04071814447252;
// __UNIT__ u1689 [1968711,1968721) kind=var len=21
var mapNavPointEC={};
// __UNIT__ u1690 [1968721,1968802) kind=expr len=114
mapNavPointEC['x']=40.24166488647461,mapNavPointEC['y']=2.5750612571336067,mapNavPointEC['z']=-28.542022705078125;
// __UNIT__ u1691 [1968802,1968812) kind=var len=27
var waterSmokeEmitterEd={};
// __UNIT__ u1693 [1968973,1968983) kind=var len=32
var labWaterfallAudioEmitter={};
// __UNIT__ u1694 [1968983,1969084) kind=expr len=189
labWaterfallAudioEmitter["directional"]=!![],labWaterfallAudioEmitter['position']=[-0x28,-0xa,-0x26],labWaterfallAudioEmitter['volume']=1.2,labWaterfallAudioEmitter['file']='waterfall.mp3';
// __UNIT__ u1695 [1969084,1969094) kind=var len=29
var labForestAudioEmitter={};
// __UNIT__ u1696 [1969094,1969190) kind=expr len=172
labForestAudioEmitter['directional']=!![],labForestAudioEmitter['position']=[0x21,0x19,-3.5],labForestAudioEmitter['volume']=1.7,labForestAudioEmitter['file']='forest.mp3';
// __UNIT__ u1697 [1969190,1969200) kind=var len=24
var cameraWaypointEg={};
// __UNIT__ u1698 [1969200,1969262) kind=expr len=90
cameraWaypointEg["position"]=[44.5,5.5,3.5],cameraWaypointEg["JoIkrtRxhZ"]=[-3.5,0x5,4.8];
// __UNIT__ u1699 [1969262,1969272) kind=var len=24
var cameraWaypointEh={};
// __UNIT__ u1700 [1969272,1969334) kind=expr len=90
cameraWaypointEh["position"]=[0x1c,0x5,0x3],cameraWaypointEh["JoIkrtRxhZ"]=[-3.5,0x5,4.8];
// __UNIT__ u1701 [1969334,1969344) kind=var len=26
var cinematicSegmentEI={};
// __UNIT__ u1702 [1969344,1969390) kind=expr len=122
cinematicSegmentEI["start"]=cameraWaypointEg,cinematicSegmentEI["end"]=cameraWaypointEh,cinematicSegmentEI['time']=0x3a98;
// __UNIT__ u1703 [1969390,1969400) kind=var len=24
var cameraWaypointEj={};
// __UNIT__ u1704 [1969400,1969467) kind=expr len=95
cameraWaypointEj['position']=[-0xc,0.4,-0x13],cameraWaypointEj["JoIkrtRxhZ"]=[-0x28,0x5,-0x26];
// __UNIT__ u1705 [1969467,1969477) kind=var len=29
var cinematicSegmentELEnd={};
// __UNIT__ u1706 [1969477,1969545) kind=expr len=106
cinematicSegmentELEnd['position']=[-0x16,0.5,-0x15],cinematicSegmentELEnd['JoIkrtRxhZ']=[-0x28,0x5,-0x26];
// __UNIT__ u1707 [1969545,1969555) kind=var len=26
var cinematicSegmentEL={};
// __UNIT__ u1708 [1969555,1969601) kind=expr len=127
cinematicSegmentEL["start"]=cameraWaypointEj,cinematicSegmentEL['end']=cinematicSegmentELEnd,cinematicSegmentEL["time"]=0x2ee0;
// __UNIT__ u1710 [2058006,2058167) kind=expr len=257
perfCounterMap['shootingA']=0x0,perfCounterMap['shootingB']=0x0,perfCounterMap["shootingC"]=0x0,perfCounterMap['simulate']=0x0,perfCounterMap['simulateA']=0x0,perfCounterMap["simulateB"]=0x0,perfCounterMap["simulateC"]=0x0,perfCounterMap['updateLobby']=0x0;
// __UNIT__ u1717 [2059143,2059282) kind=var len=349
var respawnDelayMs=0x9c4,moveDirectionSin=0x0,moveDirectionCos=0x0,renderHeightPx=0x5a0,diagonalMoveFactor=Math['sqrt'](0x2)/0x2,prevGamePlaying=!![],gamePlaying=!![],showDebugMarker=![],prerendersDisabled=![],occlusionDebugFlag=![],isMobilePhone=![],isTouchDevice=![],isIPad=![],cameraNearPlane=0.1,crazyGamesGame,crazyGamesBanner,isCrazyGames=![];
// __UNIT__ u1719 [2059618,2060137) kind=var len=558
var ignoreNextTouch=![],forceAimTouch=![],pelletSpreadTable=[0.07500949505484174,0.2742310167635935,0.5095642211425883,0.0755562782639434,0.880903751068238,0.22882640372441448,0.850836187997291,0.015487909324228721,0.0445111058859672,0.8941071186652906,0.6507282260110268,0.420593261914604,0.25092124950649275,0.995929718481344,0.7809543613255743,0.9707107548465537,0.9598217014967565,0.5902976992494882,0.9069080357006323,0.7426300052286265,0.7826137546368939,0.7863502506103135,0.0539798736823629,0.5039291682205764,0.27263009560882584,0.6100577118853376];
// __UNIT__ u1720 [2060137,2060641) kind=if len=667
if(!isHeadless){var isMac=navigator['platform']['toUpperCase']()["indexOf"]('MAC')!=-0x1,isIPhone=navigator['platform']['toUpperCase']()['indexOf']('IPHONE')!=-0x1,isFirefox=navigator["userAgent"]['indexOf']("Firefox")!=-0x1,isChrome=navigator["userAgent"]['indexOf']('Chrome')!=-0x1,isSafari=!isChrome&&navigator['userAgent']["indexOf"]('Safari')!=-0x1,fullscreenEnabled=window['location']==window['par'+'ent']['location']&&!isMac&&!isFirefox&&isChrome;if(location["protocol"]!=="https:"){}var checkShaderErrorsEnabled=![],powerPreference='default';isIPhone&&(powerPreference='low-power');powerPreference="high-performance";var unadjustedMovement=![],toggleAds=![];}
// __UNIT__ u1721 [2060641,2060659) kind=var len=52
var pointerUnlockExpected=![],leftHandedEnabled=![];
// __UNIT__ u1723 [2060907,2060990) kind=var len=111
var typeNameList=['Uint8','Int8','Uint16','Int16','Float32','Uint32','Float64'],frameDeltaSamples=[],nowMs=0x0;
// __UNIT__ u1724 [2060990,2061022) kind=function len=39
function litegl(){nowMs=Date['now']();}
// __UNIT__ u1725 [2061022,2061173) kind=function len=258
function sampleFrameDelta(){var apV=stringDecoderAlias;frameDeltaSamples['push'](Date["now"]()-nowMs);if(frameDeltaSamples['length']>0x64){var a3i=0x0;for(var a3j=0x0;a3j<frameDeltaSamples['length'];a3j++){a3i+=frameDeltaSamples[a3j];}frameDeltaSamples=[];}}
// __UNIT__ u1726 [2061173,2061183) kind=var len=24
var debugPositionLog=[];
// __UNIT__ u1727 [2061183,2061198) kind=function len=29
function logDebugPosition(){}
// __UNIT__ u1728 [2061198,2061263) kind=function len=107
function dumpPositionLog(){var apW=stringDecoderAlias;console['log'](JSON["stringify"](debugPositionLog));}
// __UNIT__ u1729 [2061263,2061453) kind=function len=239
function seededRandom(initialSeed){var apX=stringDecoderAlias;this['m']=0x80000000,this['mi']=0x1/(this['m']-0x1),this['a']=0x41c64e6d,this['c']=0x3039,this["state"]=initialSeed?initialSeed:Math["floor"](Math['random']()*(this['m']-0x1));}
// __UNIT__ u1730 [2061453,2061804) kind=expr len=401
seededRandom['prototype']["nextInt"]=function(){var apY=stringDecoderAlias;return this['state']=(this['a']*this["state"]+this['c'])%this['m'],this['state'];},seededRandom['prototype']['nextFloat']=function(){var apZ=stringDecoderAlias;return this["nextInt"]()*this['mi'];},Math["KkKRLGFtA"]=Math['KkKRLGFtA']||function(a3i){return function(a3j){return a3i[0x0]=a3j,a3i[0x0];};}(new Float32Array(0x1));
// __UNIT__ u1732 [2063092,2063256) kind=function len=251
function resetObjectTransform(targetObject){var aq7=stringDecoderAlias;targetObject['rotation']['x']=targetObject['rotation']['y']=targetObject['rotation']['z']=0x0,targetObject['position']['CNFryyAhIm'](0x0),targetObject["scale"]['CNFryyAhIm'](0x1);}
// __UNIT__ u1733 [2063256,2063317) kind=function len=102
function horizontalLengthSq(position){return position['x']*position['x']+position['z']*position['z'];}
// __UNIT__ u1743 [2067982,2068192) kind=function len=215
function collectSceneGeometries(scene){var geos=[];for(var i=0;i<scene.children.length;i++){var child=scene.children[i];if(child!==undefined&&child.RNQDluasaN!==undefined){geos.push(child.RNQDluasaN);}}return geos;}
// __UNIT__ u1746 [2069284,2069311) kind=var len=27
var faceBufferLength=3*6+5;
// __UNIT__ u1748 [2070451,2070468) kind=var len=29
var faceVertexKeys=['b','c'];
// __UNIT__ u1752 [2070593,2070615) kind=var len=23
var faceNormalOffset=0;
// __UNIT__ u1753 [2070615,2070632) kind=var len=24
var faceVertexAOffset=3;
// __UNIT__ u1754 [2070632,2070649) kind=var len=24
var faceVertexBOffset=6;
// __UNIT__ u1755 [2070649,2070666) kind=var len=24
var faceVertexCOffset=9;
// __UNIT__ u1756 [2070666,2070689) kind=var len=28
var faceHitboxFlagOffset=12;
// __UNIT__ u1757 [2070689,2070711) kind=var len=27
var faceAddedFlagOffset=13;
// __UNIT__ u1758 [2070711,2070737) kind=var len=31
var faceCollisionFlagOffset=14;
// __UNIT__ u1759 [2070737,2070757) kind=var len=25
var faceAabbMaxOffset=15;
// __UNIT__ u1760 [2070757,2070777) kind=var len=25
var faceAabbMinOffset=18;
// __UNIT__ u1761 [2070777,2070798) kind=var len=22
var faceDvalOffset=21;
// __UNIT__ u1762 [2070798,2070820) kind=var len=23
var faceSoundOffset=22;
// __UNIT__ u1763 [2070820,2072204) kind=function len=1557
function buildFaceAabb(face,verts,faceBuffer,index){'use strict';face.aa=verts[face.a];face.ab=verts[face.b];face.ac=verts[face.c];face.aabb.min.copy(verts[face.a]);face.aabb.max.copy(verts[face.a]);index*=faceBufferLength;faceBuffer[index+faceHitboxFlagOffset]=face.hitbox?1:0;triEdgeVectorB.bLuhQxfFGDS(face.ab,face.aa);triangleEdgeVectorC.bLuhQxfFGDS(face.ac,face.aa);faceNormalScratch.UZFffGBjyhk(triEdgeVectorB,triangleEdgeVectorC);faceNormalScratch.normalize();faceNormalScratch.toArray(faceBuffer,index+faceNormalOffset);var n=faceNormalScratch;face.dVal=-(n.x*face.aa.x+n.y*face.aa.y+n.z*face.aa.z);faceBuffer[index+faceDvalOffset]=face.dVal;face.aa.toArray(faceBuffer,index+faceVertexAOffset);face.ab.toArray(faceBuffer,index+faceVertexBOffset);face.ac.toArray(faceBuffer,index+faceVertexCOffset);faceBuffer[index+faceAddedFlagOffset]=0;if(face.collision==undefined){faceBuffer[index+faceCollisionFlagOffset]=1;}else{faceBuffer[index+faceCollisionFlagOffset]=face.collision;}faceBuffer[index+faceSoundOffset]=face.UVCeyZNLZ||0;for(var a=0;a<faceVertexKeys.length;a++){var x=faceVertexKeys[a];for(var b=0;b<axisNames.length;b++){var y=axisNames[b];if(verts[face[x]][y]<face.aabb.min[y]){face.aabb.min[y]=verts[face[x]][y];}if(verts[face[x]][y]>face.aabb.max[y]){face.aabb.max[y]=verts[face[x]][y];}}}face.aabb.max.toArray(faceBuffer,index+faceAabbMaxOffset);face.aabb.min.toArray(faceBuffer,index+faceAabbMinOffset);var useAABBthreshold=0.1;axisNames.forEach(function(a){if(face.aabb.max[a]-face.aabb.min[a]<useAABBthreshold){face.useAABB=true;}});}
// __UNIT__ u1767 [2072381,2072391) kind=var len=22
var smgBloomTuning={};
// __UNIT__ u1769 [2072516,2072536) kind=var len=84
var bloomTuningAlias=smgBloomTuning,bloomTuningKeys=getObjectKeys(bloomTuningAlias);
// __UNIT__ u1770 [2072536,2072621) kind=for len=175
for(var loopIndex=0x0;loopIndex<bloomTuningKeys["length"];loopIndex++){var H6=bloomTuningKeys[loopIndex];bloomTuningAlias[oldKey]=Math["KkKRLGFtA"](bloomTuningAlias[oldKey]);}
// __UNIT__ u1771 [2072621,2072631) kind=var len=18
var smgUiStats={};
// __UNIT__ u1772 [2072631,2072651) kind=expr len=28
smgUiStats["Range"]='Close';
// __UNIT__ u1773 [2072651,2072661) kind=var len=25
var smgKillfeedConfig={};
// __UNIT__ u1774 [2072661,2072693) kind=expr len=62
smgKillfeedConfig['size']=1.1,smgKillfeedConfig['offset']=0x8;
// __UNIT__ u1775 [2072693,2072703) kind=var len=25
var smgWeaponUiConfig={};
// __UNIT__ u1777 [2072790,2072800) kind=var len=23
var smgSpreadTuning={};
// __UNIT__ u1779 [2072971,2072981) kind=var len=23
var smgWeaponConfig={};
// __UNIT__ u1781 [2073455,2073465) kind=var len=17
var arUiStats={};
// __UNIT__ u1782 [2073465,2073486) kind=expr len=28
arUiStats["Range"]="Medium";
// __UNIT__ u1783 [2073486,2073496) kind=var len=24
var arKillfeedConfig={};
// __UNIT__ u1784 [2073496,2073529) kind=expr len=61
arKillfeedConfig['size']=1.05,arKillfeedConfig["offset"]=0x3;
// __UNIT__ u1785 [2073529,2073539) kind=var len=24
var arWeaponUiConfig={};
// __UNIT__ u1787 [2073619,2073629) kind=var len=22
var arSpreadTuning={};
// __UNIT__ u1789 [2073801,2073811) kind=var len=22
var arWeaponConfig={};
// __UNIT__ u1791 [2074284,2074294) kind=var len=18
var awpUiStats={};
// __UNIT__ u1792 [2074294,2074313) kind=expr len=27
awpUiStats["Range"]='Long';
// __UNIT__ u1793 [2074313,2074323) kind=var len=25
var awpKillfeedLayout={};
// __UNIT__ u1794 [2074323,2074356) kind=expr len=63
awpKillfeedLayout['size']=0.9,awpKillfeedLayout['offset']=-0x6;
// __UNIT__ u1795 [2074356,2074366) kind=var len=25
var awpWeaponUiConfig={};
// __UNIT__ u1797 [2074448,2074458) kind=var len=23
var awpSpreadTuning={};
// __UNIT__ u1799 [2074624,2074634) kind=var len=23
var awpWeaponConfig={};
// __UNIT__ u1801 [2075030,2075040) kind=var len=22
var shotgunUiStats={};
// __UNIT__ u1802 [2075040,2075060) kind=expr len=32
shotgunUiStats["Range"]='Close';
// __UNIT__ u1803 [2075060,2075070) kind=var len=29
var shotgunKillfeedLayout={};
// __UNIT__ u1804 [2075070,2075102) kind=expr len=70
shotgunKillfeedLayout['size']=0x1,shotgunKillfeedLayout['offset']=0x3;
// __UNIT__ u1805 [2075102,2075112) kind=var len=29
var shotgunWeaponUiConfig={};
// __UNIT__ u1807 [2075186,2075196) kind=var len=27
var shotgunSpreadTuning={};
// __UNIT__ u1809 [2075367,2075377) kind=var len=27
var shotgunWeaponConfig={};
// __UNIT__ u1811 [2075849,2075859) kind=var len=24
var weaponStatsByKey={};
// __UNIT__ u1812 [2075859,2075914) kind=expr len=166
weaponStatsByKey['smg']=smgWeaponConfig,weaponStatsByKey['ar']=arWeaponConfig,weaponStatsByKey["awp"]=awpWeaponConfig,weaponStatsByKey["shotgun"]=shotgunWeaponConfig;
// __UNIT__ u1820 [2077178,2077218) kind=var len=119
var activeTweenList=new createCustomList(),activeShakeList=new createCustomList(),freeTweenPool=new createCustomList();
// __UNIT__ u1821 [2077218,2077268) kind=function len=95
function recycleTween(pooledEntry){pooledEntry['obj']=null,freeTweenPool['push'](pooledEntry);}
// __UNIT__ u1825 [2077963,2078068) kind=function len=197
function cancelAllTweens(){for(var queueIdx=0x0;queueIdx<activeTweenList['length'];queueIdx++){recycleTween(activeTweenList['array'][queueIdx]),activeTweenList['splice'](queueIdx,0x1),queueIdx--;}}
// __UNIT__ u1831 [2079002,2079188) kind=function len=223
function recoilDecayCurveOverride(a3i){var aqj=stringDecoderAlias;a3i*=Math['KkKRLGFtA'](2.46),a3i-=Math["KkKRLGFtA"](1.633);var a3j=Math["KkKRLGFtA"]((a3i*a3i*a3i-0x2*a3i+0x2-Math['KkKRLGFtA'](0.228)*0x4)/0x2);return a3j;}
// __UNIT__ u1832 [2079188,2079324) kind=function len=221
function recoilDecayCurve(easingInput){var aqk=stringDecoderAlias;easingInput*=0x3,easingInput-=0x2;var a3j=(easingInput*easingInput*easingInput-0x3*easingInput+0x2)*Math["KkKRLGFtA"](0.25);return Math["KkKRLGFtA"](a3j);}
// __UNIT__ u1833 [2079324,2079330) kind=expr len=42
recoilDecayCurve=recoilDecayCurveOverride;
// __UNIT__ u1835 [2079691,2079930) kind=function len=265
function makeAnimState(){var aqm=stringDecoderAlias,a3i={};return a3i["left"]=![],a3i["right"]=![],a3i['up']=![],a3i['down']=![],a3i["OUsPgMLOT"]=![],a3i["vQ5Ra371n0"]=![],a3i["PxxmChYjxoE"]=![],a3i["stepped"]=![],a3i["W91ldgW19d"]=![],a3i['name']='animstate',a3i;}
// __UNIT__ u1836 [2079930,2080083) kind=var len=170
var playerStateFlagKeys=['LgTIfDCCqp',"vQ5Ra371n0","iTjsaDmze",'vjZBZwpDuuw','wrKTJhhJp',"W91ldgW19d","krtmjJROjX",'hhUYpsfkFuA','GBKteThUrkj','wSWCRFIDs',"qrIIvwuqycB"];
// __UNIT__ u1842 [2080721,2080802) kind=function len=116
function solveGameAuthChallenge(a3i){var aqp=stringDecoderAlias;return Math["floor"]((a3i*0x2+0x178c4e)%0x1c9c380);}
// __UNIT__ u1843 [2080802,2080883) kind=function len=118
function solveMatchmakerChallenge(a3i){var aqq=stringDecoderAlias;return Math["floor"]((a3i*0x3+0x11e1d1)%0x1c9c380);}
// __UNIT__ u1844 [2080883,2080981) kind=var len=210
var typeByteSizes=[0x1,0x1,0x2,0x2,0x4,0x4,0x8],uint8TypeCode=0x0,INT_ONE=0x1,INT_TWO=0x2,int16TypeCode=0x3,float32TypeCode=0x4,TYPE_UINT32=0x5,float64TypeCode=0x6,dataViewGetterNames=[],dataViewSetterNames=[];
// __UNIT__ u1845 [2080981,2081069) kind=for len=187
for(var loopIndex=0x0;loopIndex<typeNameList['length'];loopIndex++){dataViewGetterNames['push']('get'+typeNameList[loopIndex]),dataViewSetterNames['push']('set'+typeNameList[loopIndex]);}
// __UNIT__ u1846 [2081069,2081079) kind=var len=25
var messageTemplateIc={};
// __UNIT__ u1847 [2081079,2081135) kind=expr len=154
messageTemplateIc['val']=INT_TWO,messageTemplateIc['x']=uint8TypeCode,messageTemplateIc['y']=uint8TypeCode,messageTemplateIc["rBEdfQOuYkz"]=uint8TypeCode;
// __UNIT__ u1848 [2081135,2081145) kind=var len=25
var messageTemplateId={};
// __UNIT__ u1850 [2081344,2081354) kind=var len=26
var selfAssignTemplate={};
// __UNIT__ u1851 [2081354,2081373) kind=expr len=46
selfAssignTemplate['tdkZouYda']=uint8TypeCode;
// __UNIT__ u1852 [2081373,2081383) kind=var len=26
var tickRateUpTemplate={};
// __UNIT__ u1853 [2081383,2081404) kind=expr len=48
tickRateUpTemplate['cKRwdjkqGai']=uint8TypeCode;
// __UNIT__ u1854 [2081404,2081414) kind=var len=28
var tickRateDownTemplate={};
// __UNIT__ u1855 [2081414,2081435) kind=expr len=50
tickRateDownTemplate['cKRwdjkqGai']=uint8TypeCode;
// __UNIT__ u1856 [2081435,2081445) kind=var len=29
var tickRateResetTemplate={};
// __UNIT__ u1857 [2081445,2081466) kind=expr len=51
tickRateResetTemplate["cKRwdjkqGai"]=uint8TypeCode;
// __UNIT__ u1858 [2081466,2081476) kind=var len=25
var messageTemplateIi={};
// __UNIT__ u1859 [2081476,2081495) kind=expr len=45
messageTemplateIi['tdkZouYda']=uint8TypeCode;
// __UNIT__ u1860 [2081495,2081505) kind=var len=25
var messageTemplateIj={};
// __UNIT__ u1862 [2081646,2081656) kind=var len=25
var messageTemplateIk={};
// __UNIT__ u1864 [2081794,2081804) kind=var len=25
var messageTemplateIl={};
// __UNIT__ u1866 [2081861,2081871) kind=var len=24
var seedSyncTemplate={};
// __UNIT__ u1867 [2081871,2081890) kind=expr len=42
seedSyncTemplate["nwQWcPQjr"]=TYPE_UINT32;
// __UNIT__ u1868 [2081890,2081900) kind=var len=22
var fieldTypeMapIn={};
// __UNIT__ u1870 [2082000,2082010) kind=var len=27
var snapshotAckTemplate={};
// __UNIT__ u1871 [2082010,2082030) kind=expr len=48
snapshotAckTemplate["identifier"]=uint8TypeCode;
// __UNIT__ u1872 [2082030,2082040) kind=var len=25
var cameraAimTemplate={};
// __UNIT__ u1873 [2082040,2082062) kind=expr len=74
cameraAimTemplate['x']=uint8TypeCode,cameraAimTemplate['y']=uint8TypeCode;
// __UNIT__ u1874 [2082062,2082072) kind=var len=25
var messageTemplateIq={};
// __UNIT__ u1876 [2082462,2082472) kind=var len=26
var matchTimerTemplate={};
// __UNIT__ u1877 [2082472,2082486) kind=expr len=35
matchTimerTemplate['time']=INT_TWO;
// __UNIT__ u1878 [2082486,2082496) kind=var len=21
var deathTemplate={};
// __UNIT__ u1879 [2082496,2082519) kind=expr len=67
deathTemplate['id']=uint8TypeCode,deathTemplate['h']=uint8TypeCode;
// __UNIT__ u1880 [2082519,2082529) kind=var len=27
var classSelectTemplate={};
// __UNIT__ u1881 [2082529,2082559) kind=expr len=86
classSelectTemplate['v']=uint8TypeCode,classSelectTemplate['eXABYtRfN']=uint8TypeCode;
// __UNIT__ u1882 [2082559,2082569) kind=var len=28
var playerWeaponTemplate={};
// __UNIT__ u1883 [2082569,2082595) kind=expr len=84
playerWeaponTemplate['id']=uint8TypeCode,playerWeaponTemplate['type']=uint8TypeCode;
// __UNIT__ u1884 [2082595,2082605) kind=var len=27
var killConfirmTemplate={};
// __UNIT__ u1885 [2082605,2082685) kind=expr len=186
killConfirmTemplate["tdkZouYda"]=uint8TypeCode,killConfirmTemplate['ldBboSufaY']=uint8TypeCode,killConfirmTemplate['fRcMMMfSas']=uint8TypeCode,killConfirmTemplate["jatzJSfdtNy"]=INT_TWO;
// __UNIT__ u1886 [2082685,2082695) kind=var len=25
var messageTemplateIw={};
// __UNIT__ u1887 [2082695,2082881) kind=expr len=506
messageTemplateIw['id']=uint8TypeCode,messageTemplateIw["points"]=INT_TWO,messageTemplateIw['k']=uint8TypeCode,messageTemplateIw['d']=uint8TypeCode,messageTemplateIw['h']=uint8TypeCode,messageTemplateIw['p']=INT_TWO,messageTemplateIw['c']=INT_TWO,messageTemplateIw["hsp"]=uint8TypeCode,messageTemplateIw["PhbhpxFxPP"]=uint8TypeCode,messageTemplateIw['ha']=uint8TypeCode,messageTemplateIw["JgVHFEBAE"]=uint8TypeCode,messageTemplateIw['TxJblhJNah']=uint8TypeCode,messageTemplateIw['aMWaisFtZ']=uint8TypeCode;
// __UNIT__ u1888 [2082881,2082891) kind=var len=29
var killfeedEntryTemplate={};
// __UNIT__ u1889 [2082891,2082969) kind=expr len=198
killfeedEntryTemplate['WJxrwBXgp']=uint8TypeCode,killfeedEntryTemplate['cRzBBcbLPR']=uint8TypeCode,killfeedEntryTemplate["PacKJQHkQ"]=uint8TypeCode,killfeedEntryTemplate['KiQwnWACHo']=uint8TypeCode;
// __UNIT__ u1890 [2082969,2082979) kind=var len=25
var messageTemplateIy={};
// __UNIT__ u1891 [2082979,2083020) kind=expr len=93
messageTemplateIy['rjVasvUkpY']=uint8TypeCode,messageTemplateIy["playerCount"]=uint8TypeCode;
// __UNIT__ u1892 [2083020,2083030) kind=var len=32
var leaderboardEntryTemplate={};
// __UNIT__ u1893 [2083030,2083126) kind=expr len=288
leaderboardEntryTemplate['id']=uint8TypeCode,leaderboardEntryTemplate["place"]=uint8TypeCode,leaderboardEntryTemplate["points"]=INT_TWO,leaderboardEntryTemplate["YlyjPgZsW"]=uint8TypeCode,leaderboardEntryTemplate['qKOctHozRiE']=uint8TypeCode,leaderboardEntryTemplate['hsp']=uint8TypeCode;
// __UNIT__ u1894 [2083126,2083136) kind=var len=25
var messageTemplateIa={};
// __UNIT__ u1895 [2083136,2083287) kind=expr len=334
messageTemplateIa['val']=TYPE_UINT32,messageTemplateIa['lpm']=INT_ONE,messageTemplateIa["priv"]=INT_ONE,messageTemplateIa['pmap']=INT_ONE,messageTemplateIa["ituyDAEpKW"]=INT_ONE,messageTemplateIa['PSPGZlgWAcZ']=INT_ONE,messageTemplateIa['YsgdCDVtFmu']=INT_ONE,messageTemplateIa["zqEWySNDO"]=TYPE_UINT32,messageTemplateIa['string']='';
// __UNIT__ u1896 [2083287,2083297) kind=var len=25
var messageTemplateIB={};
// __UNIT__ u1897 [2083297,2083333) kind=expr len=114
messageTemplateIB['id']=uint8TypeCode,messageTemplateIB['h']=uint8TypeCode,messageTemplateIB["arw"]=uint8TypeCode;
// __UNIT__ u1898 [2083333,2083343) kind=var len=24
var gameModeTemplate={};
// __UNIT__ u1899 [2083343,2083354) kind=expr len=36
gameModeTemplate['h']=uint8TypeCode;
// __UNIT__ u1900 [2083354,2083364) kind=var len=25
var changeMapTemplate={};
// __UNIT__ u1901 [2083364,2083387) kind=expr len=75
changeMapTemplate['h']=uint8TypeCode,changeMapTemplate['lm']=uint8TypeCode;
// __UNIT__ u1902 [2083387,2083397) kind=var len=28
var statusEffectTemplate={};
// __UNIT__ u1903 [2083397,2083420) kind=expr len=75
statusEffectTemplate['ef']=INT_ONE,statusEffectTemplate['t']=uint8TypeCode;
// __UNIT__ u1904 [2083420,2083430) kind=var len=24
var itemListTemplate={};
// __UNIT__ u1905 [2083430,2083446) kind=expr len=30
itemListTemplate['string']='';
// __UNIT__ u1906 [2083446,2083456) kind=var len=25
var messageTemplateIG={};
// __UNIT__ u1907 [2083456,2083509) kind=expr len=131
messageTemplateIG['id']=uint8TypeCode,messageTemplateIG["fXfKmXLLuf"]=uint8TypeCode,messageTemplateIG["DVhVGRcxjKL"]=uint8TypeCode;
// __UNIT__ u1908 [2083509,2083519) kind=var len=29
var authChallengeTemplate={};
// __UNIT__ u1909 [2083519,2083532) kind=expr len=41
authChallengeTemplate['val']=TYPE_UINT32;
// __UNIT__ u1910 [2083532,2083542) kind=var len=32
var killConfirmToastTemplate={};
// __UNIT__ u1911 [2083542,2083553) kind=expr len=44
killConfirmToastTemplate['t']=uint8TypeCode;
// __UNIT__ u1912 [2083553,2083563) kind=var len=20
var chatTemplate={};
// __UNIT__ u1913 [2083563,2083591) kind=expr len=53
chatTemplate['id']=INT_ONE,chatTemplate['string']='';
// __UNIT__ u1914 [2083591,2083601) kind=var len=26
var teamScoresTemplate={};
// __UNIT__ u1915 [2083601,2083623) kind=expr len=64
teamScoresTemplate['a']=INT_TWO,teamScoresTemplate['b']=INT_TWO;
// __UNIT__ u1916 [2083623,2083633) kind=var len=25
var messageTemplateIL={};
// __UNIT__ u1917 [2083633,2083675) kind=expr len=111
messageTemplateIL['id']=uint8TypeCode,messageTemplateIL['rank']=float32TypeCode,messageTemplateIL['string']='';
// __UNIT__ u1918 [2083675,2083685) kind=var len=29
var playerLoadoutTemplate={};
// __UNIT__ u1919 [2083685,2083713) kind=expr len=77
playerLoadoutTemplate['id']=uint8TypeCode,playerLoadoutTemplate["string"]='';
// __UNIT__ u1920 [2083713,2083723) kind=var len=25
var messageTemplateIn={};
// __UNIT__ u1921 [2083723,2083803) kind=expr len=166
messageTemplateIn['xJXXoGTVwzq']=INT_ONE,messageTemplateIn['CwlkAKnpe']=INT_ONE,messageTemplateIn['JPLyTVkUrDj']=INT_ONE,messageTemplateIn['ciJOoINuc']=uint8TypeCode;
// __UNIT__ u1922 [2083803,2083813) kind=var len=25
var messageTemplateIo={};
// __UNIT__ u1924 [2083893,2083903) kind=var len=30
var objectiveTimerTemplate={};
// __UNIT__ u1925 [2083903,2083914) kind=expr len=42
objectiveTimerTemplate['t']=uint8TypeCode;
// __UNIT__ u1926 [2083914,2083924) kind=var len=25
var partyJoinTemplate={};
// __UNIT__ u1927 [2083924,2083951) kind=expr len=68
partyJoinTemplate['t']=uint8TypeCode,partyJoinTemplate['string']='';
// __UNIT__ u1928 [2083951,2083961) kind=var len=28
var serverMarkerTemplate={};
// __UNIT__ u1929 [2083961,2083977) kind=expr len=34
serverMarkerTemplate["string"]='';
// __UNIT__ u1930 [2083977,2083987) kind=var len=31
var dominationPointTemplate={};
// __UNIT__ u1931 [2083987,2083999) kind=expr len=38
dominationPointTemplate['pt']=INT_ONE;
// __UNIT__ u1932 [2083999,2084009) kind=var len=25
var mobileYawTemplate={};
// __UNIT__ u1933 [2084009,2084020) kind=expr len=37
mobileYawTemplate['y']=uint8TypeCode;
// __UNIT__ u1934 [2084020,2084030) kind=var len=25
var messageTemplateIU={};
// __UNIT__ u1935 [2084030,2084063) kind=expr len=117
messageTemplateIU['x']=float32TypeCode,messageTemplateIU['y']=float32TypeCode,messageTemplateIU['z']=float32TypeCode;
// __UNIT__ u1936 [2084063,2084073) kind=var len=34
var impactMarkerToggleTemplate={};
// __UNIT__ u1937 [2084073,2084084) kind=expr len=46
impactMarkerToggleTemplate['a']=uint8TypeCode;
// __UNIT__ u1938 [2084084,2084094) kind=var len=25
var messageTemplateIW={};
// __UNIT__ u1940 [2084137,2084147) kind=var len=29
var ignoredStringTemplate={};
// __UNIT__ u1941 [2084147,2084163) kind=expr len=35
ignoredStringTemplate["string"]='';
// __UNIT__ u1942 [2084163,2084173) kind=var len=25
var messageTemplateIY={};
// __UNIT__ u1943 [2084173,2084217) kind=expr len=128
messageTemplateIY['sgr']=float32TypeCode,messageTemplateIY['rank']=float32TypeCode,messageTemplateIY['ranksgr']=float32TypeCode;
// __UNIT__ u1944 [2084217,2084227) kind=var len=25
var playerStatsBucket={};
// __UNIT__ u1946 [2084359,2084369) kind=var len=33
var authTokenResponseTemplate={};
// __UNIT__ u1947 [2084369,2084385) kind=expr len=39
authTokenResponseTemplate['string']='';
// __UNIT__ u1948 [2084385,2084395) kind=var len=25
var messageTemplateJ1={};
// __UNIT__ u1949 [2084395,2084463) kind=expr len=212
messageTemplateJ1['m0']=TYPE_UINT32,messageTemplateJ1['m1']=TYPE_UINT32,messageTemplateJ1['a']=TYPE_UINT32,messageTemplateJ1['b']=TYPE_UINT32,messageTemplateJ1['c']=TYPE_UINT32,messageTemplateJ1['d']=TYPE_UINT32;
// __UNIT__ u1953 [2085732,2085790) kind=expr len=90
templateKeyAliases["YlyjPgZsW"]='kil'+'ls',templateKeyAliases['headshots']='hea'+"dshots";
// __UNIT__ u1954 [2085790,2085858) kind=var len=160
var templateKeyAliasMap=templateKeyAliases,templateKeyList=Object['keys'](templatesLive["yEE39Vc650"]),templateAliasKeyList=Object['keys'](templateKeyAliasMap);
// __UNIT__ u1955 [2085858,2086135) kind=for len=572
for(var loopIndex=0x0;loopIndex<templateKeyList['length'];loopIndex++){if(templateKeyAliasMap[templateKeyList[loopIndex]]==undefined){var stashedEntry=templatesLive['yEE39Vc650'][templateKeyList[loopIndex]];delete templatesLive['yEE39Vc650'][templateKeyList[loopIndex]],templatesLive['yEE39Vc650'][templateKeyList[loopIndex]]=stashedEntry;continue;}var oldKey=templateKeyList[loopIndex];if(oldKey==templateKeyAliasMap[oldKey])continue;templatesLive['yEE39Vc650'][templateKeyAliasMap[oldKey]]=templatesLive['yEE39Vc650'][oldKey],delete templatesLive['yEE39Vc650'][oldKey];}
// __UNIT__ u1963 [2088181,2088211) kind=var len=48
var axisNames=['x','y','z'],baseMoveSpeed=0.083;
// __UNIT__ u1964 [2088211,2088239) kind=expr len=39
baseMoveSpeed=Math["KkKRLGFtA"](0.074);
// __UNIT__ u1965 [2088239,2088472) kind=var len=499
var maxGroundSpeed=Math["KkKRLGFtA"](Math['sqrt'](baseMoveSpeed)),maxGroundSpeedSq=baseMoveSpeed,airborneSpeedCapSq=Math['KkKRLGFtA'](baseMoveSpeed-0.005+0.6),airborneSpeedCap=Math["KkKRLGFtA"](Math['sqrt'](airborneSpeedCapSq)),airborneSpeedLimitSq=airborneSpeedCapSq,reducedAirborneCapSq=Math['KkKRLGFtA'](airborneSpeedCapSq*9.9/0xa),reducedAirborneCap=Math["KkKRLGFtA"](Math['sqrt'](reducedAirborneCapSq)),reducedAirborneCapSqAlias=reducedAirborneCapSq,slideSpeedMultiplier=Math['KkKRLGFtA'](2.3);
// __UNIT__ u1966 [2088472,2088480) kind=if len=26
if(alternatePhysicsFlag){}
// __UNIT__ u1967 [2088480,2088638) kind=var len=318
var slideSpeed=Math["KkKRLGFtA"](Math["sqrt"](baseMoveSpeed*slideSpeedMultiplier)),slideSpeedSq=Math['KkKRLGFtA'](baseMoveSpeed*slideSpeedMultiplier),slideMoveSpeed=Math['KkKRLGFtA'](Math["sqrt"](baseMoveSpeed*(slideSpeedMultiplier-0.05))),slideMoveSpeedSq=Math["KkKRLGFtA"](baseMoveSpeed*(slideSpeedMultiplier-0.05));
// __UNIT__ u1968 [2088638,2088646) kind=if len=26
if(alternatePhysicsFlag){}
// __UNIT__ u1969 [2088646,2088656) kind=var len=34
var sinLookupTable,cosLookupTable;
// __UNIT__ u1971 [2126551,2126561) kind=var len=18
var gemPack400={};
// __UNIT__ u1972 [2126561,2126656) kind=expr len=135
gemPack400["sku"]='gems400',gemPack400["gems"]=0x190,gemPack400['price']=3.99,gemPack400['extra']=0x0,gemPack400["gemsPerDollar"]=0x64;
// __UNIT__ u1973 [2126656,2126666) kind=var len=18
var gemPack850={};
// __UNIT__ u1974 [2126666,2126762) kind=expr len=136
gemPack850['sku']='gems850',gemPack850['gems']=0x352,gemPack850['price']=7.99,gemPack850['extra']=0x32,gemPack850['gemsPerDollar']=0x64;
// __UNIT__ u1975 [2126762,2126772) kind=var len=19
var gemPack1600={};
// __UNIT__ u1976 [2126772,2126870) kind=expr len=143
gemPack1600['sku']='gems1600',gemPack1600["gems"]=0x640,gemPack1600['price']=14.99,gemPack1600['extra']=0x64,gemPack1600['gemsPerDollar']=0x6b;
// __UNIT__ u1977 [2126870,2126880) kind=var len=19
var gemPack2800={};
// __UNIT__ u1978 [2126880,2126979) kind=expr len=144
gemPack2800["sku"]="gems2800",gemPack2800['gems']=0xaf0,gemPack2800['price']=24.99,gemPack2800["extra"]=0x12c,gemPack2800['gemsPerDollar']=0x70;
// __UNIT__ u1979 [2126979,2126989) kind=var len=19
var gemPack6000={};
// __UNIT__ u1980 [2126989,2127089) kind=expr len=145
gemPack6000['sku']='gems6000',gemPack6000['gems']=0x1770,gemPack6000['price']=49.99,gemPack6000["extra"]=0x3e8,gemPack6000["gemsPerDollar"]=0x78;
// __UNIT__ u1981 [2127089,2127099) kind=var len=23
var neonArSkinEntry={};
// __UNIT__ u1982 [2127099,2127135) kind=expr len=62
neonArSkinEntry["name"]='neon',neonArSkinEntry["weapon"]='ar';
// __UNIT__ u1983 [2127135,2127145) kind=var len=22
var neonArShopItem={};
// __UNIT__ u1984 [2127145,2127224) kind=expr len=140
neonArShopItem["sku"]='neonar',neonArShopItem["name"]="Neon AR",neonArShopItem['price']=0x320,neonArShopItem['aJkQkTWQo']=[neonArSkinEntry];
// __UNIT__ u1985 [2127224,2127234) kind=var len=24
var neonSmgSkinEntry={};
// __UNIT__ u1986 [2127234,2127271) kind=expr len=65
neonSmgSkinEntry['name']='neon',neonSmgSkinEntry['weapon']="smg";
// __UNIT__ u1987 [2127271,2127281) kind=var len=23
var neonSmgShopItem={};
// __UNIT__ u1988 [2127281,2127365) kind=expr len=150
neonSmgShopItem['sku']='neonsmg',neonSmgShopItem["name"]='Neon\x20SMG',neonSmgShopItem["price"]=0x320,neonSmgShopItem['aJkQkTWQo']=[neonSmgSkinEntry];
// __UNIT__ u1989 [2127365,2127375) kind=var len=24
var neonAwpSkinEntry={};
// __UNIT__ u1990 [2127375,2127412) kind=expr len=65
neonAwpSkinEntry["name"]="neon",neonAwpSkinEntry['weapon']='awp';
// __UNIT__ u1991 [2127412,2127422) kind=var len=23
var neonAwpShopItem={};
// __UNIT__ u1992 [2127422,2127506) kind=expr len=150
neonAwpShopItem['sku']='neonawp',neonAwpShopItem["name"]='Neon\x20AWP',neonAwpShopItem['price']=0x320,neonAwpShopItem['aJkQkTWQo']=[neonAwpSkinEntry];
// __UNIT__ u1993 [2127506,2127516) kind=var len=28
var neonShotgunSkinEntry={};
// __UNIT__ u1994 [2127516,2127557) kind=expr len=77
neonShotgunSkinEntry['name']='neon',neonShotgunSkinEntry['weapon']='shotgun';
// __UNIT__ u1995 [2127557,2127567) kind=var len=27
var neonShotgunShopItem={};
// __UNIT__ u1997 [2127656,2127666) kind=var len=29
var neonBundleArSkinEntry={};
// __UNIT__ u1998 [2127666,2127702) kind=expr len=74
neonBundleArSkinEntry["name"]='neon',neonBundleArSkinEntry["weapon"]='ar';
// __UNIT__ u1999 [2127702,2127712) kind=var len=30
var neonBundleSmgSkinEntry={};
// __UNIT__ u2000 [2127712,2127749) kind=expr len=77
neonBundleSmgSkinEntry['name']='neon',neonBundleSmgSkinEntry['weapon']='smg';
// __UNIT__ u2001 [2127749,2127759) kind=var len=30
var neonBundleAwpSkinEntry={};
// __UNIT__ u2002 [2127759,2127796) kind=expr len=77
neonBundleAwpSkinEntry['name']='neon',neonBundleAwpSkinEntry['weapon']='awp';
// __UNIT__ u2003 [2127796,2127806) kind=var len=34
var neonBundleShotgunSkinEntry={};
// __UNIT__ u2004 [2127806,2127847) kind=expr len=89
neonBundleShotgunSkinEntry['name']='neon',neonBundleShotgunSkinEntry["weapon"]='shotgun';
// __UNIT__ u2005 [2127847,2127857) kind=var len=26
var neonBundleShopItem={};
// __UNIT__ u2007 [2127956,2127966) kind=var len=23
var shopCatalogData={};
// __UNIT__ u2008 [2127966,2128035) kind=expr len=209
shopCatalogData['gemOptions']=[gemPack400,gemPack850,gemPack1600,gemPack2800,gemPack6000],shopCatalogData['itemOptions']=[neonArShopItem,neonSmgShopItem,neonAwpShopItem,neonShotgunShopItem,neonBundleShopItem];
// __UNIT__ u2009 [2128035,2128051) kind=var len=50
var shopCatalog=shopCatalogData,tempTextureMap={};
// __UNIT__ u2010 [2128051,2128528) kind=expr len=621
tempTextureMap["tempblue"]='textures/tempblue.png',tempTextureMap['tempgray']='textures/tempgray.png',tempTextureMap['temporange']="textures/temporange.png",tempTextureMap["temppurple"]='textures/temppurple.png',tempTextureMap['wood']="textures/stylizedwood.png",tempTextureMap["redwood"]='textures/stylizedredwood.png',tempTextureMap['brick']='textures/stylizedbrick.png',tempTextureMap["redbrick"]='textures/stylizedredbrick.png',tempTextureMap['sand']="textures/sand2.jpg",tempTextureMap["grunge"]='textures/grunge.png',tempTextureMap['concrete']="textures/concrete.jpg",tempTextureMap['siding']='textures/siding.jpg';
// __UNIT__ u2011 [2128528,2128544) kind=var len=65
var tempTextureMapAlias=tempTextureMap,tempblueMaterialPreset={};
// __UNIT__ u2012 [2128544,2128609) kind=expr len=125
tempblueMaterialPreset["image"]='tempblue',tempblueMaterialPreset["repeat"]=0x46/0xf,tempblueMaterialPreset['grayscale']=![];
// __UNIT__ u2013 [2128609,2128619) kind=var len=30
var tempgrayMaterialPreset={};
// __UNIT__ u2014 [2128619,2128684) kind=expr len=125
tempgrayMaterialPreset['image']="tempgray",tempgrayMaterialPreset['repeat']=0x46/0xf,tempgrayMaterialPreset['grayscale']=![];
// __UNIT__ u2015 [2128684,2128694) kind=var len=32
var temporangeMaterialPreset={};
// __UNIT__ u2016 [2128694,2128761) kind=expr len=133
temporangeMaterialPreset['image']='temporange',temporangeMaterialPreset['repeat']=0x46/0xf,temporangeMaterialPreset["grayscale"]=![];
// __UNIT__ u2017 [2128761,2128771) kind=var len=32
var temppurpleMaterialPreset={};
// __UNIT__ u2018 [2128771,2128838) kind=expr len=133
temppurpleMaterialPreset['image']='temppurple',temppurpleMaterialPreset["repeat"]=0x46/0xf,temppurpleMaterialPreset['grayscale']=![];
// __UNIT__ u2019 [2128838,2128848) kind=var len=31
var separatorMaterialPreset={};
// __UNIT__ u2020 [2128848,2128972) kind=expr len=250
separatorMaterialPreset['image']='wood',separatorMaterialPreset["color"]="hsl(20,33%,40%)",separatorMaterialPreset['opacity']=0.5,separatorMaterialPreset['repeat']=1.5,separatorMaterialPreset['rotation']=0x0,separatorMaterialPreset["grayscale"]=!![];
// __UNIT__ u2021 [2128972,2128982) kind=var len=27
var brickMaterialPreset={};
// __UNIT__ u2022 [2128982,2129109) kind=expr len=229
brickMaterialPreset['image']='redbrick',brickMaterialPreset['color']='hsl(20,30%,60%)',brickMaterialPreset["opacity"]=0x0,brickMaterialPreset["repeat"]=2.9,brickMaterialPreset['rotation']=0x0,brickMaterialPreset["grayscale"]=![];
// __UNIT__ u2023 [2129109,2129119) kind=var len=30
var buildingMaterialPreset={};
// __UNIT__ u2024 [2129119,2129242) kind=expr len=243
buildingMaterialPreset['image']='wood',buildingMaterialPreset['color']="hsl(20,35%,54%)",buildingMaterialPreset['opacity']=0.4,buildingMaterialPreset["repeat"]=0x2,buildingMaterialPreset["rotation"]=0x0,buildingMaterialPreset['grayscale']=![];
// __UNIT__ u2025 [2129242,2129252) kind=var len=29
var redwoodMaterialPreset={};
// __UNIT__ u2026 [2129252,2129367) kind=expr len=229
redwoodMaterialPreset["image"]='redwood',redwoodMaterialPreset['color']="#F66",redwoodMaterialPreset['opacity']=0x0,redwoodMaterialPreset['repeat']=2.4,redwoodMaterialPreset["rotation"]=0x0,redwoodMaterialPreset["grayscale"]=![];
// __UNIT__ u2027 [2129367,2129377) kind=var len=26
var sandMaterialPreset={};
// __UNIT__ u2028 [2129377,2129500) kind=expr len=219
sandMaterialPreset['image']='sand',sandMaterialPreset['color']="hsl(20,35%,60%)",sandMaterialPreset['opacity']=0x0,sandMaterialPreset["repeat"]=0.5,sandMaterialPreset["rotation"]=0x1,sandMaterialPreset['grayscale']=![];
// __UNIT__ u2029 [2129500,2129510) kind=var len=31
var wallbrickMaterialPreset={};
// __UNIT__ u2030 [2129510,2129626) kind=expr len=242
wallbrickMaterialPreset['image']='brick',wallbrickMaterialPreset['color']='#C9AB9C',wallbrickMaterialPreset["opacity"]=0.2,wallbrickMaterialPreset['repeat']=2.9,wallbrickMaterialPreset['rotation']=0x0,wallbrickMaterialPreset['grayscale']=![];
// __UNIT__ u2031 [2129626,2129636) kind=var len=28
var sidingMaterialPreset={};
// __UNIT__ u2032 [2129636,2129752) kind=expr len=224
sidingMaterialPreset['image']='siding',sidingMaterialPreset['color']='#000',sidingMaterialPreset['opacity']=0.43,sidingMaterialPreset['repeat']=1.5,sidingMaterialPreset['rotation']=0x0,sidingMaterialPreset['grayscale']=!![];
// __UNIT__ u2033 [2129752,2129762) kind=var len=25
var materialPresetMap={};
// __UNIT__ u2034 [2129762,2129960) kind=expr len=579
materialPresetMap['tempblue']=tempblueMaterialPreset,materialPresetMap["tempgray"]=tempgrayMaterialPreset,materialPresetMap["temporange"]=temporangeMaterialPreset,materialPresetMap['temppurple']=temppurpleMaterialPreset,materialPresetMap["separator"]=separatorMaterialPreset,materialPresetMap['brick']=brickMaterialPreset,materialPresetMap["building"]=buildingMaterialPreset,materialPresetMap['red\x20wood']=redwoodMaterialPreset,materialPresetMap["sand"]=sandMaterialPreset,materialPresetMap['wallbrick']=wallbrickMaterialPreset,materialPresetMap["siding"]=sidingMaterialPreset;
// __UNIT__ u2035 [2129960,2129998) kind=var len=132
var materialPresetMapAlias=materialPresetMap,materialPresetKeys=Object['keys'](materialPresetMapAlias),shortbasicRoomStylePreset={};
// __UNIT__ u2036 [2129998,2130315) kind=expr len=386
shortbasicRoomStylePreset['name']="shortbasic",shortbasicRoomStylePreset['walls']=[['separator',0.2],['brick',2.5],["separator",0x0,0x0,0.07],['separator',0.3,0.07,0.07],['separator',0x0,0.07,0x0],["building",2.5],["separator",0x0,0x0,0.17],['separator',0.45,0.17,0.17],['separator',0x0,0.17,-0.2],['separator',-0.3,-0.2,-0.2]],shortbasicRoomStylePreset['DngZNuZBydL']=['building',0x0];
// __UNIT__ u2037 [2130315,2130325) kind=var len=30
var moldingRoomStylePreset={};
// __UNIT__ u2038 [2130325,2130438) kind=expr len=153
moldingRoomStylePreset['name']="molding",moldingRoomStylePreset['walls']=[['separator',0x0,0x0,0.1],["separator",0.3,0.1,0.1],["separator",0x0,0.1,0x0]];
// __UNIT__ u2039 [2130438,2130448) kind=var len=29
var orangeRoomStylePreset={};
// __UNIT__ u2040 [2130448,2130553) kind=expr len=162
orangeRoomStylePreset["name"]='mNZeiqoUotp\x20orange',orangeRoomStylePreset['walls']=[['temporange',0x3]],orangeRoomStylePreset['DngZNuZBydL']=['temporange',0x0];
// __UNIT__ u2041 [2130553,2130563) kind=var len=27
var blueRoomStylePreset={};
// __UNIT__ u2042 [2130563,2130688) kind=expr len=193
blueRoomStylePreset["name"]="mNZeiqoUotp blue",blueRoomStylePreset['walls']=[["tempblue",0x3]],blueRoomStylePreset['DngZNuZBydL']=['tempblue',0x0],blueRoomStylePreset['floor']=["tempblue",0x0];
// __UNIT__ u2043 [2130688,2130698) kind=var len=28
var floorRoomStylePreset={};
// __UNIT__ u2044 [2130698,2130767) kind=expr len=123
floorRoomStylePreset['name']='floor',floorRoomStylePreset['walls']=[],floorRoomStylePreset['DngZNuZBydL']=['tempgray',0x0];
// __UNIT__ u2045 [2130767,2130777) kind=var len=32
var brickwallRoomStylePreset={};
// __UNIT__ u2046 [2130777,2130878) kind=expr len=167
brickwallRoomStylePreset["name"]='brickwall',brickwallRoomStylePreset['walls']=[["separator",0.2],['brick',0x3]],brickwallRoomStylePreset["DngZNuZBydL"]=['brick',0x0];
// __UNIT__ u2047 [2130878,2130888) kind=var len=29
var noroofRoomStylePreset={};
// __UNIT__ u2048 [2130888,2130939) kind=expr len=89
noroofRoomStylePreset["name"]="noroof",noroofRoomStylePreset["walls"]=[['tempblue',0x3]];
// __UNIT__ u2049 [2130939,2130969) kind=var len=182
var roomStylePresets=[shortbasicRoomStylePreset,moldingRoomStylePreset,orangeRoomStylePreset,blueRoomStylePreset,floorRoomStylePreset,brickwallRoomStylePreset,noroofRoomStylePreset];
// __UNIT__ u2051 [2131625,2131635) kind=var len=24
var changelogEntries={};
// __UNIT__ u2053 [2138239,2138255) kind=var len=51
var changelogData=changelogEntries,prismAwpSkin={};
// __UNIT__ u2054 [2138255,2138308) kind=expr len=83
prismAwpSkin['name']='prism',prismAwpSkin["weapon"]='awp',prismAwpSkin['wear']=0x0;
// __UNIT__ u2055 [2138308,2138318) kind=var len=30
var partyMemberSweptThrone={};
// __UNIT__ u2057 [2138412,2138422) kind=var len=19
var alezSmgSkin={};
// __UNIT__ u2058 [2138422,2138474) kind=expr len=79
alezSmgSkin["name"]='alez',alezSmgSkin["weapon"]='smg',alezSmgSkin['wear']=0x0;
// __UNIT__ u2059 [2138474,2138484) kind=var len=23
var partyMemberAlez={};
// __UNIT__ u2061 [2138570,2138580) kind=var len=24
var defaultPartyInfo={};
// __UNIT__ u2062 [2138580,2138629) kind=expr len=91
defaultPartyInfo['map']="mlab",defaultPartyInfo["mode"]="TDM",defaultPartyInfo['time']=0x5;
// __UNIT__ u2065 [2140344,2140515) kind=function len=199
function openExternalUrl(a3i){var aqN=stringDecoderAlias;if(window['MobileApp']){window["MobileApp"]["openInChrome"](a3i);return;}var a3j=window['open'](a3i,'_blank');a3j!=undefined&&a3j["focus"]();}
// __UNIT__ u2066 [2140515,2140644) kind=var len=398
var shopPreviewLock=![],shopPreviewActive=![],playerSkillRating=0.3,rankDisplayScore=0.3,rankedSkillRating=0.3,isRankedMatch=![],lobbyButtonList=[],respawnAdSlots=[],refreshRespawnBanners,claimReward,KF=![],isEditingMobileLayout=![],activeTouchList=[],pauseSettingsScene={},welcomeScene={},onboardingScene={},leaderboardDataKl=[],selfLeaderboardIndex=0x0,localTeamId=0x0,leaderboardConsumeFlag=![];
// __UNIT__ u2069 [2140908,2140934) kind=var len=52
var victoryBlueColor=buildRgbString(0x3c,0x96,0xe6);
// __UNIT__ u2071 [2141140,2141147) kind=var len=22
var googleTokenClient;
// __UNIT__ u2079 [2143895,2144019) kind=expr len=211
readLocalStorage('sgr')!=undefined&&!isNaN(readLocalStorage("sgr"))&&(playerSkillRating=Number(readLocalStorage('sgr')),isNaN(playerSkillRating)&&window["onerror"]('Loaded\x20as\x20NaN:\x20'+playerSkillRating));
// __UNIT__ u2081 [2144401,2144411) kind=var len=21
var defaultSkinAr={};
// __UNIT__ u2082 [2144411,2144465) kind=expr len=87
defaultSkinAr['name']='default',defaultSkinAr['weapon']='ar',defaultSkinAr['wear']=0x0;
// __UNIT__ u2083 [2144465,2144510) kind=var len=71
var selectedSkin=defaultSkinAr,isHttps=location['protocol']==='https:';
// __UNIT__ u2084 [2144510,2144535) kind=expr len=25
window['uiDisabled']=![];
// __UNIT__ u2086 [2144728,2144755) kind=expr len=39
coinRewardIcon['src']="promo/coin.png";
// __UNIT__ u2087 [2144755,2144795) kind=var len=52
var coinStackImage=document["createElement"]("img");
// __UNIT__ u2088 [2144795,2144828) kind=expr len=45
coinStackImage["src"]='promo/coinstack.webp';
// __UNIT__ u2089 [2144828,2144868) kind=var len=54
var diamondIconImage=document['createElement']("img");
// __UNIT__ u2090 [2144868,2144898) kind=expr len=44
diamondIconImage['src']="promo/diamond.png";
// __UNIT__ u2091 [2144898,2144938) kind=var len=53
var googleLogoImage=document['createElement']('img');
// __UNIT__ u2092 [2144938,2144967) kind=expr len=42
googleLogoImage['src']="promo/google.png";
// __UNIT__ u2093 [2144967,2145007) kind=var len=52
var checkmarkBadge=document['createElement']("img");
// __UNIT__ u2094 [2145007,2145035) kind=expr len=40
checkmarkBadge["src"]='promo/check.png';
// __UNIT__ u2095 [2145035,2145075) kind=var len=56
var verifiedBadgeImage=document['createElement']('img');
// __UNIT__ u2096 [2145075,2145106) kind=expr len=47
verifiedBadgeImage["src"]='promo/verified.png';
// __UNIT__ u2097 [2145106,2145146) kind=var len=55
var boostedBadgeImage=document["createElement"]("img");
// __UNIT__ u2098 [2145146,2145176) kind=expr len=45
boostedBadgeImage["src"]='promo/boosted.png';
// __UNIT__ u2099 [2145176,2145224) kind=var len=75
var loginBaseUrl='https://login.de'+'adshot.io',authTokenStorageKey="dses";
// __UNIT__ u2100 [2145224,2145273) kind=expr len=64
!isHttps&&(loginBaseUrl="http://"+location["hostname"]+':8082');
// __UNIT__ u2101 [2145273,2145412) kind=expr len=166
(location['host']=="beta.de"+"adshot.io"||location['host']=='beta2.de'+'adshot.io')&&(loginBaseUrl='https://testlogin.de'+"adshot.io",authTokenStorageKey='dsesBeta');
// __UNIT__ u2106 [2146919,2147053) kind=var len=216
var tintWorkCanvas=document['createElement']('canvas'),tintWorkContext=tintWorkCanvas['getContext']('2d'),outlineWorkCanvas=document['createElement']("canvas"),tintWorkContextAlias=tintWorkCanvas["getContext"]('2d');
// __UNIT__ u2116 [2152467,2152477) kind=var len=20
var elementCache={};
// __UNIT__ u2120 [2163464,2163507) kind=var len=60
var reticleSpriteCanvas=document['createElement']('canvas');
// __UNIT__ u2121 [2163507,2163537) kind=expr len=64
reticleSpriteCanvas["width"]=reticleSpriteCanvas["height"]=0x80;
// __UNIT__ u2122 [2163537,2163567) kind=var len=61
var hudCanvasContext=reticleSpriteCanvas["getContext"]('2d');
// __UNIT__ u2123 [2163567,2163662) kind=expr len=171
hudCanvasContext["lineWidth"]=0x9,hudCanvasContext["translate"](reticleSpriteCanvas['width']/0x2,reticleSpriteCanvas["height"]/0x2),hudCanvasContext['strokeStyle']='#EEE';
// __UNIT__ u2124 [2163662,2163883) kind=for len=354
for(var loopIndex=0x0;loopIndex<0x4;loopIndex++){hudCanvasContext['beginPath'](),hudCanvasContext['moveTo'](0x0,-0x14),hudCanvasContext['lineTo'](0x0,-0x37),hudCanvasContext['stroke'](),hudCanvasContext['beginPath'](),hudCanvasContext['arc'](0x0,0x0,0x26,0.45,Math['PI']/0x2-0.45),hudCanvasContext['stroke'](),hudCanvasContext["rotate"](Math['PI']/0x2);}
// __UNIT__ u2125 [2163883,2163890) kind=var len=24
var floatingMessageList;
// __UNIT__ u2127 [2165502,2165513) kind=var len=34
var enableFloatingMessageFade=![];
// __UNIT__ u2129 [2175381,2175407) kind=var len=52
var healthCrossColor=buildHslString(0x73,0x32,0x2d);
// __UNIT__ u2139 [2197499,2197512) kind=var len=53
var menuLogoText,menuLogoContainer,menuLogoPrerender;
// __UNIT__ u2142 [2199618,2199777) kind=var len=197
var gradientCanvasTexture=createGradientTexture(0x64,0x1,0x1,0x0,[[0x0,'rgba(\x200,\x200,\x200,\x201\x20)'],[0.7,'rgba(\x200,\x200,\x200,\x200.54\x20)'],[0x1,'rgba(\x200,\x200,\x200,\x200\x20)']]);
// __UNIT__ u2149 [2201679,2201783) kind=function len=188
function showUsernameInput(){var arW=stringDecoderAlias;usernameInputOverlay['elem']["parentNode"]==undefined&&usernameInputOverlay["parent"]["appendChild"](usernameInputOverlay['elem']);}
// __UNIT__ u2150 [2201783,2201856) kind=function len=140
function clearUsernameInput(){var arX=stringDecoderAlias;usernameInputOverlay['elem']['value']='',usernameInputOverlay["elem"]['remove']();}
// __UNIT__ u2152 [2456339,2456359) kind=var len=34
var skipSplashTweens=!![],Nu=!![];
// __UNIT__ u2153 [2456359,2456367) kind=var len=8
var $=3;
// __UNIT__ u2154 [2456367,2456388) kind=if len=21
if($ in{'a':'b'}){7;}
// __UNIT__ u2155 [2456388,2456449) kind=var len=101
var reportNonce=Math["floor"](Math["random"]()*0x186a0),errorReportCount=0x0,clientReportVersion=0x1;
// __UNIT__ u2157 [2457972,2458006) kind=var len=100
var slowTimerReportCount=0x0,maxSlowTimerReports=0x14,slowTimerThresholdMs=0x78,adDeferredCount=0x0;
// __UNIT__ u2159 [2459216,2459223) kind=var len=24
var tamperReferenceTime;
// __UNIT__ u2160 [2459223,2459281) kind=if len=75
if(typeof 178601433.1668!='undefined'){tamperReferenceTime=178601433.1668;}
// __UNIT__ u2161 [2459281,2459288) kind=var len=20
var clientAuthToken;
// __UNIT__ u2164 [2459851,2459957) kind=var len=165
var bridgeMessagePayload=['','','',![]],mobileUserAgentKeywords=['Android','webOS','iPhone','iPad',"iPod",'Blackberry','Windows\x20Phone'],mobileUserAgentRegexes=[];
// __UNIT__ u2165 [2459957,2460030) kind=for len=163
for(var loopIndex=0x0;loopIndex<mobileUserAgentKeywords['length'];loopIndex++){mobileUserAgentRegexes['push'](new RegExp(mobileUserAgentKeywords[loopIndex],'i'));}
// __UNIT__ u2166 [2460030,2460049) kind=var len=41
var tamperCheckPassed=![],mathAlias=Math;
// __UNIT__ u2168 [2460271,2460280) kind=if len=14
if(!isHttps){}
// __UNIT__ u2169 [2460280,2460290) kind=expr len=36
isMobilePhone=isMobilePhone||isIPad;
// __UNIT__ u2170 [2460290,2460308) kind=expr len=49
isMobilePhone&&!isHttps&&(fullscreenEnabled=![]);
// __UNIT__ u2173 [2460626,2460647) kind=var len=34
var bootTimestampMs=Date["now"]();
// __UNIT__ u2174 [2460647,2460800) kind=expr len=168
'caches'in window&&caches['keys']()['then'](function(a3l){var axn=stringDecoderAlias;return Promise["all"](a3l['map'](function(a3m){return caches['delete'](a3m);}));});
// __UNIT__ u2178 [2461517,2461666) kind=expr len=164
window["getEventListeners"]=function(){return{};},initPhysicsEngine(),window['loginAPI']="213695879130-qhfd9k3qfdmgoeq5iha96h2bdtpnoepm.apps.googleusercontent.com";
// __UNIT__ u2179 [2461666,2461702) kind=var len=50
var movementKeyNames=['up',"down",'left','right'];
// __UNIT__ u2180 [2461702,2461714) kind=expr len=37
isMobilePhone&&(movementKeyNames=[]);
// __UNIT__ u2182 [2461981,2462006) kind=var len=57
var matrixUpdateCount=0x0,matrixUpdateFrameId=0x1,NR=![];
// __UNIT__ u2189 [2464634,2464711) kind=var len=179
var tamperTripFlag=!![],mathAbsMethodKey=decodeByteString([-0x57,-0x58,-0x69]),originalMathAbs=mathAlias[mathAbsMethodKey],tamperTolerance=0x3e8*0x3c*0xa,tamperTimeDivisor=0x2710;
// __UNIT__ u2190 [2464711,2464851) kind=expr len=273
mathAlias[mathAbsMethodKey]=function(a3l){if(typeof 178601433.1668!='undefined'&&a3l==178601433.1668-bootTimestampMs/tamperTimeDivisor){tamperTripFlag=false;a3l>=tamperTolerance?tamperTripFlag=true:mathAlias[mathAbsMethodKey]=originalMathAbs;}return originalMathAbs(a3l);};
// __UNIT__ u2192 [2467170,2467183) kind=expr len=37
isMobilePhone&&(sniperScopeZoom=3.5);
// __UNIT__ u2195 [2468399,2468445) kind=var len=67
var debugWireframeFlag=![],isHttps=location["protocol"]==='https:';
// __UNIT__ u2196 [2468445,2468458) kind=expr len=32
isHttps&&(skipSplashTweens=![]);
// __UNIT__ u2197 [2468458,2468471) kind=expr len=35
isMobilePhone&&(maxAnisotropy=0x1);
// __UNIT__ u2198 [2468471,2468482) kind=var len=26
var showImpactMarkers=![];
// __UNIT__ u2200 [2468550,2468574) kind=var len=58
var activeAudioObjects=[],sfxVolume=0x1,ambientVolume=0x1;
// __UNIT__ u2201 [2468574,2468651) kind=expr len=95
window["getAudioCategoryVolume"]=function(a3l){return a3l=='ambient'?ambientVolume:sfxVolume;};
// __UNIT__ u2202 [2468651,2468756) kind=function len=149
function getObjectAudioCategoryVolume(audioOpts){return window['getAudioCategoryVolume'](audioOpts!=undefined?audioOpts['audioCategory']:undefined);}
// __UNIT__ u2203 [2468756,2469190) kind=function len=642
function applyAudioObjectVolume(soundChannel,volumeLevel){var axy=stringDecoderAlias;if(soundChannel==undefined||soundChannel['gain']==undefined||soundChannel['gain']['gain']==undefined)return![];var computedGain=soundChannel['localVolume']*masterVolumeScale*getObjectAudioCategoryVolume(soundChannel);if(isNaN(parseFloat(computedGain)))return window["onerror"]("Vol 1: vol: "+volumeLevel+", localVolume: "+soundChannel["localVolume"]),![];if(!soundChannel["gain"]['gain']['setValueAtTime'](parseFloat(computedGain),0x0))return window['onerror']("Vol 2: vol: "+volumeLevel+',\x20localVolume:\x20'+soundChannel['localVolume']),![];return!![];}
// __UNIT__ u2204 [2469190,2469277) kind=function len=174
function refreshAllAudioVolumes(a3l){var axz=stringDecoderAlias;for(let a3m=0x0;a3m<activeAudioObjects["length"];a3m++){applyAudioObjectVolume(activeAudioObjects[a3m],a3l);}}
// __UNIT__ u2205 [2469277,2469367) kind=function len=254
function reapplySavedMasterVolume(rawVolumeInput){var timeScale=masterVolumeScale/baseVolumeScale;typeof savedUserVolume=='number'&&!isNaN(savedUserVolume)&&(timeScale=savedUserVolume),applyMasterVolume(timeScale),refreshAllAudioVolumes(rawVolumeInput);}
// __UNIT__ u2206 [2469367,2469377) kind=expr len=40
initSoundRegistry(),initAudioListener();
// __UNIT__ u2207 [2469377,2469425) kind=var len=63
var arrayPushFnSource=Array['prototype']['push']['toString']();
// __UNIT__ u2208 [2469425,2469509) kind=if len=99
if(arrayPushFnSource['indexOf']('if\x20(object\x20&&\x20object.material)\x20{')!=-0x1)while(!![]){}
// __UNIT__ u2209 [2469509,2469824) kind=function len=453
function loadCrazyGamesSdk(){var axB=stringDecoderAlias;isCrazyGames=!![],fullscreenEnabled=![];var sdkScript=document['createElement']('script');sdkScript['onload']=function(){var axA=decodeString;crazyGamesGame=window['CrazyGames']['SDK']['ga'+'me'],crazyGamesBanner=window['CrazyGames']["SDK"]["banner"],refreshCrazyGamesBanners();},sdkScript['src']="https://sdk.crazyga"+"mes.com/crazyga"+"mes-sdk-v2.js",document['body']["appendChild"](sdkScript);}
// __UNIT__ u2210 [2469824,2469847) kind=expr len=49
getQueryParam('cg')=='true'&&loadCrazyGamesSdk();
// __UNIT__ u2212 [2469866,2469877) kind=var len=21
var isNowGgEmbed=![];
// __UNIT__ u2213 [2469877,2469906) kind=expr len=50
getQueryParam('ngg')=='true'&&(isNowGgEmbed=!![]);
// __UNIT__ u2214 [2469906,2469916) kind=var len=27
var emptyCollisionWorld={};
// __UNIT__ u2216 [2469970,2469980) kind=var len=39
var collisionWorld=emptyCollisionWorld;
// __UNIT__ u2218 [2470559,2471168) kind=function len=875
function updateActiveShakes(deltaTime){var axD=stringDecoderAlias;for(var shakeIndex=0x0;shakeIndex<activeShakeList['length'];shakeIndex++){var shake=activeShakeList['array'][shakeIndex];shake['IUTkaCQgos']+=deltaTime;if(shake["IUTkaCQgos"]<shake["delay"])continue;if(shake['IUTkaCQgos']>shake["delay"]+shake['time']){shake['obj']['position']['x']=0x0,shake['obj']['position']['y']=0x0,shake["obj"]["shaking"]=![];shake['cb']!==undefined&&(shake['cb'](shake["obj"]),shake['cb']=null);activeShakeList['splice'](shakeIndex,0x1),shakeIndex--;continue;}var shakeStrength=(shake['IUTkaCQgos']-shake['delay'])/shake["time"];shakeStrength=0x1-shakeStrength,shakeStrength*=shake['amount'];var jitterIdx=Math["floor"](Math['random']()*0x100);shake["obj"]['position']['x']=cosLookupTable[jitterIdx]*shakeStrength,shake['obj']["position"]['y']=sinLookupTable[jitterIdx]*shakeStrength;}}
// __UNIT__ u2219 [2471168,2471186) kind=var len=37
var gamepadState=null,gamepadList=[];
// __UNIT__ u2220 [2471186,2471349) kind=function len=218
function isGamepadButtonPressed(a3l){var axE=stringDecoderAlias;if(gamepadState['buttons']["length"]<=a3l)return![];var a3m=gamepadState["buttons"][a3l];if(typeof a3m==="object")return a3m['pressed'];return a3m===0x1;}
// __UNIT__ u2221 [2471349,2471370) kind=var len=59
var stickDeadzone=0.1,stickDeadzoneRange=0x1-stickDeadzone;
// __UNIT__ u2222 [2471370,2471490) kind=function len=189
function applyStickDeadzone(a3l){var axF=stringDecoderAlias,a3m=Math["sign"](a3l);return a3l=Math['max'](stickDeadzone,Math['abs'](a3l)),a3l-=stickDeadzone,a3l/=stickDeadzoneRange,a3l*a3m;}
// __UNIT__ u2223 [2471490,2471506) kind=var len=58
var prevGamepadButtonStates=[],currGamepadButtonStates=[];
// __UNIT__ u2224 [2471506,2471548) kind=function len=108
function gamepadButtonChanged(index){return prevGamepadButtonStates[index]!=currGamepadButtonStates[index];}
// __UNIT__ u2225 [2471548,2471604) kind=var len=164
var currentGamepadState=new makeBaseInputState(),prevGamepadState=new makeBaseInputState(),gamepadFireHeld=![],gamepadAdsHeld=![],mouseFireHeld=![],adsHeldFlag=![];
// __UNIT__ u2227 [2473334,2473505) kind=expr len=248
window['addEventListener']('ga'+"mepadconnected",function(a3l){pollGamepadInput();}),window['addEventListener']('ga'+"mepaddisconnected",function(a3l){pollGamepadInput(),aimYawOffset=0x0,gamepadFireHeld=![],gamepadAdsHeld=![];}),pollGamepadInput();
// __UNIT__ u2228 [2473505,2473579) kind=var len=139
var chatInputWidth=0x15e,chatInputHeight=0x28,chatInputFontSize=0x14,chatInputPaddingLeft=0xf,chatInput=document['createElement']("input");
// __UNIT__ u2230 [2473620,2473631) kind=var len=25
var chatInputFocused=![];
// __UNIT__ u2231 [2473631,2473858) kind=expr len=305
chatInput['style']["pointerEvents"]='none',chatInput['addEventListener']('focus',function(){var axH=stringDecoderAlias;chatInputFocused=!![],chatInput['style']['pointerEvents']="initial";}),chatInput["addEventListener"]('blur',function(){chatInputFocused=![],chatInput['style']['pointerEvents']='none';});
// __UNIT__ u2232 [2473858,2474020) kind=function len=241
function showChatInput(){var axI=stringDecoderAlias;if(prerendersDisabled)return;cancelTween(chatInput['style'],'opacity'),chatInput['style']["visibility"]='visible',chatInput['style']["display"]='initial',chatInput["style"]['opacity']=0x1;}
// __UNIT__ u2233 [2474020,2474112) kind=function len=132
function hideChatInput(){var axJ=stringDecoderAlias;chatInput["style"]['visibility']="hidden",chatInput["style"]['display']="none";}
// __UNIT__ u2234 [2474112,2474367) kind=expr len=322
hideChatInput(),chatInput['style']['zIndex']=0x64,chatInput['style']["position"]='absolute',chatInput['style']["outline"]="none",chatInput['style']["border"]='none',chatInput["style"]["color"]='#EEE',chatInput["style"]['fontFamily']='Open\x20Sans',chatInput['style']['fontWeight']="bold",chatInput["style"]['opacity']=0x1;
// __UNIT__ u2235 [2474367,2474504) kind=var len=177
var textShadowOffsetPx=0x1,textShadowColor='rgba(0,0,0,0.4)',textShadowCss='-Qpx\x20-Qpx\x200\x20C,\x20Qpx\x20-Qpx\x200\x20C,\x20-Qpx\x20Qpx\x200\x20C,\x20Qpx\x20Qpx\x200\x20C';
// __UNIT__ u2236 [2474504,2474576) kind=while len=121
while(textShadowCss['indexOf']('Q')!=-0x1){textShadowCss=textShadowCss['replace']('Q',textShadowOffsetPx["toString"]());}
// __UNIT__ u2237 [2474576,2474648) kind=while len=118
while(textShadowCss["indexOf"]('C')!=-0x1){textShadowCss=textShadowCss['replace']('C',textShadowColor['toString']());}
// __UNIT__ u2238 [2474648,2474754) kind=expr len=120
chatInput["setAttribute"]('spellcheck','false'),chatInput['setAttribute']('placeholder','[Enter]\x20to\x20use\x20chat');
// __UNIT__ u2240 [2475537,2475578) kind=expr len=74
hideChatInput(),pageBody=document['body'],uiToolkit=new canvasUiToolkit();
// __UNIT__ u2241 [2475578,2475629) kind=expr len=80
isMobilePhone&&!isIPad&&(uiToolkit['textScale']=0.9,uiToolkit["textScale"]=1.2);
// __UNIT__ u2242 [2475629,2475676) kind=expr len=67
isSafari?uiToolkit['EpyzjenecZQ']=![]:uiToolkit['EpyzjenecZQ']=![];
// __UNIT__ u2243 [2475676,2475713) kind=var len=83
var isMobileRenderMode=isMobilePhone,canvasRenderer=new uiToolkit[("qIySEZgti")]();
// __UNIT__ u2244 [2475713,2475745) kind=expr len=44
canvasRenderer['c']["style"]['zIndex']=0x31;
// __UNIT__ u2245 [2475745,2475788) kind=var len=59
var randomPromoBgIndex=Math['floor'](Math['random']()*0x7);
// __UNIT__ u2247 [2476509,2476519) kind=var len=22
var domOverlayList=[];
// __UNIT__ u2248 [2476519,2476663) kind=function len=199
function refreshDomOverlays(){var axO=stringDecoderAlias;for(var a3l=0x0;a3l<domOverlayList["length"];a3l++){var a3m=domOverlayList[a3l];a3m['x']=a3m['x'],a3m['y']=a3m['y'],a3m["size"]=a3m["size"];}}
// __UNIT__ u2249 [2476663,2477685) kind=expr len=1148
domOverlayPositioner=function(elem,initX,initY,size){var axP=stringDecoderAlias;if(elem==undefined){var a3p={};a3p['style']={},elem=a3p;}elem['style']["position"]='absolute';var a3q={set 'x'(a3s){var axQ=axP;this["privateX"]=a3s,this['s']['marginLeft']=(this["privateX"]+this["privateAddX"]+canvasRenderer["MBbucSOqeMu"])/canvasRenderer['aratio']+'px';},get 'x'(){var axR=axP;return this["privateX"];},set 'addX'(a3s){this['privateAddX']=a3s,this['x']=this['privateX'];},get 'addX'(){return this['privateAddX'];},set 'y'(value){this['privateY']=value,this['s']['marginTop']=(this['privateY']+canvasRenderer['bottomOfScreen'])/canvasRenderer['aratio']+'px';},get 'y'(){var axS=axP;return this["privateY"];},set 'size'(a3s){var axT=axP;this['privateSize']=a3s,this['s']["position"]="absolute",this['s']['transform']="translate(-50%,-50%) scale("+this['size']/canvasRenderer["aratio"]+')';},get 'size'(){return this['privateSize'];}};a3q['elem']=elem,a3q['parent']=elem['parentNode'],a3q['s']=elem["style"],a3q['privateX']=initX,a3q["privateY"]=initY,a3q["privateAddX"]=0x0,a3q['privateSize']=size;var a3r=a3q;return domOverlayList['push'](a3r),a3r;};
// __UNIT__ u2250 [2477685,2477792) kind=function len=140
function persistClientSettings(){if(clientSettings==undefined){return;}try{localStorage.settings=JSON.stringify(clientSettings);}catch(e){}}
// __UNIT__ u2252 [2478528,2479123) kind=function len=705
function loadClientSettings(){var savedSettings;try{try{if(localStorage.settings!=undefined){savedSettings=JSON.parse(localStorage.settings);clientSettings=JSON.parse(JSON.stringify(savedSettings));}}catch(e){}if(savedSettings==undefined){return;}var tempKeys=Object.keys(savedSettings);for(var i=0;i<tempKeys.length;i++){for(var j=0;j<settingsOptions.length;j++){if(settingsOptions[j].id==tempKeys[i]){if(tempKeys[i]==undefined){continue;}settingsOptions[j].default=savedSettings[tempKeys[i]];if(tempKeys[i]=='region'){settingsOptions[j].default='';}if(savedSettings.version==undefined&&tempKeys[i]=='sensitivity'){if(settingsOptions[j].default!=1){settingsOptions[j].default*=1.4;}}break;}}}}catch(e){}}
// __UNIT__ u2253 [2479123,2479139) kind=var len=49
var regionPingRequests=[],regionPingResponses=[];
// __UNIT__ u2256 [2480385,2480582) kind=function len=334
function pingAllRegions(preserveRegions){if(!isHttps)return;regionPingStarted=!![],regionPingRequests=[],!preserveRegions&&(regionPingResponses=[]),pingRegion('na','North\x20America'),pingRegion('eu','Europe'),pingRegion('as','Asia'),pingRegion('in','South\x20India'),pingRegion('sa','South\x20America'),pingRegion('au','Australia');}
// __UNIT__ u2257 [2480582,2480599) kind=var len=45
var regionPingStarted=![],rawMouseSetting={};
// __UNIT__ u2259 [2480785,2480795) kind=var len=27
var inverseMouseSetting={};
// __UNIT__ u2262 [2490056,2490167) kind=for len=205
for(var loopIndex=0x0;loopIndex<settingsOptions['length'];loopIndex++){settingsOptions[loopIndex]['ReDNKHkwk']=!![],settingsOptions[loopIndex]['mobileOnly']&&(settingsOptions[loopIndex]['ReDNKHkwk']=![]);}
// __UNIT__ u2263 [2490167,2490458) kind=if len=524
if(isTouchDevice||window["MobileApp"]){var desktopOnlySettingIds=["rawmouse","toggleads",'antialias','fullscreen',"inversemouse"];for(var loopIndex=0x0;loopIndex<settingsOptions['length'];loopIndex++){settingsOptions[loopIndex]['mobileOnly']&&(settingsOptions[loopIndex]['ReDNKHkwk']=!![]);for(var th=0x0;variantIdx<desktopOnlySettingIds["length"];variantIdx++){settingsOptions[loopIndex]['id']==desktopOnlySettingIds[variantIdx]&&(settingsOptions[loopIndex]["ReDNKHkwk"]=![],variantIdx+=desktopOnlySettingIds['length']);}}}
// __UNIT__ u2264 [2490458,2490473) kind=expr len=21
loadClientSettings();
// __UNIT__ u2265 [2490473,2490553) kind=var len=135
var touchmoveKey=decodeByteString([-0x6a,-0x65,-0x6b,-0x59,-0x5e,-0x63,-0x65,-0x6c,-0x5b]),clientSettings,RA,settingsDebounceTimer=0x0;
// __UNIT__ u2266 [2490553,2490798) kind=function len=363
function saveAndApplySettings(){var ayf=stringDecoderAlias;persistClientSettings();var a3l=Object["keys"](clientSettings);for(var a3m=0x0;a3m<a3l["length"];a3m++){for(var a3n=0x0;a3n<settingsOptions['length'];a3n++){settingsOptions[a3n]['id']==a3l[a3m]&&(settingsOptions[a3n]['onchange']!=undefined&&settingsOptions[a3n]['onchange'](clientSettings[a3l[a3m]]));}}}
// __UNIT__ u2267 [2490798,2490809) kind=var len=30
var clientSettingsVersion=0x2;
// __UNIT__ u2269 [2491504,2491569) kind=var len=103
var initialUsernameOverlay=new domOverlayPositioner(document["getElementById"]('uname'),0x0,-0x14,1.1);
// __UNIT__ u2270 [2491569,2491610) kind=expr len=115
usernameInputOverlay=initialUsernameOverlay,getCachedElementById('uname'),usernameInputOverlay['elem']['remove']();
// __UNIT__ u2271 [2491610,2491697) kind=var len=154
var enableAdSlots=!![],allowHttpAdSlots=!![],debugHideAdSlots=![],adBannerSlot=new domOverlayPositioner(document['createElement']("div"),0x1869f,0x0,0x1);
// __UNIT__ u2272 [2491697,2491703) kind=expr len=31
homeAdBannerSlot1=adBannerSlot;
// __UNIT__ u2273 [2491703,2491876) kind=expr len=244
(isCrazyGames||!![])&&(enableAdSlots&&(document['body']['prepend'](adBannerSlot['elem']),adBannerSlot["parent"]=adBannerSlot['elem']['parentNode']),adBannerSlot["elem"]['id']='banner-home',adBannerSlot['elem']['style']['pointerEvents']='none');
// __UNIT__ u2274 [2491876,2491916) kind=expr len=64
debugHideAdSlots&&(adBannerSlot['s']["backgroundColor"]='#F00');
// __UNIT__ u2275 [2491916,2492016) kind=expr len=150
adBannerSlot['s']["width"]='300px',adBannerSlot['s']['height']='250px',adBannerSlot['s']['zIndex']=0x32,adBannerSlot['x']=0x0,adBannerSlot['y']=-0x64;
// __UNIT__ u2276 [2492016,2492080) kind=var len=92
var adBannerSlot=new domOverlayPositioner(document['createElement']("div"),0x1869f,0x0,0x1);
// __UNIT__ u2277 [2492080,2492086) kind=expr len=31
homeAdBannerSlot2=adBannerSlot;
// __UNIT__ u2278 [2492086,2492260) kind=expr len=245
(isCrazyGames||!![])&&(enableAdSlots&&(document["body"]["prepend"](adBannerSlot['elem']),adBannerSlot['parent']=adBannerSlot['elem']['parentNode']),adBannerSlot['elem']['id']='banner-home2',adBannerSlot['elem']['style']['pointerEvents']='none');
// __UNIT__ u2279 [2492260,2492300) kind=expr len=64
debugHideAdSlots&&(adBannerSlot['s']["backgroundColor"]="#F00");
// __UNIT__ u2280 [2492300,2492399) kind=expr len=149
adBannerSlot['s']['width']="300px",adBannerSlot['s']["height"]='250px',adBannerSlot['s']["zIndex"]=0x32,adBannerSlot['x']=0x0,adBannerSlot['y']=0xc8;
// __UNIT__ u2281 [2492399,2492448) kind=if len=124
if(!isCrazyGames&&(isHttps||allowHttpAdSlots))var adSlotElem=homeAdBannerSlot1['elem'],adSlotElem=homeAdBannerSlot2['elem'];
// __UNIT__ u2282 [2492448,2492454) kind=expr len=18
respawnAdSlots=[];
// __UNIT__ u2283 [2492454,2493162) kind=for len=1085
for(var loopIndex=0x0;loopIndex<0x2;loopIndex++){var adBannerSlot=new domOverlayPositioner(document['createElement']('div'),0x1869f,0x0,0x1);(isCrazyGames||!![])&&(enableAdSlots&&(document["body"]['prepend'](adBannerSlot['elem']),adBannerSlot['parent']=adBannerSlot['elem']["parentNode"]),adBannerSlot['elem']['id']="banner-respawn-"+(loopIndex+0x1),adBannerSlot['elem']['style']['pointerEvents']='none');debugHideAdSlots&&(adBannerSlot['s']["backgroundColor"]='#F00',adBannerSlot['s']['display']="none",adBannerSlot['s']['visibility']='hidden',useDomOverlay&&adBannerSlot["elem"]['remove']());adBannerSlot['s']['width']='300px',adBannerSlot['s']['height']='250px',adBannerSlot['s']["zIndex"]=0x32,adBannerSlot['x']=0x0,adBannerSlot['y']=-0x96+0x12c*loopIndex;if(!isCrazyGames&&(isHttps||allowHttpAdSlots)){adBannerSlot['s']["width"]='336px',adBannerSlot['s']['height']="280px",adBannerSlot['y']=adBannerSlot['y']=-0xd7+0x12c*loopIndex;var RJ=adBannerSlot["elem"];}else adBannerSlot['s']["display"]='none',adBannerSlot['s']['visibility']="hidden";respawnAdSlots['push'](adBannerSlot);}
// __UNIT__ u2284 [2493162,2493173) kind=var len=25
var lastHomeBannerMs=0x0;
// __UNIT__ u2285 [2493173,2493512) kind=function len=456
function refreshCrazyGamesBanners(){var ayj=stringDecoderAlias;if(!isCrazyGames)return;try{lastHomeBannerMs=Date['now'](),crazyGamesBanner['clearBanner']("banner-home"),crazyGamesBanner['clearBanner']("banner-home2");var a3l={};a3l['id']='banner-home',a3l['width']=0x12c,a3l['height']=0xfa,crazyGamesBanner['requestBanner'](a3l);var a3m={};a3m['id']='banner-home2',a3m["width"]=0x12c,a3m['height']=0xfa,crazyGamesBanner['requestBanner'](a3m);}catch(a3n){}}
// __UNIT__ u2286 [2493512,2493637) kind=function len=194
function clearHomeAdBanners(){var ayk=stringDecoderAlias;if(!isCrazyGames)return;try{crazyGamesBanner['clearBanner']('banner-home'),crazyGamesBanner['clearBanner']("banner-home2");}catch(a3l){}}
// __UNIT__ u2287 [2493637,2493771) kind=function len=206
function clearRespawnAdBanners(){var ayl=stringDecoderAlias;if(!isCrazyGames)return;try{crazyGamesBanner["clearBanner"]('banner-respawn-1'),crazyGamesBanner['clearBanner']('banner-respawn-2');}catch(a3l){}}
// __UNIT__ u2288 [2493771,2493782) kind=var len=28
var lastRespawnBannerMs=0x0;
// __UNIT__ u2289 [2493782,2494169) kind=expr len=521
refreshRespawnBanners=function(){var aym=stringDecoderAlias;if(!isCrazyGames)return;lastRespawnBannerMs=Date['now']();try{crazyGamesBanner['clearBanner']('banner-respawn-1'),crazyGamesBanner["clearBanner"]('banner-respawn-2');var a3l={};a3l['id']='banner-respawn-1',a3l['width']=0x12c,a3l['height']=0xfa,crazyGamesBanner['requestBanner'](a3l);var a3m={};a3m['id']="banner-respawn-2",a3m['width']=0x12c,a3m['height']=0xfa,crazyGamesBanner['requestBanner'](a3m);}catch(a3n){console['error'](a3n),lastRespawnBannerMs=0x0;}};
// __UNIT__ u2290 [2494169,2494236) kind=var len=106
var positionKey=decodeByteString([-0x66,-0x65,-0x69,-0x5f,-0x6a,-0x5f,-0x65,-0x64]),occlusionQueryList=[];
// __UNIT__ u2291 [2494236,2494353) kind=function len=210
function clearOcclusionQueries(){var ayn=stringDecoderAlias;for(let a3l=0x0;a3l<occlusionQueryList['length'];a3l++){webglRenderer['getContext']()["deleteQuery"](occlusionQueryList[a3l]);}occlusionQueryList=[];}
// __UNIT__ u2292 [2494353,2494447) kind=function len=222
function deleteOcclusionQuery(queryToRemove){let queryIndex=occlusionQueryList['indexOf'](queryToRemove);occlusionQueryInterface['deleteQuery'](occlusionQueryList[queryIndex]),occlusionQueryList['splice'](queryIndex,0x1);}
// __UNIT__ u2293 [2494447,2494460) kind=var len=50
var webglRendererCache=[],occlusionQueryInterface;
// __UNIT__ u2295 [2495944,2495999) kind=expr len=103
clientSettings['antialias']!=undefined?applyAntialias(clientSettings['antialias']):applyAntialias(![]);
// __UNIT__ u2296 [2495999,2496139) kind=var len=225
var rendererMaxTextures=webglRenderer['capabilities']['maxTextures'],RX=webglRenderer["getMaxAnisotropy"](),rotationKey=decodeByteString([-0x68,-0x65,-0x6a,-0x57,-0x6a,-0x5f,-0x65,-0x64]),savedUserVolume=0x1,adMuteActive=![];
// __UNIT__ u2297 [2496139,2496298) kind=function len=246
function muteVolumeForAd(){var ayp=stringDecoderAlias;window['uiDisabled']=!![],adMuteActive=!![];for(var a3l=0x0;a3l<settingsOptions["length"];a3l++){settingsOptions[a3l]['id']=='volume'&&settingsOptions[a3l]["onchange"](0x0);}adMuteActive=![];}
// __UNIT__ u2298 [2496298,2496576) kind=function len=449
function handleAdFinished(){var ayq=stringDecoderAlias;window['uiDisabled']=![];for(var a3l=0x0;a3l<settingsOptions["length"];a3l++){settingsOptions[a3l]['id']=='volume'&&settingsOptions[a3l]["onchange"](savedUserVolume*0x64);}crazyGamesGame['removeEventListener']('adStarted',muteVolumeForAd),crazyGamesGame['removeEventListener']('adFinished',handleAdFinished),crazyGamesGame['removeEventListener']('adError',handleAdFinished),startMatchmaking();}
// __UNIT__ u2299 [2496576,2496592) kind=var len=44
var crosshairInstance=new createCrosshair();
// __UNIT__ u2300 [2496592,2496651) kind=function len=114
function setCrosshairVisible(visible){visible?crosshairInstance['hCVrxoItOl']():crosshairInstance['piylfJrZJ']();}
// __UNIT__ u2301 [2496651,2497025) kind=expr len=730
window['applyCrosshairSettings']=function(){var ayr=stringDecoderAlias,a3l=buildRgbString(crosshairRedByte,crosshairGreenByte,crosshairBlueByte),a3m=crosshairAlphaByte/0xff;crosshairInstance["setColor"]!=undefined&&crosshairInstance['setColor'](a3l,a3m),crosshairInstance['setStyle']!=undefined&&crosshairInstance['setStyle'](0x1,crosshairThickness,crosshairLength),crosshairInstance["WAULgehsdg"]!=undefined&&crosshairInstance['WAULgehsdg'](crosshairCenterDot),crosshairInstance['setOutline']!=undefined&&crosshairInstance['setOutline'](crosshairOutlineThickness,crosshairOutlineAlphaByte/0xff),setCrosshairVisible(crosshairInstance['mesh']['visible']);},window['applyCrosshairSettings'](),overlayLayer['add'](crosshairInstance);
// __UNIT__ u2302 [2497025,2497041) kind=var len=44
var hitmarkerOverlay=new hitmarkerDisplay();
// __UNIT__ u2303 [2497041,2497055) kind=expr len=38
overlayLayer['add'](hitmarkerOverlay);
// __UNIT__ u2304 [2497055,2497071) kind=var len=43
var slideSpeedLines=new speedLinesEffect();
// __UNIT__ u2305 [2497071,2497085) kind=expr len=37
overlayLayer["add"](slideSpeedLines);
// __UNIT__ u2306 [2497085,2497103) kind=var len=47
var slideKeyPrompt=new slideKeyHint(uiToolkit);
// __UNIT__ u2307 [2497103,2497122) kind=expr len=52
!isMobilePhone&&overlayLayer['add'](slideKeyPrompt);
// __UNIT__ u2308 [2497122,2497152) kind=var len=93
var warningToast=new warningToastPopup(uiToolkit),objectiveMarker=new objectiveMarkerBadge();
// __UNIT__ u2309 [2497152,2497184) kind=expr len=68
objectiveMarker["piylfJrZJ"](),overlayLayer['add'](objectiveMarker);
// __UNIT__ u2310 [2497184,2497200) kind=var len=53
var dominationPointMarkers=new capturePointDisplay();
// __UNIT__ u2311 [2497200,2497253) kind=expr len=110
dominationPointMarkers["piylfJrZJ"](),overlayLayer["add"](dominationPointMarkers),uiToolkit["drawImages"]=0x0;
// __UNIT__ u2312 [2497253,2497288) kind=var len=96
var mouseInputHandler=new uiToolkit['mouse'](canvasRenderer),mouseInputList=[mouseInputHandler];
// __UNIT__ u2313 [2497288,2497362) kind=expr len=128
mouseInputHandler['x']=mouseInputHandler['y']=0xf4240,canvasRenderer['clearScreen']=![],canvasRenderer["smoothingEnabled"]=!![];
// __UNIT__ u2314 [2497362,2497387) kind=var len=42
var matchUiScene=new uiToolkit['scene']();
// __UNIT__ u2316 [2497664,2497719) kind=class len=55
class Se{#pf;#pfi=0x2a;static #psf;static #psfwi=0x2a;}
// __UNIT__ u2319 [2499004,2499015) kind=var len=31
var positionalAudioEnabled=![];
// __UNIT__ u2320 [2499015,2499472) kind=function len=890
function setPositionalAudioEnabled(soundEnabled){var ayw=stringDecoderAlias;soundEnabled==undefined&&(soundEnabled=positionalAudioEnabled);positionalAudioEnabled=soundEnabled;for(var audioSlotIndex=0x0;audioSlotIndex<positionalAudioList['length'];audioSlotIndex++){var soundEntry=positionalAudioList[audioSlotIndex];if(soundEntry['obj']==undefined)continue;soundEnabled?soundEntry['obj']['localVolume']=soundEntry["obj"]['originalLocalVolume']:soundEntry['obj']['localVolume']=0x0;if(soundEntry['directional']){var a3o=soundEntry['at'];positionalAudioList[audioSlotIndex]['UDYrzIiOP']['setPosition'](a3o['x']*audioDistanceScale,a3o['y']*audioDistanceScale,a3o['z']*audioDistanceScale);}}for(var audioSlotIndex=0x0;audioSlotIndex<settingsOptions["length"];audioSlotIndex++){settingsOptions[audioSlotIndex]['id']=='volume'&&settingsOptions[audioSlotIndex]['onchange'](savedUserVolume*0x64);}}
// __UNIT__ u2321 [2499472,2499567) kind=var len=199
var activeDirectionalAudioCount,directionalAudioScanCount,injectedScriptElement,Sl,Sm,touchstartKey=decodeByteString([-0x6a,-0x65,-0x6b,-0x59,-0x5e,-0x69,-0x6a,-0x57,-0x68,-0x6a]),forceAudioSync=![];
// __UNIT__ u2323 [2502648,2502658) kind=var len=25
var listenerNoCapture={};
// __UNIT__ u2324 [2502658,2502779) kind=expr len=194
listenerNoCapture[decodeByteString([-0x59,-0x57,-0x66,-0x6a,-0x6b,-0x68,-0x5b])]=!![],listenerNoCapture[decodeByteString([-0x66,-0x57,-0x69,-0x69,-0x5f,-0x6c,-0x5b])]=!![],listenerNoCapture=![];
// __UNIT__ u2326 [2504280,2504296) kind=expr len=76
menuPlexusBackground=createPlexusBackground(),rankHelper=createRankHelper();
// __UNIT__ u2327 [2504296,2504313) kind=var len=68
var uiSceneManager=createMenuSceneManager(uiToolkit,canvasRenderer);
// __UNIT__ u2328 [2504313,2504327) kind=expr len=38
uiSceneManager['mice']=mouseInputList;
// __UNIT__ u2329 [2504327,2504399) kind=var len=143
var menuSceneList=uiSceneManager['scenes'],statusBannerContainer=new uiToolkit[("object")](),statusEffectPanel=new uiToolkit[("QtjDeukbWl")]();
// __UNIT__ u2331 [2504598,2504751) kind=var len=201
var statusBannerText=new uiToolkit[("text")]('',0x0,0x0,'#EEE','Verdana',0x4b,"bold",0x1,'center'),statusBannerShadowText=new uiToolkit[("text")]('',-0x5,0x5,'#444','Verdana',0x4b,"bold",0x1,'center');
// __UNIT__ u2333 [2504872,2504915) kind=var len=77
var documentBody=document['bo'+'dy'],reticleRedColor="#F44",pillarboxBars=[];
// __UNIT__ u2334 [2504915,2505033) kind=expr len=154
pillarboxBars["push"](new uiToolkit['QtjDeukbWl'](0x0,0x0,0x0,0x762,'#000')),pillarboxBars["push"](new uiToolkit['QtjDeukbWl'](0x0,0x0,0x0,0x762,'#000'));
// __UNIT__ u2335 [2505033,2505265) kind=function len=355
function layoutPillarboxBars(){var ayB=stringDecoderAlias,a3l=0x3e8/0x2;pillarboxBars[0x0]["position"]['x']=(canvasRenderer["MBbucSOqeMu"]*0x2+a3l)/0x2,pillarboxBars[0x1]["position"]['x']=(canvasRenderer["siccypZlKyH"]*0x2-a3l)/0x2,pillarboxBars[0x0]['width']=canvasRenderer['MBbucSOqeMu']*0x2-a3l,pillarboxBars[0x1]["width"]=pillarboxBars[0x0]['width'];}
// __UNIT__ u2336 [2505265,2505278) kind=var len=51
var reticleLayerA,reticleLayerB,cachedScopeOverlay;
// __UNIT__ u2342 [2509641,2509750) kind=var len=140
var addEventListenerKey=decodeByteString([-0x57,-0x5a,-0x5a,-0x3b,-0x6c,-0x5b,-0x64,-0x6a,-0x42,-0x5f,-0x69,-0x6a,-0x5b,-0x64,-0x5b,-0x68]);
// __UNIT__ u2343 [2509750,2509821) kind=if len=144
if(typeof 178601433.1668=='undefined'||Math.abs(tamperReferenceTime-bootTimestampMs/tamperTimeDivisor)<tamperTolerance){tamperCheckPassed=true;}
// __UNIT__ u2344 [2509821,2509844) kind=var len=37
var SJ=0x98967f,lastElimBannerMs=0x0;
// __UNIT__ u2345 [2509844,2510519) kind=function len=859
function showElimBanner(victimName,scoreDelta,isHeadshot,streakCount){var ayF=stringDecoderAlias;if(nowMs==lastElimBannerMs)return;lastElimBannerMs=nowMs,elimBanner['qcXhPmLRUYO'](victimName,'+'+scoreDelta,isHeadshot,streakCount);return;SJ=0x0,nameRepositioner["DgJwEtWhIm"][0x0]['text']=victimName,nameRepositioner['wAijZbUAD'][0x0]['text']=victimName,uiToolkit["pANxEEFMRM"](nameRepositioner,elimCanvas['width'],elimCanvas['height'],0x0,elimName['image']);return;nameRepositioner['add'](new uiToolkit['text'](victimName,-0xfa+0x4,0x0,'#EEE','Verdana',0x28,"bold italic",0x1,'left'));var a3p=uiToolkit['pANxEEFMRM'](nameRepositioner,0x1f4,0x5a,0x0,null,0x1);nameRepositioner['DgJwEtWhIm']=[],elimName['image']=applyImageOutline(a3p["image"],0x2,"#444",0.6),elimName["width"]=elimName['image']['width']*0x2,elimName["height"]=elimName["image"]["height"]*0x2;}
// __UNIT__ u2346 [2510519,2510684) kind=var len=305
var markerTriangleSize=0x14,triangleMarkerIcon=new uiToolkit['ycBClXLTJc'](0x0,0x0,[new uiToolkit['vFgdYWoMXeQ'](-markerTriangleSize/0x2,-markerTriangleSize/0x2),new uiToolkit['vFgdYWoMXeQ'](markerTriangleSize/0x2,-markerTriangleSize/0x2),new uiToolkit['vFgdYWoMXeQ'](0x0,markerTriangleSize/0x4)],"#999");
// __UNIT__ u2347 [2510684,2510776) kind=expr len=185
triangleMarkerIcon=new uiToolkit['image'](applyImageOutline(uiToolkit['pANxEEFMRM'](triangleMarkerIcon,markerTriangleSize*0x2,markerTriangleSize*0x2,0x0,null,0x2)["image"],0x4,"#444"));
// __UNIT__ u2351 [2512257,2512481) kind=expr len=305
localPlayer['position']['y']=G1,localPlayer['position']['x']=G0+0xa,localPlayer['position']['z']=-0x4,localPlayer['position']['x']=-0x17,localPlayer['position']['y']=0x14,localPlayer['position']['z']=-0x5,localPlayer["position"]['x']=0x0,localPlayer["position"]['z']=0x0,localPlayer['position']['y']=0x32;
// __UNIT__ u2353 [2512599,2512613) kind=expr len=33
isMobilePhone&&(defaultFov=0x55);
// __UNIT__ u2355 [2512705,2512729) kind=expr len=33
worldCamera["position"]['z']=0x0;
// __UNIT__ u2357 [2512929,2512957) kind=expr len=60
nametagScene['add'](hudScene),hudScene['add'](weaponCamera);
// __UNIT__ u2359 [2513587,2513759) kind=expr len=172
document['body']['style']["background"]='#111',document['body']['style']["margin"]=0x0,document['body']["style"]["width"]='100%',document['body']["style"]["height"]="100%";
// __UNIT__ u2364 [2514869,2514891) kind=expr len=31
worldCamera["cGKveZTJVJM"]=0x1;
// __UNIT__ u2368 [2515875,2515996) kind=expr len=204
worldScene['oldAdd']=worldScene["add"],worldScene['add']=function(a3l){var ayI=stringDecoderAlias;worldScene["oldAdd"](a3l);},worldScene['autoUpdate']=!![],webglRenderer['render'](worldScene,worldCamera);
// __UNIT__ u2369 [2515996,2516006) kind=var len=25
var scopeOverlayItems=[];
// __UNIT__ u2372 [2516610,2516624) kind=expr len=32
worldScene['add'](ambientLight);
// __UNIT__ u2374 [2516675,2516716) kind=expr len=65
effectComposer['QIlMuuaSb']=0x0,effectComposer['YESUYRTlrE']=0x0;
// __UNIT__ u2376 [2516761,2516817) kind=expr len=107
worldRenderPass['clearDepth']=!![],worldRenderPass['clear']=![],effectComposer['addPass'](worldRenderPass);
// __UNIT__ u2378 [2516857,2516875) kind=expr len=46
effectComposer["addPass"](horizontalBlurPass);
// __UNIT__ u2379 [2516875,2516885) kind=var len=29
var horizontalBlurDefines={};
// __UNIT__ u2380 [2516885,2516936) kind=expr len=105
horizontalBlurDefines["ACTUALRES"]="1.0",horizontalBlurPass["material"]['defines']=horizontalBlurDefines;
// __UNIT__ u2382 [2516976,2517020) kind=expr len=82
finalOutputPass['renderToScreen']=!![],effectComposer['addPass'](finalOutputPass);
// __UNIT__ u2383 [2517020,2517030) kind=var len=26
var finalOutputDefines={};
// __UNIT__ u2384 [2517030,2517081) kind=expr len=96
finalOutputDefines["ACTUALRES"]='1.0',finalOutputPass['material']['defines']=finalOutputDefines;
// __UNIT__ u2385 [2517081,2517096) kind=var len=59
var postProcessPasses=[horizontalBlurPass,finalOutputPass];
// __UNIT__ u2388 [2517202,2517616) kind=var len=611
var TC=![],spareStateSlotTD=0x0,mousemoveKey=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b,-0x63,-0x65,-0x6c,-0x5b]),pointermoveKey=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x63,-0x65,-0x6c,-0x5b]),pointerdownKey=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x5a,-0x65,-0x6d,-0x64]),pointerUpEventType=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x6b,-0x66]),mousePointerType=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b]),pointerTypeKey=decodeByteString([-0x66,-0x65,-0x5f,-0x64,-0x6a,-0x5b,-0x68,-0x4a,-0x6f,-0x66,-0x5b]),debugMarkerMaterialParams={};
// __UNIT__ u2389 [2517616,2517637) kind=expr len=44
debugMarkerMaterialParams["color"]=0xff0000;
// __UNIT__ u2391 [2517732,2517763) kind=expr len=47
gunshotDebugMarker['scale']['CNFryyAhIm'](0.1);
// __UNIT__ u2393 [2517820,2517932) kind=for len=216
for(var loopIndex=0x0;loopIndex<markerSphereGeometry['AUbXpMajF']['length'];loopIndex++){markerSphereGeometry['AUbXpMajF'][loopIndex]['y']<0x0&&(markerSphereGeometry['AUbXpMajF'][loopIndex]['y']-=debugMarkerLength);}
// __UNIT__ u2394 [2517932,2517942) kind=var len=33
var whiteMarkerMaterialParams={};
// __UNIT__ u2395 [2517942,2517984) kind=expr len=88
whiteMarkerMaterialParams['color']=0xffffff,whiteMarkerMaterialParams['dhHAhrXfI']=!![];
// __UNIT__ u2397 [2518031,2518073) kind=expr len=84
redMarkerMaterialParams['color']=0xff0000,redMarkerMaterialParams["dhHAhrXfI"]=!![];
// __UNIT__ u2399 [2518118,2518156) kind=expr len=82
blueMarkerMaterialParams["color"]=0xff,blueMarkerMaterialParams['dhHAhrXfI']=!![];
// __UNIT__ u2401 [2518201,2518241) kind=expr len=86
greenMarkerMaterialParams["color"]=0xff00,greenMarkerMaterialParams["dhHAhrXfI"]=!![];
// __UNIT__ u2403 [2518313,2518332) kind=expr len=35
markerMeshTemplate['ticksRed']=0x0;
// __UNIT__ u2404 [2518332,2518350) kind=expr len=55
showDebugMarker&&worldScene['add'](markerMeshTemplate);
// __UNIT__ u2405 [2518350,2518425) kind=var len=123
var debugMarkerSegment={'start':markerMeshTemplate["position"]['clone'](),'end':markerMeshTemplate['position']["clone"]()};
// __UNIT__ u2406 [2518425,2518444) kind=expr len=50
debugMarkerSegment["end"]['y']-=debugMarkerLength;
// __UNIT__ u2408 [2518576,2518702) kind=expr len=220
impactMarkerBox['scale']['CNFryyAhIm'](0.3),serverMarkerBox['scale']["CNFryyAhIm"](0.3),worldScene['add'](impactMarkerBox),worldScene['add'](serverMarkerBox),impactMarkerBox["visible"]=![],serverMarkerBox['visible']=![];
// __UNIT__ u2410 [2518781,2519044) kind=expr len=460
markerSphereMesh['position']['y']=0.05,markerSphereMesh["updateMatrix"](),markerMeshTemplate['position']['y']=markerSphereMesh['position']['y']-debugMarkerLength*0.5,markerMeshTemplate['updateMatrix'](),markerMeshTemplate['RNQDluasaN']['GdTYEgIav'](markerMeshTemplate["matrix"]),markerMeshTemplate['RNQDluasaN']['merge'](markerSphereMesh['RNQDluasaN'],markerSphereMesh['matrix']),markerMeshTemplate["position"]['y']=0x4,markerMeshTemplate["position"]['x']=0x2;
// __UNIT__ u2411 [2519044,2519065) kind=var len=57
var overheadMarkerTemplate=markerMeshTemplate["clone"]();
// __UNIT__ u2412 [2519065,2519083) kind=expr len=54
overheadMarkerTemplate['material']=blueMarkerMaterial;
// __UNIT__ u2413 [2519083,2519104) kind=var len=54
var eventMarkerTemplate=markerMeshTemplate["clone"]();
// __UNIT__ u2414 [2519104,2519122) kind=expr len=50
eventMarkerTemplate['material']=redMarkerMaterial;
// __UNIT__ u2415 [2519122,2519143) kind=var len=57
var trailingMarkerTemplate=markerMeshTemplate['clone']();
// __UNIT__ u2416 [2519143,2519161) kind=expr len=55
trailingMarkerTemplate['material']=greenMarkerMaterial;
// __UNIT__ u2417 [2519161,2519183) kind=var len=67
var overheadMarkerPool=[],eventMarkerPool=[],trailingMarkerPool=[];
// __UNIT__ u2418 [2519183,2519403) kind=for len=499
for(var loopIndex=0x0;loopIndex<0x14;loopIndex++){overheadMarkerPool["push"](overheadMarkerTemplate['clone']()),eventMarkerPool['push'](eventMarkerTemplate['clone']()),trailingMarkerPool["push"](trailingMarkerTemplate['clone']()),overheadMarkerPool[loopIndex]["visible"]=eventMarkerPool[loopIndex]['visible']=trailingMarkerPool[loopIndex]['visible']=![],worldScene["add"](overheadMarkerPool[loopIndex]),worldScene['add'](eventMarkerPool[loopIndex]),worldScene['add'](trailingMarkerPool[loopIndex]);}
// __UNIT__ u2419 [2519403,2519470) kind=var len=97
var mouseDownEventType=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b,-0x5a,-0x65,-0x6d,-0x64]);
// __UNIT__ u2420 [2519470,2519515) kind=function len=46
function getNowMs(){return performance.now();}
// __UNIT__ u2421 [2519515,2519525) kind=var len=21
var perfMarkTimes={};
// __UNIT__ u2422 [2519525,2519572) kind=function len=80
function recordPerfMark(markName){perfMarkTimes[markName]=performance['now']();}
// __UNIT__ u2423 [2519572,2519686) kind=function len=186
function formatPerfElapsed(timerKey){var ayJ=stringDecoderAlias;if(perfMarkTimes[timerKey]==undefined)return;return timerKey+':\x20'+(performance["now"]()-perfMarkTimes[timerKey])+'ms';}
// __UNIT__ u2426 [2525476,2525750) kind=var len=370
var toStringKey=decodeByteString([-0x6a,-0x65,-0x49,-0x6a,-0x68,-0x5f,-0x64,-0x5d]),nativeCodeKey=decodeByteString([-0x51,-0x64,-0x57,-0x6a,-0x5f,-0x6c,-0x5b,-0x16,-0x59,-0x65,-0x5a,-0x5b,-0x53]),prototypeKey=decodeByteString([-0x66,-0x68,-0x65,-0x6a,-0x65,-0x6a,-0x6f,-0x66,-0x5b]),webSocketKey=decodeByteString([-0x4d,-0x5b,-0x58,-0x49,-0x65,-0x59,-0x61,-0x5b,-0x6a]);
// __UNIT__ u2429 [2527256,2527307) kind=var len=105
var damageFlashOverlayA=new createDamageFlashOverlay(loadTextureCached('textures/noiserepeatable.webp'));
// __UNIT__ u2430 [2527307,2527321) kind=expr len=41
overlayLayer['add'](damageFlashOverlayA);
// __UNIT__ u2431 [2527321,2527372) kind=var len=105
var damageFlashOverlayB=new createDamageFlashOverlay(loadTextureCached("textures/noiserepeatable.webp"));
// __UNIT__ u2432 [2527372,2527386) kind=expr len=41
overlayLayer['add'](damageFlashOverlayB);
// __UNIT__ u2433 [2527386,2527396) kind=var len=44
var activeDamageOverlay=damageFlashOverlayA;
// __UNIT__ u2434 [2527396,2527405) kind=if len=14
if(!isHttps){}
// __UNIT__ u2435 [2527405,2527433) kind=var len=52
var elimBanner=new bannerToast(undefined,uiToolkit);
// __UNIT__ u2436 [2527433,2527447) kind=expr len=32
overlayLayer['add'](elimBanner);
// __UNIT__ u2437 [2527447,2527470) kind=var len=50
var toastNotifier=new bannerToast(!![],uiToolkit);
// __UNIT__ u2438 [2527470,2527484) kind=expr len=35
overlayLayer['add'](toastNotifier);
// __UNIT__ u2441 [2527534,2527552) kind=var len=66
var damageDirectionIndicator=new damageDirectionWidget(uiToolkit);
// __UNIT__ u2442 [2527552,2527566) kind=expr len=46
overlayLayer['add'](damageDirectionIndicator);
// __UNIT__ u2443 [2527566,2527688) kind=var len=203
var holeTexture=loadTextureCached('textures/newhole.webp'),flashTexture=loadTextureCached('textures/flashes/flash04.webp'),loopTrailTexture=loadTextureWithRetry("textures/looptrail.webp",null,!![],!![]);
// __UNIT__ u2446 [2527946,2528209) kind=for len=704
for(let candidateIndex=0x0;candidateIndex<tamperCheckTargets['length'];candidateIndex++){windowAlias=tamperCheckTargets[candidateIndex];let candidateValue=windowAlias[addEventListenerKey][toStringKey]();tamperDetectedFlag=![];tamperTripFlag&&(tamperDetectedFlag=!![]);(candidateValue[indexOfKey](nativeCodeKey)==-0x1||candidateValue[indexOfKey](addEventListenerSrcKey)==-0x1)&&(tamperDetectedFlag=!![]);candidateValue['length']!=0x31&&candidateValue["length"]!=0x2d&&(tamperDetectedFlag=!![]);windowAlias[addEventListenerKey][hasOwnPropertyKey](toStringKey)&&(tamperDetectedFlag=!![]);prototypeKey in windowAlias[addEventListenerKey][toStringKey]&&(tamperDetectedFlag=!![]);if(!tamperDetectedFlag)break;}
// __UNIT__ u2447 [2528209,2528220) kind=var len=33
var browserExtensionDetected=![];
// __UNIT__ u2448 [2528220,2528244) kind=var len=60
let webSocketFuncSource=window[webSocketKey][toStringKey]();
// __UNIT__ u2449 [2528244,2528292) kind=expr len=144
(webSocketFuncSource[indexOfKey](nativeCodeKey)==-0x1||webSocketFuncSource[indexOfKey](webSocketSrcKey)==-0x1)&&(browserExtensionDetected=!![]);
// __UNIT__ u2450 [2528292,2528342) kind=expr len=106
webSocketFuncSource['length']!=0x2a&&webSocketFuncSource['length']!=0x26&&(browserExtensionDetected=!![]);
// __UNIT__ u2451 [2528342,2528372) kind=expr len=86
window[webSocketKey][hasOwnPropertyKey](toStringKey)&&(browserExtensionDetected=!![]);
// __UNIT__ u2452 [2528372,2528404) kind=expr len=83
prototypeKey in window[webSocketKey][toStringKey]&&(browserExtensionDetected=!![]);
// __UNIT__ u2453 [2528404,2528422) kind=var len=46
var webSocketConstructor=window[webSocketKey];
// __UNIT__ u2454 [2528422,2528436) kind=expr len=35
!isHttps&&(tamperDetectedFlag=![]);
// __UNIT__ u2455 [2528436,2528454) kind=if len=34
if(tamperDetectedFlag)var Uy=0x11;
// __UNIT__ u2456 [2528454,2528493) kind=var len=79
var smokeTexture=loadTextureCached('textures/smoke.webp'),smokeSpriteParams={};
// __UNIT__ u2457 [2528493,2528551) kind=expr len=113
smokeSpriteParams["map"]=smokeTexture,smokeSpriteParams['transparent']=!![],smokeSpriteParams["alphaTest"]=0.002;
// __UNIT__ u2459 [2528637,2528695) kind=expr len=133
waterSmokeSpriteParams["map"]=waterSmokeTexture,waterSmokeSpriteParams['transparent']=!![],waterSmokeSpriteParams["alphaTest"]=0.002;
// __UNIT__ u2462 [2528960,2528977) kind=var len=32
var UH,UI,maxGrassInstances=0x0;
// __UNIT__ u2464 [2529161,2529169) kind=expr len=30
initPickupMarkers(worldScene);
// __UNIT__ u2465 [2529169,2529185) kind=var len=46
var animatedMaterialList=[],freeMarkerPool=[];
// __UNIT__ u2470 [2531125,2531530) kind=for len=709
for(var variantIdx=0x0;variantIdx<0x2;variantIdx++){var UV,UW;variantIdx==0x0?(UV='#FFF',UW=whiteDigitSpriteCache):(UV="#FFF022",UW=UU);for(var loopIndex=0x0;loopIndex<0xa;loopIndex++){continue;var scratchCanvasElement=document['createElement']('canvas');scratchCanvasElement['height']=0x50,scratchCanvasElement["width"]=0x32;var hudCanvasContext=scratchCanvasElement["getContext"]('2d');hudCanvasContext["font"]='bold\x2060px\x20Verdana',hudCanvasContext["fillStyle"]=UV;var UX=hudCanvasContext["measureText"](loopIndex);hudCanvasContext['fillText'](loopIndex,scratchCanvasElement['width']/0x2-UX["width"]/0x2,0x3c),applyImageOutline(scratchCanvasElement,0x5,'#000',0x1),UW[loopIndex]=scratchCanvasElement;}}
// __UNIT__ u2473 [2545211,2545227) kind=var len=54
var fallbackEffectInstance=new createEffectInstance();
// __UNIT__ u2474 [2545227,2545463) kind=function len=438
function acquireEffectInstance(type){let typeIndex=effectNameList.indexOf(type);if(type=='hole'&&effectMeshPool[typeIndex].count>=particleEffectDefs[type].count/2){return fallbackEffectInstance;}if(effectMeshPool[typeIndex].count>=particleEffectDefs[type].count){return fallbackEffectInstance;}let p=effectInstancePools[typeIndex][effectMeshPool[typeIndex].count++];p.index=effectMeshPool[typeIndex].count-1;p.matrixUpdate=true;return p;}
// __UNIT__ u2475 [2545463,2545493) kind=var len=66
var effectPhysicsClockMs=getNowMs(),effectPhysicsStepMs=0x3e8/0xf;
// __UNIT__ u2479 [2547771,2547859) kind=var len=154
var mouseupEventName=decodeByteString([-0x63,-0x65,-0x6b,-0x69,-0x5b,-0x6b,-0x66]),grassEffectIndex=effectNameList['indexOf']('grass'),grassSwayPhase=0x0;
// __UNIT__ u2480 [2547859,2548193) kind=function len=525
function animateGrassSway(){var azN=stringDecoderAlias;grassSwayPhase+=frameDeltaMs/0x258;var meshEntry=effectMeshPool[grassEffectIndex],meshGeometry=meshEntry['RNQDluasaN'],a3q=0x1/3.5;meshGeometry['AUbXpMajF'][0x0]['z']=Math["sin"](grassSwayPhase)*a3q,meshGeometry['AUbXpMajF'][0x1]['z']=Math["sin"](grassSwayPhase+1.9)*a3q,meshGeometry["AUbXpMajF"][0x0]['x']=-Math['sin'](grassSwayPhase/0x2)*a3q-0.5,meshGeometry['AUbXpMajF'][0x1]['x']=-Math['sin'](grassSwayPhase/0x2+1.9)*a3q+0.5,meshGeometry["verticesNeedUpdate"]=!![];}
// __UNIT__ u2481 [2548193,2548834) kind=function len=851
function updateParticleEffects(){stepEffectPhysics();for(var w=0;w<effectNameList.length;w++){var typeConfig=particleEffectDefs[effectNameList[w]];let m=effectMeshPool[w];let pa=effectInstancePools[w];effectMeshPool[w].instanceMatrix.afCJVYrCGK=true;if(typeConfig.updateFrequency!==undefined){m.updateTick+=frameDeltaMs;if(m.updateTick<typeConfig.updateFrequency){continue;}m.updateTick=0;}for(var x=0;x<m.count;x++){let p=pa[x];if(effectUpdateCallbacks[w](p,x)){m.count--;pa[x]=pa[m.count];pa[m.count]=p;pa[x].index=x;m.offsets[x*2]=m.offsets[m.count*2];m.zaCEeRAJY[x]=m.zaCEeRAJY[m.count];p.index=m.count;pa[x].matrixUpdate=true;x--;}else{if(p.matrixUpdate&&!p.neverUpdateMatrix){p.updateMatrix();effectMeshPool[w].setMatrixAt(x,p.matrix);p.matrixUpdate=p.alwaysUpdateMatrix;}}}}animateGrassSway();skyboxMesh[rotationKey].y+=1/20000*frameDeltaMs/4;}
// __UNIT__ u2482 [2548834,2549341) kind=function len=692
function orientTracerEffect(effectNode,segStart,segEnd,beamLength,intensityScale){var azO=stringDecoderAlias;intensityScale==undefined&&(intensityScale=0x1);var a3t=effectNode;effectNode=effectNode["parent"],effectNode["position"]["MAthzYJPxG"](segStart,segEnd),effectNode['position']['OpiuFvBcQd'](0.5),effectNode["JoIkrtRxhZ"](segEnd),effectNode["scale"]['z']=beamLength/0x8,effectNode["updateMatrix"](),a3t['m1']['copy'](effectNode['matrix']),a3t["oZzvWrXBEG"]["updateMatrix"](),a3t['m1']['multiply'](a3t['oZzvWrXBEG']['matrix']),a3t["mesh"]['offsets'][a3t['index']*0x2]=Math['random'](),a3t["mesh"]['zaCEeRAJY'][a3t["index"]]=effectNode["scale"]['z']/0x3*intensityScale*a3t['zaCEeRAJY'];}
// __UNIT__ u2483 [2549341,2549416) kind=var len=99
var VN=0x50,movementXKey=decodeByteString([-0x63,-0x65,-0x6c,-0x5b,-0x63,-0x5b,-0x64,-0x6a,-0x4e]);
// __UNIT__ u2486 [2550464,2550480) kind=var len=53
var adsZoomInterpolator=new makeLinearInterpolator();
// __UNIT__ u2488 [2550522,2550532) kind=var len=31
var crosshairMaterialParams={};
// __UNIT__ u2489 [2550532,2550553) kind=expr len=42
crosshairMaterialParams['color']=0xffffff;
// __UNIT__ u2492 [2550828,2550839) kind=var len=24
var crosshairSpread=0.5;
// __UNIT__ u2493 [2550839,2551059) kind=function len=371
function setCrosshairSpread(orbitRadius){crosshairSpread=orbitRadius;for(var childIndex=0x0;childIndex<crosshairBarGroup['children']['length'];childIndex++){var childNode=crosshairBarGroup['children'][childIndex];childNode['position']['x']=Math['cos'](childIndex*Math['PI']/0x2)*orbitRadius,childNode['position']['y']=Math['sin'](childIndex*Math['PI']/0x2)*orbitRadius;}}
// __UNIT__ u2494 [2551059,2551066) kind=expr len=36
setCrosshairSpread(crosshairSpread);
// __UNIT__ u2495 [2551066,2551077) kind=var len=11
var W1=0x0;
// __UNIT__ u2496 [2551077,2551103) kind=function len=62
function playSoundEffect(soundKey){playCachedSound(soundKey);}
// __UNIT__ u2497 [2551103,2551115) kind=var len=12
var W3=!![];
// __UNIT__ u2498 [2551115,2551133) kind=expr len=34
menuContentWrapper["opacity"]=0x0;
// __UNIT__ u2501 [2554096,2554108) kind=var len=24
var deathFadeTimer=-0x1;
// __UNIT__ u2502 [2554108,2554150) kind=expr len=55
![]&&setTimeout(function(){triggerGameOver();},0x1388);
// __UNIT__ u2504 [2554277,2554370) kind=function len=240
function lerpSnapshotValue(startVal,endVal){if(entitySnapshotAgeMs>snapshotIntervalMs+0x5)return(endVal-startVal)/snapshotIntervalMs*(snapshotIntervalMs+0x5)+startVal;return(endVal-startVal)/snapshotIntervalMs*entitySnapshotAgeMs+startVal;}
// __UNIT__ u2505 [2554370,2554505) kind=function len=158
function distanceXZ(a3o,a3p){var azT=stringDecoderAlias;return Math["sqrt"]((a3o['x']-a3p['x'])*(a3o['x']-a3p['x'])+(a3o['z']-a3p['z'])*(a3o['z']-a3p['z']));}
// __UNIT__ u2507 [2554603,2554678) kind=function len=155
function addTimedWorldObject(scheduledTask){scheduledTask['ticksLeft']=0xa*0x1e,worldScene['add'](scheduledTask),timedWorldObjects['push'](scheduledTask);}
// __UNIT__ u2508 [2554678,2554753) kind=var len=183
var BYTE_PER_RADIAN=0x80/Math['PI'],RADIAN_PER_BYTE=0x1/BYTE_PER_RADIAN,fireTriggerHeld=![],fireReleasePending=![],shootKeyHeld=![],adsKeyHeld=![],triggerRearmed=!![],keyNameTable={};
// __UNIT__ u2509 [2554753,2556130) kind=expr len=2331
keyNameTable['8']='Backspace',keyNameTable['9']="Tab",keyNameTable['13']='Enter',keyNameTable['16']='Shift',keyNameTable['17']='Ctrl',keyNameTable['18']='Alt',keyNameTable['19']='Pause/Break',keyNameTable['20']='Capslock',keyNameTable['27']="Escape",keyNameTable['32']='Space',keyNameTable['33']='Page\x20Up',keyNameTable['34']='Page\x20Down',keyNameTable['35']='End',keyNameTable['36']='Home',keyNameTable['37']='Left',keyNameTable['38']='Up',keyNameTable['39']="Right",keyNameTable['40']="Down",keyNameTable['43']='+',keyNameTable['44']='Print\x20Screen',keyNameTable['45']='Insert',keyNameTable['46']='Delete',keyNameTable['48']='0',keyNameTable['49']='1',keyNameTable['50']='2',keyNameTable['51']='3',keyNameTable['52']='4',keyNameTable['53']='5',keyNameTable['54']='6',keyNameTable['55']='7',keyNameTable['56']='8',keyNameTable['57']='9',keyNameTable['59']=';',keyNameTable['61']='=',keyNameTable['65']='A',keyNameTable['66']='B',keyNameTable['67']='C',keyNameTable['68']='D',keyNameTable['69']='E',keyNameTable['70']='F',keyNameTable['71']='G',keyNameTable['72']='H',keyNameTable['73']='I',keyNameTable['74']='J',keyNameTable['75']='K',keyNameTable['76']='L',keyNameTable['77']='M',keyNameTable['78']='N',keyNameTable['79']='O',keyNameTable['80']='P',keyNameTable['81']='Q',keyNameTable['82']='R',keyNameTable['83']='S',keyNameTable['84']='T',keyNameTable['85']='U',keyNameTable['86']='V',keyNameTable['87']='W',keyNameTable['88']='X',keyNameTable['89']='Y',keyNameTable['90']='Z',keyNameTable['106']='*',keyNameTable['107']='+',keyNameTable['109']='-',keyNameTable["110"]='.',keyNameTable["111"]='/',keyNameTable['112']='f1',keyNameTable["113"]='f2',keyNameTable['114']='f3',keyNameTable['115']='f4',keyNameTable['116']='f5',keyNameTable["117"]='f6',keyNameTable["118"]='f7',keyNameTable['119']='f8',keyNameTable['120']='f9',keyNameTable['121']='f10',keyNameTable['122']='f11',keyNameTable['123']="f12",keyNameTable['144']='Num\x20Lock',keyNameTable["145"]='Scroll\x20Lock',keyNameTable['186']=';',keyNameTable["187"]='=',keyNameTable['188']=',',keyNameTable['189']='-',keyNameTable['190']='.',keyNameTable["191"]='/',keyNameTable['192']='',keyNameTable["219"]='[',keyNameTable['220']='\x5c',keyNameTable['221']=']',keyNameTable["222"]='\x27',keyCodeLabelTable=keyNameTable,keyCodeLabelTable[0xc0]=decodeByteString([-0x56]);
// __UNIT__ u2510 [2556130,2556188) kind=for len=108
for(var loopIndex=0x0;loopIndex<0x14;loopIndex++){keyCodeLabelTable[0x12c+loopIndex]='Mouse\x20'+loopIndex;}
// __UNIT__ u2511 [2556188,2556208) kind=var len=73
var keyCodeKeyList=getObjectKeys(keyCodeLabelTable),keyLabelToCodeMap={};
// __UNIT__ u2512 [2556208,2556276) kind=for len=169
for(var loopIndex=0x0;loopIndex<keyCodeKeyList['length'];loopIndex++){keyLabelToCodeMap[keyCodeLabelTable[keyCodeKeyList[loopIndex]]]=Number(keyCodeKeyList[loopIndex]);}
// __UNIT__ u2513 [2556276,2556286) kind=var len=21
var keyBindingMap={};
// __UNIT__ u2514 [2556286,2556544) kind=expr len=412
keyBindingMap['up']='W',keyBindingMap["down"]='S',keyBindingMap["left"]='A',keyBindingMap['right']='D',keyBindingMap['space']='Space',keyBindingMap['HpsuHliFMHL']='Shift',keyBindingMap["hRdQS9697"]='R',keyBindingMap['chat']="Enter",keyBindingMap['pause']="Escape",keyBindingMap["leaderboard"]='Tab',keyBindingMap['ads']='L',keyBindingMap['shoot']='K',keyBindingMap['MFUoomFzxq']='C',keyBindingMap['inspect']='F';
// __UNIT__ u2515 [2556544,2556554) kind=var len=37
var keyBindingMapAlias=keyBindingMap;
// __UNIT__ u2516 [2556554,2556584) kind=expr len=61
fullscreenEnabled&&(keyBindingMapAlias['MFUoomFzxq']='Ctrl');
// __UNIT__ u2517 [2556584,2556641) kind=if len=57
if(window["location"]!=window["par"+"ent"]['location']){}
// __UNIT__ u2518 [2556641,2556704) kind=expr len=79
window['location']['host']=="127.0.0.1:8080"&&(keyBindingMapAlias['ads']='f7');
// __UNIT__ u2522 [2556773,2556792) kind=var len=64
var neutralInputState=new makeBaseInputState(),resetKeyNameList;
// __UNIT__ u2525 [2557710,2557744) kind=var len=51
var blockedCtrlKeyCodes=[0x53,0x57,0x44,0x46,0x74];
// __UNIT__ u2526 [2557744,2557773) kind=expr len=51
(isHttps||!![])&&blockedCtrlKeyCodes["push"](0x52);
// __UNIT__ u2527 [2557773,2557818) kind=var len=75
var scrollPreventKeys=["ArrowUp",'ArrowDown','\x20'],spaceRespawnLatch=![];
// __UNIT__ u2529 [2559937,2559948) kind=var len=15
var isDead=![];
// __UNIT__ u2530 [2559948,2560436) kind=expr len=617
documentBody['requestFullscreen']=documentBody["requestFullscreen"]||documentBody['webkitRequestFullscreen']||documentBody['msRequestFullscreen'],documentBody["dqegDqxsC"]=documentBody['requestFullscreen'],documentBody["requestFullscreen"]=function(){var azX=stringDecoderAlias;try{if(isIPad)return;document["fullscreenElement"]==null&&document['webkitFullscreenElement']==null&&document["msFullscreenElement"]==null&&(mouseInputHandler["ignoreNextInput"]=!![],documentBody['dqegDqxsC'](),isMobilePhone&&screen['orientation']['lock']!=undefined&&screen['orientation']['lock']("landscape"),isDead=!![]);}catch(a3o){}};
// __UNIT__ u2531 [2560436,2560453) kind=var len=31
var lastAdsToggleMs=getNowMs();
// __UNIT__ u2532 [2560453,2560714) kind=function len=408
function engageAdsAim(){var azY=stringDecoderAlias;if(localPlayer['zBgadyCVYk']==undefined)return;toggleAds?Math['abs'](frameTimestampMs-lastAdsToggleMs)>0x64&&(localPlayer["d2J6H770A10"]=!localPlayer["d2J6H770A10"],localPlayer['zBgadyCVYk']['OUsPgMLOT']=!localPlayer["zBgadyCVYk"]['OUsPgMLOT'],lastAdsToggleMs=frameTimestampMs):(localPlayer["d2J6H770A10"]=!![],localPlayer["zBgadyCVYk"]['OUsPgMLOT']=!![]);}
// __UNIT__ u2533 [2560714,2560842) kind=function len=190
function disengageAdsAim(){var azZ=stringDecoderAlias;if(localPlayer['zBgadyCVYk']==undefined)return;!toggleAds&&(localPlayer["d2J6H770A10"]=![],localPlayer['zBgadyCVYk']["OUsPgMLOT"]=![]);}
// __UNIT__ u2535 [2560881,2560889) kind=if len=24
if(unadjustedMovement){}
// __UNIT__ u2536 [2560889,2561061) kind=function len=200
function isPointerLocked(){var aA0=stringDecoderAlias;if(document["pointerLockElement"]!=null||document['msPointerLockElement']!=null||document["webkitPointerLockElement"]!=null)return!![];return![];}
// __UNIT__ u2539 [2561937,2562080) kind=expr len=187
acquirePointerLock=requestPointerLockWithFallback,document["exitPointerLock"]=document["exitPointerLock"]||document["mozExitPointerLock"]||document['webkitExitPointerLock']||function(){};
// __UNIT__ u2543 [2563189,2563209) kind=expr len=39
aimCameraRig["xlUBzfMxe"](worldCamera);
// __UNIT__ u2545 [2563247,2563261) kind=expr len=32
uiSceneHolder["add"](ui3DScene);
// __UNIT__ u2547 [2563301,2563329) kind=expr len=67
worldCamera['add'](weaponMountNode),aimCameraRig['add'](aimCamera);
// __UNIT__ u2550 [2563479,2563597) kind=var len=356
var aimSensitivityUnit=0x1/0x320,baseAimSensitivity=0x1/0.7,currentAimSensitivity=aimSensitivityUnit*baseAimSensitivity,adsSensitivityMultiplier=0x1,adsAimSensitivity=baseAimSensitivity*adsSensitivityMultiplier,adsZoomMin=0x1,weaponZoomFactor=2.1,playerPitchAngle=0x0,X8=new uiToolkit[("vFgdYWoMXeQ")](),lastDeathLookInputMs=0x0,ignoreDeathLookSpikes=!![];
// __UNIT__ u2551 [2563597,2563651) kind=function len=222
function applyBaseSensitivity(newBaseSensitivity){var aspectRatio=currentAimSensitivity/baseAimSensitivity;baseAimSensitivity=newBaseSensitivity,currentAimSensitivity=aspectRatio*baseAimSensitivity,recalcAdsSensitivity();}
// __UNIT__ u2553 [2563754,2563803) kind=function len=77
function lookInputGate(){if(transitionFadeFactor<0.05)return 0x0;return 0x1;}
// __UNIT__ u2554 [2563803,2563834) kind=var len=55
var lookSwayAccumulator=new uiToolkit['vFgdYWoMXeQ']();
// __UNIT__ u2555 [2563834,2563870) kind=expr len=70
lookSwayAccumulator["nrnoFjnKP"]=lookSwayAccumulator['rUAZVLknP']=0x0;
// __UNIT__ u2556 [2563870,2563881) kind=var len=26
var lookSwayDirtyFlag=![];
// __UNIT__ u2557 [2563881,2564007) kind=expr len=170
document['addEventListener']('keydown',function(keyEvent){handleKeyEvent(keyEvent);}),document['addEventListener']('keyup',function(keyEvent){handleKeyEvent(keyEvent);});
// __UNIT__ u2558 [2564007,2564018) kind=var len=30
var renderResolutionScale=0x1;
// __UNIT__ u2560 [2564094,2564116) kind=var len=36
var weaponModelSlots=new Array(0x5);
// __UNIT__ u2562 [2565248,2565255) kind=var len=23
var resizeGameRenderer;
// __UNIT__ u2565 [2566669,2566676) kind=expr len=34
resizeGameRenderer(webglRenderer);
// __UNIT__ u2566 [2566676,2566696) kind=var len=56
var resizeDebounceDelayMs=0x23,resizeDebounceTimer=null;
// __UNIT__ u2567 [2566696,2566815) kind=expr len=216
window['addEventListener']('resize',function(){resizeDebounceTimer!=null&&clearTimeout(resizeDebounceTimer),resizeDebounceTimer=setTimeout(function(){resizeGameRenderer(webglRenderer);},resizeDebounceDelayMs);},![]);
// __UNIT__ u2568 [2566815,2566974) kind=expr len=256
window['visualViewport']&&window['visualViewport']['addEventListener']("resize",function(){resizeDebounceTimer!=null&&clearTimeout(resizeDebounceTimer),resizeDebounceTimer=setTimeout(function(){resizeGameRenderer(webglRenderer);},resizeDebounceDelayMs);});
// __UNIT__ u2570 [2567285,2567413) kind=function len=157
function cloneArrayBuffer(a3o){var aAa=stringDecoderAlias,a3p=new ArrayBuffer(a3o["byteLength"]);return new Uint8Array(a3p)['set'](new Uint8Array(a3o)),a3p;}
// __UNIT__ u2572 [2568303,2568475) kind=function len=302
function recoilKickEnvelope(easeTime){if(easeTime==-0x1)return 0x0;easeTime/=0x2;var easeResult,easeSplit=0.12;return easeTime<easeSplit?easeResult=easingFunctions['easeOutQuad'](easeTime/easeSplit):easeResult=0x1-easingFunctions['easeOutElastic']((easeTime-easeSplit)/(0x1-easeSplit)),easeResult/1.8;}
// __UNIT__ u2573 [2568475,2568613) kind=function len=216
function crosshairSpreadDecay(falloffInput){var aAe=stringDecoderAlias;if(falloffInput<0x0)return 0x0;falloffInput*=2.5;if(falloffInput>0x2)return 0x0;var a3p=(0x2-falloffInput)*0.88;return Math["sin"](a3p*a3p)/1.7;}
// __UNIT__ u2574 [2568613,2568743) kind=function len=165
function attachAwpScope(parent,child){if(parent==undefined||child==undefined||parent['awp']!=undefined)return;parent['awp']=child,parent['uMpvMUJct']['add'](child);}
// __UNIT__ u2579 [2569112,2569119) kind=var len=7
var XD;
// __UNIT__ u2581 [2569435,2569465) kind=var len=87
var activeMixerList=[],spareStateSlotXG=0x0,spareStateSlotXH=0x0,pendingEntityQueue=[];
// __UNIT__ u2582 [2569465,2569509) kind=for len=81
for(var loopIndex=0x0;loopIndex<0x5;loopIndex++){pendingEntityQueue['push']([]);}
// __UNIT__ u2583 [2569509,2569519) kind=var len=25
var pendingCloneQueue={};
// __UNIT__ u2584 [2569519,2569592) kind=function len=119
function addCachedWeaponClone(a3o,a3p){var aAh=stringDecoderAlias,a3q=weaponMeshCache[a3o]['clone']();a3p["add"](a3q);}
// __UNIT__ u2585 [2569592,2569924) kind=function len=640
function flushPendingWeaponClones(){var aAi=stringDecoderAlias,assetKeys=Object['keys'](pendingCloneQueue);for(var assetKeyIdx=0x0;assetKeyIdx<assetKeys['length'];assetKeyIdx++){if(weaponMeshCache[assetKeys[assetKeyIdx]]!==undefined&&pendingCloneQueue[assetKeys[assetKeyIdx]]!=null&&pendingCloneQueue[assetKeys[assetKeyIdx]]!=undefined){for(var itemIdx=0x0;itemIdx<pendingCloneQueue[assetKeys[assetKeyIdx]]['length'];itemIdx++){var a3r=pendingCloneQueue[assetKeys[assetKeyIdx]][itemIdx];addCachedWeaponClone(assetKeys[assetKeyIdx],a3r),a3r["onload"]&&a3r["onload"](a3r),a3r['loaded']=!![];}pendingCloneQueue[assetKeys[assetKeyIdx]]=null;}}}
// __UNIT__ u2588 [2571756,2572032) kind=function len=449
function updateEntityNametag(nametagEntity,nametagText){var aAn=stringDecoderAlias;if(nametagEntity==null||nametagEntity==undefined||nametagText==undefined||nametagEntity['threeNametag']==undefined)return;nametagEntity['threeNametag']["FySNkXPfbF"](nametagText,nametagEntity['PhbhpxFxPP'],localTeamId),nametagEntity["PhbhpxFxPP"]==localTeamId&&localTeamId!=0x0?nametagEntity["r23ZS3L2g"]["PUYitUjkOj"]():nametagEntity["r23ZS3L2g"]['oRdkBpYPvUp']();}
// __UNIT__ u2589 [2572032,2572218) kind=function len=302
function tweenOpacityToTarget(fadeTarget){var aAo=stringDecoderAlias;fadeTarget['actualOpacity']!=fadeTarget['EafIbhzQZQ']&&(cancelTween(fadeTarget,'opacity'),tweenProperty(fadeTarget,"opacity",fadeTarget['opacity'],fadeTarget['EafIbhzQZQ'],0xfa),fadeTarget["actualOpacity"]=fadeTarget['EafIbhzQZQ']);}
// __UNIT__ u2598 [2582638,2582661) kind=expr len=37
awpHipOffsetBias['OpiuFvBcQd'](0.15);
// __UNIT__ u2600 [2582725,2583006) kind=expr len=372
previewImageMap["smg"]='weapons/vector/vectorcomp.webp',previewImageMap['female']='character/female.webp',previewImageMap['ar']="weapons/ar2/arcomp.webp",previewImageMap['rookie']='character/rookie.webp',previewImageMap['awp']='weapons/awp/newawpcomp.webp',previewImageMap['tuxedo']='character/tuxedo.webp',previewImageMap['shotgun']='weapons/shotgun/sh'+'otguncomp.webp';
// __UNIT__ u2601 [2583006,2583016) kind=var len=38
var weaponMaterialMap=previewImageMap;
// __UNIT__ u2602 [2583016,2583345) kind=if len=355
if(isMobilePhone){var Ya={};Ya['smg']="weapons/vector/vectorcompmobile.webp",Ya["female"]='character/female.webp',Ya['ar']='weapons/ar2/arcompmobile.webp',Ya['rookie']="character/rookie.webp",Ya['awp']='weapons/awp/newawpcompmobile.webp',Ya["tuxedo"]='character/tuxedo.webp',Ya['shotgun']="weapons/shotgun/sh"+"otguncompmobile.webp",weaponMaterialMap=Ya;}
// __UNIT__ u2603 [2583345,2583405) kind=expr len=75
weaponMaterialMap["shotgunpl"+'ayer']='character/sh'+"otgunpla"+"yer.webp";
// __UNIT__ u2604 [2583405,2583431) kind=var len=58
var weaponMaterialNames=Object["keys"](weaponMaterialMap);
// __UNIT__ u2607 [2586846,2586907) kind=var len=84
var touchendKey=decodeByteString([-0x6a,-0x65,-0x6b,-0x59,-0x5e,-0x5b,-0x64,-0x5a]);
// __UNIT__ u2608 [2586907,2586990) kind=function len=172
function renderSkinPreviewSeeded(previewSkin,previewWeapon,seedValue){return renderWeaponSkinPreview(previewSkin,previewWeapon,~(Math['floor'](seedValue*0x2710)^0x22f41));}
// __UNIT__ u2609 [2586990,2586997) kind=var len=25
var defaultRigAnimations;
// __UNIT__ u2611 [2589556,2589661) kind=var len=149
var changedTouchesKey=decodeByteString([-0x59,-0x5e,-0x57,-0x64,-0x5d,-0x5b,-0x5a,-0x4a,-0x65,-0x6b,-0x59,-0x5e,-0x5b,-0x69]),useCompressedRigs=!![];
// __UNIT__ u2612 [2589661,2589900) kind=function len=281
function getRigAssetUrl(a3o){var aAI=stringDecoderAlias;if(a3o=="tuxedo")return "character/tuxedonew.glb";if(a3o=="shotgunplayer")return'character/compressed/shotgunpla'+"yerout.gltf";if(useCompressedRigs)return'character/compressed/'+a3o+'out.gltf';return'character/'+a3o+'.glb';}
// __UNIT__ u2613 [2589900,2589923) kind=var len=77
var loadedPlayerRigCount=0x0,untexturedRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2614 [2589923,2590122) kind=expr len=325
untexturedRigLoader["load"](getRigAssetUrl("rigged_untextured"),function(a3o,a3p){var aAJ=stringDecoderAlias;untexturedRigLoader['dracoLoader']["dispose"](),untexturedRigLoader['dracoLoader']=null,finalizePlayerRig(a3o,0x1),loadedPlayerRigCount++;},undefined,function(a3o){var aAK=stringDecoderAlias;console["error"](a3o);});
// __UNIT__ u2615 [2590122,2590138) kind=var len=48
var tuxedoRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2616 [2590138,2590314) kind=expr len=275
tuxedoRigLoader["load"](getRigAssetUrl('tuxedo'),function(a3o,a3p){tuxedoRigLoader['dracoLoader']['dispose'](),tuxedoRigLoader['dracoLoader']=null,finalizePlayerRig(a3o,0x2),loadedPlayerRigCount++;},undefined,function(a3o){var aAL=stringDecoderAlias;console["error"](a3o);});
// __UNIT__ u2617 [2590314,2590330) kind=var len=48
var femaleRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2618 [2590330,2590524) kind=expr len=308
femaleRigLoader["load"](getRigAssetUrl("femalerigged"),function(a3o,a3p){var aAM=stringDecoderAlias;femaleRigLoader["dracoLoader"]['dispose'](),femaleRigLoader['dracoLoader']=null,finalizePlayerRig(a3o,0x0),loadedPlayerRigCount++;},undefined,function(a3o){var aAN=stringDecoderAlias;console["error"](a3o);});
// __UNIT__ u2619 [2590524,2590540) kind=var len=49
var shotgunRigLoader=createDracoGltfLoader(!![]);
// __UNIT__ u2620 [2590540,2590723) kind=expr len=307
shotgunRigLoader['load'](getRigAssetUrl('shotgunplayer'),function(loadedAsset,unusedArg){shotgunRigLoader['dracoLoader']['dispose'](),shotgunRigLoader['dracoLoader']=null,finalizePlayerRig(loadedAsset,0x3),loadedPlayerRigCount++;},undefined,function(a3o){var aAO=stringDecoderAlias;console["error"](a3o);});
// __UNIT__ u2623 [2592266,2592300) kind=var len=60
var envmapTexture=loadTextureCached('textures/envmap.webp');
// __UNIT__ u2625 [2593715,2593758) kind=var len=56
var defaultAoCanvas=document['createElement']('canvas');
// __UNIT__ u2626 [2593758,2593787) kind=expr len=55
defaultAoCanvas['width']=defaultAoCanvas['height']=0x1;
// __UNIT__ u2627 [2593787,2593817) kind=var len=57
var defaultAoContext=defaultAoCanvas['getContext']('2d');
// __UNIT__ u2628 [2593817,2593872) kind=expr len=83
defaultAoContext["fillStyle"]='#777',defaultAoContext['fillRect'](0x0,0x0,0x1,0x1);
// __UNIT__ u2630 [2593917,2594196) kind=function len=424
function collectWorldGeometries(sceneNode,geometryList){var aB1=stringDecoderAlias;geometryList==undefined&&(geometryList=[]);if(sceneNode['RNQDluasaN']!==undefined){var a3q=sceneNode["RNQDluasaN"]['clone']();a3q['GdTYEgIav'](sceneNode['matrixWorld']),geometryList['push'](a3q);}for(var a3r=0x0;a3r<sceneNode['children']["length"];a3r++){collectWorldGeometries(sceneNode['children'][a3r],geometryList);}return geometryList;}
// __UNIT__ u2631 [2594196,2594207) kind=var len=33
var mapContentGroupPreexists=![];
// __UNIT__ u2632 [2594207,2594241) kind=expr len=69
typeof mapContentGroup!='undefined'&&(mapContentGroupPreexists=!![]);
// __UNIT__ u2634 [2594281,2594295) kind=expr len=42
worldScene['add'](skyboxTransparentGroup);
// __UNIT__ u2636 [2594335,2594365) kind=expr len=64
mapContentGroup['mixers']=[],worldScene["add"](mapContentGroup);
// __UNIT__ u2638 [2594405,2594444) kind=expr len=81
animatedObjectGroup['animatedObjects']=[],worldScene['add'](animatedObjectGroup);
// __UNIT__ u2639 [2594444,2594451) kind=var len=22
var occlusionCellData;
// __UNIT__ u2641 [2595343,2595427) kind=function len=237
function notifyLightmapLoaded(loadRequestId){if(loadRequestId!=undefined&&loadRequestId!==mapLoadRequestId)return;loadedTextureCount++,loadedTextureCount>=neededTextureCount&&neededTextureCount>0x0&&isMapLoadFinished&&finalizeMapLoad();}
// __UNIT__ u2642 [2595427,2595463) kind=var len=111
var useKtx2Lightmap=!![],useSmallLightmap=![],ktx2LoaderInstance,ktx2InitAttempted=![],ktx2FormatSupported=![];
// __UNIT__ u2644 [2596038,2596083) kind=function len=98
function isKtx2Ready(){return getKtx2Loader(),ktx2LoaderInstance!=undefined&&ktx2FormatSupported;}
// __UNIT__ u2646 [2596240,2596373) kind=for len=250
for(var loopIndexHv=0x0;loopIndexHv<hardpointMarkerGeometry["faces"]['length'];loopIndexHv++){Math['abs'](hardpointMarkerGeometry["faces"][loopIndexHv]['normal']['y'])>0.5&&(hardpointMarkerGeometry['faces']['splice'](loopIndexHv,0x1),loopIndexHv--);}
// __UNIT__ u2648 [2596419,2596495) kind=function len=157
function teamIdToColor(teamId){if(teamId==localTeamId)return localTeamColor;else return teamId==0x0?neutralTeamColor:enemyTeamColor;return neutralTeamColor;}
// __UNIT__ u2650 [2597072,2597088) kind=var len=51
var mapTextureCache={},defaultAmbientAudioEntry={};
// __UNIT__ u2651 [2597088,2597175) kind=expr len=153
defaultAmbientAudioEntry['directional']=![],defaultAmbientAudioEntry["fullFilename"]=!![],defaultAmbientAudioEntry['file']="audio/industry_ambient2.mp3";
// __UNIT__ u2652 [2597175,2597193) kind=var len=74
var defaultPositionalAudioList=[defaultAmbientAudioEntry],mapLightList=[];
// __UNIT__ u2653 [2597193,2597235) kind=function len=71
function loadNeonMap(){var aB4=stringDecoderAlias;loadMap("neon",0x0);}
// __UNIT__ u2655 [2643629,2643639) kind=var len=26
var cameraTrackVectors=[];
// __UNIT__ u2657 [2643731,2643741) kind=var len=28
var grayscaleCanvasCache={};
// __UNIT__ u2658 [2643741,2644033) kind=function len=327
function applyGrayscaleToCanvas(a3o,a3p){var aBC=stringDecoderAlias,a3q=a3p['getImageData'](0x0,0x0,a3o["width"],a3o["height"]),a3r=a3q["data"];for(var a3s=0x0;a3s<a3r["length"];a3s+=0x4){var a3t=0.34*a3r[a3s]+0.5*a3r[a3s+0x1]+0.16*a3r[a3s+0x2];a3r[a3s]=a3t,a3r[a3s+0x1]=a3t,a3r[a3s+0x2]=a3t;}a3p['putImageData'](a3q,0x0,0x0);}
// __UNIT__ u2659 [2644033,2644528) kind=function len=841
function tileImage2x2ToScratchCanvas(a3o){var aBD=stringDecoderAlias,a3p=a3o["image"];scratchCanvasElement=document['createElement']('canvas'),scratchCanvasElement['width']=a3p['width']*0x2,scratchCanvasElement["height"]=a3p['height']*0x2;var a3q=scratchCanvasElement['getContext']('2d');a3q['drawImage'](a3p,0x0,0x0,scratchCanvasElement["width"]/0x2,scratchCanvasElement['height']/0x2),a3q["drawImage"](a3p,scratchCanvasElement["width"]/0x2,0x0,scratchCanvasElement['width']/0x2,scratchCanvasElement["height"]/0x2),a3q['drawImage'](a3p,0x0,scratchCanvasElement['height']/0x2,scratchCanvasElement['width']/0x2,scratchCanvasElement['height']/0x2),a3q['drawImage'](a3p,scratchCanvasElement['width']/0x2,scratchCanvasElement["height"]/0x2,scratchCanvasElement["width"]/0x2,scratchCanvasElement['height']/0x2),a3o['image']=scratchCanvasElement;}
// __UNIT__ u2660 [2644528,2644825) kind=function len=396
function cloneCanvasResized(drawSource,snapSize){var aBE=stringDecoderAlias,a3q=document['createElement']('canvas');a3q['width']=drawSource["width"],a3q["height"]=drawSource["height"];snapSize&&(a3q['width']=floorToPowerOfTwo(a3q['width']),a3q['height']=floorToPowerOfTwo(a3q['height']));var a3r=a3q['getContext']('2d');return a3r["drawImage"](drawSource,0x0,0x0,a3q['width'],a3q['height']),a3q;}
// __UNIT__ u2661 [2644825,2644836) kind=var len=27
var prevGamepadButtons=0x0;
// __UNIT__ u2662 [2644836,2645094) kind=function len=367
function cloneCanvasToSquarePot(canvasImageSrc){var aBF=stringDecoderAlias,a3p=document['createElement']('canvas');a3p['width']=Math["max"](floorToPowerOfTwo(canvasImageSrc['width']),floorToPowerOfTwo(canvasImageSrc['height'])),a3p["height"]=a3p['width'];var a3q=a3p['getContext']('2d');return a3q["drawImage"](canvasImageSrc,0x0,0x0,a3p['width'],a3p["height"]),a3p;}
// __UNIT__ u2663 [2645094,2645133) kind=function len=52
function isPowerOfTwoInt(num){return!(num&num-0x1);}
// __UNIT__ u2664 [2645133,2645260) kind=function len=157
function floorToPowerOfTwo(a3o){var aBG=stringDecoderAlias;for(var a3p=Math["pow"](0x2,0xe);a3p>0x2;a3p=a3p>>>0x1){if((a3o&a3p)==a3p)return a3p;}return 0x1;}
// __UNIT__ u2665 [2645260,2645372) kind=function len=169
function replaceImageWithResizedClone(a3o){var aBH=stringDecoderAlias,a3p=cloneCanvasResized(a3o["image"],!![]),a3q=a3o['image']['src'];a3o["image"]=a3p,a3p["src"]=a3q;}
// __UNIT__ u2666 [2645372,2645382) kind=var len=26
var aoMaterialRegistry=[];
// __UNIT__ u2668 [2646122,2646155) kind=var len=54
var pendingLookDelta=new uiToolkit[("vFgdYWoMXeQ")]();
// __UNIT__ u2670 [2649504,2649991) kind=function len=653
function applyPaintedTextureStyle(paintTexture,paintLevel){var aBM=stringDecoderAlias;return;if(paintTexture['painted'])return;paintTexture['painted']=!![];var a3q=paintTexture["image"],a3r=paintTexture["src"],a3s=0x2;paintLevel==undefined&&(paintLevel=0x3);if(paintTexture['image']['width']>=0x400){}a3r["indexOf"]("CleanRedBrick")!=-0x1&&(a3s=0x4);var a3t=typeof performance!='undefined'&&performance!=null&&performance['now']!=undefined?performance['now']():null;paintTexture['image']=applyPostProcessEffects(a3q,['render','paint','sepia','sharpen'],0x1,paintLevel),a3t!=null&&(paintAccumMs+=performance["now"]()-a3t),paintTexture["anisotropy"]=0x2;}
// __UNIT__ u2672 [2650907,2651063) kind=function len=258
function tintClonedSprite(cloneTarget,secondArg,thirdArg,fourthArg,fifthArg){var argCount=arguments['length'],argsCopy=[];while(argCount--)argsCopy[argCount]=arguments[argCount];argsCopy[0x0]=argsCopy[0x0]['clone'](),tintSpriteImage['apply'](null,argsCopy);}
// __UNIT__ u2674 [2651680,2651706) kind=var len=47
var discSpriteSource=new uiToolkit['object']();
// __UNIT__ u2675 [2651706,2651759) kind=expr len=74
discSpriteSource["add"](new uiToolkit['circle'](0x0,0x0,0x32,'#FFF',0.4));
// __UNIT__ u2676 [2651759,2651843) kind=var len=164
var discSprite=uiToolkit['pANxEEFMRM'](discSpriteSource,0x80,0x80,0x28),discSpriteCanvas=discSprite['image'],discSpriteContext=discSpriteCanvas["getContext"]('2d');
// __UNIT__ u2680 [2653186,2653237) kind=var len=75
var offscreenCanvas=document['createElement']('canvas'),skyboxTexture=null;
// __UNIT__ u2682 [2653534,2653544) kind=var len=24
var skyboxMapUniform={};
// __UNIT__ u2683 [2653544,2653559) kind=expr len=40
skyboxMapUniform["value"]=skyboxTexture;
// __UNIT__ u2684 [2653559,2653569) kind=var len=22
var skyboxUniforms={};
// __UNIT__ u2685 [2653569,2653582) kind=expr len=39
skyboxUniforms['map']=skyboxMapUniform;
// __UNIT__ u2686 [2653582,2653592) kind=var len=21
var skyboxDefines={};
// __UNIT__ u2687 [2653592,2653612) kind=expr len=31
skyboxDefines["MULT_VALUE"]='';
// __UNIT__ u2689 [2653788,2653847) kind=expr len=111
skyboxMesh['material']=skyboxMaterial,applySkyboxTexture('textures/skybox.webp'),worldScene["add"](skyboxMesh);
// __UNIT__ u2690 [2653847,2653873) kind=var len=66
var vlitagAdsEnabled=![],venatusAdsEnabled=!![],useDomOverlay=![];
// __UNIT__ u2691 [2653873,2653924) kind=expr len=66
location['host']=="beta.de"+'adshot.io'&&(venatusAdsEnabled=!![]);
// __UNIT__ u2692 [2653924,2653938) kind=expr len=34
!isHttps&&(venatusAdsEnabled=![]);
// __UNIT__ u2693 [2653938,2653949) kind=var len=25
var respawnAdsHidden=![];
// __UNIT__ u2694 [2653949,2653958) kind=if len=23
if(!vlitagAdsEnabled){}
// __UNIT__ u2695 [2653958,2654810) kind=if len=1088
if(!isCrazyGames&&!isMobilePhone){if(vlitagAdsEnabled){var injectedScriptElement=document["createElement"]("script");injectedScriptElement['src']="//cdn.vlitag.com/w/173dae6e-1be6-407d-b0f6-7b0abd082594.js",document['head']["appendChild"](injectedScriptElement);var injectedScriptElement=document['createElement']("script");injectedScriptElement["src"]='//cdn.vlitag.com/ata/adv/173dae6e-1be6-407d-b0f6-7b0abd082594.js',document['head']['appendChild'](injectedScriptElement);}else{if(venatusAdsEnabled){var injectedScriptElement=document["createElement"]("script");injectedScriptElement['src']="https://hb.vntsm.com/v4/live/vms/sites/de"+'adshot.io/index.js',document['head']["appendChild"](injectedScriptElement),window["__VM"]=window['__VM']||[],window['__VM']["push"](function(a3o,a3p){var aBR=stringDecoderAlias;try{a3p["Config"]['get']("mpu")['display']('banner-home'),a3p["Config"]['get']("mpu")['display']('banner-home2'),a3p['Config']['get']('mpu')['display']('banner-respawn-1'),a3p["Config"]['get']('mpu')['display']('banner-respawn-2');}catch(a3q){console["error"](a3q);}});}}}
// __UNIT__ u2698 [2654945,2655078) kind=for len=241
for(var loopIndex=0x0;loopIndex<panoramaCylinderGeometry["faces"]['length'];loopIndex++){Math["abs"](panoramaCylinderGeometry['faces'][loopIndex]['normal']['y'])>0.5&&(panoramaCylinderGeometry['faces']["splice"](loopIndex,0x1),loopIndex--);}
// __UNIT__ u2699 [2655078,2655094) kind=var len=71
var panoramaTextureMap,sandPanoramaTexture,mountainsPanoramaTexture,ZS;
// __UNIT__ u2701 [2656602,2656697) kind=var len=150
var ZU=loadTextureWithRetry("textures/mountains.webp",function(a3o){a3o['repeat']['set'](0x3,0x1),mountainsPanoramaTexture=a3o,buildPanoramaMesh();});
// __UNIT__ u2702 [2656697,2656755) kind=expr len=108
loadTextureWithRetry("textures/sand.webp",function(a3o){sandPanoramaTexture=a3o,buildPanoramaMesh();},!![]);
// __UNIT__ u2704 [2656958,2656994) kind=expr len=46
muzzleMountB['position']['set'](0x0,1.1,0.05);
// __UNIT__ u2706 [2657661,2657774) kind=function len=142
function aabbOverlapOnAxis(a3o,a3p,a3q){var aBT=stringDecoderAlias;return a3o["max"][a3q]>=a3p["min"][a3q]&&a3o['min'][a3q]<=a3p["max"][a3q];}
// __UNIT__ u2707 [2657774,2658015) kind=function len=266
function aabbOverlap3D(a3o,a3p){var aBU=stringDecoderAlias;return!(a3o['max']['x']<a3p["min"]['x']||a3o["min"]['x']>a3p["max"]['x']||a3o['max']['y']<a3p["min"]['y']||a3o['min']['y']>a3p['max']['y']||a3o["max"]['z']<a3p['min']['z']||a3o["min"]['z']>a3p["max"]['z']);}
// __UNIT__ u2710 [2658143,2658156) kind=var len=48
var tamperDetectedSnapshot=!!tamperDetectedFlag;
// __UNIT__ u2711 [2658156,2658318) kind=function len=247
function getEntityById(lookupKey){var aBV=stringDecoderAlias;if(localPlayer['MqaFuSJOX']==lookupKey)return localPlayer;for(var a3p=0x0;a3p<entityList['length'];a3p++){if(entityList[a3p]["MqaFuSJOX"]==lookupKey)return entityList[a3p];}return null;}
// __UNIT__ u2712 [2658318,2658456) kind=function len=194
function collectAllPlayerIds(){var aBW=stringDecoderAlias,a3o=[];for(var a3p=0x0;a3p<entityList["length"];a3p++){a3o['push'](entityList[a3p]["MqaFuSJOX"]);}return a3o["push"](selfPlayerId),a3o;}
// __UNIT__ u2713 [2658456,2658618) kind=for len=278
for(var loopIndex=0x0;loopIndex<templateOrder['length'];loopIndex++){var templateEntry=templatesLive[templateOrder[loopIndex]];templateEntry['internalBuffer']=new ArrayBuffer(templateEntry["totalSize"]),templateEntry["internaldv"]=new DataView(templateEntry["internalBuffer"]);}
// __UNIT__ u2717 [2659363,2659493) kind=var len=197
var entityFactoryMap={'ZJqJUhuzUb':function(){var freshPlayerEntity={"vQ5Ra371n0":![],'hhUYpsfkFuA':![],"KWC92ef2Y9":new makeAnimState()};return setupPlayerEntity(freshPlayerEntity,![],![],0x1);}};
// __UNIT__ u2718 [2659493,2659530) kind=function len=79
function createEntityByType(entityType){return entityFactoryMap[entityType]();}
// __UNIT__ u2719 [2659530,2659542) kind=var len=25
var leaderboardDirty=![];
// __UNIT__ u2720 [2659542,2659574) kind=function len=62
function markLeaderboardDirty(){leaderboardDirty=!![];return;}
// __UNIT__ u2721 [2659574,2659716) kind=function len=203
function makeLeaderboardRow(){var statRow={};statRow['Name']='',statRow['K']=0x0,statRow['D']=0x0,statRow['Weapon']='ar',statRow['Ping']=0x0;let resultRow=statRow;return resultRow['HS%']='0%',resultRow;}
// __UNIT__ u2724 [2661527,2661559) kind=var len=71
var a0m=[],entityUpdateReceived=![],syncedSeededRng=new seededRandom();
// __UNIT__ u2726 [2663802,2663956) kind=function len=273
function clearHudFeedback(){var aC5=stringDecoderAlias;damageDirectionIndicator["update"](0x2710),elimBanner['update'](0x2710),damageFlashOverlayA['update'](0x2710),damageFlashOverlayB['update'](0x2710),hitmarkerOverlay['update'](0x2710),slideSpeedLines['update'](0x2710);}
// __UNIT__ u2780 [2692669,2692700) kind=expr len=31
setTimeout(function(){},0xfa0);
// __UNIT__ u2782 [2692773,2692774) kind=empty len=1
;
// __UNIT__ u2783 [2692774,2692787) kind=var len=28
var networkSendEnabled=!![];
// __UNIT__ u2784 [2692787,2692802) kind=expr len=35
isHttps&&(networkSendEnabled=!![]);
// __UNIT__ u2785 [2692802,2692822) kind=var len=33
var a0K=![],showHitboxMeshes=![];
// __UNIT__ u2786 [2692822,2692836) kind=expr len=32
isHttps&&(showHitboxMeshes=![]);
// __UNIT__ u2787 [2692836,2692854) kind=var len=47
var hitboxMeshList=[],mapFinalizeTweenState={};
// __UNIT__ u2788 [2692854,2692867) kind=expr len=31
mapFinalizeTweenState['a']=0x0;
// __UNIT__ u2789 [2692867,2692895) kind=var len=90
var mapFinalizeTween=mapFinalizeTweenState,mapFinalizePending=![],postProcessCompiled=![];
// __UNIT__ u2792 [2697574,2697640) kind=var len=104
var selfPlayerId=-0x1,gameWebSocket,a0V=null,lastEntitySnapshotMs=getNowMs(),a0W=new Array(0xa),a0X=0x0;
// __UNIT__ u2796 [2699079,2699139) kind=var len=154
var loadSessionState=null,nextLoadSessionId=0x0,loadSessionTimeoutMs=0x3a98,loadSessionHardTimeoutMs=0xafc8,maxFailedAssets=0xc,maxLoadSessionEvents=0x28;
// __UNIT__ u2797 [2699139,2699212) kind=function len=91
function getCurrentTimestampMs(){return Date['now']?Date['now']():new Date()['getTime']();}
// __UNIT__ u2798 [2699212,2699610) kind=function len=541
function formatErrorMessage(errValue){var aCQ=stringDecoderAlias;if(errValue==undefined||errValue==null)return'';var msgText='';try{if(typeof errValue=='string')msgText=errValue;else{if(errValue['message']!=undefined)msgText=errValue["message"];else{if(errValue["reason"]!=undefined)msgText=errValue["reason"];else errValue["type"]!=undefined?msgText=errValue['type']:msgText=JSON['stringify'](errValue);}}}catch(a3q){msgText=String(errValue);}return msgText=String(msgText||''),msgText["length"]>0x1f4?msgText['substr'](0x0,0x1f4):msgText;}
// __UNIT__ u2800 [2700620,2700845) kind=function len=266
function getUrlHostPath(rawUrl){var aCS=stringDecoderAlias;if(rawUrl==undefined||rawUrl==null)return'';try{var a3p=new URL(String(rawUrl),location["href"]);return a3p['host']+a3p["pathname"];}catch(a3q){return String(rawUrl)['split']('?')[0x0]["substr"](0x0,0xf0);}}
// __UNIT__ u2801 [2700845,2700989) kind=function len=199
function cloneJsonData(srcValue){if(srcValue==undefined||srcValue==null)return{};try{return JSON['parse'](JSON['stringify'](srcValue));}catch(cloneErr){return{'value':formatErrorMessage(srcValue)};}}
// __UNIT__ u2803 [2701451,2701824) kind=function len=596
function recordLoadMilestone(a3o,a3p){var aCU=stringDecoderAlias;if(loadSessionState==null||loadSessionState["completed"])return;var a3q=getCurrentTimestampMs(),a3r=a3q-loadSessionState['startedAt'],a3s=cloneJsonData(a3p);loadSessionState["stage"]=a3o,loadSessionState["lastProgressAt"]=a3q,loadSessionState['milestones'][a3o]=a3r;var a3t={};a3t['stage']=a3o,a3t['elapsedMs']=a3r,a3t['data']=a3s,loadSessionState['events']['push'](a3t),loadSessionState["events"]["length"]>maxLoadSessionEvents&&loadSessionState['events']['splice'](0x0,loadSessionState['events']['length']-maxLoadSessionEvents);}
// __UNIT__ u2810 [2708491,2708598) kind=function len=222
function logMatchmakerFailure(message,stageOverride,options){if(loadSessionState==null||loadSessionState['completed'])return;recordLoadMilestone(stageOverride||message,options||{}),finalizeLoadSession('terminal',message);}
// __UNIT__ u2811 [2708598,2709018) kind=function len=639
function completeLoadSession(a3o){var aD3=stringDecoderAlias;if(loadSessionState==null)return;recordLoadMilestone(a3o||"complete",{}),a3o=="entered-pkghYgdlX"&&finalizeLoadSession('complete','entered-pkghYgdlX'),loadSessionState["completed"]=!![],loadSessionState["timeout"]!=null&&(clearTimeout(loadSessionState["timeout"]),loadSessionState['timeout']=null),loadSessionState['hardTimeout']!=null&&(clearTimeout(loadSessionState["hardTimeout"]),loadSessionState["hardTimeout"]=null),loadSessionState['gltfStallTimer']!=null&&(clearTimeout(loadSessionState['gltfStallTimer']),loadSessionState['gltfStallTimer']=null),loadSessionState=null;}
// __UNIT__ u2812 [2709018,2709314) kind=function len=543
function recordAssetFailure(assetKind,assetUrl,assetError,assetExtra){if(loadSessionState==null||loadSessionState['completed'])return;var assetMap=loadSessionState['map'],failedAssetEntry={'kind':assetKind,'url':getUrlHostPath(assetUrl),'error':formatErrorMessage(assetError)};assetExtra!=undefined&&(failedAssetEntry['extra']=cloneJsonData(assetExtra)),assetMap['failedAssetCount']++,assetMap['failedAssets']['length']<maxFailedAssets&&assetMap['failedAssets']['push'](failedAssetEntry),recordLoadMilestone('asset-failure',failedAssetEntry);}
// __UNIT__ u2814 [2713132,2713169) kind=if len=69
if(typeof profanityBlocklist==='undefined')var profanityBlocklist=[];
// __UNIT__ u2815 [2713169,2713441) kind=function len=415
function maskBlockedPhrase(inputText,bannedWord){var aDa=stringDecoderAlias,lowerText=inputText['toLowerCase']();while(lowerText['indexOf'](bannedWord)!=-0x1){var a3r=inputText['substr'](0x0,lowerText["indexOf"](bannedWord));a3r='*'['repeat'](bannedWord["length"]),a3r+=inputText["substr"](lowerText["indexOf"](bannedWord)+bannedWord['length']),inputText=a3r,lowerText=inputText['toLowerCase']();}return inputText;}
// __UNIT__ u2816 [2713441,2713973) kind=function len=913
function filterChatProfanity(filteredText){var aDb=stringDecoderAlias,wordList=filteredText['split']('\x20');filteredText='';for(let wordIndex=0x0;wordIndex<wordList['length'];wordIndex++){let lowerWord=wordList[wordIndex]['toLowerCase']();if(lowerWord['length']!=0x0){let matchStart=binarySearchBlocklist(profanityBlocklist,lowerWord['charAt'](0x0));for(let a3t=matchStart;a3t<profanityBlocklist['length'];a3t++){if(lowerWord["charAt"](0x0)!=profanityBlocklist[a3t]['charAt'](0x0)&&a3t>matchStart+0x2)break;if(lowerWord==profanityBlocklist[a3t]){wordList[wordIndex]='*'['repeat'](wordList[wordIndex]["length"]);break;}}}filteredText+=wordList[wordIndex],wordIndex!=wordList["length"]-0x1&&(filteredText+='\x20');}for(let a3u=0x0;a3u<profanityBlocklist['length'];a3u++){profanityBlocklist[a3u]["indexOf"]('\x20')!=-0x1&&(filteredText=maskBlockedPhrase(filteredText,profanityBlocklist[a3u]));}return filteredText;}
// __UNIT__ u2817 [2713973,2714224) kind=function len=324
function binarySearchBlocklist(sortedArray,a3p){var aDc=stringDecoderAlias,a3q=0x0,a3r=sortedArray['length']-0x1,a3s=Math["floor"]((a3r+a3q)/0x2);while(sortedArray[a3s]!=a3p&&a3q<a3r){if(a3p<sortedArray[a3s])a3r=a3s-0x1;else a3p>sortedArray[a3s]&&(a3q=a3s+0x1);a3s=Math['floor']((a3r+a3q)/0x2);}return Math['max'](a3s,0x0);}
// __UNIT__ u2818 [2714224,2714292) kind=var len=161
var matchmakingActive=![],matchmakerSocket=null,matchmakerHandshakeId=-0x1,matchmakerSendQueue=[],flushMatchmakerQueue=function(){},partyInviteUrl='',partyId='';
// __UNIT__ u2822 [2716104,2716126) kind=var len=66
var matchmakerPendingRequest=null,matchmakerReservationToken=null;
// __UNIT__ u2828 [2727081,2727124) kind=var len=125
var inputEventQueue=new createCustomList(),inputQueueBufferA=new createCustomList(),inputQueueBufferB=new createCustomList();
// __UNIT__ u2829 [2727124,2727213) kind=function len=119
function makeLookInputEvent(){var aDH=stringDecoderAlias,a3o={};return a3o['x']=0x0,a3o['y']=0x0,a3o["which"]=0x0,a3o;}
// __UNIT__ u2830 [2727213,2727266) kind=for len=101
for(var loopIndex=0x0;loopIndex<0x14;loopIndex++){inputEventQueue['push'](new makeLookInputEvent());}
// __UNIT__ u2835 [2732704,2732861) kind=function len=339
function mirrorForLeftHand(mirrorPoint){var aDV=stringDecoderAlias;if(!leftHandedEnabled)return mirrorPoint;return mirrorScratchVector['copy'](mirrorPoint),worldCamera['worldToLocal'](mirrorScratchVector),mirrorScratchVector['x']*=-0x1,worldCamera['localToWorld'](mirrorScratchVector),mirrorPoint["copy"](mirrorScratchVector),mirrorPoint;}
// __UNIT__ u2842 [2742034,2742072) kind=var len=106
var splitOriginalMeshList=new createCustomList(),splitMeshPool=new createCustomList(),a2c,splitChildIndex;
// __UNIT__ u2844 [2742615,2742866) kind=function len=324
function releaseSplitMesh(splitEntry){var aE2=stringDecoderAlias;if(splitEntry['splitParent']==undefined){window['onerror']('removeSplitReplacement\x20-\x20splitParent\x20is\x20undefined');return;}splitEntry["splitParent"]['splitReplacement']=undefined,splitEntry["splitParent"]=undefined,splitMeshPool["push"](splitEntry);}
// __UNIT__ u2845 [2742866,2743306) kind=function len=794
function restoreSplitMeshes(parentNode){var aE3=stringDecoderAlias;for(var outerChildIndex=0x0;outerChildIndex<parentNode["children"]['length'];outerChildIndex++){var currentChild=parentNode['children'][outerChildIndex];if(currentChild["splitReplacement"]!=undefined)for(var innerChildIndex=0x0;innerChildIndex<parentNode['children']['length'];innerChildIndex++){if(parentNode['children'][innerChildIndex]['splitParent']==parentNode['children'][outerChildIndex]){var swappedChild=parentNode['children'][innerChildIndex];releaseSplitMesh(swappedChild),parentNode["children"][innerChildIndex]=parentNode["children"][outerChildIndex],parentNode['children'][outerChildIndex]=swappedChild,swappedChild['parent']=null,parentNode['children']['splice'](outerChildIndex,0x1),outerChildIndex--;break;}}}}
// __UNIT__ u2847 [2743859,2744256) kind=function len=553
function restoreSplitMeshesLegacy(treeNode){var aE5=stringDecoderAlias;for(var a3y=0x0;a3y<splitOriginalMeshList['length'];a3y++){var a3z=treeNode["children"][a3y];if(a3z['splitReplacement']!=undefined)for(var a3A=0x0;a3A<splitOriginalMeshList["length"];a3A++){if(treeNode['children'][a3A]['splitParent']==treeNode['children'][a3y]){var a3B=splitOriginalMeshList['array'][a3A];releaseSplitMesh(a3B),treeNode['children'][a3A]=treeNode["children"][a3y],treeNode['children'][a3y]=a3B,a3B["parent"]=null,splitOriginalMeshList['remove'](a3y),a3y--;break;}}}}
// __UNIT__ u2848 [2744256,2744495) kind=var len=580
var frameCounter=0x0,activeCamera,overlayCompilePending=![],sparePerfSlotA2m=0x0,sparePerfSlotA2n=0x78,prevFrameStamp=null,prevHeapBytes=null,frameBeginStamp=null,lastRenderMs=null,parseAccumMs=0x0,compileAccumMs=0x0,paintAccumMs=0x0,drawAccumMs=0x0,uiAccumMs=0x0,slowPacketMaxMs=0x0,slowPacketType=null,renderStartStamp=0x0,lastUpdateMs=null,lastDrawMs=null,lastUiMs=null,knownShaderProgramCount=-0x1,frameStallReportCount=0x0,maxFrameStallReports=0x8,shaderCompileReportCount=0x0,maxShaderCompileReports=0x19,frameStallMinMs=0x64,frameStallMaxMs=0xbb8,knownShaderCacheKeys=null;
// __UNIT__ u2851 [2744793,2745422) kind=function len=865
function collectNewShaderPrograms(){var aE7=stringDecoderAlias;try{if(typeof webglRenderer=='undefined'||webglRenderer==null||webglRenderer['info']==undefined||webglRenderer['info']['programs']==undefined)return null;var a3x=webglRenderer["info"]['programs'];if(knownShaderCacheKeys==null){knownShaderCacheKeys={};for(var a3y=0x0;a3y<a3x['length'];a3y++){knownShaderCacheKeys[a3x[a3y]['cache'+'Key']]=!![];}return knownShaderProgramCount=a3x["length"],null;}if(a3x['length']==knownShaderProgramCount)return null;knownShaderProgramCount=a3x["length"];var a3z=null;for(var a3A=0x0;a3A<a3x['length'];a3A++){var a3B=a3x[a3A]['cache'+"Key"];a3B!=undefined&&knownShaderCacheKeys[a3B]!==!![]&&(knownShaderCacheKeys[a3B]=!![],a3z==null&&(a3z=[]),a3z['push']({'shaderName':a3x[a3A]["name"]||'','cacheKey':(''+a3B)["slice"](0x0,0xa0)}));}return a3z;}catch(a3C){return null;}}
// __UNIT__ u2853 [2746798,2746827) kind=var len=78
var longtaskReportCount=0x0,maxLongtaskReports=0xf,longtaskMinDurationMs=0x96;
// __UNIT__ u2856 [2770523,2770642) kind=expr len=160
(tamperDetectedSnapshot||browserExtensionDetected)&&alert('Please\x20disable\x20your\x20browser\x20extensions\x20in\x20order\x20to\x20play\x20this\x20ga'+'me');
// __UNIT__ u2857 [2770642,2770729) kind=var len=199
var frameTimeHistoryReady=!![],spareFrameTimeSlotA2W=0x0,frameTimeHistory=new Array(0x3c),frameTimeCursor=0x0,fireTickPhase=0x0,transitionFadeFactor=0x1,frameAvgWeight=0x1/frameTimeHistory["length"];
// __UNIT__ u2858 [2770729,2770783) kind=for len=108
for(var loopIndex=0x0;loopIndex<frameTimeHistory['length'];loopIndex++){frameTimeHistory[loopIndex]=16.667;}
// __UNIT__ u2860 [2771677,2771975) kind=function len=511
function smoothFrameDelta(a3y){var aEe=stringDecoderAlias;if(!frameTimeHistoryReady)return frameTimeHistory[frameTimeCursor++]=a3y,frameTimeCursor>frameTimeHistory["length"]&&(frameTimeHistoryReady=!![]),a3y;a3y=Math['min'](a3y,0x64),frameTimeHistory[frameTimeCursor]=a3y,frameTimeCursor=(frameTimeCursor+0x1)%frameTimeHistory["length"];var a3z=0x0;for(var a3A=0x0;a3A<frameTimeHistory['length'];a3A++){a3z+=frameTimeHistory[a3A];}a3z*=frameAvgWeight;if(Math['abs'](a3y-a3z)>0x8)return(a3y+a3z)/0x2;return a3z;}
// __UNIT__ u2863 [2789317,2789329) kind=expr len=52
tamperCheckPassed&&scheduleNextFrame(mainFrameLoop);
// __UNIT__ u2864 [2789329,2789465) kind=function len=217
function openDeathScreen(){var aEi=stringDecoderAlias;fireTriggerHeld=![],localPlayer["d2J6H770A10"]=![],localPlayer['zBgadyCVYk']['OUsPgMLOT']=![],pointerUnlockExpected=!![],isDead=![],document["exitPointerLock"]();}
// __UNIT__ u2865 [2789465,2789525) kind=var len=67
var captchaHolderElement=document.getElementById('captcha-holder');
// __UNIT__ u2866 [2789525,2789550) kind=var len=27
var isHcaptchaLoaded=false;
// __UNIT__ u2869 [2789991,2790002) kind=var len=32
var postProcessComposerState={};
// __UNIT__ u2870 [2790002,2790025) kind=expr len=44
postProcessComposerState['initialized']=![];
// __UNIT__ u2871 [2790025,2790037) kind=var len=49
var postProcessComposer=postProcessComposerState;
// __UNIT__ u2873 [2791036,2791047) kind=var len=23
var shaderPassCache=[];
// __UNIT__ u2874 [2791047,2791158) kind=function len=150
function cacheShaderPass(a3y,a3z,a3A){var aEk=stringDecoderAlias,a3B={};a3B['pass']=a3y,a3B["name"]=a3z,a3B['vars']=a3A,shaderPassCache['push'](a3B);}
// __UNIT__ u2875 [2791158,2791307) kind=function len=228
function getCachedShaderPass(a3y,a3z){var aEl=stringDecoderAlias;for(var a3A=0x0;a3A<shaderPassCache["length"];a3A++){if(shaderPassCache[a3A]["name"]==a3y&&shaderPassCache[a3A]["vars"]==a3z)return shaderPassCache[a3A]['pass'];}}
// __UNIT__ u2877 [2793505,2793513) kind=var len=28
var renderWeaponSkinPreview;
// __UNIT__ u2879 [2801915,2801927) kind=var len=38
var createPickupMarker,pickupTypeDefs;
