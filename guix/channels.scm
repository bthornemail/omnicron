;; Guix channels for reproducible environments.
;; Usage:
;;   guix pull -C guix/channels.scm

(list
 (channel
  (name 'guix)
  (url "https://git.savannah.gnu.org/git/guix.git")
  (branch "master")))
