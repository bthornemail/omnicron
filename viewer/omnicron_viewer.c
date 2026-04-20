#include <errno.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <GLFW/glfw3.h>

typedef ptrdiff_t GLsizeiptr;
typedef char GLchar;
#ifndef PFNGLDRAWELEMENTSPROC
typedef void (*PFNGLDRAWELEMENTSPROC)(GLenum mode, GLsizei count, GLenum type, const void *indices);
#endif

typedef struct {
    int width;
    int height;
    int cell_size;
    float *positions;
    size_t positions_count;
    float *colors;
    size_t colors_count;
    uint32_t *indices;
    size_t indices_count;
} RenderPacket;

typedef struct {
    PFNGLGENVERTEXARRAYSPROC GenVertexArrays;
    PFNGLBINDVERTEXARRAYPROC BindVertexArray;
    PFNGLDELETEVERTEXARRAYSPROC DeleteVertexArrays;
    PFNGLGENBUFFERSPROC GenBuffers;
    PFNGLBINDBUFFERPROC BindBuffer;
    PFNGLBUFFERDATAPROC BufferData;
    PFNGLDELETEBUFFERSPROC DeleteBuffers;
    PFNGLVERTEXATTRIBPOINTERPROC VertexAttribPointer;
    PFNGLENABLEVERTEXATTRIBARRAYPROC EnableVertexAttribArray;
    PFNGLCREATESHADERPROC CreateShader;
    PFNGLSHADERSOURCEPROC ShaderSource;
    PFNGLCOMPILESHADERPROC CompileShader;
    PFNGLGETSHADERIVPROC GetShaderiv;
    PFNGLGETSHADERINFOLOGPROC GetShaderInfoLog;
    PFNGLDELETESHADERPROC DeleteShader;
    PFNGLCREATEPROGRAMPROC CreateProgram;
    PFNGLATTACHSHADERPROC AttachShader;
    PFNGLLINKPROGRAMPROC LinkProgram;
    PFNGLGETPROGRAMIVPROC GetProgramiv;
    PFNGLGETPROGRAMINFOLOGPROC GetProgramInfoLog;
    PFNGLUSEPROGRAMPROC UseProgram;
    PFNGLDELETEPROGRAMPROC DeleteProgram;
    PFNGLGETUNIFORMLOCATIONPROC GetUniformLocation;
    PFNGLUNIFORM2FPROC Uniform2f;
    PFNGLDRAWELEMENTSPROC DrawElements;
} GLFns;

static bool read_text_file(const char *path, char **out_text) {
    FILE *f = fopen(path, "rb");
    long sz;
    char *buf;
    if (!f) return false;
    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return false;
    }
    sz = ftell(f);
    if (sz < 0) {
        fclose(f);
        return false;
    }
    rewind(f);
    buf = (char *)malloc((size_t)sz + 1);
    if (!buf) {
        fclose(f);
        return false;
    }
    if (fread(buf, 1, (size_t)sz, f) != (size_t)sz) {
        free(buf);
        fclose(f);
        return false;
    }
    buf[sz] = '\0';
    fclose(f);
    *out_text = buf;
    return true;
}

static const char *find_key(const char *json, const char *key) {
    char needle[128];
    snprintf(needle, sizeof(needle), "\"%s\":", key);
    return strstr(json, needle);
}

static bool parse_int_field(const char *json, const char *key, int *out_v) {
    const char *p = find_key(json, key);
    char *endp = NULL;
    long v;
    if (!p) return false;
    p = strchr(p, ':');
    if (!p) return false;
    p += 1;
    while (*p == ' ' || *p == '\t' || *p == '\n' || *p == '\r') p += 1;
    errno = 0;
    v = strtol(p, &endp, 10);
    if (errno != 0 || endp == p) return false;
    *out_v = (int)v;
    return true;
}

static bool parse_float_array_field(const char *json, const char *key, float **out_arr, size_t *out_count) {
    const char *p = find_key(json, key);
    const char *q = NULL;
    float *arr = NULL;
    size_t cap = 0, n = 0;
    if (!p) return false;
    p = strchr(p, '[');
    if (!p) return false;
    q = p + 1;
    while (*q && *q != ']') {
        char *endp = NULL;
        double v;
        while (*q == ' ' || *q == '\t' || *q == '\n' || *q == '\r' || *q == ',') q += 1;
        if (*q == ']') break;
        errno = 0;
        v = strtod(q, &endp);
        if (errno != 0 || endp == q) {
            free(arr);
            return false;
        }
        if (n == cap) {
            size_t new_cap = cap == 0 ? 256 : cap * 2;
            float *next = (float *)realloc(arr, new_cap * sizeof(float));
            if (!next) {
                free(arr);
                return false;
            }
            arr = next;
            cap = new_cap;
        }
        arr[n++] = (float)v;
        q = endp;
    }
    *out_arr = arr;
    *out_count = n;
    return true;
}

static bool parse_u32_array_field(const char *json, const char *key, uint32_t **out_arr, size_t *out_count) {
    const char *p = find_key(json, key);
    const char *q = NULL;
    uint32_t *arr = NULL;
    size_t cap = 0, n = 0;
    if (!p) return false;
    p = strchr(p, '[');
    if (!p) return false;
    q = p + 1;
    while (*q && *q != ']') {
        char *endp = NULL;
        unsigned long v;
        while (*q == ' ' || *q == '\t' || *q == '\n' || *q == '\r' || *q == ',') q += 1;
        if (*q == ']') break;
        errno = 0;
        v = strtoul(q, &endp, 10);
        if (errno != 0 || endp == q) {
            free(arr);
            return false;
        }
        if (n == cap) {
            size_t new_cap = cap == 0 ? 256 : cap * 2;
            uint32_t *next = (uint32_t *)realloc(arr, new_cap * sizeof(uint32_t));
            if (!next) {
                free(arr);
                return false;
            }
            arr = next;
            cap = new_cap;
        }
        arr[n++] = (uint32_t)v;
        q = endp;
    }
    *out_arr = arr;
    *out_count = n;
    return true;
}

static bool parse_first_ndjson_record(const char *ndjson, char **out_json) {
    const char *newline = strchr(ndjson, '\n');
    size_t len = newline ? (size_t)(newline - ndjson) : strlen(ndjson);
    char *line = (char *)malloc(len + 1);
    if (!line) return false;
    memcpy(line, ndjson, len);
    line[len] = '\0';
    *out_json = line;
    return true;
}

static bool load_render_packet(const char *path, RenderPacket *pkt) {
    char *text = NULL;
    char *json = NULL;
    memset(pkt, 0, sizeof(*pkt));
    if (!read_text_file(path, &text)) return false;
    if (!parse_first_ndjson_record(text, &json)) {
        free(text);
        return false;
    }
    free(text);
    if (!parse_int_field(json, "width", &pkt->width) ||
        !parse_int_field(json, "height", &pkt->height) ||
        !parse_int_field(json, "cell_size", &pkt->cell_size) ||
        !parse_float_array_field(json, "positions", &pkt->positions, &pkt->positions_count) ||
        !parse_float_array_field(json, "colors", &pkt->colors, &pkt->colors_count) ||
        !parse_u32_array_field(json, "indices", &pkt->indices, &pkt->indices_count)) {
        free(json);
        return false;
    }
    free(json);
    return true;
}

static void free_render_packet(RenderPacket *pkt) {
    free(pkt->positions);
    free(pkt->colors);
    free(pkt->indices);
    memset(pkt, 0, sizeof(*pkt));
}

static void *load_gl_proc(const char *name) {
    void *p = (void *)glfwGetProcAddress(name);
    return p;
}

static bool load_gl_functions(GLFns *gl) {
    memset(gl, 0, sizeof(*gl));
#define LOAD_GL(name) do { gl->name = (void *)load_gl_proc("gl" #name); if (!gl->name) return false; } while (0)
    LOAD_GL(GenVertexArrays);
    LOAD_GL(BindVertexArray);
    LOAD_GL(DeleteVertexArrays);
    LOAD_GL(GenBuffers);
    LOAD_GL(BindBuffer);
    LOAD_GL(BufferData);
    LOAD_GL(DeleteBuffers);
    LOAD_GL(VertexAttribPointer);
    LOAD_GL(EnableVertexAttribArray);
    LOAD_GL(CreateShader);
    LOAD_GL(ShaderSource);
    LOAD_GL(CompileShader);
    LOAD_GL(GetShaderiv);
    LOAD_GL(GetShaderInfoLog);
    LOAD_GL(DeleteShader);
    LOAD_GL(CreateProgram);
    LOAD_GL(AttachShader);
    LOAD_GL(LinkProgram);
    LOAD_GL(GetProgramiv);
    LOAD_GL(GetProgramInfoLog);
    LOAD_GL(UseProgram);
    LOAD_GL(DeleteProgram);
    LOAD_GL(GetUniformLocation);
    LOAD_GL(Uniform2f);
    LOAD_GL(DrawElements);
#undef LOAD_GL
    return true;
}

static GLuint compile_shader(GLFns *gl, GLenum type, const char *src) {
    GLuint sh = gl->CreateShader(type);
    GLint ok = 0;
    if (!sh) return 0;
    gl->ShaderSource(sh, 1, &src, NULL);
    gl->CompileShader(sh);
    gl->GetShaderiv(sh, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char info[1024];
        gl->GetShaderInfoLog(sh, sizeof(info), NULL, info);
        fprintf(stderr, "shader compile failed: %s\n", info);
        gl->DeleteShader(sh);
        return 0;
    }
    return sh;
}

static GLuint link_program(GLFns *gl, GLuint vs, GLuint fs) {
    GLuint p = gl->CreateProgram();
    GLint ok = 0;
    if (!p) return 0;
    gl->AttachShader(p, vs);
    gl->AttachShader(p, fs);
    gl->LinkProgram(p);
    gl->GetProgramiv(p, GL_LINK_STATUS, &ok);
    if (!ok) {
        char info[1024];
        gl->GetProgramInfoLog(p, sizeof(info), NULL, info);
        fprintf(stderr, "program link failed: %s\n", info);
        gl->DeleteProgram(p);
        return 0;
    }
    return p;
}

static void interleave_vertex_data(const RenderPacket *pkt, float **out_data, size_t *out_floats) {
    size_t vertex_count = pkt->positions_count / 2;
    float *data = (float *)malloc(vertex_count * 6 * sizeof(float));
    size_t i;
    for (i = 0; i < vertex_count; i++) {
        data[i * 6 + 0] = pkt->positions[i * 2 + 0];
        data[i * 6 + 1] = pkt->positions[i * 2 + 1];
        data[i * 6 + 2] = pkt->colors[i * 4 + 0];
        data[i * 6 + 3] = pkt->colors[i * 4 + 1];
        data[i * 6 + 4] = pkt->colors[i * 4 + 2];
        data[i * 6 + 5] = pkt->colors[i * 4 + 3];
    }
    *out_data = data;
    *out_floats = vertex_count * 6;
}

int main(int argc, char **argv) {
    const char *packet_path = argc > 1 ? argv[1] : "/tmp/render_packet.ndjson";
    RenderPacket pkt;
    GLFWwindow *window = NULL;
    GLFns gl;
    GLuint vao = 0, vbo = 0, ebo = 0, vs = 0, fs = 0, prog = 0;
    GLint uViewport = -1;
    float *vertex_data = NULL;
    size_t vertex_floats = 0;
    int fbw = 0, fbh = 0;

    static const char *kVS =
        "#version 330 core\n"
        "layout(location=0) in vec2 aPos;\n"
        "layout(location=1) in vec4 aColor;\n"
        "uniform vec2 uViewport;\n"
        "out vec4 vColor;\n"
        "void main() {\n"
        "  vec2 ndc = vec2((aPos.x / uViewport.x) * 2.0 - 1.0, 1.0 - (aPos.y / uViewport.y) * 2.0);\n"
        "  gl_Position = vec4(ndc, 0.0, 1.0);\n"
        "  vColor = aColor;\n"
        "}\n";
    static const char *kFS =
        "#version 330 core\n"
        "in vec4 vColor;\n"
        "out vec4 FragColor;\n"
        "void main() { FragColor = vColor; }\n";

    if (!load_render_packet(packet_path, &pkt)) {
        fprintf(stderr, "ERROR: failed to load render packet: %s\n", packet_path);
        return 2;
    }
    if (pkt.positions_count == 0 || pkt.colors_count == 0 || pkt.indices_count == 0) {
        fprintf(stderr, "ERROR: render packet missing geometry arrays\n");
        free_render_packet(&pkt);
        return 2;
    }

    if (!glfwInit()) {
        fprintf(stderr, "ERROR: glfwInit failed\n");
        free_render_packet(&pkt);
        return 3;
    }
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    window = glfwCreateWindow(
        pkt.width * pkt.cell_size,
        pkt.height * pkt.cell_size + 48,
        "Omnicron Render Packet Viewer",
        NULL,
        NULL
    );
    if (!window) {
        fprintf(stderr, "ERROR: glfwCreateWindow failed\n");
        glfwTerminate();
        free_render_packet(&pkt);
        return 3;
    }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);

    if (!load_gl_functions(&gl)) {
        fprintf(stderr, "ERROR: failed to load required OpenGL symbols\n");
        glfwDestroyWindow(window);
        glfwTerminate();
        free_render_packet(&pkt);
        return 3;
    }

    interleave_vertex_data(&pkt, &vertex_data, &vertex_floats);
    if (!vertex_data) {
        fprintf(stderr, "ERROR: out of memory preparing vertex data\n");
        glfwDestroyWindow(window);
        glfwTerminate();
        free_render_packet(&pkt);
        return 4;
    }

    vs = compile_shader(&gl, GL_VERTEX_SHADER, kVS);
    fs = compile_shader(&gl, GL_FRAGMENT_SHADER, kFS);
    if (!vs || !fs) {
        free(vertex_data);
        glfwDestroyWindow(window);
        glfwTerminate();
        free_render_packet(&pkt);
        return 5;
    }
    prog = link_program(&gl, vs, fs);
    gl.DeleteShader(vs);
    gl.DeleteShader(fs);
    if (!prog) {
        free(vertex_data);
        glfwDestroyWindow(window);
        glfwTerminate();
        free_render_packet(&pkt);
        return 5;
    }

    gl.GenVertexArrays(1, &vao);
    gl.BindVertexArray(vao);
    gl.GenBuffers(1, &vbo);
    gl.BindBuffer(GL_ARRAY_BUFFER, vbo);
    gl.BufferData(GL_ARRAY_BUFFER, (GLsizeiptr)(vertex_floats * sizeof(float)), vertex_data, GL_STATIC_DRAW);
    gl.GenBuffers(1, &ebo);
    gl.BindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
    gl.BufferData(
        GL_ELEMENT_ARRAY_BUFFER,
        (GLsizeiptr)(pkt.indices_count * sizeof(uint32_t)),
        pkt.indices,
        GL_STATIC_DRAW
    );
    gl.VertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 6 * (GLsizei)sizeof(float), (const void *)0);
    gl.EnableVertexAttribArray(0);
    gl.VertexAttribPointer(1, 4, GL_FLOAT, GL_FALSE, 6 * (GLsizei)sizeof(float), (const void *)(2 * sizeof(float)));
    gl.EnableVertexAttribArray(1);
    gl.BindVertexArray(0);

    uViewport = gl.GetUniformLocation(prog, "uViewport");

    while (!glfwWindowShouldClose(window)) {
        glfwGetFramebufferSize(window, &fbw, &fbh);
        glViewport(0, 0, fbw, fbh);
        glClearColor(0.01f, 0.02f, 0.06f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        gl.UseProgram(prog);
        if (uViewport >= 0) {
            gl.Uniform2f(uViewport, (float)fbw, (float)fbh);
        }
        gl.BindVertexArray(vao);
        gl.DrawElements(GL_TRIANGLES, (GLsizei)pkt.indices_count, GL_UNSIGNED_INT, (const void *)0);

        glfwSwapBuffers(window);
        glfwPollEvents();
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS) {
            glfwSetWindowShouldClose(window, GLFW_TRUE);
        }
    }

    free(vertex_data);
    gl.DeleteProgram(prog);
    gl.DeleteBuffers(1, &vbo);
    gl.DeleteBuffers(1, &ebo);
    gl.DeleteVertexArrays(1, &vao);
    glfwDestroyWindow(window);
    glfwTerminate();
    free_render_packet(&pkt);
    return 0;
}
