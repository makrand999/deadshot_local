#pragma once
#include <stddef.h>
#include <sys/types.h>

struct AAssetManager {
  const void *mock_data;
  size_t mock_len;
};
typedef struct AAssetManager AAssetManager;

struct AAsset {
  const void *buf;
  size_t len;
};
typedef struct AAsset AAsset;

#define AASSET_MODE_UNKNOWN 0
#define AASSET_MODE_RANDOM  1
#define AASSET_MODE_STREAMING 2
#define AASSET_MODE_BUFFER  3

AAsset *AAssetManager_open(AAssetManager *mgr, const char *path, int mode);
off_t AAsset_getLength(AAsset *a);
const void *AAsset_getBuffer(AAsset *a);
void AAsset_close(AAsset *a);
