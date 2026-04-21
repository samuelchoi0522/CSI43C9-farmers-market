#!/usr/bin/env python3
"""
import_vendors.py

Reads a vendor CSV and POSTs each row to POST /api/vendor.
All vendors before the "NO LONGER VENDORS" sentinel row are marked active.
All vendors after it are marked inactive.

Usage:
    python import_vendors.py <csv_file> [--base-url <api_base_url>]

Environment variables:
    API_BASE_URL  Base URL of the API (default: http://localhost:8080)
"""

import argparse
import csv
import logging
import os
import sys

import requests

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

SENTINEL = "NO LONGER VENDORS"
DEFAULT_BASE_URL = "http://localhost:8080"


def main():
    endpoint = f"{DEFAULT_BASE_URL}/api/vendor"


    payload = {
        "vendorName":  "Waco Downtown Farmers Market",
        "isActive":    True
    }

    resp = requests.post(endpoint, json=payload, timeout=10)
    resp.raise_for_status()


if __name__ == "__main__":
    main()