#pragma once
#include <stddef.h>

struct AAssetManager;
typedef struct AAssetManager AAssetManager;
struct AAsset;
typedef struct AAsset AAsset;

#define AASSET_MODE_UNKNOWN 0
#define AASSET_MODE_RANDOM 1
#define AASSET_MODE_STREAMING 2
#define AASSET_MODE_BUFFER 3

static inline AAsset* AAssetManager_open(AAssetManager* mgr, const char* filename, int mode) {
  (void)mgr; (void)filename; (void)mode;
  return NULL;
}
static inline size_t AAsset_getLength(AAsset* asset) {
  (void)asset;
  return 0;
}
static inline const void* AAsset_getBuffer(AAsset* asset) {
  (void)asset;
  return NULL;
}
static inline void AAsset_close(AAsset* asset) {
  (void)asset;
}
