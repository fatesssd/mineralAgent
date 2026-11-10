# Source baseline

- Repository: https://github.com/icey1287/SuperMew
- Upstream branch: main
- Baseline commit: e2ebabe81e066e0498bdb58000942ef5199d338c
- Upstream commit date: 2026-09-07 +08:00
- Local development branch: feat/mineral-assistant-ui
- The initial mainline checkout was complete. This edition deliberately removes unsupported frontend modules while retaining the backend; it is not a sparse checkout or teaching app.
- Formal application: API + indexing worker + evaluation worker via `python -m backend.launcher`.
- Windows cannot satisfy the upstream Skill registry secure file-opening contract; use the outer workspace Linux CPU container deployment.
- Local source adaptation: frontend bundle-size gate converts file URLs with `fileURLToPath` and normalizes relative path separators for Windows.
- Original pyproject.toml and uv.lock are unchanged. The outer container requirements retain upstream hashes while selecting the same-version official PyTorch CPU wheel and omitting its unused CUDA-only dependencies.

This edition customizes the frontend as MineralAgent, retains RAG evaluation, and removes unsupported UI modules while preserving backend interfaces. Private documents, model files and local credentials are excluded from the repository.
