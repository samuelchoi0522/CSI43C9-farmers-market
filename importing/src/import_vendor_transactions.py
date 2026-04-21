#!/usr/bin/env python3
"""
import_vendor_transactions.py

Reads a CSV file and POSTs all rows as a batch to POST /api/vendor-transaction/batch.
If ANY vendor name cannot be resolved, the entire import is aborted.

Usage:
    python import_vendor_transactions.py <csv_file> [--base-url <api_base_url>]

Environment variables:
    API_BASE_URL  Base URL of the API (default: http://localhost:8080)

Expected CSV columns:
    week, vendor, snap_total, dufb_total, wdfm_total, reported_sales
"""

import argparse
import csv
import logging
import os
import sys
from datetime import datetime

import requests

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

DEFAULT_BASE_URL = "http://localhost:8080"


def fetch_vendors(base_url: str) -> dict[str, tuple[str, str]]:
    """Returns a dict of lowercase vendor name → (UUID string, canonical name)."""
    url = f"{base_url}/api/vendor?page=0&size=200&includeInactive=true"
    log.info("Fetching vendors from %s …", url)
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.error("Failed to fetch vendors: %s", exc)
        sys.exit(1)

    vendors_raw = resp.json()
    if not isinstance(vendors_raw, list):
        vendors_raw = vendors_raw.get("data", [])

    vendor_map = {}
    for v in vendors_raw:
        name: str = v.get("vendorName", "").strip()
        vendor_id: str = v.get("id", "")
        if name and vendor_id:
            vendor_map[name.lower()] = (vendor_id, name)

    log.info("Loaded %d vendors.", len(vendor_map))
    return vendor_map


def parse_date(value: str):
    for fmt in ("%m_%d_%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


def to_float(value: str):
    v = value.strip()
    return float(v) if v else None


def main():
    parser = argparse.ArgumentParser(description="Import vendor transactions via the API.")
    parser.add_argument("csv_file", help="Path to the input CSV file.")
    parser.add_argument("--base-url", default=os.environ.get("API_BASE_URL", DEFAULT_BASE_URL))
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    endpoint = f"{base_url}/api/vendor-transaction/batch"

    try:
        with open(args.csv_file, newline="", encoding="utf-8-sig") as fh:
            rows = list(csv.DictReader(fh))
    except FileNotFoundError:
        log.error("CSV file not found: %s", args.csv_file)
        sys.exit(1)

    log.info("Read %d rows from '%s'.", len(rows), args.csv_file)

    vendor_map = fetch_vendors(base_url)

    # -- Validate all rows before building the payload -----------------------
    unmatched_vendors = set()
    invalid_dates = []
    for i, raw in enumerate(rows, start=2):
        vendor_raw = raw.get("vendor", "").strip()
        if vendor_raw.lower() not in vendor_map:
            unmatched_vendors.add(vendor_raw)
        if parse_date(raw.get("week", "")) is None:
            invalid_dates.append(f"Row {i}: invalid date '{raw.get("week", "")}'.")

    if unmatched_vendors:
        log.error("Aborting — the following vendor names could not be matched:")
        for name in sorted(unmatched_vendors):
            print(name)
            # -- log.error("  - %s", name)

    if invalid_dates:
        log.error("Aborting — the following rows have invalid dates:")
        for err in invalid_dates:
            log.error("  %s", err)

    if unmatched_vendors or invalid_dates:
        sys.exit(1)

    # -- Build batch payload -------------------------------------------------
    payload = []
    for raw in rows:
        vendor_id, canonical_name = vendor_map[raw["vendor"].strip().lower()]
        market_date = parse_date(raw["week"])

        payload.append({
            "vendorId":          vendor_id,
            "vendorName":        canonical_name,
            "marketDate":        market_date.isoformat(),
            "present":           True,
            "snap":              to_float(raw.get("snap_total", "")),
            "dufb":              to_float(raw.get("dufb_total", "")),
            "wdfmTokens":        to_float(raw.get("wdfm_total", "")),
            "voucher":           None,
            "reimbursementDue":  None,
            "reportedSales":     to_float(raw.get("reported_sales", "")),
            "estProduceSales":   None,
            "estNumTransactions": None,
            "customData":        None,
        })

    # -- POST ----------------------------------------------------------------
    log.info("Posting batch of %d transactions to %s …", len(payload), endpoint)
    try:
        resp = requests.post(endpoint, json=payload, timeout=30)
        resp.raise_for_status()
    except requests.HTTPError as exc:
        log.error("Batch POST failed — %s: %s", exc.response.status_code, exc.response.text)
        sys.exit(1)
    except requests.RequestException as exc:
        log.error("Batch POST failed — %s", exc)
        sys.exit(1)

    log.info("Done. Successfully created %d transactions.", len(payload))


if __name__ == "__main__":
    main()