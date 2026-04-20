; Omnicron profile captures for higher-level control-surface authoring.
; This query layer is intentionally conservative: it reuses core grammar nodes
; and tags semantically meaningful org constructs used by the Omnicron docs.

; High-signal directives used as protocol front-matter.
(directive
  name: (expr) @omni.directive.name
  value: (value)? @omni.directive.value
  (#match? @omni.directive.name "^(TITLE|OMNITRON_MODE|OMNICRON_MODE|OMNITRON_PROFILE|BARCODE_TRINITY|AEGEAN_HEADER|FRAMEBUFFER_TARGET|LUT_PROFILE)$")
) @omni.directive

; Headline scopes that usually delimit executable sections.
(headline
  item: (item) @omni.section.name
  tags: (tag_list
    (tag) @omni.section.tag
  )?
) @omni.section

; Source blocks are the main structured payload surface.
(block
  name: (expr) @omni.block.name
  parameter: (expr) @omni.block.parameter
  (contents)? @omni.block.contents
  (#any-of? @omni.block.name "src" "begin_src" "example" "quote")
) @omni.block

; Property drawers become deterministic key-value headers.
(property_drawer
  (property
    name: (expr) @omni.property.name
    (value)? @omni.property.value
  )+
) @omni.property.drawer

; List checkboxes are commonly used as replay checkpoints.
(checkbox) @omni.checkpoint
