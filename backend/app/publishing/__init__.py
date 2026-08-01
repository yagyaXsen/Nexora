"""Nexora Opportunity Publishing Pipeline.

Loads the AI-verified/enriched dataset (JSON today, Postgres/Supabase later),
validates it, and exposes a typed, searchable, filterable catalog of live
opportunities. The catalog is deliberately storage-agnostic: swapping the JSON
loader for a database query only changes `loader.load_records()` — the routes
and frontend contract stay identical.
"""
