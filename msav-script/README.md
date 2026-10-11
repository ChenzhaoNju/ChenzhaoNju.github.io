# SSRS · MSAV-Script-100K

Project page for **Structured Stateful Relational Scripts with a High-Quality Dataset for Multi-Shot Audio-Visual Video Generation**.

**Website:** https://chenzhaonju.github.io/msav-script/

**Dataset:** https://huggingface.co/datasets/shenlehan/MSAV-Script-100K

Authors: Chen Zhao*, Lehan Shen*, Qilong Huang, Hongyu Li, Zhuoliang Kang, Xiaoming Wei, Jian Yang, and Ying Tai†. Nanjing University and Meituan. * Equal contribution; † corresponding author.

## Contents

- The supplied manuscript PDF and two extracted manuscript figures.
- Five selected multi-model examples (SSRS SFT, LTX-2.3, ShotStream, and JavisGPT).
- Five matched Dense SFT / SSRS SFT examples.
- Thirty MP4 videos with their original encoded video and audio, plus exact generation prompts. Only MP4 container metadata was moved to the front for faster playback; no audio or video transcoding was performed.
- A conceptual, interactive three-shot representation example adapted from Figure 4.
- Tables 1–3 reproduced from the supplied manuscript.

`media-manifest.json` records hashes, sizes, durations, and stream metadata. `cases.json` maps each example to its media and generation prompt.

The qualitative cases are selected illustrations, not random samples or estimates of full-set performance. The interactive diagram is an illustrative representation example, not a generated output. Quantitative results and dataset statistics are reported as given in the manuscript. No conference acceptance or public training-code release is asserted.

## Maintenance

This is a buildless static website. Edit `index.html`, `styles.css`, `site.js`, and `cases.json`; commit to `main`. The existing repository's GitHub Pages deployment serves the `msav-script/` directory.

The BibTeX entry deliberately omits a venue, year, and arXiv identifier until definitive publication metadata are available.

The design uses an original implementation, drawing organizational inspiration from academic project pages such as [Nerfies](https://nerfies.github.io/).
