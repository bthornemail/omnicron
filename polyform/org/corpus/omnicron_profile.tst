================================================================================
Omnicron.1 - Higher-level control-surface profile
================================================================================
#+TITLE: Omnicron Profile
#+OMNITRON_MODE: control_plus_aegean_overlay
#+BARCODE_TRINITY: aztec,maxicode,beecode

* OMICRON GNOMON FRAME :aegean:barcode:
:PROPERTIES:
:LUT_WIDTH: 5
:HEADER_BITS: 8
:END:

#+begin_src logic
barcode_trinity_mapping(maxicode, texture_object).
barcode_trinity_mapping(aztec_code, vertex_object).
barcode_trinity_mapping(beecode, query_object).
#+end_src

- [ ] parse frame
- [x] emit bitboard
--------------------------------------------------------------------------------

(document
  body: (body
    directive: (directive
      name: (expr)
      value: (value
        (expr)
        (expr)))
    directive: (directive
      name: (expr)
      value: (value
        (expr)))
    directive: (directive
      name: (expr)
      value: (value
        (expr))))
  subsection: (section
    headline: (headline
      stars: (stars)
      item: (item
        (expr)
        (expr)
        (expr))
      tags: (tag_list
        tag: (tag)
        tag: (tag)))
    property_drawer: (property_drawer
      (property
        name: (expr)
        value: (value
          (expr)))
      (property
        name: (expr)
        value: (value
          (expr))))
    body: (body
      (block
        name: (expr)
        parameter: (expr)
        contents: (contents
          (expr)
          (expr)
          (expr)
          (expr)
          (expr)
          (expr))
        end_name: (expr))
      (list
        (listitem
          bullet: (bullet)
          checkbox: (checkbox)
          contents: (paragraph
            (expr)
            (expr)))
        (listitem
          bullet: (bullet)
          checkbox: (checkbox
            status: (expr))
          contents: (paragraph
            (expr)
            (expr)))))))
