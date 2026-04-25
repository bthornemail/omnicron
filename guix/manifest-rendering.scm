;; Rendering and logic-CAD development layer for omnicron.
;;
;; Usage:
;;   guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm
;;
;; This manifest is intentionally layered on top of manifest-core.scm.  The
;; substrate/runtime toolchain stays small; this layer adds the presentation
;; laboratory for polyform rendering, OpenGL/OpenGL ES, WebGL-adjacent browser
;; work, and CAD-style geometry experiments.

(use-modules (gnu packages)
             (guix profiles)
             (guix packages)
             (srfi srfi-1))

(define required-specs
  '("pkg-config"
    "mesa"
    "glfw"
    "glew"
    "glu"
    "freeglut"
    "libx11"
    "libxrandr"
    "libxi"
    "libxcursor"
    "libxinerama"
    "libpng"
    "zlib"
    "python"
    "node"
    "graphviz"
    "imagemagick"))

;; These are useful for WebGL/CAD/polyform exploration, but availability can
;; vary by channel revision and architecture.  Skip missing packages instead of
;; making the whole shell unusable.
(define optional-specs
  '("mesa-utils"
    "emscripten"
    "binaryen"
    "openscad"
    "freecad"
    "blender"
    "assimp"
    "glm"))

(define (maybe-package spec)
  (let ((matches (find-packages-by-name spec)))
    (and (pair? matches) (car matches))))

(packages->manifest
 (append
  (map specification->package required-specs)
  (filter-map maybe-package optional-specs)))
