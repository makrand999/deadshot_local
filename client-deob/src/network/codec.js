// GENERATED from ../../raw/bundles/VM9.deob.txt — edit tools/, not this file.
// module: network/codec.js | units: 5 | span: [2084463,2088110) (interleaved; exact ranges are per-unit markers below)
// emission order within this file follows global order (sorted by start); rebundle with: node tools/bundle.mjs
// __UNIT__ u1950 [2084463,2084473) kind=var len=23
var templatesByName={};
// __UNIT__ u1952 [2085716,2085732) kind=var len=56
var templatesLive=templatesByName,templateKeyAliases={};
// __UNIT__ u1956 [2086135,2086149) kind=var len=47
var templateOrder=getObjectKeys(templatesLive);
// __UNIT__ u1959 [2086947,2087248) kind=function len=588
function encodeMessage(messageSpec,dataView,writeOffset){var aqs=stringDecoderAlias;writeOffset=writeOffset||0x0;var globalKeyList=messageSpec["globalKeys"];dataView['setUint16'](writeOffset,messageSpec['globalIndex']),writeOffset+=0x2;for(var keyIndex=0x0;keyIndex<globalKeyList['length'];keyIndex++){dataView[dataViewSetterNames[messageSpec["byteSizes"][keyIndex]]](writeOffset,messageSpec[globalKeyList[keyIndex]]),writeOffset+=typeByteSizes[messageSpec['byteSizes'][keyIndex]];}return messageSpec['hasString']&&(writeOffset=writeString(messageSpec,dataView,writeOffset)),writeOffset;}
// __UNIT__ u1961 [2087628,2088110) kind=function len=911
function decodeMessage(dataView,readOffset){var aqt=stringDecoderAlias;readOffset=readOffset||0x0;if(dataView["getUint16"](readOffset)==0x0)return readOffset+=0x98967f,null;var decodedMessage=templatesLive[templateOrder[dataView['getUint16'](readOffset)-0x1]],messageTemplate=decodedMessage;if(messageTemplate==undefined)return readOffset+=0x98967f,undefined;var fieldKeys=messageTemplate['globalKeys'];readOffset+=0x2;for(var fieldIndex=0x0;fieldIndex<fieldKeys["length"];fieldIndex++){decodedMessage[fieldKeys[fieldIndex]]=dataView[dataViewGetterNames[messageTemplate['byteSizes'][fieldIndex]]](readOffset),readOffset+=typeByteSizes[messageTemplate['byteSizes'][fieldIndex]];}return messageTemplate["hasString"]&&(readString(decodedMessage,dataView,readOffset),readOffset=decodedMessage["stringOffset"]),decodedMessage['byteOffset']=readOffset,isHeadless&&(dataView['byteOffset']+=readOffset),decodedMessage;}
