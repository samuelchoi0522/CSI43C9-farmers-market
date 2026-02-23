"""
Import vendor data from Excel sheet to MariaDB vendors table.
This script dynamically handles Excel sheets with varying row counts.

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
    # Run import
    python import_vendors.py <excel_file>
    
    # Dry run (test without committing)
    python import_vendors.py <excel_file> --dry-run
    
    # Specify sheet name
    python import_vendors.py <excel_file> --sheet-name "2025 Vendors"
"""

import sys
import argparse
import os
from db_utilities import (
    connect_to_database,
    close_database_connection,
    load_excel_file,
    clean_boolean_field,
    clean_numeric_field,
    clean_string_field,
    generate_uuid_bytes,
    check_record_exists,
    validate_required_fields,
    safe_commit,
    print_summary
)


class VendorImporter:
    """Import vendor data from Excel to MariaDB database."""
    
    # Column mapping from Excel to database
    COLUMN_MAPPING = {
        'Vendor': 'vendor',
        'Point Person': 'point_person',
        'Email': 'email',
        'Location': 'location',
        'Miles': 'miles',
        'Product': 'products',
        'Farmer': 'is_farmer',
        'Produce': 'is_produce',
        'WomanOwn': 'woman_owned',
        'BIPOCown': 'bipoc_owned',
        'Veteran': 'veteran_owned'
    }
    
    # Required fields that must be present
    REQUIRED_FIELDS = ['vendor', 'point_person', 'email']
    
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
    
    def prepare_vendor_data(self, df):
        """
        Transform DataFrame to match database schema.
        
        Automatically detects the "NO LONGER VENDORS" section and marks
        those vendors as inactive (is_active = 0).
        
        Args:
            df (pandas.DataFrame): Raw Excel data
            
        Returns:
            list: List of dictionaries ready for database insertion
        """
        vendors = []
        inactive_section_started = False
        
        for idx, row in df.iterrows():
            vendor_name = clean_string_field(row.get('Vendor'))
            
            # Skip empty rows
            if not vendor_name:
                continue
            
            vendor_upper = vendor_name.upper()
            
            # Check if we've hit the "NO LONGER VENDORS" section marker
            if 'NO LONGER VENDORS' in vendor_upper or 'NO LONGER' in vendor_upper:
                inactive_section_started = True
                print(f"⚠ Found 'NO LONGER VENDORS' marker at row {idx + 2}")
                print("  All vendors below this will be marked as inactive (is_active = 0)")
                continue  # Skip this header row
            
            # Determine if vendor is active or inactive
            is_active = 0 if inactive_section_started else 1
            
            vendor_data = {
                'id': generate_uuid_bytes(),  # Auto-generate UUID
                'vendor': vendor_name,
                'point_person': clean_string_field(row.get('Point Person')),
                'email': clean_string_field(row.get('Email')),
                'location': clean_string_field(row.get('Location')),
                'miles': clean_numeric_field(row.get('Miles'), 'int'),
                'products': clean_string_field(row.get('Product')),
                'is_farmer': clean_boolean_field(row.get('Farmer')),
                'is_produce': clean_boolean_field(row.get('Produce')),
                'woman_owned': clean_boolean_field(row.get('WomanOwn')),
                'bipoc_owned': clean_boolean_field(row.get('BIPOCown')),
                'veteran_owned': clean_boolean_field(row.get('Veteran')),
                'is_active': is_active
            }
            
            # Validate required fields
            is_valid, missing = validate_required_fields(
                vendor_data, 
                self.REQUIRED_FIELDS
            )
            
            if not is_valid:
                print(f"⚠ Warning: Skipping row {idx + 2} ({vendor_name}) - missing fields: {', '.join(missing)}")
                continue
            
            vendors.append(vendor_data)
        
        # Count active vs inactive
        active_count = sum(1 for v in vendors if v['is_active'] == 1)
        inactive_count = sum(1 for v in vendors if v['is_active'] == 0)
        
        print(f"\n✓ Prepared {len(vendors)} vendor records for import")
        print(f"  Active vendors: {active_count}")
        print(f"  Inactive vendors: {inactive_count}")
        
        return vendors
    
    def insert_vendor(self, vendor_data, skip_duplicates=True):
        """
        Insert a single vendor record into database.
        
        Args:
            vendor_data (dict): Vendor data to insert
            skip_duplicates (bool): If True, skip existing vendors
            
        Returns:
            bool: True if inserted, False if skipped
        """
        # Check for duplicates
        if skip_duplicates and check_record_exists(
            self.cursor, 
            'vendors', 
            'vendor', 
            vendor_data['vendor']
        ):
            return False
        
        insert_query = """
            INSERT INTO vendors (
                id, vendor, point_person, email, location, miles, products,
                is_farmer, is_produce, woman_owned, bipoc_owned, veteran_owned, is_active
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        values = (
            vendor_data['id'],
            vendor_data['vendor'],
            vendor_data['point_person'],
            vendor_data['email'],
            vendor_data['location'],
            vendor_data['miles'],
            vendor_data['products'],
            vendor_data['is_farmer'],
            vendor_data['is_produce'],
            vendor_data['woman_owned'],
            vendor_data['bipoc_owned'],
            vendor_data['veteran_owned'],
            vendor_data['is_active']
        )
        
        try:
            self.cursor.execute(insert_query, values)
            return True
        except Exception as err:
            print(f"✗ Error inserting vendor '{vendor_data['vendor']}': {err}")
            return False
    
    def import_vendors(self, file_path, sheet_name=None, skip_duplicates=True, dry_run=False):
        """
        Main import process.
        
        Args:
            file_path (str): Path to Excel file
            sheet_name (str, optional): Specific sheet to import
            skip_duplicates (bool): Skip vendors that already exist
            dry_run (bool): If True, don't commit changes to database
        """
        print("=" * 60)
        print("VENDOR IMPORT PROCESS")
        print("=" * 60)
        
        # Load Excel data
        df = load_excel_file(file_path, sheet_name)
        
        # Prepare data
        vendors = self.prepare_vendor_data(df)
        
        if not vendors:
            print("✗ No valid vendor records to import")
            return
        
        # Connect to database
        self.connect()
        
        # Import vendors
        inserted_count = 0
        skipped_count = 0
        error_count = 0
        
        print("\nImporting vendors...")
        for vendor_data in vendors:
            result = self.insert_vendor(vendor_data, skip_duplicates)
            
            # Status indicator
            status = "active" if vendor_data['is_active'] == 1 else "inactive"
            
            if result:
                inserted_count += 1
                print(f"  ✓ Inserted: {vendor_data['vendor']} ({status})")
            elif skip_duplicates and check_record_exists(
                self.cursor, 
                'vendors', 
                'vendor', 
                vendor_data['vendor']
            ):
                skipped_count += 1
                print(f"  ⊘ Skipped (duplicate): {vendor_data['vendor']}")
            else:
                error_count += 1
        
        # Commit or rollback
        safe_commit(self.conn, dry_run)
        
        # Summary
        stats = {
            'Total records processed': len(vendors),
            'Successfully inserted': inserted_count,
            'Skipped (duplicates)': skipped_count,
            'Errors': error_count
        }
        print_summary('Import Summary', stats)
        
        # Disconnect
        self.disconnect()


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description='Import vendor data from Excel to MariaDB'
    )
    parser.add_argument(
        'excel_file',
        help='Path to Excel file'
    )
    parser.add_argument(
        '--sheet-name',
        help='Specific sheet name to import (optional)',
        default=None
    )
    parser.add_argument(
        '--allow-duplicates',
        action='store_true',
        help='Allow duplicate vendor entries'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Test run without committing changes'
    )
    
    args = parser.parse_args()
    
    # Get all database configuration from environment variables
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
    
    # Create importer and run
    importer = VendorImporter(db_config)
    importer.import_vendors(
        file_path=args.excel_file,
        sheet_name=args.sheet_name,
        skip_duplicates=not args.allow_duplicates,
        dry_run=args.dry_run
    )


if __name__ == '__main__':
    main()
