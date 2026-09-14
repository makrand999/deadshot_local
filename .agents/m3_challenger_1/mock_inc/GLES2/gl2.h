#pragma once
#include <stddef.h>
#include <stdint.h>
#include <string.h>

typedef unsigned int GLenum;
typedef unsigned char GLboolean;
typedef unsigned int GLbitfield;
typedef signed char GLbyte;
typedef short GLshort;
typedef int GLint;
typedef int GLsizei;
typedef unsigned char GLubyte;
typedef unsigned short GLushort;
typedef unsigned int GLuint;
typedef float GLfloat;
typedef float GLclampf;
typedef void GLvoid;
typedef char GLchar;
typedef ptrdiff_t GLsizeiptr;
typedef ptrdiff_t GLintptr;

#define GL_FALSE 0
#define GL_TRUE 1
#define GL_LINES 0x0001
#define GL_TRIANGLES 0x0004
#define GL_FLOAT 0x1406
#define GL_UNSIGNED_INT 0x1405
#define GL_DEPTH_BUFFER_BIT 0x00000100
#define GL_DEPTH_TEST 0x0B71
#define GL_BLEND 0x0BE2
#define GL_SRC_ALPHA 0x0302
#define GL_ONE 1
#define GL_ONE_MINUS_SRC_ALPHA 0x0303
#define GL_TEXTURE_2D 0x0DE1
#define GL_TEXTURE0 0x84C0
#define GL_TEXTURE1 0x84C1
#define GL_TEXTURE2 0x84C2
#define GL_ARRAY_BUFFER 0x8892
#define GL_ELEMENT_ARRAY_BUFFER 0x8893
#define GL_STATIC_DRAW 0x88E4
#define GL_VERTEX_SHADER 0x8B31
#define GL_FRAGMENT_SHADER 0x8B30
#define GL_COMPILE_STATUS 0x8B81
#define GL_LINK_STATUS 0x8B82
#define GL_LINEAR 0x2601
#define GL_LINEAR_MIPMAP_LINEAR 0x2703
#define GL_TEXTURE_MIN_FILTER 0x2801
#define GL_TEXTURE_MAG_FILTER 0x2800
#define GL_TEXTURE_WRAP_S 0x2802
#define GL_TEXTURE_WRAP_T 0x2803
#define GL_CLAMP_TO_EDGE 0x812F

// Mock state and spy trackers
typedef struct {
  float x, y, z;
  float r, g, b, a;
} mock_vertex_t;

extern int g_gl_draw_arrays_calls;
extern int g_gl_draw_elements_calls;
extern GLenum g_gl_last_draw_mode;
extern GLsizei g_gl_last_vertex_count;
extern mock_vertex_t g_gl_captured_vertices[32768];
extern int g_gl_captured_vertex_count;
extern int g_gl_depth_test_enabled;
extern GLboolean g_gl_depth_mask;
extern int g_gl_blend_enabled;
extern GLenum g_gl_blend_sfactor;
extern GLenum g_gl_blend_dfactor;
extern float g_gl_last_mvp[16];
extern const void *g_gl_last_pos_ptr;
extern const void *g_gl_last_col_ptr;
extern GLsizei g_gl_last_pos_stride;
extern GLsizei g_gl_last_col_stride;

static inline GLuint glCreateShader(GLenum type) { (void)type; return 1; }
static inline void glShaderSource(GLuint s, GLsizei c, const GLchar *const*string, const GLint *l) { (void)s; (void)c; (void)string; (void)l; }
static inline void glCompileShader(GLuint s) { (void)s; }
static inline void glGetShaderiv(GLuint s, GLenum pname, GLint *params) { (void)s; (void)pname; if (params) *params = GL_TRUE; }
static inline void glGetShaderInfoLog(GLuint s, GLsizei bufsize, GLsizei *length, GLchar *infolog) { (void)s; (void)bufsize; if (length) *length = 0; if (infolog) infolog[0] = 0; }
static inline GLuint glCreateProgram(void) { return 1; }
static inline void glAttachShader(GLuint p, GLuint s) { (void)p; (void)s; }
static inline void glBindAttribLocation(GLuint p, GLuint idx, const GLchar *name) { (void)p; (void)idx; (void)name; }
static inline void glLinkProgram(GLuint p) { (void)p; }
static inline void glGetProgramiv(GLuint p, GLenum pname, GLint *params) { (void)p; (void)pname; if (params) *params = GL_TRUE; }
static inline void glGetProgramInfoLog(GLuint p, GLsizei bufsize, GLsizei *length, GLchar *infolog) { (void)p; (void)bufsize; if (length) *length = 0; if (infolog) infolog[0] = 0; }
static inline void glUseProgram(GLuint p) { (void)p; }
static inline GLint glGetUniformLocation(GLuint p, const GLchar *name) { (void)p; (void)name; return 1; }
static inline void glUniformMatrix4fv(GLint loc, GLsizei count, GLboolean transpose, const GLfloat *val) {
  (void)loc; (void)count; (void)transpose;
  if (val) memcpy(g_gl_last_mvp, val, 16 * sizeof(float));
}
static inline void glUniform1i(GLint loc, GLint v0) { (void)loc; (void)v0; }
static inline void glUniform1fv(GLint loc, GLsizei count, const GLfloat *value) { (void)loc; (void)count; (void)value; }
static inline void glUniform4fv(GLint loc, GLsizei count, const GLfloat *value) { (void)loc; (void)count; (void)value; }
static inline void glActiveTexture(GLenum texture) { (void)texture; }
static inline void glBindTexture(GLenum target, GLuint texture) { (void)target; (void)texture; }
static inline void glTexParameteri(GLenum target, GLenum pname, GLint param) { (void)target; (void)pname; (void)param; }
static inline void glCompressedTexImage2D(GLenum target, GLint level, GLenum internalformat, GLsizei width, GLsizei height, GLint border, GLsizei imageSize, const void *data) {
  (void)target; (void)level; (void)internalformat; (void)width; (void)height; (void)border; (void)imageSize; (void)data;
}
static inline void glBindBuffer(GLenum target, GLuint buffer) { (void)target; (void)buffer; }
static inline void glBufferData(GLenum target, GLsizeiptr size, const void *data, GLenum usage) { (void)target; (void)size; (void)data; (void)usage; }
static inline void glGenBuffers(GLsizei n, GLuint *buffers) { for (GLsizei i = 0; i < n; i++) buffers[i] = (GLuint)(i + 1); }
static inline void glDeleteBuffers(GLsizei n, const GLuint *buffers) { (void)n; (void)buffers; }
static inline void glGenTextures(GLsizei n, GLuint *textures) { for (GLsizei i = 0; i < n; i++) textures[i] = (GLuint)(i + 1); }
static inline void glDeleteTextures(GLsizei n, const GLuint *textures) { (void)n; (void)textures; }
static inline void glDeleteProgram(GLuint p) { (void)p; }
static inline void glEnableVertexAttribArray(GLuint index) { (void)index; }
static inline void glDisableVertexAttribArray(GLuint index) { (void)index; }
static inline void glVertexAttribPointer(GLuint index, GLint size, GLenum type, GLboolean normalized, GLsizei stride, const void *pointer) {
  (void)size; (void)type; (void)normalized;
  if (index == 0) {
    g_gl_last_pos_ptr = pointer;
    g_gl_last_pos_stride = stride ? stride : (GLsizei)(3 * sizeof(float));
  } else if (index == 1) {
    g_gl_last_col_ptr = pointer;
    g_gl_last_col_stride = stride ? stride : (GLsizei)(4 * sizeof(float));
  }
}
static inline void glDrawArrays(GLenum mode, GLint first, GLsizei count) {
  (void)first;
  g_gl_draw_arrays_calls++;
  g_gl_last_draw_mode = mode;
  g_gl_last_vertex_count = count;
  if (count > 0 && g_gl_last_pos_ptr) {
    int to_copy = count;
    if (to_copy > 16384) to_copy = 16384;
    const char *p_pos = (const char *)g_gl_last_pos_ptr;
    const char *p_col = (const char *)g_gl_last_col_ptr;
    for (int i = 0; i < to_copy; i++) {
      const float *pos = (const float *)(p_pos + i * g_gl_last_pos_stride);
      g_gl_captured_vertices[i].x = pos[0];
      g_gl_captured_vertices[i].y = pos[1];
      g_gl_captured_vertices[i].z = pos[2];
      if (p_col) {
        const float *col = (const float *)(p_col + i * g_gl_last_col_stride);
        g_gl_captured_vertices[i].r = col[0];
        g_gl_captured_vertices[i].g = col[1];
        g_gl_captured_vertices[i].b = col[2];
        g_gl_captured_vertices[i].a = col[3];
      } else {
        g_gl_captured_vertices[i].r = 1.0f;
        g_gl_captured_vertices[i].g = 1.0f;
        g_gl_captured_vertices[i].b = 1.0f;
        g_gl_captured_vertices[i].a = 1.0f;
      }
    }
    g_gl_captured_vertex_count = to_copy;
  }
}
static inline void glDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices) {
  (void)mode; (void)type; (void)indices;
  g_gl_draw_elements_calls++;
  g_gl_last_vertex_count = count;
}
static inline void glLineWidth(GLfloat width) { (void)width; }
static inline void glClear(GLbitfield mask) { (void)mask; }
static inline void glEnable(GLenum cap) {
  if (cap == GL_DEPTH_TEST) g_gl_depth_test_enabled = 1;
  else if (cap == GL_BLEND) g_gl_blend_enabled = 1;
}
static inline void glDisable(GLenum cap) {
  if (cap == GL_DEPTH_TEST) g_gl_depth_test_enabled = 0;
  else if (cap == GL_BLEND) g_gl_blend_enabled = 0;
}
static inline void glDepthMask(GLboolean flag) { g_gl_depth_mask = flag; }
static inline void glBlendFunc(GLenum sfactor, GLenum dfactor) {
  g_gl_blend_sfactor = sfactor;
  g_gl_blend_dfactor = dfactor;
}
