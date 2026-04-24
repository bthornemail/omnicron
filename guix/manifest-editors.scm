;; Optional UI/editor layer for omnicron.
;; This manifest is resilient: if an editor package does not exist in your
;; current Guix channel revision, it is skipped.
;;
;; Usage:
;;   guix shell -m guix/manifest-core.scm -m guix/manifest-editors.scm

(use-modules (guix profiles)
             (guix packages)
             (ice-9 exceptions)
             (srfi srfi-1))

(define optional-specs
  '("electron" "atom" "pulsar"))

(define (maybe-package spec)
  (false-if-exception (package-specification->package spec)))

(packages->manifest (filter-map maybe-package optional-specs))
