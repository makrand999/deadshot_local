#include "ds/ds_discovery.h"
#include "ds/ds_config.h"

static uint32_t rd(uint32_t *s) { *s = *s * 1664525u + 1013904223u; return *s >> 16; }

void ds_room_code(uint32_t seed, char out[4]) {
  static const char *A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  uint32_t s = seed ? seed : 0x9E3779B9u;
  for (int i = 0; i < 3; i++) out[i] = A[rd(&s) % 32];
  out[3] = 0;
}

#include <string.h>

void ds_room_code_gen(uint32_t seed, char out[4]) {
  ds_room_code(seed, out);
}

int ds_room_code_parse(const char *in, char out[4]) {
  if (!in || !out) return -1;
  out[0] = out[1] = out[2] = out[3] = '\0';
  static const char *A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  int i = 0;
  while (in[i]) {
    // Skip separators
    while (in[i] && !((in[i] >= 'A' && in[i] <= 'Z') ||
                      (in[i] >= 'a' && in[i] <= 'z') ||
                      (in[i] >= '0' && in[i] <= '9'))) {
      i++;
    }
    if (!in[i]) break;

    // Collect token
    char tok[32];
    int tlen = 0;
    while (in[i] && ((in[i] >= 'A' && in[i] <= 'Z') ||
                     (in[i] >= 'a' && in[i] <= 'z') ||
                     (in[i] >= '0' && in[i] <= '9'))) {
      if (tlen < 31) {
        char c = in[i];
        if (c >= 'a' && c <= 'z') c = (char)(c - 'a' + 'A');
        tok[tlen++] = c;
      }
      i++;
    }
    tok[tlen] = '\0';

    // If token is exactly 3 chars, test if all in A
    if (tlen == 3) {
      int valid = 1;
      for (int k = 0; k < 3; k++) {
        if (!strchr(A, tok[k])) { valid = 0; break; }
      }
      if (valid) {
        out[0] = tok[0]; out[1] = tok[1]; out[2] = tok[2]; out[3] = '\0';
        return 0;
      }
    }
  }

  return -1;
}


int ds_disc_encode(const ds_room_t *r, uint8_t out[DS_DISC_LEN]) {
  if (!r || !out) return 0;
  out[0] = (uint8_t)DS_DISC_MAGIC; out[1] = (uint8_t)(DS_DISC_MAGIC >> 8);
  out[2] = (uint8_t)(DS_DISC_MAGIC >> 16); out[3] = (uint8_t)(DS_DISC_MAGIC >> 24);
  out[4] = r->version ? r->version : DS_PROTO_VERSION;
  out[5] = r->map_ft;
  out[6] = r->players; out[7] = r->maxp;
  out[8] = (uint8_t)(r->port & 0xFF); out[9] = (uint8_t)(r->port >> 8);
  out[10] = (uint8_t)r->code[0]; out[11] = (uint8_t)r->code[1]; out[12] = (uint8_t)r->code[2];
  out[13] = out[14] = out[15] = 0;
  return DS_DISC_LEN;
}

int ds_disc_decode(const uint8_t *buf, int len, ds_room_t *r) {
  if (!buf || len < DS_DISC_LEN || !r) return -1;
  uint32_t m = (uint32_t)buf[0] | ((uint32_t)buf[1] << 8) |
               ((uint32_t)buf[2] << 16) | ((uint32_t)buf[3] << 24);
  if (m != DS_DISC_MAGIC || buf[4] != DS_PROTO_VERSION) return -1;
  if (buf[5] != DS_MAP_FT_INDEX) return -1; // forest-only lock

  uint8_t players = buf[6];
  uint8_t maxp = buf[7];
  uint16_t port = (uint16_t)(buf[8] | (buf[9] << 8));

  // Parameter sanitization
  if (port == 0) return -1;
  if (maxp == 0 || maxp > 64) return -1;
  if (players > maxp) return -1;

  // Base-32 room code character validation
  static const char *A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  int is_empty = (buf[10] == 0 && buf[11] == 0 && buf[12] == 0);
  if (!is_empty) {
    if (!strchr(A, (char)buf[10]) ||
        !strchr(A, (char)buf[11]) ||
        !strchr(A, (char)buf[12])) {
      return -1;
    }
  }

  r->version = buf[4];
  r->map_ft = buf[5];
  r->players = players;
  r->maxp = maxp;
  r->port = port;
  r->code[0] = (char)buf[10];
  r->code[1] = (char)buf[11];
  r->code[2] = (char)buf[12];
  r->code[3] = 0;
  return 0;
}
