;;; omi_header8_reader.lisp
;;;
;;; OMI-LISP HEADER8 READER
;;; Brian Thorne
;;;
;;; Purpose:
;;;   Interpret HEADER8 as scope, boundary, and dialect rather than just bytes.
;;;
;;; Canonical HEADER8 slots:
;;;   [0] 0x00 = NULL
;;;   [1] 0x1B = ESC
;;;   [2] 0x1C = FS
;;;   [3] 0x1D = GS
;;;   [4] 0x1E = RS
;;;   [5] 0x1F = US
;;;   [6] input
;;;   [7] current-state
;;;
;;; This file is intentionally alist-oriented and Lisp-1.5-scale.

;;; ----------------------------------------------------------------------
;;; 0. CONSTANTS
;;; ----------------------------------------------------------------------

#+common-lisp
(progn
  (defparameter NULL-BYTE #x00)
  (defparameter ESC-BYTE  #x1B)
  (defparameter FS-BYTE   #x1C)
  (defparameter GS-BYTE   #x1D)
  (defparameter RS-BYTE   #x1E)
  (defparameter US-BYTE   #x1F)
  (defparameter ASCII-PLANE   'ASCII)
  (defparameter BRAILLE-PLANE 'BRAILLE)
  (defparameter AEGEAN-PLANE  'AEGEAN))

#-common-lisp
(progn
  (setq NULL-BYTE #x00)
  (setq ESC-BYTE  #x1B)
  (setq FS-BYTE   #x1C)
  (setq GS-BYTE   #x1D)
  (setq RS-BYTE   #x1E)
  (setq US-BYTE   #x1F)
  (setq ASCII-PLANE   'ASCII)
  (setq BRAILLE-PLANE 'BRAILLE)
  (setq AEGEAN-PLANE  'AEGEAN))

;;; ----------------------------------------------------------------------
;;; 1. BASIC HELPERS
;;; ----------------------------------------------------------------------

(defun byte-eq (a b)
  (eq a b))

(defun member8 (x xs)
  (cond
    ((null xs) nil)
    ((eq x (car xs)) t)
    (t (member8 x (cdr xs)))))

(defun list8 (a b c d e f g h)
  (cons a
    (cons b
      (cons c
        (cons d
          (cons e
            (cons f
              (cons g
                (cons h nil)))))))))

(defun alist-get (key alist)
  (cond
    ((null alist) nil)
    ((eq key (caar alist)) (cdar alist))
    (t (alist-get key (cdr alist)))))

(defun pair-tag (k v)
  (cons k v))

;;; ----------------------------------------------------------------------
;;; 2. HEADER8 SHAPE
;;; ----------------------------------------------------------------------

(defun header8-p (x)
  (cond
    ((null x) nil)
    ((atom x) nil)
    ((null (cddddr x)) nil)  ; not enough cells
    (t t)))

(defun header8-make (input curr)
  (list8 NULL-BYTE ESC-BYTE FS-BYTE GS-BYTE RS-BYTE US-BYTE input curr))

(defun header8-slot0 (h) (nth 0 h))
(defun header8-slot1 (h) (nth 1 h))
(defun header8-slot2 (h) (nth 2 h))
(defun header8-slot3 (h) (nth 3 h))
(defun header8-slot4 (h) (nth 4 h))
(defun header8-slot5 (h) (nth 5 h))
(defun header8-slot6 (h) (nth 6 h))
(defun header8-slot7 (h) (nth 7 h))

;;; ----------------------------------------------------------------------
;;; 3. BYTE CLASSIFICATION
;;; ----------------------------------------------------------------------

(defun reference-byte-p (b)
  (and (numberp b) (<= b #x0F)))

(defun pointer-byte-p (b)
  (and (numberp b) (>= b #x10) (<= b #x1F)))

(defun non-printing-byte-p (b)
  (and (numberp b) (<= b #x3F)))

(defun printing-byte-p (b)
  (and (numberp b) (>= b #x40)))

(defun boundary-byte-p (b)
  (member8 b (list FS-BYTE GS-BYTE RS-BYTE US-BYTE)))

(defun plane-of-byte (b)
  (cond
    ((>= b #xC0) AEGEAN-PLANE)
    ((>= b #x80) BRAILLE-PLANE)
    (t ASCII-PLANE)))

(defun direction-of-byte (b)
  (cond
    ((>= b #x80) 'RTL)
    (t 'LTR)))

(defun complement-mode-of-byte (b)
  (cond
    ((>= b #x80) 'TWOS)
    (t 'ONES)))

;;; ----------------------------------------------------------------------
;;; 4. PRE-HEADER LADDER
;;; ----------------------------------------------------------------------

(defun preheader-ladder ()
  '((BOUNDARY   . (NULL . ESC))
    (MODE       . (CONTROL . SIGNAL))
    (BINDING    . (REFERENCES . POINTERS))
    (VISIBILITY . (NON-PRINTING . PRINTING))
    (SURFACE    . (ASCII . BRAILLE))
    (HEADER     . AEGEAN)))

;;; ----------------------------------------------------------------------
;;; 5. HEADER8 -> SCOPE RECORD
;;; ----------------------------------------------------------------------
;;;
;;; Returns an alist describing how the runtime should hear the following stream.

(defun header8->scope (h)
  (let ((input (header8-slot6 h))
        (curr  (header8-slot7 h)))
    `((PREHEADER   . ,(preheader-ladder))
      (NULL        . ,(header8-slot0 h))
      (ESC         . ,(header8-slot1 h))
      (FS          . ,(header8-slot2 h))
      (GS          . ,(header8-slot3 h))
      (RS          . ,(header8-slot4 h))
      (US          . ,(header8-slot5 h))
      (INPUT       . ,input)
      (STATE       . ,curr)
      (BOUNDARY    . ,(cond ((byte-eq input ESC-BYTE) 'ESC)
                            ((boundary-byte-p input) 'BOUNDARY)
                            (t 'NONE)))
      (BINDING     . ,(cond ((reference-byte-p input) 'REFERENCES)
                            ((pointer-byte-p input)   'POINTERS)
                            (t 'UNSPECIFIED)))
      (VISIBILITY  . ,(cond ((non-printing-byte-p input) 'NON-PRINTING)
                            (t 'PRINTING)))
      (SURFACE     . ,(plane-of-byte input))
      (DIRECTION   . ,(direction-of-byte input))
      (COMPLEMENT  . ,(complement-mode-of-byte input))
      (LEXICAL-HI  . ,(ash input -4))
      (LEXICAL-LO  . ,(logand input #x0F))
      (RUNTIME-MODE . ,(cond
                         ((byte-eq input ESC-BYTE) 'ESCAPE)
                         ((boundary-byte-p input)  'SEPARATOR)
                         ((reference-byte-p input) 'LOOKUP)
                         ((pointer-byte-p input)   'ADDRESS)
                         ((eq (plane-of-byte input) AEGEAN-PLANE) 'HEADER)
                         ((eq (plane-of-byte input) BRAILLE-PLANE) 'PAYLOAD)
                         (t 'ATOM))))))

;;; ----------------------------------------------------------------------
;;; 6. HEADER8 -> DECIMAL DOT-NOTATION HEARING
;;; ----------------------------------------------------------------------
;;;
;;; This is the "how do we hear what follows?" bridge.

(defun header8->decimal-dot-mode (h)
  (let* ((scope (header8->scope h))
         (mode  (alist-get 'RUNTIME-MODE scope))
         (surf  (alist-get 'SURFACE scope))
         (bind  (alist-get 'BINDING scope))
         (vis   (alist-get 'VISIBILITY scope)))
    `((READ-AS .
       ,(cond
          ((eq mode 'ESCAPE)   'MODE-SHIFT)
          ((eq mode 'SEPARATOR)'PARTITION)
          ((eq mode 'LOOKUP)   'REFERENCE-LOOKUP)
          ((eq mode 'ADDRESS)  'POINTER-ADDRESS)
          ((eq mode 'HEADER)   'AEGEAN-HEADER)
          ((eq mode 'PAYLOAD)  'BRAILLE-PAYLOAD)
          ((and (eq surf 'ASCII) (eq vis 'PRINTING)) 'DECIMAL-DOT-ATOM)
          (t 'CONTROL-ATOM)))
      (BINDING . ,bind)
      (SURFACE . ,surf)
      (VISIBILITY . ,vis))))

;;; ----------------------------------------------------------------------
;;; 7. MIXED-RADIX WITNESS
;;; ----------------------------------------------------------------------
;;;
;;; This does not yet evaluate numbers; it states the active radix regime.

(defun header8->mixed-radix (h)
  (let ((input (header8-slot6 h)))
    `((ASCII   . 16)
      (BRAILLE . 256)
      (AEGEAN  . 64)
      (ACTIVE  . ,(cond
                    ((eq (plane-of-byte input) ASCII-PLANE) 16)
                    ((eq (plane-of-byte input) BRAILLE-PLANE) 256)
                    (t 64))))))

;;; ----------------------------------------------------------------------
;;; 8. FULL INTERPRETIVE RECORD
;;; ----------------------------------------------------------------------

(defun header8-read (h)
  `((HEADER8       . ,h)
    (SCOPE         . ,(header8->scope h))
    (DOT-MODE      . ,(header8->decimal-dot-mode h))
    (MIXED-RADIX   . ,(header8->mixed-radix h))))

;;; ----------------------------------------------------------------------
;;; 9. EXAMPLES
;;; ----------------------------------------------------------------------

#+common-lisp
(progn
  (defparameter *header8-esc*      (header8-make #x1B #x02))
  (defparameter *header8-fs*       (header8-make #x1C #x11))
  (defparameter *header8-dot*      (header8-make #x2E #x22))
  (defparameter *header8-zero*     (header8-make #x30 #x33))
  (defparameter *header8-braille*  (header8-make #x80 #x04))
  (defparameter *header8-aegean*   (header8-make #xC0 #x05))
  (defparameter *read-esc*      (header8-read *header8-esc*))
  (defparameter *read-fs*       (header8-read *header8-fs*))
  (defparameter *read-dot*      (header8-read *header8-dot*))
  (defparameter *read-zero*     (header8-read *header8-zero*))
  (defparameter *read-braille*  (header8-read *header8-braille*))
  (defparameter *read-aegean*   (header8-read *header8-aegean*)))

#-common-lisp
(progn
  (setq *header8-esc*      (header8-make #x1B #x02))
  (setq *header8-fs*       (header8-make #x1C #x11))
  (setq *header8-dot*      (header8-make #x2E #x22))
  (setq *header8-zero*     (header8-make #x30 #x33))
  (setq *header8-braille*  (header8-make #x80 #x04))
  (setq *header8-aegean*   (header8-make #xC0 #x05))
  (setq *read-esc*      (header8-read *header8-esc*))
  (setq *read-fs*       (header8-read *header8-fs*))
  (setq *read-dot*      (header8-read *header8-dot*))
  (setq *read-zero*     (header8-read *header8-zero*))
  (setq *read-braille*  (header8-read *header8-braille*))
  (setq *read-aegean*   (header8-read *header8-aegean*)))

;;; ----------------------------------------------------------------------
;;; 10. SUMMARY
;;; ----------------------------------------------------------------------
;;;
;;; HEADER8 is treated here as:
;;;   control injection over runtime
;;;
;;; not merely:
;;;   eight bytes
;;;
;;; This file interprets HEADER8 as:
;;;   boundary
;;;   binding mode
;;;   visibility mode
;;;   surface dialect
;;;   direction/complement mode
;;;   decimal dot-notation hearing
;;;   mixed-radix regime
