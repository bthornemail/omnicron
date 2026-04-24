;;; omi_loader.lisp
;;;
;;; TOP-LEVEL OMI-LISP LOADER
;;;
;;; Threads the full pipeline:
;;;
;;;   bytes
;;;    -> HEADER8
;;;    -> HEADER8 reader
;;;    -> rewrite core
;;;    -> emit
;;;
;;; Load order:
;;;   1. omi_header8_reader.lisp
;;;   2. omi_rewrite_core.lisp
;;;   3. this file
;;;
;;; ----------------------------------------------------------------------
;;; 0. SIMPLE UTILITIES
;;; ----------------------------------------------------------------------

#+common-lisp
(defmacro label (name lambda-form)
  `(setf (symbol-function ',name) ,lambda-form))

#-common-lisp
(defun consp (x)
  (cond ((atom x) nil)
        (t t)))

#-common-lisp
(defun cadr (x) (car (cdr x)))

(defun reverse1 (xs)
  #+common-lisp
  (labels ((rev (xs acc)
             (cond ((null xs) acc)
                   (t (rev (cdr xs) (cons (car xs) acc))))))
    (rev xs nil))
  #-common-lisp
  (label rev
    (lambda (xs acc)
      (cond ((null xs) acc)
            (t (rev (cdr xs) (cons (car xs) acc))))))
  #-common-lisp
  (rev xs nil))

(defun append1 (a b)
  (cond ((null a) b)
        (t (cons (car a) (append1 (cdr a) b)))))

(defun length1 (xs)
  (cond ((null xs) 0)
        (t (+ 1 (length1 (cdr xs))))))

;;; ----------------------------------------------------------------------
;;; 1. BYTE -> HEADER8
;;; ----------------------------------------------------------------------
;;;
;;; Minimal runtime witness in Lisp form.
;;; Mirrors the C scaffold enough for testing.

#+common-lisp
(progn
  (defparameter *omi-tick* 0)
  (defparameter *omi-state* 0))

#-common-lisp
(progn
  (setq *omi-tick* 0)
  (setq *omi-state* 0))

(defun mod64 (x)
  (mod x 64))

(defun simple-winner (prev input tick)
  (mod (+ (* prev 17) (* input 29) tick) 7))

(defun simple-next-state (prev input winner)
  (mod64 (+ prev input winner 2)))

(defun make-header8-from-byte (byte)
  (let ((prev *omi-state*)
        (tick (+ *omi-tick* 1)))
    (let ((winner (simple-winner prev byte tick)))
      (let ((curr (simple-next-state prev byte winner)))
        (setq *omi-tick* tick)
        (setq *omi-state* curr)
        (header8-make byte curr)))))

;;; ----------------------------------------------------------------------
;;; 2. BYTE -> READ RECORD
;;; ----------------------------------------------------------------------

(defun byte->read (byte)
  (header8-read (make-header8-from-byte byte)))

;;; ----------------------------------------------------------------------
;;; 3. BYTE -> EMIT
;;; ----------------------------------------------------------------------

(defun byte->emit (byte)
  (omi-step-term (byte->read byte)))

;;; ----------------------------------------------------------------------
;;; 4. STREAM PROCESSING
;;; ----------------------------------------------------------------------

(defun bytes->reads (bytes)
  #+common-lisp
  (labels ((run (xs acc)
             (cond
               ((null xs) (reverse1 acc))
               (t (run (cdr xs)
                       (cons (byte->read (car xs)) acc))))))
    (run bytes nil))
  #-common-lisp
  (label run
    (lambda (xs acc)
      (cond
        ((null xs) (reverse1 acc))
        (t (run (cdr xs)
                (cons (byte->read (car xs)) acc))))))
  #-common-lisp
  (run bytes nil))

(defun bytes->emits (bytes)
  #+common-lisp
  (labels ((run (xs acc)
             (cond
               ((null xs) (reverse1 acc))
               (t (run (cdr xs)
                       (cons (byte->emit (car xs)) acc))))))
    (run bytes nil))
  #-common-lisp
  (label run
    (lambda (xs acc)
      (cond
        ((null xs) (reverse1 acc))
        (t (run (cdr xs)
                (cons (byte->emit (car xs)) acc))))))
  #-common-lisp
  (run bytes nil))

;;; ----------------------------------------------------------------------
;;; 5. ASCII TEST STREAMS
;;; ----------------------------------------------------------------------

#+common-lisp
(progn
  (defparameter *stream-control* '(0 27 28 29 30 31))
  (defparameter *stream-boot* '(0 27 28 29 30 31 46 48 64))
  (defparameter *stream-mixed* '(0 27 46 48 65 66 67 128 192)))

#-common-lisp
(progn
  (setq *stream-control* '(0 27 28 29 30 31))
  (setq *stream-boot* '(0 27 28 29 30 31 46 48 64))
  (setq *stream-mixed* '(0 27 46 48 65 66 67 128 192)))

;;; ----------------------------------------------------------------------
;;; 6. HUMAN NAMING (OPTIONAL)
;;; ----------------------------------------------------------------------

(defun ascii-name (b)
  (cond
    ((eq b 0) 'NUL)
    ((eq b 27) 'ESC)
    ((eq b 28) 'FS)
    ((eq b 29) 'GS)
    ((eq b 30) 'RS)
    ((eq b 31) 'US)
    ((eq b 46) 'DOT)
    ((eq b 48) 'ZERO)
    ((eq b 64) 'AT)
    (t b)))

(defun named-stream (xs)
  (cond
    ((null xs) nil)
    (t (cons (ascii-name (car xs))
             (named-stream (cdr xs))))))

;;; ----------------------------------------------------------------------
;;; 7. TRANSCRIPT WITNESS
;;; ----------------------------------------------------------------------
;;;
;;; Produces records:
;;;   (BYTE . b)
;;;   (READ . ...)
;;;   (EMIT . ...)

(defun byte-transcript (b)
  (cons (cons 'BYTE b)
        (cons (cons 'READ (byte->read b))
              (cons (cons 'EMIT (byte->emit b))
                    nil))))

(defun stream-transcript (bytes)
  #+common-lisp
  (labels ((run (xs acc)
             (cond
               ((null xs) (reverse1 acc))
               (t (run (cdr xs)
                       (cons (byte-transcript (car xs)) acc))))))
    (run bytes nil))
  #-common-lisp
  (label run
    (lambda (xs acc)
      (cond
        ((null xs) (reverse1 acc))
        (t (run (cdr xs)
                (cons (byte-transcript (car xs)) acc))))))
  #-common-lisp
  (run bytes nil))

;;; ----------------------------------------------------------------------
;;; 8. RESET
;;; ----------------------------------------------------------------------

(defun omi-reset ()
  (setq *omi-tick* 0)
  (setq *omi-state* 0)
  'OK)

;;; ----------------------------------------------------------------------
;;; 9. DEMOS
;;; ----------------------------------------------------------------------

(defun demo-control ()
  (omi-reset)
  (bytes->emits *stream-control*))

(defun demo-boot ()
  (omi-reset)
  (bytes->emits *stream-boot*))

(defun demo-mixed ()
  (omi-reset)
  (bytes->emits *stream-mixed*))

(defun demo-transcript ()
  (omi-reset)
  (stream-transcript *stream-boot*))

;;; ----------------------------------------------------------------------
;;; 10. ENTRY IDEA
;;; ----------------------------------------------------------------------
;;;
;;; Typical use:
;;;
;;;   (omi-reset)
;;;   (byte->emit 27)
;;;   (bytes->emits '(0 27 28 46 48))
;;;   (demo-transcript)
;;;
;;; This is the runnable spine:
;;;
;;;   byte
;;;    -> header8
;;;    -> header8-read
;;;    -> rewrite/fixpoint
;;;    -> emit
