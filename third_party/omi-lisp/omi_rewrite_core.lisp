;;; omi_rewrite_core.lisp
;;;
;;; OMI-LISP REWRITE CORE
;;; Brian Thorne
;;;
;;; This file implements the execution model you clarified:
;;;
;;;   ASCII control lattice   = pre-language substrate
;;;   HEADER8                 = runtime control injection
;;;   minimal Datalog         = relational constraint layer
;;;   dot notation            = structural language layer
;;;   LABEL / Z               = recursion mechanism
;;;
;;; There is no central EVAL/APPLY primitive here.
;;; Execution is:
;;;
;;;   STREAM
;;;    -> HEADER8
;;;    -> classify
;;;    -> match
;;;    -> rewrite
;;;    -> fixpoint
;;;    -> emit
;;;
;;; Assumes:
;;;   - omi_header8_reader.lisp for HEADER8 interpretation
;;;   - basic Lisp functions: atom eq car cdr cons cond null label lambda
;;;
;;; ----------------------------------------------------------------------
;;; 0. SMALL HELPERS
;;; ----------------------------------------------------------------------

#+common-lisp
(defmacro label (name lambda-form)
  `(setf (symbol-function ',name) ,lambda-form))

#-common-lisp
(defun consp (x)
  (cond ((atom x) nil)
        (t t)))

#-common-lisp
(defun cadr   (x) (car (cdr x)))
#-common-lisp
(defun caddr  (x) (car (cdr (cdr x))))
#-common-lisp
(defun cadddr (x) (car (cdr (cdr (cdr x)))))

(defun assoc1 (k xs)
  (cond ((null xs) nil)
        ((eq k (caar xs)) (car xs))
        (t (assoc1 k (cdr xs)))))

(defun alist-get (k xs)
  (cond ((null xs) nil)
        ((eq k (caar xs)) (cdar xs))
        (t (alist-get k (cdr xs)))))

(defun append1 (a b)
  (cond ((null a) b)
        (t (cons (car a) (append1 (cdr a) b)))))

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

(defun list2 (a b) (cons a (cons b nil)))
(defun list3 (a b c) (cons a (cons b (cons c nil))))
(defun list4 (a b c d) (cons a (cons b (cons c (cons d nil)))))

;;; ----------------------------------------------------------------------
;;; 1. CANONICAL TERM SHAPES
;;; ----------------------------------------------------------------------
;;;
;;; A term is one of:
;;;   atom
;;;   (QUOTE . x)
;;;   (PAIR  . (a . b))
;;;   (SEQ   . xs)
;;;   (TOKEN . payload)
;;;   (EMIT  . payload)
;;;   (RULE  . (pattern . body))

(defun quoted (x)
  (cons 'QUOTE x))

(defun pair-term (a b)
  (cons 'PAIR (cons a b)))

(defun seq-term (xs)
  (cons 'SEQ xs))

(defun token-term (x)
  (cons 'TOKEN x))

(defun emit-term (x)
  (cons 'EMIT x))

(defun rule-term (pattern body)
  (cons 'RULE (cons pattern body)))

;;; ----------------------------------------------------------------------
;;; 2. STRUCTURAL MATCHING
;;; ----------------------------------------------------------------------
;;;
;;; Pattern language:
;;;   atom        exact atom match
;;;   (? x)       bind variable x
;;;   pair/tree   recursive match
;;;
;;; Returns environment alist or NIL if no match.

(defun var-pattern-p (p)
  (cond ((atom p) nil)
        ((atom (car p))
         (eq (car p) '?))
        (t nil)))

(defun extend-binding (name value env)
  (cond ((null (assoc1 name env)) (cons (cons name value) env))
        ((equal value (alist-get name env)) env)
        (t 'FAIL)))

(defun match-term (pattern term env)
  (cond
    ((eq env 'FAIL) 'FAIL)

    ((var-pattern-p pattern)
     (extend-binding (cadr pattern) term env))

    ((atom pattern)
     (cond ((eq pattern term) env)
           (t 'FAIL)))

    ((atom term) 'FAIL)

    (t
     (match-term (cdr pattern)
                 (cdr term)
                 (match-term (car pattern)
                             (car term)
                             env)))))

(defun match (pattern term)
  (let ((r (match-term pattern term nil)))
    (cond ((eq r 'FAIL) nil)
          (t r))))

;;; ----------------------------------------------------------------------
;;; 3. SUBSTITUTION
;;; ----------------------------------------------------------------------

(defun subst1 (form env)
  (cond
    ((atom form) form)
    ((var-pattern-p form)
     (let ((hit (assoc1 (cadr form) env)))
       (cond (hit (cdr hit))
             (t form))))
    (t (cons (subst1 (car form) env)
             (subst1 (cdr form) env)))))

;;; ----------------------------------------------------------------------
;;; 4. RULES
;;; ----------------------------------------------------------------------
;;;
;;; Rules are ordinary alist-ish entries:
;;;
;;;   (name . (RULE pattern . body))
;;;
;;; Body may be:
;;;   - literal replacement
;;;   - a constructor form using (? x) variables
;;;   - an EMIT form
;;;
;;; Minimal starter rules reflect your HEADER8-driven execution model.

#+common-lisp
(defparameter *omi-rules*
  '(
    (esc-boundary .
      (RULE
        (SCOPE
         ((BOUNDARY . ESC) . (? rest))
         . (? body))
        .
        (EMIT . (MODE-SHIFT . (? body)))))

    (fs-boundary .
      (RULE
        (SCOPE
         ((BOUNDARY . BOUNDARY) . (? rest))
         . (? body))
        .
        (EMIT . (PARTITION . (? body)))))

    (reference-lookup .
      (RULE
        (SCOPE
         ((? head) (BINDING . REFERENCES) . (? rest))
         . (? body))
        .
        (TOKEN . (REFERENCE . (? body)))))

    (pointer-address .
      (RULE
        (SCOPE
         ((? head) (BINDING . POINTERS) . (? rest))
         . (? body))
        .
        (TOKEN . (POINTER . (? body)))))

    (ascii-atom .
      (RULE
        (SCOPE
         ((? boundary) (? binding) (? visibility) (SURFACE . ASCII) . (? rest))
         . (? body))
        .
        (TOKEN . (ASCII . (? body)))))

    (braille-payload .
      (RULE
        (SCOPE
         ((? boundary) (? binding) (? visibility) (SURFACE . BRAILLE) . (? rest))
         . (? body))
        .
        (TOKEN . (BRAILLE . (? body)))))

    (aegean-header .
      (RULE
        (SCOPE
         ((? boundary) (? binding) (? visibility) (SURFACE . AEGEAN) . (? rest))
         . (? body))
        .
        (TOKEN . (AEGEAN . (? body)))))
   ))

#-common-lisp
(setq *omi-rules*
  '(
    (esc-boundary .
      (RULE
        (SCOPE
         ((BOUNDARY . ESC) . (? rest))
         . (? body))
        .
        (EMIT . (MODE-SHIFT . (? body)))))

    (fs-boundary .
      (RULE
        (SCOPE
         ((BOUNDARY . BOUNDARY) . (? rest))
         . (? body))
        .
        (EMIT . (PARTITION . (? body)))))

    (reference-lookup .
      (RULE
        (SCOPE
         ((? head) (BINDING . REFERENCES) . (? rest))
         . (? body))
        .
        (TOKEN . (REFERENCE . (? body)))))

    (pointer-address .
      (RULE
        (SCOPE
         ((? head) (BINDING . POINTERS) . (? rest))
         . (? body))
        .
        (TOKEN . (POINTER . (? body)))))

    (ascii-atom .
      (RULE
        (SCOPE
         ((? boundary) (? binding) (? visibility) (SURFACE . ASCII) . (? rest))
         . (? body))
        .
        (TOKEN . (ASCII . (? body)))))

    (braille-payload .
      (RULE
        (SCOPE
         ((? boundary) (? binding) (? visibility) (SURFACE . BRAILLE) . (? rest))
         . (? body))
        .
        (TOKEN . (BRAILLE . (? body)))))

    (aegean-header .
      (RULE
        (SCOPE
         ((? boundary) (? binding) (? visibility) (SURFACE . AEGEAN) . (? rest))
         . (? body))
        .
        (TOKEN . (AEGEAN . (? body)))))
   ))

(defun rule-pattern (rule-entry)
  (cadr (cdr rule-entry)))

(defun rule-body (rule-entry)
  (cddr (cdr rule-entry)))

(defun try-rule (rule-entry term)
  (let ((env (match (rule-pattern rule-entry) term)))
    (cond (env (subst1 (rule-body rule-entry) env))
          (t nil))))

(defun rewrite-once-rules (rules term)
  (cond
    ((null rules) term)
    (t
      (let ((hit (try-rule (car rules) term)))
        (cond (hit hit)
              (t (rewrite-once-rules (cdr rules) term)))))))

;;; ----------------------------------------------------------------------
;;; 5. HEADER8 -> EXECUTION TERM
;;; ----------------------------------------------------------------------
;;;
;;; This layer consumes the interpretive record from omi_header8_reader.lisp
;;; and converts it into a rewrite subject.
;;;
;;; Expected input shape:
;;;   ((HEADER8 . ...)
;;;    (SCOPE . <scope-record>)
;;;    (DOT-MODE . ...)
;;;    (MIXED-RADIX . ...))

(defun header-read->term (header-read-record)
  (let ((scope (alist-get 'SCOPE header-read-record))
        (dotm  (alist-get 'DOT-MODE header-read-record))
        (mr    (alist-get 'MIXED-RADIX header-read-record)))
    (cons 'SCOPE
          (cons
            (list4
              (cons 'BOUNDARY   (alist-get 'BOUNDARY scope))
              (cons 'BINDING    (alist-get 'BINDING scope))
              (cons 'VISIBILITY (alist-get 'VISIBILITY scope))
              (cons 'SURFACE    (alist-get 'SURFACE scope)))
            (list3
              (cons 'INPUT      (alist-get 'INPUT scope))
              (cons 'DOT-MODE   dotm)
              (cons 'MIXED-RADIX mr))))))

;;; ----------------------------------------------------------------------
;;; 6. REWRITE STEP
;;; ----------------------------------------------------------------------

(defun rewrite-once (term)
  (rewrite-once-rules *omi-rules* term))

(defun normal-form-p (a b)
  (equal a b))

(defun reduce-fixpoint (term)
  #+common-lisp
  (labels ((rf (prev curr)
             (cond ((normal-form-p prev curr) curr)
                   (t (rf curr (rewrite-once curr))))))
    (rf nil term))
  #-common-lisp
  (label rf
    (lambda (prev curr)
      (cond ((normal-form-p prev curr) curr)
            (t (rf curr (rewrite-once curr))))))
  #-common-lisp
  (rf nil term))

;;; ----------------------------------------------------------------------
;;; 7. EMISSION
;;; ----------------------------------------------------------------------
;;;
;;; EMIT is the visible witness. This can later be projected to ASCII/Braille/Aegean.

(defun emit (x)
  (cond
    ((atom x) x)
    ((eq (car x) 'EMIT) x)
    ((eq (car x) 'TOKEN) (emit-term x))
    (t (emit-term x))))

;;; ----------------------------------------------------------------------
;;; 8. FULL STEP
;;; ----------------------------------------------------------------------
;;;
;;; This is the execution spine:
;;;   HEADER8-READ -> TERM -> FIXPOINT -> EMIT

(defun omi-step-term (header-read-record)
  (let ((term (header-read->term header-read-record)))
    (emit (reduce-fixpoint term))))

;;; ----------------------------------------------------------------------
;;; 9. OPTIONAL LABEL-BASED RECURSIVE DRIVER
;;; ----------------------------------------------------------------------
;;;
;;; For stream processing, use LABEL as the recursion mechanism rather than eval/apply.

(defun omi-run (header-read-records)
  #+common-lisp
  (labels ((run (xs acc)
             (cond
               ((null xs) (reverse1 acc))
               (t (run (cdr xs)
                       (cons (omi-step-term (car xs)) acc))))))
    (run header-read-records nil))
  #-common-lisp
  (label run
    (lambda (xs acc)
      (cond
        ((null xs) (reverse1 acc))
        (t (run (cdr xs)
                (cons (omi-step-term (car xs)) acc))))))
  #-common-lisp
  (run header-read-records nil))

;;; ----------------------------------------------------------------------
;;; 10. OPTIONAL STRICT FIXPOINT COMBINATOR
;;; ----------------------------------------------------------------------
;;;
;;; If you prefer explicit strict recursion.

#+common-lisp
(defparameter Z
  '(LAMBDA (F)
     ((LAMBDA (X)
        (F (LAMBDA (V) ((X X) V))))
      (LAMBDA (X)
        (F (LAMBDA (V) ((X X) V)))))))

#-common-lisp
(setq Z
  '(LAMBDA (F)
     ((LAMBDA (X)
        (F (LAMBDA (V) ((X X) V))))
      (LAMBDA (X)
        (F (LAMBDA (V) ((X X) V)))))))

;;; ----------------------------------------------------------------------
;;; 11. EXAMPLES
;;; ----------------------------------------------------------------------
;;;
;;; These expect *read-esc*, *read-fs*, *read-dot*, *read-braille*, *read-aegean*
;;; from omi_header8_reader.lisp.

(defun omi-examples ()
  (list
    (omi-step-term *read-esc*)
    (omi-step-term *read-fs*)
    (omi-step-term *read-dot*)
    (omi-step-term *read-braille*)
    (omi-step-term *read-aegean*)))

;;; ----------------------------------------------------------------------
;;; 12. SUMMARY
;;; ----------------------------------------------------------------------
;;;
;;; No central eval/apply.
;;;
;;; Instead:
;;;   HEADER8      = control injection
;;;   MATCH        = relational constraint
;;;   REWRITE      = structural reduction
;;;   LABEL / Z    = recursion
;;;   EMIT         = visible witness
;;;
;;; This is the omi-lisp execution core implied by your architecture.
