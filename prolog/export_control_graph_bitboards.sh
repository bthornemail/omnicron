#!/usr/bin/env bash
set -euo pipefail

# SOURCE-OF-TRUTH NOTE
#
# STATUS: DETERMINISTIC CONTROL GRAPH PROJECTION
#
# Purpose:
# - Build control-plane hierarchy graph from parser-safe extracted logic
# - Build Aegean overlay graph from ASCII alias facts
# - Emit bitboard-only artifacts for deterministic replay checking

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT_FILE="${1:-$ROOT_DIR/prolog/omnicron-rule-source.extracted.logic}"
OUT_DIR="${2:-$ROOT_DIR/polyform/bitboards}"
WIDTH_BITS=256
WORDS=8 # 8 * 32-bit words

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "ERROR: input file not found: $INPUT_FILE" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

CORE_FILE="/tmp/control_graph_core.$$"
OVERLAY_FILE="/tmp/control_graph_overlay.$$"

cleanup() {
  rm -f "$CORE_FILE" "$OVERLAY_FILE"
}
trap cleanup EXIT

# Control-plane graph edges.
awk '
  /^canonical_ascii_order\(/ {
    s = $0; sub(/^canonical_ascii_order\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("ascii_pos:%s->ctrl:%s\n", a[1], a[2]);
  }
  /^control_hierarchy\(/ {
    s = $0; sub(/^control_hierarchy\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("ctrl:%s->role:%s\n", a[2], a[3]);
  }
  /^substrate_stage_order\(/ {
    s = $0; sub(/^substrate_stage_order\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("stage:%s->stage:%s\n", a[1], a[2]);
  }
  /^control_axis_anchor\(/ {
    s = $0; sub(/^control_axis_anchor\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("axis:%s->anchor:%s\n", a[1], a[2]);
  }
  /^dpd_bucket\(/ {
    s = $0; sub(/^dpd_bucket\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 4) {
      printf("dpd_bucket:%s->class:%s\n", a[1], a[2]);
      printf("dpd_bucket:%s->states:%s\n", a[1], a[3]);
      printf("dpd_bucket:%s->range:%s\n", a[1], a[4]);
    }
  }
  /^dpd_link\(/ {
    s = $0; sub(/^dpd_link\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("dpd_link:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^dpd_row\(/ {
    s = $0; sub(/^dpd_row\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("dpd_row:%s->id:%s\n", a[1], a[2]);
  }
  /^dpd_template\(/ {
    s = $0; sub(/^dpd_template\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("dpd_template:%s->bits:%s\n", a[1], a[2]);
  }
  /^dpd_decode\(/ {
    s = $0; sub(/^dpd_decode\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 4) {
      printf("dpd_decode:%s->d2:%s\n", a[1], a[2]);
      printf("dpd_decode:%s->d1:%s\n", a[1], a[3]);
      printf("dpd_decode:%s->d0:%s\n", a[1], a[4]);
    }
  }
  /^dpd_values\(/ {
    s = $0; sub(/^dpd_values\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("dpd_values:%s->range:%s\n", a[1], a[2]);
  }
  /^dpd_description\(/ {
    s = $0; sub(/^dpd_description\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("dpd_description:%s->desc:%s\n", a[1], a[2]);
  }
  /^dpd_occurrence\(/ {
    s = $0; sub(/^dpd_occurrence\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("dpd_occurrence:%s->states:%s\n", a[1], a[2]);
      printf("dpd_occurrence:%s->pct:%s\n", a[1], a[3]);
    }
  }
  /^dpd_dont_care\(/ {
    s = $0; sub(/^dpd_dont_care\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("dpd_dont_care:%s->bit:%s\n", a[1], a[2]);
  }
  /^dpd_row_next\(/ {
    s = $0; sub(/^dpd_row_next\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("dpd_row_next:%s->%s\n", a[1], a[2]);
  }
  /^storage_efficiency\(/ {
    s = $0; sub(/^storage_efficiency\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 6) {
      printf("storage_digits:%s->states:%s\n", a[1], a[2]);
      printf("storage_digits:%s->bcd:%s\n", a[1], a[3]);
      printf("storage_digits:%s->binary:%s\n", a[1], a[4]);
      printf("storage_digits:%s->mixed:%s\n", a[1], a[5]);
      printf("storage_digits:%s->delta:%s\n", a[1], a[6]);
    }
  }
  /^encoding_mix_pattern\(/ {
    s = $0; sub(/^encoding_mix_pattern\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("mix_pattern:%s->pattern:%s\n", a[1], a[2]);
  }
  /^offset_binary_word_size\(/ {
    s = $0; sub(/^offset_binary_word_size\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("offset_word:%s->bias:%s\n", a[1], a[2]);
  }
  /^offset_binary_conversion\(/ {
    s = $0; sub(/^offset_binary_conversion\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("offset_conv:%s->method:%s\n", a[1], a[2]);
  }
  /^offset_binary_xor_constant\(/ {
    s = $0; sub(/^offset_binary_xor_constant\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("offset_xor:%s->const:%s\n", a[1], a[2]);
  }
  /^offset_binary_map\(/ {
    s = $0; sub(/^offset_binary_map\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("offset_map:%s->offset:%s->twos:%s\n", a[1], a[2], a[3]);
  }
  /^riscv_fp_extension\(/ {
    s = $0; sub(/^riscv_fp_extension\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("riscv_fp:%s->format:%s\n", a[1], a[2]);
      printf("riscv_fp:%s->status:%s\n", a[1], a[3]);
    }
  }
  /^ieee754_encoding_mode\(/ {
    s = $0; sub(/^ieee754_encoding_mode\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("ieee_mode:%s->encoding:%s\n", a[1], a[2]);
  }
  /^decimal_format_profile\(/ {
    s = $0; sub(/^decimal_format_profile\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 9) {
      printf("decimal_profile:%s->storage:%s\n", a[1], a[2]);
      printf("decimal_profile:%s->digits:%s\n", a[1], a[3]);
      printf("decimal_profile:%s->comb:%s\n", a[1], a[4]);
      printf("decimal_profile:%s->exp:%s\n", a[1], a[5]);
      printf("decimal_profile:%s->bias:%s\n", a[1], a[6]);
      printf("decimal_profile:%s->emax:%s\n", a[1], a[7]);
      printf("decimal_profile:%s->emin:%s\n", a[1], a[8]);
    }
  }
  /^binary256_profile\(/ {
    s = $0; sub(/^binary256_profile\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 6) {
      printf("binary256:storage_bytes:%s\n", a[1]);
      printf("binary256:storage_bits:%s\n", a[2]);
      printf("binary256:sign:%s\n", a[3]);
      printf("binary256:exp:%s\n", a[4]);
      printf("binary256:sig_precision:%s\n", a[5]);
      printf("binary256:sig_stored:%s\n", a[6]);
    }
  }
  /^binary256_exponent_profile\(/ {
    s = $0; sub(/^binary256_exponent_profile\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("binary256_exp:bias:%s\n", a[1]);
      printf("binary256_exp:emin:%s\n", a[2]);
      printf("binary256_exp:emax:%s\n", a[3]);
    }
  }
  /^binary256_special_exponent\(/ {
    s = $0; sub(/^binary256_special_exponent\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("binary256_special:%s->role:%s\n", a[1], a[2]);
  }
  /^cohort_selection_rule\(/ {
    s = $0; sub(/^cohort_selection_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("cohort_rule:%s->%s\n", a[1], a[2]);
  }
  /^cohort_equivalent_value\(/ {
    s = $0; sub(/^cohort_equivalent_value\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("cohort_value:%s->coeff:%s\n", a[1], a[2]);
      printf("cohort_value:%s->exp:%s\n", a[1], a[3]);
    }
  }
  /^aegean_overlay_mode\(/ {
    s = $0; sub(/^aegean_overlay_mode\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("aegean_overlay_mode:%s\n", a[1]);
  }
  /^aegean_overlay_contract\(/ {
    s = $0; sub(/^aegean_overlay_contract\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("aegean_overlay_contract:%s->%s\n", a[1], a[2]);
  }
  /^aegean_precision_tile\(/ {
    s = $0; sub(/^aegean_precision_tile\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("aegean_precision:%s->alias:%s\n", a[1], a[2]);
      printf("aegean_precision:%s->tile:%s\n", a[1], a[3]);
    }
  }
  /^aegean_overlay_flow\(/ {
    s = $0; sub(/^aegean_overlay_flow\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("aegean_overlay_flow:%s->%s\n", a[1], a[2]);
  }
  /^omicron_threshold_rule\(/ {
    s = $0; sub(/^omicron_threshold_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("threshold:%s->value:%s\n", a[1], a[2]);
      printf("threshold:%s->role:%s\n", a[1], a[3]);
    }
  }
  /^omicron_threshold_transition\(/ {
    s = $0; sub(/^omicron_threshold_transition\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("threshold_transition:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^aegean_threshold_tile\(/ {
    s = $0; sub(/^aegean_threshold_tile\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("threshold_tile:%s->alias:%s\n", a[1], a[2]);
      printf("threshold_tile:%s->tile:%s\n", a[1], a[3]);
    }
  }
  /^aegean_precision_rule_set\(/ {
    s = $0; sub(/^aegean_precision_rule_set\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 4) {
      printf("precision_rule:%s->threshold:%s\n", a[1], a[2]);
      printf("precision_rule:%s->mode:%s\n", a[1], a[3]);
      printf("precision_rule:%s->ref:%s\n", a[1], a[4]);
    }
  }
  /^binary256_reference_field\(/ {
    s = $0; sub(/^binary256_reference_field\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("binary256_ref:%s->%s\n", a[1], a[2]);
  }
  /^binary256_threshold_binding\(/ {
    s = $0; sub(/^binary256_threshold_binding\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("binary256_threshold:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^bitop_labeling_convention\(/ {
    s = $0; sub(/^bitop_labeling_convention\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("bitop_labeling:%s->%s\n", a[1], a[2]);
  }
  /^bitop_word_identity\(/ {
    s = $0; sub(/^bitop_word_identity\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("bitop_identity:%s->%s\n", a[1], a[2]);
  }
  /^bitop_negation_duality\(/ {
    s = $0; sub(/^bitop_negation_duality\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("bitop_duality:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^ctz_formula\(/ {
    s = $0; sub(/^ctz_formula\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("ctz_formula:%s->%s\n", a[1], a[2]);
  }
  /^ffs_formula\(/ {
    s = $0; sub(/^ffs_formula\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("ffs_formula:%s->%s\n", a[1], a[2]);
  }
  /^bitop_zero_semantics\(/ {
    s = $0; sub(/^bitop_zero_semantics\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("bitop_zero:%s->%s\n", a[1], a[2]);
  }
  /^ctz_algorithm\(/ {
    s = $0; sub(/^ctz_algorithm\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("ctz_algo:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^clz_algorithm\(/ {
    s = $0; sub(/^clz_algorithm\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("clz_algo:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^ctz_debruijn_constant\(/ {
    s = $0; sub(/^ctz_debruijn_constant\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 4) printf("ctz_debruijn:%s->%s:%s:%s\n", a[1], a[2], a[3], a[4]);
  }
  /^clz_debruijn_constant\(/ {
    s = $0; sub(/^clz_debruijn_constant\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 4) printf("clz_debruijn:%s->%s:%s:%s\n", a[1], a[2], a[3], a[4]);
  }
  /^bitop_application\(/ {
    s = $0; sub(/^bitop_application\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("bitop_use:%s\n", a[1]);
  }
  /^bitmask_operation\(/ {
    s = $0; sub(/^bitmask_operation\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("bitmask_op:%s->%s\n", a[1], a[2]);
  }
  /^bitmask_identity\(/ {
    s = $0; sub(/^bitmask_identity\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("bitmask_id:%s\n", a[1]);
  }
  /^bitmask_equation\(/ {
    s = $0; sub(/^bitmask_equation\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("bitmask_eq:%s->%s\n", a[1], a[2]);
  }
  /^bitmask_query_rule\(/ {
    s = $0; sub(/^bitmask_query_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("bitmask_query:%s\n", a[1]);
  }
  /^bitmask_use_case\(/ {
    s = $0; sub(/^bitmask_use_case\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("bitmask_use:%s\n", a[1]);
  }
  /^mask_table_header_mode\(/ {
    s = $0; sub(/^mask_table_header_mode\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("mask_header_mode:%s\n", a[1]);
  }
  /^mask_table_axis\(/ {
    s = $0; sub(/^mask_table_axis\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("mask_header_axis:%s->%s\n", a[1], a[2]);
  }
  /^mask_table_gate_rule\(/ {
    s = $0; sub(/^mask_table_gate_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("mask_header_gate:%s\n", a[1]);
  }
  /^blit_mask_pipeline\(/ {
    s = $0; sub(/^blit_mask_pipeline\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("blit_stage:%s->%s\n", a[1], a[2]);
  }
  /^hash_mask_rule\(/ {
    s = $0; sub(/^hash_mask_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("hash_mask:%s\n", a[1]);
  }
  /^tagged_pointer_mode\(/ {
    s = $0; sub(/^tagged_pointer_mode\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_ptr_mode:%s\n", a[1]);
  }
  /^tagged_pointer_tag_semantics\(/ {
    s = $0; sub(/^tagged_pointer_tag_semantics\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("tagged_ptr_tag:%s->%s\n", a[1], a[2]);
  }
  /^tagged_pointer_alignment_fact\(/ {
    s = $0; sub(/^tagged_pointer_alignment_fact\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("tagged_ptr_align:%s->%s\n", a[1], a[2]);
  }
  /^tagged_pointer_alignment_example\(/ {
    s = $0; sub(/^tagged_pointer_alignment_example\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) {
      printf("tagged_ptr_example:%s->base:%s\n", a[1], a[2]);
      printf("tagged_ptr_example:%s->flag:%s\n", a[1], a[3]);
    }
  }
  /^tagged_pointer_mask_rule\(/ {
    s = $0; sub(/^tagged_pointer_mask_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_ptr_mask:%s\n", a[1]);
  }
  /^tagged_pointer_vs_null_rule\(/ {
    s = $0; sub(/^tagged_pointer_vs_null_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_ptr_vs_null:%s\n", a[1]);
  }
  /^tagged_architecture_property\(/ {
    s = $0; sub(/^tagged_architecture_property\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_arch_property:%s\n", a[1]);
  }
  /^tagged_architecture_example\(/ {
    s = $0; sub(/^tagged_architecture_example\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_arch_example:%s\n", a[1]);
  }
  /^malloc_alignment_fact\(/ {
    s = $0; sub(/^malloc_alignment_fact\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("malloc_align:%s->%s\n", a[1], a[2]);
  }
  /^tagged_pointer_api_pattern\(/ {
    s = $0; sub(/^tagged_pointer_api_pattern\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_ptr_api:%s\n", a[1]);
  }
  /^tagged_pointer_advantage\(/ {
    s = $0; sub(/^tagged_pointer_advantage\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_ptr_adv:%s\n", a[1]);
  }
  /^tagged_pointer_disadvantage\(/ {
    s = $0; sub(/^tagged_pointer_disadvantage\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("tagged_ptr_disadv:%s\n", a[1]);
  }
  /^qemu_riscv_target\(/ {
    s = $0; sub(/^qemu_riscv_target\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("qemu_target:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^framebuffer_buffer_mapping\(/ {
    s = $0; sub(/^framebuffer_buffer_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("fb_buffer:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^bom_buffer_mapping\(/ {
    s = $0; sub(/^bom_buffer_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("bom_buffer:%s->%s\n", a[1], a[2]);
  }
  /^breathing_invariant_mapping\(/ {
    s = $0; sub(/^breathing_invariant_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("breathing:%s->%s\n", a[1], a[2]);
  }
  /^klein_surface_grid\(/ {
    s = $0; sub(/^klein_surface_grid\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("klein_grid:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^klein_surface_quorum\(/ {
    s = $0; sub(/^klein_surface_quorum\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("klein_quorum:%s\n", a[1]);
  }
  /^stencil_layout\(/ {
    s = $0; sub(/^stencil_layout\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("stencil_layout:%s:%s:%s\n", a[1], a[2], a[3]);
  }
  /^stencil_mask\(/ {
    s = $0; sub(/^stencil_mask\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("stencil_mask:%s->%s\n", a[1], a[2]);
  }
  /^depth_wallis_mapping\(/ {
    s = $0; sub(/^depth_wallis_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("depth_wallis:%s->%s\n", a[1], a[2]);
  }
  /^pixel_ownership_mapping\(/ {
    s = $0; sub(/^pixel_ownership_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("pixel_ownership:%s->%s\n", a[1], a[2]);
  }
  /^cohort_msaa_mapping\(/ {
    s = $0; sub(/^cohort_msaa_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("msaa:%s->%s\n", a[1], a[2]);
  }
  /^framebuffer_config_rule\(/ {
    s = $0; sub(/^framebuffer_config_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("fb_config:%s->%s\n", a[1], a[2]);
  }
  /^riscv_framebuffer_mapping\(/ {
    s = $0; sub(/^riscv_framebuffer_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("riscv_fb:%s->%s\n", a[1], a[2]);
  }
  /^bootstrap_mapping\(/ {
    s = $0; sub(/^bootstrap_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("bootstrap:%s->%s\n", a[1], a[2]);
  }
  /^shader_pass_mapping\(/ {
    s = $0; sub(/^shader_pass_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("shader_pass:%s->%s\n", a[1], a[2]);
  }
  /^runtime_cycle_rule\(/ {
    s = $0; sub(/^runtime_cycle_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("runtime_cycle:%s\n", a[1]);
  }
  /^polyform_basis_degree\(/ {
    s = $0; sub(/^polyform_basis_degree\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("polyform_degree:%s->%s\n", a[1], a[2]);
  }
  /^polyform_rank\(/ {
    s = $0; sub(/^polyform_rank\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("polyform_rank:%s\n", a[1]);
  }
  /^polyform_group\(/ {
    s = $0; sub(/^polyform_group\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("polyform_group:%s\n", a[1]);
  }
  /^polyform_family\(/ {
    s = $0; sub(/^polyform_family\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("polyform_family:%s->%s\n", a[1], a[2]);
  }
  /^polynomial_degree_class\(/ {
    s = $0; sub(/^polynomial_degree_class\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("poly_degree:%s->%s\n", a[1], a[2]);
  }
  /^polynomial_property\(/ {
    s = $0; sub(/^polynomial_property\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("poly_property:%s\n", a[1]);
  }
  /^polyform_polynomial_mapping\(/ {
    s = $0; sub(/^polyform_polynomial_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("poly_map:%s->%s\n", a[1], a[2]);
  }
  /^barcode_trinity_mapping\(/ {
    s = $0; sub(/^barcode_trinity_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("barcode_trinity:%s->%s\n", a[1], a[2]);
  }
  /^maxicode_texture_role\(/ {
    s = $0; sub(/^maxicode_texture_role\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("maxicode_texture_role:%s\n", a[1]);
  }
  /^maxicode_texture_theory\(/ {
    s = $0; sub(/^maxicode_texture_theory\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("maxicode_texture_theory:%s\n", a[1]);
  }
  /^maxicode_texture_feature\(/ {
    s = $0; sub(/^maxicode_texture_feature\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("maxicode_texture_feature:%s\n", a[1]);
  }
  /^texture_type_rule\(/ {
    s = $0; sub(/^texture_type_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("texture_type:%s->%s\n", a[1], a[2]);
  }
  /^texture_completeness_rule\(/ {
    s = $0; sub(/^texture_completeness_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("texture_complete:%s\n", a[1]);
  }
  /^aztec_vertex_role\(/ {
    s = $0; sub(/^aztec_vertex_role\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("aztec_vertex_role:%s\n", a[1]);
  }
  /^aztec_vertex_rule\(/ {
    s = $0; sub(/^aztec_vertex_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("aztec_vertex_rule:%s\n", a[1]);
  }
  /^beecode_query_role\(/ {
    s = $0; sub(/^beecode_query_role\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("beecode_query_role:%s\n", a[1]);
  }
  /^beecode_query_target\(/ {
    s = $0; sub(/^beecode_query_target\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("beecode_query_target:%s\n", a[1]);
  }
  /^beecode_query_scope_rule\(/ {
    s = $0; sub(/^beecode_query_scope_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("beecode_query_scope:%s\n", a[1]);
  }
  /^framebuffer_semantic\(/ {
    s = $0; sub(/^framebuffer_semantic\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("fbo_semantic:%s\n", a[1]);
  }
  /^framebuffer_binding_target\(/ {
    s = $0; sub(/^framebuffer_binding_target\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("fbo_bind:%s->%s\n", a[1], a[2]);
  }
  /^framebuffer_attachment_point\(/ {
    s = $0; sub(/^framebuffer_attachment_point\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("fbo_attach:%s->%s\n", a[1], a[2]);
  }
  /^framebuffer_layer_rule\(/ {
    s = $0; sub(/^framebuffer_layer_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("fbo_layer:%s\n", a[1]);
  }
  /^framebuffer_no_attachment_rule\(/ {
    s = $0; sub(/^framebuffer_no_attachment_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("fbo_no_attachment:%s\n", a[1]);
  }
  /^framebuffer_completeness_rule\(/ {
    s = $0; sub(/^framebuffer_completeness_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("fbo_complete:%s\n", a[1]);
  }
  /^framebuffer_feedback_rule\(/ {
    s = $0; sub(/^framebuffer_feedback_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("fbo_feedback:%s\n", a[1]);
  }
  /^two_of_five_framing_rule\(/ {
    s = $0; sub(/^two_of_five_framing_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("two_of_five_frame:%s\n", a[1]);
  }
  /^signed_representation_layer\(/ {
    s = $0; sub(/^signed_representation_layer\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("signed_layer:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^signed_representation_property\(/ {
    s = $0; sub(/^signed_representation_property\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("signed_prop:%s->%s\n", a[1], a[2]);
  }
  /^signed_representation_range\(/ {
    s = $0; sub(/^signed_representation_range\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("signed_range:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^signed_representation_operation\(/ {
    s = $0; sub(/^signed_representation_operation\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("signed_op:%s\n", a[1]);
  }
  /^signed_representation_conversion\(/ {
    s = $0; sub(/^signed_representation_conversion\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("signed_conv:%s->%s\n", a[1], a[2]);
  }
  /^signed_representation_hardware_fact\(/ {
    s = $0; sub(/^signed_representation_hardware_fact\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("signed_hw:%s\n", a[1]);
  }
  /^omicron_gnomon_signed_mapping\(/ {
    s = $0; sub(/^omicron_gnomon_signed_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("omicron_signed:%s->%s\n", a[1], a[2]);
  }
  /^lut_truth_table_rule\(/ {
    s = $0; sub(/^lut_truth_table_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("lut_rule:%s\n", a[1]);
  }
  /^binary_operator_code\(/ {
    s = $0; sub(/^binary_operator_code\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("op_code:%s->%s\n", a[1], a[2]);
  }
  /^operator_property\(/ {
    s = $0; sub(/^operator_property\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("op_prop:%s->%s\n", a[1], a[2]);
  }
  /^beecode_witness_mapping\(/ {
    s = $0; sub(/^beecode_witness_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("beecode_witness:%s->%s\n", a[1], a[2]);
  }
  /^dynamic_slide_rule_component\(/ {
    s = $0; sub(/^dynamic_slide_rule_component\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("slide_component:%s->%s\n", a[1], a[2]);
  }
  /^header_bitfield_layout\(/ {
    s = $0; sub(/^header_bitfield_layout\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("header_layout:%s:%s:%s\n", a[1], a[2], a[3]);
  }
  /^header_bitfield_mapping\(/ {
    s = $0; sub(/^header_bitfield_mapping\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("header_map:%s->%s\n", a[1], a[2]);
  }
  /^projection_compromise_rule\(/ {
    s = $0; sub(/^projection_compromise_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("projection_compromise:%s->%s\n", a[1], a[2]);
  }
  /^gl_atomic_counter_rule\(/ {
    s = $0; sub(/^gl_atomic_counter_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("gl_atomic:%s->%s\n", a[1], a[2]);
  }
  /^gl_debug_rule\(/ {
    s = $0; sub(/^gl_debug_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("gl_debug:%s->%s\n", a[1], a[2]);
  }
  /^uss16k_rule\(/ {
    s = $0; sub(/^uss16k_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("uss16k:%s->%s\n", a[1], a[2]);
  }
  /^code16k_constitutional_role\(/ {
    s = $0; sub(/^code16k_constitutional_role\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("code16k_role:%s->%s\n", a[1], a[2]);
  }
  /^code16k_zero_state\(/ {
    s = $0; sub(/^code16k_zero_state\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("code16k_zero:%s->%s\n", a[1], a[2]);
  }
  /^code16k_carrier_derivation\(/ {
    s = $0; sub(/^code16k_carrier_derivation\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("code16k_carrier:%s->%s\n", a[1], a[2]);
  }
  /^derive_carrier\(/ {
    s = $0; sub(/^derive_carrier\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("derive_carrier:%s->%s\n", a[1], a[2]);
  }
  /^webgl_buffer_binding_rule\(/ {
    s = $0; sub(/^webgl_buffer_binding_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("webgl_binding:%s\n", a[1]);
  }
  /^gl_zero_field_rule\(/ {
    s = $0; sub(/^gl_zero_field_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("gl_zero_field:%s\n", a[1]);
  }
  /^omicron_layer_split\(/ {
    s = $0; sub(/^omicron_layer_split\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("omicron_split:%s->%s\n", a[1], a[2]);
  }
  /^omicron_layer_split_binding\(/ {
    s = $0; sub(/^omicron_layer_split_binding\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("omicron_split_bind:%s->%s\n", a[1], a[2]);
  }
  /^code16k_controller_rule\(/ {
    s = $0; sub(/^code16k_controller_rule\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("code16k_kernel:%s->%s\n", a[1], a[2]);
  }
  /^constitutional_order_tier\(/ {
    s = $0; sub(/^constitutional_order_tier\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("foundation_tier:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^monoid_structure\(/ {
    s = $0; sub(/^monoid_structure\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("monoid_structure:%s->%s\n", a[1], a[2]);
  }
  /^monoid_identity_law\(/ {
    s = $0; sub(/^monoid_identity_law\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("monoid_identity:%s->%s\n", a[1], a[2]);
  }
  /^zeroary_logic_constant\(/ {
    s = $0; sub(/^zeroary_logic_constant\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("zeroary_constant:%s\n", a[1]);
  }
  /^foundation_transition\(/ {
    s = $0; sub(/^foundation_transition\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("foundation_transition:%s->%s:%s\n", a[1], a[2], a[3]);
  }
  /^zonoid_generation\(/ {
    s = $0; sub(/^zonoid_generation\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 3) printf("zonoid_generation:%s:%s:%s\n", a[1], a[2], a[3]);
  }
  /^foundation_example\(/ {
    s = $0; sub(/^foundation_example\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("foundation_example:%s->%s\n", a[1], a[2]);
  }
  /^zero_distinction\(/ {
    s = $0; sub(/^zero_distinction\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("zero_distinction:%s->%s\n", a[1], a[2]);
  }
  /^formal_foundation_statement\(/ {
    s = $0; sub(/^formal_foundation_statement\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 1) printf("foundation_statement:%s\n", a[1]);
  }
  /^artifact_contract_split\(/ {
    s = $0; sub(/^artifact_contract_split\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("artifact_split:%s->%s\n", a[1], a[2]);
  }
  /^artifact_contract_format\(/ {
    s = $0; sub(/^artifact_contract_format\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("artifact_format:%s->%s\n", a[1], a[2]);
  }
  /^artifact_contract_chain\(/ {
    s = $0; sub(/^artifact_contract_chain\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 5) printf("artifact_chain:%s->%s->%s->%s->%s\n", a[1], a[2], a[3], a[4], a[5]);
  }
  /^artifact_contract_property\(/ {
    s = $0; sub(/^artifact_contract_property\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("artifact_property:%s->%s\n", a[1], a[2]);
  }
' "$INPUT_FILE" | sort -u > "$CORE_FILE"

# Aegean overlay edges.
awk '
  /^aegean_alias\(/ {
    s = $0; sub(/^aegean_alias\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("aegean:%s->tile:%s\n", a[1], a[2]);
  }
  /^aegean_cardinality\(/ {
    s = $0; sub(/^aegean_cardinality\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("aegean:%s->card:%s\n", a[1], a[2]);
  }
  /^aegean_chirality\(/ {
    s = $0; sub(/^aegean_chirality\(/, "", s); sub(/\)\.$/, "", s);
    n = split(s, a, /,[[:space:]]*/);
    if (n >= 2) printf("aegean:%s->chirality:%s\n", a[1], a[2]);
  }
' "$INPUT_FILE" | sort -u > "$OVERLAY_FILE"

GOLDEN_FILE="$OUT_DIR/control_graph_golden.bitboard"
NEGATIVE_FILE="$OUT_DIR/control_graph_negative.bitboard"
OVERLAY_OUT_FILE="$OUT_DIR/control_graph_overlay_aegean.bitboard"

emit_board_from_edges() {
  local edge_file="$1"
  local out_file="$2"
  local board_label="$3"

  declare -a words
  for ((i=0; i<WORDS; i++)); do
    words[$i]=0
  done

  local edge_count=0
  while IFS= read -r edge; do
    [[ -z "$edge" ]] && continue
    idx="$(printf '%s' "$edge" | cksum | awk -v w="$WIDTH_BITS" '{print $1 % w}')"
    widx=$((idx / 32))
    bidx=$((idx % 32))
    words[$widx]=$(( words[$widx] | (1 << bidx) ))
    edge_count=$((edge_count + 1))
  done < "$edge_file"

  emit_grid_local() {
    local -n arr=$1
    for ((row=0; row<16; row++)); do
      line=""
      for ((col=0; col<16; col++)); do
        bit=$((row * 16 + col))
        w=$((bit / 32))
        b=$((bit % 32))
        if (( (arr[$w] >> b) & 1 )); then
          line+="#"
        else
          line+="."
        fi
      done
      printf '%s\n' "$line"
    done
  }

  {
    printf '# %s\n' "$board_label"
    printf '# Generated from: %s\n' "$INPUT_FILE"
    printf '# Edge count: %d\n' "$edge_count"
    printf '# Width bits: %d\n' "$WIDTH_BITS"
    for ((i=0; i<WORDS; i++)); do
      printf 'WORD_%d=0x%08X\n' "$i" "${words[$i]}"
    done
    printf 'GRID_16x16:\n'
    emit_grid_local words
  } > "$out_file"
}

emit_board_from_edges "$CORE_FILE" "$GOLDEN_FILE" "CONTROL GRAPH GOLDEN BITBOARD"

declare -a neg
for ((i=0; i<WORDS; i++)); do
  word="$(awk -F= -v idx="$i" '$1 == ("WORD_" idx) {print $2}' "$GOLDEN_FILE")"
  word_dec=$((word))
  neg[$i]=$(( (~word_dec) & 0xFFFFFFFF ))
done

{
  printf '# CONTROL GRAPH NEGATIVE BITBOARD\n'
  printf '# Generated from: %s\n' "$INPUT_FILE"
  printf '# Width bits: %d\n' "$WIDTH_BITS"
  for ((i=0; i<WORDS; i++)); do
    printf 'WORD_%d=0x%08X\n' "$i" "${neg[$i]}"
  done
  printf 'GRID_16x16:\n'
  for ((row=0; row<16; row++)); do
    line=""
    for ((col=0; col<16; col++)); do
      bit=$((row * 16 + col))
      w=$((bit / 32))
      b=$((bit % 32))
      if (( (neg[$w] >> b) & 1 )); then
        line+="#"
      else
        line+="."
      fi
    done
    printf '%s\n' "$line"
  done
} > "$NEGATIVE_FILE"

emit_board_from_edges "$OVERLAY_FILE" "$OVERLAY_OUT_FILE" "CONTROL GRAPH AEGEAN OVERLAY BITBOARD"

echo "INFO: control graph golden -> $GOLDEN_FILE"
echo "INFO: control graph negative -> $NEGATIVE_FILE"
echo "INFO: control graph overlay -> $OVERLAY_OUT_FILE"
