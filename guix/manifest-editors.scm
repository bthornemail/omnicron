;; Optional UI/editor layer for omnicron.
;; This manifest is resilient: if an editor package does not exist in your
;; current Guix channel revision, it is skipped.
;;
;; Usage:
;;   guix shell -m guix/manifest-core.scm -m guix/manifest-editors.scm

(use-modules (guix profiles)
             (guix packages)
             (gnu packages)
             (srfi srfi-1))

(define optional-specs
  '("electron" "atom" "pulsar"))

(define (maybe-package spec)
  (let ((matches (find-packages-by-name spec)))
    (and (pair? matches) (car matches))))

(packages->manifest (filter-map maybe-package optional-specs))
