# Logic-CAD Rendering Environment

This project treats rendering as a deterministic projection of logic, not as a
separate art pipeline.  The same framed stream can be checked as a pre-header,
typed through `header8`, rewritten as pairs, emitted as a render packet, and
then projected through SVG, OpenGL, OpenGL ES, or WebGL.

## Declarative Guix Shell

Use the core runtime tools plus the rendering layer:

```bash
guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm
```

The rendering layer adds the development surface for:

- native OpenGL via Mesa + GLFW
- OpenGL ES/WebGL-adjacent experiments through Mesa GLES and Node tooling
- SVG/raster inspection with Graphviz and ImageMagick
- optional CAD/polyform tools when available in the selected Guix channel

The optional packages are intentionally best-effort.  If `openscad`, `freecad`,
`blender`, `emscripten`, or related packages are missing in a channel revision,
the shell still provides the core render/test surface.

## Validate The Surface

Inside the shell:

```bash
make verify-rendering-env
make poc-mixedbase-header8-render
make verify-render-contract
make omnicron-viewer
```

The first target verifies that the host has the commands and pkg-config entries
needed by the native viewer.  The render targets prove the logic path:

```text
mixed-base stream
-> strict pre-header/header8 witness
-> canonical render packet
-> SVG/OpenGL/WebGL projection surface
```

## Why This Looks Like CAD

Computer-aided drafting is a constraint/rendering problem: symbolic operations
declare geometry, and a renderer projects that geometry into a surface.  The
Omnicron version keeps the same separation but moves the declaration closer to
the substrate:

```text
pre-header gate
-> header8 typecaster
-> dot/pair rewrite
-> polyform cells
-> render packet
-> OpenGL / OpenGL ES / WebGL / SVG
```

The polyform is the CAD object and the logic program at the same time.  A cell
is not only a visual unit; it can be a rule pointer, continuation brick, lookup
entry, or frame witness.  Rendering is therefore a replay check: if two machines
agree on the same framed logic and the same render contract, they should produce
the same canonical geometry before any platform-specific projection happens.

## Surface Roles

- `SVG` is the easiest audit surface.  It is deterministic and good for CI.
- `OpenGL` is the native interactive surface for local inspection.
- `OpenGL ES` is the embedded/mobile/QEMU-adjacent surface.
- `WebGL` is the browser projection of the OpenGL ES model.
- `CAD tools` are optional downstream consumers for exported mesh/shape data.

The authority remains the framed logic and render packet, not the pixels.
