"""
Import vendor transaction data from Excel sheets to MariaDB vendor_transactions table.
This script processes multiple Excel files from a folder, automatically detecting columns.

All database connection settings are read from environment variables:
- DB_HOST (default: localhost)
- DB_PORT (default: 3306)
- DB_NAME (default: farmers_market_db)
- DB_USER (required)
- DB_PASSWORD (required)

Requirements:
- pandas
- openpyxl
- mysql-connector-python

Setup:
    # Copy and configure environment file
    cp .env.example .env
    nano .env  # Edit with your credentials
    
    # Load environment variables
    source .env
    
Usage:
    # Import all Excel files from a folder
    python import_transactions.py /path/to/folder
    
    # Import a single file
    python import_transactions.py /path/to/file.xlsx
    
    # Dry run (test without committing)
    python import_transactions.py /path/to/folder --dry-run
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime
from db_utilities import (
    connect_to_database,
    close_database_connection,
    clean_numeric_field,
    clean_string_field,
    generate_uuid_bytes,
    get_vendor_id_by_name,
    validate_required_fields,
    safe_commit,
    print_summary
)
import pandas as pd
import openpyxl


class TransactionImporter:
    """Import vendor transaction data from Excel files to MariaDB database."""
    
    # Possible column name variations for each field
    COLUMN_MAPPINGS = {
        'vendor_name': ['Vendor Name', 'Vendor', 'vendor'],
        'present': ['Present?', 'Present', 'present'],
        'snap': ['SNAP Voucher', 'SNAP', 'snap'],
        'dufb': ['DUFB', 'dufb'],
        'wdfm_tokens': ['WDFM Tokens', 'WDFM', 'Tokens', 'wdfm'],
        'voucher': ['Voucher', 'voucher', 'BSA'],
        'reimbursement_due': ['Reimb. Due', 'Reimbursement Due', 'Reimbursement', 'reimb'],
        'reported_sales': ['Reported Sales', 'Sales', 'reported_sales'],
        'est_produce_sales': ['FMPP Est', 'Est Produce', 'Produce Sales', 'est_produce'],
        'est_num_transactions': ['Est # of', 'Est Transactions', 'Transactions', 'est_trans']
    }
    
    # Required fields
    REQUIRED_FIELDS = ['vendor_name', 'market_date']
    
    def __init__(self, db_config):
        """
        Initialize the importer with database configuration.
        
        Args:
            db_config (dict): Database connection parameters
        """
        self.db_config = db_config
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Establish database connection."""
        self.conn, self.cursor = connect_to_database(self.db_config)
    
    def disconnect(self):
        """Close database connection."""
        close_database_connection(self.conn, self.cursor)
    
    def find_header_row(self, ws):
        """
        Find the row containing column headers.
        
        Args:
            ws: openpyxl worksheet
            
        Returns:
            int or None: Row number (1-indexed) of headers
        """
        # Look for "Vendor Name" in first 15 rows
        for row_num in range(1, 16):
            for col_num in range(5):  # Check first 5 columns
                cell_value = ws.cell(row_num, col_num + 1).value
                if cell_value and 'Vendor Name' in str(cell_value):
                    return row_num
        
        return None
    
    def map_columns(self, df_columns):
        """
        Map Excel column names to database field names.
        
        Args:
            df_columns (list): List of column names from Excel
            
        Returns:
            dict: Mapping of db_field -> excel_column_name
        """
        mapping = {}
        
        for db_field, possible_names in self.COLUMN_MAPPINGS.items():
            for col_name in df_columns:
                if col_name in possible_names:
                    mapping[db_field] = col_name
                    break
        
        return mapping
    
    def extract_market_date_from_filename(self, filename):
        """
        Extract date from filename.
        
        Expected format: M_D_YYYY (e.g., "1_3_2026 Saturday Trans Report.xlsx")
        Also supports: M-D-YYYY, MM_DD_YYYY, YYYY_MM_DD
        
        Args:
            filename (str): Filename to parse
            
        Returns:
            datetime.date or None
        """
        import re
        
        # Primary pattern: M_D_YYYY or MM_DD_YYYY (with or without leading zeros)
        # Examples: 1_3_2026, 01_03_2026, 12_25_2026
        pattern = r'(\d{1,2})[_-](\d{1,2})[_-](\d{4})'
        match = re.search(pattern, filename)
        
        if match:
            month, day, year = match.groups()
            try:
                return datetime(int(year), int(month), int(day)).date()
            except (ValueError, IndexError):
                pass
        
        # Fallback: Try YYYY_MM_DD format
        pattern2 = r'(\d{4})[_-](\d{1,2})[_-](\d{1,2})'
        match2 = re.search(pattern2, filename)
        
        if match2:
            year, month, day = match2.groups()
            try:
                return datetime(int(year), int(month), int(day)).date()
            except (ValueError, IndexError):
                pass
        
        return None
    
    def prepare_transaction_data(self, file_path):
        """
        Extract transaction data from an Excel file.
        
        Args:
            file_path (str): Path to Excel file
            
        Returns:
            list: List of transaction dictionaries
        """
        print(f"\n{'='*70}")
        print(f"Processing: {Path(file_path).name}")
        print(f"{'='*70}")
        
        # Load workbook
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active
        
        # Extract market date from filename
        market_date = self.extract_market_date_from_filename(Path(file_path).name)
        
        if not market_date:
            print(f"⚠ Warning: Could not extract date from filename")
            print(f"  Expected format: M_D_YYYY (e.g., '1_3_2026 Saturday Trans Report.xlsx')")
            print(f"  Skipping file: {Path(file_path).name}")
            return []
        
        print(f"✓ Market Date: {market_date}")
        
        # Find header row
        header_row = self.find_header_row(ws)
        if not header_row:
            print(f"⚠ Warning: Could not find header row with 'Vendor Name'")
            print(f"  Skipping file: {Path(file_path).name}")
            return []
        
        print(f"✓ Header row found at row {header_row}")
        
        # Load data starting from header row
        df = pd.read_excel(file_path, header=header_row - 1)
        
        # Map columns
        column_map = self.map_columns(df.columns.tolist())
        print(f"✓ Mapped {len(column_map)} columns:")
        for db_field, excel_col in column_map.items():
            print(f"  {db_field} <- '{excel_col}'")
        
        if 'vendor_name' not in column_map:
            print(f"⚠ Warning: No vendor name column found")
            return []
        
        # Process rows
        transactions = []
        vendor_not_found = []
        
        for idx, row in df.iterrows():
            vendor_name = clean_string_field(row.get(column_map.get('vendor_name')))
            
            # Stop at TOTAL row
            if vendor_name and 'TOTAL' in vendor_name.upper():
                print(f"✓ Reached TOTAL row at row {idx + header_row + 1}, stopping")
                break
            
            # Skip empty rows
            if not vendor_name:
                continue
            
            # Look up vendor ID
            vendor_id = get_vendor_id_by_name(self.cursor, vendor_name)
            
            if not vendor_id:
                if vendor_name not in vendor_not_found:
                    vendor_not_found.append(vendor_name)
                continue
            
            # Extract present status
            present_val = None
            if 'present' in column_map:
                present_raw = clean_string_field(row.get(column_map['present']))
                if present_raw:
                    present_val = 1 if present_raw.upper() in ['Y', 'YES', 'X', '1'] else 0
            
            # Build transaction data
            transaction_data = {
                'id': generate_uuid_bytes(),
                'vendor_id': vendor_id,
                'vendor_name': vendor_name,
                'market_date': market_date,
                'present': present_val,
                'snap': clean_numeric_field(row.get(column_map.get('snap')), 'float'),
                'dufb': clean_numeric_field(row.get(column_map.get('dufb')), 'float'),
                'wdfm_tokens': clean_numeric_field(row.get(column_map.get('wdfm_tokens')), 'float'),
                'voucher': clean_numeric_field(row.get(column_map.get('voucher')), 'float'),
                'reimbursement_due': clean_numeric_field(row.get(column_map.get('reimbursement_due')), 'float'),
                'reported_sales': clean_numeric_field(row.get(column_map.get('reported_sales')), 'float'),
                'est_produce_sales': clean_numeric_field(row.get(column_map.get('est_produce_sales')), 'float'),
                'est_num_transactions': clean_numeric_field(row.get(column_map.get('est_num_transactions')), 'bigint')
            }
            
            # Validate required fields
            is_valid, missing = validate_required_fields(
                transaction_data,
                self.REQUIRED_FIELDS
            )
            
            if not is_valid:
                continue
            
            transactions.append(transaction_data)
        
        if vendor_not_found:
            print(f"\n⚠ {len(vendor_not_found)} vendor(s) not found in database:")
            for vendor in vendor_not_found:
                print(f"  - {vendor}")
        
        print(f"\n✓ Prepared {len(transactions)} transaction records")
        return transactions
    
    def insert_transaction(self, transaction_data):
        """
        Insert a single transaction record into database.
        
        Args:
            transaction_data (dict): Transaction data to insert
            
        Returns:
            bool: True if inserted, False otherwise
        """
        insert_query = """
            INSERT INTO vendor_transactions (
                id, vendor_id, vendor_name, market_date, present,
                snap, dufb, wdfm_tokens, voucher, reimbursement_due,
                reported_sales, est_produce_sales, est_num_transactions
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        values = (
            transaction_data['id'],
            transaction_data['vendor_id'],
            transaction_data['vendor_name'],
            transaction_data['market_date'],
            transaction_data['present'],
            transaction_data['snap'],
            transaction_data['dufb'],
            transaction_data['wdfm_tokens'],
            transaction_data['voucher'],
            transaction_data['reimbursement_due'],
            transaction_data['reported_sales'],
            transaction_data['est_produce_sales'],
            transaction_data['est_num_transactions']
        )
        
        try:
            self.cursor.execute(insert_query, values)
            return True
        except Exception as err:
            print(f"✗ Error inserting transaction for '{transaction_data['vendor_name']}': {err}")
            return False
    
    def import_from_folder(self, folder_path, dry_run=False):
        """
        Import transactions from all Excel files in a folder.
        
        Args:
            folder_path (str): Path to folder containing Excel files
            dry_run (bool): If True, don't commit changes
        """
        folder = Path(folder_path)
        
        if not folder.is_dir():
            print(f"✗ Error: {folder_path} is not a directory")
            return
        
        # Find all Excel files
        excel_files = list(folder.glob('*.xlsx')) + list(folder.glob('*.xls'))
        excel_files = [f for f in excel_files if not f.name.startswith('~')]  # Skip temp files
        
        if not excel_files:
            print(f"✗ No Excel files found in {folder_path}")
            return
        
        print(f"Found {len(excel_files)} Excel file(s) to process")
        
        # Connect to database
        self.connect()
        
        # Process each file
        total_inserted = 0
        total_errors = 0
        files_processed = 0
        
        for file_path in sorted(excel_files):
            try:
                transactions = self.prepare_transaction_data(str(file_path))
                
                if not transactions:
                    continue
                
                # Import transactions
                inserted = 0
                errors = 0
                
                for transaction_data in transactions:
                    if self.insert_transaction(transaction_data):
                        inserted += 1
                    else:
                        errors += 1
                
                total_inserted += inserted
                total_errors += errors
                files_processed += 1
                
                print(f"  ✓ Inserted {inserted} transactions, {errors} errors")
                
            except Exception as e:
                print(f"✗ Error processing {file_path.name}: {e}")
                continue
        
        # Commit or rollback
        safe_commit(self.conn, dry_run)
        
        # Summary
        stats = {
            'Files processed': files_processed,
            'Files found': len(excel_files),
            'Total transactions inserted': total_inserted,
            'Total errors': total_errors
        }
        print_summary('Import Summary', stats)
        
        # Disconnect
        self.disconnect()
    
    def import_single_file(self, file_path, dry_run=False):
        """
        Import transactions from a single Excel file.
        
        Args:
            file_path (str): Path to Excel file
            dry_run (bool): If True, don't commit changes
        """
        # Connect to database
        self.connect()
        
        # Process file
        transactions = self.prepare_transaction_data(file_path)
        
        if not transactions:
            print("✗ No valid transaction records to import")
            self.disconnect()
            return
        
        # Import transactions
        inserted = 0
        errors = 0
        
        print("\nImporting transactions...")
        for transaction_data in transactions:
            if self.insert_transaction(transaction_data):
                inserted += 1
            else:
                errors += 1
        
        # Commit or rollback
        safe_commit(self.conn, dry_run)
        
        # Summary
        stats = {
            'Total transactions': len(transactions),
            'Successfully inserted': inserted,
            'Errors': errors
        }
        print_summary('Import Summary', stats)
        
        # Disconnect
        self.disconnect()


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description='Import vendor transaction data from Excel files to MariaDB'
    )
    parser.add_argument(
        'path',
        help='Path to Excel file or folder containing Excel files'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Test run without committing changes'
    )
    
    args = parser.parse_args()
    
    # Get database configuration from environment variables
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = int(os.getenv('DB_PORT', '3306'))
    db_name = os.getenv('DB_NAME', 'farmers_market_db')
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    
    # Validate required environment variables
    if not db_user:
        print("✗ Error: DB_USER environment variable is required")
        sys.exit(1)
    if not db_password:
        print("✗ Error: DB_PASSWORD environment variable is required")
        sys.exit(1)
    
    # Database configuration
    db_config = {
        'host': db_host,
        'port': db_port,
        'database': db_name,
        'user': db_user,
        'password': db_password,
        'charset': 'utf8mb4'
    }
    
    print(f"Connecting to database: {db_name} at {db_host}:{db_port} as {db_user}")
    
    # Create importer
    importer = TransactionImporter(db_config)
    
    # Check if path is file or folder
    path = Path(args.path)
    
    if path.is_file():
        importer.import_single_file(str(path), dry_run=args.dry_run)
    elif path.is_dir():
        importer.import_from_folder(str(path), dry_run=args.dry_run)
    else:
        print(f"✗ Error: {args.path} is not a valid file or directory")
        sys.exit(1)


if __name__ == '__main__':
    main()
