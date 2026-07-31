# ZeroClaw Upstream Open-Source Contribution Guide

## Panduan Kontribusi Aman & Best Practices ke `zeroclaw-labs/zeroclaw`

Panduan ini menjelaskan cara berkontribusi secara **aman (100% safe)** ke repositori publik `https://github.com/zeroclaw-labs/zeroclaw.git` untuk memperkuat bukti *open-source contribution* pada Solana Bounty Submission ZEGA AI.

---

## 🔒 1. Prinsip Keamanan & Best Practices
1. **Jangan Mengubah Kode Core Rust Milik ZeroClaw Tanpa Perlu:**
   - Gunakan pendekatan *non-breaking & non-destructive*.
   - Cukup tambahkan berkas integrasi baru di folder `docs/integrations/zega-ai.md` atau perbarui tabel ekosistem di `README.md`.
2. **Gunakan Forking Workflow (Workflow Standar GitHub Open Source):**
   - Anda **tidak pernah** melakukan commit langsung ke repo utama `zeroclaw-labs/zeroclaw`.
   - Selalu buat **Fork** ke akun GitHub Anda terlebih dahulu, buat *feature branch*, lalu kirim **Pull Request (PR)**.
3. **Pemeriksaan Isi Commit:**
   - Pastikan tidak ada API key, private key, atau berkas rahasia `.env` yang terbawa.

---

## 🛠️ 2. Langkah-Langkah Eksekusi Kontribusi (Step-by-Step)

### Langkah A: Fork Repositori di GitHub
1. Buka [https://github.com/zeroclaw-labs/zeroclaw](https://github.com/zeroclaw-labs/zeroclaw).
2. Klik tombol **Fork** di pojok kanan atas ke akun GitHub Anda (`siabang35`).

### Langkah B: Clone Fork & Buat Feature Branch
Jalankan di terminal Anda:

```bash
# 1. Clone repositori hasil fork Anda
git clone https://github.com/siabang35/zeroclaw.git /tmp/zeroclaw-upstream-fork
cd /tmp/zeroclaw-upstream-fork

# 2. Buat branch baru khusus untuk integrasi ZEGA AI
git checkout -b feat/add-zega-ai-integration-docs
```

### Langkah C: Tambahkan Berkas Integrasi ZEGA AI
Buat berkas `docs/integrations/zega-ai.md` pada repositori fork tersebut dengan isi:

```markdown
# ZEGA AI × ZeroClaw Integration

ZEGA AI integrates ZeroClaw as a self-hosted Rust AI agent runtime operating on **Keyless Tier 1 Custody** for Solana Pay QR invoicing, real-time RPC signature reconciliation, and human-in-the-loop SOP approval checkpoints.

## Key Technical Features
- **Keyless Tier 1 Custody:** Zero server-side private keys; user wallet client signatures (Phantom/Solflare).
- **Fastify API Proxy:** REST endpoints (`/v1/zeroclaw/status`, `/v1/zeroclaw/solana-rpc`, `/v1/zeroclaw/events`, `/v1/zeroclaw/approve-checkpoint`).
- **Supabase Realtime & RLS:** PostgreSQL persistent ledger (`zeroclaw_solana_settlements` and `zeroclaw_sop_checkpoints`).
- **Prompt Injection Defense:** SOP checkpoints holding suspicious refund requests for admin clearance.

For full implementation details, see [ZEGA AI Monorepo](https://github.com/siabang35/zega.ai).
```

Lalu tambahkan tautan **ZEGA AI** pada `README.md` di bawah daftar **Ecosystem Integrations**:

```markdown
- **[ZEGA AI](https://github.com/siabang35/zega.ai)**: Self-hosted ZeroClaw agent runtime for Solana Pay QR invoicing and SOP refund checkpoints.
```

### Langkah D: Commit & Push ke Fork Anda

```bash
git add docs/integrations/zega-ai.md README.md
git commit -m "docs(integrations): add ZEGA AI ecosystem integration specs and architecture guide"
git push origin feat/add-zega-ai-integration-docs
```

### Langkah E: Open Pull Request (PR) ke Upstream
1. Buka halaman GitHub hasil fork Anda (`https://github.com/siabang35/zeroclaw`).
2. Klik tombol **Compare & pull request**.
3. Berikan judul PR (HARUS menggunakan scope `(integrations)`):
   `docs(integrations): add ZEGA AI enterprise ecosystem integration guide`
4. Deskripsi PR:
   `This PR adds documentation for ZEGA AI's integration of the ZeroClaw Rust agent runtime, featuring Solana Pay QR settlements and SOP approval checkpoints for the Solana Bounty submission.`
5. Klik **Create pull request** (atau **Edit** title pada PR #9564 yang sudah dibuka).

---

## 🏆 3. Hasil & Tautan Submission Bounty
Setelah PR dibuat, Anda akan mendapatkan URL PR publik (misal: `https://github.com/zeroclaw-labs/zeroclaw/pull/42`).

Salin URL PR ini dan cantumkan di deskripsi formulir submission bounty Solana Anda bersama dengan repo ZEGA AI (`siabang35/zega.ai`) dan Video Demo.
