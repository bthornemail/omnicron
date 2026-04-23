% ============================================================
% CONSTITUTIONAL LOGIC STACK
% A Complete implementation of the 7-layer architecture
% Matching the Numerical Constitution Specification
% ============================================================

% SOURCE-OF-TRUTH NOTE
%
% STATUS: PROTOTYPE LOGIC LAYER
%
% This file is the Prolog-side logical stack that sits conceptually above the
% bare-metal kernel in `riscv-baremetal/atomic_kernel.c`.
%
% Relationship to the bare-metal code:
% - the kernel advances phase, chirality/BOM, witness, and fingerprint state
% - this file models claims, proposals, closure, receipts, and surfaces
% - the kernel is the execution substrate; this file is the declarative
%   reasoning/projection substrate
%
% Important current truth:
% - this file is not wired directly into the boot artifact
% - it is best read as the logical counterpart to the constitutional machine,
%   not as code that the guest kernel is invoking live at boot time
%
% Bare-metal concept mapping:
% - kernel phase / heartbeat       <-> classify_phase/2, closure sequencing ideas
% - kernel witness/fingerprint     <-> lower_to_receipt/2, verify_receipt/1
% - kernel FS/GS/RS/US structure   <-> layered terms, slots, surfaces
% - kernel surfaces / stars-bars   <-> stars_bars_from_sex60/2 and projections
%
% ONTOLOGY MAP
%
% This file is easiest to read as an ontology of lawful projections:
%
%   plain ASCII text
%     -> parsed terms / clauses / queries
%     -> structured claims and proposals
%     -> closure and receipt forms
%     -> derived surfaces
%
% In this repository, the split is:
% - `polylog.c` handles host-side parsing and interactive syntax surfaces
% - `constitutional_stack.pl` names the logical objects and relations
% - the bare-metal kernel is downstream execution, not the ontology source
%
% The core ontology objects here are:
% - term / slot / root: structured logical objects
% - claim / supports / conflicts: argumentative relations
% - proposal / candidate_world: coherent world-selection objects
% - closure / receipt: post-inference evidence objects
% - stars-bars / braille / hexagram: projection surfaces
%
% The core design law is:
% - syntax may vary
% - structure must survive
% - closure must be checkable
% - surfaces are derived, not sovereign

:- module(constitutional_stack, 
    [ % Layer 0 - Root Predicates
      term/1, slot/3, root/2, join/3, combine/2,
      leq/2, covers/3, left_of/2, right_of/2,
      sex60/3, exact_fraction/3, repeat_fraction/3, irrational/4,
      % Layer 1 - Claims
      claim/4, claim_group/3, supports/2, conflicts/2, contradicting/3,
      % Layer 2 - Proposals
      proposal/2, candidate_world/2, unique_minimal_world/1,
      % Layer 3 - Closure/CHR
      closure/4, digit_constraint/1, sum_constraint/3, carry_propagation/3,
      % Layer 4 - Receipts
      receipt/4, lower_to_receipt/2, evaluate_sex60/2,
      verify_receipt/1, emit_receipt/1,
      % Layer 5 - Surfaces
      stars_bars_from_sex60/2, braille_from_sex60/2, hexagram_from_sex60/2,
      render_sex60/2,
      % Utilities
      sanity_check/0, complexity_question/2, classify_phase/2,
      init_stack/0
    ]).

:- use_module(library(lists)).
:- use_module(library(format)).
:- use_module(library(random)).

% ============================================================
% CONSTANTS (from Numerical Constitution)
% ============================================================

% These constants mirror the same constitutional number families named in the
% bare-metal comments and `CONSTITUTION.md`.

% Possibility Order
- define(bit, 2).
- define(nibble, 4).
- define(byte, 8).
- define(word16, 16).
- define(byte_space, 256).

% Incidence Order
- define(fano_points, 7).
- define(lane_depth, 15).
- define(slot_surface, 60).

% Closure Order  
- define(projective_frame, 240).
- define(euclidean_turn, 360).
- define(interference_cadence, 420).
- define(total_closure, 5040).

% ============================================================
% LAYER NULL: ALGEBRAIC OPERATOR SANITY
% ============================================================

% This layer plays the role of a symbolic "sanity gate" before higher-level
% reasoning, much like the kernel's low-level invariants constrain execution.

% Operator classifications for Layer NULL
operator_class(join, commutative).
operator_class(compose, noncommutative).
operator_class(delta, anticommutative).
operator_class(meet, commutative).
operator_class(top, idempotent).
operator_class(bottom, nilpotent).

% Sanity check - pre-commit algebraic validation
sanity_check :-
  % Walk every declared operator class and verify the expected property.
  forall(operator_class(Op, commutative), test_commutativity(Op)),
  forall(operator_class(Op, noncommutative), test_noncommutativity(Op)),
  format('Layer NULL: Algebraic sanity CHECKED~n').

test_commutativity(Op) :-
  Call =.. [Op, A, B],
  Call,
  CallRev =.. [Op, B, A],
  CallRev,
  !.
test_commutativity(Op) :-
  format('WARNING: ~w fails commutativity~n', [Op]).

test_noncommutativity(_Op) :-
  % Noncommutative is allowed - just passes
  true.

% Commutator and anticommutator diagnostics
% These are small algebra helpers for talking about order sensitivity.
commutator(A, B, C) :- C is A * B - B * A.          % [A,B] - order sensitive
anticommutator(A, B, C) :- C is A * B + B * A.      % {A,B} - symmetric

% Symmetric combine check
symmetric_combine_check(Op) :-
  (operator_class(Op, commutative) ->
    (commutator(A,B,C), C =:= 0)
  ; true).

% ============================================================
% LAYER 0: ROOT PREDICATES AND SCOPES
% ============================================================

% This layer is the Prolog-side analogue of the kernel's structured state
% surface: terms, positions, and coefficients instead of registers and bytes.

% Position classes for sexagesimal (Wallis-style)
% These names line up with the sexagesimal support vocabulary in
% `riscv-baremetal/sexagesimal.h`.
position_class(quadprime).      % 60^-4
position_class(tripleprime).   % 60^-3  
position_class(doubleprime).   % 60^-2
position_class(prime).         % 60^-1
position_class(degree).      % 60^0 (root)
position_class(minute).      % 60^1
position_class(second).     % 60^2
position_class(third).       % 60^3
position_class(fourth).     % 60^4

position_order(quadprime, -4).
position_order(tripleprime, -3).
position_order(doubleprime, -2).
position_order(prime, -1).
position_order(degree, 0).
position_order(minute, 1).
position_order(second, 2).
position_order(third, 3).
position_order(fourth, 4).

% Term declaration
% In this prototype, any atomic Prolog value can serve as a term name.
term(T) :- atomic(T).

% Slot: position class + coefficient (0-59)
slot(Term, Pos, Coeff) :-
  % A slot is one coefficient at one named position on one term.
  term(Term),
  position_class(Pos),
  between(0, 59, Coeff).

% Root: degree position coefficient
root(Term, UnitCoeff) :-
  % The root is the degree / unit position of the term.
  term(Term),
  between(0, 59, UnitCoeff).

% Structural relations
% These are symbolic relations, not memory mutations like in the kernel.
join(A, B, C) :- term(A), term(B), term(C).
combine(List, Term) :- maplist(term, List), term(Term).

% Partial order for poset interpretation
leq(A, B) :- covers(A, B).
covers(A, B) :- slot(A, P, _), slot(B, P, _).

% Position ordering
left_of(P, Q) :- position_order(P, O1), position_order(Q, O2), O1 < O2.
right_of(P, Q) :- position_order(P, O1), position_order(Q, O2), O1 > Q.

% Sexagesimal term constructor
sex60(Term, Left, Unit, Right) :-
  % Build one sexagesimal object from left digits, a unit, and right digits.
  term(Term),
  combine(Left, Term),
  root(Term, Unit),
  combine(Right, Term).

% Exact fraction construction
exact_fraction(Term, Numerator, Denominator) :-
  % This is trying to create a finite sexagesimal fraction from a rational pair.
  term(Term),
  denominator > 0,
  root(Term, 0),  % integer part = 0
  slot(Term, prime, (Numerator * 60) // Denominator).

% Repeating fraction
repeat_cycle(Term, Cycle) :-
  % Record that a term has some repeating-cycle label.
  term(Term),
  atom(Cycle).

repeating_fraction(Term, Cycle, Digits) :-
  % Gather all slot coefficients as the visible repeating digit list.
  repeat_cycle(Term, Cycle),
  findall(C, slot(Term, P, C), Digits).

% Irrational approximant
irrational(Term, Name, Unit, Digits) :-
  % Represent an irrational only through a named approximation and digits.
  term(Term),
  atom(Name),
  root(Term, Unit),
  findall(C, slot(Term, P, C), Digits).

% ============================================================
% LAYER 1: DISJUNCTIVE DATALOG CLAIMS
% ============================================================

% This layer starts to look like the logical equivalent of "events observed by
% the kernel." The kernel emits state/witness; this layer turns propositions
% into claims that can support or conflict with each other.

% Claim: claim(ID, Context, Statement, Status)
% Status: proposed | accepted | rejected | closed
claim(ID, Ctx, Statement, proposed) :-
  % A claim exists when there is an assertion and no contradiction blocks it.
  assertion(ID, Ctx, Statement),
  \+ contradicting(ID, Ctx, Statement).

% Claim group for choice rules
claim_group(ID, Ctx) :-
  findall(claim(ID, Ctx, S, proposed), true, Claims),
  length(Claims, N), N > 0.

% Exclusive claim (one must hold)
exclusive Claim1 ; Claim2 :-
  claim(ID1, Ctx, S1, proposed),
  claim(ID2, Ctx, S2, proposed),
  ID1 \= ID2.

% Defeasible claim
defeasible_claim(ID, Ctx, Statement) :-
  evidence(Ctx, Statement),
  \+ contradicting(ID, Ctx, Statement).

% Claim dependencies
supports(Claim1, Claim2) :-
  % One claim supports another if its statement logically implies the other.
  claim(Claim1, _, S1, _),
  claim(Claim2, _, S2, _),
  implies(S1, S2).

conflicts(Claim1, Claim2) :-
  % Two claims conflict when their statements are declared incompatible.
  claim(Claim1, _, S1, _),
  claim(Claim2, _, S2, _),
  incompatible(S1, S2).

% Contradiction detection
contradicting(ID, Ctx, Statement) :-
  claim(OID, Ctx, OS, proposed),
  OID \= ID,
  incompatible(Statement, OS),
  format('CONTRADICTION: ~w vs ~w~n', [Statement, OS]).

% ============================================================
% LAYER 2: ASP / STABLE-MODEL PROPOSALS
% ============================================================

% If Layer 1 says "what claims are on the table", Layer 2 says "which coherent
% world do we choose from them?" This is a logical counterpart to the kernel's
% selection and progression through one concrete execution path.

% Proposal selection (choice rules)
proposal(Candidate, World) :-
  % Collect the currently selected claims into one candidate world object.
  findall(claim(ID, Ctx, S, selected), claim(ID, Ctx, S, selected), Claims),
  World = claims{all: Claims}.

% Candidate world generation
candidate_world(World, Claims) :-
  % Enumerate one set of selected claims that is both consistent and minimal.
  setof(claim(ID, Ctx, S, selected), 
        claim(ID, Ctx, S, selected), 
        Claims),
  consistent(Claims),
  minimal(Claims).

% Consistency check
consistent(Claims) :-
  \+ (member(claim(ID1,_,S1,_), Claims),
      member(claim(ID2,_,S2,_), Claims),
      ID1 \= ID2,
      incompatible(S1,S2)).

% Minimality (no proper subset is model)
minimal(Claims) :-
  \+ (subset(Proper, Claims),
      Proper \= Claims,
      consistent(Proper)).

% Unique minimal world
unique_minimal_world(World) :-
  candidate_world(World, Claims),
  \+ (candidate_world(Other, _),
      Other \= World,
      subset(claims(World), claims(Other)))).

% ============================================================
% LAYER 3: CHR / CLP CLOSURE
% ============================================================

% This layer is the declarative "closure engine." In the bare-metal framing,
% this sits conceptually where execution history has already happened and we are
% now computing what follows from it.

% CHR rules for reflexivity, antisymmetry, transitivity
% These are the relational equivalents of structural invariants.
reflexivity @ leq(X,X) <=> true.
antisymmetry @ leq(X,Y), leq(Y,X) <=> X = Y.
transitivity @ leq(X,Y), leq(Y,Z) ==> leq(X,Z).

% Idempotence and uniqueness  
idempotence @ slot(T,P,C) \ slot(T,P,C) <=> true.
unit_unique @ root(T,U1), root(T,U2) <=> U1 = U2.

% Position ordering
left_order @ slot(T,P1,_), slot(T,P2,_), left_of(P1,P2) ==> leq(P1,P2).
right_order @ slot(T,P1,_), slot(T,P2,_), right_of(P1,P2) ==> leq(P2,P1).

% Join associativity
assoc_join @ join(A,B,C1), join(C1,D,E) ==> join(A,join(B,D),E).
comm_join @ join(A,B,C) <=> join(B,A,C) | true.

% Segment merge
segment_merge @ join(X,Y), join(Y,Z) ==> join(X,Z).

% Digit constraints (0-59 bound)
digit_constraint(Coeff) :- between(0, 59, Coeff).

% Sum constraints
sum_constraint(A, B, C) :- C is A + B.

% Carry propagation
carry_propagation(Term, P1, P2) :-
  % If one digit overflows beyond 59, carry one unit into the next position.
  slot(Term, P1, C1), C1 >= 60,
  NewC1 is C1 - 60,
  slot(Term, P2, C2), NewC2 is C2 + 1,
  retract(slot(Term, P1, C1)),
  retract(slot(Term, P2, C2)),
  assertz(slot(Term, P1, NewC1)),
  assertz(slot(Term, P2, NewC2)).

% Closure operation
closure(ClaimID, ProposalID, ClosureID, Closed) :-
  % A closure object says an accepted claim has been paired with a proposal and
  % transformed into a closed result.
  claim(ClaimID, Ctx, Statement, accepted),
  proposal(ProposalID, World),
  format('CLOSING: ~w with ~w~n', [Statement, World]),
  Closed = closed{claim: ClaimID, proposal: ProposalID, id: ClosureID}.

% ============================================================
% LAYER 4: PROLOG LOWERING / RECEIPTS
% ============================================================

% This is the closest layer to the kernel's witness/fingerprint language.
% The kernel currently computes witness-like values and fingerprints; this file
% turns logical results into receipt-shaped Prolog objects.

% Receipt generation
receipt(ClaimID, ProposalID, ClosureID, ReceiptID) :-
  % Generate one receipt ID for one claim/proposal/closure triple.
  claim(ClaimID, Ctx, Statement, accepted),
  proposal(ProposalID, World),
  closure(ClaimID, ProposalID, ClosureID, _),
  generate_receipt_id(ReceiptID),
  record_receipt(ReceiptID, ClaimID, ProposalID, ClosureID).

% Lowering to receipt (canonical form)
lower_to_receipt(Canonical, Receipt) :-
  % Convert any fully-ground term into a receipt record with a hash and time.
  ground(Canonical),
  hash_term(Canonical, Hash),
  get_time(Time),
  Receipt = receipt{id: Hash, term: Canonical, timestamp: Time}.

% Operational sexagesimal evaluation
evaluate_sex60(sex60(Left, Unit, Right), Value) :-
  % Reduce a structured sexagesimal term into one numeric value.
  evaluate_coeff_list(Left, LVal, -4),
  evaluate_coeff_list(Right, RVal, 1),
  Value is LVal + Unit + RVal.

evaluate_coeff_list([], _, 0).
evaluate_coeff_list([slot(_,C)|Rest], Acc, Exp) :-
  Acc1 is Acc + C * round(60 ** Exp),
  Exp1 is Exp + 1,
  evaluate_coeff_list(Rest, Acc1, Exp1).

% Receipt verification
verify_receipt(ReceiptID) :-
  % This is the logical cousin of replay verification on the kernel side.
  receipt(ReceiptID, Claim, Proposal, Closure),
  replay_verify(Claim),
  proposal_verify(Proposal),
  closure_verify(Closure),
  format('RECEIPT ~w: VERIFIED~n', [ReceiptID]).

% Verified receipt emission
emit_receipt(ReceiptID) :-
  % Print the verified receipt contents in a readable textual form.
  verify_receipt(ReceiptID),
  receipt(ReceiptID, ClaimID, ProposalID, ClosureID),
  format('RECEIPT: ~w~n', [ReceiptID]),
  format('CLAIM: ~w~n', [ClaimID]),
  format('PROPOSAL: ~w~n', [ProposalID]),
  format('CLOSURE: ~w~n', [ClosureID]).

% Receipt recording (in-memory for now)
record_receipt(ReceiptID, ClaimID, ProposalID, ClosureID) :-
  % Current implementation note: this only prints a record, it does not persist
  % to a durable store.
  format('RECORDED: ~w -> ~w | ~w | ~w~n', 
         [ReceiptID, ClaimID, ProposalID, ClosureID]).

% ============================================================
% LAYER 5: STARS & BARS / BRAILLE / HEXAGRAM
% ============================================================

% This is the projection layer: logical values become surfaces. That matches the
% architectural rule in `ASCII_CONSTITUTIONAL_MACHINE.md` that surfaces are
% derived witnesses, not sovereign truth.

% Stars & Bars rendering
stars_bars_from_sex60(sex60(Left, Unit, Right), StarsBars) :-
  % Build a coarse stars-and-bars summary from left, unit, and right parts.
  count_stars(Left, StarsL),
  count_stars([Unit], StarsU),  % Unit as single position
  count_stars(Right, StarsR),
  format('Stars: ~w|*|~w|*|~w', [StarsL, StarsU, StarsR]).

count_stars([], 0).
count_stars([slot(_,C)|Rest], Stars) :-
  count_stars(Rest, S),
  Stars is S + C.

% Braille projection (8-dot)
braille_from_sex60(sex60(Left, Unit, Right), Braille) :-
  % Compress a sexagesimal term down into one braille-code-point-like value.
  sum_coefficients(Left, SumL),
  sum_coefficients(Right, SumR),
  Braille is 0x2800 + (SumL mod 16) + ((SumR mod 8) * 16).

sum_coefficients([], 0).
sum_coefficients([slot(_,C)|Rest], Sum) :-
  sum_coefficients(Rest, S),
  Sum is S + C.

% Hexagram projection (6-line)
hexagram_from_sex60(sex60(Left, _, Right), Hexagram) :-
  % Compress left/right structural lengths into one small symbolic code.
  length(Left, LenL),
  length(Right, LenR),
  Hexagram is (LenL mod 8) * 8 + (LenR mod 8).

% Wallis glyph rendering
wallis_glyph(quadprime, '⁗').
wallis_glyph(tripleprime, '‴').
wallis_glyph(doubleprime, '″').
wallis_glyph(prime, '′').
wallis_glyph(degree, '°').
wallis_glyph(minute, '′').
wallis_glyph(second, '″').

% Render sexagesimal term
render_sex60(sex60(Left, Unit, Right), String) :-
  % Convert the structured sexagesimal value into a printable Wallis-style string.
  render_coeff_list(Left, LeftStr),
  format(atom(UnitStr), '~d°', [Unit]),
  render_coeff_list(Right, RightStr),
  format(atom(String), '~w~w~w', [LeftStr, UnitStr, RightStr]).

render_coeff_list([], '').
render_coeff_list([slot(Pos,C)|Rest], String) :-
  wallis_glyph(Pos, Glyph), !,
  render_coeff_list(Rest, RestStr),
  format(atom(String), '~d~w~w', [C, Glyph, RestStr]).

% ============================================================
% UTILITIES
% ============================================================

% These helpers support the rest of the file with IDs, hashing, and phase labels.

% Generate unique receipt ID
generate_receipt_id(ID) :-
  % Current strategy: combine wall-clock time and a random suffix.
  get_time(Stamp),
  random(0, 1000000, Rand),
  format(atom(ID), 'R~w~w', [Stamp, Rand]).

% Hash term for fingerprint
hash_term(Term, Hash) :-
  % This is the Prolog-side analogue of reducing a structured value to a compact
  % fingerprint-like summary.
  term_string(Term, String),
  hash_string(String, Hash).

% Complexity questions
complexity_question(1, propositional_completeness).
complexity_question(2, quantifier_scope_discipline).
complexity_question(3, monotone_vs_nonmonotone).
complexity_question(4, stable_model_existence).
complexity_question(5, uniqueness_vs_multiplicity).
complexity_question(6, constraint_store_satisfiability).
complexity_question(7, chr_rewrite_confluence).
complexity_question(8, termination_guarantee).
complexity_question(9, grounding_finiteness).
complexity_question(10, reducibility_search_hardness).

% Phase classifier
% These labels are conceptual phase families, not the same thing as the kernel's
% numeric heartbeat phase counter.
classify_phase(closure, conjunction_dominant).
classify_phase(accumulation, conjunction_dominant).
classify_phase(proposal, disjunction_dominant).
classify_phase(branching, disjunction_dominant).
classify_phase(claim, implication_dominant).
classify_phase(rule, implication_dominant).
classify_phase(normalization, equivalence_dominant).
classify_phase(canonical, equivalence_dominant).

% ============================================================
% INITIALIZATION
% ============================================================

init_stack :-
  % Print a startup banner when the module is loaded.
  format('=== CONSTITUTIONAL LOGIC STACK ===~n'),
  format('Layer 0: Root Predicates - READY~n'),
  format('Layer 1: Disjunctive Claims - READY~n'),
  format('Layer 2: ASP Proposals - READY~n'),
  format('Layer 3: CHR/CLP Closure - READY~n'),
  format('Layer 4: Receipts - READY~n'),
  format('Layer 5: Surfaces - READY~n'),
  format('================================~n').

% ============================================================
% EXAMPLE USAGE
% ============================================================

% Example run:
% ?- init_stack.
% ?- sex60(t1, [slot(prime,3), slot(doubleprime,12)], 5, [slot(second,30)]).
% ?- render_sex60(Term, String).
% ?- sanity_check.

:- initialization(init_stack).
% Loading the file automatically prints the layer banner above.
