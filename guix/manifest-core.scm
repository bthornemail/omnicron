;; Core portable development environment for omnicron.
;; Usage:
;;   guix shell -m guix/manifest-core.scm

(use-modules (gnu packages)
             (guix profiles)
             (srfi srfi-1))

(define required-specs
  '("guile"
    "sbcl"
    "node"
    "git"
    "make"
    "gcc-toolchain"

    ;; QEMU + debugger path.
    "qemu"
    "gdb"))

;; Cross compiler package names vary across Guix revisions.  Keep these
;; best-effort so the portable core shell still instantiates.
(define optional-specs
  '("riscv64-linux-gnu-gcc"
    "riscv64-unknown-elf-gcc-toolchain"
    "riscv64-unknown-elf-toolchain"))

(define (maybe-package spec)
  (let ((matches (find-packages-by-name spec)))
    (and (pair? matches) (car matches))))

(packages->manifest
 (append
  (map specification->package required-specs)
  (filter-map maybe-package optional-specs)))
