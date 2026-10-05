// GENERATED from ../../raw/bundles/final.pkg.js [code region] — edit tools/, not this file.
// module: network/codec.js | units: 5 | span: [2032230,2035842) (interleaved; exact ranges are per-unit markers below)
// emission order within this file follows global order (sorted by start); rebundle with: node tools/bundle.mjs
// __UNIT__ u1950 [2032230,2032240) kind=var len=23
var templatesByName={};
// __UNIT__ u1952 [2033452,2033468) kind=var len=56
var templatesLive=templatesByName,templateKeyAliases={};
// __UNIT__ u1956 [2033870,2033884) kind=var len=47
var templateOrder=getObjectKeys(templatesLive);
// __UNIT__ u1959 [2034685,2034983) kind=function len=585
function encodeMessage(messageSpec,dataView,writeOffset){var aqs=stringDecoderAlias;writeOffset=writeOffset||0x0;var globalKeyList=messageSpec[aqs(0x734)];dataView['setUint16'](writeOffset,messageSpec['globalIndex']),writeOffset+=0x2;for(var keyIndex=0x0;keyIndex<globalKeyList['length'];keyIndex++){dataView[dataViewSetterNames[messageSpec[aqs(0x3e9)][keyIndex]]](writeOffset,messageSpec[globalKeyList[keyIndex]]),writeOffset+=typeByteSizes[messageSpec['byteSizes'][keyIndex]];}return messageSpec['hasString']&&(writeOffset=writeString(messageSpec,dataView,writeOffset)),writeOffset;}
// __UNIT__ u1961 [2035363,2035842) kind=function len=900
function decodeMessage(dataView,readOffset){var aqt=stringDecoderAlias;readOffset=readOffset||0x0;if(dataView[aqt(0x153)](readOffset)==0x0)return readOffset+=0x98967f,null;var decodedMessage=templatesLive[templateOrder[dataView['getUint16'](readOffset)-0x1]],messageTemplate=decodedMessage;if(messageTemplate==undefined)return readOffset+=0x98967f,undefined;var fieldKeys=messageTemplate['globalKeys'];readOffset+=0x2;for(var fieldIndex=0x0;fieldIndex<fieldKeys[aqt(0x3a2)];fieldIndex++){decodedMessage[fieldKeys[fieldIndex]]=dataView[dataViewGetterNames[messageTemplate['byteSizes'][fieldIndex]]](readOffset),readOffset+=typeByteSizes[messageTemplate['byteSizes'][fieldIndex]];}return messageTemplate[aqt(0x10f3)]&&(readString(decodedMessage,dataView,readOffset),readOffset=decodedMessage[aqt(0x6d1)]),decodedMessage['byteOffset']=readOffset,pZ&&(dataView['byteOffset']+=readOffset),decodedMessage;}
