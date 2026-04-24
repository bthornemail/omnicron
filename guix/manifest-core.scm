;; Core portable development environment for omnicron.
;; Usage:
;;   guix shell -m guix/manifest-core.scm

(use-modules (gnu packages))

(specifications->manifest
 (list
  ;; Core language/runtime tools used by this repo.
  "guile"
  "sbcl"
  "node"
  "git"
  "make"
  "gcc-toolchain"

  ;; QEMU + cross-debug/toolchain path.
  "qemu"
  "gdb"
  "riscv64-linux-gnu-gcc"))
