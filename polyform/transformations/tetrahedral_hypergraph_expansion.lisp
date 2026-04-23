;;; ----------------------------------------------------------------
;;; A Conceptual Model for a Dynamic Dataflow System
;;; Enhanced Version with Metadata, Traversal, and Evaluation
;;; ----------------------------------------------------------------

;;; --- Core Data Structures ---

;; Represents a single message or stream.
(define (make-message content)
  (list 'message content))

(define (message-content msg)
  (cadr msg))

;; The 4 vertices of a single transformation flow, now with optional metadata.
;; sink: Can now be a procedure (lambda) for dynamic evaluation.
(define (make-tetrahedron input output socket sink . metadata)
  (list 'tetrahedron
        (list 'input input)
        (list 'output output)
        (list 'socket socket)
        (list 'sink sink)
        (cons 'metadata metadata)))

;; Robust accessors for tetrahedron fields.
(define (tetra-data t) (cdr t)) ; Helper to get the list of fields
(define (tetra-input t) (cadr (assoc 'input (tetra-data t))))
(define (tetra-output t) (cadr (assoc 'output (tetra-data t))))
(define (tetra-socket t) (cadr (assoc 'socket (tetra-data t))))
(define (tetra-sink t) (cadr (assoc 'sink (tetra-data t))))
(define (tetra-metadata t) (cdr (assoc 'metadata (tetra-data t))))

;; The virtual centroid, our self-dual anchor.
(define (make-centroid name tetra)
  (list 'centroid name tetra))

(define (centroid-name c)
  (cadr c))

(define (centroid-tetra c)
  (caddr c))


;;; --- Helper Functions ---

(define (last-element lst)
  (if (null? lst) '() (car (last-pair lst))))

;; Global store for our named centroids for easy lookup.
(define *centroids* (make-hash-table))
(define (register-centroid! c) (hash-table-set! *centroids* (centroid-name c) c))
(define (get-centroid name) (hash-table-get *centroids* name))


;;; --- Hypergraph Expansion & Traversal ---

;; Stitches multiple centroids together to form a new, higher-level tetrahedron.
(define (stitch-tetrahedra new-id parent-names)
  (let* ((parents (map get-centroid parent-names))
         (new-input (list 'source-of (caar parent-names)))
         (new-output (list 'result-of (last-element parent-names)))
         (new-socket (cons 'composite-socket parent-names))
         ;; The sink is now a pipeline of names, to be resolved during evaluation.
         (new-sink (cons 'pipeline parent-names))
         (new-tetra (make-tetrahedron new-input new-output new-socket new-sink)))
    (make-centroid new-id new-tetra)))

;; Recursively traverses a pipeline and prints a tree view.
(define (traverse-pipeline name . (depth 0))
  (let* ((indent (make-string (* 2 depth) #\space))
         (centroid (get-centroid name))
         (tetra (centroid-tetra centroid))
         (sink (tetra-sink tetra)))
    (display (string-append indent "-> Node: " (symbol->string name))) (newline)
    (if (and (pair? sink) (eq? (car sink) 'pipeline))
        (for-each (lambda (child-name) (traverse-pipeline child-name (+ depth 1)))
                  (cdr sink)))))


;;; --- Dynamic Evaluation & Event-Driven Messaging ---

;; Evaluates a pipeline by passing a message through the transformation chain.
(define (evaluate-pipeline name msg)
  (let* ((centroid (get-centroid name))
         (tetra (centroid-tetra centroid))
         (sink (tetra-sink tetra)))
    (if (procedure? sink)
        ;; Base case: The sink is an executable function. Apply it.
        (make-message (sink (message-content msg)))
        (if (and (pair? sink) (eq? (car sink) 'pipeline))
            ;; Recursive step: Fold the evaluation over the child nodes.
            (let loop ((nodes (cdr sink)) (current-msg msg))
              (if (null? nodes)
                  current-msg
                  (loop (cdr nodes) (evaluate-pipeline (car nodes) current-msg))))
            ;; If sink is neither a procedure nor a pipeline, return message as is.
            msg))))


;;; --- Example Usage ---

(display ";;; --- Example Execution ---") (newline)

;; 1. Define base tetrahedra with executable sinks and metadata.
(define tetra-A
  (make-tetrahedron 'raw-audio 'opus-stream 'socket-A
    (lambda (content) (list 'encoded-with-opus content))
    '(:tags (audio encoder)) '(:status active)))

(define tetra-B
  (make-tetrahedron 'opus-stream 'h264-mux 'socket-B
    (lambda (content) (list 'muxed-with-h264 content))
    '(:tags (video muxer))))

(define tetra-C
  (make-tetrahedron 'h264-mux 'final-blob 'socket-C
    (lambda (content) (list 'parsed-metadata content))
    '(:tags (parser final))))

(define tetra-D
  (make-tetrahedron 'user-input 'json-config 'socket-D
    (lambda (content) (list 'processed-config content))
    '(:tags (config))))

;; 2. Create centroids and register them in our global table.
(register-centroid! (make-centroid 'Node-A tetra-A))
(register-centroid! (make-centroid 'Node-B tetra-B))
(register-centroid! (make-centroid 'Node-C tetra-C))
(register-centroid! (make-centroid 'Node-D tetra-D))

;; 3. Stitch nodes together using their names.
(define mega-centroid (stitch-tetrahedra 'Mega-Node-ABC '(Node-A Node-B Node-C)))
(register-centroid! mega-centroid)

(define super-centroid (stitch-tetrahedra 'Super-Node-ABCD '(Mega-Node-ABC Node-D)))
(register-centroid! super-centroid)


(display "; --- 1. Traversal / Visualization of the Pipeline ---") (newline)
(traverse-pipeline 'Super-Node-ABCD)
(newline)

(display "; --- 2. Dynamic Evaluation with Event-Driven Messaging ---") (newline)
(display "Initial Message: (message raw-audio-signal)") (newline)
(define initial-message (make-message 'raw-audio-signal))

(define final-message (evaluate-pipeline 'Super-Node-ABCD initial-message))

(display "Final Message after evaluation:") (newline)
(display final-message) (newline)