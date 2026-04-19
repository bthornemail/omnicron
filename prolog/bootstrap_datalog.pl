% ============================================================
% OMNITRON BOOTSTRAP DATALOG
% ============================================================
%
% SOURCE-OF-TRUTH NOTE
%
% STATUS: PROTOTYPE BOOTSTRAP FACT BASE
%
% This file is a bootstrap knowledge base for the Prolog section.
% It captures stable facts and lightweight rules that describe:
% - control grammar
% - geometry and cycle relations
% - encoding families
% - pipeline stages and invariants
%
% Scope and limits:
% - this file is descriptive and relational
% - it does not execute the bare-metal kernel
% - it is intended to be consumed by higher-level logic tooling
%
% ASCII policy:
% - atoms are ASCII-safe names for portability
% - symbolic glyph references are normalized as names

:- module(bootstrap_datalog, [
  ascii_control/4,
  fano_line/2,
  fano_incidence/2,
  position_class/3,
  slot_range/1,
  wallis_left/3,
  wallis_right/3,
  omicron_pivot/2,
  omicron_role/2,
  rotation_matrix/4,
  target_center/1,
  combinatorial_limit/1,
  encapsulation_space/3,
  geometric_layer/3,
  grand_cycle/2,
  cycle_component/4,
  cycle_divides/3,
  harmonic_ratio/3,
  aegean_numeral/3,
  aegean_triple/4,
  aegean_2of5/3,
  braille_6dot/7,
  braille_8dot/9,
  braille_pairwise/3,
  polyform_type/3,
  color_channel/3,
  beecode_capacity/1,
  beecode_ratio/2,
  shared_center_capacity/1,
  shared_center_ratio/2,
  code16k_capacity/1,
  code16k_role/2,
  smith_role/2,
  smith_function/2,
  smith_region/3,
  cube_circles/1,
  cube_contains/3,
  cube_energy/3,
  merkaba_component/3,
  merkaba_rotation/2,
  fano_projective/2,
  bit/1,
  bit_not/2,
  bit_and/3,
  bit_or/3,
  bit_xor/3,
  b8_rotate_left/2,
  b8_rotate_right/2,
  b8_not/2,
  b8_and/3,
  b8_or/3,
  b8_xor/3,
  tile16_value/2,
  mode4_value/2,
  mode4_meaning/2,
  orientation/3,
  opcode/3,
  event/2,
  wlog_component/2,
  header_component/2,
  config_seed_component/2,
  log_step/2,
  program/1,
  config_field/2,
  runtime_state/3,
  invariant/2,
  pipeline_stage/3,
  ambiguity_removed/2,
  central_inversion/2,
  balanced_rotate/2
]).

:- use_module(library(lists)).

% ============================================================
% ASCII CONTROL CODES
% ============================================================

ascii_control(0x00, nul, frame_boundary, null).
ascii_control(0x01, soh, header_start, start).
ascii_control(0x02, stx, text_start, begin).
ascii_control(0x03, etx, text_end, end).
ascii_control(0x04, eot, transmission_end, terminate).
ascii_control(0x05, enq, query_marker, ask).
ascii_control(0x06, ack, acknowledge, success).
ascii_control(0x07, bel, attention, alert).
ascii_control(0x08, bs, backspace, undo).
ascii_control(0x09, ht, tab_horizontal, indent).
ascii_control(0x0A, lf, line_feed, newline).
ascii_control(0x0B, vt, tab_vertical, vtab).
ascii_control(0x0C, ff, form_feed, page).
ascii_control(0x0D, cr, carriage_return, return).
ascii_control(0x0E, so, shift_out, mode_change).
ascii_control(0x0F, si, shift_in, mode_return).
ascii_control(0x10, dle, data_link_escape, escape).
ascii_control(0x11, dc1, device_control_1, xon).
ascii_control(0x12, dc2, device_control_2, select).
ascii_control(0x13, dc3, device_control_3, xoff).
ascii_control(0x14, dc4, device_control_4, deselect).
ascii_control(0x15, nak, negative_ack, failure).
ascii_control(0x16, syn, sync_idle, sync).
ascii_control(0x17, etb, end_block, block_end).
ascii_control(0x18, can, cancel, abort).
ascii_control(0x19, em, end_medium, media_end).
ascii_control(0x1A, sub, substitute, replace).
ascii_control(0x1B, esc, escape_meta, meta).
ascii_control(0x1C, fs, file_separator, chunk).
ascii_control(0x1D, gs, group_separator, record).
ascii_control(0x1E, rs, record_separator, unit).
ascii_control(0x1F, us, unit_separator, field).
ascii_control(0x7F, del, delete, remove).

% ============================================================
% FANO PLANE
% ============================================================

fano_line(l0, [p0, p1, p2]).
fano_line(l1, [p0, p3, p4]).
fano_line(l2, [p0, p5, p6]).
fano_line(l3, [p1, p3, p5]).
fano_line(l4, [p1, p4, p6]).
fano_line(l5, [p2, p3, p6]).
fano_line(l6, [p2, p4, p5]).

fano_incidence(Line, Point) :- fano_line(Line, Points), member(Point, Points).

% ============================================================
% SEXAGESIMAL POSITIONS
% ============================================================

position_class(quadprime, -4, wallis_quadprime).
position_class(tripleprime, -3, wallis_tripleprime).
position_class(doubleprime, -2, wallis_doubleprime).
position_class(prime, -1, wallis_prime).
position_class(degree, 0, wallis_degree).
position_class(minute, 1, wallis_prime).
position_class(second, 2, wallis_doubleprime).
position_class(third, 3, wallis_tripleprime).
position_class(fourth, 4, wallis_quadprime).

slot_range(S) :- between(0, 59, S).

wallis_left(1, minute, 60).
wallis_left(2, second, 3600).
wallis_left(3, third, 216000).
wallis_left(4, fourth, 12960000).

wallis_right(-1, prime, 60).
wallis_right(-2, doubleprime, 3600).
wallis_right(-3, tripleprime, 216000).
wallis_right(-4, quadprime, 12960000).

omicron_pivot(degree, 70).
omicron_role(zero_substitute, balanced_rotation).

% ============================================================
% COMPOSITION / GEOMETRY / CYCLES
% ============================================================

rotation_matrix(3, 3, 3, 27).
target_center(333).
combinatorial_limit(666).
encapsulation_space(729, 666, 63).

geometric_layer(n_circle, 1, smith_boundary).
geometric_layer(n_sphere, 2, fano_projective).
geometric_layer(n_ball, 3, omicron_density).

grand_cycle(total_closure, 5040).
cycle_component(world_state, 360, ratio(6,60), ratio(60,6)).
cycle_component(local_state, 240, ratio(15,16), ratio(16,15)).
cycle_component(shared_identity, 40, ratio(5,8), ratio(8,5)).

cycle_divides(5040, 360, 14).
cycle_divides(5040, 240, 21).
harmonic_ratio(14, 21, ratio(2,3)).

% ============================================================
% AEGEAN / BRAILLE / POLYFORM
% ============================================================

aegean_numeral(0, aegean_0, none).
aegean_numeral(1, aegean_1, vertical).
aegean_numeral(2, aegean_2, horizontal).
aegean_numeral(3, aegean_3, vertical).
aegean_numeral(4, aegean_4, horizontal).
aegean_numeral(5, aegean_5, vertical).
aegean_numeral(6, aegean_6, horizontal).
aegean_numeral(7, aegean_7, vertical).
aegean_numeral(8, aegean_8, horizontal).
aegean_numeral(9, aegean_9, vertical).

aegean_triple(First, Second, Third, Value) :-
  between(0, 9, First),
  between(0, 9, Second),
  between(0, 9, Third),
  Value is First * 100 + Second * 10 + Third.

aegean_2of5(A, B, Value) :-
  aegean_numeral(A, _, _),
  aegean_numeral(B, _, _),
  Value is A * 10 + B.

braille_6dot(D1, D2, D3, D4, D5, D6, Code) :-
  Code is D1*1 + D2*2 + D3*4 + D4*8 + D5*16 + D6*32.

braille_8dot(D1, D2, D3, D4, D5, D6, D7, D8, Code) :-
  Code is D1*1 + D2*2 + D3*4 + D4*8 + D5*16 + D6*32 + D7*64 + D8*128.

braille_pairwise(First, Second, PairCode) :-
  PairCode is First * 256 + Second.

polyform_type(monomino, 1, [single]).
polyform_type(domino, 2, [pair]).
polyform_type(tromino, 3, [line, angle]).
polyform_type(tetromino, 4, [line, square, t_shape, l_shape, z_shape]).
polyform_type(pentomino, 5, [twelve_shapes]).

color_channel(hue, type_class, range(0,360)).
color_channel(saturation, priority, range(0,255)).
color_channel(value, omicron_speed, range(0,255)).

% ============================================================
% MESSAGING / GEOMETRY
% ============================================================

beecode_capacity(15).
beecode_ratio(ratio(3,5), ratio(5,3)).
shared_center_capacity(40).
shared_center_ratio(ratio(5,8), ratio(8,5)).
code16k_capacity(16000).
code16k_role(error_correction, reconciliation).

smith_role(coordinate_plane, complex_terrain).
smith_function(impedance_calculation, link_cost).
smith_region(center, 0.0, matched).
smith_region(near_center, 0.3, low_mismatch).
smith_region(mid_circle, 0.6, moderate_mismatch).
smith_region(outer_edge, 1.0, high_mismatch).
smith_region(beyond, gt_1_0, reactive).

cube_circles(13).
cube_contains(tetrahedron, 4, fire).
cube_contains(hexahedron, 6, earth).
cube_contains(octahedron, 8, air).
cube_contains(dodecahedron, 12, ether).
cube_contains(icosahedron, 20, water).
cube_energy(masculine, lines, active).
cube_energy(feminine, circles, receptive).

merkaba_component(tetrahedron_up, projective, male).
merkaba_component(tetrahedron_down, receptive, female).
merkaba_rotation(counter_rotating, balance).

fano_projective(order, 2).
fano_projective(points, 7).
fano_projective(lines, 7).
fano_projective(incidence, 3).

% ============================================================
% BIT / B8 / TILE16 / MODE4
% ============================================================

bit(o).
bit(i).

bit_not(o, i).
bit_not(i, o).

bit_and(o, o, o).
bit_and(o, i, o).
bit_and(i, o, o).
bit_and(i, i, i).

bit_or(o, o, o).
bit_or(o, i, i).
bit_or(i, o, i).
bit_or(i, i, i).

bit_xor(o, o, o).
bit_xor(o, i, i).
bit_xor(i, o, i).
bit_xor(i, i, o).

b8_rotate_left([A,B,C,D,E,F,G,H], [B,C,D,E,F,G,H,A]).
b8_rotate_right([A,B,C,D,E,F,G,H], [H,A,B,C,D,E,F,G]).

b8_not(Bits, NotBits) :- maplist(bit_not, Bits, NotBits).
b8_and(A, B, C) :- maplist(bit_and, A, B, C).
b8_or(A, B, C) :- maplist(bit_or, A, B, C).
b8_xor(A, B, C) :- maplist(bit_xor, A, B, C).

tile16_value(t0, 0x0). tile16_value(t8, 0x8).
tile16_value(t1, 0x1). tile16_value(t9, 0x9).
tile16_value(t2, 0x2). tile16_value(ta, 0xA).
tile16_value(t3, 0x3). tile16_value(tb, 0xB).
tile16_value(t4, 0x4). tile16_value(tc, 0xC).
tile16_value(t5, 0x5). tile16_value(td, 0xD).
tile16_value(t6, 0x6). tile16_value(te, 0xE).
tile16_value(t7, 0x7). tile16_value(tf, 0xF).

mode4_value(xx, 0x0).
mode4_value(x_upper, 0x1).
mode4_value(upper_x, 0x2).
mode4_value(upper_upper, 0x3).

mode4_meaning(xx, quiescent).
mode4_meaning(x_upper, receptive).
mode4_meaning(upper_x, projective).
mode4_meaning(upper_upper, active).

orientation(identity, 0, no_transform).
orientation(reverse, 180, half_turn).
orientation(swap, 90, quarter_turn_right).
orientation(rotate_180, 180, half_turn_alt).
orientation(peer, 270, quarter_turn_left).

% ============================================================
% OPCODES / EVENTS / WLOG
% ============================================================

opcode(sync, synchronization, sync_point).
opcode(wait, timing, pause).
opcode(rotate_l, transform, counter_clockwise).
opcode(rotate_r, transform, clockwise).
opcode(join, composition, merge).
opcode(split, decomposition, divide).
opcode(emit, output, produce).
opcode(hash, fingerprint, identity).
opcode(map, transform, apply).
opcode(load, state, set_tile).
opcode(set_mode, config, set_mode4).
opcode(set_line, config, set_fano_line).
opcode(set_point, config, set_projective_point).

event(sync, slot_boundary).
event(wait, slot_pause).
event(emit, value_output).
event(hash, fingerprint_computed).
event(map, state_transformed).
event(rotate_l, bits_rotated_left).
event(rotate_r, bits_rotated_right).
event(join, states_merged).
event(split, states_divided).
event(load, tile_loaded).
event(set_mode, mode_changed).
event(set_line, line_selected).
event(set_point, point_selected).

wlog_component(orientation, chiral_flow).
wlog_component(base, sexagesimal_foundation).
wlog_component(header, marker_clock_seed).
wlog_component(program, log_steps).

header_component(marker, orientation_mark).
header_component(clock, base_timing).
header_component(seed, initial_config).

config_seed_component(slot, position).
config_seed_component(mode, execution_mode).
config_seed_component(line, fano_line).
config_seed_component(point, projective_point).
config_seed_component(tile, initial_tile).

log_step(Slot, Opcode) :- slot_range(Slot), opcode(Opcode, _, _).

program(done).
program(step(Log, Rest)) :- nonvar(Log), program(Rest).

config_field(slot, current_position).
config_field(mode, current_mode).
config_field(line, current_line).
config_field(point, current_point).
config_field(tile, current_tile).
config_field(bits, current_octet).

runtime_state(header, program, config).

% ============================================================
% INVARIANTS / PIPELINE
% ============================================================

invariant(predicate_identity, operator_name_preserved).
invariant(argument_order, args_sequence_preserved).
invariant(stage_meaning, phase_semantics_preserved).
invariant(receipt_meaning, closure_semantics_preserved).
invariant(canonical_address, slot_meaning_preserved).
invariant(grammar_boundaries, control_structure_preserved).

pipeline_stage(1, plain_text, ascii_source).
pipeline_stage(2, prolog_datalog, truth_relation).
pipeline_stage(3, s_expression, exact_structure).
pipeline_stage(4, m_expression, concise_human).
pipeline_stage(5, f_expression, flow_execution).
pipeline_stage(6, ast, invariant_core).
pipeline_stage(7, kernel_events, runtime_form).
pipeline_stage(8, ascii_stream, transport_form).

ambiguity_removed(prolog_datalog, variable_binding).
ambiguity_removed(s_expression, operator_precedence).
ambiguity_removed(m_expression, bracket_overhead).
ambiguity_removed(f_expression, evaluation_order).
ambiguity_removed(ast, surface_syntax).
ambiguity_removed(kernel_events, control_flow).
ambiguity_removed(ascii_stream, character_encoding).

% ============================================================
% CENTRAL INVERSION / BALANCED ROTATION
% ============================================================

central_inversion(X, Y) :-
  combinatorial_limit(666),
  Y is 666 - X.

balanced_rotate(X, Y) :-
  X < 333,
  Y is X + 333.
balanced_rotate(X, Y) :-
  X >= 333,
  Y is X - 333.
