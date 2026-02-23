"""
Database utilities for farmers market data import/export operations.

This module provides reusable functions for:
- Database connections
- Data cleaning and validation
- UUID handling
- Common database operations

Can be imported by other scripts for consistent data handling.
"""

import pandas as pd
import mysql.connector
import uuid
import sys
from typing import Any, Optional, Dict, List


class DatabaseConnection:
    """Context manager for database connections."""
    
    def __init__(self, db_config: Dict[str, Any]):
        """
        Initialize database connection context manager.
        
        Args:
            db_config (dict): Database configuration parameters
        """
        self.db_config = db_config
        self.conn = None
        self.cursor = None
    
    def __enter__(self):
        """Establish database connection."""
        try:
            self.conn = mysql.connector.connect(**self.db_config)
            self.cursor = self.conn.cursor()
            return self.conn, self.cursor
        except mysql.connector.Error as err:
            print(f"✗ Database connection error: {err}")
            sys.exit(1)
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            if exc_type is None:
                self.conn.commit()
            else:
                self.conn.rollback()
            self.conn.close()
        return False


def connect_to_database(db_config: Dict[str, Any]) -> tuple:
    """
    Create a database connection and cursor.
    
    Args:
        db_config (dict): Database configuration parameters
            - host: Database host
            - port: Database port
            - database: Database name
            - user: Database user
            - password: Database password
            - charset: Character set (optional, default: utf8mb4)
    
    Returns:
        tuple: (connection, cursor) objects
        
    Raises:
        SystemExit: If connection fails
    """
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("✓ Connected to database successfully")
        return conn, cursor
    except mysql.connector.Error as err:
        print(f"✗ Database connection error: {err}")
        sys.exit(1)


def close_database_connection(conn, cursor):
    """
    Safely close database connection and cursor.
    
    Args:
        conn: Database connection object
        cursor: Database cursor object
    """
    if cursor:
        cursor.close()
    if conn:
        conn.close()
        print("✓ Database connection closed")


def load_excel_file(file_path: str, sheet_name: Optional[str] = None) -> pd.DataFrame:
    """
    Load data from Excel file using pandas and openpyxl.
    
    Args:
        file_path (str): Path to Excel file
        sheet_name (str, optional): Specific sheet name to load.
                                   If None, loads first sheet.
    
    Returns:
        pandas.DataFrame: Loaded data
        
    Raises:
        SystemExit: If file cannot be loaded
    """
    try:
        if sheet_name:
            df = pd.read_excel(file_path, sheet_name=sheet_name, engine='openpyxl')
        else:
            df = pd.read_excel(file_path, engine='openpyxl')
        
        print(f"✓ Loaded Excel file: {file_path}")
        print(f"  Rows: {len(df)}, Columns: {len(df.columns)}")
        return df
    except Exception as e:
        print(f"✗ Error loading Excel file: {e}")
        sys.exit(1)


def clean_boolean_field(value: Any) -> int:
    """
    Convert Excel boolean markers to database boolean (0/1).
    
    Recognizes common truthy markers: 'x', 'X', 'yes', 'y', 'true', '1'
    Everything else (including NaN/None) is treated as False (0)
    
    Args:
        value: Value from Excel (could be 'x', 'X', NaN, etc.)
        
    Returns:
        int: 1 if truthy marker found, 0 otherwise
        
    Examples:
        >>> clean_boolean_field('x')
        1
        >>> clean_boolean_field('X')
        1
        >>> clean_boolean_field('yes')
        1
        >>> clean_boolean_field(None)
        0
        >>> clean_boolean_field('')
        0
    """
    if pd.isna(value):
        return 0
    
    value_str = str(value).strip().lower()
    # Check for common truthy markers
    if value_str in ['x', 'yes', 'y', 'true', '1']:
        return 1
    return 0


def clean_numeric_field(value: Any, field_type: str = 'int') -> Optional[Any]:
    """
    Convert numeric fields, handling NaN and non-numeric values.
    
    Args:
        value: Value from Excel
        field_type (str): Type of numeric field ('int', 'float', 'bigint')
    
    Returns:
        int/float or None: Cleaned numeric value
        
    Examples:
        >>> clean_numeric_field(42)
        42
        >>> clean_numeric_field('42')
        42
        >>> clean_numeric_field(42.5, 'float')
        42.5
        >>> clean_numeric_field(None)
        None
        >>> clean_numeric_field('invalid')
        None
    """
    if pd.isna(value):
        return None
    
    try:
        if field_type in ['int', 'bigint']:
            return int(value)
        elif field_type == 'float':
            return float(value)
        else:
            return int(value)  # Default to int
    except (ValueError, TypeError):
        return None


def clean_string_field(value: Any) -> Optional[str]:
    """
    Clean string fields, handling NaN values and trimming whitespace.
    
    Args:
        value: Value from Excel
        
    Returns:
        str or None: Cleaned string value
        
    Examples:
        >>> clean_string_field('  hello  ')
        'hello'
        >>> clean_string_field(None)
        None
        >>> clean_string_field(123)
        '123'
    """
    if pd.isna(value):
        return None
    return str(value).strip()


def clean_date_field(value: Any) -> Optional[str]:
    """
    Clean date fields and convert to MySQL date format (YYYY-MM-DD).
    
    Args:
        value: Value from Excel (could be datetime, string, etc.)
        
    Returns:
        str or None: Date in YYYY-MM-DD format, or None if invalid
        
    Examples:
        >>> clean_date_field('2024-01-15')
        '2024-01-15'
        >>> clean_date_field(None)
        None
    """
    if pd.isna(value):
        return None
    
    try:
        # Try to convert to datetime if it's not already
        if isinstance(value, str):
            date_obj = pd.to_datetime(value)
        else:
            date_obj = pd.Timestamp(value)
        
        return date_obj.strftime('%Y-%m-%d')
    except (ValueError, TypeError):
        return None


def generate_uuid_bytes() -> bytes:
    """
    Generate a UUID and convert to bytes for MariaDB binary(16) fields.
    
    Returns:
        bytes: 16-byte UUID
        
    Examples:
        >>> uid = generate_uuid_bytes()
        >>> len(uid)
        16
        >>> isinstance(uid, bytes)
        True
    """
    return uuid.uuid4().bytes


def uuid_bytes_to_string(uuid_bytes: bytes) -> str:
    """
    Convert UUID bytes back to standard UUID string format.
    
    Args:
        uuid_bytes (bytes): 16-byte UUID from database
        
    Returns:
        str: UUID string in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        
    Examples:
        >>> uid_bytes = uuid.uuid4().bytes
        >>> uid_str = uuid_bytes_to_string(uid_bytes)
        >>> len(uid_str)
        36
        >>> uid_str.count('-')
        4
    """
    return str(uuid.UUID(bytes=uuid_bytes))


def check_record_exists(cursor, table: str, field: str, value: Any) -> bool:
    """
    Check if a record exists in the database.
    
    Args:
        cursor: Database cursor
        table (str): Table name
        field (str): Field name to check
        value: Value to search for
        
    Returns:
        bool: True if record exists, False otherwise
        
    Examples:
        >>> # Assuming cursor is connected
        >>> check_record_exists(cursor, 'vendors', 'vendor', 'Acme Co')
        True
    """
    query = f"SELECT COUNT(*) FROM {table} WHERE {field} = %s"
    cursor.execute(query, (value,))
    count = cursor.fetchone()[0]
    return count > 0


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> tuple:
    """
    Validate that required fields are present and not empty.
    
    Args:
        data (dict): Data dictionary to validate
        required_fields (list): List of required field names
        
    Returns:
        tuple: (is_valid, missing_fields)
            - is_valid (bool): True if all required fields present
            - missing_fields (list): List of missing field names
            
    Examples:
        >>> data = {'name': 'John', 'email': 'john@example.com'}
        >>> validate_required_fields(data, ['name', 'email'])
        (True, [])
        >>> validate_required_fields(data, ['name', 'email', 'phone'])
        (False, ['phone'])
    """
    missing_fields = []
    
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing_fields.append(field)
    
    is_valid = len(missing_fields) == 0
    return is_valid, missing_fields


def get_vendor_id_by_name(cursor, vendor_name: str) -> Optional[bytes]:
    """
    Retrieve vendor ID (binary UUID) by vendor name.
    
    Args:
        cursor: Database cursor
        vendor_name (str): Name of vendor to look up
        
    Returns:
        bytes or None: Vendor ID as bytes, or None if not found
    """
    query = "SELECT id FROM vendors WHERE vendor = %s"
    cursor.execute(query, (vendor_name,))
    result = cursor.fetchone()
    
    if result:
        return result[0]
    return None


def bulk_insert(cursor, table: str, columns: List[str], data: List[tuple]) -> int:
    """
    Perform bulk insert operation.
    
    Args:
        cursor: Database cursor
        table (str): Table name
        columns (list): List of column names
        data (list): List of tuples containing row data
        
    Returns:
        int: Number of rows inserted
        
    Raises:
        mysql.connector.Error: If insert fails
    """
    if not data:
        return 0
    
    placeholders = ', '.join(['%s'] * len(columns))
    column_str = ', '.join(columns)
    
    query = f"INSERT INTO {table} ({column_str}) VALUES ({placeholders})"
    
    cursor.executemany(query, data)
    return cursor.rowcount


def format_currency(value: Optional[float]) -> str:
    """
    Format numeric value as currency string.
    
    Args:
        value (float or None): Numeric value
        
    Returns:
        str: Formatted currency string
        
    Examples:
        >>> format_currency(1234.56)
        '$1,234.56'
        >>> format_currency(None)
        '$0.00'
    """
    if value is None:
        value = 0.0
    return f"${value:,.2f}"


def print_summary(title: str, stats: Dict[str, Any], width: int = 60):
    """
    Print a formatted summary box with statistics.
    
    Args:
        title (str): Title for the summary
        stats (dict): Dictionary of stat names and values
        width (int): Width of the summary box
        
    Example:
        >>> stats = {'Total': 100, 'Success': 95, 'Failed': 5}
        >>> print_summary('Import Results', stats)
    """
    print("\n" + "=" * width)
    print(title.upper().center(width))
    print("=" * width)
    
    for key, value in stats.items():
        # Right-align numbers, left-align labels
        print(f"{key + ':':<30} {str(value):>29}")
    
    print("=" * width)


def map_dataframe_columns(df: pd.DataFrame, column_mapping: Dict[str, str]) -> pd.DataFrame:
    """
    Rename DataFrame columns according to mapping.
    
    Args:
        df (pd.DataFrame): DataFrame to rename
        column_mapping (dict): Mapping of old column names to new names
        
    Returns:
        pd.DataFrame: DataFrame with renamed columns
        
    Example:
        >>> df = pd.DataFrame({'Old Name': [1, 2], 'Another': [3, 4]})
        >>> mapping = {'Old Name': 'new_name', 'Another': 'other'}
        >>> df_renamed = map_dataframe_columns(df, mapping)
        >>> list(df_renamed.columns)
        ['new_name', 'other']
    """
    # Only rename columns that exist in the DataFrame
    rename_dict = {k: v for k, v in column_mapping.items() if k in df.columns}
    return df.rename(columns=rename_dict)


def safe_commit(conn, dry_run: bool = False) -> bool:
    """
    Safely commit or rollback database transaction.
    
    Args:
        conn: Database connection
        dry_run (bool): If True, rollback instead of commit
        
    Returns:
        bool: True if committed, False if rolled back
    """
    if dry_run:
        conn.rollback()
        print("\n⚠ DRY RUN - No changes committed to database")
        return False
    else:
        conn.commit()
        print("\n✓ Changes committed to database")
        return True


def get_table_info(cursor, table_name: str) -> List[Dict[str, Any]]:
    """
    Get information about table structure.
    
    Args:
        cursor: Database cursor
        table_name (str): Name of table
        
    Returns:
        list: List of dictionaries containing column information
        
    Example:
        >>> info = get_table_info(cursor, 'vendors')
        >>> info[0]['Field']
        'id'
    """
    query = f"DESCRIBE {table_name}"
    cursor.execute(query)
    
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    
    return [dict(zip(columns, row)) for row in rows]


def verify_database_connection(db_config: Dict[str, Any]) -> bool:
    """
    Verify that database connection can be established.
    
    Args:
        db_config (dict): Database configuration
        
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        conn = mysql.connector.connect(**db_config)
        conn.close()
        return True
    except mysql.connector.Error:
        return False
