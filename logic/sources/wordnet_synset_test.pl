% Minimal WordNet-style test facts for synset graph construction.
% This file is intentionally parser-safe for the current polylog prototype.

synset(wn_parent_n_1, noun, parent).
synset(wn_ancestor_n_1, noun, ancestor).
synset(wn_person_n_1, noun, person).
synset(wn_dog_n_1, noun, dog).
synset(wn_canine_n_2, noun, canine).

lemma(wn_parent_n_1, parent).
lemma(wn_ancestor_n_1, ancestor).
lemma(wn_person_n_1, person).
lemma(wn_dog_n_1, dog).
lemma(wn_canine_n_2, canine).

hypernym(wn_parent_n_1, wn_ancestor_n_1).
hypernym(wn_ancestor_n_1, wn_person_n_1).
hypernym(wn_dog_n_1, wn_canine_n_2).
hypernym(wn_canine_n_2, wn_person_n_1).
